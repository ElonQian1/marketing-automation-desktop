/**
 * 统一错误处理系统
 * 
 * 为所有精准获客模块提供一致的错误处理机制，包括：
 * - 基础错误类体系
 * - 错误代码标准化
 * - 错误日志记录
 * - 错误恢复策略
 */

// ==================== 基础错误类型 ====================

export interface ErrorContext {
  module: string;
  operation: string;
  timestamp: Date;
  user_id?: string;
  device_id?: string;
  platform?: string;
  correlation_id?: string;
  additional_data?: Record<string, any>;
}

export interface ErrorRecoveryStrategy {
  recoverable: boolean;
  retry_count?: number;
  retry_delay_ms?: number;
  fallback_action?: string;
  user_message?: string;
}

// ==================== 基础错误类 ====================

/**
 * 精准获客系统基础错误类
 */
export abstract class PreciseAcquisitionError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly recovery: ErrorRecoveryStrategy;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    recovery: ErrorRecoveryStrategy = { recoverable: false },
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.recovery = recovery;
    this.severity = severity;
    this.timestamp = new Date();

    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    return this.recovery.user_message || this.message;
  }

  /**
   * 获取完整的错误信息用于日志记录
   */
  getLogMessage(): string {
    return JSON.stringify({
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      recovery: this.recovery,
      timestamp: this.timestamp.toISOString()
    }, null, 2);
  }

  /**
   * 检查错误是否可恢复
   */
  isRecoverable(): boolean {
    return this.recovery.recoverable;
  }

  /**
   * 获取重试配置
   */
  getRetryConfig(): { count: number; delay: number } | null {
    if (!this.recovery.recoverable || !this.recovery.retry_count) {
      return null;
    }
    return {
      count: this.recovery.retry_count,
      delay: this.recovery.retry_delay_ms || 1000
    };
  }
}

// ==================== 业务错误类 ====================

/**
 * 配置错误
 */
export class ConfigurationError extends PreciseAcquisitionError {
  constructor(
    message: string,
    configField: string,
    context: Partial<ErrorContext>,
    expectedValue?: any,
    actualValue?: any
  ) {
    super(
      message,
      'CONFIG_ERROR',
      {
        module: 'configuration',
        operation: 'validate_config',
        timestamp: new Date(),
        additional_data: { configField, expectedValue, actualValue },
        ...context
      },
      {
        recoverable: true,
        user_message: `配置错误：${configField} 设置不正确，请检查配置文件`
      },
      'high'
    );
  }
}

/**
 * 验证错误
 */
export class ValidationError extends PreciseAcquisitionError {
  constructor(
    message: string,
    field: string,
    value: any,
    context: Partial<ErrorContext>,
    validationRule?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      {
        module: 'validation',
        operation: 'validate_input',
        timestamp: new Date(),
        additional_data: { field, value, validationRule },
        ...context
      },
      {
        recoverable: true,
        user_message: `输入验证失败：${field} 的值不符合要求`
      },
      'medium'
    );
  }
}

/**
 * 资源不足错误
 */
export class ResourceExhaustionError extends PreciseAcquisitionError {
  constructor(
    message: string,
    resourceType: string,
    context: Partial<ErrorContext>,
    currentUsage?: number,
    maxLimit?: number
  ) {
    super(
      message,
      'RESOURCE_EXHAUSTED',
      {
        module: 'resource_management',
        operation: 'allocate_resource',
        timestamp: new Date(),
        additional_data: { resourceType, currentUsage, maxLimit },
        ...context
      },
      {
        recoverable: true,
        retry_count: 3,
        retry_delay_ms: 5000,
        user_message: `系统资源不足：${resourceType}，请稍后重试`
      },
      'high'
    );
  }
}

/**
 * 网络通信错误
 */
export class NetworkError extends PreciseAcquisitionError {
  constructor(
    message: string,
    endpoint: string,
    context: Partial<ErrorContext>,
    statusCode?: number,
    responseBody?: string
  ) {
    super(
      message,
      'NETWORK_ERROR',
      {
        module: 'network',
        operation: 'api_request',
        timestamp: new Date(),
        additional_data: { endpoint, statusCode, responseBody },
        ...context
      },
      {
        recoverable: true,
        retry_count: 3,
        retry_delay_ms: 2000,
        user_message: '网络连接问题，正在重试...'
      },
      statusCode && statusCode >= 500 ? 'high' : 'medium'
    );
  }
}

