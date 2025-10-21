// src/modules/ai/services/ai-logger.ts
// module: ai | layer: services | role: 日志记录
// summary: AI 请求和响应的日志记录

interface LogEntry {
  timestamp: string;
  provider: string;
  model: string;
  requestId?: string;
  operation: string;
  durationMs?: number;
  tokensUsed?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * AI 日志记录器
 */
export class AILogger {
  private enabled: boolean;
  private logs: LogEntry[] = [];

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * 记录请求开始
   */
  logRequest(
    provider: string,
    model: string,
    operation: string,
    metadata?: Record<string, any>
  ): string {
    const requestId = this.generateRequestId();
    
    if (this.enabled) {
      console.log(`[AI Request] ${provider}/${model} - ${operation}`, {
        requestId,
        ...metadata,
      });
    }

    return requestId;
  }

  /**
   * 记录响应成功
   */
  logResponse(
    provider: string,
    model: string,
    operation: string,
    requestId: string,
    durationMs: number,
    tokensUsed?: number,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      provider,
      model,
      requestId,
      operation,
      durationMs,
      tokensUsed,
      metadata,
    };

    this.logs.push(entry);

    if (this.enabled) {
      console.log(`[AI Response] ${provider}/${model} - ${operation}`, {
        requestId,
        durationMs: `${durationMs}ms`,
        tokensUsed,
        ...metadata,
      });
    }
  }

  /**
   * 记录错误
   */
  logError(
    provider: string,
    model: string,
    operation: string,
    requestId: string,
    error: Error,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      provider,
      model,
      requestId,
      operation,
      error: error.message,
      metadata,
    };

    this.logs.push(entry);

    if (this.enabled) {
      console.error(`[AI Error] ${provider}/${model} - ${operation}`, {
        requestId,
        error: error.message,
        ...metadata,
      });
    }
  }

  /**
   * 记录重试
   */
  logRetry(
    provider: string,
    model: string,
    operation: string,
    requestId: string,
    attempt: number,
    error: Error
  ): void {
    if (this.enabled) {
      console.warn(`[AI Retry] ${provider}/${model} - ${operation}`, {
        requestId,
        attempt,
        error: error.message,
      });
    }
  }

  /**
   * 获取日志统计
   */
  getStats(): {
    totalRequests: number;
    totalErrors: number;
    avgDuration: number;
    totalTokens: number;
  } {
    const totalRequests = this.logs.length;
    const totalErrors = this.logs.filter(log => log.error).length;
    const durations = this.logs
      .filter(log => log.durationMs)
      .map(log => log.durationMs!);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    const totalTokens = this.logs
      .filter(log => log.tokensUsed)
      .reduce((sum, log) => sum + log.tokensUsed!, 0);

    return {
      totalRequests,
      totalErrors,
      avgDuration,
      totalTokens,
    };
  }

  /**
   * 清除日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// 全局单例
let globalLogger: AILogger | null = null;

/**
 * 获取全局日志记录器
 */
export function getGlobalLogger(): AILogger {
  if (!globalLogger) {
    globalLogger = new AILogger(import.meta.env.DEV);
  }
  return globalLogger;
}
