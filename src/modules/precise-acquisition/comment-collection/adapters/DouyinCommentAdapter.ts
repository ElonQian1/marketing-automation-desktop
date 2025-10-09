/**
 * 抖音OpenAPI评论采集适配器
 * 
 * 实现抖音自然内容的评论采集功能
 * 使用抖音OpenAPI获取已授权账号下视频的评论
 */

import { CommentCollectionAdapter, CommentCollectionParams, CommentCollectionResult, AdapterStatus } from './CommentCollectionAdapter';
import { Comment, WatchTarget, Platform } from '../../shared/types/core';

/**
 * 抖音API配置
 */
interface DouyinAPIConfig {
  app_id: string;
  app_secret: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
}

/**
 * 抖音API响应格式
 */
interface DouyinCommentResponse {
  data: {
    list: Array<{
      comment_id: string;
      content: string;
      create_time: number;
      like_count: number;
      user_info: {
        open_id: string;
        nickname: string;
      };
      item_id: string; // 视频ID
    }>;
    cursor: string;
    has_more: boolean;
  };
  extra: {
    error_code: number;
    description: string;
    logid: string;
  };
}

/**
 * 抖音评论采集适配器
 */
export class DouyinCommentAdapter extends CommentCollectionAdapter {
  
  private config: DouyinAPIConfig;
  private rateLimitRemaining: number = 100;
  private rateLimitResetTime?: Date;
  
  constructor(config: DouyinAPIConfig) {
    super(Platform.DOUYIN);
    this.config = config;
  }

  /**
   * 获取适配器状态
   */
  async getStatus(): Promise<AdapterStatus> {
    return {
      platform: Platform.DOUYIN,
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
    // 只支持抖音平台的视频和账号
    if (target.platform !== Platform.DOUYIN) {
      return false;
    }
    
    // 检查URL格式
    const douyinUrlPattern = /(?:douyin\.com|iesdouyin\.com)/;
    return douyinUrlPattern.test(target.platform_id_or_url);
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
        requiredScopes: ['video.comment']
      };
    }

    // 检查API权限范围
    const requiredScopes = ['video.comment'];
    // TODO: 实际验证用户授权的scope

    return {
      canCollect: true,
      requiredScopes
    };
  }

  /**
   * 采集评论
   */
  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const { target, limit = 20, since, until, include_replies = false } = params;

    // 验证权限
    const permissionCheck = await this.validatePermissions(target);
    if (!permissionCheck.canCollect) {
      throw new Error(`无权限采集评论: ${permissionCheck.reason}`);
    }

    // 提取视频ID
    const videoId = this.extractVideoId(target.platform_id_or_url);
    if (!videoId) {
      throw new Error('无法从URL中提取视频ID');
    }

    const comments: Comment[] = [];
    let cursor = '';
    let hasMore = true;
    let totalCount = 0;

    try {
      while (hasMore && comments.length < limit) {
        const response = await this.callDouyinAPI('/video/comment/list/', {
          item_id: videoId,
          cursor,
          count: Math.min(limit - comments.length, 20), // 单次最多20条
          since_time: since ? Math.floor(since.getTime() / 1000) : undefined,
          until_time: until ? Math.floor(until.getTime() / 1000) : undefined
        });

        if (response.extra.error_code !== 0) {
          throw new Error(`抖音API错误: ${response.extra.description}`);
        }

        const apiComments = response.data.list || [];
        
        for (const apiComment of apiComments) {
          const comment = this.standardizeComment(apiComment, target);
          comments.push(comment);
        }

        cursor = response.data.cursor;
        hasMore = response.data.has_more;
        totalCount = response.data.list?.length || 0;

        // 更新速率限制信息
        this.updateRateLimitInfo();
      }

      return {
        comments,
        total_count: totalCount,
        next_cursor: cursor,
        has_more: hasMore,
        collected_at: new Date(),
        source_platform: Platform.DOUYIN,
        target_id: target.id
      };

    } catch (error) {
      console.error('抖音评论采集失败:', error);
      throw error;
    }
  }

  /**
   * 标准化评论数据
   */
  protected standardizeComment(rawComment: any, target: WatchTarget): Comment {
    return {
      id: `cmt_douyin_${rawComment.comment_id}`,
      platform: Platform.DOUYIN,
      video_id: rawComment.item_id || target.platform_id_or_url,
      author_id: rawComment.user_info.open_id,
      content: rawComment.content,
      like_count: rawComment.like_count || 0,
      publish_time: new Date(rawComment.create_time * 1000),
      region: undefined, // 抖音API不提供地区信息
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 调用抖音API
   */
  private async callDouyinAPI(endpoint: string, params: any): Promise<DouyinCommentResponse> {
    const baseUrl = 'https://open.douyin.com';
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
      return data as DouyinCommentResponse;
    } catch (error) {
      console.error('抖音API调用失败:', error);
      throw error;
    }
  }

  /**
   * 从URL中提取视频ID
   */
  private extractVideoId(url: string): string | null {
    // 支持多种抖音URL格式
    const patterns = [
      /(?:douyin\.com\/video\/)([0-9]+)/,
      /(?:v\.douyin\.com\/)([A-Za-z0-9]+)/,
      /(?:iesdouyin\.com\/share\/video\/)([0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
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

    // TODO: 添加更多验证逻辑
    return 'authenticated';
  }

  /**
   * 更新速率限制信息
   */
  private updateRateLimitInfo(): void {
    // 抖音API的速率限制通常在响应头中
    // 这里使用模拟数据
    this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);
    
    if (this.rateLimitRemaining === 0) {
      // 重置时间通常是1小时后
      this.rateLimitResetTime = new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  /**
   * 生成评论唯一ID
   */
  protected generateCommentId(rawComment: any): string {
    // 使用平台前缀 + 原始评论ID
    return `cmt_douyin_${rawComment.comment_id}`;
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.config.refresh_token) {
      throw new Error('缺少refresh_token，无法刷新访问令牌');
    }

    try {
      const response = await fetch('https://open.douyin.com/oauth/refresh_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_key: this.config.app_id,
          client_secret: this.config.app_secret,
          refresh_token: this.config.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json();
      
      if (data.error_code === 0) {
        this.config.access_token = data.data.access_token;
        this.config.refresh_token = data.data.refresh_token;
        this.config.expires_at = new Date(Date.now() + data.data.expires_in * 1000);
        
        console.log('抖音访问令牌刷新成功');
      } else {
        throw new Error(`刷新令牌失败: ${data.description}`);
      }
    } catch (error) {
      console.error('刷新抖音访问令牌失败:', error);
      throw error;
    }
  }
}