/**
 * 任务执行引擎
 * 
 * 基于文档要求实现"API优先+半自动兜底"的执行策略
 * 支持账号分配、任务调度、重试机制和优先级管理
 */

// 使用现有的核心类型系统
import { 
  Platform, 
  TargetType,
  TaskType
} from '../../../modules/precise-acquisition/shared/types/core';

// 从现有精准获客枚举中导入
import {
  TaskStatus,
  ExecutorMode
} from '../../../constants/precise-acquisition-enums';

// Priority类型映射
type Priority = 'low' | 'normal' | 'high' | 'urgent';
import { 
  CommentAdapterManager,
  CommentCollectionParams,
  CommentCollectionResult,
  createCommentAdapterManager
} from '../comment-collection';

// 重新导出类型，保持向后兼容
export type { TaskStatus, TaskType };
export type TaskPriority = Priority;

export enum ExecutionStrategy {
  API_FIRST = 'api_first',           // API优先
  SEMI_AUTO_FALLBACK = 'semi_auto',  // 半自动兜底
  MANUAL_ONLY = 'manual_only'        // 仅手动
}

// ==================== 任务接口定义 ====================

export interface Task {
  id: string;  // 统一使用 string 类型的 ID
  task_type: string;
  platform: Platform;
  target_user_id: string;
  target_nickname?: string;
  target_video_url?: string;
  content?: string;
  status: TaskStatus;
  priority: Priority;
  execution_strategy: ExecutionStrategy;
  scheduled_time: Date;
  deadline?: Date;
  max_retries: number;
  current_retry_count: number;
  assigned_device_id?: string;
  assigned_account_id?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  error_message?: string;
  result_data?: any;
  metadata?: Record<string, unknown>;
}

export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
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

// ==================== 执行结果接口 ====================

export interface TaskExecutionResult {
  task_id: string;
  status: TaskStatus;
  execution_time_ms: number;
  strategy_used: ExecutionStrategy;
  device_id?: string;
  account_id?: string;
  result_data?: any;
  error_message?: string;
  retry_recommended?: boolean;
  next_retry_delay?: number;
}

export interface BatchExecutionResult {
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  execution_summary: TaskExecutionResult[];
  overall_execution_time_ms: number;
}

// ==================== 分配策略接口 ====================

export interface TaskAssignmentStrategy {
  assignTasks(tasks: Task[], devices: Device[], accounts: Account[]): TaskAssignment[];
}

export interface TaskAssignment {
  task: Task;
  device: Device;
  account: Account;
  estimated_start_time: Date;
  estimated_duration_ms: number;
}

// ==================== 任务执行引擎配置 ====================

export interface TaskEngineConfig {
  // 执行策略配置
  default_execution_strategy: ExecutionStrategy;
  api_timeout_ms: number;
  semi_auto_fallback_delay_ms: number;
  
  // 重试配置
  max_retries_per_task: number;
  retry_delay_base_ms: number;
  retry_delay_multiplier: number;
  
  // 分配策略配置
  assignment_strategy: 'round_robin' | 'load_balancing' | 'priority_first';
  device_selection_preference: 'performance' | 'availability' | 'random';
  
  // 并发控制
  max_concurrent_executions: number;
  max_tasks_per_device: number;
  
  // 监控配置
  execution_timeout_ms: number;
  health_check_interval_ms: number;
}

// ==================== 任务执行引擎 ====================

export class TaskExecutionEngine {
  private config: TaskEngineConfig;
  private commentAdapterManager: CommentAdapterManager;
  private runningTasks: Map<string, TaskExecutionContext> = new Map();
  private assignmentStrategy: TaskAssignmentStrategy;
  private executionStats: ExecutionStats;

  constructor(config: TaskEngineConfig, commentAdapterManager: CommentAdapterManager) {
    this.config = config;
    this.commentAdapterManager = commentAdapterManager;
    this.assignmentStrategy = this.createAssignmentStrategy(config.assignment_strategy);
    this.executionStats = this.initializeStats();
  }

  /**
   * 执行单个任务
   */
  async executeTask(
    task: Task, 
    device: Device, 
    account: Account
  ): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const context: TaskExecutionContext = {
      task,
      device,
      account,
      startTime,
      currentStrategy: task.execution_strategy
    };

    this.runningTasks.set(task.id, context);

