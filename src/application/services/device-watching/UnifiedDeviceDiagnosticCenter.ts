/**
 * 统一的设备监听诊断中心
 * 整合所有诊断功能，避免重复代码和工具类泛滥
 */

import { deviceWatchingLogger, LogLevel } from './logger/DeviceWatchingLogger';
import { DeviceWatchingService } from './DeviceWatchingService';
import { getGlobalDeviceTracker } from '../../../infrastructure/RealTimeDeviceTracker';

export interface DiagnosticResult {
  timestamp: number;
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  metrics: {
    trackerRunning: boolean;
    trackerCallbackCount: number;
    repositoryCallbackCount: number;
    watchingServiceActive: boolean;
    currentDeviceCount: number;
  };
  lastError?: Error;
}

export interface DiagnosticConfig {
  enableAutoRecovery: boolean;
  enablePerformanceMonitoring: boolean;
  logLevel: LogLevel;
}

/**
 * 统一诊断中心
 * 替代原有的 4 个独立诊断工具类
 */
export class UnifiedDeviceDiagnosticCenter {
  private static instance: UnifiedDeviceDiagnosticCenter | null = null;
  private config: DiagnosticConfig;
  private monitoringInterval?: number;
  private performanceMetrics: Map<string, number> = new Map();

  private constructor() {
    this.config = {
      enableAutoRecovery: true,
      enablePerformanceMonitoring: false, // 默认关闭性能监控
      logLevel: LogLevel.WARN
    };
  }

  static getInstance(): UnifiedDeviceDiagnosticCenter {
    if (!this.instance) {
      this.instance = new UnifiedDeviceDiagnosticCenter();
    }
    return this.instance;
  }

  configure(config: Partial<DiagnosticConfig>): void {
    this.config = { ...this.config, ...config };
    deviceWatchingLogger.setLevel(this.config.logLevel);
  }

  /**
   * 快速健康检查
   * 替代原有的多个诊断方法
   */
  async quickHealthCheck(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    if (this.config.enablePerformanceMonitoring) {
      deviceWatchingLogger.time('HealthCheck');
    }

    try {
      const result = await this.performHealthCheck();
      
      if (this.config.enablePerformanceMonitoring) {
        deviceWatchingLogger.timeEnd('HealthCheck');
        this.updatePerformanceMetric('lastHealthCheckDuration', Date.now() - startTime);
      }

      // 仅在发现问题或 DEBUG 级别时输出详细信息
      if (!result.healthy || deviceWatchingLogger.getLevel() >= LogLevel.DEBUG) {
        this.reportDiagnosticResult(result);
      }

      // 自动恢复机制
      if (!result.healthy && this.config.enableAutoRecovery) {
        deviceWatchingLogger.warn('检测到问题，触发自动恢复...', null, 'DiagnosticCenter');
        await this.attemptAutoRecovery(result);
      }

      return result;
    } catch (error) {
      deviceWatchingLogger.error('健康检查失败', error, 'DiagnosticCenter');
      throw error;
    }
  }

  /**
   * 开始监控（仅在需要时）
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      deviceWatchingLogger.warn('监控已在运行，跳过重复启动', null, 'DiagnosticCenter');
      return;
    }

    deviceWatchingLogger.info('启动设备监听健康监控', { intervalMs }, 'DiagnosticCenter');
    
    this.monitoringInterval = window.setInterval(async () => {
      try {
        await this.quickHealthCheck();
      } catch (error) {
        deviceWatchingLogger.error('定期健康检查失败', error, 'DiagnosticCenter');
      }
    }, intervalMs);
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      deviceWatchingLogger.info('已停止设备监听健康监控', null, 'DiagnosticCenter');
    }
  }

  /**
   * 手动触发恢复（调试用）
   */
  async manualRecovery(): Promise<void> {
    deviceWatchingLogger.info('手动触发系统恢复...', null, 'DiagnosticCenter');
    const result = await this.performHealthCheck();
    await this.attemptAutoRecovery(result);
  }

  /**
   * 获取性能指标（仅在启用性能监控时）
   */
  getPerformanceMetrics(): Record<string, number> | null {
    if (!this.config.enablePerformanceMonitoring) {
      return null;
    }
    return Object.fromEntries(this.performanceMetrics.entries());
  }

  private async performHealthCheck(): Promise<DiagnosticResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const tracker = getGlobalDeviceTracker();

    // 检查 Tracker 状态
    const trackerRunning = tracker.isRunning();
    const trackerCallbackCount = tracker.getCallbackCount();

    if (!trackerRunning) {
      issues.push('RealTimeDeviceTracker 未运行');
      recommendations.push('重新启动设备跟踪器');
    }

    if (trackerCallbackCount === 0) {
      issues.push('设备跟踪器无回调注册');
      recommendations.push('检查事件监听器注册');
    }

    // 检查设备数量
    let currentDeviceCount = 0;
    try {
      const devices = await tracker.getCurrentDevices();
      currentDeviceCount = devices.length;
    } catch (error) {
      issues.push('无法获取当前设备列表');
      recommendations.push('检查 ADB 连接状态');
    }

    return {
      timestamp: Date.now(),
      healthy: issues.length === 0,
      issues,
      recommendations,
      metrics: {
        trackerRunning,
        trackerCallbackCount,
        repositoryCallbackCount: 0, // 简化版本
        watchingServiceActive: trackerCallbackCount > 0,
        currentDeviceCount
      }
    };
  }

  private reportDiagnosticResult(result: DiagnosticResult): void {
    const timeStr = new Date(result.timestamp).toLocaleTimeString();
    
    if (result.healthy) {
      deviceWatchingLogger.info('设备监听系统健康', {
        时间: timeStr,
        设备数量: result.metrics.currentDeviceCount,
        跟踪器状态: result.metrics.trackerRunning ? '运行中' : '已停止',
        回调数量: result.metrics.trackerCallbackCount
      }, 'DiagnosticCenter');
    } else {
      deviceWatchingLogger.warn('发现系统问题', {
        时间: timeStr,
        问题: result.issues,
        建议: result.recommendations,
        指标: result.metrics
      }, 'DiagnosticCenter');
    }
  }

  private async attemptAutoRecovery(result: DiagnosticResult): Promise<void> {
    if (!result.metrics.trackerRunning) {
      try {
        deviceWatchingLogger.info('尝试重启设备跟踪器...', null, 'DiagnosticCenter');
        const tracker = getGlobalDeviceTracker();
        await tracker.startTracking();
        deviceWatchingLogger.info('设备跟踪器重启成功', null, 'DiagnosticCenter');
      } catch (error) {
        deviceWatchingLogger.error('设备跟踪器重启失败', error, 'DiagnosticCenter');
      }
    }

    // 可以添加更多恢复策略...
  }

  private updatePerformanceMetric(key: string, value: number): void {
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMetrics.set(key, value);
    }
  }
}

export const unifiedDeviceDiagnosticCenter = UnifiedDeviceDiagnosticCenter.getInstance();