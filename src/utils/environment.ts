// src/utils/environment.ts
// module: shared | layer: utils | role: utility
// summary: 工具函数

/**
 * 前端环境变量访问工具
 * 
 * 在 Tauri 前端环境中安全访问环境变量
 * 使用 import.meta.env 替代 process.env
 */

interface SafeViteEnv {
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  VITE_DEVICE_WATCHING_LOG_LEVEL?: string;
  VITE_DEVICE_WATCHING_ENABLE_DIAGNOSTICS?: string;
  VITE_DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING?: string;
  VITE_DEVICE_WATCHING_ENABLE_AUTO_RECOVERY?: string;
  VITE_DEVICE_WATCHING_HEALTH_CHECK_INTERVAL?: string;
  VITE_DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING?: string;
  VITE_DEVICE_WATCHING_ENABLE_LEGACY_TOOLS?: string;
  VITE_DEVICE_WATCH_STRATEGY?: string;
}

/**
 * 获取环境变量的安全方法
 */
class EnvironmentService {
  private static getViteEnv(): SafeViteEnv {
    // 在前端环境中使用 import.meta.env
    if (typeof window !== 'undefined' && import.meta?.env) {
      return {
        MODE: import.meta.env.MODE || 'development',
        DEV: import.meta.env.DEV || false,
        PROD: import.meta.env.PROD || false,
        VITE_DEVICE_WATCHING_LOG_LEVEL: import.meta.env.VITE_DEVICE_WATCHING_LOG_LEVEL,
        VITE_DEVICE_WATCHING_ENABLE_DIAGNOSTICS: import.meta.env.VITE_DEVICE_WATCHING_ENABLE_DIAGNOSTICS,
        VITE_DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING,
        VITE_DEVICE_WATCHING_ENABLE_AUTO_RECOVERY: import.meta.env.VITE_DEVICE_WATCHING_ENABLE_AUTO_RECOVERY,
        VITE_DEVICE_WATCHING_HEALTH_CHECK_INTERVAL: import.meta.env.VITE_DEVICE_WATCHING_HEALTH_CHECK_INTERVAL,
        VITE_DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING: import.meta.env.VITE_DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING,
        VITE_DEVICE_WATCHING_ENABLE_LEGACY_TOOLS: import.meta.env.VITE_DEVICE_WATCHING_ENABLE_LEGACY_TOOLS,
        VITE_DEVICE_WATCH_STRATEGY: import.meta.env.VITE_DEVICE_WATCH_STRATEGY,
      };
    }
    
    // 在 Node.js 环境中（如测试）使用 process.env
    if (typeof process !== 'undefined' && process.env) {
      return {
        MODE: process.env.NODE_ENV || 'development',
        DEV: process.env.NODE_ENV === 'development',
        PROD: process.env.NODE_ENV === 'production',
        VITE_DEVICE_WATCHING_LOG_LEVEL: process.env.DEVICE_WATCHING_LOG_LEVEL,
        VITE_DEVICE_WATCHING_ENABLE_DIAGNOSTICS: process.env.DEVICE_WATCHING_ENABLE_DIAGNOSTICS,
        VITE_DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING: process.env.DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING,
        VITE_DEVICE_WATCHING_ENABLE_AUTO_RECOVERY: process.env.DEVICE_WATCHING_ENABLE_AUTO_RECOVERY,
        VITE_DEVICE_WATCHING_HEALTH_CHECK_INTERVAL: process.env.DEVICE_WATCHING_HEALTH_CHECK_INTERVAL,
        VITE_DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING: process.env.DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING,
        VITE_DEVICE_WATCHING_ENABLE_LEGACY_TOOLS: process.env.DEVICE_WATCHING_ENABLE_LEGACY_TOOLS,
        VITE_DEVICE_WATCH_STRATEGY: process.env.VITE_DEVICE_WATCH_STRATEGY,
      };
    }
    
    // Fallback to defaults
    return {
      MODE: 'development',
      DEV: true,
      PROD: false,
    };
  }

  static get env(): SafeViteEnv {
    return this.getViteEnv();
  }

  static isDevelopment(): boolean {
    return this.env.MODE === 'development' || this.env.DEV;
  }

  static isProduction(): boolean {
    return this.env.MODE === 'production' || this.env.PROD;
  }

  static getDeviceWatchingLogLevel(): string | undefined {
    return this.env.VITE_DEVICE_WATCHING_LOG_LEVEL;
  }

  static getDeviceWatchStrategy(): 'debounce' | 'immediate' | undefined {
    const strategy = this.env.VITE_DEVICE_WATCH_STRATEGY;
    if (strategy === 'debounce' || strategy === 'immediate') {
      return strategy;
    }
    return undefined;
  }

  static getBooleanEnv(key: keyof SafeViteEnv): boolean | undefined {
    const value = this.env[key];
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }

  static getNumberEnv(key: keyof SafeViteEnv): number | undefined {
    const value = this.env[key];
    if (value === undefined || typeof value === 'boolean') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
}

export { EnvironmentService, type SafeViteEnv };