    try {
      // 更新任务状态为执行中
      task.status = TaskStatus.EXECUTING;
      
      // 根据执行策略选择执行方法
      let result: TaskExecutionResult;
      
      switch (task.execution_strategy) {
        case ExecutionStrategy.API_FIRST:
          result = await this.executeWithAPIFirst(context);
          break;
        case ExecutionStrategy.SEMI_AUTO_FALLBACK:
          result = await this.executeWithSemiAutoFallback(context);
          break;
        case ExecutionStrategy.MANUAL_ONLY:
          result = await this.executeManualOnly(context);
          break;
        default:
          throw new Error(`Unsupported execution strategy: ${task.execution_strategy}`);
      }

      // 更新统计信息
      this.updateExecutionStats(result);
      
      return result;

    } catch (error) {
      const errorResult: TaskExecutionResult = {
        task_id: task.id,
        status: TaskStatus.FAILED,
        execution_time_ms: Date.now() - startTime,
        strategy_used: task.execution_strategy,
        device_id: device.id,
        account_id: account.id,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_recommended: this.shouldRetry(task, error)
      };

      this.updateExecutionStats(errorResult);
      return errorResult;

    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * 批量执行任务
   */
  async executeBatch(
    tasks: Task[],
    devices: Device[],
    accounts: Account[]
  ): Promise<BatchExecutionResult> {
    const startTime = Date.now();
    
    // 分配任务到设备和账号
    const assignments = this.assignmentStrategy.assignTasks(tasks, devices, accounts);
    
    // 按设备分组并发执行
    const deviceGroups = this.groupAssignmentsByDevice(assignments);
    const executionPromises: Promise<TaskExecutionResult[]>[] = [];

    for (const [deviceId, deviceAssignments] of deviceGroups) {
      const devicePromise = this.executeDeviceAssignments(deviceAssignments);
      executionPromises.push(devicePromise);
    }

    // 等待所有设备完成执行
    const allResults = await Promise.all(executionPromises);
    const flatResults = allResults.flat();

    // 汇总结果
    const successfulTasks = flatResults.filter(r => r.status === TaskStatus.COMPLETED).length;
    const failedTasks = flatResults.filter(r => r.status === TaskStatus.FAILED).length;

    return {
      total_tasks: tasks.length,
      successful_tasks: successfulTasks,
      failed_tasks: failedTasks,
      execution_summary: flatResults,
      overall_execution_time_ms: Date.now() - startTime
    };
  }

  /**
   * 获取运行中的任务状态
   */
  getRunningTasksStatus(): Array<{
    task_id: string;
    device_id: string;
    account_id: string;
    running_time_ms: number;
    current_strategy: ExecutionStrategy;
  }> {
    const results: Array<{
      task_id: string;
      device_id: string;
      account_id: string;
      running_time_ms: number;
      current_strategy: ExecutionStrategy;
    }> = [];

    for (const [taskId, context] of this.runningTasks) {
      results.push({
        task_id: taskId,
        device_id: context.device.id,
        account_id: context.account.id,
        running_time_ms: Date.now() - context.startTime,
        current_strategy: context.currentStrategy
      });
    }

    return results;
  }

  /**
   * 取消任务执行
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const context = this.runningTasks.get(taskId);
    if (!context) return false;

    try {
      // 标记任务为取消状态
      context.task.status = TaskStatus.CANCELLED;
      
      // 清理执行上下文
      this.runningTasks.delete(taskId);
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取执行统计信息
   */
  getExecutionStats(): ExecutionStats {
    return { ...this.executionStats };
  }

  // ==================== 私有方法 - 执行策略 ====================

  /**
   * API优先执行策略
   */
  private async executeWithAPIFirst(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device, account } = context;
    const startTime = Date.now();

    try {
      // 尝试通过评论采集适配器执行
      const collectionParams: CommentCollectionParams = {
        target: {
          id: task.id,
          platform: task.platform,
          platform_id_or_url: task.target_video_url || task.target_user_id,
          target_type: task.target_video_url ? TargetType.VIDEO : TargetType.ACCOUNT,
          source: 'manual' as any, // 临时修复
          created_at: new Date(),
          updated_at: new Date()
        },
        limit: 50
      };

      const collectionResult = await this.commentAdapterManager.collectComments(collectionParams);

      return {
        task_id: task.id,
        status: TaskStatus.COMPLETED,
        execution_time_ms: Date.now() - startTime,
        strategy_used: ExecutionStrategy.API_FIRST,
        device_id: device.id,
        account_id: account.id,
        result_data: {
          comments_collected: collectionResult.comments.length,
          has_more: collectionResult.has_more,
          api_used: true
        }
      };

    } catch (error) {
      // API失败，检查是否需要回退到半自动
      if (this.config.default_execution_strategy === ExecutionStrategy.SEMI_AUTO_FALLBACK) {
        console.warn(`[TaskEngine] API execution failed for task ${task.id}, falling back to semi-auto`);
        context.currentStrategy = ExecutionStrategy.SEMI_AUTO_FALLBACK;
        return this.executeWithSemiAutoFallback(context);
      }

      throw error;
    }
  }

