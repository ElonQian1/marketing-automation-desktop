import { IDeviceRepository } from '../../domain/adb/repositories/IDeviceRepository';
import { Device, DeviceQuery, DeviceStatus, DeviceType } from '../../domain/adb/entities/Device';
import { getGlobalDeviceTracker, TrackedDevice } from '../RealTimeDeviceTracker';

/**
 * 实时设备Repository
 * 基于RealTimeDeviceTracker的事件驱动设备管理
 * 完全替代所有轮询机制
 */
export class RealTimeDeviceRepository implements IDeviceRepository {
  private deviceChangeCallbacks: ((devices: Device[]) => void)[] = [];
  private isInitialized = false;
  private trackerUnsubscribe: (() => void) | null = null;
  
  constructor() {
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private async initializeEventListeners(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ [RealTimeDeviceRepository] 已初始化，跳过重复初始化');
      return;
    }

    console.log('🔧 [RealTimeDeviceRepository] 开始初始化事件监听器...');
    const tracker = getGlobalDeviceTracker();
    
    // 监听设备变化事件
    const unsubscribe = tracker.onDeviceChange((event) => {
      console.log('📱 [RealTimeDeviceRepository] 检测到设备变化:', {
        deviceCount: event.devices.length,
        callbackCount: this.deviceChangeCallbacks.length,
        eventType: event.event_type
      });
      
      const devices = event.devices.map(device => this.convertToDevice(device));
      
      // 通知所有监听器
      this.deviceChangeCallbacks.forEach(callback => {
        try {
          callback(devices);
        } catch (error) {
          console.error('❌ [RealTimeDeviceRepository] 设备变化回调执行失败:', error);
        }
      });
    });

    // 保存取消订阅函数，用于清理
    this.trackerUnsubscribe = unsubscribe;

    // 确保跟踪器已启动
    if (!tracker.isRunning()) {
      console.log('🚀 [RealTimeDeviceRepository] 跟踪器未运行，正在启动...');
      try {
        await tracker.startTracking();
        console.log('✅ [RealTimeDeviceRepository] 实时设备跟踪器已启动');
      } catch (error) {
        console.error('❌ [RealTimeDeviceRepository] 启动实时设备跟踪失败:', error);
      }
    } else {
      console.log('✅ [RealTimeDeviceRepository] 跟踪器已在运行');
    }

    this.isInitialized = true;
    console.log('✅ RealTimeDeviceRepository 初始化完成 (替代轮询)');
  }

  /**
   * 获取所有设备
   */
  async getDevices(): Promise<Device[]> {
    const tracker = getGlobalDeviceTracker();
    const trackedDevices = await tracker.getCurrentDevices();
    
    return trackedDevices.map(device => this.convertToDevice(device));
  }

  /**
   * 根据查询条件获取设备
   */
  async getDevicesByQuery(query: DeviceQuery): Promise<Device[]> {
    const allDevices = await this.getDevices();
    
    return allDevices.filter(device => {
      if (query.status && device.status !== query.status) {
        return false;
      }
      if (query.type && device.type !== query.type) {
        return false;
      }
      if (query.onlineOnly && !device.isOnline()) {
        return false;
      }
      return true;
    });
  }

  /**
   * 根据ID获取设备
   */
  async getDeviceById(deviceId: string): Promise<Device | null> {
    const allDevices = await this.getDevices();
    return allDevices.find(device => device.id === deviceId) || null;
  }

  /**
   * 获取设备详细信息
   */
  async getDeviceInfo(deviceId: string): Promise<Record<string, string> | null> {
    const device = await this.getDeviceById(deviceId);
    return device ? device.properties : null;
  }

