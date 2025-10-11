// src/modules/precise-acquisition/task-execution/executors/TaskExecutors.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客系统 - API执行系统
 * 
 * 实现任务的自动化执行，包括API调用和半自动操作
 */

import { 
  Task,
  WatchTarget,
  Comment 
} from '../../../modules/precise-acquisition/shared/types/core';
import { 
  TaskType, 
  TaskStatus, 
  Platform 
} from '../../../modules/precise-acquisition/shared/constants';

// ==================== 执行器接口 ====================

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
  retry_suggested?: boolean;
  platform_response?: any;
}

/**
 * 执行器配置
 */
export interface ExecutorConfig {
  platform: Platform;
  api_credentials?: {
    access_token?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
  };
  execution_settings?: {
    timeout_ms: number;
    max_retries: number;
    rate_limit_delay_ms: number;
  };
  safety_settings?: {
    enable_content_validation: boolean;
    dry_run_mode: boolean;
    require_manual_approval: boolean;
  };
}

/**
 * 任务执行器基类
 */
export abstract class TaskExecutor {
  protected platform: Platform;
  protected config: ExecutorConfig;
  
  constructor(platform: Platform, config: ExecutorConfig) {
    this.platform = platform;
    this.config = config;
  }
  
  /**
   * 检查是否可以执行任务
   */
  abstract canExecute(task: Task): Promise<boolean>;
  
  /**
   * 执行任务
   */
  abstract execute(task: Task): Promise<TaskExecutionResult>;
  
  /**
   * 验证执行器配置
   */
  abstract validateConfig(): Promise<{ valid: boolean; message?: string }>;
  
  /**
   * 获取执行器状态
   */
  abstract getStatus(): Promise<{
    available: boolean;
    rate_limit_remaining?: number;
    next_available_time?: Date;
  }>;
}

// ==================== 抖音执行器 ====================

/**
 * 抖音API任务执行器
 */
export class DouyinTaskExecutor extends TaskExecutor {
  
  constructor(config: ExecutorConfig) {
    super(Platform.DOUYIN, config);
  }
  
  async canExecute(task: Task): Promise<boolean> {
    // 检查平台匹配
    if (task.platform !== Platform.DOUYIN) return false;
    
    // 检查API凭证
    if (!this.config.api_credentials?.access_token) return false;
    
    // 检查任务类型支持
    return [TaskType.REPLY, TaskType.FOLLOW].includes(task.type);
  }
  
  async execute(task: Task): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 安全检查
      if (this.config.safety_settings?.dry_run_mode) {
        return this.createDryRunResult(task, startTime);
      }
      
      // 内容验证
      if (this.config.safety_settings?.enable_content_validation) {
        const validationResult = await this.validateTaskContent(task);
        if (!validationResult.valid) {
          return {
            task_id: task.id,
            success: false,
            executed_at: new Date(),
            execution_time_ms: Date.now() - startTime,
            error_message: `内容验证失败: ${validationResult.reason}`,
            retry_suggested: false
          };
        }
      }
      
      // 根据任务类型执行
      let result: TaskExecutionResult;
      
      switch (task.type) {
        case TaskType.REPLY:
          result = await this.executeReplyTask(task, startTime);
          break;
        case TaskType.FOLLOW:
          result = await this.executeFollowTask(task, startTime);
          break;
        default:
          result = {
            task_id: task.id,
            success: false,
            executed_at: new Date(),
            execution_time_ms: Date.now() - startTime,
            error_message: `不支持的任务类型: ${task.type}`,
            retry_suggested: false
          };
      }
      
