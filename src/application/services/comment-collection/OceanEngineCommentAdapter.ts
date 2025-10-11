// src/application/services/comment-collection/OceanEngineCommentAdapter.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 巨量引擎评论采集适配器
 * 
 * 基于巨量引擎Marketing API实现广告内容的评论采集
 * 仅支持广告计划/创意下的评论管理与报表
 */

import { 
  Platform, 
  TargetType, 
  IndustryTag, 
  RegionTag,
  WatchTarget, 
  Comment
} from '../../../modules/precise-acquisition/shared/types/core';

// 导入统一接口
import { 
  UnifiedCommentAdapter,
  UnifiedAdapterStatus,
  UnifiedCommentCollectionParams,
  UnifiedCommentCollectionResult,
  UnifiedPermissionValidationResult
} from './UnifiedCommentAdapter';

// ==================== 巨量引擎API配置 ====================

export interface OceanEngineAPIConfig {
  app_id: string;
  secret: string;
  access_token?: string;
  advertiser_id: string;
  api_base_url?: string;
}

// ==================== 巨量引擎API响应类型 ====================

interface OceanEngineCommentsResponse {
  code: number;
  message: string;
  data: {
    list: OceanEngineComment[];
    page_info: {
      total_number: number;
      total_page: number;
      page: number;
      page_size: number;
    };
  };
  request_id: string;
}

interface OceanEngineComment {
  comment_id: string;
  user_id: string;
  content: string;
  create_time: string;
  like_count: number;
  reply_count: number;
  status: string; // "normal" | "hidden" | "deleted"
  ad_id: string;
  creative_id: string;
  user_info?: {
    nickname: string;
    avatar_url: string;
    city?: string;
    province?: string;
  };
}

interface OceanEngineAdInfo {
  ad_id: string;
  campaign_id: string;
  advertiser_id: string;
  name: string;
  status: string;
  opt_status: string;
}

// ==================== 巨量引擎评论适配器 ====================

export class OceanEngineCommentAdapter implements UnifiedCommentAdapter {
  private config: OceanEngineAPIConfig;
  private platform: Platform = Platform.OCEANENGINE;

  constructor(config: OceanEngineAPIConfig) {
    this.config = config;
  }