  /**
   * 检查设备是否在线
   */
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    const device = await this.getDeviceById(deviceId);
    return device ? device.status === DeviceStatus.ONLINE : false;
  }

  /**
   * 连接到设备
   */
  async connectToDevice(address: string): Promise<void> {
    // 这里应该调用Tauri后端的连接命令
    throw new Error('connectToDevice 需要实现 Tauri 后端调用');
  }

  /**
   * 断开设备连接
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    // 这里应该调用Tauri后端的断开命令
    throw new Error('disconnectDevice 需要实现 Tauri 后端调用');
  }

  /**
   * 连接到常见的模拟器端口
   */
  async connectToCommonEmulatorPorts(): Promise<Device[]> {
    // 这里应该调用Tauri后端的模拟器连接命令
    throw new Error('connectToCommonEmulatorPorts 需要实现 Tauri 后端调用');
  }

  /**
   * 监听设备变化
   */
  watchDeviceChanges(callback: (devices: Device[]) => void): () => void {
    this.deviceChangeCallbacks.push(callback);

    console.log('🔗 [RealTimeDeviceRepository] 注册设备变化监听器:', {
      callbackCount: this.deviceChangeCallbacks.length
    });

    // 确保事件监听器正常工作
    this.ensureEventListeners();

    // 注册即回放：立刻推送一次当前设备列表，消除等待下一次事件的空窗期
    (async () => {
      try {
        const tracker = getGlobalDeviceTracker();
        const current = await tracker.getCurrentDevices();
        const devices = current.map(d => this.convertToDevice(d));
        try {
          callback(devices);
        } catch (e) {
          console.error('❌ [RealTimeDeviceRepository] 初始回放回调失败:', e);
        }

        // 若首次回放为空，延迟重试一次（捕捉 InitialList/DevicesChanged 之后的稳定态）
        if (devices.length === 0) {
          setTimeout(async () => {
            try {
              const again = await tracker.getCurrentDevices();
              const devices2 = again.map(d => this.convertToDevice(d));
              if (devices2.length > 0) {
                try { callback(devices2); } catch (e2) { console.error('❌ [RealTimeDeviceRepository] 延迟回放回调失败:', e2); }
              }
            } catch (e3) {
              console.error('❌ [RealTimeDeviceRepository] 延迟回放获取失败:', e3);
            }
          }, 300);
        }
      } catch (e) {
        console.error('❌ [RealTimeDeviceRepository] 初始回放获取失败:', e);
      }
    })();

    // 返回取消监听的函数
    return () => {
      const index = this.deviceChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.deviceChangeCallbacks.splice(index, 1);
        console.log('🔌 [RealTimeDeviceRepository] 移除设备变化监听器:', {
          callbackCount: this.deviceChangeCallbacks.length
        });
      }
    };
  }

  /**
   * 确保事件监听器正常工作
   */
  private async ensureEventListeners(): Promise<void> {
    if (!this.isInitialized) {
      console.log('⚠️ [RealTimeDeviceRepository] 检测到监听器未初始化，重新初始化...');
      await this.initializeEventListeners();
      return;
    }

    // 检查 RealTimeDeviceTracker 的回调数量
    const tracker = getGlobalDeviceTracker();
    const callbackCount = tracker.getCallbackCount();
    
    if (callbackCount === 0) {
      console.warn('⚠️ [RealTimeDeviceRepository] 检测到 RealTimeDeviceTracker 无回调监听器，强制重新注册...');
      
      // 重置初始化状态并重新初始化
      this.isInitialized = false;
      if (this.trackerUnsubscribe) {
        this.trackerUnsubscribe();
        this.trackerUnsubscribe = null;
      }
      
      await this.initializeEventListeners();
    } else {
      console.log('✅ [RealTimeDeviceRepository] 监听器健康检查通过，回调数量:', callbackCount);
    }
  }

  /**
   * 将TrackedDevice转换为Device
   */
  private convertToDevice(trackedDevice: TrackedDevice): Device {
    return Device.fromRaw({
      id: trackedDevice.id,
      status: trackedDevice.status,
      type: trackedDevice.connection_type,
    });
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 取消跟踪器监听
    if (this.trackerUnsubscribe) {
      this.trackerUnsubscribe();
      this.trackerUnsubscribe = null;
    }
    
    this.deviceChangeCallbacks = [];
    this.isInitialized = false;
    
    console.log('🧹 [RealTimeDeviceRepository] 资源已清理');
  }
}
