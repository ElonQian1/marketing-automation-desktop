// src/utils/logger-filter.ts
// module: shared | layer: services | role: logger-filter
// summary: 日志过滤和去重服务，减少控制台冗余输出

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,    // 🔍 调试信息（默认关闭）
  INFO = 1,     // ℹ️ 一般信息
  WARN = 2,     // ⚠️ 警告
  ERROR = 3,    // ❌ 错误
  CRITICAL = 4, // 🔥 关键信息（始终显示）
}

/**
 * 日志配置
 */
interface LoggerConfig {
  level: LogLevel;
  enableDeduplication: boolean;
  deduplicationWindowMs: number;
  mutedPrefixes: string[];
}

/**
 * 日志去重缓存
 */
class LogDeduplicator {
  private cache = new Map<string, number>();
  private windowMs: number;

  constructor(windowMs: number = 1000) {
    this.windowMs = windowMs;
  }

  shouldLog(message: string): boolean {
    const now = Date.now();
    const lastTime = this.cache.get(message);

    if (lastTime && now - lastTime < this.windowMs) {
      return false; // 短时间内重复，不打印
    }

    this.cache.set(message, now);
    
    // 清理过期缓存
    if (this.cache.size > 100) {
      this.cleanup(now);
    }

    return true;
  }

  private cleanup(now: number) {
    for (const [key, time] of this.cache.entries()) {
      if (now - time > this.windowMs * 2) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 日志过滤器
 */
class LoggerFilter {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    enableDeduplication: true,
    deduplicationWindowMs: 1000,
    mutedPrefixes: [],
  };

  private deduplicator = new LogDeduplicator(this.config.deduplicationWindowMs);

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel) {
    this.config.level = level;
    console.log(`📊 [LoggerFilter] 日志级别已设置为: ${LogLevel[level]}`);
  }

  /**
   * 静音指定前缀的日志
   */
  mute(...prefixes: string[]) {
    this.config.mutedPrefixes.push(...prefixes);
    console.log(`🔇 [LoggerFilter] 已静音日志前缀:`, prefixes);
  }

  /**
   * 取消静音
   */
  unmute(...prefixes: string[]) {
    this.config.mutedPrefixes = this.config.mutedPrefixes.filter(
      p => !prefixes.includes(p)
    );
    console.log(`🔊 [LoggerFilter] 已取消静音:`, prefixes);
  }

  /**
   * 清空所有静音规则
   */
  clearMuted() {
    this.config.mutedPrefixes = [];
    console.log(`🔊 [LoggerFilter] 已清空所有静音规则`);
  }

  /**
   * 检查是否应该打印日志
   */
  shouldLog(message: string, level: LogLevel = LogLevel.INFO): boolean {
    // 关键日志始终显示
    if (level === LogLevel.CRITICAL) {
      return true;
    }

    // 级别过滤
    if (level < this.config.level) {
      return false;
    }

    // 前缀静音检查
    if (this.config.mutedPrefixes.some(prefix => message.includes(prefix))) {
      return false;
    }

    // 去重检查
    if (this.config.enableDeduplication) {
      return this.deduplicator.shouldLog(message);
    }

    return true;
  }

  /**
   * 条件日志：debug
   */
  debug(prefix: string, message: string, data?: any) {
    if (this.shouldLog(`${prefix} ${message}`, LogLevel.DEBUG)) {
      console.log(`🔍 ${prefix} ${message}`, data ?? '');
    }
  }

  /**
   * 条件日志：info
   */
  info(prefix: string, message: string, data?: any) {
    if (this.shouldLog(`${prefix} ${message}`, LogLevel.INFO)) {
      console.log(`ℹ️ ${prefix} ${message}`, data ?? '');
    }
  }

  /**
   * 条件日志：warn
   */
  warn(prefix: string, message: string, data?: any) {
    if (this.shouldLog(`${prefix} ${message}`, LogLevel.WARN)) {
      console.warn(`⚠️ ${prefix} ${message}`, data ?? '');
    }
  }

  /**
   * 条件日志：error
   */
  error(prefix: string, message: string, data?: any) {
    if (this.shouldLog(`${prefix} ${message}`, LogLevel.ERROR)) {
      console.error(`❌ ${prefix} ${message}`, data ?? '');
    }
  }

  /**
   * 条件日志：critical（始终显示）
   */
  critical(prefix: string, message: string, data?: any) {
    console.log(`🔥 ${prefix} ${message}`, data ?? '');
  }
}

// 导出单例
export const logger = new LoggerFilter();

// 全局可用（调试用）
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
  (window as any).LogLevel = LogLevel;
}
