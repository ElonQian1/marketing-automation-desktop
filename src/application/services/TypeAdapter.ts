/**
 * 精准获客类型适配器
 * 
 * 处理新旧类型系统之间的转换，确保兼容性
 */

// 旧系统类型（domain entities）
import { WatchTarget as OldWatchTarget } from '../../domain/precise-acquisition/entities/WatchTarget';
import { Comment as OldComment } from '../../domain/precise-acquisition/entities/Comment';
import { Task as OldTask } from '../../domain/precise-acquisition/entities/Task';

// 新系统类型（模块化）
import {
  WatchTarget as NewWatchTarget,
  Comment as NewComment,
  Task as NewTask,
  Platform,
  TaskType,
  TaskStatus,
  TaskPriority
} from '../../modules/precise-acquisition/shared/types/core';

/**
 * 类型适配器
 */
export class TypeAdapter {
  /**
   * 将旧的WatchTarget转换为新的
   */
  static adaptWatchTargetToNew(oldTarget: OldWatchTarget): NewWatchTarget {
    return {
      id: oldTarget.id?.toString() || '', // 转换为string
      platform: oldTarget.platform as Platform,
      target_type: oldTarget.targetType, // 修正属性名
      target_id: oldTarget.idOrUrl,
      title: oldTarget.title || '',
      notes: oldTarget.notes || '',
      industry_tags: oldTarget.industryTags || [], // 修正属性名
      region: oldTarget.region || '',
      created_at: oldTarget.createdAt?.toISOString() || new Date().toISOString(), // 修正属性名
      updated_at: oldTarget.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * 将新的WatchTarget转换为旧的
   */
  static adaptWatchTargetToOld(newTarget: NewWatchTarget): Promise<OldWatchTarget> {
    return Promise.resolve(OldWatchTarget.create({
      targetType: newTarget.target_type,
      platform: newTarget.platform,
      idOrUrl: newTarget.target_id,
      title: newTarget.title,
      notes: newTarget.notes,
      industryTags: newTarget.industry_tags as any,
      region: newTarget.region as any
    }));
  }

  /**
   * 将旧的Comment转换为新的
   */
  static adaptCommentToNew(oldComment: OldComment): NewComment {
    return {
      id: oldComment.id || '',
      platform: oldComment.platform as Platform,
      video_id: oldComment.videoId, // 修正属性名
      author_id: oldComment.authorId, // 修正属性名
      content: oldComment.content,
      like_count: oldComment.likeCount || 0, // 修正属性名
      publish_time: oldComment.publishTime?.toISOString() || new Date().toISOString(), // 修正属性名
      region: oldComment.region || '',
      source_target_id: oldComment.sourceTargetId, // 修正属性名
      created_at: oldComment.insertedAt?.toISOString() || new Date().toISOString(),
      updated_at: oldComment.insertedAt?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * 将新的Comment转换为旧的
   */
  static adaptCommentToOld(newComment: NewComment): Comment {
    return OldComment.create({
      platform: newComment.platform,
      videoId: newComment.video_id,
      authorId: newComment.author_id,
      content: newComment.content,
      likeCount: newComment.like_count,
      publishTime: new Date(newComment.publish_time),
      region: newComment.region as any,
      sourceTargetId: newComment.source_target_id
    });
  }

  /**
   * 将旧的Task转换为新的
   */
  static adaptTaskToNew(oldTask: OldTask): NewTask {
    return {
      id: oldTask.id || '',
      task_type: oldTask.taskType as TaskType, // 修正属性名
      platform: 'xiaohongshu' as Platform, // 默认平台
      status: oldTask.status as TaskStatus,
      priority: 'normal' as TaskPriority, // 数字转为字符串枚举
      target_id: oldTask.targetUserId || '',
      assigned_device_id: oldTask.assignAccountId,
      created_at: oldTask.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: oldTask.executedAt?.toISOString() || new Date().toISOString(),
      scheduled_time: oldTask.deadlineAt?.toISOString(),
      error_message: oldTask.errorMessage,
      retry_count: oldTask.attempts || 0,
      metadata: { executor_mode: oldTask.executorMode }
    };
  }

  /**
   * 将新的Task转换为旧的
   */
  static adaptTaskToOld(newTask: NewTask): Task {
    if (newTask.task_type === 'reply') {
      return OldTask.createReplyTask({
        commentId: newTask.target_id,
        assignAccountId: newTask.assigned_device_id || 'default',
        executorMode: (newTask.metadata?.executor_mode as any) || 'api'
      });
    } else {
      return OldTask.createFollowTask({
        targetUserId: newTask.target_id,
        assignAccountId: newTask.assigned_device_id || 'default',
        executorMode: (newTask.metadata?.executor_mode as any) || 'api'
      });
    }
  }
}

/**
 * 统一的任务生成配置接口
 */
export interface UnifiedTaskGenerationConfig {
  // 基本配置
  target?: OldWatchTarget;
  max_tasks_per_target?: number;
  task_types?: TaskType[];
  priority?: string;
  
  // 设备和分配
  device_id?: string;
  assignment_strategy?: string;
  
  // 时间相关
  time_window_hours?: number;
  schedule_delay_hours?: number;
  
  // 检查开关
  require_dedup_check?: boolean;
  require_rate_limit_check?: boolean;
  
  // 筛选条件
  keywords?: string[];
  exclude_keywords?: string[];
  min_like_count?: number;
  regions?: string[];
}