// src/application/services/comment-collection/UnifiedCommentAdapter.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 统一评论采集适配器接口
 * 
 * 🎯 目标：整合 application 和 modules 层的适配器接口
 * 🔄 策略：保留两者的最佳特性，确保向后兼容
 * 📅 创建：架构整合阶段
 */

import { Comment, WatchTarget, Platform } from '../../../modules/precise-acquisition/shared/types/core';

// ==================== 核心接口定义 ====================

/**
 * 🎯 统一评论采集参数
 * 
 * 合并了两个系统的参数选项：
 * - Application层: cursor, time_range
 * - Modules层: since, until, include_replies
 */
export interface UnifiedCommentCollectionParams {
  target: WatchTarget;
  limit?: number;
  
  // 🔄 时间范围 - 支持两种模式
  cursor?: string;                    // Application层分页方式
  time_range?: {                      // Application层时间范围
    start: Date;
    end: Date;
  };
  since?: Date;                       // Modules层开始时间
  until?: Date;                       // Modules层结束时间
  
  // 🆕 额外选项
  include_replies?: boolean;          // 是否包含回复 (来自Modules层)
}

/**
 * 🎯 统一评论采集结果
 * 
 * 合并了两个系统的结果字段
 */
export interface UnifiedCommentCollectionResult {
  comments: Comment[];
  total_count?: number;               // Modules层提供
  has_more: boolean;                  // 两者都有
  next_cursor?: string;               // 分页游标
  
  // 🆕 增强信息
  collected_at: Date;                 // 采集时间 (来自Modules层)
  source_platform: Platform;         // 来源平台 (来自Modules层) 
  target_id: string;                  // 目标ID (来自Modules层)
  
  // 🔄 频率限制信息 (来自Application层)
  rate_limit_info?: {
    remaining: number;
    reset_time: Date;
  };
}

/**
 * 🎯 统一适配器状态
 * 
 * 合并了两个系统的状态定义
 */
export interface UnifiedAdapterStatus {
  platform: Platform;                // 来自Modules层
  available: boolean;                 // 统一字段名 (Modules: available, Application: is_available)
  
  // 🔄 认证状态
  auth_status: 'authenticated' | 'expired' | 'invalid' | 'missing';  // 来自Modules层
  
  // 🔄 频率限制 (来自Modules层，更详细)
  rate_limit_remaining?: number;
  rate_limit_reset_time?: Date;
  
  // 🔄 错误信息
  last_error?: string;
}

/**
 * 🎯 统一权限验证结果
 * 
 * 合并了两个系统的权限定义
 */
export interface UnifiedPermissionValidationResult {
  canCollect: boolean;
  reason?: string;
  requiredScopes?: string[];
  compliance_status?: string;         // 来自Application层
}

// ==================== 核心适配器接口 ====================

/**
 * 🎯 统一评论采集适配器接口
 * 
 * 整合了Application层的CommentAdapter和Modules层的CommentCollectionAdapter
 */
export interface UnifiedCommentAdapter {
  /**
   * 获取适配器状态
   */
  getStatus(): Promise<UnifiedAdapterStatus>;
  
  /**
   * 检查目标是否支持
   */
  isTargetSupported(target: WatchTarget): boolean;
  
  /**
   * 采集评论 - 核心方法
   */
  collectComments(params: UnifiedCommentCollectionParams): Promise<UnifiedCommentCollectionResult>;
  
  /**
   * 验证采集权限
   */
  validatePermissions(target: WatchTarget): Promise<UnifiedPermissionValidationResult>;
  
  /**
   * 获取平台标识
   */
  getPlatform(): Platform;
}

// ==================== 抽象基类 ====================

/**
 * 🎯 统一适配器基类
 * 
 * 提供通用实现，减少子类重复代码
 */
export abstract class UnifiedCommentAdapterBase implements UnifiedCommentAdapter {
  protected platform: Platform;
  
  constructor(platform: Platform) {
    this.platform = platform;
  }
  
  /**
   * 获取平台标识
   */
  getPlatform(): Platform {
    return this.platform;
  }
  
  // 🔄 抽象方法 - 子类必须实现
  abstract getStatus(): Promise<UnifiedAdapterStatus>;
  abstract isTargetSupported(target: WatchTarget): boolean;
  abstract collectComments(params: UnifiedCommentCollectionParams): Promise<UnifiedCommentCollectionResult>;
  abstract validatePermissions(target: WatchTarget): Promise<UnifiedPermissionValidationResult>;
  
  // ==================== 通用工具方法 ====================
  
  /**
   * 🛠️ 标准化评论数据
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
   * 🛠️ 生成评论唯一ID - 子类实现
   */
  protected abstract generateCommentId(rawComment: any): string;
  
  /**
   * 🛠️ 提取地域信息
   */
  protected extractRegion(rawComment: any): any {
    return rawComment.region || rawComment.location || undefined;
  }
  
  /**
   * 🛠️ 参数兼容性转换
   * 
   * 将统一参数转换为平台特定格式
   */
  protected convertParams(params: UnifiedCommentCollectionParams): any {
    const converted: any = {
      target: params.target,
      limit: params.limit
    };
    
    // 🔄 时间参数转换优先级
    if (params.time_range) {
      converted.since = params.time_range.start;
      converted.until = params.time_range.end;
    } else {
      if (params.since) converted.since = params.since;
      if (params.until) converted.until = params.until;
    }
    
    // 🔄 其他参数
    if (params.cursor) converted.cursor = params.cursor;
    if (params.include_replies !== undefined) converted.include_replies = params.include_replies;
    
    return converted;
  }
  
  /**
   * 🛠️ 结果兼容性转换
   * 
   * 将平台结果转换为统一格式
   */
  protected convertResult(
    result: any, 
    target: WatchTarget,
    collectedAt: Date = new Date()
  ): UnifiedCommentCollectionResult {
    return {
      comments: result.comments || [],
      total_count: result.total_count,
      has_more: result.has_more || false,
      next_cursor: result.next_cursor,
      collected_at: collectedAt,
      source_platform: this.platform,
      target_id: target.id,
      rate_limit_info: result.rate_limit_info
    };
  }
}

// ==================== 兼容性类型别名 ====================

/**
 * 🔄 向后兼容 - Application层类型别名
 */
export type CommentAdapter = UnifiedCommentAdapter;
export type CommentCollectionParams = UnifiedCommentCollectionParams;
export type CommentCollectionResult = UnifiedCommentCollectionResult;
export type AdapterStatus = UnifiedAdapterStatus;
export type PermissionValidationResult = UnifiedPermissionValidationResult;

/**
 * 🔄 向后兼容 - Modules层类型别名
 */
export type CommentCollectionAdapter = UnifiedCommentAdapterBase;

// ==================== 导出说明 ====================

// 🎯 所有接口和类型已在定义时直接导出
// 🔄 兼容性类型别名已定义，确保向后兼容
// 📦 使用时直接从本文件导入即可