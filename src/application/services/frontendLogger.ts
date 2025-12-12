// src/application/services/frontendLogger.ts
// module: application | layer: services | role: frontend-logger
// summary: 前端日志服务 - 将 console.log 同时输出到文件

import { invoke } from '@tauri-apps/api/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class FrontendLogger {
  private buffer: LogEntry[] = [];
  private flushInterval: number | null = null;
  private logFilePath: string = '';
  private isInitialized = false;
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  /**
   * 初始化日志系统
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // 设置日志文件路径
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    this.logFilePath = `logs/frontend-${dateStr}.log`;

    // 写入日志头（创建文件和目录）
    try {
      await invoke('plugin:file_manager|append_text', {
        path: this.logFilePath,
        content: `\n========== Frontend Log Started at ${now.toISOString()} ==========\n`,
      });
    } catch (e) {
      this.originalConsole.warn('无法初始化前端日志文件:', e);
    }

    // 覆盖 console 方法
    this.hookConsole();

    // 定期刷新日志到文件
    this.flushInterval = window.setInterval(() => this.flush(), 2000);

    this.isInitialized = true;
    this.info('📝 前端日志系统已初始化', { logFile: this.logFilePath });
  }

  /**
   * 覆盖 console 方法
   */
  private hookConsole(): void {
    console.log = (...args: unknown[]) => {
      this.originalConsole.log(...args);
      this.log('info', args);
    };

    console.info = (...args: unknown[]) => {
      this.originalConsole.info(...args);
      this.log('info', args);
    };

    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn(...args);
      this.log('warn', args);
    };

    console.error = (...args: unknown[]) => {
      this.originalConsole.error(...args);
      this.log('error', args);
    };

    console.debug = (...args: unknown[]) => {
      this.originalConsole.debug(...args);
      this.log('debug', args);
    };
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, args: unknown[]): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: args.map(arg => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg, null, 0);
        } catch {
          return String(arg);
        }
      }).join(' '),
    };

    this.buffer.push(entry);

    // 如果缓冲区太大，立即刷新
    if (this.buffer.length >= 50) {
      this.flush();
    }
  }

  /**
   * 刷新日志到文件
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    const content = entries.map(e => 
      `[${e.timestamp}] [${e.level.toUpperCase().padEnd(5)}] ${e.message}`
    ).join('\n') + '\n';

    try {
      // 追加到日志文件
      await invoke('plugin:file_manager|append_text', {
        path: this.logFilePath,
        content: content,
      });
    } catch (e) {
      // 静默失败，避免递归日志
      this.originalConsole.error('写入日志文件失败:', e);
    }
  }

  /**
   * 手动记录日志
   */
  debug(message: string, data?: unknown): void {
    console.debug(message, data);
  }

  info(message: string, data?: unknown): void {
    console.info(message, data);
  }

  warn(message: string, data?: unknown): void {
    console.warn(message, data);
  }

  error(message: string, data?: unknown): void {
    console.error(message, data);
  }

  /**
   * 销毁日志系统
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();

    // 恢复原始 console
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.isInitialized = false;
  }
}

// 导出单例
export const frontendLogger = new FrontendLogger();

// 自动初始化
frontendLogger.init().catch(e => {
  console.warn('前端日志初始化失败:', e);
});
