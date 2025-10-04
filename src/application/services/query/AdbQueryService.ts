import { StoreOperations } from '../common/StoreOperations';

/**
 * ADB 查询服务
 * 
 * 专门负责设备查询管理、超时保护、查询取消等功能
 * 从 AdbApplicationService 中提取，实现单一职责原则
 */
export class AdbQueryService {
  // 查询状态跟踪
  private activeQueries = new Map<string, AbortController>();
  private queryTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * 获取设备联系人数量（带超时保护和取消支持）
   */
  async getDeviceContactCount(deviceId: string, timeoutMs: number = 10000): Promise<number> {
    if (!deviceId) {
      console.warn('[AdbQueryService] getDeviceContactCount: deviceId 为空');
      return 0;
    }

    // 取消同一设备的进行中查询
    this.cancelActiveQuery(deviceId);

    // 检查设备是否存在且在线
    const store = StoreOperations.getStore();
    const device = store.getDeviceById(deviceId);
    if (!device) {
      console.warn(`[AdbQueryService] 设备 ${deviceId} 不存在于列表中`);
      return 0;
    }
    if (!device.isOnline()) {
      console.warn(`[AdbQueryService] 设备 ${deviceId} 已断开，跳过查询`);
      return 0;
    }

    // 创建查询控制器
    const queryId = `contact-count-${deviceId}-${Date.now()}`;
    const abortController = new AbortController();
    this.activeQueries.set(deviceId, abortController);

    // 设置超时保护
    const timeoutId = setTimeout(() => {
      console.warn(`[AdbQueryService] 设备 ${deviceId} 查询超时 (${timeoutMs}ms)，取消查询`);
      abortController.abort();
      this.cleanupQuery(deviceId);
    }, timeoutMs);
    this.queryTimeouts.set(deviceId, timeoutId);

    try {
      const { isTauri, invoke } = await import('@tauri-apps/api/core');
      if (!isTauri()) {
        this.cleanupQuery(deviceId);
        return 0;
      }

      // 再次检查设备状态（查询前最后检查）
      const currentDevice = StoreOperations.getDevice(deviceId);
      if (!currentDevice?.isOnline()) {
        console.warn(`[AdbQueryService] 设备 ${deviceId} 在查询前已断开`);
        this.cleanupQuery(deviceId);
        return 0;
      }

      // 检查是否已被取消
      if (abortController.signal.aborted) {
        console.warn(`[AdbQueryService] 设备 ${deviceId} 查询已被取消`);
        this.cleanupQuery(deviceId);
        return 0;
      }

      // 兼容性：同时传递 snake_case 与 camelCase，后端优先取 device_id
      const payload = { device_id: deviceId, deviceId } as any;
      try { 
        console.debug('[AdbQueryService.getDeviceContactCount] invoke payload:', payload); 
      } catch {}

      const result = await invoke<number>('get_device_contact_count', payload);
      this.cleanupQuery(deviceId);
      return result || 0;

    } catch (error) {
      this.cleanupQuery(deviceId);
      
      if (abortController.signal.aborted) {
        console.warn(`[AdbQueryService] 设备 ${deviceId} 查询被取消或超时`);
        return 0;
      }

      const errorStr = error instanceof Error ? error.message : String(error);
      
      // 设备状态相关错误的友好处理
      if (errorStr.includes('device') && (errorStr.includes('not found') || errorStr.includes('offline') || errorStr.includes('unauthorized'))) {
        console.warn(`[AdbQueryService] 设备 ${deviceId} 状态异常: ${errorStr}`);
        return 0;
      }
      
      console.error(`[AdbQueryService] 设备 ${deviceId} 查询失败:`, error);
      throw error;
    }
  }

  /**
   * 取消指定设备的活跃查询
   */
  cancelActiveQuery(deviceId: string): void {
    const controller = this.activeQueries.get(deviceId);
    if (controller) {
      console.debug(`[AdbQueryService] 取消设备 ${deviceId} 的活跃查询`);
      controller.abort();
      this.cleanupQuery(deviceId);
    }
  }

  /**
   * 取消设备的所有查询（设备断开时调用）
   */
  cancelAllQueriesForDevice(deviceId: string): void {
    console.debug(`[AdbQueryService] 取消设备 ${deviceId} 的所有查询`);
    this.cancelActiveQuery(deviceId);
  }

  /**
   * 清理查询相关资源
   */
  private cleanupQuery(deviceId: string): void {
    // 清理 AbortController
    this.activeQueries.delete(deviceId);
    
    // 清理超时定时器
    const timeoutId = this.queryTimeouts.get(deviceId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.queryTimeouts.delete(deviceId);
    }
  }

  /**
   * 获取当前活跃查询数量（用于调试）
   */
  getActiveQueryCount(): number {
    return this.activeQueries.size;
  }

  /**
   * 获取活跃查询的设备列表（用于调试）
   */
  getActiveQueryDevices(): string[] {
    return Array.from(this.activeQueries.keys());
  }

  /**
   * 清理所有查询（应用关闭时调用）
   */
  cleanup(): void {
    console.log('[AdbQueryService] 清理所有查询资源...');
    
    // 取消所有活跃查询
    for (const [deviceId, controller] of this.activeQueries) {
      controller.abort();
    }
    this.activeQueries.clear();
    
    // 清理所有超时定时器
    for (const timeoutId of this.queryTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.queryTimeouts.clear();
    
    console.log('[AdbQueryService] 查询资源清理完成');
  }
}