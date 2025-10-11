// src/application/services/rate-control/index.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 频控和去重系统统一导出
 * 
 * 提供完整的频率控制和去重功能，包括：
 * - 核心频控和去重系统
 * - 应用服务层封装
 * - 预设配置方案
 * - 监控统计功能
 * - 错误处理类
 */

// ==================== 核心系统 ====================
export {
  RateControlAndDeduplicationSystem,
  createRateControlAndDeduplicationSystem,
  getDefaultRateControlConfig,
  getDefaultDeduplicationConfig
} from './RateControlAndDeduplicationSystem';

// ==================== 应用服务 ====================
export {
  RateControlApplicationService,
  createRateControlApplicationService
} from './RateControlApplicationService';

// ==================== 类型定义 ====================
export type {
  RateControlConfig,
  DeduplicationConfig,
  RateControlState,
  DeduplicationEntry
} from './RateControlAndDeduplicationSystem';

export type {
  RateControlPreset,
  RateControlMetrics,
  DeviceRateControlSummary
} from './RateControlApplicationService';

// ==================== 错误类定义 ====================

/**
 * 频控系统基础错误
 */
export class RateControlError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RateControlError';
  }
}

/**
 * 频率限制错误
 */
export class RateLimitExceededError extends RateControlError {
  constructor(
    public readonly limit_type: 'hourly' | 'daily' | 'interval',
    public readonly current_count: number,
    public readonly limit: number,
    public readonly reset_time: Date,
    details?: Record<string, any>
  ) {
    super(
      `Rate limit exceeded: ${limit_type} limit of ${limit} reached (current: ${current_count})`,
      'RATE_LIMIT_EXCEEDED',
      details
    );
    this.name = 'RateLimitExceededError';
  }
}

/**
 * 熔断器错误
 */
