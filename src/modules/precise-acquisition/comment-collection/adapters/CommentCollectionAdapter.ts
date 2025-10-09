/**
 * 评论采集适配器接口
 * 
 * 定义统一的评论采集接口，支持三轨来源：
 * 1. 抖音 OpenAPI (自然内容)
 * 2. 巨量引擎 Marketing API (广告内容) 
 * 3. 公开白名单采集
 */

import { Comment, WatchTarget, Platform } from '../../shared/types/core';

/**
 * 评论采集参数
 */
export interface CommentCollectionParams {
  target: WatchTarget;
  limit?: number;
  since?: Date;
  until?: Date;
  include_replies?: boolean;
}

/**
 * 评论采集结果
 */
export interface CommentCollectionResult {
  comments: Comment[];
  total_count: number;
  next_cursor?: string;
  has_more: boolean;
  collected_at: Date;
  source_platform: Platform;
  target_id: string;
}

/**
 * 适配器状态
 */
export interface AdapterStatus {
  platform: Platform;
  available: boolean;
  rate_limit_remaining?: number;
  rate_limit_reset_time?: Date;
  last_error?: string;
  auth_status: 'authenticated' | 'expired' | 'invalid' | 'missing';
}

/**
 * 评论采集适配器基类
 */
export abstract class CommentCollectionAdapter {
  protected platform: Platform;
  
  constructor(platform: Platform) {
    this.platform = platform;
  }

  /**
   * 获取适配器状态
   */
  abstract getStatus(): Promise<AdapterStatus>;

  /**
   * 检查目标是否支持
   */
  abstract isTargetSupported(target: WatchTarget): boolean;

  /**
   * 采集评论
   */
  abstract collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult>;

  /**
   * 获取平台标识
   */
  getPlatform(): Platform {
    return this.platform;
  }

  /**
   * 验证采集权限
   */
  abstract validatePermissions(target: WatchTarget): Promise<{
    canCollect: boolean;
    reason?: string;
    requiredScopes?: string[];
  }>;

  /**
   * 标准化评论数据
   */
  protected standardizeComment(rawComment: any, target: WatchTarget): Comment {
    return {
      id: this.generateCommentId(rawComment),
      platform: this.platform,
      video_id: target.platform_id_or_url,
      author_id: rawComment.author_id || rawComment.user_id,
      content: rawComment.content || rawComment.text,
      like_count: rawComment.like_count || rawComment.likes || 0,
      publish_time: new Date(rawComment.publish_time || rawComment.created_at),
      region: this.extractRegion(rawComment),
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 生成评论唯一ID
   */
  protected abstract generateCommentId(rawComment: any): string;

  /**
   * 提取地域信息
   */
  protected extractRegion(rawComment: any): any {
    // 子类可以重写此方法来提取特定平台的地域信息
    return rawComment.region || rawComment.location || undefined;
  }
}