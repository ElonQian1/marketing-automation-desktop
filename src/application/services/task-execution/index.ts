/**
 * 任务执行系统 - 统一导出
 * 
 * 导出任务执行引擎、调度器和相关类型定义
 * 实现"API优先+半自动兜底"的完整执行体系
 */

// ==================== 执行引擎导出 ====================

export {
  TaskExecutionEngine,
  createTaskExecutionEngine,
  getDefaultTaskEngineConfig,
  TaskStatus,
  TaskPriority,
  ExecutionStrategy,
  type TaskEngineConfig,
  type TaskExecutionResult,
  type BatchExecutionResult,
  type TaskAssignmentStrategy,
  type TaskAssignment,
  type Task,
  type Device,
  type Account
} from './TaskExecutionEngine';

// ==================== 调度器导出 ====================

export {
  TaskScheduler,
  createTaskScheduler,
  getDefaultTaskSchedulerConfig,
  type TaskSchedulerConfig,
  type SchedulerStats,
  type TaskQueue
} from './TaskScheduler';

// ==================== 常量定义 ====================

/**
 * 任务优先级权重映射
 */
export const TASK_PRIORITY_WEIGHTS = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
} as const;

/**
 * 执行策略默认超时时间
 */
export const EXECUTION_TIMEOUTS = {
  api_first: 30000,        // 30秒
  semi_auto: 120000,       // 2分钟
  manual_only: 0           // 无超时
} as const;

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG = {
  max_retries: 3,
  base_delay_ms: 1000,
  multiplier: 2,
  max_delay_ms: 30000
} as const;

// ==================== 错误类定义 ====================

/**
 * 任务执行相关错误基类
 */
export class TaskExecutionError extends Error {
  public readonly code: string;
  public readonly task_id?: number;
  
  constructor(message: string, code: string, taskId?: number) {
    super(message);
    this.name = 'TaskExecutionError';
    this.code = code;
    this.task_id = taskId;
  }
}

/**
 * 资源不足错误
 */
export class InsufficientResourcesError extends TaskExecutionError {
  constructor(resourceType: 'device' | 'account', details?: string) {
    super(
      `Insufficient ${resourceType} resources${details ? ': ' + details : ''}`,
      'INSUFFICIENT_RESOURCES'
    );
    this.name = 'InsufficientResourcesError';
  }
}

/**
 * 任务超时错误
 */
export class TaskTimeoutError extends TaskExecutionError {
  constructor(taskId: number, timeoutMs: number) {
    super(
      `Task ${taskId} timed out after ${timeoutMs}ms`,
      'TASK_TIMEOUT',
      taskId
    );
    this.name = 'TaskTimeoutError';
  }
}

/**
 * 任务调度错误
 */
export class TaskSchedulingError extends TaskExecutionError {
  constructor(reason: string, taskId?: number) {
    super(`Task scheduling failed: ${reason}`, 'SCHEDULING_FAILED', taskId);
    this.name = 'TaskSchedulingError';
  }
}

/**
 * 任务验证错误
 */
export class TaskValidationError extends TaskExecutionError {
  constructor(field: string, value: any, taskId?: number) {
    super(
      `Task validation failed: invalid ${field} (${value})`,
      'VALIDATION_FAILED',
      taskId
    );
    this.name = 'TaskValidationError';
  }
}