export class CircuitBreakerOpenError extends RateControlError {
  constructor(
    public readonly device_id: string,
    public readonly platform: string,
    public readonly failure_count: number,
    public readonly recovery_time: Date,
    details?: Record<string, any>
  ) {
    super(
      `Circuit breaker is open for device ${device_id} on ${platform} (failures: ${failure_count})`,
      'CIRCUIT_BREAKER_OPEN',
      details
    );
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * 任务重复错误
 */
export class TaskDuplicateError extends RateControlError {
  constructor(
    public readonly fingerprint: string,
    public readonly match_type: 'exact' | 'fuzzy',
    public readonly similarity_score?: number,
    public readonly existing_entry_id?: string,
    details?: Record<string, any>
  ) {
    super(
      `Task is duplicate: ${match_type} match found${similarity_score ? ` (similarity: ${similarity_score})` : ''}`,
      'TASK_DUPLICATE',
      details
    );
    this.name = 'TaskDuplicateError';
  }
}

/**
 * 配置验证错误
 */
export class RateControlConfigError extends RateControlError {
  constructor(
    public readonly config_field: string,
    public readonly invalid_value: any,
    public readonly expected_format: string,
    details?: Record<string, any>
  ) {
    super(
      `Invalid rate control configuration: ${config_field} = ${invalid_value} (expected: ${expected_format})`,
      'CONFIG_INVALID',
      details
    );
    this.name = 'RateControlConfigError';
  }
}

// ==================== 工具函数 ====================

/**
 * 验证频控配置
 */
export function validateRateControlConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必需字段
  const requiredFields = ['hourly_limit', 'daily_limit', 'min_interval_ms', 'max_interval_ms'];
  for (const field of requiredFields) {
    if (typeof config[field] !== 'number' || config[field] < 0) {
      errors.push(`${field} must be a non-negative number`);
    }
  }

  // 检查间隔时间逻辑
  if (config.min_interval_ms >= config.max_interval_ms) {
    errors.push('min_interval_ms must be less than max_interval_ms');
  }

  // 检查抖动因子
  if (config.jitter_enabled && (config.jitter_factor < 0 || config.jitter_factor > 1)) {
    errors.push('jitter_factor must be between 0 and 1');
  }

  // 检查熔断器配置
  if (config.circuit_breaker_enabled) {
    if (!config.failure_threshold || config.failure_threshold < 1) {
      errors.push('failure_threshold must be at least 1');
    }
    if (!config.recovery_timeout_ms || config.recovery_timeout_ms < 1000) {
      errors.push('recovery_timeout_ms must be at least 1000ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证去重配置
 */
export function validateDeduplicationConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查去重范围
  const validScopes = ['device', 'account', 'global'];
  if (!validScopes.includes(config.scope)) {
    errors.push(`scope must be one of: ${validScopes.join(', ')}`);
  }

  // 检查时间窗口
  if (typeof config.time_window_hours !== 'number' || config.time_window_hours < 1) {
    errors.push('time_window_hours must be at least 1');
  }

  // 检查去重字段
  if (!Array.isArray(config.dedup_fields) || config.dedup_fields.length === 0) {
    errors.push('dedup_fields must be a non-empty array');
  }

  // 检查存储类型
  const validStorageTypes = ['memory', 'sqlite', 'redis'];
  if (!validStorageTypes.includes(config.storage_type)) {
    errors.push(`storage_type must be one of: ${validStorageTypes.join(', ')}`);
  }

  // 检查最大条目数
  if (typeof config.max_entries !== 'number' || config.max_entries < 100) {
    errors.push('max_entries must be at least 100');
  }

  // 检查模糊匹配配置
  if (config.fuzzy_matching?.enabled) {
    const threshold = config.fuzzy_matching.similarity_threshold;
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      errors.push('fuzzy_matching.similarity_threshold must be between 0 and 1');
    }

    const validAlgorithms = ['levenshtein', 'cosine', 'jaccard'];
    if (!validAlgorithms.includes(config.fuzzy_matching.algorithm)) {
      errors.push(`fuzzy_matching.algorithm must be one of: ${validAlgorithms.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 计算两个时间戳之间的人性化间隔描述
 */
export function formatWaitTime(waitTimeMs: number): string {
  if (waitTimeMs < 1000) {
    return `${Math.round(waitTimeMs)}ms`;
  } else if (waitTimeMs < 60000) {
    return `${Math.round(waitTimeMs / 1000)}s`;
  } else if (waitTimeMs < 3600000) {
    const minutes = Math.round(waitTimeMs / 60000);
    return `${minutes}min`;
  } else {
    const hours = Math.round(waitTimeMs / 3600000);
    const minutes = Math.round((waitTimeMs % 3600000) / 60000);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
}

/**
 * 生成频控系统状态报告
 */
export function generateStatusReport(
  metrics: import('./RateControlApplicationService').RateControlMetrics,
  deviceSummaries: import('./RateControlApplicationService').DeviceRateControlSummary[]
): string {
  const report = [];
  
  report.push('=== 频控系统状态报告 ===');
  report.push(`更新时间: ${metrics.last_updated.toLocaleString()}`);
  report.push(`系统健康度: ${(metrics.system_health_score * 100).toFixed(1)}%`);
  report.push('');
  
  report.push('📊 执行统计:');
  report.push(`  总请求数: ${metrics.total_requests}`);
  report.push(`  通过请求: ${metrics.accepted_requests}`);
  report.push(`  拒绝请求: ${metrics.rejected_requests}`);
  report.push(`  通过率: ${(metrics.acceptance_rate * 100).toFixed(1)}%`);
  report.push('');
  
  report.push('⏱️ 性能指标:');
  report.push(`  平均等待时间: ${formatWaitTime(metrics.average_wait_time_ms)}`);
  report.push(`  最大等待时间: ${formatWaitTime(metrics.max_wait_time_ms)}`);
  report.push(`  熔断器触发: ${metrics.circuit_breakers_triggered}次`);
  report.push('');
  
  report.push('🔄 去重统计:');
  report.push(`  重复检测: ${metrics.duplicate_detections}次`);
  report.push(`  精确匹配: ${metrics.exact_matches}次`);
  report.push(`  模糊匹配: ${metrics.fuzzy_matches}次`);
  report.push('');
  
  if (Object.keys(metrics.rejections_by_reason).length > 0) {
    report.push('❌ 拒绝原因分布:');
    for (const [reason, count] of Object.entries(metrics.rejections_by_reason)) {
      report.push(`  ${reason}: ${count}次`);
    }
    report.push('');
  }
  
  if (deviceSummaries.length > 0) {
    report.push('📱 设备状态摘要:');
    for (const summary of deviceSummaries) {
      const healthStatus = summary.is_healthy ? '✅ 健康' : '⚠️  异常';
      report.push(`  设备 ${summary.device_id}: ${healthStatus}`);
      report.push(`    今日执行: ${summary.total_daily_executions}次`);
      report.push(`    预估容量: ${summary.estimated_daily_capacity}次/天`);
      report.push(`    成功率(24h): ${(summary.success_rate_24h * 100).toFixed(1)}%`);
      if (summary.circuit_breakers_open > 0) {
        report.push(`    熔断器开启: ${summary.circuit_breakers_open}个`);
      }
    }
  }
  
  return report.join('\n');
}

// ==================== 常量定义 ====================

/**
 * 频控系统常量
 */
export const RATE_CONTROL_CONSTANTS = {
  // 默认限制
  DEFAULT_HOURLY_LIMIT: 50,
  DEFAULT_DAILY_LIMIT: 500,
  DEFAULT_MIN_INTERVAL_MS: 30000,  // 30秒
  DEFAULT_MAX_INTERVAL_MS: 300000, // 5分钟
  
  // 抖动配置
  DEFAULT_JITTER_FACTOR: 0.3,
  MAX_JITTER_FACTOR: 1.0,
  
  // 熔断器配置
  DEFAULT_FAILURE_THRESHOLD: 5,
  DEFAULT_RECOVERY_TIMEOUT_MS: 600000, // 10分钟
  MIN_RECOVERY_TIMEOUT_MS: 60000,      // 1分钟
  
  // 去重配置
  DEFAULT_TIME_WINDOW_HOURS: 24,
  DEFAULT_MAX_ENTRIES: 10000,
  DEFAULT_CLEANUP_INTERVAL_HOURS: 1,
  
  // 相似度阈值
  DEFAULT_SIMILARITY_THRESHOLD: 0.85,
  MIN_SIMILARITY_THRESHOLD: 0.5,
  MAX_SIMILARITY_THRESHOLD: 1.0,
  
  // 系统限制
  MAX_CONCURRENT_REQUESTS: 100,
  MAX_QUEUE_SIZE: 1000,
  MAX_DEVICE_STATES: 10000
} as const;