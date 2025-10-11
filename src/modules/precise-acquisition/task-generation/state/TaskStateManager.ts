/**
 * 精准获客系统 - 任务状态管理
 * 
 * 管理任务生命周期、状态转换、执行调度等
 */

import { 
  Task,
  WatchTarget,
  Comment 
} from '../../../modules/precise-acquisition/shared/types/core';
import { 
  TaskStatus, 
  TaskType, 
  TaskPriority,
  Platform 
} from '../../../modules/precise-acquisition/shared/constants';

// ==================== 状态管理类型 ====================

/**
 * 任务状态转换规则
 */
export interface TaskStatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  condition?: (task: Task) => boolean;
  action?: (task: Task) => Promise<void>;
  allowed_by?: string[];                 // 允许执行转换的角色
}

/**
 * 任务执行结果
 */
export interface TaskExecutionResult {
  task_id: string;
  success: boolean;
  executed_at: Date;
  execution_time_ms: number;
  result_data?: any;
  error_message?: string;
  retry_count: number;
  next_retry_at?: Date;
}

/**
 * 任务调度配置
 */
export interface TaskScheduleConfig {
  max_concurrent_tasks: number;          // 最大并发任务数
  retry_policy: {
    max_retries: number;
    backoff_strategy: 'linear' | 'exponential' | 'fixed';
    base_delay_ms: number;
    max_delay_ms: number;
  };
  execution_windows: Array<{             // 执行窗口
    start_hour: number;
    end_hour: number;
    max_tasks_per_window: number;
  }>;
  platform_limits: Map<Platform, {      // 平台限制
    max_tasks_per_hour: number;
    min_delay_between_tasks_ms: number;
  }>;
}

/**
 * 任务统计信息
 */
export interface TaskStatistics {
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  cancelled_tasks: number;
  average_execution_time_ms: number;
  success_rate: number;
  daily_limits: {
    [key: string]: {
      limit: number;
      current: number;
      remaining: number;
    };
  };
}

/**
 * 任务队列项
 */
interface TaskQueueItem {
  task: Task;
  priority_score: number;
  scheduled_for: Date;
  dependencies: string[];               // 依赖的其他任务ID
  retry_count: number;
  last_error?: string;
}

// ==================== 任务状态机 ====================

/**
 * 任务状态机
 */
export class TaskStateMachine {
  private transitions: Map<string, TaskStatusTransition[]>;
  
  constructor() {
    this.transitions = new Map();
    this.initializeTransitions();
  }
  