  /**
   * 半自动兜底执行策略
   */
  private async executeWithSemiAutoFallback(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device, account } = context;
    const startTime = Date.now();

    try {
      // 模拟半自动执行（实际实现需要调用ADB自动化）
      console.log(`[TaskEngine] Executing semi-auto task ${task.id} on device ${device.id}`);
      
      // 延迟模拟执行时间
      await new Promise(resolve => setTimeout(resolve, this.config.semi_auto_fallback_delay_ms));

      // 模拟执行结果
      const success = Math.random() > 0.1; // 90%成功率

      if (success) {
        return {
          task_id: task.id,
          status: TaskStatus.COMPLETED,
          execution_time_ms: Date.now() - startTime,
          strategy_used: ExecutionStrategy.SEMI_AUTO_FALLBACK,
          device_id: device.id,
          account_id: account.id,
          result_data: {
            execution_method: 'semi_auto',
            device_automation: true,
            manual_intervention: false
          }
        };
      } else {
        throw new Error('Semi-auto execution failed');
      }

    } catch (error) {
      throw new Error(`Semi-auto execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 仅手动执行策略
   */
  private async executeManualOnly(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device, account } = context;

    // 手动任务需要人工干预，这里只是标记为待处理状态
    return {
      task_id: task.id,
      status: TaskStatus.PENDING,
      execution_time_ms: 0,
      strategy_used: ExecutionStrategy.MANUAL_ONLY,
      device_id: device.id,
      account_id: account.id,
      result_data: {
        requires_manual_intervention: true,
        ready_for_execution: true
      }
    };
  }

  // ==================== 私有方法 - 任务分配 ====================

  /**
   * 创建任务分配策略
   */
  private createAssignmentStrategy(strategyType: string): TaskAssignmentStrategy {
    switch (strategyType) {
      case 'round_robin':
        return new RoundRobinAssignmentStrategy();
      case 'load_balancing':
        return new LoadBalancingAssignmentStrategy();
      case 'priority_first':
        return new PriorityFirstAssignmentStrategy();
      default:
        return new RoundRobinAssignmentStrategy();
    }
  }

  /**
   * 按设备分组分配
   */
  private groupAssignmentsByDevice(assignments: TaskAssignment[]): Map<string, TaskAssignment[]> {
    const groups = new Map<string, TaskAssignment[]>();
    
    for (const assignment of assignments) {
      const deviceId = assignment.device.id;
      if (!groups.has(deviceId)) {
        groups.set(deviceId, []);
      }
      groups.get(deviceId)!.push(assignment);
    }
    
    return groups;
  }

  /**
   * 执行设备分配的任务
   */
  private async executeDeviceAssignments(assignments: TaskAssignment[]): Promise<TaskExecutionResult[]> {
    const results: TaskExecutionResult[] = [];
    
    // 按照估计开始时间排序
    assignments.sort((a, b) => a.estimated_start_time.getTime() - b.estimated_start_time.getTime());
    
    for (const assignment of assignments) {
      try {
        const result = await this.executeTask(assignment.task, assignment.device, assignment.account);
        results.push(result);
        
        // 任务间延迟
        if (assignments.indexOf(assignment) < assignments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({
          task_id: assignment.task.id,
          status: TaskStatus.FAILED,
          execution_time_ms: 0,
          strategy_used: assignment.task.execution_strategy,
          device_id: assignment.device.id,
          account_id: assignment.account.id,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // ==================== 私有方法 - 工具函数 ====================

  /**
   * 检查是否应该重试任务
   */
  private shouldRetry(task: Task, error: any): boolean {
    if (task.current_retry_count >= task.max_retries) {
      return false;
    }
    
    // 基于错误类型决定是否重试
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // 网络错误可以重试
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return true;
      }
      
      // 权限错误不重试
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        return false;
      }
      
      // API限制可以重试
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        return true;
      }
    }
    
    return true; // 默认重试
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): ExecutionStats {
    return {
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      average_execution_time_ms: 0,
      executions_by_strategy: {
        [ExecutionStrategy.API_FIRST]: 0,
        [ExecutionStrategy.SEMI_AUTO_FALLBACK]: 0,
        [ExecutionStrategy.MANUAL_ONLY]: 0
      },
      executions_by_platform: {},
      last_execution_time: undefined
    };
  }

  /**
   * 更新执行统计信息
   */
  private updateExecutionStats(result: TaskExecutionResult): void {
    this.executionStats.total_executions++;
    
    if (result.status === TaskStatus.COMPLETED) {
      this.executionStats.successful_executions++;
    } else {
      this.executionStats.failed_executions++;
    }
    
    // 更新平均执行时间
    const totalTime = this.executionStats.average_execution_time_ms * (this.executionStats.total_executions - 1) + result.execution_time_ms;
    this.executionStats.average_execution_time_ms = totalTime / this.executionStats.total_executions;
    
    // 更新策略统计
    this.executionStats.executions_by_strategy[result.strategy_used]++;
    
    this.executionStats.last_execution_time = new Date();
  }
}

// ==================== 执行上下文和统计接口 ====================

interface TaskExecutionContext {
  task: Task;
  device: Device;
  account: Account;
  startTime: number;
  currentStrategy: ExecutionStrategy;
}

interface ExecutionStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time_ms: number;
  executions_by_strategy: Record<ExecutionStrategy, number>;
  executions_by_platform: Record<string, number>;
  last_execution_time?: Date;
}

// ==================== 分配策略实现 ====================

/**
 * 轮询分配策略
 */
class RoundRobinAssignmentStrategy implements TaskAssignmentStrategy {
  private deviceIndex = 0;
  private accountIndex = 0;

  assignTasks(tasks: Task[], devices: Device[], accounts: Account[]): TaskAssignment[] {
    const assignments: TaskAssignment[] = [];
    const availableDevices = devices.filter(d => d.status === 'online');
    const availableAccounts = accounts.filter(a => a.is_active);

    if (availableDevices.length === 0 || availableAccounts.length === 0) {
      throw new Error('No available devices or accounts for task assignment');
    }

    for (const task of tasks) {
      // 轮询选择设备
      const device = availableDevices[this.deviceIndex % availableDevices.length];
      this.deviceIndex++;

      // 轮询选择账号（同平台）
      const platformAccounts = availableAccounts.filter(a => a.platform === task.platform);
      if (platformAccounts.length === 0) {
        throw new Error(`No available accounts for platform ${task.platform}`);
      }

      const account = platformAccounts[this.accountIndex % platformAccounts.length];
      this.accountIndex++;

      assignments.push({
        task,
        device,
        account,
        estimated_start_time: new Date(Date.now() + assignments.length * 5000),
        estimated_duration_ms: 10000
      });
    }

    return assignments;
  }
}

/**
 * 负载均衡分配策略
 */
class LoadBalancingAssignmentStrategy implements TaskAssignmentStrategy {
  assignTasks(tasks: Task[], devices: Device[], accounts: Account[]): TaskAssignment[] {
    const assignments: TaskAssignment[] = [];
    const availableDevices = devices.filter(d => d.status === 'online').sort((a, b) => a.current_load - b.current_load);
    const availableAccounts = accounts.filter(a => a.is_active);

    for (const task of tasks) {
      // 选择负载最低的设备
      const device = availableDevices[0];

      // 选择使用次数最少的账号
      const platformAccounts = availableAccounts
        .filter(a => a.platform === task.platform)
        .sort((a, b) => a.daily_task_count - b.daily_task_count);

      if (platformAccounts.length === 0) {
        throw new Error(`No available accounts for platform ${task.platform}`);
      }

      const account = platformAccounts[0];

      assignments.push({
        task,
        device,
        account,
        estimated_start_time: new Date(Date.now() + device.current_load * 1000),
        estimated_duration_ms: 10000
      });

      // 更新设备负载
      device.current_load++;
    }

    return assignments;
  }
}

/**
 * 优先级优先分配策略
 */
class PriorityFirstAssignmentStrategy implements TaskAssignmentStrategy {
  assignTasks(tasks: Task[], devices: Device[], accounts: Account[]): TaskAssignment[] {
    // 按优先级排序任务
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // 使用负载均衡策略分配
    const loadBalancingStrategy = new LoadBalancingAssignmentStrategy();
    return loadBalancingStrategy.assignTasks(sortedTasks, devices, accounts);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建任务执行引擎实例
 */
export function createTaskExecutionEngine(
  config: TaskEngineConfig,
  commentAdapterManager: CommentAdapterManager
): TaskExecutionEngine {
  return new TaskExecutionEngine(config, commentAdapterManager);
}

/**
 * 获取默认任务引擎配置
 */
export function getDefaultTaskEngineConfig(): TaskEngineConfig {
  return {
    default_execution_strategy: ExecutionStrategy.API_FIRST,
    api_timeout_ms: 30000,
    semi_auto_fallback_delay_ms: 5000,
    max_retries_per_task: 3,
    retry_delay_base_ms: 1000,
    retry_delay_multiplier: 2,
    assignment_strategy: 'load_balancing',
    device_selection_preference: 'availability',
    max_concurrent_executions: 10,
    max_tasks_per_device: 5,
    execution_timeout_ms: 300000,
    health_check_interval_ms: 60000
  };
}