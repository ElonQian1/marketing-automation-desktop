// src/modules/precise-acquisition/task-engine/services/TaskQueryService.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 任务查询器
 * 
 * 负责任务的查询和筛选
 */

import { invoke } from '@tauri-apps/api/core';
import { Task } from '../../shared/types/core';
import { TaskQuery, TaskExecutionStats } from '../types';

export class TaskQueryService {
  /**
   * 查询任务列表
   */
  async getTasks(query: TaskQuery): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    page_size: number;
  }> {
    try {
      const result = await invoke<{
        tasks: any[];
        total: number;
        page: number;
        page_size: number;
      }>('query_tasks', {
        status: query.status || null,
        task_type: query.task_type || null,
        platform: query.platform || null,
        assigned_device_id: query.assigned_device_id || null,
        priority: query.priority || null,
        created_since: query.created_since?.toISOString() || null,
        created_before: query.created_before?.toISOString() || null,
        limit: query.limit || 50,
        offset: query.offset || 0,
        order_by: query.order_by || 'created_at',
        order_direction: query.order_direction || 'desc'
      });

      return {
        tasks: result.tasks.map(this.mapDatabaseRowToTask),
        total: result.total,
        page: Math.floor((query.offset || 0) / (query.limit || 50)) + 1,
        page_size: query.limit || 50
      };

    } catch (error) {
      console.error('Failed to query tasks:', error);
      throw error;
    }
  }

  /**
   * 获取任务执行统计
   */
  async getExecutionStats(since?: Date): Promise<TaskExecutionStats> {
    try {
      const stats = await invoke<TaskExecutionStats>('get_task_execution_stats', {
        since: since?.toISOString() || null
      });

      return stats;

    } catch (error) {
      console.error('Failed to get execution stats:', error);
      throw error;
    }
  }

  /**
   * 获取单个任务详情
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const taskData = await invoke<any>('get_task_by_id', { task_id: taskId });
      
      if (!taskData) {
        return null;
      }

      return this.mapDatabaseRowToTask(taskData);

    } catch (error) {
      console.error('Failed to get task by id:', error);
      return null;
    }
  }

  /**
   * 获取指定设备的可分配任务
   */
  async getAssignableTasks(deviceId: string, limit: number = 10): Promise<Task[]> {
    try {
      const tasks = await invoke<any[]>('get_assignable_tasks', {
        device_id: deviceId,
        limit
      });

      return tasks.map(this.mapDatabaseRowToTask);

    } catch (error) {
      console.error('Failed to get assignable tasks:', error);
      return [];
    }
  }

  /**
   * 统计任务数量（按条件）
   */
  async countTasks(query: Partial<TaskQuery>): Promise<number> {
    try {
      const count = await invoke<number>('count_tasks', {
        status: query.status || null,
        task_type: query.task_type || null,
        platform: query.platform || null,
        assigned_device_id: query.assigned_device_id || null,
        created_since: query.created_since?.toISOString() || null,
        created_before: query.created_before?.toISOString() || null
      });

      return count;

    } catch (error) {
      console.error('Failed to count tasks:', error);
      return 0;
    }
  }

  /**
   * 获取最近的失败任务
   */
  async getRecentFailedTasks(limit: number = 20): Promise<Task[]> {
    try {
      const tasks = await invoke<any[]>('get_recent_failed_tasks', { limit });
      return tasks.map(this.mapDatabaseRowToTask);

    } catch (error) {
      console.error('Failed to get recent failed tasks:', error);
      return [];
    }
  }

  /**
   * 获取待重试的任务
   */
  async getRetryableTasks(limit: number = 50): Promise<Task[]> {
    try {
      const tasks = await invoke<any[]>('get_retryable_tasks', { limit });
      return tasks.map(this.mapDatabaseRowToTask);

    } catch (error) {
      console.error('Failed to get retryable tasks:', error);
      return [];
    }
  }

  // === 私有方法 ===

  private mapDatabaseRowToTask(row: any): Task {
    return {
      id: row.id,
      task_type: row.task_type,
      platform: row.platform,
      status: row.status,
      priority: row.priority,
      target_id: row.target_id,
      target_user_id: row.target_user_id,
      target_comment_id: row.target_comment_id,
      assigned_device_id: row.assigned_device_id,
      retry_count: row.retry_count || 0,
      max_retries: row.max_retries || 3,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      scheduled_time: row.scheduled_time ? new Date(row.scheduled_time) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      error_message: row.error_message,
    };
  }
}