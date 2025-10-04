/**
 * 回调链路诊断工具
 * 
 * 用于诊断设备事件回调链路中的问题
 */
import { getGlobalDeviceTracker } from '../../../infrastructure/RealTimeDeviceTracker';

export class CallbackChainDiagnostics {
  private static instance: CallbackChainDiagnostics | null = null;

  private constructor() {}

  static getInstance(): CallbackChainDiagnostics {
    if (!this.instance) {
      this.instance = new CallbackChainDiagnostics();
    }
    return this.instance;
  }

  /**
   * 执行完整的回调链路诊断
   */
  async performDiagnostic(): Promise<void> {
    console.group('🔍 [回调链路诊断] 开始诊断...');

    try {
      // 1. 检查 RealTimeDeviceTracker 状态
      const tracker = getGlobalDeviceTracker();
      const isRunning = tracker.isRunning();
      const callbackCount = tracker.getCallbackCount();
      
      console.log('📱 RealTimeDeviceTracker 状态:', {
        isRunning,
        callbackCount
      });

      // 2. 获取当前设备数量
      const devices = await tracker.getCurrentDevices();
      console.log('📱 当前设备数量:', devices.length);

      // 3. 模拟一个设备变化事件来测试回调链路
      console.log('🧪 正在测试回调链路...');
      
      // 创建一个测试事件
      const testEvent = {
        event_type: { InitialList: null },
        devices: devices,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // 手动触发回调来测试
      console.log('🧪 手动触发测试事件...');
      (tracker as any).handleDeviceChange(testEvent);

    } catch (error) {
      console.error('❌ 诊断过程中发生错误:', error);
    }

    console.groupEnd();
  }

  /**
   * 强制重新初始化回调链路
   */
  async forceReinitializeCallbacks(): Promise<void> {
    console.log('🔧 [回调链路诊断] 强制重新初始化回调链路...');

    try {
      // 这里需要访问到具体的 Repository 实例来重新注册回调
      // 由于架构限制，这个功能需要在实际使用时通过外部调用实现
      console.warn('⚠️ 强制重新初始化需要通过外部调用实现');
      
    } catch (error) {
      console.error('❌ 强制重新初始化失败:', error);
    }
  }

  /**
   * 监控回调执行情况
   */
  startCallbackMonitoring(): void {
    console.log('👀 [回调链路诊断] 开始监控回调执行...');

    try {
      const tracker = getGlobalDeviceTracker();
      
      // Hook 到回调执行过程
      const originalCallbacks = (tracker as any).deviceChangeCallbacks;
      if (originalCallbacks) {
        // 包装每个回调函数来监控执行
        (tracker as any).deviceChangeCallbacks = originalCallbacks.map((callback: any, index: number) => {
          return function(event: any) {
            console.log(`🎯 [回调监控] 回调 #${index + 1} 开始执行...`);
            const startTime = performance.now();
            
            try {
              const result = callback(event);
              const endTime = performance.now();
              console.log(`✅ [回调监控] 回调 #${index + 1} 执行成功，耗时: ${(endTime - startTime).toFixed(2)}ms`);
              return result;
            } catch (error) {
              const endTime = performance.now();
              console.error(`❌ [回调监控] 回调 #${index + 1} 执行失败，耗时: ${(endTime - startTime).toFixed(2)}ms`, error);
              throw error;
            }
          };
        });
        
        console.log('✅ [回调链路诊断] 回调监控已启动');
      }
    } catch (error) {
      console.error('❌ 启动回调监控失败:', error);
    }
  }
}

// 导出单例实例
export const callbackChainDiagnostics = CallbackChainDiagnostics.getInstance();