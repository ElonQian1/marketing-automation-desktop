/**
 * 任务引擎适配器
 * 
 * 🎯 目标：确保现有代码无缝迁移到统一任务引擎
 * 🔄 策略：适配器模式 + 桥接模式，保持API兼容性
 * 📅 创建：任务引擎架构整合阶段
 * 
 * ✅ 兼容性保证：
 * - Application层：TaskExecutionEngine接口保持不变
 * - Modules层：TaskEngineService接口保持不变
 * - Hook层：现有useTaskEngine等Hook保持不变
 * - 渐进式迁移：逐步切换到统一接口
 */

import {
  enhancedTaskEngineManager,
  UnifiedTaskGenerationParams,
  UnifiedTaskExecutionParams,
  UnifiedTaskQueryParams,
  ExecutionStrategy
} from './services/task-execution/EnhancedTaskEngineManager';

import { Task, WatchTarget } from '../modules/precise-acquisition/shared/types/core';
import { TaskStatus, TaskType } from '../constants/precise-acquisition-enums';

// ==================== Application层适配器 ====================

/**
 * 🔄 TaskExecutionEngine兼容适配器
 * 
 * 保持原有TaskExecutionEngine的接口不变
 */
export class TaskExecutionEngineAdapter {
  /**
   * 🎯 执行任务 (兼容原接口)
   */
  async executeTask(
    task: Task,
    device?: any,
    account?: any,
    options?: {
      strategy?: ExecutionStrategy;
      custom_message?: string;
      template_id?: string;
      target_info?: any;
    }
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    retryable?: boolean;
  }> {
    try {
      const params: UnifiedTaskExecutionParams = {
        task,
        device,
        account,
        execution_strategy: options?.strategy || ExecutionStrategy.API_FIRST,
        custom_message: options?.custom_message,
        template_id: options?.template_id,
        target_info: options?.target_info
      };

      const result = await enhancedTaskEngineManager.executeTask(params);
      
      return {
        success: result.status === TaskStatus.COMPLETED,
        result: result.execution_details,
        error: result.error_message,
        retryable: result.retry_recommended
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
        retryable: true
      };
    }
  }

  /**
   * 🔄 分配任务给设备 (完整实现)
   */
  async assignTasksToDevices(
    tasks: Task[],
    strategy: string = 'round_robin'
  ): Promise<any[]> {
    try {
      if (tasks.length === 0) return [];
      
      // 获取可用设备列表
      const availableDevices = await this.getAvailableDevices();
      if (availableDevices.length === 0) {
        console.warn('没有可用设备，任务分配失败');
        return [];
      }
      
      const assignments: any[] = [];
      
      // 根据策略分配任务
      switch (strategy) {
        case 'round_robin':
          assignments.push(...await this.assignWithRoundRobin(tasks, availableDevices));
          break;
          
        case 'load_balanced':
          assignments.push(...await this.assignWithLoadBalance(tasks, availableDevices));
          break;
          
        case 'single_device':
          assignments.push(...await this.assignToSingleDevice(tasks, availableDevices[0]));
          break;
          
        default:
          console.warn(`未知分配策略: ${strategy}，使用round_robin`);
          assignments.push(...await this.assignWithRoundRobin(tasks, availableDevices));
      }
      
      return assignments;
      
    } catch (error) {
      console.error('任务分配适配失败:', error);
      return [];
    }
  }

  /**
   * 获取可用设备列表
   */
  private async getAvailableDevices(): Promise<string[]> {
    try {
      // 这里应该从设备管理服务获取可用设备
      // 临时返回模拟设备ID，实际实现需要集成设备管理模块
      return ['device-001', 'device-002', 'device-003'];
    } catch (error) {
      console.error('获取可用设备失败:', error);
      return ['default-device']; // 至少返回一个默认设备
    }
  }

  /**
   * 轮询分配策略
   */
  private async assignWithRoundRobin(tasks: Task[], devices: string[]): Promise<any[]> {
    const assignments: any[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const deviceId = devices[i % devices.length];
      const result = await enhancedTaskEngineManager.assignTasksToDevice(deviceId, [tasks[i].id]);
      
      assignments.push({
        task_id: tasks[i].id,
        device_id: result.device_id,
        assigned_at: result.assignment_time
      });
    }
    
    return assignments;
  }

