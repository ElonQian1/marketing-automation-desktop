import { useAdbStore } from '../../store/adbStore';
import { Device } from '../../../domain/adb/entities/Device';

/**
 * Store 操作抽象层
 * 
 * 封装常用的 Store 操作模式，减少重复代码
 * 提供统一的加载状态管理、错误处理等
 */
export class StoreOperations {
  /**
   * 获取 Store 实例
   */
  static getStore() {
    return useAdbStore.getState();
  }

  /**
   * 带加载状态的操作包装器
   * 自动管理 loading 状态
   */
  static async withLoading<T>(operation: () => Promise<T>): Promise<T> {
    const store = this.getStore();
    
    try {
      store.setLoading(true);
      return await operation();
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * 带错误处理的操作包装器
   * 自动捕获错误并设置到 Store
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const store = this.getStore();
    
    try {
      store.setError(null); // 清除之前的错误
      return await operation();
    } catch (error) {
      const errorObj = error instanceof Error 
        ? error 
        : new Error(`${context || '操作'} 失败: ${String(error)}`);
      
      store.setError(errorObj);
      console.error(`[StoreOperations] ${context || '操作失败'}:`, error);
      throw errorObj;
    }
  }

  /**
   * 带加载状态和错误处理的完整包装器
   */
  static async withLoadingAndErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return this.withLoading(() => 
      this.withErrorHandling(operation, context)
    );
  }

  /**
   * 验证设备是否存在且在线
   */
  static validateDevice(deviceId: string): Device | null {
    if (!deviceId) {
      console.warn('[StoreOperations] validateDevice: deviceId 为空');
      return null;
    }

    const store = this.getStore();
    const device = store.getDeviceById(deviceId);
    
    if (!device) {
      console.warn(`[StoreOperations] 设备 ${deviceId} 不存在于设备列表中`);
      return null;
    }

    if (!device.isOnline()) {
      console.warn(`[StoreOperations] 设备 ${deviceId} 当前离线`);
      return null;
    }

    return device;
  }

  /**
   * 安全获取设备（不抛异常）
   */
  static getDevice(deviceId: string): Device | null {
    const store = this.getStore();
    return store.getDeviceById(deviceId);
  }

  /**
   * 检查设备是否在线
   */
  static isDeviceOnline(deviceId: string): boolean {
    const device = this.getDevice(deviceId);
    return device?.isOnline() || false;
  }

  /**
   * 获取在线设备列表
   */
  static getOnlineDevices(): Device[] {
    const store = this.getStore();
    return store.devices.filter(device => device.isOnline());
  }

  /**
   * 设置选中设备（带验证）
   */
  static selectDevice(deviceId: string | null): boolean {
    const store = this.getStore();
    
    if (deviceId && !this.getDevice(deviceId)) {
      console.warn(`[StoreOperations] 无法选择不存在的设备: ${deviceId}`);
      return false;
    }

    store.setSelectedDevice(deviceId);
    return true;
  }

  /**
   * 批量更新设备状态
   */
  static updateDevices(devices: Device[]): void {
    const store = this.getStore();
    store.setDevices(devices);
  }

  /**
   * 清除错误状态
   */
  static clearError(): void {
    const store = this.getStore();
    store.setError(null);
  }

  /**
   * 设置错误状态
   */
  static setError(error: Error | null): void {
    const store = this.getStore();
    store.setError(error);
  }

  /**
   * 设置初始化状态
   */
  static setInitializing(isInitializing: boolean): void {
    const store = this.getStore();
    store.setInitializing(isInitializing);
  }

  /**
   * 安全执行操作（不抛出异常）
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`[StoreOperations] ${context || '安全执行'} 失败:`, error);
      return defaultValue;
    }
  }
}