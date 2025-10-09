/**
 * 统一类型适配器
 * 
 * 处理精准获客系统中新旧类型系统之间的转换
 * 确保向后兼容性的同时逐步迁移到新架构
 */

// 新系统类型（模块化）
import {
  WatchTarget as NewWatchTarget,
  Comment as NewComment,
  Task as NewTask,
  Platform,
  TargetType,
  SourceType,
  IndustryTag,
  RegionTag,
  TaskType,
  TaskStatus,
  TaskPriority,
  ExecutorMode,
  ResultCode,
  AuditAction
} from '../../modules/precise-acquisition/shared/types/core';

// 现有系统类型（应用层）
import {
  WatchTargetRow,
  WatchTargetPayload,
  TaskRow,
  TaskPayload,
  CommentRow,
  ReplyTemplateRow,
  TaskGenerationConfig
} from '../../types/precise-acquisition';

/**
 * 统一类型适配器 - 提供新旧类型系统的双向转换
 */
export class UnifiedTypeAdapter {
  
  // ==================== WatchTarget 转换 ====================
  
  /**
   * 新WatchTarget类型转数据库行格式
   */
  static newWatchTargetToRow(target: NewWatchTarget): WatchTargetRow {
    return {
      id: parseInt(target.id.replace('wt_', '')) || 0,
      dedup_key: this.generateDedupKey(target.platform, target.platform_id_or_url),
      target_type: target.target_type as any, // 类型映射
      platform: target.platform as any,
      id_or_url: target.platform_id_or_url,
      title: target.title || undefined,
      source: target.source as any,
      industry_tags: target.industry_tags?.join(';'),
      region: target.region_tag as any,
      notes: target.notes,
      created_at: target.created_at.toISOString(),
      updated_at: target.updated_at.toISOString()
    };
  }

