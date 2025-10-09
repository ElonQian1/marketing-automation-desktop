/**
 * 任务引擎 - 类型定义
 */

import { Task, TaskStatus, TaskType, WatchTarget, Comment, Platform, TaskPriority, TaskAssignmentStrategy } from '../../shared/types/core';

/**
 * 任务生成配置
 */
export interface TaskGenerationConfig {
  target: WatchTarget;
  max_tasks_per_target: number;
  task_types: TaskType[];
  priority: TaskPriority;
  assignment_strategy: TaskAssignmentStrategy;
  schedule_delay_hours?: number;
  required_device_count?: number;
}

/**
 * 任务生成结果
 */
export interface TaskGenerationResult {
  generated_tasks: Task[];
  total_count: number;
  target_id: string;
  generation_time: Date;
  estimated_completion_time?: Date;
}

/**
 * 任务批量生成配置
 */
export interface BatchTaskGenerationConfig {
  targets: WatchTarget[];
  comments_per_target: Comment[][];
  config: Omit<TaskGenerationConfig, 'target'>;
  parallel_processing: boolean;
  batch_size: number;
}

/**
 * 任务执行统计
 */
export interface TaskExecutionStats {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
  success_rate: number;
  average_execution_time_ms: number;
  by_platform: Record<Platform, {
    total: number;
    completed: number;
    failed: number;
    success_rate: number;
  }>;
  by_task_type: Record<TaskType, {
    total: number;
    completed: number;
    failed: number;
    success_rate: number;
  }>;
  recent_failures: Array<{
    task_id: string;
    task_type: TaskType;
    platform: Platform;
    error_message: string;
    failed_at: Date;
  }>;
}

/**
 * 任务查询条件
 */
export interface TaskQuery {
  status?: TaskStatus[];
  task_type?: TaskType[];
  platform?: Platform[];
  assigned_device_id?: string[];
  priority?: TaskPriority[];
  created_since?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'priority' | 'updated_at';
  order_direction?: 'asc' | 'desc';
}

/**
 * 任务分配结果
 */
export interface TaskAssignmentResult {
  assigned_tasks: Task[];
  device_id: string;
  assignment_time: Date;
  estimated_completion_time: Date;
}

/**
 * 任务执行上下文
 */
export interface TaskExecutionContext {
  task: Task;
  device_id: string;
  execution_start: Date;
  timeout_ms: number;
  retry_count: number;
  max_retries: number;
}