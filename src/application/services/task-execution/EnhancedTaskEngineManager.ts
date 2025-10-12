// src/application/services/task-execution/EnhancedTaskEngineManager.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 增强任务引擎管理器
 * 
 * 🎯 目标：统一Application和Modules层的任务引擎实现
 * 🔄 策略：桥接模式 + 适配器模式，确保无缝集成
 * 📅 创建：任务引擎架构整合阶段
 * 
 * ✅ 整合功能：
 * - TaskExecutionEngine (application层) - 执行策略、设备管理
 * - TaskEngineService (modules层) - 生成、查询、管理
 * - 保持向后兼容性
 * - 统一接口调用
 */

import {
  UnifiedTaskEngine,
  UnifiedTaskEngineBase,
  UnifiedTaskGenerationParams,
  UnifiedTaskGenerationResult,
  UnifiedTaskExecutionParams,
  UnifiedTaskExecutionResult,
  UnifiedTaskQueryParams,
  UnifiedTaskQueryResult,
  UnifiedTaskAssignmentResult,
  UnifiedTaskExecutionStats,
  ExecutionStrategy,
  ExecutorMode,
  ResultCode,
  TaskPriority
} from './UnifiedTaskEngine';

// ==================== 重新导出类型 ====================

export type {
  UnifiedTaskGenerationParams,
  UnifiedTaskGenerationResult,
  UnifiedTaskExecutionParams,
  UnifiedTaskExecutionResult,
  UnifiedTaskQueryParams,
  UnifiedTaskQueryResult,
  UnifiedTaskAssignmentResult,
  UnifiedTaskExecutionStats,
  TaskPriority
};

export {
  ExecutionStrategy,
  ExecutorMode,
  ResultCode
};

import { Task, WatchTarget } from '../../../modules/precise-acquisition/shared/types/core';
import { TaskStatus, TaskType } from '../../../constants/precise-acquisition-enums';

// 导入现有实现
import { TaskExecutionEngine } from './TaskExecutionEngine';
import { ProspectingTaskEngineService } from '../../../modules/precise-acquisition/task-engine/services/prospecting-task-engine-service';
import { TaskGenerator } from '../../../modules/precise-acquisition/task-engine/services/TaskGenerator';
import { TaskQueryService } from '../../../modules/precise-acquisition/task-engine/services/TaskQueryService';
import { ProspectingTaskManager } from '../../../modules/precise-acquisition/task-engine/services/prospecting-task-manager';

/**
 * 🚀 增强任务引擎管理器
 * 
 * 统一管理器，整合所有任务引擎功能：
 * - 生成：委托给TaskGenerator
 * - 执行：委托给TaskExecutionEngine  
 * - 查询：委托给TaskQueryService
 * - 管理：委托给TaskManager
 * - 统计：聚合多方数据
 */
export class EnhancedTaskEngineManager extends UnifiedTaskEngineBase {
  private taskExecutionEngine: TaskExecutionEngine;
  private taskEngineService: ProspectingTaskEngineService;
  private taskGenerator: TaskGenerator;
  private taskQueryService: TaskQueryService;
  private taskManager: ProspectingTaskManager;

  constructor() {
    super();
    
    // 🔧 初始化现有组件
    this.taskExecutionEngine = new TaskExecutionEngine();
    this.taskEngineService = new ProspectingTaskEngineService();
    this.taskGenerator = new TaskGenerator();
    this.taskQueryService = new TaskQueryService();
    this.taskManager = new ProspectingTaskManager();
  }

  // ==================== 任务生成 ====================

  /**
   * 🎯 统一任务生成
   * 
   * 优先使用TaskGenerator，回退到TaskEngineService
   */
  async generateTasks(params: UnifiedTaskGenerationParams): Promise<UnifiedTaskGenerationResult> {
    try {
      this.validateTaskParams(params);
      
      // 🔄 使用TaskGenerator进行生成
      const generationResult = await this.taskGenerator.generateTasks({
        target: params.target,
        max_tasks_per_target: params.max_tasks_per_target || 10,
        task_types: params.task_types,
        priority: params.priority || 'normal'
      });

      // 🔄 如果需要执行策略分配，调用TaskExecutionEngine
      let assignmentResults: any[] = [];
      if (params.execution_strategy && generationResult.generated_tasks.length > 0) {
        try {
          assignmentResults = await this.taskExecutionEngine.assignTasksToDevices(
            generationResult.generated_tasks,
            params.assignment_strategy || 'round_robin'
          );
        } catch (error) {
          console.warn('任务分配失败，但生成成功:', error);
        }
      }

      // 🎯 统一结果格式
      return {
        generated_tasks: generationResult.generated_tasks,
        total_count: generationResult.total_count,
        target_id: params.target.id,
        generation_time: new Date(),
        assignment_results: assignmentResults,
        tasks_by_type: this.calculateTasksByType(generationResult.generated_tasks),
        priority_distribution: this.calculatePriorityDistribution(generationResult.generated_tasks)
      };

    } catch (error) {
      console.error('统一任务生成失败:', error);
      
      // 🔄 回退到TaskEngineService
      try {
        return await this.fallbackGeneration(params);
      } catch (fallbackError) {
        console.error('回退生成也失败:', fallbackError);
        throw new Error(`任务生成失败: ${error.message}`);
      }
    }
  }