/**
 * 认证/授权错误
 */
export class AuthenticationError extends PreciseAcquisitionError {
  constructor(
    message: string,
    authType: string,
    context: Partial<ErrorContext>,
    tokenExpired?: boolean
  ) {
    super(
      message,
      'AUTH_ERROR',
      {
        module: 'authentication',
        operation: 'authenticate',
        timestamp: new Date(),
        additional_data: { authType, tokenExpired },
        ...context
      },
      {
        recoverable: tokenExpired || false,
        user_message: tokenExpired ? '登录已过期，请重新登录' : '认证失败，请检查凭据'
      },
      'high'
    );
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessLogicError extends PreciseAcquisitionError {
  constructor(
    message: string,
    businessRule: string,
    context: Partial<ErrorContext>,
    violatedConstraint?: string
  ) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      {
        module: 'business_logic',
        operation: 'execute_business_rule',
        timestamp: new Date(),
        additional_data: { businessRule, violatedConstraint },
        ...context
      },
      {
        recoverable: false,
        user_message: `业务规则验证失败：${businessRule}`
      },
      'medium'
    );
  }
}

/**
 * 数据完整性错误
 */
export class DataIntegrityError extends PreciseAcquisitionError {
  constructor(
    message: string,
    dataType: string,
    context: Partial<ErrorContext>,
    corruptedFields?: string[]
  ) {
    super(
      message,
      'DATA_INTEGRITY_ERROR',
      {
        module: 'data_management',
        operation: 'validate_data_integrity',
        timestamp: new Date(),
        additional_data: { dataType, corruptedFields },
        ...context
      },
      {
        recoverable: false,
        user_message: '数据完整性检查失败，请联系系统管理员'
      },
      'critical'
    );
  }
}

/**
 * 外部依赖错误
 */
export class ExternalDependencyError extends PreciseAcquisitionError {
  constructor(
    message: string,
    dependencyName: string,
    context: Partial<ErrorContext>,
    dependencyVersion?: string
  ) {
    super(
      message,
      'EXTERNAL_DEPENDENCY_ERROR',
      {
        module: 'external_integration',
        operation: 'call_external_service',
        timestamp: new Date(),
        additional_data: { dependencyName, dependencyVersion },
        ...context
      },
      {
        recoverable: true,
        retry_count: 2,
        retry_delay_ms: 3000,
        fallback_action: 'use_alternative_service',
        user_message: '外部服务暂时不可用，正在尝试替代方案'
      },
      'high'
    );
  }
}