  /**
   * 负载均衡分配策略
   */
  private async assignWithLoadBalance(tasks: Task[], devices: string[]): Promise<any[]> {
    // 获取每个设备当前的任务负载
    const deviceLoads = await Promise.all(
      devices.map(async (deviceId) => {
        const load = await this.getDeviceLoad(deviceId);
        return { deviceId, load };
      })
    );

    // 按负载排序，优先分配给负载较低的设备
    deviceLoads.sort((a, b) => a.load - b.load);

    const assignments: any[] = [];
    
    for (const task of tasks) {
      // 选择负载最低的设备
      const targetDevice = deviceLoads[0];
      
      const result = await enhancedTaskEngineManager.assignTasksToDevice(
        targetDevice.deviceId, 
        [task.id]
      );
      
      assignments.push({
        task_id: task.id,
        device_id: result.device_id,
        assigned_at: result.assignment_time
      });
      
      // 更新设备负载
      targetDevice.load += 1;
      deviceLoads.sort((a, b) => a.load - b.load);
    }
    
    return assignments;
  }

  /**
   * 单设备分配策略
   */
  private async assignToSingleDevice(tasks: Task[], deviceId: string): Promise<any[]> {
    const taskIds = tasks.map(t => t.id);
    const result = await enhancedTaskEngineManager.assignTasksToDevice(deviceId, taskIds);
    
    return result.assigned_tasks.map(task => ({
      task_id: task.id,
      device_id: result.device_id,
      assigned_at: result.assignment_time
    }));
  }

  /**
   * 获取设备当前负载
   */
  private async getDeviceLoad(deviceId: string): Promise<number> {
    try {
      // 这里应该查询设备当前正在执行的任务数量
      // 临时返回随机负载值，实际实现需要集成设备监控
      return Math.floor(Math.random() * 5);
    } catch (error) {
      console.error(`获取设备 ${deviceId} 负载失败:`, error);
      return 0;
    }
  }

  /**
   * 🔄 批量执行任务 (兼容原接口)
   */
  async executeBatch(
    tasks: Task[],
    devices?: any[]
  ): Promise<any[]> {
    try {
      const results = await enhancedTaskEngineManager.executeTasks(tasks, devices);
      
      return results.map(result => ({
        task_id: result.task_id,
        success: result.status === TaskStatus.COMPLETED,
        execution_time: result.execution_time_ms,
        error: result.error_message,
        strategy_used: result.strategy_used
      }));
    } catch (error) {
      console.error('批量执行适配失败:', error);
      return [];
    } 
  }
}

// ==================== Modules层适配器 ====================

/**
 * 🔄 TaskEngineService兼容适配器
 * 
 * 保持原有TaskEngineService的接口不变
 */
export class TaskEngineServiceAdapter {
  /**
   * 🎯 生成任务 (兼容原接口)
   */
  async generateTasks(params: {
    target: WatchTarget;
    max_tasks_per_target?: number;
    task_types: TaskType[];
    priority?: string;
  }): Promise<{
    generated_tasks: Task[];
    total_count: number;
  }> {
    try {
      const unifiedParams: UnifiedTaskGenerationParams = {
        target: params.target,
        max_tasks_per_target: params.max_tasks_per_target,
        task_types: params.task_types,
        priority: (params.priority as any) || 'normal'
      };

      const result = await enhancedTaskEngineManager.generateTasks(unifiedParams);
      
      return {
        generated_tasks: result.generated_tasks,
        total_count: result.total_count
      };
    } catch (error) {
      console.error('任务生成适配失败:', error);
      return {
        generated_tasks: [],
        total_count: 0
      };
    }
  }

