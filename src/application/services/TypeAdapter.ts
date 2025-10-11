// src/application/services/TypeAdapter.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客类型适配器 v4.0
 * 
 * 简化的类型适配器，专注于现有类型间的安全转换
 * 避免创建不必要的中间标准格式，直接使用现有类型定义
 */

// 现有系统类型
import {
  WatchTargetRow,
  WatchTargetPayload,
  TaskRow,
  TaskPayload,
  CommentRow,
  ReplyTemplateRow,
  TaskGenerationConfig
} from '../../types/precise-acquisition';

// 现有枚举类型
import {
  Platform,
  TargetType,
  TaskStatus,
  TaskType,
  ExecutorMode,
  SourceType
} from '../../constants/precise-acquisition-enums';

/**
 * 简化的类型适配器
 * 
 * 专注于现有数据类型间的安全转换和格式化
 */
export class TypeAdapter {
  
  // ========== WatchTarget 相关转换 ==========
  
  /**
   * 创建 WatchTarget 载荷的默认值
   */
  static createWatchTargetPayload(data: Partial<WatchTargetPayload> & {
    target_type: TargetType;
    platform: Platform;
    id_or_url: string;
  }): WatchTargetPayload {
    return {
      dedup_key: data.dedup_key || `${data.platform}_${data.target_type}_${data.id_or_url}`,
      target_type: data.target_type,
      platform: data.platform,
      id_or_url: data.id_or_url,
      title: data.title,
      source: data.source || SourceType.MANUAL,
      industry_tags: data.industry_tags,
      region: data.region,
      notes: data.notes
    };
  }

  /**
   * 从 WatchTargetRow 提取显示信息
   */
  static extractWatchTargetDisplay(row: WatchTargetRow) {
    return {
      id: row.id,
      displayName: row.title || row.id_or_url,
      platform: row.platform,
      targetType: row.target_type,
      createdAt: row.created_at,
      tags: row.industry_tags?.split(';').filter(Boolean) || [],
      region: row.region
    };
  }

  // ========== Task 相关转换 ==========

  /**
   * 创建关注任务载荷
   */
  static createFollowTaskPayload(config: {
    target_user_id: string;
    assign_account_id: string;
    executor_mode?: ExecutorMode;
    priority?: number;
    deadline_at?: string;
  }): TaskPayload {
    return {
      task_type: TaskType.FOLLOW,
      target_user_id: config.target_user_id,
      assign_account_id: config.assign_account_id,
      executor_mode: config.executor_mode || ExecutorMode.API,
      dedup_key: `follow_${config.target_user_id}_${config.assign_account_id}_${Date.now()}`,
      priority: config.priority || 2,
      deadline_at: config.deadline_at
    };
  }

  /**
   * 创建回复任务载荷
   */
  static createReplyTaskPayload(config: {
    comment_id: string;
    assign_account_id: string;
    executor_mode?: ExecutorMode;
    priority?: number;
    deadline_at?: string;
  }): TaskPayload {
    return {
      task_type: TaskType.REPLY,
      comment_id: config.comment_id,
      assign_account_id: config.assign_account_id,
      executor_mode: config.executor_mode || ExecutorMode.API,
      dedup_key: `reply_${config.comment_id}_${config.assign_account_id}_${Date.now()}`,
      priority: config.priority || 2,
      deadline_at: config.deadline_at
    };
  }

  /**
   * 从 TaskRow 提取显示信息
   */
  static extractTaskDisplay(row: TaskRow) {
    return {
      id: row.id,
      type: row.task_type,
      status: row.status,
      priority: row.priority,
      targetId: row.target_user_id || row.comment_id || 'unknown',
      assignedTo: row.assign_account_id,
      createdAt: row.created_at,
      executedAt: row.executed_at,
      attempts: row.attempts,
      error: row.error_message,
      isOverdue: row.deadline_at ? new Date(row.deadline_at) < new Date() : false
    };
  }

  // ========== Comment 相关转换 ==========

  /**
   * 从 CommentRow 提取显示信息
   */
  static extractCommentDisplay(row: CommentRow) {
    return {
      id: row.id,
      platform: row.platform,
      authorId: row.author_id,
      content: row.content,
      likeCount: row.like_count || 0,
      publishTime: row.publish_time,
      region: row.region,
      insertedAt: row.inserted_at,
      videoId: row.video_id,
      sourceTargetId: row.source_target_id
    };
  }

  // ========== 工具方法 ==========

  /**
   * 安全的JSON解析
   */
  static parseJsonSafely<T = any>(value?: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  /**
   * 格式化日期为ISO字符串
   */
  static formatDate(value: string | Date | null | undefined): string {
    if (!value) return new Date().toISOString();
    if (typeof value === 'string') return value;
    return value.toISOString();
  }

  /**
   * 检查任务状态是否为最终状态
   */
  static isTaskCompleted(status: TaskStatus): boolean {
    return [
      TaskStatus.DONE,
      TaskStatus.COMPLETED,
      TaskStatus.FAILED,
      TaskStatus.CANCELLED
    ].includes(status);
  }

  /**
   * 检查任务状态是否为进行中
   */
  static isTaskInProgress(status: TaskStatus): boolean {
    return [
      TaskStatus.PENDING,
      TaskStatus.EXECUTING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.RETRY
    ].includes(status);
  }

  /**
   * 获取任务状态的显示文本
   */
  static getTaskStatusDisplay(status: TaskStatus): string {
    const statusMap: Record<TaskStatus, string> = {
      [TaskStatus.NEW]: '新建',
      [TaskStatus.READY]: '就绪',
      [TaskStatus.PENDING]: '待执行',
      [TaskStatus.EXECUTING]: '执行中',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.DONE]: '已完成',
      [TaskStatus.COMPLETED]: '完成',
      [TaskStatus.FAILED]: '失败',
      [TaskStatus.CANCELLED]: '已取消',
      [TaskStatus.RETRY]: '重试'
    };
    return statusMap[status] || status;
  }

  /**
   * 获取平台的显示文本
   */
  static getPlatformDisplay(platform: Platform): string {
    const platformMap: Record<Platform, string> = {
      [Platform.DOUYIN]: '抖音',
      [Platform.OCEANENGINE]: '巨量引擎',
      [Platform.PUBLIC]: '公开来源',
      [Platform.XIAOHONGSHU]: '小红书'
    };
    return platformMap[platform] || platform;
  }
}

/**
 * 任务批量生成配置
 */
export interface BatchTaskGenerationConfig {
  targets: WatchTargetRow[];
  taskTypes: TaskType[];
  assignAccountId: string;
  executorMode: ExecutorMode;
  priority: number;
  timeWindowHours?: number;
  maxTasksPerTarget?: number;
}