  /**
   * 🔄 批量任务生成
   */
  async batchGenerateTasks(params: UnifiedTaskGenerationParams[]): Promise<UnifiedTaskGenerationResult[]> {
    const results: UnifiedTaskGenerationResult[] = [];
    
    for (const param of params) {
      try {
        const result = await this.generateTasks(param);
        results.push(result);
      } catch (error) {
        console.error(`批量生成失败 (target: ${param.target.id}):`, error);
        // 🔄 继续处理其他任务，不中断整个批次
        results.push({
          generated_tasks: [],
          total_count: 0,
          target_id: param.target.id,
          generation_time: new Date(),
          tasks_by_type: {},
          priority_distribution: {}
        });
      }
    }
    
    return results;
  }

  // ==================== 任务执行 ====================

  /**
   * 🎯 统一任务执行
   * 
   * 委托给TaskExecutionEngine处理
   */
  async executeTask(params: UnifiedTaskExecutionParams): Promise<UnifiedTaskExecutionResult> {
    try {
      const startTime = Date.now();
      
      // 🔄 调用执行引擎
      const executionResult = await this.taskExecutionEngine.executeTask(
        params.task,
        params.device,
        params.account,
        {
          strategy: params.execution_strategy || ExecutionStrategy.API_FIRST,
          custom_message: params.custom_message,
          template_id: params.template_id,
          target_info: params.target_info
        }
      );

      const executionTime = Date.now() - startTime;
      
      // 🎯 格式化为统一结果
      return {
        task_id: params.task.id,
        status: executionResult.success ? TaskStatus.COMPLETED : TaskStatus.FAILED,
        execution_time_ms: executionTime,
        executed_at: new Date(),
        strategy_used: params.execution_strategy || ExecutionStrategy.API_FIRST,
        execution_mode: this.mapStrategyToMode(params.execution_strategy || ExecutionStrategy.API_FIRST),
        device_id: params.device?.id,
        account_id: params.account?.id,
        result_code: executionResult.success ? ResultCode.SUCCESS : ResultCode.FAILED,
        error_message: executionResult.error,
        execution_details: {
          api_response: executionResult.result,
          template_used: params.template_id,
          rendered_content: params.custom_message
        },
        retry_recommended: !executionResult.success && executionResult.retryable
      };

    } catch (error) {
      console.error('统一任务执行失败:', error);
      
      return {
        task_id: params.task.id,
        status: TaskStatus.FAILED,
        execution_time_ms: 0,
        executed_at: new Date(),
        strategy_used: params.execution_strategy || ExecutionStrategy.API_FIRST,
        execution_mode: ExecutorMode.API,
        error_message: error.message,
        result_code: ResultCode.FAILED,
        retry_recommended: true
      };
    }
  }

  /**
   * 🔄 批量任务执行
   */
  async executeTasks(tasks: Task[], devices?: any[]): Promise<UnifiedTaskExecutionResult[]> {
    const results: UnifiedTaskExecutionResult[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const device = devices && devices[i % devices.length]; // 轮询分配设备
      
      try {
        const result = await this.executeTask({
          task,
          device,
          execution_strategy: ExecutionStrategy.API_FIRST
        });
        results.push(result);
      } catch (error) {
        console.error(`批量执行失败 (task: ${task.id}):`, error);
        results.push({
          task_id: task.id,
          status: TaskStatus.FAILED,
          execution_time_ms: 0,
          executed_at: new Date(),
          strategy_used: ExecutionStrategy.API_FIRST,
          execution_mode: ExecutorMode.API,
          error_message: error.message,
          result_code: ResultCode.FAILED,
          retry_recommended: true
        });
      }
    }
    
    return results;
  }

  // ==================== 任务查询 ====================