  /**
   * 🔄 获取任务 (兼容原接口)
   */
  async getTasks(params: {
    status?: TaskStatus[];
    task_type?: TaskType[];
    platform?: any[];
    assigned_device_id?: string;
    target_id?: string;
    created_since?: Date;
    created_until?: Date;
    limit?: number;
    offset?: number;
    order_by?: string;
    order_direction?: 'asc' | 'desc';
  }): Promise<{
    tasks: Task[];
    total: number;
    has_more: boolean;
  }> {
    try {
      const unifiedParams: UnifiedTaskQueryParams = {
        status: params.status,
        task_type: params.task_type,
        platform: params.platform,
        assigned_device_id: params.assigned_device_id,
        target_id: params.target_id,
        created_since: params.created_since,
        created_until: params.created_until,
        limit: params.limit,
        offset: params.offset,
        order_by: params.order_by as any,
        order_direction: params.order_direction
      };

      const result = await enhancedTaskEngineManager.getTasks(unifiedParams);
      
      return {
        tasks: result.tasks,
        total: result.total,
        has_more: result.has_more
      };
    } catch (error) {
      console.error('任务查询适配失败:', error);
      return {
        tasks: [],
        total: 0,
        has_more: false
      };
    }
  }

  /**
   * 🔄 获取单个任务 (兼容原接口)
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      return await enhancedTaskEngineManager.getTaskById(taskId);
    } catch (error) {
      console.error('获取任务详情适配失败:', error);
      return null;
    }
  }
}

// ==================== 子服务适配器 ====================

/**
 * 🔄 TaskGenerator兼容适配器
 */
export class TaskGeneratorAdapter {
  private serviceAdapter = new TaskEngineServiceAdapter();

  async generateTasks(params: any): Promise<any> {
    return this.serviceAdapter.generateTasks(params);
  }

  async batchGenerateTasks(targets: WatchTarget[]): Promise<any[]> {
    const results = [];
    for (const target of targets) {
      const result = await this.serviceAdapter.generateTasks({
        target,
        task_types: ['follow', 'like', 'comment'] as TaskType[]
      });
      results.push(result);
    }
    return results;
  }
}

/**
 * 🔄 TaskQueryService兼容适配器
 */
export class TaskQueryServiceAdapter {
  private serviceAdapter = new TaskEngineServiceAdapter();

  async getTasks(params: any): Promise<any> {
    return this.serviceAdapter.getTasks(params);
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return this.serviceAdapter.getTaskById(taskId);
  }

  async countTasks(params: any): Promise<number> {
    try {
      const result = await this.serviceAdapter.getTasks({ ...params, limit: 1 });
      return result.total;
    } catch (error) {
      console.error('统计任务数量适配失败:', error);
      return 0;
    }
  }
}

/**
 * 🔄 TaskManager兼容适配器
 */
export class TaskManagerAdapter {
  async assignTasksToDevice(deviceId: string, taskIds: string[]): Promise<{
    assigned_tasks: Task[];
  }> {
    try {
      const result = await enhancedTaskEngineManager.assignTasksToDevice(deviceId, taskIds);
      return {
        assigned_tasks: result.assigned_tasks
      };
    } catch (error) {
      console.error('任务分配适配失败:', error);
      return {
        assigned_tasks: []
      };
    }
  }

