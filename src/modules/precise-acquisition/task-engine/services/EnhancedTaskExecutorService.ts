// src/modules/precise-acquisition/task-engine/services/EnhancedTaskExecutorService.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 增强任务执行器服务
 * 
 * 集成ADB设备管理，实现任务与设备的协调执行
 * 支持API优先、半自动兜底、设备选择和负载均衡
 */

import { ProspectingTaskExecutorService, TaskExecutionContext, TaskExecutionResult } from './prospecting-task-executor-service';
import { Task, TaskStatus, ExecutorMode, ResultCode } from '../../shared/types/core';
import type { Device } from '../../../../domain/adb/entities/Device';

/**
 * 设备任务执行上下文
 */
export interface DeviceTaskExecutionContext extends TaskExecutionContext {
  device?: Device;
  device_id?: string;
  prefer_device_type?: 'emulator' | 'physical' | 'any';
  fallback_to_manual?: boolean;
}

/**
 * 设备选择策略
 */
export interface DeviceSelectionStrategy {
  strategy: 'round_robin' | 'least_busy' | 'by_region' | 'manual_select';
  region_preference?: string;
  exclude_devices?: string[];
}

/**
 * 任务分配结果
 */
export interface TaskAssignmentResult {
  task_id: string;
  assigned_device: Device | null;
  assignment_reason: string;
  estimated_execution_time?: number;
  fallback_options?: Device[];
}

/**
 * 增强任务执行器服务
 */
export class EnhancedTaskExecutorService extends ProspectingTaskExecutorService {
  
  private deviceTaskQueue: Map<string, Task[]> = new Map(); // 设备ID -> 任务队列
  private deviceBusyStatus: Map<string, boolean> = new Map(); // 设备忙碌状态
  
  /**
   * 分配任务到设备
   */
  async assignTaskToDevice(
    task: Task, 
    availableDevices: Device[], 
    strategy: DeviceSelectionStrategy = { strategy: 'least_busy' }
  ): Promise<TaskAssignmentResult> {
    
    if (availableDevices.length === 0) {
      return {
        task_id: task.id,
        assigned_device: null,
        assignment_reason: '无可用设备',
        fallback_options: []
      };
    }
    
    let selectedDevice: Device | null = null;
    let assignmentReason = '';
    
    switch (strategy.strategy) {
      case 'least_busy':
        selectedDevice = this.selectLeastBusyDevice(availableDevices);
        assignmentReason = '选择负载最轻的设备';
        break;
        
      case 'round_robin':
        selectedDevice = this.selectRoundRobinDevice(availableDevices);
        assignmentReason = '轮询分配设备';
        break;
        
      case 'by_region':
        selectedDevice = this.selectDeviceByRegion(availableDevices, strategy.region_preference);
        assignmentReason = `按地域选择设备 (${strategy.region_preference})`;
        break;
        
      default:
        selectedDevice = availableDevices[0];
        assignmentReason = '默认选择第一个可用设备';
    }
    
    if (selectedDevice) {
      // 添加任务到设备队列
      this.addTaskToDeviceQueue(selectedDevice.id, task);
      
      // 估计执行时间
      const estimatedTime = this.estimateExecutionTime(task, selectedDevice);
      
      return {
        task_id: task.id,
        assigned_device: selectedDevice,
        assignment_reason: assignmentReason,
        estimated_execution_time: estimatedTime,
        fallback_options: availableDevices.filter(d => d.id !== selectedDevice!.id).slice(0, 2)
      };
    }
    
    return {
      task_id: task.id,
      assigned_device: null,
      assignment_reason: '设备选择失败',
      fallback_options: availableDevices.slice(0, 3)
    };
  }
  
  /**
   * 增强的任务执行
   */
  async executeTaskWithDevice(context: DeviceTaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device } = context;
    
    // 如果指定了设备，尝试在该设备上执行
    if (device) {
      const isDeviceBusy = this.deviceBusyStatus.get(device.id) || false;
      
      if (isDeviceBusy) {
        // 设备忙碌，添加到队列或选择其他设备
        console.log(`设备 ${device.id} 忙碌，任务加入队列`);
        this.addTaskToDeviceQueue(device.id, task);
        
        return {
          task_id: task.id,
          status: TaskStatus.READY,
          result_code: ResultCode.RATE_LIMITED,
          error_message: '设备忙碌，任务已加入队列',
          executed_at: new Date(),
          execution_mode: ExecutorMode.MANUAL,
          execution_details: {
            manual_action_url: `device://${device.id}/queue`
          }
        };
      }
      
      // 标记设备为忙碌
      this.setDeviceBusy(device.id, true);
      
      try {
        const result = await this.executeTaskOnDevice(context);
        return result;
      } finally {
        // 释放设备
        this.setDeviceBusy(device.id, false);
        
        // 处理队列中的下一个任务
        this.processDeviceQueue(device.id);
      }
    }
    