  /**
   * 🎯 统一任务查询
   * 
   * 委托给TaskQueryService处理
   */
  async getTasks(params: UnifiedTaskQueryParams): Promise<UnifiedTaskQueryResult> {
    try {
      // 🔄 转换参数格式
      const queryResult = await this.taskQueryService.getTasks({
        status: params.status,
        task_type: params.task_type,
        platform: params.platform,
        assigned_device_id: params.assigned_device_id,
        target_id: params.target_id,
        created_since: params.created_since,
        created_until: params.created_until,
        limit: params.limit || params.page_size || 20,
        offset: params.offset || (params.page ? (params.page - 1) * (params.page_size || 20) : 0),
        order_by: params.order_by || 'created_at',
        order_direction: params.order_direction || 'desc'
      });

      // 🎯 统一结果格式
      return {
        tasks: queryResult.tasks,
        total: queryResult.total,
        page: params.page || 1,
        page_size: params.page_size || 20,
        has_more: queryResult.has_more
      };

    } catch (error) {
      console.error('统一任务查询失败:', error);
      
      // 🔄 返回空结果而不是抛出错误
      return {
        tasks: [],
        total: 0,
        page: params.page || 1,
        page_size: params.page_size || 20,
        has_more: false
      };
    }
  }

  /**
   * 🔄 获取单个任务详情
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      return await this.taskQueryService.getTaskById(taskId);
    } catch (error) {
      console.error('获取任务详情失败:', error);
      return null;
    }
  }

  /**
   * 🔄 统计任务数量
   */
  async countTasks(params: Partial<UnifiedTaskQueryParams>): Promise<number> {
    try {
      const result = await this.getTasks({ ...params, limit: 1 });
      return result.total;
    } catch (error) {
      console.error('统计任务数量失败:', error);
      return 0;
    }
  }

  // ==================== 任务管理 ====================

  /**
   * 🎯 分配任务给设备
   */
  async assignTasksToDevice(deviceId: string, taskIds: string[]): Promise<UnifiedTaskAssignmentResult> {
    try {
      // 🔄 委托给TaskManager
      const assignmentResult = await this.taskManager.assignTasksToDevice(deviceId, taskIds);
      
      // 🎯 格式化结果
      return {
        device_id: deviceId,
        assigned_tasks: assignmentResult.assigned_tasks,
        assignment_time: new Date(),
        total_assigned: assignmentResult.assigned_tasks.length,
        by_type: this.calculateTasksByType(assignmentResult.assigned_tasks),
        by_priority: this.calculatePriorityDistribution(assignmentResult.assigned_tasks)
      };

    } catch (error) {
      console.error('任务分配失败:', error);
      throw new Error(`任务分配失败: ${error.message}`);
    }
  }

  /**
   * 🔄 获取可分配任务
   */
  async getAssignableTasks(deviceId: string, limit?: number): Promise<Task[]> {
    try {
      return await this.taskManager.getAssignableTasks(deviceId, limit);
    } catch (error) {
      console.error('获取可分配任务失败:', error);
      return [];
    }
  }

