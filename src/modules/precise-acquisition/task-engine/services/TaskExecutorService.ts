/**
 * 任务执行器服务
 * 
 * 实现任务的实际执行逻辑，包括API优先和半自动兜底策略
 * 基于文档要求实现"API 优先；无权限/不开放能力→半自动跳转"
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  Task, 
  TaskStatus, 
  TaskType, 
  ExecutorMode, 
  ResultCode, 
  Platform 
} from '../../shared/types/core';
import { TemplateManagementService, TemplateContext } from '../../template-management';

/**
 * 任务执行上下文
 */
export interface TaskExecutionContext {
  task: Task;
  template_id?: string;
  custom_message?: string;
  target_info?: {
    nickname?: string;
    topic?: string;
    industry?: string;
    region?: string;
  };
}

/**
 * 任务执行结果
 */
export interface TaskExecutionResult {
  task_id: string;
  status: TaskStatus;
  result_code: ResultCode;
  error_message?: string;
  executed_at: Date;
  execution_mode: ExecutorMode;
  execution_details?: {
    api_response?: any;
    manual_action_url?: string;
    template_used?: string;
    rendered_content?: string;
  };
}

/**
 * API执行器接口
 */
interface APIExecutor {
  platform: Platform;
  canExecute(task: Task): Promise<boolean>;
  executeReply(commentId: string, content: string, context: TaskExecutionContext): Promise<boolean>;
  executeFollow(userId: string, context: TaskExecutionContext): Promise<boolean>;
}

/**
 * 抖音API执行器
 */
class DouyinAPIExecutor implements APIExecutor {
  platform = Platform.DOUYIN;
  
  async canExecute(task: Task): Promise<boolean> {
    // 检查抖音API权限和可用性
    // TODO: 实际检查access_token和权限scope
    return true; // 临时返回true
  }
  
  async executeReply(commentId: string, content: string, context: TaskExecutionContext): Promise<boolean> {
    try {
      // TODO: 调用抖音评论回复API
      console.log('抖音API回复评论:', { commentId, content });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('抖音API回复失败:', error);
      return false;
    }
  }
  
  async executeFollow(userId: string, context: TaskExecutionContext): Promise<boolean> {
    try {
      // TODO: 调用抖音关注用户API
      console.log('抖音API关注用户:', { userId });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('抖音API关注失败:', error);
      return false;
    }
  }
}

/**
 * 巨量引擎API执行器
 */
class OceanEngineAPIExecutor implements APIExecutor {
  platform = Platform.OCEANENGINE;
  
  async canExecute(task: Task): Promise<boolean> {
    // 检查巨量引擎API权限和可用性
    return true; // 临时返回true
  }
  
  async executeReply(commentId: string, content: string, context: TaskExecutionContext): Promise<boolean> {
    try {
      // TODO: 调用巨量引擎评论回复API
      console.log('巨量引擎API回复评论:', { commentId, content });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('巨量引擎API回复失败:', error);
      return false;
    }
  }
  
  async executeFollow(userId: string, context: TaskExecutionContext): Promise<boolean> {
    // 巨量引擎通常不支持关注功能
    console.log('巨量引擎不支持关注功能');
    return false;
  }
}

/**
 * 任务执行器服务
 */
export class TaskExecutorService {
  
  private apiExecutors: Map<Platform, APIExecutor> = new Map();
  private templateService = new TemplateManagementService();
  
  constructor() {
    this.initializeExecutors();
  }
  
  /**
   * 初始化执行器
   */
  private initializeExecutors(): void {
    this.apiExecutors.set(Platform.DOUYIN, new DouyinAPIExecutor());
    this.apiExecutors.set(Platform.OCEANENGINE, new OceanEngineAPIExecutor());
    // PUBLIC平台不支持API执行，只能半自动
  }
  
