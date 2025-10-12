// src/application/services/reporting/index.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 日报和审计系统统一导出
 * 
 * 提供完整的日报生成和审计功能，包括：
 * - 统一日报服务（合并所有重复实现）
 * - 关注清单和回复清单导出
 * - 审计日志记录和查询
 * - 多格式报告导出（CSV/Excel）
 * - 数据统计和分析
 * - 系统监控和告警
 */

// ==================== 核心服务 ====================
export {
  UnifiedDailyReportService,
  unifiedDailyReportService,
  createDailyReportService,
  getDefaultDailyReportConfig
} from './UnifiedDailyReportService';

// ==================== 类型定义 ====================
export type {
  FollowListItem,
  ReplyListItem,
  UnifiedDailyReportConfig,
  UnifiedDailyReportResult,
  DailyReportStats
} from './UnifiedDailyReportService';

// ==================== 错误类定义 ====================

/**
 * 报告系统基础错误
 */
export class ReportingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ReportingError';
  }
}

/**
 * 报告生成错误
 */
export class ReportGenerationError extends ReportingError {
  constructor(
    public readonly report_date: Date,
    public readonly stage: 'data_collection' | 'data_validation' | 'export' | 'storage',
    cause?: Error,
    details?: Record<string, any>
  ) {
    super(
      `Failed to generate report for ${report_date.toDateString()} at stage: ${stage}`,
      'REPORT_GENERATION_FAILED',
      { ...details, original_error: cause?.message }
    );
    this.name = 'ReportGenerationError';
  }
}

/**
 * 数据完整性错误
 */
export class DataIntegrityError extends ReportingError {
  constructor(
    public readonly validation_failures: Array<{
      field: string;
      expected: any;
      actual: any;
      severity: 'warning' | 'error';
    }>,
    details?: Record<string, any>
  ) {
    super(
      `Data integrity validation failed: ${validation_failures.length} issues found`,
      'DATA_INTEGRITY_FAILED',
      details
    );
    this.name = 'DataIntegrityError';
  }
}

/**
 * 审计日志错误
 */
export class AuditLogError extends ReportingError {
  constructor(
    public readonly operation: 'create' | 'search' | 'delete' | 'export',
    cause?: Error,
    details?: Record<string, any>
  ) {
    super(
      `Audit log operation failed: ${operation}`,
      'AUDIT_LOG_FAILED',
      { ...details, original_error: cause?.message }
    );
    this.name = 'AuditLogError';
  }
}

/**
 * 报告导出错误
 */
export class ReportExportError extends ReportingError {
  constructor(
    public readonly format: string,
    public readonly report_id: string,
    cause?: Error,
    details?: Record<string, any>
  ) {
    super(
      `Failed to export report ${report_id} to ${format} format`,
      'REPORT_EXPORT_FAILED',
      { ...details, original_error: cause?.message }
    );
    this.name = 'ReportExportError';
  }
}

// ==================== 工具函数 ====================

/**
 * 验证报告配置
 */
