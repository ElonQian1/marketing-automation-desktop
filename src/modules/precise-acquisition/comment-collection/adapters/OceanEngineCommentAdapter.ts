/**
 * 巨量引擎Marketing API评论采集适配器
 * 
 * 实现广告内容的评论采集功能
 * 使用巨量引擎Marketing API获取广告计划/创意下的评论
 */

import { CommentCollectionAdapter, CommentCollectionParams, CommentCollectionResult, AdapterStatus } from './CommentCollectionAdapter';
import { Comment, WatchTarget, Platform } from '../../shared/types/core';

/**
 * 巨量引擎API配置
 */
interface OceanEngineAPIConfig {
  app_id: string;
  secret: string;
  access_token?: string;
  refresh_token?: string;
  advertiser_id: string; // 广告主ID
  expires_at?: Date;
}

/**
 * 巨量引擎评论响应格式
 */
interface OceanEngineCommentResponse {
  code: number;
  message: string;
  data: {
    list: Array<{
      comment_id: string;
      content: string;
      create_time: string;
      like_count: number;
      user: {
        user_id: string;
        nickname: string;
      };
      creative_id: string; // 创意ID
      campaign_id: string; // 计划ID
    }>;
    page_info: {
      page: number;
      page_size: number;
      total_number: number;
    };
  };
  request_id: string;
}

/**
 * 巨量引擎评论采集适配器
 */
export class OceanEngineCommentAdapter extends CommentCollectionAdapter {
  
  private config: OceanEngineAPIConfig;
  private rateLimitRemaining: number = 200; // 巨量引擎API限制相对宽松
  private rateLimitResetTime?: Date;
  
  constructor(config: OceanEngineAPIConfig) {
    super(Platform.OCEANENGINE);
    this.config = config;
  }

  /**
   * 获取适配器状态
   */
  async getStatus(): Promise<AdapterStatus> {
    return {
      platform: Platform.OCEANENGINE,
      available: this.isTokenValid(),
      rate_limit_remaining: this.rateLimitRemaining,
      rate_limit_reset_time: this.rateLimitResetTime,
      auth_status: this.getAuthStatus()
    };
  }

  /**
   * 检查目标是否支持
   */
  isTargetSupported(target: WatchTarget): boolean {
    // 只支持巨量引擎平台
    if (target.platform !== Platform.OCEANENGINE) {
      return false;
    }
    
    // 检查是否为广告相关ID（计划ID或创意ID）
    return this.isAdvertisingId(target.platform_id_or_url);
  }

  /**
   * 验证采集权限
   */
  async validatePermissions(target: WatchTarget): Promise<{
    canCollect: boolean;
    reason?: string;
    requiredScopes?: string[];
  }> {
    // 检查token有效性
    if (!this.isTokenValid()) {
      return {
        canCollect: false,
        reason: 'Access token 已过期',
        requiredScopes: ['comment:read']
      };
    }

    // 检查广告主权限
    if (!this.config.advertiser_id) {
      return {
        canCollect: false,
        reason: '缺少广告主ID',
        requiredScopes: ['advertiser:read']
      };
    }

    return {
      canCollect: true,
      requiredScopes: ['comment:read']
    };
  }

  /**
   * 采集评论
   */
  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const { target, limit = 20, since, until } = params;

    // 验证权限
    const permissionCheck = await this.validatePermissions(target);
    if (!permissionCheck.canCollect) {
      throw new Error(`无权限采集评论: ${permissionCheck.reason}`);
    }

    const comments: Comment[] = [];
    let page = 1;
    const pageSize = Math.min(limit, 50); // 巨量引擎单页最多50条

