/**
 * 设备监听生产环境配置
 * 通过环境变量和配置项控制日志和诊断级别
 */

import { LogLevel } from './logger/DeviceWatchingLogger';

export interface ProductionDeviceWatchingConfig {
  // 日志配置
  logLevel: LogLevel;
  
  // 诊断配置
  enableDiagnostics: boolean;
  enablePerformanceMonitoring: boolean;
  enableAutoRecovery: boolean;
  
  // 监控配置
  healthCheckInterval: number; // 毫秒
  enableContinuousMonitoring: boolean;
  
  // 清理配置
  enableLegacyDiagnosticTools: boolean; // 是否启用旧版诊断工具
}

class ProductionConfigManager {
  private static instance: ProductionConfigManager | null = null;
  private config: ProductionDeviceWatchingConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): ProductionConfigManager {
    if (!this.instance) {
      this.instance = new ProductionConfigManager();
    }
    return this.instance;
  }

  getConfig(): ProductionDeviceWatchingConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ProductionDeviceWatchingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private loadConfiguration(): ProductionDeviceWatchingConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // 默认配置（生产环境优化）
    const defaultConfig: ProductionDeviceWatchingConfig = {
      // 生产环境仅记录警告和错误，开发环境记录详细信息
      logLevel: isProduction ? LogLevel.WARN : LogLevel.INFO,
      
      // 生产环境禁用诊断，开发环境启用
      enableDiagnostics: !isProduction,
      enablePerformanceMonitoring: false, // 默认关闭性能监控
      enableAutoRecovery: true, // 生产环境启用自动恢复
      
      // 监控配置
      healthCheckInterval: isProduction ? 60000 : 30000, // 生产环境减少检查频率
      enableContinuousMonitoring: !isProduction, // 仅开发环境持续监控
      
      // 清理配置
      enableLegacyDiagnosticTools: false // 默认禁用旧版诊断工具
    };

    // 通过环境变量覆盖配置
    const envConfig: Partial<ProductionDeviceWatchingConfig> = {};

    // 日志级别
    const envLogLevel = process.env.DEVICE_WATCHING_LOG_LEVEL;
    if (envLogLevel) {
      const level = parseInt(envLogLevel);
      if (level >= LogLevel.SILENT && level <= LogLevel.VERBOSE) {
        envConfig.logLevel = level;
      }
    }

    // 诊断开关
    if (process.env.DEVICE_WATCHING_ENABLE_DIAGNOSTICS !== undefined) {
      envConfig.enableDiagnostics = process.env.DEVICE_WATCHING_ENABLE_DIAGNOSTICS === 'true';
    }

    // 性能监控开关
    if (process.env.DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING !== undefined) {
      envConfig.enablePerformanceMonitoring = process.env.DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING === 'true';
    }

    // 自动恢复开关
    if (process.env.DEVICE_WATCHING_ENABLE_AUTO_RECOVERY !== undefined) {
      envConfig.enableAutoRecovery = process.env.DEVICE_WATCHING_ENABLE_AUTO_RECOVERY === 'true';
    }

    // 健康检查间隔
    const envHealthCheckInterval = process.env.DEVICE_WATCHING_HEALTH_CHECK_INTERVAL;
    if (envHealthCheckInterval) {
      const interval = parseInt(envHealthCheckInterval);
      if (interval > 0) {
        envConfig.healthCheckInterval = interval;
      }
    }

    // 持续监控开关
    if (process.env.DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING !== undefined) {
      envConfig.enableContinuousMonitoring = process.env.DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING === 'true';
    }

    // 旧版工具开关
    if (process.env.DEVICE_WATCHING_ENABLE_LEGACY_TOOLS !== undefined) {
      envConfig.enableLegacyDiagnosticTools = process.env.DEVICE_WATCHING_ENABLE_LEGACY_TOOLS === 'true';
    }

    return { ...defaultConfig, ...envConfig };
  }

  /**
   * 获取生产优化的简化配置
   */
  getProductionOptimizedConfig(): ProductionDeviceWatchingConfig {
    return {
      logLevel: LogLevel.WARN,
      enableDiagnostics: false,
      enablePerformanceMonitoring: false,
      enableAutoRecovery: true,
      healthCheckInterval: 60000,
      enableContinuousMonitoring: false,
      enableLegacyDiagnosticTools: false
    };
  }

  /**
   * 获取开发调试配置
   */
  getDevelopmentDebugConfig(): ProductionDeviceWatchingConfig {
    return {
      logLevel: LogLevel.DEBUG,
      enableDiagnostics: true,
      enablePerformanceMonitoring: true,
      enableAutoRecovery: true,
      healthCheckInterval: 15000,
      enableContinuousMonitoring: true,
      enableLegacyDiagnosticTools: true
    };
  }

  /**
   * 输出当前配置信息（仅在非静默模式）
   */
  logCurrentConfig(): void {
    if (this.config.logLevel > LogLevel.SILENT) {
      console.log('📋 设备监听配置:', {
        环境: process.env.NODE_ENV || 'unknown',
        日志级别: LogLevel[this.config.logLevel],
        诊断功能: this.config.enableDiagnostics ? '启用' : '禁用',
        性能监控: this.config.enablePerformanceMonitoring ? '启用' : '禁用',
        自动恢复: this.config.enableAutoRecovery ? '启用' : '禁用',
        健康检查间隔: `${this.config.healthCheckInterval}ms`,
        持续监控: this.config.enableContinuousMonitoring ? '启用' : '禁用',
        旧版工具: this.config.enableLegacyDiagnosticTools ? '启用' : '禁用'
      });
    }
  }
}

export const productionConfigManager = ProductionConfigManager.getInstance();

// 导出便捷访问函数
export function getDeviceWatchingConfig(): ProductionDeviceWatchingConfig {
  return productionConfigManager.getConfig();
}

export function updateDeviceWatchingConfig(updates: Partial<ProductionDeviceWatchingConfig>): void {
  productionConfigManager.updateConfig(updates);
}

export function isLegacyDiagnosticToolsEnabled(): boolean {
  return productionConfigManager.getConfig().enableLegacyDiagnosticTools;
}