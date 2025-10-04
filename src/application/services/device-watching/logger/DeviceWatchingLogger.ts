/**
 * 设备监听日志管理器
 * 提供分级日志记录，生产环境可控制详细程度
 */

export enum LogLevel {
  SILENT = 0,    // 静默模式，仅记录错误
  ERROR = 1,     // 仅错误
  WARN = 2,      // 警告 + 错误
  INFO = 3,      // 关键信息 + 警告 + 错误
  DEBUG = 4,     // 详细调试 + 以上所有
  VERBOSE = 5    // 最详细（包含所有诊断信息）
}

class DeviceWatchingLogger {
  private static instance: DeviceWatchingLogger | null = null;
  private currentLevel: LogLevel;

  private constructor() {
    // 根据环境变量或配置确定日志级别
    const envLevel = process.env.DEVICE_WATCHING_LOG_LEVEL;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (envLevel) {
      this.currentLevel = parseInt(envLevel) as LogLevel;
    } else {
      // 开发环境默认 INFO，生产环境默认 WARN
      this.currentLevel = isDevelopment ? LogLevel.INFO : LogLevel.WARN;
    }
  }

  static getInstance(): DeviceWatchingLogger {
    if (!this.instance) {
      this.instance = new DeviceWatchingLogger();
    }
    return this.instance;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  error(message: string, data?: any, source?: string): void {
    if (this.currentLevel >= LogLevel.ERROR) {
      const prefix = source ? `❌ [${source}]` : '❌';
      if (data) {
        console.error(`${prefix} ${message}`, data);
      } else {
        console.error(`${prefix} ${message}`);
      }
    }
  }

  warn(message: string, data?: any, source?: string): void {
    if (this.currentLevel >= LogLevel.WARN) {
      const prefix = source ? `⚠️ [${source}]` : '⚠️';
      if (data) {
        console.warn(`${prefix} ${message}`, data);
      } else {
        console.warn(`${prefix} ${message}`);
      }
    }
  }

  info(message: string, data?: any, source?: string): void {
    if (this.currentLevel >= LogLevel.INFO) {
      const prefix = source ? `ℹ️ [${source}]` : 'ℹ️';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  debug(message: string, data?: any, source?: string): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      const prefix = source ? `🔧 [${source}]` : '🔧';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  verbose(message: string, data?: any, source?: string): void {
    if (this.currentLevel >= LogLevel.VERBOSE) {
      const prefix = source ? `🔍 [${source}]` : '🔍';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  // 特殊方法：关键事件（总是记录，除非静默模式）
  critical(message: string, data?: any, source?: string): void {
    if (this.currentLevel > LogLevel.SILENT) {
      const prefix = source ? `🚨 [${source}]` : '🚨';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  // 性能测量（仅在 DEBUG 及以上级别）
  time(label: string): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
}

export const deviceWatchingLogger = DeviceWatchingLogger.getInstance();
export { DeviceWatchingLogger };