export function validateReportConfiguration(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查生成配置
  if (!config.generation) {
    errors.push('Missing generation configuration');
  } else {
    if (!config.generation.generation_time || !/^\d{2}:\d{2}$/.test(config.generation.generation_time)) {
      errors.push('generation_time must be in HH:MM format');
    }
    
    if (!config.generation.timezone) {
      errors.push('timezone is required');
    }
  }

  // 检查内容配置
  if (!config.content) {
    errors.push('Missing content configuration');
  } else {
    if (typeof config.content.max_error_entries !== 'number' || config.content.max_error_entries < 1) {
      errors.push('max_error_entries must be a positive number');
    }
  }

  // 检查输出配置
  if (!config.output) {
    errors.push('Missing output configuration');
  } else {
    if (!Array.isArray(config.output.formats) || config.output.formats.length === 0) {
      errors.push('output.formats must be a non-empty array');
    }
    
    const validFormats = ['json', 'html', 'pdf', 'csv'];
    const invalidFormats = config.output.formats.filter((f: string) => !validFormats.includes(f));
    if (invalidFormats.length > 0) {
      errors.push(`Invalid output formats: ${invalidFormats.join(', ')}`);
    }
    
    if (!config.output.storage_location) {
      errors.push('storage_location is required');
    }
  }

  // 检查保留策略
  if (!config.retention) {
    errors.push('Missing retention configuration');
  } else {
    if (typeof config.retention.keep_days !== 'number' || config.retention.keep_days < 1) {
      errors.push('keep_days must be at least 1');
    }
    
    if (typeof config.retention.archive_after_days !== 'number' || config.retention.archive_after_days < config.retention.keep_days) {
      errors.push('archive_after_days must be greater than or equal to keep_days');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 格式化报告大小
 */
export function formatReportSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * 计算时间段
 */
export function calculateTimePeriod(startTime: Date, endTime: Date): {
  duration_ms: number;
  duration_hours: number;
  duration_days: number;
  human_readable: string;
} {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const durationDays = durationHours / 24;

  let humanReadable: string;
  if (durationDays >= 1) {
    const days = Math.floor(durationDays);
    const hours = Math.floor(durationHours % 24);
    humanReadable = hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  } else if (durationHours >= 1) {
    const hours = Math.floor(durationHours);
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    humanReadable = minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  } else {
    const minutes = Math.floor(durationMs / (1000 * 60));
    humanReadable = `${minutes}分钟`;
  }

  return {
    duration_ms: durationMs,
    duration_hours: durationHours,
    duration_days: durationDays,
    human_readable: humanReadable
  };
}

/**
 * 生成报告摘要
 */
export function generateReportSummary(reportData: import('./DailyReportingAndAuditService').DailyReportData): {
  key_metrics: Record<string, string | number>;
  health_status: 'excellent' | 'good' | 'warning' | 'critical';
  summary_text: string;
  action_required: boolean;
} {
  const keyMetrics = {
    '总任务数': reportData.execution_summary.total_tasks,
    '成功率': `${(reportData.execution_summary.success_rate * 100).toFixed(1)}%`,
    '评论采集': reportData.comment_collection_stats.comments_collected,
    '错误数量': reportData.error_analysis.total_errors,
    '合规分数': `${(reportData.compliance_check.rate_limit_compliance.compliance_score * 100).toFixed(1)}%`,
    '数据质量': `${(reportData.data_integrity.data_quality_score * 100).toFixed(1)}%`
  };

  // 计算健康状态
  let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
  let actionRequired = false;

  if (reportData.execution_summary.success_rate < 0.8 || 
      reportData.error_analysis.critical_errors.length > 5 ||
      reportData.compliance_check.rate_limit_compliance.compliance_score < 0.8) {
    healthStatus = 'critical';
    actionRequired = true;
  } else if (reportData.execution_summary.success_rate < 0.9 || 
             reportData.error_analysis.total_errors > 50 ||
             reportData.compliance_check.rate_limit_compliance.compliance_score < 0.9) {
    healthStatus = 'warning';
    actionRequired = true;
  } else if (reportData.execution_summary.success_rate < 0.95 || 
             reportData.error_analysis.total_errors > 20) {
    healthStatus = 'good';
  }

  // 生成摘要文本
  const summaryParts = [];
  summaryParts.push(`系统在${reportData.report_date}执行了${reportData.execution_summary.total_tasks}个任务`);
  summaryParts.push(`成功率为${(reportData.execution_summary.success_rate * 100).toFixed(1)}%`);
  summaryParts.push(`采集评论${reportData.comment_collection_stats.comments_collected}条`);
  
  if (reportData.error_analysis.critical_errors.length > 0) {
    summaryParts.push(`检测到${reportData.error_analysis.critical_errors.length}个关键错误需要关注`);
  }
  
  if (reportData.recommendations.length > 0) {
    const highPriorityRecs = reportData.recommendations.filter(r => r.priority === 'high');
    if (highPriorityRecs.length > 0) {
      summaryParts.push(`有${highPriorityRecs.length}项高优先级建议待处理`);
    }
  }

  return {
    key_metrics: keyMetrics,
    health_status: healthStatus,
    summary_text: summaryParts.join('，') + '。',
    action_required: actionRequired
  };
}

/**
 * 创建审计日志查询构建器
 */
export class AuditLogQueryBuilder {
  private criteria: {
    start_time?: Date;
    end_time?: Date;
    event_type?: import('./DailyReportingAndAuditService').AuditLogEntry['event_type'];
    severity?: import('./DailyReportingAndAuditService').AuditLogEntry['severity'];
    device_id?: string;
    platform?: import('../../../constants/precise-acquisition-enums').Platform;
    text_search?: string;
    limit?: number;
  } = {};

  /**
   * 设置时间范围
   */
  timeRange(startTime: Date, endTime: Date): this {
    this.criteria.start_time = startTime;
    this.criteria.end_time = endTime;
    return this;
  }

  /**
   * 设置最近N小时
   */
  lastHours(hours: number): this {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    return this.timeRange(startTime, endTime);
  }

  /**
   * 设置今天
   */
  today(): this {
    const today = new Date();
    const startTime = new Date(today);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(today);
    endTime.setHours(23, 59, 59, 999);
    return this.timeRange(startTime, endTime);
  }

  /**
   * 设置事件类型
   */
  eventType(type: import('./DailyReportingAndAuditService').AuditLogEntry['event_type']): this {
    this.criteria.event_type = type;
    return this;
  }

  /**
   * 设置严重性
   */
  severity(level: import('./DailyReportingAndAuditService').AuditLogEntry['severity']): this {
    this.criteria.severity = level;
    return this;
  }

  /**
   * 设置设备ID
   */
  device(deviceId: string): this {
    this.criteria.device_id = deviceId;
    return this;
  }

  /**
   * 设置平台
   */
  platform(platform: import('../../../constants/precise-acquisition-enums').Platform): this {
    this.criteria.platform = platform;
    return this;
  }

  /**
   * 设置文本搜索
   */
  search(text: string): this {
    this.criteria.text_search = text;
    return this;
  }

  /**
   * 设置结果限制
   */
  limit(count: number): this {
    this.criteria.limit = count;
    return this;
  }

  /**
   * 构建查询条件
   */
  build() {
    return { ...this.criteria };
  }
}

/**
 * 创建审计日志查询构建器
 */
export function createAuditLogQuery(): AuditLogQueryBuilder {
  return new AuditLogQueryBuilder();
}

// ==================== 常量定义 ====================

/**
 * 报告系统常量
 */
export const REPORTING_CONSTANTS = {
  // 默认配置
  DEFAULT_GENERATION_TIME: '02:00',
  DEFAULT_TIMEZONE: 'Asia/Shanghai',
  DEFAULT_KEEP_DAYS: 30,
  DEFAULT_ARCHIVE_DAYS: 90,
  DEFAULT_MAX_ERROR_ENTRIES: 50,
  
  // 文件大小限制
  MAX_REPORT_SIZE_MB: 100,
  MAX_AUDIT_LOG_ENTRIES: 10000,
  MAX_ATTACHMENT_SIZE_MB: 10,
  
  // 健康度阈值
  HEALTH_EXCELLENT_THRESHOLD: 0.95,
  HEALTH_GOOD_THRESHOLD: 0.90,
  HEALTH_WARNING_THRESHOLD: 0.80,
  
  // 合规阈值
  COMPLIANCE_GOOD_THRESHOLD: 0.95,
  COMPLIANCE_WARNING_THRESHOLD: 0.85,
  COMPLIANCE_CRITICAL_THRESHOLD: 0.70,
  
  // 性能阈值
  SLOW_QUERY_THRESHOLD_MS: 1000,
  HIGH_CPU_THRESHOLD: 80,
  HIGH_MEMORY_THRESHOLD_MB: 512,
  
  // 错误分类
  ERROR_CATEGORIES: {
    API_LIMIT: 'API限制',
    NETWORK_TIMEOUT: '网络超时',
    AUTH_FAILURE: '认证失败',
    DATA_FORMAT: '数据格式错误',
    SYSTEM_ERROR: '系统异常',
    COMPLIANCE_VIOLATION: '合规违规',
    RESOURCE_EXHAUSTION: '资源耗尽'
  },
  
  // 支持的导出格式
  SUPPORTED_EXPORT_FORMATS: ['json', 'html', 'pdf', 'csv'] as const,
  
  // 审计日志事件类型
  AUDIT_EVENT_TYPES: [
    'task_execution',
    'api_call',
    'config_change',
    'error',
    'compliance_check',
    'user_action'
  ] as const,
  
  // 严重性级别
  SEVERITY_LEVELS: ['info', 'warning', 'error', 'critical'] as const
} as const;

/**
 * 报告模板
 */
export const REPORT_TEMPLATES = {
  // 简化版模板（适用于日常监控）
  SIMPLIFIED: {
    include_device_details: false,
    include_error_stack_traces: false,
    include_sensitive_data: false,
    max_error_entries: 10,
    chart_generation: false
  },
  
  // 详细版模板（适用于深度分析）
  DETAILED: {
    include_device_details: true,
    include_error_stack_traces: true,
    include_sensitive_data: false,
    max_error_entries: 100,
    chart_generation: true
  },
  
  // 合规版模板（适用于审计要求）
  COMPLIANCE: {
    include_device_details: true,
    include_error_stack_traces: true,
    include_sensitive_data: true,
    max_error_entries: 200,
    chart_generation: true
  }
} as const;