  /**
   * 数据库行格式转新WatchTarget类型
   */
  static rowToNewWatchTarget(row: WatchTargetRow): NewWatchTarget {
    return {
      id: `wt_${row.id.toString().padStart(8, '0')}`,
      target_type: row.target_type as TargetType,
      platform: row.platform as Platform,
      platform_id_or_url: row.id_or_url,
      title: row.title,
      source: (row.source as SourceType) || SourceType.MANUAL,
      industry_tags: row.industry_tags ? 
        row.industry_tags.split(';').filter(Boolean) as IndustryTag[] : [],
      region_tag: row.region as RegionTag,
      last_fetch_at: row.last_fetch_at,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * WatchTarget载荷转新类型
   */
  static payloadToNewWatchTarget(payload: WatchTargetPayload): NewWatchTarget {
    const now = new Date();
    return {
      id: `wt_${Date.now().toString()}`, // 临时ID
      target_type: payload.target_type as TargetType,
      platform: payload.platform as Platform,
      platform_id_or_url: payload.id_or_url,
      title: payload.title,
      source: (payload.source as SourceType) || SourceType.MANUAL,
      industry_tags: payload.industry_tags ? 
        payload.industry_tags.split(';').filter(Boolean) as IndustryTag[] : [],
      region_tag: payload.region as RegionTag,
      notes: payload.notes,
      created_at: now,
      updated_at: now
    };
  }

  // ==================== Task 转换 ====================
  
  /**
   * 新Task类型转数据库行格式
   */
  static newTaskToRow(task: NewTask): TaskRow {
    return {
      id: parseInt(task.id.replace('tsk_', '')) || 0,
      task_type: task.task_type as any,
      comment_id: task.comment_id ? parseInt(task.comment_id.replace('cmt_', '')) : undefined,
      target_user_id: task.target_user_id,
      assign_account_id: task.assign_account_id,
      status: task.status as any,
      executor_mode: task.executor_mode as any,
      result_code: task.result_code as any,
      error_message: task.error_message,
      dedup_key: task.dedup_key,
      created_at: task.created_at,
      executed_at: task.executed_at
    };
  }

  /**
   * 数据库行格式转新Task类型
   */
  static rowToNewTask(row: TaskRow): NewTask {
    return {
      id: `tsk_${row.id.toString().padStart(8, '0')}`,
      task_type: row.task_type as TaskType,
      comment_id: row.comment_id ? `cmt_${row.comment_id.toString().padStart(8, '0')}` : undefined,
      target_user_id: row.target_user_id,
      assign_account_id: row.assign_account_id,
      status: row.status as TaskStatus,
      executor_mode: row.executor_mode as ExecutorMode,
      result_code: row.result_code as ResultCode,
      error_message: row.error_message,
      dedup_key: row.dedup_key,
      created_at: row.created_at,
      executed_at: row.executed_at
    };
  }

  // ==================== Comment 转换 ====================
  
  /**
   * 数据库行格式转新Comment类型
   */
  static rowToNewComment(row: CommentRow): NewComment {
    return {
      id: `cmt_${row.id.toString().padStart(8, '0')}`,
      platform: row.platform as Platform,
      video_id: row.video_id || row.target_id || '',
      author_id: row.author_id,
      content: row.content,
      like_count: row.like_count || 0,
      publish_time: row.publish_time,
      region: row.region as RegionTag,
      source_target_id: row.target_id ? `wt_${row.target_id.toString().padStart(8, '0')}` : '',
      inserted_at: row.created_at
    };
  }

  /**
   * 新Comment类型转数据库行格式
   */
  static newCommentToRow(comment: NewComment): CommentRow {
    return {
      id: parseInt(comment.id.replace('cmt_', '')) || 0,
      platform: comment.platform as any,
      video_id: comment.video_id,
      target_id: comment.source_target_id ? 
        parseInt(comment.source_target_id.replace('wt_', '')) : undefined,
      author_id: comment.author_id,
      content: comment.content,
      like_count: comment.like_count,
      publish_time: comment.publish_time,
      region: comment.region as any,
      created_at: comment.inserted_at
    };
  }

  // ==================== 工具方法 ====================
  
  /**
   * 生成去重键
   */
  private static generateDedupKey(platform: Platform, platformIdOrUrl: string): string {
    // 简单的哈希实现，避免依赖crypto
    let hash = 0;
    const str = `${platform}:${platformIdOrUrl}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16).substring(0, 16).padStart(16, '0');
  }

  /**
   * 验证新WatchTarget数据完整性
   */
  static validateNewWatchTarget(target: NewWatchTarget): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!target.id || !target.id.startsWith('wt_')) {
      errors.push('无效的目标ID格式');
    }
    
    if (!target.platform || !Object.values(Platform).includes(target.platform)) {
      errors.push('无效的平台类型');
    }
    
    if (!target.target_type || !Object.values(TargetType).includes(target.target_type)) {
      errors.push('无效的目标类型');
    }
    
    if (!target.platform_id_or_url) {
      errors.push('平台ID或URL不能为空');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证新Task数据完整性
   */
  static validateNewTask(task: NewTask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!task.id || !task.id.startsWith('tsk_')) {
      errors.push('无效的任务ID格式');
    }
    
    if (!task.task_type || !Object.values(TaskType).includes(task.task_type)) {
      errors.push('无效的任务类型');
    }
    
    if (!task.status || !Object.values(TaskStatus).includes(task.status)) {
      errors.push('无效的任务状态');
    }
    
    if (!task.dedup_key) {
      errors.push('缺少去重键');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 统一的任务生成配置接口
 * 兼容新旧系统的配置格式
 */
export interface UnifiedTaskGenerationConfig {
  // 基础筛选条件
  keywords: string[];
  exclude_keywords?: string[];
  min_like_count?: number;
  time_window_hours?: number;
  regions?: RegionTag[];
  
  // 任务限制
  max_tasks_per_account?: number;
  max_tasks_per_target?: number;
  
  // 优先级关键词
  priority_keywords?: string[];
  
  // 分配策略
  assignment_strategy?: 'round_robin' | 'load_balanced' | 'priority_first';
  
  // 频控配置
  rate_limit?: {
    hour_limit: number;
    day_limit: number;
    min_interval_seconds: number;
    max_interval_seconds: number;
  };
}

/**
 * 统一的配置转换工具
 */
export class ConfigAdapter {
  
  /**
   * 统一配置转旧系统格式
   */
  static toOldTaskGenerationConfig(config: UnifiedTaskGenerationConfig): TaskGenerationConfig {
    return {
      keywords: config.keywords,
      exclude_keywords: config.exclude_keywords,
      min_like_count: config.min_like_count,
      time_window_hours: config.time_window_hours,
      max_tasks_per_account: config.max_tasks_per_account,
      priority_keywords: config.priority_keywords
    };
  }
  
  /**
   * 旧配置转统一格式
   */
  static fromOldTaskGenerationConfig(config: TaskGenerationConfig): UnifiedTaskGenerationConfig {
    return {
      keywords: config.keywords,
      exclude_keywords: config.exclude_keywords,
      min_like_count: config.min_like_count,
      time_window_hours: config.time_window_hours,
      max_tasks_per_account: config.max_tasks_per_account,
      priority_keywords: config.priority_keywords,
      assignment_strategy: 'round_robin', // 默认值
      rate_limit: {
        hour_limit: 20,
        day_limit: 150,
        min_interval_seconds: 90,
        max_interval_seconds: 180
      }
    };
  }
}