  /**
   * 获取适配器状态
   */
  async getStatus(): Promise<UnifiedAdapterStatus> {
    try {
      if (!this.config.access_token) {
        return {
          platform: this.platform,
          available: false,
          auth_status: 'missing',
          last_error: 'Access token not configured'
        };
      }

      // 验证token和广告主权限
      const isValid = await this.validateAccessToken();
      
      return {
        platform: this.platform,
        available: isValid,
        auth_status: isValid ? 'authenticated' : 'expired',
        last_error: isValid ? undefined : 'Access token expired or invalid advertiser permissions'
      };
    } catch (error) {
      return {
        platform: this.platform,
        available: false,
        auth_status: 'invalid',
        last_error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 检查目标是否支持
   */
  isTargetSupported(target: WatchTarget): boolean {
    // 只支持巨量引擎平台
    if (target.platform !== Platform.OCEANENGINE) {
      return false;
    }

    // 支持广告和创意级别的评论采集
    if (target.target_type !== TargetType.VIDEO && target.target_type !== TargetType.ACCOUNT) {
      return false;
    }

    // 检查是否为广告ID或创意ID格式
    const idPattern = /^(ad_|creative_|campaign_)\d+$/;
    return idPattern.test(target.platform_id_or_url) || 
           /^\d+$/.test(target.platform_id_or_url); // 纯数字ID
  }

  /**
   * 采集评论
   */
  async collectComments(params: UnifiedCommentCollectionParams): Promise<UnifiedCommentCollectionResult> {
    const { target, limit = 20, cursor, time_range } = params;

    // 验证目标支持
    if (!this.isTargetSupported(target)) {
      throw new Error(`Target not supported: ${target.platform_id_or_url}`);
    }

    // 验证权限
    const permissions = await this.validatePermissions(target);
    if (!permissions.canCollect) {
      throw new Error(`Permission denied: ${permissions.reason}`);
    }

    // 解析广告ID
    const adId = this.extractAdId(target.platform_id_or_url);
    if (!adId) {
      throw new Error('Invalid ad ID format');
    }

    try {
      // 调用巨量引擎API获取评论
      const page = cursor ? parseInt(cursor) : 1;
      const apiResponse = await this.fetchCommentsFromAPI(adId, {
        page,
        page_size: Math.min(limit, 100),
        start_date: time_range?.start ? this.formatDate(time_range.start) : undefined,
        end_date: time_range?.end ? this.formatDate(time_range.end) : undefined
      });

      // 转换为标准格式
      const comments = apiResponse.data.list.map(comment => 
        this.standardizeComment(comment, target)
      );

      const hasMore = page < apiResponse.data.page_info.total_page;

      return {
        comments,
        has_more: hasMore,
        next_cursor: hasMore ? (page + 1).toString() : undefined,
        total_count: apiResponse.data.page_info.total_number,
        collected_at: new Date(),
        source_platform: this.platform,
        target_id: target.id,
        rate_limit_info: await this.getRateLimitInfo()
      };

    } catch (error) {
      console.error('[OceanEngineCommentAdapter] Failed to collect comments:', error);
      throw new Error(`Failed to collect comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 验证采集权限
   */
  async validatePermissions(target: WatchTarget): Promise<UnifiedPermissionValidationResult> {
    try {
      if (!this.config.access_token || !this.config.advertiser_id) {
        return {
          canCollect: false,
          reason: 'Access token or advertiser ID not configured',
          requiredScopes: ['ad:read', 'comment:read']
        };
      }

      // 验证广告主权限
      const hasAdvertiserAccess = await this.verifyAdvertiserAccess();
      if (!hasAdvertiserAccess) {
        return {
          canCollect: false,
          reason: 'No access to specified advertiser account'
        };
      }

      // 验证广告所有权
      const adId = this.extractAdId(target.platform_id_or_url);
      if (adId) {
        const isOwnedAd = await this.verifyAdOwnership(adId);
        if (!isOwnedAd) {
          return {
            canCollect: false,
            reason: 'Ad not owned by current advertiser'
          };
        }
      }

      return { canCollect: true };

    } catch (error) {
      return {
        canCollect: false,
        reason: `Permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 验证access_token有效性
   */
  private async validateAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/open_api/v1.0/advertiser/info/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          advertiser_id: this.config.advertiser_id
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 验证广告主访问权限
   */
  private async verifyAdvertiserAccess(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/open_api/v1.0/advertiser/info/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          advertiser_id: this.config.advertiser_id
        })
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.code === 0 && data.data;
    } catch {
      return false;
    }
  }

  /**
   * 验证广告所有权
   */
  private async verifyAdOwnership(adId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/open_api/v1.0/ad/get/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          advertiser_id: this.config.advertiser_id,
          ad_ids: [adId]
        })
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.code === 0 && data.data?.list?.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 从API获取评论数据
   */
  private async fetchCommentsFromAPI(
    adId: string,
    params: {
      page: number;
      page_size: number;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<OceanEngineCommentsResponse> {
    const url = `${this.getApiBaseUrl()}/open_api/v1.0/comment/list/`;
    
    const requestBody = {
      advertiser_id: this.config.advertiser_id,
      ad_id: adId,
      page: params.page,
      page_size: params.page_size,
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date })
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`API error: ${data.message || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * 标准化评论数据
   */
  private standardizeComment(rawComment: OceanEngineComment, target: WatchTarget): Comment {
    return {
      id: this.generateCommentId(rawComment),
      platform: this.platform,
      video_id: rawComment.ad_id,
      author_id: rawComment.user_id,
      content: rawComment.content,
      like_count: rawComment.like_count,
      publish_time: new Date(rawComment.create_time),
      region: this.extractRegion(rawComment),
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 生成评论唯一ID
   */
  private generateCommentId(rawComment: OceanEngineComment): string {
    return `oceanengine_${rawComment.comment_id}`;
  }

  /**
   * 提取地域信息
   */
  private extractRegion(rawComment: OceanEngineComment): RegionTag | undefined {
    const userInfo = rawComment.user_info;
    if (!userInfo?.province) return undefined;

    // 根据省份映射到地域标签
    const provinceToRegion: Record<string, RegionTag> = {
      '北京': RegionTag.BEIJING,
      '上海': RegionTag.SHANGHAI,
      '广东': RegionTag.GUANGDONG,
      '浙江': RegionTag.ZHEJIANG,
      '江苏': RegionTag.JIANGSU,
      '山东': RegionTag.SHANDONG,
      '四川': RegionTag.SICHUAN,
    };

    return provinceToRegion[userInfo.province];
  }

  /**
   * 提取广告ID
   */
  private extractAdId(idOrUrl: string): string | null {
    // 如果是纯数字，直接返回
    if (/^\d+$/.test(idOrUrl)) {
      return idOrUrl;
    }

    // 如果是带前缀的ID，提取数字部分
    const match = idOrUrl.match(/^(?:ad_|creative_|campaign_)(\d+)$/);
    return match ? match[1] : null;
  }

  /**
   * 格式化日期为API需要的格式
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * 获取API基础URL
   */
  private getApiBaseUrl(): string {
    return this.config.api_base_url || 'https://ad.oceanengine.com';
  }

  /**
   * 获取速率限制信息
   */
  private async getRateLimitInfo(): Promise<{
    remaining: number;
    reset_time: Date;
  } | undefined> {
    // 巨量引擎API的速率限制信息
    return {
      remaining: 500, // 默认限制值
      reset_time: new Date(Date.now() + 3600 * 1000) // 1小时后重置
    };
  }

  /**
   * 刷新access_token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/open_api/oauth2/refresh_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.config.app_id,
          secret: this.config.secret,
          grant_type: 'refresh_token',
          refresh_token: this.config.access_token // 在实际实现中需要存储refresh_token
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        this.config.access_token = data.data.access_token;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OceanEngineAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取平台标识
   */
  getPlatform(): Platform {
    return this.platform;
  }

  /**
   * 评论管理操作（隐藏/删除评论）
   */
  async manageComment(commentId: string, action: 'hide' | 'delete' | 'restore'): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/open_api/v1.0/comment/manage/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          advertiser_id: this.config.advertiser_id,
          comment_id: commentId,
          action
        })
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.code === 0;
    } catch {
      return false;
    }
  }

  /**
   * 回复评论
   */
  async replyToComment(commentId: string, replyContent: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/open_api/v1.0/comment/reply/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          advertiser_id: this.config.advertiser_id,
          comment_id: commentId,
          content: replyContent
        })
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.code === 0;
    } catch {
      return false;
    }
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建巨量引擎评论适配器实例
 */
export function createOceanEngineCommentAdapter(config: OceanEngineAPIConfig): OceanEngineCommentAdapter {
  return new OceanEngineCommentAdapter(config);
}

// ==================== 配置验证 ====================

/**
 * 验证巨量引擎API配置
 */
export function validateOceanEngineConfig(config: Partial<OceanEngineAPIConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.app_id) {
    errors.push('app_id is required');
  }

  if (!config.secret) {
    errors.push('secret is required');
  }

  if (!config.advertiser_id) {
    errors.push('advertiser_id is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}