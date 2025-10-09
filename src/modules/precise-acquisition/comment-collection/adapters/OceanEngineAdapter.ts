/**
 * 巨量引擎 Marketing API 适配器
 * 
 * 实现广告内容的评论采集和管理
 * 仅对已授权的advertiser_id下的广告资产进行操作
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  CommentCollectionAdapter, 
  CommentCollectionParams, 
  CommentCollectionResult, 
  AdapterStatus 
} from './CommentCollectionAdapter';
import { Platform, WatchTarget, TargetType } from '../../shared/types/core';

/**
 * 巨量引擎API响应格式
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
      reply_count: number;
      user_info: {
        user_id: string;
        nickname: string;
        avatar_url: string;
      };
      ad_id: string;
      creative_id: string;
      status: number; // 1: 正常, 2: 隐藏
    }>;
    page_info: {
      page: number;
      page_size: number;
      total_count: number;
      total_page: number;
    };
  };
  request_id: string;
}

/**
 * 广告素材信息
 */
interface AdCreativeInfo {
  ad_id: string;
  creative_id: string;
  advertiser_id: string;
  title: string;
  status: string;
  creative_type: string;
}

export class OceanEngineAdapter extends CommentCollectionAdapter {
  private accessToken?: string;
  private advertiserId?: string;

  constructor() {
    super(Platform.OCEANENGINE);
  }

