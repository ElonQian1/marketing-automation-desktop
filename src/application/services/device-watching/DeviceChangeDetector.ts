/**
 * 设备变化检测器
 * 
 * 专门用于检测设备重新插入时监听器失效的问题
 * 通过监控设备数量变化来判断监听链路是否正常
 */
export class DeviceChangeDetector {
  private static instance: DeviceChangeDetector | null = null;
  private lastDeviceCount = 0;
  private lastUpdateTime = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private onChainBrokenCallback: (() => Promise<void>) | null = null;

  private constructor() {}

  static getInstance(): DeviceChangeDetector {
    if (!this.instance) {
      this.instance = new DeviceChangeDetector();
    }
    return this.instance;
  }

  /**
   * 启动设备变化监控
   */
  startMonitoring(onChainBroken: () => Promise<void>): void {
    this.onChainBrokenCallback = onChainBroken;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🔍 [DeviceChangeDetector] 启动设备变化监控...');

    this.monitoringInterval = setInterval(async () => {
      try {
        // 获取当前设备数量
        const { getGlobalDeviceTracker } = await import('../../../infrastructure/RealTimeDeviceTracker');
        const tracker = getGlobalDeviceTracker();
        const devices = await tracker.getCurrentDevices();
        const currentDeviceCount = devices.length;
        const currentTime = Date.now();

        // 检查设备数量是否发生变化
        if (currentDeviceCount !== this.lastDeviceCount) {
          console.log(`🔍 [DeviceChangeDetector] 设备数量变化: ${this.lastDeviceCount} → ${currentDeviceCount}`);
          
          // 如果设备数量从0变为非0，可能是重新插入
          if (this.lastDeviceCount === 0 && currentDeviceCount > 0) {
            console.log('🔍 [DeviceChangeDetector] 检测到设备重新插入，检查监听链路...');
            
            // 给一点时间让事件传播
            setTimeout(async () => {
              await this.checkListenerChain();
            }, 2000); // 2秒后检查
          }

          this.lastDeviceCount = currentDeviceCount;
          this.lastUpdateTime = currentTime;
        }

      } catch (error) {
        console.error('❌ [DeviceChangeDetector] 监控失败:', error);
      }
    }, 5000); // 每5秒检查一次

    console.log('✅ [DeviceChangeDetector] 设备变化监控已启动');
  }

  /**
   * 检查监听器链路是否正常
   */
  private async checkListenerChain(): Promise<void> {
    try {
      const { getGlobalDeviceTracker } = await import('../../../infrastructure/RealTimeDeviceTracker');
      const tracker = getGlobalDeviceTracker();
      const callbackCount = tracker.getCallbackCount();

      if (callbackCount === 0) {
        console.error('🚨 [DeviceChangeDetector] 检测到监听链路中断！触发修复...');
        
        if (this.onChainBrokenCallback) {
          await this.onChainBrokenCallback();
        }
      } else {
        console.log('✅ [DeviceChangeDetector] 监听链路正常，回调数量:', callbackCount);
      }
    } catch (error) {
      console.error('❌ [DeviceChangeDetector] 链路检查失败:', error);
    }
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.onChainBrokenCallback = null;
    console.log('🛑 [DeviceChangeDetector] 设备变化监控已停止');
  }

  /**
   * 手动触发链路检查
   */
  async manualCheck(): Promise<void> {
    console.log('🔍 [DeviceChangeDetector] 手动触发链路检查...');
    await this.checkListenerChain();
  }
}

// 导出单例实例
export const deviceChangeDetector = DeviceChangeDetector.getInstance();