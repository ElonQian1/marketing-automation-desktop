// src/application/services/task-execution/TaskScheduler.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 任务调度器
 * 
 * 负责任务的调度、优先级管理、截止时间处理和资源分配
 * 实现智能调度算法和任务队列管理
 */

import { 
  Task, 
  ExecutionStrategy,
  Device, 
  Account,
  TaskExecutionEngine,
  TaskExecutionResult,
  BatchExecutionResult
} from './TaskExecutionEngine';

// 使用现有精准获客枚举
import {
  TaskStatus
} from '../../../constants/precise-acquisition-enums';

// Priority类型映射
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

// ==================== 调度器配置 ====================

export interface TaskSchedulerConfig {
  // 调度策略
  scheduling_algorithm: 'fifo' | 'priority' | 'deadline' | 'shortest_job_first';
  max_queue_size: number;
  
  // 时间管理
  deadline_check_interval_ms: number;
  task_timeout_ms: number;
  cleanup_interval_ms: number;
  
  // 资源管理
  resource_allocation_strategy: 'greedy' | 'optimal' | 'balanced';
  device_preference_enabled: boolean;
  account_cooldown_enabled: boolean;
  
  // 重试和错误处理
  failed_task_retry_delay_ms: number;
  max_failed_task_retention_hours: number;
  
  // 监控和日志
  enable_performance_monitoring: boolean;
  log_level: 'debug' | 'info' | 'warn' | 'error';
}

// ==================== 调度状态和统计 ====================

export interface SchedulerStats {
  queue_size: number;
  processing_count: number;
  completed_today: number;
  failed_today: number;
  average_wait_time_ms: number;
  average_processing_time_ms: number;
  throughput_per_hour: number;
  resource_utilization: {
    devices: Record<string, number>;
    accounts: Record<string, number>;
  };
  last_cleanup_time: Date;
  uptime_ms: number;
}

export interface TaskQueue {
  pending: Task[];
  processing: Task[];
  completed: Task[];
  failed: Task[];
  cancelled: Task[];
}

// ==================== 任务调度器 ====================

export class TaskScheduler {
  private config: TaskSchedulerConfig;
  private executionEngine: TaskExecutionEngine;
  private taskQueue: TaskQueue;
  private devices: Map<string, Device> = new Map();
  private accounts: Map<string, Account> = new Map();
  private schedulerStats: SchedulerStats;
  private isRunning = false;
  private startTime: Date;

