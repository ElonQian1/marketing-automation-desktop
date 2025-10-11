// src/application/services/task-execution/UnifiedTaskEngine.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 统一任务引擎接口
 * 
 * 🎯 目标：整合 application 和 modules 层的任务引擎接口
 * 🔄 策略：保留两者的最佳特性，确保向后兼容
 * 📅 创建：任务引擎架构整合阶段
 */

import { Task, WatchTarget, Platform } from '../../../modules/precise-acquisition/shared/types/core';
import { TaskStatus, TaskType } from '../../../constants/precise-acquisition-enums';

// ==================== 核心接口定义 ====================

/**
 * 🎯 统一任务生成参数
 * 
 * 合并了两个系统的参数选项：
 * - Application层: 执行策略、设备分配
 * - Modules层: 目标配置、批量生成
 */
export interface UnifiedTaskGenerationParams {
  target: WatchTarget;
  max_tasks_per_target?: number;
  task_types: TaskType[];
  priority: TaskPriority;
  
  // 🔄 执行策略 (来自Application层)
  execution_strategy?: ExecutionStrategy;
  
  // 🔄 分配策略 (来自Modules层)
  assignment_strategy?: TaskAssignmentStrategy;
  
  // 🆕 调度选项
  schedule_delay_hours?: number;
  required_device_count?: number;
}

/**
 * 🎯 统一任务生成结果
 * 
 * 合并了两个系统的结果字段
 */
export interface UnifiedTaskGenerationResult {
  generated_tasks: Task[];
  total_count: number;
  target_id: string;
  generation_time: Date;
  
  // 🆕 增强信息 (来自Application层)
  assignment_results?: TaskAssignment[];
  estimated_completion_time?: Date;
  
  // 🆕 统计信息 (来自Modules层)
  tasks_by_type: Record<TaskType, number>;
  priority_distribution: Record<TaskPriority, number>;
}

/**
 * 🎯 统一任务执行参数
 * 
 * 整合执行引擎的完整上下文
 */
export interface UnifiedTaskExecutionParams {
  task: Task;
  device?: Device;
  account?: Account;
  
  // 🔄 执行模式选择
  execution_strategy?: ExecutionStrategy;
  custom_message?: string;
  
  // 🆕 模板和内容
  template_id?: string;
  target_info?: {
    nickname?: string;
    topic?: string;
    industry?: string;
    region?: string;
  };
}

/**
 * 🎯 统一任务执行结果
 * 
 * 合并了执行引擎和执行器的结果格式
 */
export interface UnifiedTaskExecutionResult {
  task_id: string;
  status: TaskStatus;
  execution_time_ms: number;
  executed_at: Date;
  
  // 🔄 策略信息 (来自Application层)
  strategy_used: ExecutionStrategy;
  execution_mode: ExecutorMode;
  
  // 🔄 资源分配 (来自Application层)
  device_id?: string;
  account_id?: string;
  
  // 🔄 结果详情 (来自Modules层)
  result_code?: ResultCode;
  error_message?: string;
  execution_details?: {
    api_response?: any;
    manual_action_url?: string;
    template_used?: string;
    rendered_content?: string;
  };
  
  // 🆕 重试建议
  retry_recommended?: boolean;
  next_retry_delay?: number;
}

/**
 * 🎯 统一任务查询参数
 * 
 * 整合查询服务的所有筛选选项
 */
export interface UnifiedTaskQueryParams {
  status?: TaskStatus[];
  task_type?: TaskType[];
  platform?: Platform[];
  assigned_device_id?: string;
  target_id?: string;
  
  // 🔄 时间范围
  created_since?: Date;
  created_until?: Date;
  
  // 🔄 分页和排序
  limit?: number;
  offset?: number;
  page?: number;
  page_size?: number;
  order_by?: 'created_at' | 'updated_at' | 'priority' | 'deadline';
  order_direction?: 'asc' | 'desc';
  
  // 🆕 优先级筛选
  priority?: TaskPriority[];
}

/**
 * 🎯 统一任务查询结果
 * 
 * 标准化的分页查询结果
 */