  async getStatus(): Promise<AdapterStatus> {
    try {
      const tokenInfo = await invoke('get_oceanengine_token_info');
      const info = tokenInfo as { 
        valid: boolean; 
        expires_at?: number;
        advertiser_ids?: string[];
        rate_limit_remaining?: number;
      };

      return {
        platform: Platform.OCEANENGINE,
        available: info.valid && (info.advertiser_ids?.length || 0) > 0,
        rate_limit_remaining: info.rate_limit_remaining,
        rate_limit_reset_time: info.expires_at ? new Date(info.expires_at * 1000) : undefined,
        auth_status: info.valid ? 'authenticated' : 'expired'
      };
    } catch (error) {
      console.error('Failed to get OceanEngine adapter status:', error);
      return {
        platform: Platform.OCEANENGINE,
        available: false,
        auth_status: 'missing',
        last_error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  isTargetSupported(target: WatchTarget): boolean {
    // 支持巨量引擎平台的广告相关目标
    return target.platform === Platform.OCEANENGINE;
  }

  async validatePermissions(target: WatchTarget): Promise<{
    canCollect: boolean;
    reason?: string;
    requiredScopes?: string[];
  }> {
    try {
      // 检查是否为已授权advertiser下的资产
      const result = await invoke('validate_oceanengine_target_permissions', {
        targetUrl: target.platform_id_or_url,
        targetType: target.target_type
      });

      const validation = result as {
        authorized: boolean;
        advertiser_id?: string;
        reason?: string;
        required_scopes?: string[];
      };

      return {
        canCollect: validation.authorized,
        reason: validation.reason,
        requiredScopes: validation.required_scopes
      };
    } catch (error) {
      return {
        canCollect: false,
        reason: `权限验证失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const { target, limit = 50, since, until } = params;

    if (!this.isTargetSupported(target)) {
      throw new Error('不支持的目标类型');
    }

    // 验证权限
    const permissions = await this.validatePermissions(target);
    if (!permissions.canCollect) {
      throw new Error(`无权限采集: ${permissions.reason}`);
    }

    try {
      // 获取广告素材信息
      const creativeInfo = await this.getAdCreativeInfo(target);
      
      // 调用Tauri后端进行API请求
      const response = await invoke('collect_oceanengine_comments', {
        advertiserId: creativeInfo.advertiser_id,
        adId: creativeInfo.ad_id,
        creativeId: creativeInfo.creative_id,
        page: 1,
        pageSize: limit,
        startDate: since?.toISOString().split('T')[0],
        endDate: until?.toISOString().split('T')[0]
      });

      const apiResponse = response as OceanEngineCommentResponse;
      
      if (apiResponse.code !== 0) {
        throw new Error(`API错误: ${apiResponse.message}`);
      }

      // 转换为标准格式
      const comments = apiResponse.data.list.map(rawComment => 
        this.standardizeComment({
          comment_id: rawComment.comment_id,
          content: rawComment.content,
          author_id: rawComment.user_info.user_id,
          like_count: rawComment.like_count,
          publish_time: rawComment.create_time,
          ad_id: rawComment.ad_id,
          creative_id: rawComment.creative_id,
          status: rawComment.status
        }, target)
      );

      return {
        comments,
        total_count: apiResponse.data.page_info.total_count,
        next_cursor: apiResponse.data.page_info.page < apiResponse.data.page_info.total_page 
          ? String(apiResponse.data.page_info.page + 1) 
          : undefined,
        has_more: apiResponse.data.page_info.page < apiResponse.data.page_info.total_page,
        collected_at: new Date(),
        source_platform: Platform.OCEANENGINE,
        target_id: target.id
      };

    } catch (error) {
      console.error('Failed to collect OceanEngine comments:', error);
      throw new Error(`巨量引擎评论采集失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  protected generateCommentId(rawComment: any): string {
    return `oceanengine_${rawComment.comment_id}`;
  }

  /**
   * 获取广告素材信息
   */
  private async getAdCreativeInfo(target: WatchTarget): Promise<AdCreativeInfo> {
    try {
      // 从target URL或配置中解析广告信息
      const adInfo = this.parseAdTarget(target.platform_id_or_url);
      
      const response = await invoke('get_oceanengine_creative_info', {
        advertiserId: adInfo.advertiser_id,
        adId: adInfo.ad_id,
        creativeId: adInfo.creative_id
      });

      return response as AdCreativeInfo;
    } catch (error) {
      console.error('Failed to get ad creative info:', error);
      throw error;
    }
  }

  /**
   * 解析广告目标信息
   */
  private parseAdTarget(targetUrl: string): {
    advertiser_id: string;
    ad_id: string;
    creative_id: string;
  } {
    // 这里需要根据实际的巨量引擎URL格式来解析
    // 示例格式可能是: oceanengine://advertiser/123/ad/456/creative/789
    
    const match = targetUrl.match(/advertiser\/(\d+)\/ad\/(\d+)\/creative\/(\d+)/);
    if (!match) {
      throw new Error(`无法解析巨量引擎目标URL: ${targetUrl}`);
    }

    return {
      advertiser_id: match[1],
      ad_id: match[2],
      creative_id: match[3]
    };
  }

  /**
   * 回复评论
   */
  async replyComment(commentId: string, content: string, advertiserId: string): Promise<{
    success: boolean;
    reply_id?: string;
    error?: string;
  }> {
    try {
      const response = await invoke('reply_oceanengine_comment', {
        commentId,
        content,
        advertiserId
      });

      return response as { success: boolean; reply_id?: string; error?: string };
    } catch (error) {
      console.error('Failed to reply comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 隐藏评论
   */
  async hideComment(commentId: string, advertiserId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await invoke('hide_oceanengine_comment', {
        commentId,
        advertiserId
      });

      return response as { success: boolean; error?: string };
    } catch (error) {
      console.error('Failed to hide comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取广告投放数据（用于评论分析）
   */
  async getAdPerformanceData(advertiserId: string, adId: string, dateRange: {
    start: Date;
    end: Date;
  }): Promise<{
    impressions: number;
    clicks: number;
    cost: number;
    comments_count: number;
    shares_count: number;
    likes_count: number;
  }> {
    try {
      const response = await invoke('get_oceanengine_ad_performance', {
        advertiserId,
        adId,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0]
      });

      return response as {
        impressions: number;
        clicks: number;
        cost: number;
        comments_count: number;
        shares_count: number;
        likes_count: number;
      };
    } catch (error) {
      console.error('Failed to get ad performance data:', error);
      throw error;
    }
  }
}