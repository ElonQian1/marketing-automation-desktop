// src/application/services/common/ErrorHandler.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 标准化错误处理工具
 * 
 * 提供统一的错误处理、错误分类和错误报告机制
 * 减少应用服务中的重复错误处理代码
 */
export class ErrorHandler {
  /**
   * 标准化错误处理
   * 将任何类型的错误转换为标准 Error 对象
   */
  static handle(error: unknown, context: string = '操作'): Error {
    if (error instanceof Error) {
      // 已经是 Error 对象，添加上下文信息
      const enhancedError = new Error(`${context} 失败: ${error.message}`);
      enhancedError.stack = error.stack;
      // TypeScript 兼容性：使用 any 类型来设置 cause
      (enhancedError as any).cause = error;
      return enhancedError;
    }

    if (typeof error === 'string') {
      return new Error(`${context} 失败: ${error}`);
    }

    if (error && typeof error === 'object') {
      const message = 'message' in error ? String(error.message) : String(error);
      return new Error(`${context} 失败: ${message}`);
    }

    return new Error(`${context} 失败: 未知错误`);
  }

  /**
   * 创建应用错误
   * 用于创建业务逻辑相关的错误
   */
  static createAppError(message: string, cause?: unknown): Error {
    const error = new Error(message);
    if (cause) {
      // TypeScript 兼容性：使用 any 类型来设置 cause
      (error as any).cause = cause;
    }
    return error;
  }

  /**
   * 创建设备相关错误
   */
  static createDeviceError(deviceId: string, operation: string, cause?: unknown): Error {
    return this.createAppError(
      `设备 ${deviceId} ${operation} 失败`,
      cause
    );
  }

  /**
   * 创建连接相关错误
   */
  static createConnectionError(message: string, cause?: unknown): Error {
    return this.createAppError(`连接错误: ${message}`, cause);
  }

  /**
   * 创建超时错误
   */
  static createTimeoutError(operation: string, timeoutMs: number): Error {
    return this.createAppError(`${operation} 超时 (${timeoutMs}ms)`);
  }

  /**
   * 创建验证错误
   */
  static createValidationError(field: string, reason: string): Error {
    return this.createAppError(`验证失败: ${field} ${reason}`);
  }

  /**
   * 判断是否为超时错误
   */
  static isTimeoutError(error: Error): boolean {
    return error.message.includes('超时') || 
           error.message.includes('timeout') ||
           error.name === 'TimeoutError';
  }

  /**
   * 判断是否为网络错误
   */
  static isNetworkError(error: Error): boolean {
    return error.message.includes('网络') ||
           error.message.includes('network') ||
           error.message.includes('连接') ||
           error.message.includes('connection');
  }

  /**
   * 判断是否为设备错误
   */
  static isDeviceError(error: Error): boolean {
    return error.message.includes('设备') ||
           error.message.includes('device') ||
           error.message.includes('离线') ||
           error.message.includes('offline');
  }

  /**
   * 安全地执行操作，捕获并转换错误
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    context: string = '操作'
  ): Promise<{ success: true; result: T } | { success: false; error: Error }> {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: this.handle(error, context) };
    }
  }

  /**
   * 带重试的安全执行
   */
  static async safeExecuteWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000,
    context: string = '操作'
  ): Promise<{ success: true; result: T } | { success: false; error: Error }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return { success: true, result };
      } catch (error) {
        lastError = this.handle(error, `${context} (尝试 ${attempt}/${maxRetries})`);
        
        if (attempt < maxRetries) {
          console.warn(`[ErrorHandler] ${context} 第 ${attempt} 次尝试失败，${retryDelay}ms 后重试:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    return { 
      success: false, 
      error: lastError || this.createAppError(`${context} 在 ${maxRetries} 次尝试后仍然失败`)
    };
  }

  /**
   * 记录错误（根据错误类型选择不同的日志级别）
   */
  static logError(error: Error, context?: string): void {
    const prefix = context ? `[${context}]` : '[ErrorHandler]';
    
    if (this.isTimeoutError(error)) {
      console.warn(`${prefix} 超时错误:`, error.message);
    } else if (this.isNetworkError(error)) {
      console.warn(`${prefix} 网络错误:`, error.message);
    } else if (this.isDeviceError(error)) {
      console.warn(`${prefix} 设备错误:`, error.message);
    } else {
      console.error(`${prefix} 未分类错误:`, error);
    }
  }
}