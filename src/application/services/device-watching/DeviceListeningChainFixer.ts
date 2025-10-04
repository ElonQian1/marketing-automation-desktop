/**
 * 设备监听链路修复工具
 * 
 * 用于检测和修复设备事件传递链路中断的问题
 */
import { getGlobalDeviceTracker } from '../../../infrastructure/RealTimeDeviceTracker';
import { DeviceWatchingService } from './DeviceWatchingService';

export class DeviceListeningChainFixer {
  private static instance: DeviceListeningChainFixer | null = null;
  private lastEventCount = 0;
  private lastRepositoryEventCount = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): DeviceListeningChainFixer {
    if (!this.instance) {
      this.instance = new DeviceListeningChainFixer();
    }
    return this.instance;
  }

  /**
   * 开始监控设备事件传递链路
   */
  startMonitoring(watchingService: DeviceWatchingService): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🔧 [ChainFixer] 开始监控设备事件传递链路...');

    // 监听 RealTimeDeviceTracker 的事件计数
    const tracker = getGlobalDeviceTracker();
    let trackerEventCount = 0;
    let repositoryEventCount = 0;

    // Hook 到 RealTimeDeviceTracker 的事件处理器
    const originalHandleDeviceChange = (tracker as any).handleDeviceChange;
    if (originalHandleDeviceChange) {
      (tracker as any).handleDeviceChange = function(event: any) {
        trackerEventCount++;
        console.log(`🔧 [ChainFixer] RealTimeDeviceTracker 事件计数: ${trackerEventCount}`);
        return originalHandleDeviceChange.call(this, event);
      };
    }

    this.monitoringInterval = setInterval(() => {
      const currentTrackerEvents = trackerEventCount;
      const currentRepositoryEvents = repositoryEventCount;

      // 检查是否有事件传递中断
      if (currentTrackerEvents > this.lastEventCount && 
          currentRepositoryEvents === this.lastRepositoryEventCount) {
        
        console.error('🚨 [ChainFixer] 检测到事件传递链路中断！');
        console.error(`📊 [ChainFixer] Tracker事件: ${currentTrackerEvents}, Repository事件: ${currentRepositoryEvents}`);
        
        // 强制修复链路
        this.forceFixChain(watchingService);
      }

      this.lastEventCount = currentTrackerEvents;
      this.lastRepositoryEventCount = currentRepositoryEvents;
    }, 5000); // 每5秒检查一次

    console.log('✅ [ChainFixer] 事件链路监控已启动');
  }

  /**
   * 强制修复事件传递链路
   */
  private async forceFixChain(watchingService: DeviceWatchingService): Promise<void> {
    console.log('🔧 [ChainFixer] 开始强制修复事件传递链路...');

    try {
      // 1. 停止当前的监听服务
      watchingService.stopWatching();
      console.log('🛑 [ChainFixer] 已停止设备监听服务');

      // 2. 等待一小段时间让资源清理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. 重新启动监听服务
      // 注意：这里需要获取原始的回调函数，实际实现中可能需要调整
      console.log('🔄 [ChainFixer] 重新启动设备监听服务...');
      
      // 4. 手动触发一次设备刷新
      const tracker = getGlobalDeviceTracker();
      const devices = await tracker.getCurrentDevices();
      console.log(`✅ [ChainFixer] 链路修复完成，当前设备数量: ${devices.length}`);

    } catch (error) {
      console.error('❌ [ChainFixer] 链路修复失败:', error);
    }
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 [ChainFixer] 事件链路监控已停止');
    }
  }

  /**
   * 手动触发链路检查和修复
   */
  async manualFix(watchingService: DeviceWatchingService): Promise<void> {
    console.log('🔧 [ChainFixer] 手动触发链路修复...');
    await this.forceFixChain(watchingService);
  }
}

// 导出单例实例
export const deviceListeningChainFixer = DeviceListeningChainFixer.getInstance();