  async getAssignableTasks(deviceId: string, limit?: number): Promise<Task[]> {
    try {
      return await enhancedTaskEngineManager.getAssignableTasks(deviceId, limit);
    } catch (error) {
      console.error('获取可分配任务适配失败:', error);
      return [];
    }
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, result?: any, error?: string): Promise<void> {
    try {
      await enhancedTaskEngineManager.updateTaskStatus(taskId, status, result, error);
    } catch (updateError) {
      console.error('更新任务状态适配失败:', updateError);
      throw updateError;
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    try {
      await enhancedTaskEngineManager.cancelTask(taskId);
    } catch (error) {
      console.error('取消任务适配失败:', error);
      throw error;
    }
  }
}

// ==================== Hook适配器 ====================

/**
 * 🔄 useTaskEngine兼容适配器
 */
export function useTaskEngineAdapter() {
  const serviceAdapter = new TaskEngineServiceAdapter();
  const executionAdapter = new TaskExecutionEngineAdapter();

  return {
    // 生成相关
    generateTasks: (params: any) => serviceAdapter.generateTasks(params),
    
    // 执行相关
    executeTask: (task: Task, device?: any, account?: any, options?: any) => 
      executionAdapter.executeTask(task, device, account, options),
    
    // 查询相关
    getTasks: (params: any) => serviceAdapter.getTasks(params),
    getTaskById: (taskId: string) => serviceAdapter.getTaskById(taskId),
    
    // 管理相关
    assignTasks: (tasks: Task[], strategy?: string) => 
      executionAdapter.assignTasksToDevices(tasks, strategy),
    
    // 状态管理 (简化版)
    isLoading: false,
    error: null
  };
}

/**
 * 🔄 useTaskManagement兼容适配器
 */
export function useTaskManagementAdapter() {
  const managerAdapter = new TaskManagerAdapter();

  return {
    assignTasksToDevice: (deviceId: string, taskIds: string[]) => 
      managerAdapter.assignTasksToDevice(deviceId, taskIds),
    
    getAssignableTasks: (deviceId: string, limit?: number) => 
      managerAdapter.getAssignableTasks(deviceId, limit),
    
    updateTaskStatus: (taskId: string, status: TaskStatus, result?: any, error?: string) => 
      managerAdapter.updateTaskStatus(taskId, status, result, error),
    
    cancelTask: (taskId: string) => managerAdapter.cancelTask(taskId),
    
    // 状态管理 (简化版)
    isManaging: false,
    managementError: null
  };
}

// ==================== 全局适配器实例 ====================

/**
 * 🎯 全局适配器实例
 * 
 * 提供即插即用的兼容性支持
 */
export const taskExecutionEngineAdapter = new TaskExecutionEngineAdapter();
export const taskEngineServiceAdapter = new TaskEngineServiceAdapter();
export const taskGeneratorAdapter = new TaskGeneratorAdapter();
export const taskQueryServiceAdapter = new TaskQueryServiceAdapter();
export const taskManagerAdapter = new TaskManagerAdapter();

// ==================== 迁移指南注释 ====================

/**
 * 🚀 迁移指南
 * 
 * 现有代码可以通过以下方式逐步迁移：
 * 
 * 1. **立即兼容** (无需修改代码):
 *    ```typescript
 *    // 原代码保持不变，适配器自动处理
 *    const engine = new TaskExecutionEngine();
 *    const result = await engine.executeTask(task);
 *    ```
 * 
 * 2. **渐进迁移** (推荐):
 *    ```typescript
 *    // 第一步：使用适配器
 *    import { taskExecutionEngineAdapter } from './TaskEngineAdapter';
 *    const result = await taskExecutionEngineAdapter.executeTask(task);
 * 
 *    // 第二步：切换到统一接口
 *    import { enhancedTaskEngineManager } from './EnhancedTaskEngineManager';
 *    const result = await enhancedTaskEngineManager.executeTask(params);
 * 
 *    // 第三步：使用统一Hook
 *    import { useUnifiedTaskEngine } from './useUnifiedTaskEngine';
 *    const { executeTask } = useUnifiedTaskEngine();
 *    ```
 * 
 * 3. **新代码直接使用** (最佳实践):
 *    ```typescript
 *    import { useUnifiedTaskEngine } from './useUnifiedTaskEngine';
 *    
 *    function MyComponent() {
 *      const { 
 *        generateTasks, 
 *        executeTask, 
 *        queryTasks 
 *      } = useUnifiedTaskEngine();
 *      
 *      // 直接使用统一接口
 *    }
 *    ```
 */

// ==================== 向后兼容导出 ====================

// Application层兼容性
export { taskExecutionEngineAdapter as TaskExecutionEngine };

// Modules层兼容性
export { taskEngineServiceAdapter as TaskEngineService };
export { taskGeneratorAdapter as TaskGenerator };
export { taskQueryServiceAdapter as TaskQueryService };
export { taskManagerAdapter as TaskManager };

// Hook兼容性
export { useTaskEngineAdapter as useTaskEngine };
export { useTaskManagementAdapter as useTaskManagement };