  /**
   * 🔄 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, result?: any, error?: string): Promise<void> {
    try {
      await this.taskManager.updateTaskStatus(taskId, status, result, error);
    } catch (updateError) {
      console.error('更新任务状态失败:', updateError);
      throw new Error(`更新任务状态失败: ${updateError.message}`);
    }
  }

  /**
   * 🔄 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      await this.taskManager.cancelTask(taskId);
    } catch (error) {
      console.error('取消任务失败:', error);
      throw new Error(`取消任务失败: ${error.message}`);
    }
  }

  /**
   * 🔄 重试失败任务
   */
  async retryTask(taskId: string): Promise<UnifiedTaskExecutionResult> {
    try {
      // 🔄 获取任务详情
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error(`任务不存在: ${taskId}`);
      }

      // 🔄 重新执行任务
      return await this.executeTask({
        task,
        execution_strategy: ExecutionStrategy.API_FIRST
      });

    } catch (error) {
      console.error('重试任务失败:', error);
      throw new Error(`重试任务失败: ${error.message}`);
    }
  }

  // ==================== 统计功能 ====================

  /**
   * 🎯 获取执行统计
   */
  async getExecutionStats(since?: Date): Promise<UnifiedTaskExecutionStats> {
    try {
      // 🔄 从各个服务获取统计数据
      const queryParams: UnifiedTaskQueryParams = {
        created_since: since,
        limit: 1000 // 获取足够的数据进行统计
      };
      
      const allTasks = await this.getTasks(queryParams);
      const tasks = allTasks.tasks;

      // 🔄 基础统计
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const failedTasks = tasks.filter(t => t.status === TaskStatus.FAILED).length;
      const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
      const executingTasks = tasks.filter(t => t.status === TaskStatus.EXECUTING).length;

      // 🔄 按维度统计
      const byPlatform = this.groupByField(tasks, 'platform');
      const byType = this.calculateTasksByType(tasks);
      const byStatus = this.groupByField(tasks, 'status');
      const byPriority = this.calculatePriorityDistribution(tasks);

      // 🔄 效率统计
      const completedTasksWithTime = tasks.filter(t => 
        t.status === TaskStatus.COMPLETED && t.execution_time_ms
      );
      const totalExecutionTime = completedTasksWithTime.reduce((sum, t) => sum + (t.execution_time_ms || 0), 0);
      const averageExecutionTime = completedTasksWithTime.length > 0 
        ? totalExecutionTime / completedTasksWithTime.length 
        : 0;

      return {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        failed_tasks: failedTasks,
        pending_tasks: pendingTasks,
        executing_tasks: executingTasks,
        by_platform: byPlatform,
        by_type: byType,
        by_status: byStatus,
        by_priority: byPriority,
        success_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        average_execution_time_ms: averageExecutionTime,
        total_execution_time_ms: totalExecutionTime,
        period_start: since || new Date(0),
        period_end: new Date(),
        last_updated: new Date(),
        active_devices: 0, // TODO: 从设备管理服务获取
        device_utilization: {} // TODO: 从设备管理服务获取
      };

    } catch (error) {
      console.error('获取执行统计失败:', error);
      
      // 🔄 返回默认统计
      return this.getDefaultStats();
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 🔧 回退任务生成
   */
  private async fallbackGeneration(params: UnifiedTaskGenerationParams): Promise<UnifiedTaskGenerationResult> {
    const result = await this.taskEngineService.generateTasks({
      target: params.target,
      max_tasks_per_target: params.max_tasks_per_target || 10,
      task_types: params.task_types,
      priority: params.priority || 'normal'
    });

    return {
      generated_tasks: result.generated_tasks,
      total_count: result.total_count,
      target_id: params.target.id,
      generation_time: new Date(),
      tasks_by_type: this.calculateTasksByType(result.generated_tasks),
      priority_distribution: this.calculatePriorityDistribution(result.generated_tasks)
    };
  }

  /**
   * 🔧 策略到模式映射
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

  /**
   * 🔧 按类型统计任务
   */
  private calculateTasksByType(tasks: Task[]): Record<TaskType, number> {
    const stats: Record<string, number> = {};
    tasks.forEach(task => {
      const type = task.type as string;
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats as Record<TaskType, number>;
  }

  /**
   * 🔧 按优先级统计任务
   */
  private calculatePriorityDistribution(tasks: Task[]): Record<TaskPriority, number> {
    const stats: Record<string, number> = {};
    tasks.forEach(task => {
      const priority = (task.priority || 'normal') as string;
      stats[priority] = (stats[priority] || 0) + 1;
    });
    return stats as Record<TaskPriority, number>;
  }

  /**
   * 🔧 按字段分组
   */
  private groupByField(tasks: Task[], field: string): Record<string, number> {
    const stats: Record<string, number> = {};
    tasks.forEach(task => {
      const value = (task as any)[field] || 'unknown';
      stats[value] = (stats[value] || 0) + 1;
    });
    return stats;
  }

  /**
   * 🔧 默认统计数据
   */
  private getDefaultStats(): UnifiedTaskExecutionStats {
    return {
      total_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      pending_tasks: 0,
      executing_tasks: 0,
      by_platform: {},
      by_type: {},
      by_status: {},
      by_priority: {},
      success_rate: 0,
      average_execution_time_ms: 0,
      total_execution_time_ms: 0,
      period_start: new Date(),
      period_end: new Date(),
      last_updated: new Date(),
      active_devices: 0,
      device_utilization: {}
    };
  }
}

// ==================== 单例实例 ====================

/**
 * 🎯 全局任务引擎管理器实例
 * 
 * 单例模式确保全应用统一接口
 */
export const enhancedTaskEngineManager = new EnhancedTaskEngineManager();

// ==================== 向后兼容导出 ====================

// Application层兼容性
export { enhancedTaskEngineManager as taskExecutionManager };
export { enhancedTaskEngineManager as applicationTaskEngine };

// Modules层兼容性
export { enhancedTaskEngineManager as taskEngineManager };
export { enhancedTaskEngineManager as modulesTaskEngine };

// 通用别名
export { enhancedTaskEngineManager as unifiedTaskEngine };
export { enhancedTaskEngineManager as taskEngine };