// ==================== 错误处理器 ====================

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: PreciseAcquisitionError) => void> = [];
  private retryMap: Map<string, { count: number; lastRetry: Date }> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handle(error: Error | PreciseAcquisitionError, context?: Partial<ErrorContext>): PreciseAcquisitionError {
    let structuredError: PreciseAcquisitionError;

    if (error instanceof PreciseAcquisitionError) {
      structuredError = error;
    } else {
      // 将普通错误转换为结构化错误
      structuredError = new BusinessLogicError(
        error.message,
        'unknown_error',
        {
          module: context?.module || 'unknown',
          operation: context?.operation || 'unknown',
          timestamp: new Date(),
          ...context
        }
      );
    }

    // 记录错误
    this.logError(structuredError);

    // 通知监听器
    this.notifyListeners(structuredError);

    // 处理重试逻辑
    this.handleRetry(structuredError);

    return structuredError;
  }

  /**
   * 添加错误监听器
   */
  addErrorListener(listener: (error: PreciseAcquisitionError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * 移除错误监听器
   */
  removeErrorListener(listener: (error: PreciseAcquisitionError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * 检查是否应该重试
   */
  shouldRetry(error: PreciseAcquisitionError): boolean {
    if (!error.isRecoverable()) return false;

    const retryConfig = error.getRetryConfig();
    if (!retryConfig) return false;

    const key = `${error.context.module}_${error.context.operation}_${error.code}`;
    const retryInfo = this.retryMap.get(key);

    if (!retryInfo) {
      this.retryMap.set(key, { count: 1, lastRetry: new Date() });
      return true;
    }

    if (retryInfo.count >= retryConfig.count) {
      return false;
    }

    const timeSinceLastRetry = Date.now() - retryInfo.lastRetry.getTime();
    if (timeSinceLastRetry >= retryConfig.delay) {
      retryInfo.count++;
      retryInfo.lastRetry = new Date();
      return true;
    }

    return false;
  }

  /**
   * 重置重试计数
   */
  resetRetryCount(error: PreciseAcquisitionError): void {
    const key = `${error.context.module}_${error.context.operation}_${error.code}`;
    this.retryMap.delete(key);
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total_errors: number;
    errors_by_severity: Record<string, number>;
    errors_by_module: Record<string, number>;
    recent_errors: PreciseAcquisitionError[];
  } {
    // 这里应该从实际的错误存储中获取统计信息
    // 暂时返回模拟数据
    return {
      total_errors: 0,
      errors_by_severity: {},
      errors_by_module: {},
      recent_errors: []
    };
  }

  // ==================== 私有方法 ====================

  private logError(error: PreciseAcquisitionError): void {
    // 根据严重性级别选择不同的日志级别
    switch (error.severity) {
      case 'critical':
        console.error(`[CRITICAL] ${error.getLogMessage()}`);
        break;
      case 'high':
        console.error(`[ERROR] ${error.getLogMessage()}`);
        break;
      case 'medium':
        console.warn(`[WARNING] ${error.getLogMessage()}`);
        break;
      case 'low':
        console.info(`[INFO] ${error.getLogMessage()}`);
        break;
    }

    // 这里可以集成实际的日志系统（如 Winston、Pino 等）
    // 也可以发送到远程日志服务
  }

  private notifyListeners(error: PreciseAcquisitionError): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    }
  }

  private handleRetry(error: PreciseAcquisitionError): void {
    if (this.shouldRetry(error)) {
      console.log(`[RETRY] Scheduling retry for error: ${error.code}`);
      // 这里可以实现实际的重试逻辑
    }
  }
}

// ==================== 工具函数 ====================

/**
 * 包装异步函数以提供统一错误处理
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Partial<ErrorContext>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const handler = ErrorHandler.getInstance();
      const structuredError = handler.handle(error as Error, context);
      throw structuredError;
    }
  };
}

/**
 * 包装同步函数以提供统一错误处理
 */
export function withSyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => R,
  context: Partial<ErrorContext>
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      const handler = ErrorHandler.getInstance();
      const structuredError = handler.handle(error as Error, context);
      throw structuredError;
    }
  };
}

/**
 * 创建错误上下文
 */
export function createErrorContext(
  module: string,
  operation: string,
  additionalData?: Record<string, any>
): ErrorContext {
  return {
    module,
    operation,
    timestamp: new Date(),
    additional_data: additionalData
  };
}

/**
 * 检查错误类型
 */
export function isRecoverableError(error: Error): boolean {
  return error instanceof PreciseAcquisitionError && error.isRecoverable();
}

/**
 * 获取错误的用户消息
 */
export function getUserErrorMessage(error: Error): string {
  if (error instanceof PreciseAcquisitionError) {
    return error.getUserMessage();
  }
  return '系统发生未知错误，请联系技术支持';
}

// ==================== 错误代码常量 ====================

export const ERROR_CODES = {
  // 配置相关
  CONFIG_MISSING: 'CONFIG_MISSING',
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_VALIDATION_FAILED: 'CONFIG_VALIDATION_FAILED',

  // 验证相关
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',

  // 资源相关
  INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // 网络相关
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_UNREACHABLE: 'NETWORK_UNREACHABLE',
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',

  // 认证相关
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',

  // 业务逻辑相关
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  WORKFLOW_STATE_INVALID: 'WORKFLOW_STATE_INVALID',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // 数据相关
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  DATA_INCONSISTENCY: 'DATA_INCONSISTENCY',
  DATA_VERSION_MISMATCH: 'DATA_VERSION_MISMATCH',

  // 外部依赖相关
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  THIRD_PARTY_INTEGRATION_FAILED: 'THIRD_PARTY_INTEGRATION_FAILED'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];