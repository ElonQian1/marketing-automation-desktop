// src/modules/ai/services/ai-retry.ts
// module: ai | layer: services | role: 重试和限流机制
// summary: 实现指数退避重试和错误处理

import { AIError, AIErrorType, type RetryConfig } from '../domain/ai-types';

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof AIError) {
    return error.retryable;
  }

  // HTTP 状态码判断
  const status = error.status || error.statusCode;
  if (status) {
    // 429 (Rate Limit), 500-599 (Server Errors)
    return status === 429 || (status >= 500 && status < 600);
  }

  // 网络错误
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  return false;
}

/**
 * 将错误转换为 AIError
 */
export function convertToAIError(error: any): AIError {
  if (error instanceof AIError) {
    return error;
  }

  const status = error.status || error.statusCode;

  // 根据 HTTP 状态码判断错误类型
  if (status === 429) {
    return new AIError(
      AIErrorType.RATE_LIMIT,
      'Rate limit exceeded. Please retry after a delay.',
      status,
      true,
      error
    );
  }

  if (status === 401 || status === 403) {
    return new AIError(
      AIErrorType.AUTHENTICATION,
      'Authentication failed. Please check your API key.',
      status,
      false,
      error
    );
  }

  if (status === 400 || status === 422) {
    return new AIError(
      AIErrorType.INVALID_REQUEST,
      error.message || 'Invalid request parameters.',
      status,
      false,
      error
    );
  }

  if (status && status >= 500) {
    return new AIError(
      AIErrorType.SERVER_ERROR,
      'Server error occurred. Retrying...',
      status,
      true,
      error
    );
  }

  // 超时错误
  if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
    return new AIError(
      AIErrorType.TIMEOUT,
      'Request timeout. Please retry.',
      undefined,
      true,
      error
    );
  }

  // 网络错误
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
    return new AIError(
      AIErrorType.NETWORK_ERROR,
      'Network error occurred. Please check your connection.',
      undefined,
      true,
      error
    );
  }

  return new AIError(
    AIErrorType.UNKNOWN,
    error.message || 'Unknown error occurred.',
    undefined,
    false,
    error
  );
}

/**
 * 计算重试延迟时间（指数退避）
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * 等待指定时间
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的异步函数包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  onRetry?: (attempt: number, error: AIError) => void
): Promise<T> {
  let lastError: AIError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = convertToAIError(error);

      // 如果不可重试或已达到最大重试次数，直接抛出
      if (!lastError.retryable || attempt === config.maxRetries) {
        throw lastError;
      }

      // 计算延迟时间
      const delay = calculateRetryDelay(attempt, config);
      
      // 通知重试回调
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // 等待后重试
      await sleep(delay);
    }
  }

  // 理论上不会到这里，但为了类型安全
  throw lastError!;
}

/**
 * 简单的限流器（令牌桶算法）
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * 尝试获取令牌
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // 计算需要等待的时间
    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    await sleep(waitTime);
    this.tokens = 0;
  }

  /**
   * 补充令牌
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }
}