    try {
      while (comments.length < limit) {
        const response = await this.callOceanEngineAPI('/2/tools/comment/get/', {
          advertiser_id: this.config.advertiser_id,
          creative_id: target.platform_id_or_url, // 假设存储的是创意ID
          page,
          page_size: pageSize,
          start_date: since ? this.formatDate(since) : undefined,
          end_date: until ? this.formatDate(until) : undefined
        });

        if (response.code !== 0) {
          throw new Error(`巨量引擎API错误: ${response.message}`);
        }

        const apiComments = response.data.list || [];
        
        if (apiComments.length === 0) {
          break; // 没有更多数据
        }

        for (const apiComment of apiComments) {
          if (comments.length >= limit) break;
          
          const comment = this.standardizeComment(apiComment, target);
          comments.push(comment);
        }

        // 检查是否还有更多页面
        const totalPages = Math.ceil(response.data.page_info.total_number / pageSize);
        if (page >= totalPages) {
          break;
        }

        page++;
        this.updateRateLimitInfo();
      }

      return {
        comments,
        total_count: comments.length,
        next_cursor: page.toString(),
        has_more: false, // 巨量引擎使用分页而非游标
        collected_at: new Date(),
        source_platform: Platform.OCEANENGINE,
        target_id: target.id
      };

    } catch (error) {
      console.error('巨量引擎评论采集失败:', error);
      throw error;
    }
  }

  /**
   * 标准化评论数据
   */
  protected standardizeComment(rawComment: any, target: WatchTarget): Comment {
    return {
      id: this.generateCommentId(rawComment),
      platform: Platform.OCEANENGINE,
      video_id: rawComment.creative_id || target.platform_id_or_url,
      author_id: rawComment.user.user_id,
      content: rawComment.content,
      like_count: rawComment.like_count || 0,
      publish_time: new Date(rawComment.create_time),
      region: undefined, // 巨量引擎通常不提供用户地区信息
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 生成评论唯一ID
   */
  protected generateCommentId(rawComment: any): string {
    return `cmt_oceanengine_${rawComment.comment_id}`;
  }

  /**
   * 调用巨量引擎API
   */
  private async callOceanEngineAPI(endpoint: string, params: any): Promise<OceanEngineCommentResponse> {
    const baseUrl = 'https://ad.oceanengine.com/open_api';
    const url = new URL(endpoint, baseUrl);
    
    // 添加通用参数
    const queryParams = {
      access_token: this.config.access_token,
      ...params
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PreciseAcquisition/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as OceanEngineCommentResponse;
    } catch (error) {
      console.error('巨量引擎API调用失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否为广告ID
   */
  private isAdvertisingId(id: string): boolean {
    // 巨量引擎的ID通常是数字格式
    return /^\d+$/.test(id);
  }

  /**
   * 格式化日期为YYYY-MM-DD格式
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 检查token是否有效
   */
  private isTokenValid(): boolean {
    if (!this.config.access_token) {
      return false;
    }

    if (this.config.expires_at && this.config.expires_at < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * 获取认证状态
   */
  private getAuthStatus(): 'authenticated' | 'expired' | 'invalid' | 'missing' {
    if (!this.config.access_token) {
      return 'missing';
    }

    if (this.config.expires_at && this.config.expires_at < new Date()) {
      return 'expired';
    }

    return 'authenticated';
  }

  /**
   * 更新速率限制信息
   */
  private updateRateLimitInfo(): void {
    this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);
    
    if (this.rateLimitRemaining === 0) {
      // 巨量引擎通常按小时重置
      this.rateLimitResetTime = new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.config.refresh_token) {
      throw new Error('缺少refresh_token，无法刷新访问令牌');
    }

    try {
      const response = await fetch('https://ad.oceanengine.com/open_api/oauth2/refresh_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.config.app_id,
          secret: this.config.secret,
          refresh_token: this.config.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json();
      
      if (data.code === 0) {
        this.config.access_token = data.data.access_token;
        this.config.refresh_token = data.data.refresh_token;
        this.config.expires_at = new Date(Date.now() + data.data.expires_in * 1000);
        
        console.log('巨量引擎访问令牌刷新成功');
      } else {
        throw new Error(`刷新令牌失败: ${data.message}`);
      }
    } catch (error) {
      console.error('刷新巨量引擎访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 获取评论管理权限（回复/隐藏评论）
   */
  async replyToComment(commentId: string, replyContent: string): Promise<boolean> {
    try {
      const response = await this.callOceanEngineAPI('/2/tools/comment/reply/', {
        advertiser_id: this.config.advertiser_id,
        comment_id: commentId,
        reply_content: replyContent
      });

      return response.code === 0;
    } catch (error) {
      console.error('回复评论失败:', error);
      return false;
    }
  }

  /**
   * 隐藏评论
   */
  async hideComment(commentId: string): Promise<boolean> {
    try {
      const response = await this.callOceanEngineAPI('/2/tools/comment/hide/', {
        advertiser_id: this.config.advertiser_id,
        comment_id: commentId
      });

      return response.code === 0;
    } catch (error) {
      console.error('隐藏评论失败:', error);
      return false;
    }
  }
}