  // 调度器定时器
  private scheduleTimer?: NodeJS.Timeout;
  private deadlineTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: TaskSchedulerConfig, executionEngine: TaskExecutionEngine) {
    this.config = config;
    this.executionEngine = executionEngine;
    this.taskQueue = this.initializeQueue();
    this.schedulerStats = this.initializeStats();
    this.startTime = new Date();
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[TaskScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[TaskScheduler] Starting task scheduler');

    // 启动主调度循环
    this.startScheduleLoop();
    
    // 启动截止时间检查
    this.startDeadlineCheck();
    
    // 启动清理任务
    this.startCleanupLoop();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[TaskScheduler] Already stopped');
      return;
    }

    this.isRunning = false;
    console.log('[TaskScheduler] Stopping task scheduler');

    // 清理定时器
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
    if (this.deadlineTimer) clearInterval(this.deadlineTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  /**
   * 添加任务到队列
   */
  async addTask(task: Task): Promise<boolean> {
    try {
      // 检查队列容量
      if (this.taskQueue.pending.length >= this.config.max_queue_size) {
        console.warn(`[TaskScheduler] Queue is full, rejecting task ${task.id}`);
        return false;
      }

      // 验证任务有效性
      if (!this.validateTask(task)) {
        console.error(`[TaskScheduler] Invalid task ${task.id}`);
        return false;
      }

      // 添加到待处理队列
      this.taskQueue.pending.push(task);
      
      // 按照调度算法排序
      this.sortTaskQueue();
      
      console.log(`[TaskScheduler] Added task ${task.id} to queue (${this.taskQueue.pending.length} pending)`);
      return true;

    } catch (error) {
      console.error(`[TaskScheduler] Failed to add task ${task.id}:`, error);
      return false;
    }
  }

  /**
   * 批量添加任务
   */
  async addTasks(tasks: Task[]): Promise<{ added: number; rejected: number }> {
    let added = 0;
    let rejected = 0;

    for (const task of tasks) {
      const success = await this.addTask(task);
      if (success) {
        added++;
      } else {
        rejected++;
      }
    }

    return { added, rejected };
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      // 在待处理队列中查找
      const pendingIndex = this.taskQueue.pending.findIndex(t => t.id === taskId);
      if (pendingIndex !== -1) {
        const task = this.taskQueue.pending.splice(pendingIndex, 1)[0];
        task.status = TaskStatus.CANCELLED;
        this.taskQueue.cancelled.push(task);
        return true;
      }

      // 在处理中队列中查找
      const processingIndex = this.taskQueue.processing.findIndex(t => t.id === taskId);
      if (processingIndex !== -1) {
        const success = await this.executionEngine.cancelTask(taskId);
        if (success) {
          const task = this.taskQueue.processing.splice(processingIndex, 1)[0];
          task.status = TaskStatus.CANCELLED;
          this.taskQueue.cancelled.push(task);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`[TaskScheduler] Failed to cancel task ${taskId}:`, error);
      return false;
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    // 在所有队列中查找任务
    for (const queueName of ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const) {
      const task = this.taskQueue[queueName].find(t => t.id === taskId);
      if (task) {
        return task.status;
      }
    }
    return null;
  }

  /**
   * 获取任务队列状态
   */
  getQueueStatus(): TaskQueue {
    return {
      pending: [...this.taskQueue.pending],
      processing: [...this.taskQueue.processing],
      completed: [...this.taskQueue.completed],
      failed: [...this.taskQueue.failed],
      cancelled: [...this.taskQueue.cancelled]
    };
  }

  /**
   * 获取调度器统计信息
   */
  getSchedulerStats(): SchedulerStats {
    // 更新实时统计
    this.updateStats();
    return { ...this.schedulerStats };
  }

  /**
   * 注册设备
   */
  registerDevice(device: Device): void {
    this.devices.set(device.id, device);
    console.log(`[TaskScheduler] Registered device ${device.id}`);
  }

  /**
   * 注册账号
   */
  registerAccount(account: Account): void {
    this.accounts.set(account.id, account);
    console.log(`[TaskScheduler] Registered account ${account.id} for platform ${account.platform}`);
  }

  /**
   * 更新设备状态
   */
  updateDeviceStatus(deviceId: string, status: Device['status']): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.last_active_at = new Date();
    }
  }

  /**
   * 获取可用资源
   */
  getAvailableResources(): { devices: Device[]; accounts: Account[] } {
    const availableDevices = Array.from(this.devices.values())
      .filter(device => device.status === 'online' && device.current_load < device.max_concurrent_tasks);
    
    const availableAccounts = Array.from(this.accounts.values())
      .filter(account => account.is_active && 
        (!account.cooldown_until || account.cooldown_until < new Date()) &&
        account.daily_task_count < account.daily_task_limit
      );

    return { devices: availableDevices, accounts: availableAccounts };
  }

  // ==================== 私有方法 - 调度逻辑 ====================

  /**
   * 启动主调度循环
   */
  private startScheduleLoop(): void {
    const scheduleNextBatch = async () => {
      if (!this.isRunning) return;

      try {
        await this.processPendingTasks();
      } catch (error) {
        console.error('[TaskScheduler] Error in schedule loop:', error);
      }

      // 继续下一轮调度
      this.scheduleTimer = setTimeout(scheduleNextBatch, 1000);
    };

    scheduleNextBatch();
  }

  /**
   * 处理待处理任务
   */
  private async processPendingTasks(): Promise<void> {
    if (this.taskQueue.pending.length === 0) return;

    const { devices, accounts } = this.getAvailableResources();
    
    if (devices.length === 0 || accounts.length === 0) {
      console.debug('[TaskScheduler] No available resources for task execution');
      return;
    }

    // 选择要执行的任务
    const tasksToExecute = this.selectTasksForExecution(devices, accounts);
    
    if (tasksToExecute.length === 0) return;

    console.log(`[TaskScheduler] Executing ${tasksToExecute.length} tasks`);

    // 移动任务到处理中队列
    for (const task of tasksToExecute) {
      const index = this.taskQueue.pending.indexOf(task);
      if (index !== -1) {
        this.taskQueue.pending.splice(index, 1);
        this.taskQueue.processing.push(task);
      }
    }

    // 执行任务批次
    try {
      const batchResult = await this.executionEngine.executeBatch(tasksToExecute, devices, accounts);
      await this.processBatchResult(batchResult);
    } catch (error) {
      console.error('[TaskScheduler] Batch execution failed:', error);
      
      // 将失败的任务移回待处理队列或失败队列
      for (const task of tasksToExecute) {
        this.moveTaskFromProcessingToFailed(task, error instanceof Error ? error.message : 'Batch execution failed');
      }
    }
  }

  /**
   * 选择要执行的任务
   */
  private selectTasksForExecution(devices: Device[], accounts: Account[]): Task[] {
    const maxConcurrent = Math.min(
      this.config.max_queue_size,
      devices.reduce((sum, device) => sum + (device.max_concurrent_tasks - device.current_load), 0)
    );

    if (maxConcurrent <= this.taskQueue.processing.length) {
      return [];
    }

    const availableSlots = maxConcurrent - this.taskQueue.processing.length;
    const candidateTasks = this.taskQueue.pending.slice(0, availableSlots);

    // 过滤有资源执行的任务
    return candidateTasks.filter(task => {
      const deviceAvailable = devices.some(device => 
        device.platform_capabilities.includes(task.platform) &&
        device.current_load < device.max_concurrent_tasks
      );
      
      const accountAvailable = accounts.some(account => 
        account.platform === task.platform &&
        account.daily_task_count < account.daily_task_limit
      );

      return deviceAvailable && accountAvailable;
    });
  }

  /**
   * 处理批次执行结果
   */
  private async processBatchResult(batchResult: BatchExecutionResult): Promise<void> {
    for (const taskResult of batchResult.execution_summary) {
      const task = this.findTaskInProcessing(taskResult.task_id);
      if (!task) continue;

      // 从处理中队列移除
      const processingIndex = this.taskQueue.processing.indexOf(task);
      if (processingIndex !== -1) {
        this.taskQueue.processing.splice(processingIndex, 1);
      }

      // 更新任务状态和结果
      task.status = taskResult.status;
      task.updated_at = new Date();
      
      if (taskResult.result_data) {
        task.result_data = taskResult.result_data;
      }
      
      if (taskResult.error_message) {
        task.error_message = taskResult.error_message;
      }

      // 移动到相应队列
      switch (taskResult.status) {
        case TaskStatus.COMPLETED:
          task.completed_at = new Date();
          this.taskQueue.completed.push(task);
          console.log(`[TaskScheduler] Task ${task.id} completed successfully`);
          break;
          
        case TaskStatus.FAILED:
          if (this.shouldRetryTask(task)) {
            task.current_retry_count++;
            task.status = TaskStatus.PENDING; // 重试状态用PENDING表示
            // 延迟后重新加入队列
            setTimeout(() => {
              task.status = TaskStatus.PENDING;
              this.taskQueue.pending.unshift(task);
              this.sortTaskQueue();
            }, this.config.failed_task_retry_delay_ms);
          } else {
            this.taskQueue.failed.push(task);
            console.log(`[TaskScheduler] Task ${task.id} failed permanently`);
          }
          break;
          
        default:
          this.taskQueue.failed.push(task);
          break;
      }

      // 更新账号使用统计
      if (taskResult.account_id) {
        const account = this.accounts.get(taskResult.account_id);
        if (account) {
          account.daily_task_count++;
          account.last_used_at = new Date();
        }
      }

      // 更新设备负载
      if (taskResult.device_id) {
        const device = this.devices.get(taskResult.device_id);
        if (device && device.current_load > 0) {
          device.current_load--;
        }
      }
    }
  }

  // ==================== 私有方法 - 截止时间和清理 ====================

  /**
   * 启动截止时间检查
   */
  private startDeadlineCheck(): void {
    this.deadlineTimer = setInterval(() => {
      this.checkTaskDeadlines();
    }, this.config.deadline_check_interval_ms);
  }

  /**
   * 检查任务截止时间
   */
  private checkTaskDeadlines(): void {
    const now = new Date();
    const expiredTasks: Task[] = [];

    // 检查待处理任务
    for (const task of this.taskQueue.pending) {
      if (task.deadline && task.deadline < now) {
        expiredTasks.push(task);
      }
    }

    // 检查处理中任务
    for (const task of this.taskQueue.processing) {
      if (task.deadline && task.deadline < now) {
        expiredTasks.push(task);
      }
    }

    // 处理过期任务
    for (const task of expiredTasks) {
      console.warn(`[TaskScheduler] Task ${task.id} expired (deadline: ${task.deadline})`);
      
      if (task.status === TaskStatus.EXECUTING) { // 使用EXECUTING替代RUNNING
        // 尝试取消正在执行的任务
        this.executionEngine.cancelTask(task.id);
      }
      
      // 移动到失败队列
      this.moveTaskToFailed(task, 'Task deadline exceeded');
    }
  }

  /**
   * 启动清理循环
   */
  private startCleanupLoop(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanup_interval_ms);
  }

  /**
   * 执行清理操作
   */
  private performCleanup(): void {
    const now = new Date();
    const retentionMs = this.config.max_failed_task_retention_hours * 60 * 60 * 1000;

    // 清理旧的失败任务
    const beforeCount = this.taskQueue.failed.length;
    this.taskQueue.failed = this.taskQueue.failed.filter(task => {
      return (now.getTime() - task.updated_at.getTime()) < retentionMs;
    });
    const afterCount = this.taskQueue.failed.length;

    if (beforeCount > afterCount) {
      console.log(`[TaskScheduler] Cleaned up ${beforeCount - afterCount} old failed tasks`);
    }

    // 清理旧的已完成任务
    const completedBeforeCount = this.taskQueue.completed.length;
    this.taskQueue.completed = this.taskQueue.completed.filter(task => {
      return (now.getTime() - (task.completed_at?.getTime() || task.updated_at.getTime())) < retentionMs;
    });
    const completedAfterCount = this.taskQueue.completed.length;

    if (completedBeforeCount > completedAfterCount) {
      console.log(`[TaskScheduler] Cleaned up ${completedBeforeCount - completedAfterCount} old completed tasks`);
    }

    this.schedulerStats.last_cleanup_time = now;
  }

  // ==================== 私有方法 - 工具函数 ====================

  /**
   * 初始化任务队列
   */
  private initializeQueue(): TaskQueue {
    return {
      pending: [],
      processing: [],
      completed: [],
      failed: [],
      cancelled: []
    };
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): SchedulerStats {
    return {
      queue_size: 0,
      processing_count: 0,
      completed_today: 0,
      failed_today: 0,
      average_wait_time_ms: 0,
      average_processing_time_ms: 0,
      throughput_per_hour: 0,
      resource_utilization: {
        devices: {},
        accounts: {}
      },
      last_cleanup_time: new Date(),
      uptime_ms: 0
    };
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const now = new Date();
    this.schedulerStats.queue_size = this.taskQueue.pending.length;
    this.schedulerStats.processing_count = this.taskQueue.processing.length;
    this.schedulerStats.uptime_ms = now.getTime() - this.startTime.getTime();

    // 计算今日完成和失败任务数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.schedulerStats.completed_today = this.taskQueue.completed.filter(task => 
      task.completed_at && task.completed_at >= today
    ).length;
    
    this.schedulerStats.failed_today = this.taskQueue.failed.filter(task => 
      task.updated_at >= today
    ).length;

    // 更新资源利用率
    for (const [deviceId, device] of this.devices) {
      this.schedulerStats.resource_utilization.devices[deviceId] = 
        device.current_load / device.max_concurrent_tasks;
    }

    for (const [accountId, account] of this.accounts) {
      this.schedulerStats.resource_utilization.accounts[accountId] = 
        account.daily_task_count / account.daily_task_limit;
    }
  }

  /**
   * 验证任务有效性
   */
  private validateTask(task: Task): boolean {
    return !!(
      task.id &&
      task.task_type &&
      task.platform &&
      task.target_user_id &&
      task.status === TaskStatus.PENDING
    );
  }

  /**
   * 排序任务队列
   */
  private sortTaskQueue(): void {
    switch (this.config.scheduling_algorithm) {
      case 'priority':
        this.taskQueue.pending.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        break;
      case 'deadline':
        this.taskQueue.pending.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        });
        break;
      case 'shortest_job_first':
        // 基于预估执行时间排序
        this.taskQueue.pending.sort((a, b) => {
          const aEstimate = this.estimateTaskDuration(a);
          const bEstimate = this.estimateTaskDuration(b);
          return aEstimate - bEstimate;
        });
        break;
      case 'fifo':
      default:
        // FIFO不需要排序
        break;
    }
  }

  /**
   * 预估任务执行时间
   */
  private estimateTaskDuration(task: Task): number {
    // 基于任务类型和执行策略的简单估算
    let baseTime = 10000; // 10秒基础时间

    if (task.execution_strategy === ExecutionStrategy.SEMI_AUTO_FALLBACK) {
      baseTime *= 2;
    } else if (task.execution_strategy === ExecutionStrategy.MANUAL_ONLY) {
      baseTime *= 5;
    }

    return baseTime;
  }

  /**
   * 检查任务是否应该重试
   */
  private shouldRetryTask(task: Task): boolean {
    return task.current_retry_count < task.max_retries;
  }

  /**
   * 在处理中队列查找任务
   */
  private findTaskInProcessing(taskId: string): Task | undefined {
    return this.taskQueue.processing.find(task => task.id === taskId);
  }

  /**
   * 将任务移动到失败队列
   */
  private moveTaskToFailed(task: Task, errorMessage: string): void {
    // 从当前队列移除
    ['pending', 'processing'].forEach(queueName => {
      const queue = this.taskQueue[queueName as keyof TaskQueue] as Task[];
      const index = queue.indexOf(task);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    });

    // 更新任务状态
    task.status = TaskStatus.FAILED;
    task.error_message = errorMessage;
    task.updated_at = new Date();

    // 添加到失败队列
    this.taskQueue.failed.push(task);
  }

  /**
   * 将任务从处理中移动到失败队列
   */
  private moveTaskFromProcessingToFailed(task: Task, errorMessage: string): void {
    const index = this.taskQueue.processing.indexOf(task);
    if (index !== -1) {
      this.taskQueue.processing.splice(index, 1);
    }

    task.status = TaskStatus.FAILED;
    task.error_message = errorMessage;
    task.updated_at = new Date();
    this.taskQueue.failed.push(task);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建任务调度器实例
 */
export function createTaskScheduler(
  config: TaskSchedulerConfig,
  executionEngine: TaskExecutionEngine
): TaskScheduler {
  return new TaskScheduler(config, executionEngine);
}

/**
 * 获取默认调度器配置
 */
export function getDefaultTaskSchedulerConfig(): TaskSchedulerConfig {
  return {
    scheduling_algorithm: 'priority',
    max_queue_size: 1000,
    deadline_check_interval_ms: 30000,
    task_timeout_ms: 300000,
    cleanup_interval_ms: 3600000,
    resource_allocation_strategy: 'balanced',
    device_preference_enabled: true,
    account_cooldown_enabled: true,
    failed_task_retry_delay_ms: 5000,
    max_failed_task_retention_hours: 24,
    enable_performance_monitoring: true,
    log_level: 'info'
  };
}