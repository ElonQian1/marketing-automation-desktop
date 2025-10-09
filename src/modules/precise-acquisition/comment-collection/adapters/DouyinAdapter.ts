/**
 * 抖音 OpenAPI 适配器
 * 
 * 实现抖音自然内容的评论采集
 * 仅对已授权账号下的内容进行操作
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  CommentCollectionAdapter, 
  CommentCollectionParams, 
  CommentCollectionResult, 
  AdapterStatus 
} from './CommentCollectionAdapter';
import { Platform, WatchTarget, TargetType } from '../../shared/types/core';
import { generateId } from '../../shared/utils';

/**
 * 抖音API响应格式
 */
interface DouyinCommentResponse {
  data: {
    list: Array<{
      comment_id: string;
      content: string;
      create_time: number;
      digg_count: number;
      user: {
        open_id: string;
        nickname: string;
        avatar: string;
      };
      reply_comment_total?: number;
    }>;
    cursor: string;
    has_more: boolean;
    total: number;
  };
  extra: {
    logid: string;
    now: number;
  };
}

export class DouyinAdapter extends CommentCollectionAdapter {
  private accessToken?: string;
  private openId?: string;

  constructor() {
    super(Platform.DOUYIN);
  }

  async getStatus(): Promise<AdapterStatus> {
    try {
      // 检查token状态
      const tokenInfo = await invoke('get_douyin_token_info');
      const info = tokenInfo as { 
        valid: boolean; 
        expires_at?: number; 
        scopes?: string[];
        rate_limit_remaining?: number;
      };

      return {
        platform: Platform.DOUYIN,
        available: info.valid,
        rate_limit_remaining: info.rate_limit_remaining,
        rate_limit_reset_time: info.expires_at ? new Date(info.expires_at * 1000) : undefined,
        auth_status: info.valid ? 'authenticated' : 'expired'
      };
    } catch (error) {
      console.error('Failed to get Douyin adapter status:', error);
      return {
        platform: Platform.DOUYIN,
        available: false,
        auth_status: 'missing',
        last_error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  isTargetSupported(target: WatchTarget): boolean {
    // 只支持抖音平台的视频和账号
    return target.platform === Platform.DOUYIN && 
           (target.target_type === TargetType.VIDEO || target.target_type === TargetType.ACCOUNT);
  }

  async validatePermissions(target: WatchTarget): Promise<{
    canCollect: boolean;
    reason?: string;
    requiredScopes?: string[];
  }> {
    try {
      // 检查是否为已授权账号下的内容
      const result = await invoke('validate_douyin_target_permissions', {
        targetUrl: target.platform_id_or_url,
        targetType: target.target_type
      });

      const validation = result as {
        authorized: boolean;
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
    const { target, limit = 20, since, until } = params;

    if (!this.isTargetSupported(target)) {
      throw new Error('不支持的目标类型');
    }

    // 验证权限
    const permissions = await this.validatePermissions(target);
    if (!permissions.canCollect) {
      throw new Error(`无权限采集: ${permissions.reason}`);
    }

    try {
      // 调用Tauri后端进行API请求
      const response = await invoke('collect_douyin_comments', {
        targetId: this.extractTargetId(target.platform_id_or_url),
        targetType: target.target_type,
        count: limit,
        cursor: null, // 首次请求
        since: since?.getTime(),
        until: until?.getTime()
      });

      const apiResponse = response as DouyinCommentResponse;
      
      // 转换为标准格式
      const comments = apiResponse.data.list.map(rawComment => 
        this.standardizeComment({
          comment_id: rawComment.comment_id,
          content: rawComment.content,
          author_id: rawComment.user.open_id,
          like_count: rawComment.digg_count,
          publish_time: rawComment.create_time * 1000, // 转换为毫秒
          user_nickname: rawComment.user.nickname
        }, target)
      );

      return {
        comments,
        total_count: apiResponse.data.total,
        next_cursor: apiResponse.data.cursor,
        has_more: apiResponse.data.has_more,
        collected_at: new Date(),
        source_platform: Platform.DOUYIN,
        target_id: target.id
      };

    } catch (error) {
      console.error('Failed to collect Douyin comments:', error);
      throw new Error(`抖音评论采集失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  protected generateCommentId(rawComment: any): string {
    return `douyin_${rawComment.comment_id}`;
  }

  /**
   * 从URL中提取目标ID
   */
  private extractTargetId(url: string): string {
    // 解析抖音URL格式
    // 视频: https://www.douyin.com/video/7123456789
    // 用户: https://www.douyin.com/user/MS4wLjABAAAA...
    
    const videoMatch = url.match(/\/video\/(\d+)/);
    if (videoMatch) {
      return videoMatch[1];
    }

    const userMatch = url.match(/\/user\/([^/?]+)/);
    if (userMatch) {
      return userMatch[1];
    }

    throw new Error(`无法解析抖音URL: ${url}`);
  }

  /**
   * 获取用户视频列表（账号类型目标）
   */
  async getUserVideos(target: WatchTarget, limit: number = 10): Promise<string[]> {
    if (target.target_type !== TargetType.ACCOUNT) {
      throw new Error('此方法仅适用于账号类型目标');
    }

    try {
      const response = await invoke('get_douyin_user_videos', {
        userId: this.extractTargetId(target.platform_id_or_url),
        count: limit
      });

      const videoList = response as { video_ids: string[] };
      return videoList.video_ids;
    } catch (error) {
      console.error('Failed to get user videos:', error);
      throw error;
    }
  }

  /**
   * 批量采集账号下所有视频的评论
   */
  async collectAccountComments(target: WatchTarget, options: {
    videos_limit?: number;
    comments_per_video?: number;
    since?: Date;
  } = {}): Promise<CommentCollectionResult[]> {
    if (target.target_type !== TargetType.ACCOUNT) {
      throw new Error('此方法仅适用于账号类型目标');
    }

    const { videos_limit = 10, comments_per_video = 20, since } = options;
    
    // 获取用户视频列表
    const videoIds = await this.getUserVideos(target, videos_limit);
    const results: CommentCollectionResult[] = [];

    // 为每个视频采集评论
    for (const videoId of videoIds) {
      try {
        const videoTarget: WatchTarget = {
          ...target,
          target_type: TargetType.VIDEO,
          platform_id_or_url: `https://www.douyin.com/video/${videoId}`
        };

        const result = await this.collectComments({
          target: videoTarget,
          limit: comments_per_video,
          since
        });

        results.push(result);
      } catch (error) {
        console.warn(`Failed to collect comments for video ${videoId}:`, error);
        // 继续处理其他视频
      }
    }

    return results;
  }
}