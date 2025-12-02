// src/infrastructure/RealTimeDeviceTracker.ts
// module: shared | layer: infrastructure | role: 基础设施
// summary: DDD架构基础设施层实现

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { EventManager } from './EventManager';
import { EVENTS } from '../shared/constants/events';

/**
 * 设备变化事件类型
 */
export interface DeviceChangeEvent {
  event_type: DeviceEventType;
  devices: TrackedDevice[];
  timestamp: number;
}

export interface DeviceEventType {
  DevicesChanged?: null;
  DeviceConnected?: string;
  DeviceDisconnected?: string;
  InitialList?: null;
}

export interface TrackedDevice {
  id: string;
  status: string;
  connection_type: string;
}

/**
 * 实时ADB设备跟踪服务
 * 基于host:track-devices协议，实现事件驱动的设备监听
 * 完全替代轮询机制
 */
export class RealTimeDeviceTracker {
  private eventManager: EventManager;
  private unlistenFn: UnlistenFn | null = null;
  private isTracking = false;
  private deviceChangeCallbacks: ((event: DeviceChangeEvent) => void)[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastEventTimestamp = 0;

  constructor() {
    this.eventManager = new EventManager();
  }

  /**
   * 启动实时设备跟踪
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.log('🎯 设备跟踪已在运行');
      return;
    }

    try {
      console.log('🚀 启动实时ADB设备跟踪...');

      // 启动后端设备跟踪
      await invoke('plugin:adb|start_tracking');

      // 监听设备变化事件，增加错误处理和自动恢复
      this.unlistenFn = await listen(EVENTS.DEVICE_CHANGE, (event) => {
        try {
          const deviceEvent = event.payload as DeviceChangeEvent;
          this.handleDeviceChange(deviceEvent);
        } catch (error) {
          console.error('❌ [RealTimeDeviceTracker] 处理设备变化事件失败:', error);
          // 如果是通道关闭错误，尝试自动恢复
          if (error instanceof Error && error.message.includes('channel closed')) {
            console.warn('🔄 [RealTimeDeviceTracker] 检测到通道关闭，尝试自动恢复...');
            this.recoverFromChannelClosed();
          }
        }
      });

      this.isTracking = true;
      console.log('✅ 实时设备跟踪启动成功');
      
      // 获取初始设备列表
      await this.refreshDeviceList();
      
      // 启动健康检查
      this.startHealthCheck();

    } catch (error) {
      console.error('❌ 启动设备跟踪失败:', error);
      throw error;
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    // 每30秒检查一次通道健康状态
    this.healthCheckInterval = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastEvent = now - this.lastEventTimestamp;
      
      // 如果超过60秒没有收到任何事件，可能通道有问题
      if (timeSinceLastEvent > 60000 && this.lastEventTimestamp > 0) {
        // console.warn('⚠️ [RealTimeDeviceTracker] 长时间无事件，检查通道健康状态...');
        try {
          // 尝试获取设备列表来测试通道
          await this.getCurrentDevices();
          // console.log('✅ [RealTimeDeviceTracker] 通道健康检查通过');
        } catch (error) {
          console.error('❌ [RealTimeDeviceTracker] 通道健康检查失败，尝试重启:', error);
          this.recoverFromChannelClosed();
        }
      }
    }, 30000);
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * 从通道关闭错误中恢复
   */
  private async recoverFromChannelClosed(): Promise<void> {
    try {
      console.log('🔧 [RealTimeDeviceTracker] 开始自动恢复...');
      
      // 停止当前跟踪
      await this.stopTracking();
      
      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新启动跟踪
      await this.startTracking();
      
      console.log('✅ [RealTimeDeviceTracker] 自动恢复成功');
    } catch (error) {
      console.error('❌ [RealTimeDeviceTracker] 自动恢复失败:', error);
    }
  }

  /**
   * 停止设备跟踪
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    try {
      console.log('🛑 停止设备跟踪...');
      
      // 停止健康检查
      this.stopHealthCheck();

      // 停止事件监听
      if (this.unlistenFn) {
        this.unlistenFn();
        this.unlistenFn = null;
      }

      // 停止后端跟踪
      await invoke('plugin:adb|stop_tracking');

      this.isTracking = false;
      console.log('⏹️ 设备跟踪已停止');

    } catch (error) {
      console.error('❌ 停止设备跟踪失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前跟踪的设备列表
   */
  async getCurrentDevices(): Promise<TrackedDevice[]> {
    try {
      const devices = await invoke<TrackedDevice[]>('plugin:adb|get_tracking_list');
      // console.log(`📱 获取到 ${devices.length} 个设备`);
      return devices;
    } catch (error) {
      console.error('❌ 获取设备列表失败:', error);
      return [];
    }
  }

  /**
   * 订阅设备变化事件
   */
  onDeviceChange(callback: (event: DeviceChangeEvent) => void): () => void {
    this.deviceChangeCallbacks.push(callback);
    
    // console.log('🔗 [RealTimeDeviceTracker] 注册设备变化回调:', {
    //   callbackCount: this.deviceChangeCallbacks.length
    // });
    
    // 返回取消订阅函数
    return () => {
      const index = this.deviceChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.deviceChangeCallbacks.splice(index, 1);
        console.log('🔌 [RealTimeDeviceTracker] 移除设备变化回调:', {
          callbackCount: this.deviceChangeCallbacks.length
        });
      }
    };
  }

  /**
   * 获取当前回调数量（用于诊断）
   */
  getCallbackCount(): number {
    return this.deviceChangeCallbacks.length;
  }

