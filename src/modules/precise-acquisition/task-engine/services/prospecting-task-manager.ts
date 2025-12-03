// src/modules/precise-acquisition/task-engine/services/prospecting-task-manager.ts
// module: prospecting | layer: application | role: task-manager-service
// summary: 任务管理器服务（前缀化）

/**
 * 任务管理器
 * 
 * 负责任务的状态管理、取消、重试等操作
 */

import { invoke } from '@tauri-apps/api/core';
import { Task, TaskStatus, TaskType, Platform, TaskPriority } from '../../shared/types/core';
import { TaskAssignmentResult, TaskExecutionContext } from '../types';

export class ProspectingTaskManager {
  /**
   * 分配任务给设备
   */
  async assignTasksToDevice(
    deviceId: string, 
    taskIds: string[]
  ): Promise<TaskAssignmentResult> {
    try {
      const assignmentTime = new Date();
      
      // 更新任务状态为已分配
      await invoke('plugin:prospecting|assign_tasks_to_device', {
        deviceId: deviceId,
        taskIds: taskIds,
        assignedAt: assignmentTime.toISOString()
      });

      // 获取已分配的任务详情
      const assignedTasks = await this.getTasksByIds(taskIds);

      return {
        assigned_tasks: assignedTasks,
        device_id: deviceId,
        assignment_time: assignmentTime,
        estimated_completion_time: this.calculateEstimatedCompletion(assignedTasks)
      };

    } catch (error) {
      console.error('Failed to assign tasks to device:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    errorMessage?: string
  ): Promise<void> {
    try {
      await invoke('plugin:prospecting|update_task_status', {
        taskId: taskId,
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date().toISOString()
      });

      // 如果任务失败，处理失败逻辑
      if (status === TaskStatus.FAILED) {
        await this.handleTaskFailure(taskId);
      }

    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string, reason?: string): Promise<void> {
    try {
      await invoke('plugin:prospecting|cancel_task', {
        taskId: taskId,
        reason: reason || 'User cancelled',
        cancelledAt: new Date().toISOString()
      });

      console.log(`Task ${taskId} cancelled: ${reason}`);

    } catch (error) {
      console.error('Failed to cancel task:', error);
      throw error;
    }
  }

  /**
   * 重试失败的任务
   */
  async retryFailedTask(taskId: string): Promise<void> {
    try {
      // 重置任务状态和错误信息
      await invoke('plugin:prospecting|retry_failed_task', {
        task_id: taskId,
        reset_at: new Date().toISOString()
      });

      console.log(`Task ${taskId} queued for retry`);

    } catch (error) {
      console.error('Failed to retry task:', error);
      throw error;
    }
  }

  /**
   * 批量更新任务状态
   */
  async batchUpdateTaskStatus(
    updates: Array<{
      task_id: string;
      status: TaskStatus;
      error_message?: string;
    }>
  ): Promise<void> {
    try {
      await invoke('plugin:prospecting|batch_update_task_status', {
        updates: updates.map(update => ({
          ...update,
          updated_at: new Date().toISOString()
        }))
      });

    } catch (error) {
      console.error('Failed to batch update task status:', error);
      throw error;
    }
  }

  /**
   * 清理已完成的任务
   */
  async cleanupCompletedTasks(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await invoke<number>('cleanup_completed_tasks', {
        older_than: cutoffDate.toISOString()
      });

      console.log(`Cleaned up ${deletedCount} completed tasks`);
      return deletedCount;

    } catch (error) {
      console.error('Failed to cleanup completed tasks:', error);
      return 0;
    }
  }

  /**
   * 获取任务执行上下文
   */
  async getTaskExecutionContext(taskId: string): Promise<TaskExecutionContext | null> {
    try {
      const task = await this.getTaskById(taskId);
      if (!task || !task.assigned_device_id) {
        return null;
      }

      return {
        task,
        device_id: task.assigned_device_id,
        execution_start: new Date(),
        timeout_ms: this.getTaskTimeout(task),
        retry_count: task.retry_count || 0,
        max_retries: this.getMaxRetries(task)
      };

    } catch (error) {
      console.error('Failed to get task execution context:', error);
      return null;
    }
  }

  // === 私有方法 ===

  private async getTasksByIds(taskIds: string[]): Promise<Task[]> {
    try {
      const tasks = await invoke<Task[]>('get_tasks_by_ids', { task_ids: taskIds });
      return tasks;
    } catch (error) {
      console.error('Failed to get tasks by ids:', error);
      return [];
    }
  }

  private async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const taskData = await invoke<Task>('get_task_by_id', { task_id: taskId });
      return taskData || null;
    } catch (error) {
      console.error('Failed to get task by id:', error);
      return null;
    }
  }

  private calculateEstimatedCompletion(tasks: Task[]): Date {
    // 基于任务类型和数量估算完成时间
    const baseTaskDuration = 30000; // 30秒基础时间
    const totalEstimatedMs = tasks.length * baseTaskDuration;
    return new Date(Date.now() + totalEstimatedMs);
  }

  private async handleTaskFailure(taskId: string): Promise<void> {
    try {
      // 记录失败日志
      await invoke('plugin:prospecting|log_task_failure', {
        task_id: taskId,
        failed_at: new Date().toISOString()
      });

      // 这里可以添加更多失败处理逻辑，如通知、重试队列等

    } catch (error) {
      console.error('Failed to handle task failure:', error);
    }
  }

  private getTaskTimeout(task: Task): number {
    // 根据任务类型返回不同的超时时间
    switch (task.task_type) {
      case 'follow': return 60000; // 1分钟
      case 'reply': return 120000; // 2分钟
      case 'like': return 30000; // 30秒
      default: return 60000;
    }
  }

  private getMaxRetries(task: Task): number {
    // 根据任务类型返回最大重试次数
    switch (task.task_type) {
      case 'follow': return 3;
      case 'reply': return 2;
      case 'like': return 3;
      default: return 2;
    }
  }

  private mapDatabaseRowToTask(row: Record<string, unknown>): Task {
    return {
      id: row.id as string,
      task_type: row.task_type as TaskType,
      platform: row.platform as Platform,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      target_id: row.target_id as string, // 添加缺失字段
      target_user_id: row.target_user_id as string,
      assigned_device_id: row.assigned_device_id as string,
      max_retries: (row.max_retries as number) || 3, // 添加缺失字段，默认3次
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
      scheduled_time: row.scheduled_time ? new Date(row.scheduled_time as string) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at as string) : undefined,
      error_message: row.error_message as string,
      retry_count: (row.retry_count as number) || 0,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {}
    };
  }
}