  /**
   * 检查状态转换是否允许
   */
  canTransition(from: TaskStatus, to: TaskStatus, task: Task): boolean {
    const key = this.getTransitionKey(from, to);
    const transition = this.getTransition(from, to);
    
    if (!transition) return false;
    
    // 检查条件
    if (transition.condition && !transition.condition(task)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 执行状态转换
   */
  async transition(task: Task, newStatus: TaskStatus, executor?: string): Promise<boolean> {
    const currentStatus = task.status;
    
    if (!this.canTransition(currentStatus, newStatus, task)) {
      return false;
    }
    
    const transition = this.getTransition(currentStatus, newStatus);
    if (!transition) return false;
    
    // 检查执行权限
    if (transition.allowed_by && executor && !transition.allowed_by.includes(executor)) {
      return false;
    }
    
    try {
      // 执行转换动作
      if (transition.action) {
        await transition.action(task);
      }
      
      // 更新任务状态
      task.status = newStatus;
      task.updatedAt = new Date();
      
      return true;
    } catch (error) {
      console.error('状态转换失败:', error);
      return false;
    }
  }
  
  /**
   * 获取可能的下一状态
   */
  getNextStates(currentStatus: TaskStatus, task: Task): TaskStatus[] {
    const possibleStates: TaskStatus[] = [];
    
    for (const status of Object.values(TaskStatus)) {
      if (this.canTransition(currentStatus, status, task)) {
        possibleStates.push(status);
      }
    }
    
    return possibleStates;
  }
  
  private initializeTransitions(): void {
    // PENDING -> RUNNING
    this.addTransition({
      from: TaskStatus.PENDING,
      to: TaskStatus.RUNNING,
      condition: (task) => task.scheduledTime <= new Date(),
      action: async (task) => {
        task.startedAt = new Date();
      }
    });
    
    // PENDING -> CANCELLED
    this.addTransition({
      from: TaskStatus.PENDING,
      to: TaskStatus.CANCELLED,
      allowed_by: ['admin', 'user']
    });
    
    // RUNNING -> COMPLETED
    this.addTransition({
      from: TaskStatus.RUNNING,
      to: TaskStatus.COMPLETED,
      action: async (task) => {
        task.completedAt = new Date();
      }
    });
    
    // RUNNING -> FAILED
    this.addTransition({
      from: TaskStatus.RUNNING,
      to: TaskStatus.FAILED,
      action: async (task) => {
        task.completedAt = new Date();
      }
    });
    
    // FAILED -> PENDING (重试)
    this.addTransition({
      from: TaskStatus.FAILED,
      to: TaskStatus.PENDING,
      condition: (task) => (task.metadata?.retry_count || 0) < 3,
      action: async (task) => {
        const retryCount = (task.metadata?.retry_count || 0) + 1;
        task.metadata = { ...task.metadata, retry_count: retryCount };
        task.scheduledTime = this.calculateNextRetryTime(retryCount);
      }
    });
    
    // FAILED -> CANCELLED
    this.addTransition({
      from: TaskStatus.FAILED,
      to: TaskStatus.CANCELLED,
      allowed_by: ['admin', 'user']
    });
  }
  
  private addTransition(transition: TaskStatusTransition): void {
    const key = this.getTransitionKey(transition.from, transition.to);
    if (!this.transitions.has(key)) {
      this.transitions.set(key, []);
    }
    this.transitions.get(key)!.push(transition);
  }
  
  private getTransition(from: TaskStatus, to: TaskStatus): TaskStatusTransition | null {
    const key = this.getTransitionKey(from, to);
    const transitions = this.transitions.get(key);
    return transitions?.[0] || null;
  }
  
  private getTransitionKey(from: TaskStatus, to: TaskStatus): string {
    return `${from}->${to}`;
  }
  
  private calculateNextRetryTime(retryCount: number): Date {
    // 指数退避策略
    const baseDelay = 60 * 1000; // 1分钟
    const delay = baseDelay * Math.pow(2, retryCount - 1);
    const maxDelay = 60 * 60 * 1000; // 1小时
    
    return new Date(Date.now() + Math.min(delay, maxDelay));
  }
}

// ==================== 任务调度器 ====================

/**
 * 任务调度器
 */
export class TaskScheduler {
  private config: TaskScheduleConfig;
  private taskQueue: TaskQueueItem[];
  private runningTasks: Map<string, Task>;
  private stateMachine: TaskStateMachine;
  private isRunning: boolean = false;
  private lastExecutionTimes: Map<Platform, Date>;
  
  constructor(config: TaskScheduleConfig) {
    this.config = config;
    this.taskQueue = [];
    this.runningTasks = new Map();
    this.stateMachine = new TaskStateMachine();
    this.lastExecutionTimes = new Map();
  }
  
  /**
   * 添加任务到队列
   */
  addTask(task: Task, dependencies: string[] = []): void {
    const queueItem: TaskQueueItem = {
      task,
      priority_score: this.calculatePriorityScore(task),
      scheduled_for: task.scheduledTime,
      dependencies,
      retry_count: 0
    };
    
    this.taskQueue.push(queueItem);
    this.sortQueue();
  }
  
  /**
   * 批量添加任务
   */
  addTasks(tasks: Task[]): void {
    for (const task of tasks) {
      this.addTask(task);
    }
  }
  
  /**
   * 开始调度
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleNextExecution();
  }
  
  /**
   * 停止调度
   */
  stop(): void {
    this.isRunning = false;
  }
  
  /**
   * 立即执行下一个任务
   */
  async executeNext(): Promise<TaskExecutionResult | null> {
    const nextItem = this.getNextExecutableTask();
    if (!nextItem) return null;
    
    return this.executeTask(nextItem);
  }
  
  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    pending: number;
    running: number;
    next_execution?: Date;
  } {
    const nextItem = this.taskQueue.find(item => 
      item.scheduled_for <= new Date() &&
      this.areDependenciesMet(item.dependencies)
    );
    
    return {
      pending: this.taskQueue.length,
      running: this.runningTasks.size,
      next_execution: nextItem?.scheduled_for
    };
  }
  
  /**
   * 获取任务统计
   */
  getStatistics(): TaskStatistics {
    // TODO: 实现详细统计
    return {
      total_tasks: this.taskQueue.length + this.runningTasks.size,
      pending_tasks: this.taskQueue.length,
      running_tasks: this.runningTasks.size,
      completed_tasks: 0,
      failed_tasks: 0,
      cancelled_tasks: 0,
      average_execution_time_ms: 0,
      success_rate: 0,
      daily_limits: {}
    };
  }
  
  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    // 从队列中移除
    const queueIndex = this.taskQueue.findIndex(item => item.task.id === taskId);
    if (queueIndex > -1) {
      const item = this.taskQueue[queueIndex];
      const success = await this.stateMachine.transition(item.task, TaskStatus.CANCELLED);
      if (success) {
        this.taskQueue.splice(queueIndex, 1);
        return true;
      }
    }
    
    // 取消正在运行的任务
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      const success = await this.stateMachine.transition(runningTask, TaskStatus.CANCELLED);
      if (success) {
        this.runningTasks.delete(taskId);
        return true;
      }
    }
    