      return result;
      
    } catch (error) {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : '执行异常',
        retry_suggested: true
      };
    }
  }
  
  async validateConfig(): Promise<{ valid: boolean; message?: string }> {
    const credentials = this.config.api_credentials;
    
    if (!credentials?.access_token) {
      return { valid: false, message: '缺少抖音API访问令牌' };
    }
    
    try {
      // 测试API连接
      const response = await this.callDouyinAPI('/oauth/userinfo/', {
        access_token: credentials.access_token
      });
      
      if (response.error_code === 0) {
        return { valid: true, message: '抖音API配置有效' };
      } else {
        return { valid: false, message: `API错误: ${response.description}` };
      }
      
    } catch (error) {
      return { 
        valid: false, 
        message: `API连接失败: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }
  
  async getStatus(): Promise<{
    available: boolean;
    rate_limit_remaining?: number;
    next_available_time?: Date;
  }> {
    try {
      // TODO: 查询API速率限制状态
      return {
        available: true,
        rate_limit_remaining: 100
      };
    } catch (error) {
      return {
        available: false,
        next_available_time: new Date(Date.now() + 60000) // 1分钟后重试
      };
    }
  }
  
  // ==================== 私有方法 ====================
  
  private async executeReplyTask(task: Task, startTime: number): Promise<TaskExecutionResult> {
    try {
      // 获取评论ID（从任务元数据或目标ID）
      const commentId = task.metadata?.comment_id || task.targetId;
      const replyContent = task.content;
      
      // 调用抖音回复API
      const response = await this.callDouyinAPI('/api/comment/reply/', {
        access_token: this.config.api_credentials!.access_token,
        comment_id: commentId,
        content: replyContent
      });
      
      if (response.error_code === 0) {
        return {
          task_id: task.id,
          success: true,
          executed_at: new Date(),
          execution_time_ms: Date.now() - startTime,
          result_data: {
            reply_id: response.data?.reply_id,
            comment_id: commentId,
            content: replyContent
          },
          platform_response: response
        };
      } else {
        return {
          task_id: task.id,
          success: false,
          executed_at: new Date(),
          execution_time_ms: Date.now() - startTime,
          error_message: `抖音API错误: ${response.description}`,
          retry_suggested: this.shouldRetry(response.error_code),
          platform_response: response
        };
      }
      
    } catch (error) {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        error_message: `回复执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        retry_suggested: true
      };
    }
  }
  
  private async executeFollowTask(task: Task, startTime: number): Promise<TaskExecutionResult> {
    try {
      const authorId = task.targetId;
      
      // 调用抖音关注API
      const response = await this.callDouyinAPI('/api/fans/follow/', {
        access_token: this.config.api_credentials!.access_token,
        sec_user_id: authorId
      });
      
      if (response.error_code === 0) {
        return {
          task_id: task.id,
          success: true,
          executed_at: new Date(),
          execution_time_ms: Date.now() - startTime,
          result_data: {
            followed_user_id: authorId,
            follow_status: response.data?.follow_status
          },
          platform_response: response
        };
      } else {
        return {
          task_id: task.id,
          success: false,
          executed_at: new Date(),
          execution_time_ms: Date.now() - startTime,
          error_message: `抖音关注API错误: ${response.description}`,
          retry_suggested: this.shouldRetry(response.error_code),
          platform_response: response
        };
      }
      
    } catch (error) {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        error_message: `关注执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        retry_suggested: true
      };
    }
  }
  
  private async callDouyinAPI(endpoint: string, params: any): Promise<any> {
    const baseUrl = 'https://open.douyin.com';
    const url = `${baseUrl}${endpoint}`;
    
    // 添加通用参数
    const requestParams = {
      ...params,
      timestamp: Date.now(),
      nonce: this.generateNonce()
    };
    
    // TODO: 实现真实的HTTP请求
    // 这里返回模拟响应
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          error_code: 0,
          description: 'success',
          data: {
            reply_id: 'mock_reply_' + Date.now(),
            follow_status: 1
          }
        });
      }, 1000);
    });
  }
  
  private async validateTaskContent(task: Task): Promise<{ valid: boolean; reason?: string }> {
    // 基本内容检查
    if (!task.content || task.content.trim().length === 0) {
      return { valid: false, reason: '任务内容为空' };
    }
    
    if (task.content.length > 500) {
      return { valid: false, reason: '内容长度超限' };
    }
    
    // 敏感词检查
    const sensitiveWords = ['广告', '加微信', '私聊', 'QQ'];
    for (const word of sensitiveWords) {
      if (task.content.includes(word)) {
        return { valid: false, reason: `包含敏感词: ${word}` };
      }
    }
    
    return { valid: true };
  }
  
  private createDryRunResult(task: Task, startTime: number): TaskExecutionResult {
    return {
      task_id: task.id,
      success: true,
      executed_at: new Date(),
      execution_time_ms: Date.now() - startTime,
      result_data: {
        dry_run: true,
        task_type: task.type,
        content: task.content,
        target_id: task.targetId
      }
    };
  }
  
  private shouldRetry(errorCode: number): boolean {
    // 可重试的错误码
    const retryableErrors = [
      -1,    // 系统错误
      10002, // 参数错误
      10003, // 授权失败
      10004, // 调用频率限制
    ];
    
    return retryableErrors.includes(errorCode);
  }
  
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// ==================== 半自动执行器 ====================

/**
 * 半自动任务执行器
 * 用于需要人工确认或操作的任务
 */
export class SemiAutomaticExecutor extends TaskExecutor {
  private pendingApprovals: Map<string, Task>;
  
  constructor(platform: Platform, config: ExecutorConfig) {
    super(platform, config);
    this.pendingApprovals = new Map();
  }
  
  async canExecute(task: Task): Promise<boolean> {
    return true; // 半自动执行器可以处理所有任务
  }
  
  async execute(task: Task): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 如果需要人工审批
      if (this.config.safety_settings?.require_manual_approval) {
        return await this.requestManualApproval(task, startTime);
      }
      
      // 生成执行指令
      const instruction = this.generateExecutionInstruction(task);
      
      return {
        task_id: task.id,
        success: true,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        result_data: {
          execution_mode: 'semi_automatic',
          instruction,
          requires_manual_action: true
        }
      };
      
    } catch (error) {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : '半自动执行失败',
        retry_suggested: false
      };
    }
  }
  
  async validateConfig(): Promise<{ valid: boolean; message?: string }> {
    return { valid: true, message: '半自动执行器无需特殊配置' };
  }
  
  async getStatus(): Promise<{
    available: boolean;
    rate_limit_remaining?: number;
    next_available_time?: Date;
  }> {
    return {
      available: true,
      rate_limit_remaining: 9999 // 无API限制
    };
  }
  
  /**
   * 批准待审任务
   */
  async approveTask(taskId: string, approved: boolean): Promise<TaskExecutionResult> {
    const task = this.pendingApprovals.get(taskId);
    if (!task) {
      throw new Error(`未找到待审任务: ${taskId}`);
    }
    
    this.pendingApprovals.delete(taskId);
    
    if (approved) {
      // 执行已批准的任务
      const instruction = this.generateExecutionInstruction(task);
      
      return {
        task_id: task.id,
        success: true,
        executed_at: new Date(),
        execution_time_ms: 0,
        result_data: {
          approved: true,
          instruction,
          execution_mode: 'manual_approved'
        }
      };
    } else {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: 0,
        error_message: '任务被拒绝执行',
        retry_suggested: false
      };
    }
  }
  
  /**
   * 获取待审任务列表
   */
  getPendingApprovals(): Task[] {
    return Array.from(this.pendingApprovals.values());
  }
  
  private async requestManualApproval(task: Task, startTime: number): Promise<TaskExecutionResult> {
    this.pendingApprovals.set(task.id, task);
    
    return {
      task_id: task.id,
      success: true,
      executed_at: new Date(),
      execution_time_ms: Date.now() - startTime,
      result_data: {
        status: 'pending_approval',
        requires_approval: true,
        instruction: this.generateExecutionInstruction(task)
      }
    };
  }
  
  private generateExecutionInstruction(task: Task): string {
    switch (task.type) {
      case TaskType.REPLY:
        return `请在平台上回复评论:\n` +
               `评论ID: ${task.targetId}\n` +
               `回复内容: ${task.content}\n` +
               `平台: ${task.platform}`;
      
      case TaskType.FOLLOW:
        return `请在平台上关注用户:\n` +
               `用户ID: ${task.targetId}\n` +
               `平台: ${task.platform}`;
      
      default:
        return `请执行任务:\n` +
               `类型: ${task.type}\n` +
               `内容: ${task.content}\n` +
               `目标: ${task.targetId}`;
    }
  }
}

// ==================== 执行器工厂 ====================

/**
 * 任务执行器工厂
 */
export class TaskExecutorFactory {
  
  /**
   * 创建执行器
   */
  static createExecutor(
    platform: Platform,
    config: ExecutorConfig,
    executionMode: 'automatic' | 'semi_automatic' = 'automatic'
  ): TaskExecutor {
    if (executionMode === 'semi_automatic') {
      return new SemiAutomaticExecutor(platform, config);
    }
    
    switch (platform) {
      case Platform.DOUYIN:
        return new DouyinTaskExecutor(config);
      
      case Platform.OCEANENGINE:
        // TODO: 实现巨量引擎执行器
        return new SemiAutomaticExecutor(platform, config);
      
      case Platform.PUBLIC:
        // 公开平台只支持半自动
        return new SemiAutomaticExecutor(platform, config);
      
      default:
        throw new Error(`不支持的平台执行器: ${platform}`);
    }
  }
  
  /**
   * 创建多平台执行器
   */
  static createMultiPlatformExecutors(
    configs: Array<{
      platform: Platform;
      config: ExecutorConfig;
      mode?: 'automatic' | 'semi_automatic';
    }>
  ): Map<Platform, TaskExecutor> {
    const executors = new Map<Platform, TaskExecutor>();
    
    for (const { platform, config, mode } of configs) {
      const executor = this.createExecutor(platform, config, mode);
      executors.set(platform, executor);
    }
    
    return executors;
  }
}

// ==================== 执行协调器 ====================

/**
 * 任务执行协调器
 * 统一管理多个执行器的任务分发和结果收集
 */
export class TaskExecutionCoordinator {
  private executors: Map<Platform, TaskExecutor>;
  
  constructor(executors: Map<Platform, TaskExecutor>) {
    this.executors = executors;
  }
  
  /**
   * 执行任务
   */
  async executeTask(task: Task): Promise<TaskExecutionResult> {
    const executor = this.executors.get(task.platform);
    
    if (!executor) {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: 0,
        error_message: `未找到平台 ${task.platform} 的执行器`,
        retry_suggested: false
      };
    }
    
    const canExecute = await executor.canExecute(task);
    if (!canExecute) {
      return {
        task_id: task.id,
        success: false,
        executed_at: new Date(),
        execution_time_ms: 0,
        error_message: '执行器无法处理此任务',
        retry_suggested: false
      };
    }
    
    return executor.execute(task);
  }
  
  /**
   * 批量执行任务
   */
  async executeTasks(tasks: Task[]): Promise<TaskExecutionResult[]> {
    const results: TaskExecutionResult[] = [];
    
    for (const task of tasks) {
      try {
        const result = await this.executeTask(task);
        results.push(result);
      } catch (error) {
        results.push({
          task_id: task.id,
          success: false,
          executed_at: new Date(),
          execution_time_ms: 0,
          error_message: error instanceof Error ? error.message : '执行异常',
          retry_suggested: true
        });
      }
    }
    
    return results;
  }
  
  /**
   * 获取所有执行器状态
   */
  async getAllExecutorStatus(): Promise<Map<Platform, any>> {
    const statusMap = new Map();
    
    for (const [platform, executor] of this.executors) {
      try {
        const status = await executor.getStatus();
        statusMap.set(platform, status);
      } catch (error) {
        statusMap.set(platform, {
          available: false,
          error: error instanceof Error ? error.message : '状态查询失败'
        });
      }
    }
    
    return statusMap;
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建默认执行协调器
 */
export function createDefaultTaskExecutionCoordinator(): TaskExecutionCoordinator {
  const executors = TaskExecutorFactory.createMultiPlatformExecutors([
    {
      platform: Platform.DOUYIN,
      config: {
        platform: Platform.DOUYIN,
        execution_settings: {
          timeout_ms: 30000,
          max_retries: 3,
          rate_limit_delay_ms: 5000
        },
        safety_settings: {
          enable_content_validation: true,
          dry_run_mode: false,
          require_manual_approval: false
        }
      },
      mode: 'automatic'
    },
    {
      platform: Platform.OCEANENGINE,
      config: {
        platform: Platform.OCEANENGINE,
        execution_settings: {
          timeout_ms: 30000,
          max_retries: 3,
          rate_limit_delay_ms: 10000
        },
        safety_settings: {
          enable_content_validation: true,
          dry_run_mode: false,
          require_manual_approval: true
        }
      },
      mode: 'semi_automatic'
    },
    {
      platform: Platform.PUBLIC,
      config: {
        platform: Platform.PUBLIC,
        execution_settings: {
          timeout_ms: 60000,
          max_retries: 1,
          rate_limit_delay_ms: 2000
        },
        safety_settings: {
          enable_content_validation: true,
          dry_run_mode: false,
          require_manual_approval: true
        }
      },
      mode: 'semi_automatic'
    }
  ]);
  
  return new TaskExecutionCoordinator(executors);
}