/**
 * 抖音评论采集适配器
 * 
 * 基于抖音OpenAPI实现自然内容的评论采集
 * 仅支持已授权账号下的视频/直播互动数据拉取
 */

// 使用现有的核心类型系统 - 全部从core.ts导入
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

// ==================== 接口定义 ====================

// 删除重复的本地接口定义，使用统一的领域类型
// WatchTarget 和 Comment 现在从 core.ts 导入

export interface CommentCollectionParams {
  target: WatchTarget;
  limit?: number;
  cursor?: string;
  time_range?: {
    start: Date;
    end: Date;
  };
}

export interface CommentCollectionResult {
  comments: Comment[];
  has_more: boolean;
  next_cursor?: string;
  total_count?: number;
  rate_limit_info?: {
    remaining: number;
    reset_time: Date;
  };
}

// 删除本地重复接口定义，使用统一接口
// export interface AdapterStatus - 已替换为 UnifiedAdapterStatus

export interface DouyinAPIConfig {
  client_key: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  api_base_url?: string;
}

// ==================== 抖音API响应类型 ====================

interface DouyinVideoCommentsResponse {
  data: {
    list: DouyinComment[];
    cursor: number;
    has_more: boolean;
    total: number;
  };
  extra: {
    error_code: number;
    description: string;
    sub_error_code: number;
    sub_description: string;
    now: number;
  };
}

interface DouyinComment {
  comment_id: string;
  comment_user_id: string;
  content: string;
  create_time: number;
  digg_count: number;
  reply_comment_total: number;
  top: boolean;
}

interface DouyinUserInfo {
  open_id: string;
  union_id: string;
  nickname: string;
  avatar: string;
  city: string;
  province: string;
  country: string;
}

// ==================== 抖音评论采集适配器 ====================

export class DouyinCommentAdapter implements UnifiedCommentAdapter {
  private config: DouyinAPIConfig;
  private platform: Platform = Platform.DOUYIN;

  constructor(config: DouyinAPIConfig) {
    this.config = config;
  }