    return false;
  }
  
  // ==================== 私有方法 ====================
  
  private async scheduleNextExecution(): Promise<void> {
    if (!this.isRunning) return;
    
    // 检查是否可以执行下一个任务
    if (this.runningTasks.size < this.config.max_concurrent_tasks) {
      const result = await this.executeNext();
      if (result) {
        console.log('任务执行结果:', result);
      }
    }
    
    // 调度下次检查
    setTimeout(() => {
      this.scheduleNextExecution();
    }, 5000); // 5秒检查一次
  }
  
  private getNextExecutableTask(): TaskQueueItem | null {
    const now = new Date();
    
    for (let i = 0; i < this.taskQueue.length; i++) {
      const item = this.taskQueue[i];
      
      // 检查时间
      if (item.scheduled_for > now) continue;
      
      // 检查依赖
      if (!this.areDependenciesMet(item.dependencies)) continue;
      
      // 检查执行窗口
      if (!this.isInExecutionWindow(now)) continue;
      
      // 检查平台限制
      if (!this.canExecuteForPlatform(item.task.platform)) continue;
      
      // 移除并返回
      this.taskQueue.splice(i, 1);
      return item;
    }
    
    return null;
  }
  
  private async executeTask(item: TaskQueueItem): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const task = item.task;
    
    try {
      // 转换状态为运行中
      await this.stateMachine.transition(task, TaskStatus.RUNNING);
      this.runningTasks.set(task.id, task);
      
      // 执行任务
      const result = await this.performTaskExecution(task);
      
      // 记录执行时间
      this.lastExecutionTimes.set(task.platform, new Date());
      
      // 更新状态
      if (result.success) {
        await this.stateMachine.transition(task, TaskStatus.COMPLETED);
      } else {
        await this.stateMachine.transition(task, TaskStatus.FAILED);
        
        // 重试逻辑
        if (item.retry_count < this.config.retry_policy.max_retries) {
          item.retry_count++;
          item.scheduled_for = this.calculateRetryTime(item.retry_count);
          this.taskQueue.push(item);
          this.sortQueue();
        }
      }
      
      this.runningTasks.delete(task.id);
      
      return {
        task_id: task.id,
        success: result.success,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        result_data: result.data,
        error_message: result.error,
        retry_count: item.retry_count
      };
      
    } catch (error) {
      this.runningTasks.delete(task.id);
      await this.stateMachine.transition(task, TaskStatus.FAILED);
      
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : '执行错误',
        retry_count: item.retry_count
      };
    }
  }
  
  private async performTaskExecution(task: Task): Promise<{ success: boolean; data?: any; error?: string }> {
    // TODO: 实现具体的任务执行逻辑
    // 这里应该根据任务类型调用相应的执行器
    
    // 模拟执行
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: Math.random() > 0.1, // 90% 成功率
      data: { executed: true }
    };
  }
  
  private calculatePriorityScore(task: Task): number {
    let score = 0;
    
    // 基础优先级分数
    switch (task.priority) {
      case TaskPriority.HIGH: score += 100; break;
      case TaskPriority.MEDIUM: score += 50; break;
      case TaskPriority.LOW: score += 10; break;
    }
    
    // 时间因子（越早调度分数越高）
    const delay = task.scheduledTime.getTime() - Date.now();
    score -= Math.max(0, delay / (60 * 1000)); // 每分钟延迟减1分
    
    return score;
  }
  
  private sortQueue(): void {
    this.taskQueue.sort((a, b) => {
      // 先按优先级分数排序
      const scoreDiff = b.priority_score - a.priority_score;
      if (scoreDiff !== 0) return scoreDiff;
      
      // 再按时间排序
      return a.scheduled_for.getTime() - b.scheduled_for.getTime();
    });
  }
  
  private areDependenciesMet(dependencies: string[]): boolean {
    // TODO: 检查依赖任务是否都已完成
    return dependencies.length === 0;
  }
  
  private isInExecutionWindow(time: Date): boolean {
    const hour = time.getHours();
    
    for (const window of this.config.execution_windows) {
      if (hour >= window.start_hour && hour <= window.end_hour) {
        return true;
      }
    }
    
    return this.config.execution_windows.length === 0;
  }
  
  private canExecuteForPlatform(platform: Platform): boolean {
    const limits = this.config.platform_limits.get(platform);
    if (!limits) return true;
    
    const lastExecution = this.lastExecutionTimes.get(platform);
    if (!lastExecution) return true;
    
    const timeSinceLastExecution = Date.now() - lastExecution.getTime();
    return timeSinceLastExecution >= limits.min_delay_between_tasks_ms;
  }
  
  private calculateRetryTime(retryCount: number): Date {
    const strategy = this.config.retry_policy.backoff_strategy;
    let delay = this.config.retry_policy.base_delay_ms;
    
    switch (strategy) {
      case 'linear':
        delay *= retryCount;
        break;
      case 'exponential':
        delay *= Math.pow(2, retryCount - 1);
        break;
      case 'fixed':
        // 使用基础延迟
        break;
    }
    
    delay = Math.min(delay, this.config.retry_policy.max_delay_ms);
    return new Date(Date.now() + delay);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建默认任务调度器
 */
export function createDefaultTaskScheduler(): TaskScheduler {
  const config: TaskScheduleConfig = {
    max_concurrent_tasks: 3,
    retry_policy: {
      max_retries: 3,
      backoff_strategy: 'exponential',
      base_delay_ms: 60000, // 1分钟
      max_delay_ms: 3600000 // 1小时
    },
    execution_windows: [
      { start_hour: 9, end_hour: 22, max_tasks_per_window: 100 }
    ],
    platform_limits: new Map([
      [Platform.DOUYIN, { max_tasks_per_hour: 50, min_delay_between_tasks_ms: 5000 }],
      [Platform.OCEANENGINE, { max_tasks_per_hour: 30, min_delay_between_tasks_ms: 10000 }],
      [Platform.PUBLIC, { max_tasks_per_hour: 100, min_delay_between_tasks_ms: 2000 }]
    ])
  };
  
  return new TaskScheduler(config);
}

/**
 * 创建任务状态机
 */
export function createTaskStateMachine(): TaskStateMachine {
  return new TaskStateMachine();
}