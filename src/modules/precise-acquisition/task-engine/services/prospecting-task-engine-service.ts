// src/modules/precise-acquisition/task-engine/services/prospecting-task-engine-service.ts
// module: prospecting | layer: application | role: task-engine-service
// summary: 任务引擎服务统一门面（前缀化）

/**
 * 任务引擎服务 - 统一门面
 * 
 * 整合任务生成、查询和管理功能
 */

import { Task, TaskStatus } from '../../shared/types/core';
import { 
  TaskGenerationConfig, 
  TaskGenerationResult, 
  BatchTaskGenerationConfig,
  TaskQuery,
  TaskExecutionStats,
  TaskAssignmentResult,
  TaskExecutionContext
} from '../types';
import { TaskGenerator } from './TaskGenerator';
import { TaskQueryService } from './prospecting-task-query-service';
import { ProspectingTaskManager } from './prospecting-task-manager';
import { ProspectingTaskExecutorService, TaskExecutionResult } from './prospecting-task-executor-service';

export class ProspectingTaskEngineService {
  private taskGenerator = new TaskGenerator();
  private taskQueryService = new TaskQueryService();
  private taskManager = new ProspectingTaskManager();
  private taskExecutor = new ProspectingTaskExecutorService();

  // === 任务生成接口 ===

  /**
   * 生成任务
   */
  async generateTasks(config: TaskGenerationConfig): Promise<TaskGenerationResult> {
    return this.taskGenerator.generateTasks(config);
  }

  /**
   * 批量生成任务
   */
  async batchGenerateTasks(config: BatchTaskGenerationConfig): Promise<TaskGenerationResult[]> {
    return this.taskGenerator.batchGenerateTasks(config);
  }

  // === 任务查询接口 ===

  /**
   * 查询任务列表
   */
  async getTasks(query: TaskQuery): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    page_size: number;
  }> {
    return this.taskQueryService.getTasks(query);
  }

  /**
   * 查询任务列表 (别名方法，向后兼容)
   */
  async queryTasks(query: TaskQuery): Promise<Task[]> {
    const result = await this.taskQueryService.getTasks(query);
    return result.tasks;
  }

  /**
   * 执行单个任务
   */
  async executeTask(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.taskExecutor.executeTask(context);
  }

  /**
   * 获取任务执行统计
   */
  async getExecutionStats(since?: Date): Promise<TaskExecutionStats> {
    return this.taskQueryService.getExecutionStats(since);
  }

  /**
   * 获取单个任务详情
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    return this.taskQueryService.getTaskById(taskId);
  }

  /**
   * 获取指定设备的可分配任务
   */
  async getAssignableTasks(deviceId: string, limit: number = 10): Promise<Task[]> {
    return this.taskQueryService.getAssignableTasks(deviceId, limit);
  }

  /**
   * 统计任务数量
   */
  async countTasks(query: Partial<TaskQuery>): Promise<number> {
    return this.taskQueryService.countTasks(query);
  }

  // === 任务管理接口 ===

  /**
   * 分配任务给设备
   */
  async assignTasksToDevice(deviceId: string, taskIds: string[]): Promise<TaskAssignmentResult> {
    return this.taskManager.assignTasksToDevice(deviceId, taskIds);
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, errorMessage?: string): Promise<void> {
    return this.taskManager.updateTaskStatus(taskId, status, errorMessage);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string, reason?: string): Promise<void> {
    return this.taskManager.cancelTask(taskId, reason);
  }

  /**
   * 重试失败的任务
   */
  async retryFailedTask(taskId: string): Promise<void> {
    return this.taskManager.retryFailedTask(taskId);
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
    return this.taskManager.batchUpdateTaskStatus(updates);
  }

  /**
   * 获取任务执行上下文
   */
  async getTaskExecutionContext(taskId: string): Promise<TaskExecutionContext | null> {
    return this.taskManager.getTaskExecutionContext(taskId);
  }

  // === 便捷方法 ===

  /**
   * 获取最近的失败任务
   */
  async getRecentFailedTasks(limit: number = 20): Promise<Task[]> {
    return this.taskQueryService.getRecentFailedTasks(limit);
  }

  /**
   * 获取待重试的任务
   */
  async getRetryableTasks(limit: number = 50): Promise<Task[]> {
    return this.taskQueryService.getRetryableTasks(limit);
  }

  /**
   * 清理已完成的任务
   */
  async cleanupCompletedTasks(olderThanDays: number = 30): Promise<number> {
    return this.taskManager.cleanupCompletedTasks(olderThanDays);
  }
}

// 导出单例实例
export const taskEngineService = new ProspectingTaskEngineService();

// 导出类型和子服务
export * from '../types';
export { TaskGenerator } from './TaskGenerator';
export { TaskQueryService } from './prospecting-task-query-service';
export { ProspectingTaskManager as TaskManager } from './prospecting-task-manager';