  /**
   * 获取适配器状态
   */
  async getStatus(): Promise<UnifiedAdapterStatus> {
    try {
      // 检查access_token有效性
      if (!this.config.access_token) {
        return {
          platform: this.platform,
          available: false,
          auth_status: 'missing',
          last_error: 'Access token not configured'
        };
      }

      // 可以通过调用用户信息接口验证token有效性
      const isValid = await this.validateAccessToken();
      
      return {
        platform: this.platform,
        available: isValid,
        auth_status: isValid ? 'authenticated' : 'expired',
        last_error: isValid ? undefined : 'Access token expired or invalid'
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
    // 只支持抖音平台的视频
    if (target.platform !== Platform.DOUYIN) {
      return false;
    }

    // 只支持视频类型，不支持账号级别的评论采集（需要额外权限）
    if (target.target_type !== TargetType.VIDEO) {
      return false;
    }

    // 检查URL格式
    const videoIdPattern = /\/video\/(\d+)/;
    return videoIdPattern.test(target.platform_id_or_url);
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

    // 提取视频ID
    const videoId = this.extractVideoId(target.platform_id_or_url);
    if (!videoId) {
      throw new Error('Invalid video URL format');
    }

    try {
      // 调用抖音API获取评论
      const apiResponse = await this.fetchCommentsFromAPI(videoId, {
        count: Math.min(limit, 100), // API限制单次最多100条
        cursor: cursor ? parseInt(cursor) : 0
      });

      // 转换为标准格式
      const comments = apiResponse.data.list.map(comment => 
        this.standardizeComment(comment, target)
      );

      // 应用时间范围过滤
      const filteredComments = time_range 
        ? comments.filter(comment => 
            comment.publish_time >= time_range.start && 
            comment.publish_time <= time_range.end
          )
        : comments;

      return {
        comments: filteredComments,
        has_more: apiResponse.data.has_more,
        next_cursor: apiResponse.data.has_more ? apiResponse.data.cursor.toString() : undefined,
        total_count: apiResponse.data.total,
        collected_at: new Date(),
        source_platform: this.platform,
        target_id: target.id,
        rate_limit_info: await this.getRateLimitInfo()
      };

    } catch (error) {
      console.error('[DouyinCommentAdapter] Failed to collect comments:', error);
      throw new Error(`Failed to collect comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 验证采集权限
   */
  async validatePermissions(target: WatchTarget): Promise<UnifiedPermissionValidationResult> {
    try {
      // 检查access_token
      if (!this.config.access_token) {
        return {
          canCollect: false,
          reason: 'Access token not configured',
          requiredScopes: ['video.list']
        };
      }

      // 验证scope权限（这里需要实际验证用户授权的scope）
      const hasRequiredScope = await this.checkScope(['video.list']);
      if (!hasRequiredScope) {
        return {
          canCollect: false,
          reason: 'Insufficient permissions',
          requiredScopes: ['video.list']
        };
      }

      // 验证视频是否属于授权用户
      const isOwnedVideo = await this.verifyVideoOwnership(target.platform_id_or_url);
      if (!isOwnedVideo) {
        return {
          canCollect: false,
          reason: 'Video not owned by authorized user'
        };
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
      const response = await fetch(`${this.getApiBaseUrl()}/oauth/userinfo/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 检查API权限scope
   */
  private async checkScope(requiredScopes: string[]): Promise<boolean> {
    try {
      // 调用抖音API获取当前token的权限范围
      const response = await fetch(`${this.getApiBaseUrl()}/oauth/userinfo/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('获取用户权限信息失败:', response.status);
        return false;
      }

      const data = await response.json();
      const grantedScopes = data.data?.scope?.split(',') || [];
      
      // 检查是否包含所有必需的权限
      return requiredScopes.every(scope => grantedScopes.includes(scope));
      
    } catch (error) {
      console.error('检查API权限失败:', error);
      return false;
    }
  }

  /**
   * 验证视频所有权
   */
  private async verifyVideoOwnership(videoUrl: string): Promise<boolean> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) return false;

      // 通过用户视频列表API检查视频是否属于当前授权用户
      const response = await fetch(`${this.getApiBaseUrl()}/video/list/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.data?.list?.some((video: any) => video.item_id === videoId);
    } catch {
      return false;
    }
  }

  /**
   * 从API获取评论数据
   */
  private async fetchCommentsFromAPI(
    videoId: string, 
    params: { count: number; cursor: number }
  ): Promise<DouyinVideoCommentsResponse> {
    const url = `${this.getApiBaseUrl()}/video/comment/list/`;
    const queryParams = new URLSearchParams({
      item_id: videoId,
      count: params.count.toString(),
      cursor: params.cursor.toString()
    });

    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.extra?.error_code !== 0) {
      throw new Error(`API error: ${data.extra?.description || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * 标准化评论数据
   */
  private standardizeComment(rawComment: DouyinComment, target: WatchTarget): Comment {
    return {
      id: this.generateCommentId(rawComment),
      platform: this.platform,
      video_id: this.extractVideoId(target.platform_id_or_url) || '',
      author_id: rawComment.comment_user_id,
      content: rawComment.content,
      like_count: rawComment.digg_count,
      publish_time: new Date(rawComment.create_time * 1000),
      region: this.extractRegion(rawComment),
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 生成评论唯一ID
   */
  private generateCommentId(rawComment: DouyinComment): string {
    return `douyin_${rawComment.comment_id}`;
  }

  /**
   * 提取地域信息
   */
  private extractRegion(rawComment: DouyinComment): RegionTag | undefined {
    // 抖音评论API通常不直接提供地域信息
    // 可能需要通过用户信息API获取
    return undefined;
  }

  /**
   * 提取视频ID
   */
  private extractVideoId(url: string): string | null {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * 获取API基础URL
   */
  private getApiBaseUrl(): string {
    return this.config.api_base_url || 'https://open.douyin.com';
  }

  /**
   * 获取速率限制信息
   */
  private async getRateLimitInfo(): Promise<{
    remaining: number;
    reset_time: Date;
  } | undefined> {
    try {
      // 通过HEAD请求获取速率限制信息，避免消耗实际API配额
      const response = await fetch(`${this.getApiBaseUrl()}/video/list/`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // 从响应头获取速率限制信息
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const resetTime = response.headers.get('X-RateLimit-Reset');

      if (remaining && resetTime) {
        return {
          remaining: parseInt(remaining, 10),
          reset_time: new Date(parseInt(resetTime, 10) * 1000)
        };
      }

      // 如果API不提供速率限制头，返回保守估计值
      return {
        remaining: 80, // 保守估计剩余配额
        reset_time: new Date(Date.now() + 3600 * 1000) // 1小时后重置
      };

    } catch (error) {
      console.error('获取速率限制信息失败:', error);
      // 返回最保守的估计值
      return {
        remaining: 50,
        reset_time: new Date(Date.now() + 3600 * 1000)
      };
    }
  }

  /**
   * 刷新access_token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.config.refresh_token) {
      return false;
    }

    try {
      const response = await fetch(`${this.getApiBaseUrl()}/oauth/refresh_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_key: this.config.client_key,
          client_secret: this.config.client_secret,
          refresh_token: this.config.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      if (data.data) {
        this.config.access_token = data.data.access_token;
        this.config.refresh_token = data.data.refresh_token;
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
  updateConfig(config: Partial<DouyinAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取平台标识
   */
  getPlatform(): Platform {
    return this.platform;
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建抖音评论适配器实例
 */
export function createDouyinCommentAdapter(config: DouyinAPIConfig): DouyinCommentAdapter {
  return new DouyinCommentAdapter(config);
}

// ==================== 配置验证 ====================

/**
 * 验证抖音API配置
 */
export function validateDouyinConfig(config: Partial<DouyinAPIConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.client_key) {
    errors.push('client_key is required');
  }

  if (!config.client_secret) {
    errors.push('client_secret is required');
  }

  // access_token可以为空，运行时通过OAuth获取

  return {
    isValid: errors.length === 0,
    errors
  };
}