    // 没有指定设备或设备执行失败，回退到原始逻辑
    return await this.executeTask(context);
  }
  
  /**
   * 在指定设备上执行任务
   */
  private async executeTaskOnDevice(context: DeviceTaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device } = context;
    
    if (!device) {
      throw new Error('设备信息缺失');
    }
    
    // 检查设备状态
    if (!device.isOnline()) {
      return {
        task_id: task.id,
        status: TaskStatus.FAILED,
        result_code: ResultCode.NOT_FOUND,
        error_message: '设备离线',
        executed_at: new Date(),
        execution_mode: ExecutorMode.MANUAL
      };
    }
    
    // 根据任务类型选择执行策略
    if (task.task_type === 'reply') {
      return await this.executeReplyTaskOnDevice(context);
    } else if (task.task_type === 'follow') {
      return await this.executeFollowTaskOnDevice(context);
    }
    
    throw new Error(`不支持的任务类型: ${task.task_type}`);
  }
  
  /**
   * 在设备上执行回复任务
   */
  private async executeReplyTaskOnDevice(context: DeviceTaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device } = context;
    
    try {
      // 首先尝试API执行
      if (task.executor_mode === ExecutorMode.API) {
        const apiResult = await this.executeTask(context);
        if (apiResult.status === TaskStatus.DONE) {
          return apiResult;
        }
      }
      
      // API失败或选择半自动模式，使用设备自动化
      console.log(`在设备 ${device?.id} 上执行回复任务 ${task.id}`);
      
      // TODO: 集成ADB自动化
      // 1. 打开应用
      // 2. 导航到评论
      // 3. 填写回复内容
      // 4. 提交回复
      
      // 模拟设备操作
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        task_id: task.id,
        status: TaskStatus.DONE,
        result_code: ResultCode.OK,
        executed_at: new Date(),
        execution_mode: ExecutorMode.MANUAL,
        execution_details: {
          manual_action_url: `device://${device?.id}/reply/${task.comment_id}`,
          rendered_content: '通过设备自动化完成回复'
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
   * 在设备上执行关注任务
   */
  private async executeFollowTaskOnDevice(context: DeviceTaskExecutionContext): Promise<TaskExecutionResult> {
    const { task, device } = context;
    
    try {
      console.log(`在设备 ${device?.id} 上执行关注任务 ${task.id}`);
      
      // TODO: 集成ADB自动化
      // 1. 打开应用
      // 2. 搜索用户或导航到用户页面
      // 3. 点击关注按钮
      
      // 模拟设备操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        task_id: task.id,
        status: TaskStatus.DONE,
        result_code: ResultCode.OK,
        executed_at: new Date(),
        execution_mode: ExecutorMode.MANUAL,
        execution_details: {
          manual_action_url: `device://${device?.id}/follow/${task.target_user_id}`,
          rendered_content: '通过设备自动化完成关注'
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
   * 选择负载最轻的设备
   */
  private selectLeastBusyDevice(devices: Device[]): Device {
    let leastBusyDevice = devices[0];
    let minQueueLength = this.deviceTaskQueue.get(devices[0].id)?.length || 0;
    
    for (const device of devices) {
      const queueLength = this.deviceTaskQueue.get(device.id)?.length || 0;
      if (queueLength < minQueueLength) {
        leastBusyDevice = device;
        minQueueLength = queueLength;
      }
    }
    
    return leastBusyDevice;
  }
  
  /**
   * 轮询选择设备
   */
  private selectRoundRobinDevice(devices: Device[]): Device {
    // 简单的轮询实现
    const now = Date.now();
    const index = now % devices.length;
    return devices[index];
  }
  
  /**
   * 按地域选择设备
   */
  private selectDeviceByRegion(devices: Device[], preferredRegion?: string): Device {
    if (!preferredRegion) {
      return devices[0];
    }
    
    // 优先选择指定地域的设备
    const regionalDevice = devices.find(device => 
      device.properties?.region === preferredRegion
    );
    
    return regionalDevice || devices[0];
  }
  
  /**
   * 添加任务到设备队列
   */
  private addTaskToDeviceQueue(deviceId: string, task: Task): void {
    if (!this.deviceTaskQueue.has(deviceId)) {
      this.deviceTaskQueue.set(deviceId, []);
    }
    this.deviceTaskQueue.get(deviceId)!.push(task);
  }
  
  /**
   * 设置设备忙碌状态
   */
  private setDeviceBusy(deviceId: string, busy: boolean): void {
    this.deviceBusyStatus.set(deviceId, busy);
  }
  
  /**
   * 处理设备队列
   */
  private async processDeviceQueue(deviceId: string): Promise<void> {
    const queue = this.deviceTaskQueue.get(deviceId);
    if (!queue || queue.length === 0) {
      return;
    }
    
    const nextTask = queue.shift();
    if (nextTask) {
      console.log(`处理设备 ${deviceId} 队列中的下一个任务: ${nextTask.id}`);
      // 这里可以触发下一个任务的执行
    }
  }
  
  /**
   * 估计任务执行时间
   */
  private estimateExecutionTime(task: Task, device: Device): number {
    let baseTime = 0;
    
    switch (task.task_type) {
      case 'reply':
        baseTime = 5000; // 5秒
        break;
      case 'follow':
        baseTime = 3000; // 3秒
        break;
      default:
        baseTime = 2000; // 2秒
    }
    
    // 根据设备性能调整时间
    if (device.isEmulator()) {
      baseTime *= 1.5; // 模拟器稍慢
    }
    
    return baseTime;
  }
  
  /**
   * 获取设备任务统计
   */
  getDeviceTaskStats(): Map<string, {
    queueLength: number;
    isBusy: boolean;
    totalProcessed: number;
  }> {
    const stats = new Map();
    
    for (const [deviceId, queue] of this.deviceTaskQueue) {
      stats.set(deviceId, {
        queueLength: queue.length,
        isBusy: this.deviceBusyStatus.get(deviceId) || false,
        totalProcessed: 0 // TODO: 从历史记录计算
      });
    }
    
    return stats;
  }
  
  /**
   * 清理离线设备的任务队列
   */
  cleanupOfflineDevices(onlineDeviceIds: string[]): number {
    let cleanedTasks = 0;
    
    for (const [deviceId, queue] of this.deviceTaskQueue) {
      if (!onlineDeviceIds.includes(deviceId)) {
        cleanedTasks += queue.length;
        this.deviceTaskQueue.delete(deviceId);
        this.deviceBusyStatus.delete(deviceId);
      }
    }
    
    return cleanedTasks;
  }
}