export interface UnifiedTaskQueryResult {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * 🎯 统一任务分配结果
 * 
 * 设备任务分配的完整信息
 */
export interface UnifiedTaskAssignmentResult {
  device_id: string;
  assigned_tasks: Task[];
  assignment_time: Date;
  estimated_completion_time?: Date;
  
  // 🆕 分配统计
  total_assigned: number;
  by_type: Record<TaskType, number>;
  by_priority: Record<TaskPriority, number>;
}

/**
 * 🎯 统一执行统计
 * 
 * 合并两个系统的统计信息
 */
export interface UnifiedTaskExecutionStats {
  // 基础统计
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
  executing_tasks: number;
  
  // 🔄 按维度统计
  by_platform: Record<Platform, number>;
  by_type: Record<TaskType, number>;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  
  // 🔄 执行效率 (来自Application层)
  success_rate: number;
  average_execution_time_ms: number;
  total_execution_time_ms: number;
  
  // 🔄 时间统计 (来自Modules层)
  period_start: Date;
  period_end: Date;
  last_updated: Date;
  
  // 🆕 设备利用率
  active_devices: number;
  device_utilization: Record<string, {
    device_id: string;
    tasks_assigned: number;
    tasks_completed: number;
    success_rate: number;
  }>;
}

// ==================== 依赖类型定义 ====================

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export enum ExecutionStrategy {
  API_FIRST = 'api_first',
  SEMI_AUTO_FALLBACK = 'semi_auto',
  MANUAL_ONLY = 'manual_only'
}

export enum ExecutorMode {
  API = 'api',
  SEMI_AUTO = 'semi_auto',
  MANUAL = 'manual'
}

export enum ResultCode {
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRY = 'retry',
  SKIP = 'skip'
}

export type TaskAssignmentStrategy = 'round_robin' | 'load_balanced' | 'priority_based' | 'manual';

export interface Device {
  id: string;
  name: string;
  platform_capabilities: Platform[];
  current_load: number;
  max_concurrent_tasks: number;
  last_active_at: Date;
}

export interface Account {
  id: string;
  platform: Platform;
  nickname: string;
  device_id: string;
  is_active: boolean;
  daily_task_count: number;
  daily_task_limit: number;
  cooldown_until?: Date;
  last_used_at?: Date;
}

export interface TaskAssignment {
  task_id: string;
  device_id: string;
  account_id?: string;
  assigned_at: Date;
  estimated_start_time: Date;
  priority_score: number;
}

// ==================== 核心任务引擎接口 ====================

/**
 * 🎯 统一任务引擎接口
 * 
 * 整合了Application层的TaskExecutionEngine和Modules层的TaskEngineService
 */
export interface UnifiedTaskEngine {
  /**
   * 生成任务
   */
  generateTasks(params: UnifiedTaskGenerationParams): Promise<UnifiedTaskGenerationResult>;
  
  /**
   * 批量生成任务
   */
  batchGenerateTasks(params: UnifiedTaskGenerationParams[]): Promise<UnifiedTaskGenerationResult[]>;
  
  /**
   * 执行单个任务
   */
  executeTask(params: UnifiedTaskExecutionParams): Promise<UnifiedTaskExecutionResult>;
  
  /**
   * 批量执行任务
   */
  executeTasks(tasks: Task[], devices?: Device[]): Promise<UnifiedTaskExecutionResult[]>;
  
  /**
   * 查询任务
   */
  getTasks(params: UnifiedTaskQueryParams): Promise<UnifiedTaskQueryResult>;
  
  /**
   * 获取单个任务详情
   */
  getTaskById(taskId: string): Promise<Task | null>;
  
  /**
   * 分配任务给设备
   */
  assignTasksToDevice(deviceId: string, taskIds: string[]): Promise<UnifiedTaskAssignmentResult>;
  
  /**
   * 获取可分配任务
   */
  getAssignableTasks(deviceId: string, limit?: number): Promise<Task[]>;
  
  /**
   * 更新任务状态
   */
  updateTaskStatus(taskId: string, status: TaskStatus, result?: any, error?: string): Promise<void>;
  
  /**
   * 取消任务
   */
  cancelTask(taskId: string): Promise<void>;
  
  /**
   * 重试失败任务
   */
  retryTask(taskId: string): Promise<UnifiedTaskExecutionResult>;
  
