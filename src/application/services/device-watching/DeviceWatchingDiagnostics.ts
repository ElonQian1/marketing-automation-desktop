/**
 * 设备监听诊断工具
 * 
 * 用于检测和分析设备自动刷新问题
 */
import { DeviceWatchingService } from './DeviceWatchingService';
import { getGlobalDeviceTracker } from '../../../infrastructure/RealTimeDeviceTracker';

export interface DiagnosticResult {
  timestamp: number;
  trackerRunning: boolean;
  trackerCallbackCount: number;
  watchingServiceActive: boolean;
  currentDeviceCount: number;
  lastError?: string;
}

export class DeviceWatchingDiagnostics {
  private static instance: DeviceWatchingDiagnostics | null = null;
  private diagnosticHistory: DiagnosticResult[] = [];

  private constructor() {}

  static getInstance(): DeviceWatchingDiagnostics {
    if (!this.instance) {
      this.instance = new DeviceWatchingDiagnostics();
    }
    return this.instance;
  }

  /**
   * 执行完整的诊断检查
   */
  async performDiagnostic(watchingService?: DeviceWatchingService): Promise<DiagnosticResult> {
    const result: DiagnosticResult = {
      timestamp: Date.now(),
      trackerRunning: false,
      trackerCallbackCount: 0,
      watchingServiceActive: false,
      currentDeviceCount: 0
    };

    try {
      // 检查 RealTimeDeviceTracker 状态
      const tracker = getGlobalDeviceTracker();
      result.trackerRunning = tracker.isRunning();
      
      // 获取当前设备数量
      const devices = await tracker.getCurrentDevices();
      result.currentDeviceCount = devices.length;

      // 检查 DeviceWatchingService 状态
      if (watchingService) {
        result.watchingServiceActive = watchingService.isWatching();
      }

      // 尝试获取回调数量（通过反射或其他方式，这里模拟）
      // 实际实现中需要在 RealTimeDeviceTracker 中暴露这个信息
      result.trackerCallbackCount = this.getTrackerCallbackCount();

    } catch (error) {
      result.lastError = error instanceof Error ? error.message : String(error);
    }

    // 记录到历史
    this.diagnosticHistory.push(result);
    
    // 只保留最近10次诊断
    if (this.diagnosticHistory.length > 10) {
      this.diagnosticHistory = this.diagnosticHistory.slice(-10);
    }

    this.logDiagnosticResult(result);
    return result;
  }

  /**
   * 获取 RealTimeDeviceTracker 的回调数量
   */
  private getTrackerCallbackCount(): number {
    try {
      const tracker = getGlobalDeviceTracker();
      return tracker.getCallbackCount();
    } catch {
      return 0;
    }
  }

  /**
   * 打印诊断报告
   */
  private logDiagnosticResult(result: DiagnosticResult): void {
    console.group('🔍 [设备监听诊断报告]');
    console.log('⏰ 时间戳:', new Date(result.timestamp).toLocaleTimeString());
    console.log('🔌 RealTimeDeviceTracker:', result.trackerRunning ? '✅ 运行中' : '❌ 已停止');
    console.log('📞 回调数量:', result.trackerCallbackCount);
    console.log('👀 DeviceWatchingService:', result.watchingServiceActive ? '✅ 监听中' : '❌ 未监听');
    console.log('📱 当前设备数:', result.currentDeviceCount);
    
    if (result.lastError) {
      console.error('❌ 错误:', result.lastError);
    }

    // 分析可能的问题
    this.analyzeIssues(result);
    
    console.groupEnd();
  }

  /**
   * 分析可能的问题
   */
  private analyzeIssues(result: DiagnosticResult): void {
    const issues: string[] = [];

    if (!result.trackerRunning) {
      issues.push('RealTimeDeviceTracker 未运行');
    }

    if (result.trackerCallbackCount === 0 && result.watchingServiceActive) {
      issues.push('DeviceWatchingService 正在监听但 RealTimeDeviceTracker 没有回调');
    }

    if (result.trackerRunning && !result.watchingServiceActive) {
      issues.push('RealTimeDeviceTracker 运行中但 DeviceWatchingService 未监听');
    }

    if (issues.length > 0) {
      console.warn('⚠️ 发现问题:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
      
      console.info('💡 建议解决方案:');
      if (issues.includes('RealTimeDeviceTracker 未运行')) {
        console.info('  - 检查 ADB 服务是否正常');
        console.info('  - 尝试重新初始化设备监听');
      }
      if (issues.some(i => i.includes('回调'))) {
        console.info('  - 检查事件监听器是否正确注册');
        console.info('  - 尝试重启监听服务');
      }
    } else {
      console.log('✅ 未发现明显问题');
    }
  }

  /**
   * 获取诊断历史
   */
  getDiagnosticHistory(): DiagnosticResult[] {
    return [...this.diagnosticHistory];
  }

  /**
   * 清除诊断历史
   */
  clearHistory(): void {
    this.diagnosticHistory = [];
    console.log('🧹 诊断历史已清除');
  }
}

// 导出单例实例
export const deviceWatchingDiagnostics = DeviceWatchingDiagnostics.getInstance();