  /**
   * 处理设备变化事件
   */
  private handleDeviceChange(event: DeviceChangeEvent): void {
    console.log('🔄 收到设备变化事件:', event);
    
    // 更新最后事件时间戳
    this.lastEventTimestamp = Date.now();

    // 检查回调监听器数量
    if (this.deviceChangeCallbacks.length === 0) {
      console.warn('⚠️ [RealTimeDeviceTracker] 收到事件但无回调监听器！可能需要重新初始化上层服务');
      // 发出警告，让上层服务知道需要重新注册
      this.eventManager.emit('listener-missing', {
        event,
        callbackCount: this.deviceChangeCallbacks.length
      });
      // 即使没有回调，也继续处理事件以便发出通用事件
    }

    // ✅ 修复：处理新的事件类型结构（字符串形式 vs 对象形式）
    const eventType = event.event_type;
    
    if (typeof eventType === 'string') {
      // 新格式：字符串形式的事件类型
      switch (eventType) {
        case 'DeviceConnected':
          console.log('📱 设备已连接');
          this.eventManager.emit('device-connected', {
            devices: event.devices,
          });
          break;
        case 'DeviceDisconnected':
          console.log('📱 设备已断开');
          this.eventManager.emit('device-disconnected', {
            devices: event.devices,
          });
          break;
        case 'DevicesChanged':
          console.log('🔄 设备状态已变化');
          this.eventManager.emit('devices-changed', {
            devices: event.devices,
          });
          break;
        case 'InitialList':
          console.log('📋 收到初始设备列表');
          this.eventManager.emit('devices-initialized', {
            devices: event.devices,
          });
          break;
        default:
          console.log('🔍 收到未知事件类型(字符串):', eventType);
          this.eventManager.emit('unknown-device-event', {
            eventType: eventType,
            devices: event.devices,
          });
      }
    } else if (typeof eventType === 'object' && eventType !== null) {
      // 旧格式：对象形式的事件类型
      if ('DeviceConnected' in eventType) {
        console.log(`📱 设备已连接: ${eventType.DeviceConnected}`);
        this.eventManager.emit('device-connected', {
          deviceId: eventType.DeviceConnected,
          devices: event.devices,
        });
      } else if ('DeviceDisconnected' in eventType) {
        console.log(`📱 设备已断开: ${eventType.DeviceDisconnected}`);
        this.eventManager.emit('device-disconnected', {
          deviceId: eventType.DeviceDisconnected,
          devices: event.devices,
        });
      } else if ('DevicesChanged' in eventType) {
        console.log('🔄 设备状态已变化');
        this.eventManager.emit('devices-changed', {
          devices: event.devices,
        });
      } else if ('InitialList' in eventType) {
        console.log('📋 收到初始设备列表');
        this.eventManager.emit('devices-initialized', {
          devices: event.devices,
        });
      } else {
        console.log('🔍 收到未知事件类型(对象):', eventType);
        this.eventManager.emit('unknown-device-event', {
          eventType: eventType,
          devices: event.devices,
        });
      }
    } else {
      console.log('🔍 收到未知事件类型结构:', eventType);
      this.eventManager.emit('unknown-device-event', {
        eventType: eventType,
        devices: event.devices,
      });
    }

    // ✅ 修复：无论事件类型如何，都要通知所有订阅者
    console.log(`🔔 [RealTimeDeviceTracker] 开始通知 ${this.deviceChangeCallbacks.length} 个回调监听器...`);
    
    this.deviceChangeCallbacks.forEach((callback, index) => {
      try {
        console.log(`🔔 [RealTimeDeviceTracker] 调用回调 #${index + 1}...`);
        callback(event);
        console.log(`✅ [RealTimeDeviceTracker] 回调 #${index + 1} 执行成功`);
      } catch (error) {
        console.error(`❌ [RealTimeDeviceTracker] 回调 #${index + 1} 执行失败:`, error);
      }
    });

    console.log(`✅ [RealTimeDeviceTracker] 所有回调通知完成`);

    // 发送通用设备更新事件
    this.eventManager.emit('device-list-updated', {
      devices: event.devices,
      eventType: event.event_type,
      timestamp: event.timestamp,
    });
  }

  /**
   * 刷新设备列表
   */
  private async refreshDeviceList(): Promise<void> {
    try {
      const devices = await this.getCurrentDevices();
      
      // 模拟初始设备事件
      const initialEvent: DeviceChangeEvent = {
        event_type: { InitialList: null },
        devices,
        timestamp: Math.floor(Date.now() / 1000),
      };

      this.handleDeviceChange(initialEvent);
    } catch (error) {
      console.error('刷新设备列表失败:', error);
    }
  }

  /**
   * 获取跟踪状态
   */
  isRunning(): boolean {
    return this.isTracking;
  }

  /**
   * 获取事件管理器（用于其他组件监听事件）
   */
  getEventManager(): EventManager {
    return this.eventManager;
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.stopTracking();
    this.deviceChangeCallbacks = [];
    this.eventManager.removeAllListeners();
  }
}

// 全局实例
let globalTracker: RealTimeDeviceTracker | null = null;

/**
 * 获取全局设备跟踪器实例
 */
export function getGlobalDeviceTracker(): RealTimeDeviceTracker {
  if (!globalTracker) {
    globalTracker = new RealTimeDeviceTracker();
  }
  return globalTracker;
}

/**
 * 清理全局跟踪器
 */
export async function cleanupGlobalTracker(): Promise<void> {
  if (globalTracker) {
    await globalTracker.cleanup();
    globalTracker = null;
  }
}