  /**
   * 执行任务
   */
  async executeTask(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { task } = context;
    
    try {
      // 更新任务状态为执行中
      await this.updateTaskStatus(task.id, TaskStatus.EXECUTING);
      
      let result: TaskExecutionResult;
      
      // 根据任务类型和执行模式选择执行策略
      if (task.executor_mode === ExecutorMode.API) {
        result = await this.executeWithAPI(context);
      } else {
        result = await this.executeWithManualFallback(context);
      }
      
      // 更新任务状态
      await this.updateTaskStatus(task.id, result.status, result.error_message);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 更新任务状态为失败
      await this.updateTaskStatus(task.id, TaskStatus.FAILED, errorMessage);
      
      return {
        task_id: task.id,
        status: TaskStatus.FAILED,
        result_code: ResultCode.PERM_ERROR,
        error_message: errorMessage,
        executed_at: new Date(),
        execution_mode: task.executor_mode
      };
    }
  }
  
  /**
   * API模式执行
   */
  private async executeWithAPI(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { task } = context;
    
    // 获取平台信息（通过评论或用户信息推断平台）
    const platform = await this.inferPlatformFromTask(task);
    const executor = this.apiExecutors.get(platform);
    
    if (!executor) {
      // 没有对应的API执行器，降级为半自动模式
      return this.executeWithManualFallback({
        ...context,
        task: { ...task, executor_mode: ExecutorMode.MANUAL }
      });
    }
    
    // 检查API是否可用
    const canExecute = await executor.canExecute(task);
    if (!canExecute) {
      // API不可用，降级为半自动模式
      return this.executeWithManualFallback({
        ...context,
        task: { ...task, executor_mode: ExecutorMode.MANUAL }
      });
    }
    
    // 准备执行内容
    const content = await this.prepareExecutionContent(context);
    
    let success = false;
    let apiResponse: any = null;
    
    try {
      if (task.task_type === TaskType.REPLY && task.comment_id) {
        success = await executor.executeReply(task.comment_id, content, context);
      } else if (task.task_type === TaskType.FOLLOW && task.target_user_id) {
        success = await executor.executeFollow(task.target_user_id, context);
      }
      
      if (success) {
        return {
          task_id: task.id,
          status: TaskStatus.DONE,
          result_code: ResultCode.OK,
          executed_at: new Date(),
          execution_mode: ExecutorMode.API,
          execution_details: {
            api_response: apiResponse,
            template_used: context.template_id,
            rendered_content: content
          }
        };
      } else {
        // API执行失败，尝试半自动模式
        return this.executeWithManualFallback({
          ...context,
          task: { ...task, executor_mode: ExecutorMode.MANUAL }
        });
      }
      
    } catch (error) {
      console.error('API执行出错:', error);
      
      // API执行出错，尝试半自动模式
      return this.executeWithManualFallback({
        ...context,
        task: { ...task, executor_mode: ExecutorMode.MANUAL }
      });
    }
  }
  
  /**
   * 半自动模式执行
   */
  private async executeWithManualFallback(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { task } = context;
    
    try {
      // 准备执行内容
      const content = await this.prepareExecutionContent(context);
      
      // 生成跳转URL和操作指令
      const manualActionUrl = await this.generateManualActionUrl(task, content);
      
      // 调用Tauri命令打开浏览器或显示操作界面
      await invoke('open_manual_task_execution', {
        taskId: task.id,
        actionUrl: manualActionUrl,
        content: content,
        taskType: task.task_type,
        instructions: this.generateManualInstructions(task, content)
      });
      
      return {
        task_id: task.id,
        status: TaskStatus.EXECUTING, // 半自动模式下任务状态保持为执行中，等待用户确认
        result_code: ResultCode.OK,
        executed_at: new Date(),
        execution_mode: ExecutorMode.MANUAL,
        execution_details: {
          manual_action_url: manualActionUrl,
          template_used: context.template_id,
          rendered_content: content
        }
      };
      
    } catch (error) {
      return {
        task_id: task.id,
        status: TaskStatus.FAILED,
        result_code: ResultCode.TEMP_ERROR,
        error_message: error instanceof Error ? error.message : String(error),
        executed_at: new Date(),
        execution_mode: ExecutorMode.MANUAL
      };
    }
  }
  