  /**
   * 获取执行统计
   */
  getExecutionStats(since?: Date): Promise<UnifiedTaskExecutionStats>;
  
  /**
   * 获取任务数量统计
   */
  countTasks(params: Partial<UnifiedTaskQueryParams>): Promise<number>;
}

/**
 * 🎯 统一任务引擎基类
 * 
 * 提供通用的辅助方法和默认实现
 */
export abstract class UnifiedTaskEngineBase implements UnifiedTaskEngine {
  abstract generateTasks(params: UnifiedTaskGenerationParams): Promise<UnifiedTaskGenerationResult>;
  abstract batchGenerateTasks(params: UnifiedTaskGenerationParams[]): Promise<UnifiedTaskGenerationResult[]>;
  abstract executeTask(params: UnifiedTaskExecutionParams): Promise<UnifiedTaskExecutionResult>;
  abstract executeTasks(tasks: Task[], devices?: Device[]): Promise<UnifiedTaskExecutionResult[]>;
  abstract getTasks(params: UnifiedTaskQueryParams): Promise<UnifiedTaskQueryResult>;
  abstract getTaskById(taskId: string): Promise<Task | null>;
  abstract assignTasksToDevice(deviceId: string, taskIds: string[]): Promise<UnifiedTaskAssignmentResult>;
  abstract getAssignableTasks(deviceId: string, limit?: number): Promise<Task[]>;
  abstract updateTaskStatus(taskId: string, status: TaskStatus, result?: any, error?: string): Promise<void>;
  abstract cancelTask(taskId: string): Promise<void>;
  abstract retryTask(taskId: string): Promise<UnifiedTaskExecutionResult>;
  abstract getExecutionStats(since?: Date): Promise<UnifiedTaskExecutionStats>;
  abstract countTasks(params: Partial<UnifiedTaskQueryParams>): Promise<number>;
  
  // 🔧 通用辅助方法
  
  /**
   * 计算任务优先级分数
   */
  protected calculatePriorityScore(task: Task): number {
    const priorityScores = {
      urgent: 100,
      high: 75,
      normal: 50,
      low: 25
    };
    return priorityScores[task.priority as TaskPriority] || 50;
  }
  
  /**
   * 验证任务参数
   */
  protected validateTaskParams(params: UnifiedTaskGenerationParams): void {
    if (!params.target) {
      throw new Error('Target is required for task generation');
    }
    if (!params.task_types || params.task_types.length === 0) {
      throw new Error('At least one task type is required');
    }
  }
  
  /**
   * 格式化执行结果
   */
  protected formatExecutionResult(
    taskId: string,
    status: TaskStatus,
    executionTime: number,
    strategy: ExecutionStrategy,
    details?: any
  ): UnifiedTaskExecutionResult {
    return {
      task_id: taskId,
      status,
      execution_time_ms: executionTime,
      executed_at: new Date(),
      strategy_used: strategy,
      execution_mode: this.mapStrategyToMode(strategy),
      execution_details: details
    };
  }
  
  /**
   * 策略到模式的映射
   */
  private mapStrategyToMode(strategy: ExecutionStrategy): ExecutorMode {
    switch (strategy) {
      case ExecutionStrategy.API_FIRST:
        return ExecutorMode.API;
      case ExecutionStrategy.SEMI_AUTO_FALLBACK:
        return ExecutorMode.SEMI_AUTO;
      case ExecutionStrategy.MANUAL_ONLY:
        return ExecutorMode.MANUAL;
      default:
        return ExecutorMode.API;
    }
  }
}

// ==================== 向后兼容类型别名 ====================

// Application层兼容性
export type TaskExecutionParams = UnifiedTaskExecutionParams;
export type TaskExecutionResult = UnifiedTaskExecutionResult;
export type TaskEngineInterface = UnifiedTaskEngine;

// Modules层兼容性  
export type TaskGenerationConfig = UnifiedTaskGenerationParams;
export type TaskGenerationResult = UnifiedTaskGenerationResult;
export type TaskQuery = UnifiedTaskQueryParams;
export type TaskExecutionStats = UnifiedTaskExecutionStats;
export type TaskAssignmentResult = UnifiedTaskAssignmentResult;