// src/modules/precise-acquisition/task-engine/services/TaskGenerator.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 任务生成器
 * 
 * 负责根据配置生成任务
 */

import { invoke } from '@tauri-apps/api/core';
import { Task, WatchTarget, Comment, TaskType, TaskPriority, TaskStatus } from '../../shared/types/core';
import { generateId } from '../../shared/utils';
import { TaskGenerationConfig, TaskGenerationResult, BatchTaskGenerationConfig } from '../types';

export class TaskGenerator {
  /**
   * 生成任务
   */
  async generateTasks(config: TaskGenerationConfig): Promise<TaskGenerationResult> {
    try {
      const tasks: Task[] = [];
      const generationTime = new Date();

      // 根据任务类型生成对应的任务
      for (const taskType of config.task_types) {
        const typeTasks = await this.generateTasksByType(
          config.target,
          taskType,
          config.max_tasks_per_target,
          config.priority
        );
        tasks.push(...typeTasks);
      }

      // 限制任务数量
      const limitedTasks = tasks.slice(0, config.max_tasks_per_target);

      // 保存任务到数据库
      await this.saveTasks(limitedTasks);

      const result: TaskGenerationResult = {
        generated_tasks: limitedTasks,
        total_count: limitedTasks.length,
        target_id: config.target.id!,
        generation_time: generationTime,
        estimated_completion_time: this.estimateCompletionTime(limitedTasks)
      };

      // 记录任务生成日志
      await this.logTaskGeneration(result);

      return result;

    } catch (error) {
      console.error('Task generation failed:', error);
      throw error;
    }
  }

  /**
   * 批量生成任务
   */
  async batchGenerateTasks(config: BatchTaskGenerationConfig): Promise<TaskGenerationResult[]> {
    const results: TaskGenerationResult[] = [];

    if (config.parallel_processing) {
      // 并行处理
      const promises = config.targets.map((target, index) => {
        const taskConfig: TaskGenerationConfig = {
          ...config.config,
          target
        };
        return this.generateTasks(taskConfig);
      });

      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to generate tasks for target ${index}:`, result.reason);
        }
      });

    } else {
      // 串行处理
      for (let i = 0; i < config.targets.length; i++) {
        try {
          const target = config.targets[i];
          const taskConfig: TaskGenerationConfig = {
            ...config.config,
            target
          };
          const result = await this.generateTasks(taskConfig);
          results.push(result);

          // 批量处理间隔
          if (i < config.targets.length - 1) {
            await this.delay(1000); // 1秒间隔
          }
        } catch (error) {
          console.error(`Failed to generate tasks for target ${i}:`, error);
        }
      }
    }

    return results;
  }

  // === 私有方法 ===

  private async generateTasksByType(
    target: WatchTarget,
    taskType: TaskType,
    maxTasks: number,
    priority: TaskPriority
  ): Promise<Task[]> {
    const tasks: Task[] = [];

    switch (taskType) {
      case TaskType.FOLLOW:
        tasks.push(this.createFollowTask(target, priority));
        break;
      
      case TaskType.REPLY:
        // 对于回复任务，需要评论数据
        // 这里可以扩展为从评论服务获取相关评论
        const replyTask = this.createReplyTask(target, priority);
        tasks.push(replyTask);
        break;
      
      case TaskType.LIKE:
        tasks.push(this.createLikeTask(target, priority));
        break;
      
      default:
        console.warn(`Unsupported task type: ${taskType}`);
    }

    return tasks.slice(0, maxTasks);
  }

  private createFollowTask(target: WatchTarget, priority: TaskPriority): Task {
    return {
      id: generateId('task'),
      task_type: TaskType.FOLLOW,
      platform: target.platform,
      status: TaskStatus.NEW,
      priority,
      target_id: target.id,
      target_user_id: target.platform_id_or_url,
      assigned_device_id: undefined,
      retry_count: 0,
      max_retries: 3,
      created_at: new Date(),
      updated_at: new Date(),
      scheduled_time: new Date(),
    };
  }

  private createReplyTask(target: WatchTarget, priority: TaskPriority): Task {
    return {
      id: generateId('task'),
      task_type: TaskType.REPLY,
      platform: target.platform,
      status: TaskStatus.NEW,
      priority,
      target_id: target.id,
      target_user_id: target.platform_id_or_url,
      assigned_device_id: undefined,
      retry_count: 0,
      max_retries: 3,
      created_at: new Date(),
      updated_at: new Date(),
      scheduled_time: new Date(),
    };
  }

  private createLikeTask(target: WatchTarget, priority: TaskPriority): Task {
    return {
      id: generateId('task'),
      task_type: TaskType.LIKE,
      platform: target.platform,
      status: TaskStatus.NEW,
      priority,
      target_id: target.id,
      target_user_id: target.platform_id_or_url,
      assigned_device_id: undefined,
      retry_count: 0,
      max_retries: 3,
      created_at: new Date(),
      updated_at: new Date(),
      scheduled_time: new Date(),
    };
  }

  private async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await invoke('plugin:prospecting|save_tasks_batch', { tasks });
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }

  private estimateCompletionTime(tasks: Task[]): Date {
    // 基于任务数量和类型估算完成时间
    const averageTaskDuration = 30000; // 30秒每任务
    const totalEstimatedMs = tasks.length * averageTaskDuration;
    return new Date(Date.now() + totalEstimatedMs);
  }

  private async logTaskGeneration(result: TaskGenerationResult): Promise<void> {
    try {
      await invoke('plugin:prospecting|log_task_generation', {
        target_id: result.target_id,
        task_count: result.total_count,
        generation_time: result.generation_time.toISOString()
      });
    } catch (error) {
      console.error('Failed to log task generation:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}