  /**
   * 准备执行内容（话术）
   */
  private async prepareExecutionContent(context: TaskExecutionContext): Promise<string> {
    const { task, template_id, custom_message, target_info } = context;
    
    // 如果提供了自定义消息，直接使用
    if (custom_message) {
      return custom_message;
    }
    
    // 如果提供了模板ID，渲染模板
    if (template_id) {
      const templateContext: TemplateContext = {
        nickname: target_info?.nickname,
        topic: target_info?.topic,
        industry: target_info?.industry as any,
        region: target_info?.region
      };
      
      const renderResult = await this.templateService.renderTemplate(template_id, templateContext);
      
      if (!renderResult.sensitive_check.passed) {
        throw new Error(`模板内容包含敏感词: ${renderResult.sensitive_check.blocked_words.join(', ')}`);
      }
      
      return renderResult.content;
    }
    
    // 默认内容
    if (task.task_type === TaskType.REPLY) {
      return '感谢您的分享，很有价值！';
    } else if (task.task_type === TaskType.FOLLOW) {
      return ''; // 关注不需要内容
    }
    
    return '';
  }
  
  /**
   * 从任务推断平台
   */
  private async inferPlatformFromTask(task: Task): Promise<Platform> {
    // TODO: 通过评论ID或用户ID推断平台
    // 这里简化处理，实际应该查询评论表获取平台信息
    if (task.comment_id?.includes('douyin')) {
      return Platform.DOUYIN;
    } else if (task.comment_id?.includes('oceanengine')) {
      return Platform.OCEANENGINE;
    }
    
    return Platform.PUBLIC; // 默认
  }
  
  /**
   * 生成半自动操作URL
   */
  private async generateManualActionUrl(task: Task, content: string): Promise<string> {
    // TODO: 根据任务类型和平台生成具体的跳转URL
    // 这里是示例实现
    
    if (task.task_type === TaskType.REPLY && task.comment_id) {
      // 生成跳转到评论页面的URL
      return `https://www.douyin.com/comment/${task.comment_id}?reply=${encodeURIComponent(content)}`;
    } else if (task.task_type === TaskType.FOLLOW && task.target_user_id) {
      // 生成跳转到用户页面的URL
      return `https://www.douyin.com/user/${task.target_user_id}`;
    }
    
    return '#';
  }
  
  /**
   * 生成手动操作指令
   */
  private generateManualInstructions(task: Task, content: string): string {
    if (task.task_type === TaskType.REPLY) {
      return `请在打开的页面中找到对应评论，点击回复，粘贴以下内容：\n\n${content}\n\n然后点击发送。完成后请回到系统中标记任务完成。`;
    } else if (task.task_type === TaskType.FOLLOW) {
      return `请在打开的用户页面中点击关注按钮。完成后请回到系统中标记任务完成。`;
    }
    
    return '请按照页面提示完成操作，然后标记任务完成。';
  }
  
  /**
   * 更新任务状态
   */
  private async updateTaskStatus(taskId: string, status: TaskStatus, errorMessage?: string): Promise<void> {
    try {
      await invoke('update_task_status', {
        taskId,
        status,
        errorMessage,
        executedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  }
  
  /**
   * 批量执行任务
   */
  async executeBatchTasks(contexts: TaskExecutionContext[]): Promise<TaskExecutionResult[]> {
    const results: TaskExecutionResult[] = [];
    
    // 控制并发数量，避免过多同时执行
    const concurrencyLimit = 3;
    const batches: TaskExecutionContext[][] = [];
    
    for (let i = 0; i < contexts.length; i += concurrencyLimit) {
      batches.push(contexts.slice(i, i + concurrencyLimit));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(context => this.executeTask(context));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            task_id: batch[index].task.id,
            status: TaskStatus.FAILED,
            result_code: ResultCode.PERM_ERROR,
            error_message: result.reason instanceof Error ? result.reason.message : String(result.reason),
            executed_at: new Date(),
            execution_mode: batch[index].task.executor_mode
          });
        }
      });
      
      // 批次间延迟，避免过于频繁的操作
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }
  
  /**
   * 手动确认任务完成
   */
  async confirmManualTaskCompletion(taskId: string, successful: boolean, userNotes?: string): Promise<void> {
    try {
      const status = successful ? TaskStatus.DONE : TaskStatus.FAILED;
      const resultCode = successful ? ResultCode.OK : ResultCode.PERM_ERROR;
      
      await invoke('confirm_manual_task_completion', {
        taskId,
        status,
        resultCode,
        userNotes,
        completedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('确认手动任务完成失败:', error);
      throw error;
    }
  }
}