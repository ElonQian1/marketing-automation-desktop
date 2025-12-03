// src/modules/precise-acquisition/audit-system/services/prospecting-audit-service.ts
// module: prospecting | layer: services | role: audit-engine
// summary: 审计系统服务

/**
 * 审计系统服务
 * 
 * 实现全链路操作日志记录系统，支持可追溯的审计功能：
 * 1. 操作日志记录：详细记录所有操作和参数
 * 2. 错误追踪：记录异常信息和调用栈
 * 3. 性能监控：监控关键操作的性能指标
 * 4. 合规审计：支持数据合规和隐私保护要求
 */

import { invoke } from '@tauri-apps/api/core';
import { Platform, TaskType, TaskStatus, ResultCode } from '../../shared/types/core';

/**
 * 审计日志级别
 */
export enum AuditLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 审计事件类型
 */
export enum AuditEventType {
  // 用户操作
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_ACTION = 'user_action',
  
  // 系统操作
  SYSTEM_START = 'system_start',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  CONFIG_CHANGE = 'config_change',
  
  // 业务操作
  TASK_CREATE = 'task_create',
  TASK_EXECUTE = 'task_execute',
  TASK_COMPLETE = 'task_complete',
  TASK_FAIL = 'task_fail',
  
  // 数据操作
  DATA_IMPORT = 'data_import',
  DATA_EXPORT = 'data_export',
  DATA_DELETE = 'data_delete',
  DATA_QUERY = 'data_query',
  
  // 网络操作
  API_CALL = 'api_call',
  HTTP_REQUEST = 'http_request',
  NETWORK_ERROR = 'network_error',
  
  // 安全事件
  AUTH_FAILURE = 'auth_failure',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  
  // 性能事件
  PERFORMANCE_SLOW = 'performance_slow',
  MEMORY_HIGH = 'memory_high',
  CPU_HIGH = 'cpu_high',
  
  // 合规事件
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_RETENTION_CLEANUP = 'data_retention_cleanup',
  PRIVACY_SETTING_CHANGE = 'privacy_setting_change'
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  level: AuditLogLevel;
  event_type: AuditEventType;
  user_id?: string;
  session_id?: string;
  device_id: string;
  
  // 操作相关
  operation: string;
  resource_type?: string;
  resource_id?: string;
  
  // 请求信息
  request_id?: string;
  correlation_id?: string;
  
  // 业务数据
  platform?: Platform;
  task_type?: TaskType;
  task_status?: TaskStatus;
  result_code?: ResultCode;
  
  // 详细信息
  message: string;
  details?: Record<string, any>;
  
  // 错误信息
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
  
  // 性能指标
  duration_ms?: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  
  // 网络信息
  ip_address?: string;
  user_agent?: string;
  
  // 合规信息
  data_sensitivity_level?: 'public' | 'internal' | 'confidential' | 'restricted';
  retention_policy?: string;
  privacy_flags?: string[];
  
  // 上下文信息
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * 审计查询条件
 */
export interface AuditQuery {
  start_time?: Date;
  end_time?: Date;
  levels?: AuditLogLevel[];
  event_types?: AuditEventType[];
  user_id?: string;
  session_id?: string;
  platform?: Platform;
  operation?: string;
  resource_type?: string;
  resource_id?: string;
  error_code?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * 审计统计信息
 */
export interface AuditStats {
  total_entries: number;
  entries_by_level: Record<AuditLogLevel, number>;
  entries_by_event_type: Record<AuditEventType, number>;
  error_rate: number;
  avg_response_time_ms: number;
  peak_memory_usage_mb: number;
  top_operations: Array<{
    operation: string;
    count: number;
    avg_duration_ms: number;
    error_rate: number;
  }>;
  recent_errors: AuditLogEntry[];
  performance_alerts: Array<{
    type: 'slow_operation' | 'high_memory' | 'high_cpu';
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  operation: string;
  start_time: number;
  end_time?: number;
  memory_start_mb?: number;
  memory_end_mb?: number;
  cpu_start_percent?: number;
  cpu_end_percent?: number;
  custom_metrics?: Record<string, number>;
}

/**
 * 审计系统服务
 */
export class AuditService {
  
  private deviceId: string = '';
  private sessionId: string = '';
  private userId?: string;
  
  // 性能监控映射
  private performanceTracking: Map<string, PerformanceMetrics> = new Map();
  
  // 批量日志缓存
  private logBuffer: AuditLogEntry[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000;
  
  constructor() {
    this.initializeAuditSystem();
    this.startPeriodicFlush();
  }
  
  /**
   * 初始化审计系统
   */
  private async initializeAuditSystem(): Promise<void> {
    try {
      this.deviceId = await invoke('plugin:prospecting|get_device_id');
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 记录系统启动事件
      await this.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.SYSTEM_START,
        operation: 'audit_system_init',
        message: '审计系统初始化完成',
        details: {
          device_id: this.deviceId,
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('审计系统初始化失败:', error);
      this.deviceId = `device_${Date.now()}`;
      this.sessionId = `session_${Date.now()}`;
    }
  }
  
  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    this.logEvent({
      level: AuditLogLevel.INFO,
      event_type: AuditEventType.USER_LOGIN,
      operation: 'user_auth',
      message: '用户登录',
      details: { previous_user: this.userId, new_user: userId }
    });
  }
  
  /**
   * 记录审计事件
   */
  async logEvent(event: Partial<AuditLogEntry>): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: event.level || AuditLogLevel.INFO,
      event_type: event.event_type || AuditEventType.USER_ACTION,
      user_id: this.userId,
      session_id: this.sessionId,
      device_id: this.deviceId,
      operation: event.operation || 'unknown',
      message: event.message || '',
      ...event
    };
    
    // 添加上下文信息
    if (!logEntry.tags) {
      logEntry.tags = [];
    }
    logEntry.tags.push(`device:${this.deviceId}`);
    if (this.userId) {
      logEntry.tags.push(`user:${this.userId}`);
    }
    logEntry.tags.push(`session:${this.sessionId}`);
    
    // 添加到批量缓存
    this.logBuffer.push(logEntry);
    
    // 如果是错误或关键事件，立即刷新
    if (logEntry.level === AuditLogLevel.ERROR || logEntry.level === AuditLogLevel.CRITICAL) {
      await this.flushLogs();
    } else if (this.logBuffer.length >= this.BATCH_SIZE) {
      await this.flushLogs();
    }
  }
  
  /**
   * 记录任务相关事件
   */
  async logTaskEvent(
    eventType: AuditEventType,
    taskId: string,
    platform: Platform,
    taskType: TaskType,
    status?: TaskStatus,
    resultCode?: ResultCode,
    details?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    
    await this.logEvent({
      level: status === TaskStatus.FAILED ? AuditLogLevel.ERROR : AuditLogLevel.INFO,
      event_type: eventType,
      operation: 'task_management',
      resource_type: 'task',
      resource_id: taskId,
      platform,
      task_type: taskType,
      task_status: status,
      result_code: resultCode,
      message: `任务${eventType === AuditEventType.TASK_CREATE ? '创建' : 
                      eventType === AuditEventType.TASK_EXECUTE ? '执行' :
                      eventType === AuditEventType.TASK_COMPLETE ? '完成' : '失败'}`,
      details: {
        task_id: taskId,
        platform,
        task_type: taskType,
        status,
        result_code: resultCode,
        ...details
      },
      error_message: error?.message,
      stack_trace: error?.stack,
      tags: [`task:${taskType}`, `platform:${platform}`]
    });
  }
  
  /**
   * 记录API调用事件
   */
  async logApiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestSize?: number,
    responseSize?: number,
    error?: Error
  ): Promise<void> {
    
    await this.logEvent({
      level: statusCode >= 400 ? AuditLogLevel.ERROR : AuditLogLevel.INFO,
      event_type: AuditEventType.API_CALL,
      operation: 'api_request',
      message: `API调用: ${method} ${url}`,
      duration_ms: duration,
      details: {
        method,
        url,
        status_code: statusCode,
        request_size_bytes: requestSize,
        response_size_bytes: responseSize,
        success: statusCode < 400
      },
      error_message: error?.message,
      stack_trace: error?.stack,
      tags: [`api:${method.toLowerCase()}`, `status:${Math.floor(statusCode / 100)}xx`]
    });
  }
  
  /**
   * 记录数据操作事件
   */
  async logDataOperation(
    operation: 'create' | 'read' | 'update' | 'delete' | 'import' | 'export',
    resourceType: string,
    resourceId?: string,
    recordCount?: number,
    sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted',
    details?: Record<string, any>
  ): Promise<void> {
    
    const eventTypeMap = {
      'import': AuditEventType.DATA_IMPORT,
      'export': AuditEventType.DATA_EXPORT,
      'delete': AuditEventType.DATA_DELETE,
      'create': AuditEventType.DATA_QUERY,
      'read': AuditEventType.DATA_QUERY,
      'update': AuditEventType.DATA_QUERY
    };
    
    await this.logEvent({
      level: operation === 'delete' ? AuditLogLevel.WARN : AuditLogLevel.INFO,
      event_type: eventTypeMap[operation],
      operation: `data_${operation}`,
      resource_type: resourceType,
      resource_id: resourceId,
      message: `数据${operation}: ${resourceType}${resourceId ? ` (${resourceId})` : ''}`,
      data_sensitivity_level: sensitivityLevel,
      details: {
        operation,
        resource_type: resourceType,
        resource_id: resourceId,
        record_count: recordCount,
        sensitivity_level: sensitivityLevel,
        ...details
      },
      tags: [`data:${operation}`, `resource:${resourceType}`]
    });
  }
  
  /**
   * 开始性能监控
   */
  startPerformanceMonitoring(operation: string, correlationId?: string): string {
    const trackingId = correlationId || `perf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const metrics: PerformanceMetrics = {
      operation,
      start_time: performance.now()
    };
    
    // 获取内存使用情况
    if (typeof (performance as any).memory !== 'undefined') {
      metrics.memory_start_mb = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    
    this.performanceTracking.set(trackingId, metrics);
    
    return trackingId;
  }
  
  /**
   * 结束性能监控
   */
  async endPerformanceMonitoring(
    trackingId: string, 
    success: boolean = true, 
    error?: Error,
    customMetrics?: Record<string, number>
  ): Promise<void> {
    
    const metrics = this.performanceTracking.get(trackingId);
    if (!metrics) {
      console.warn(`性能监控 ${trackingId} 不存在`);
      return;
    }
    
    metrics.end_time = performance.now();
    const duration = metrics.end_time - metrics.start_time;
    
    // 获取结束时的内存使用情况
    if (typeof (performance as any).memory !== 'undefined') {
      metrics.memory_end_mb = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    
    if (customMetrics) {
      metrics.custom_metrics = customMetrics;
    }
    
    // 判断是否为慢操作
    const isSlowOperation = duration > 5000; // 5秒以上
    const isHighMemoryUsage = metrics.memory_end_mb && metrics.memory_start_mb && 
                               (metrics.memory_end_mb - metrics.memory_start_mb) > 100; // 100MB以上
    
    await this.logEvent({
      level: error ? AuditLogLevel.ERROR : isSlowOperation ? AuditLogLevel.WARN : AuditLogLevel.INFO,
      event_type: isSlowOperation ? AuditEventType.PERFORMANCE_SLOW : AuditEventType.USER_ACTION,
      operation: metrics.operation,
      correlation_id: trackingId,
      message: `操作性能监控: ${metrics.operation}`,
      duration_ms: Math.round(duration),
      memory_usage_mb: metrics.memory_end_mb ? Math.round(metrics.memory_end_mb - (metrics.memory_start_mb || 0)) : undefined,
      details: {
        success,
        is_slow_operation: isSlowOperation,
        is_high_memory_usage: isHighMemoryUsage,
        performance_metrics: metrics,
        custom_metrics: customMetrics
      },
      error_message: error?.message,
      stack_trace: error?.stack,
      tags: [`performance:${metrics.operation}`, success ? 'success' : 'failure']
    });
    
    this.performanceTracking.delete(trackingId);
  }
  
  /**
   * 记录安全事件
   */
  async logSecurityEvent(
    eventType: AuditEventType.AUTH_FAILURE | AuditEventType.PERMISSION_DENIED | AuditEventType.SUSPICIOUS_ACTIVITY,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): Promise<void> {
    
    const levelMap = {
      'low': AuditLogLevel.INFO,
      'medium': AuditLogLevel.WARN,
      'high': AuditLogLevel.ERROR,
      'critical': AuditLogLevel.CRITICAL
    };
    
    await this.logEvent({
      level: levelMap[severity],
      event_type: eventType,
      operation: 'security_check',
      message: `安全事件: ${message}`,
      details: {
        severity,
        security_event_type: eventType,
        ...details
      },
      tags: ['security', `severity:${severity}`]
    });
  }
  
  /**
   * 查询审计日志
   */
  async queryLogs(query: AuditQuery): Promise<{
    entries: AuditLogEntry[];
    total: number;
    has_more: boolean;
  }> {
    
    try {
      const result = await invoke('plugin:prospecting|query_audit_logs', {
        query: {
          ...query,
          start_time: query.start_time?.toISOString(),
          end_time: query.end_time?.toISOString()
        }
      }) as {
        entries: any[];
        total: number;
        has_more: boolean;
      };
      
      return {
        entries: result.entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })),
        total: result.total,
        has_more: result.has_more
      };
      
    } catch (error) {
      console.error('查询审计日志失败:', error);
      return { entries: [], total: 0, has_more: false };
    }
  }
  
  /**
   * 获取审计统计
   */
  async getStats(
    startTime?: Date, 
    endTime?: Date
  ): Promise<AuditStats> {
    
    try {
      const stats = await invoke('plugin:prospecting|get_audit_stats', {
        start_time: startTime?.toISOString(),
        end_time: endTime?.toISOString()
      }) as AuditStats & { recent_errors: any[] };
      
      return {
        ...stats,
        recent_errors: stats.recent_errors?.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })) || []
      };
      
    } catch (error) {
      console.error('获取审计统计失败:', error);
      return {
        total_entries: 0,
        entries_by_level: {} as any,
        entries_by_event_type: {} as any,
        error_rate: 0,
        avg_response_time_ms: 0,
        peak_memory_usage_mb: 0,
        top_operations: [],
        recent_errors: [],
        performance_alerts: []
      };
    }
  }
  
  /**
   * 导出审计日志
   */
  async exportLogs(
    query: AuditQuery, 
    format: 'json' | 'csv' | 'excel' = 'json'
  ): Promise<string> {
    
    try {
      const filePath = await invoke('plugin:prospecting|export_audit_logs', {
        query: {
          ...query,
          start_time: query.start_time?.toISOString(),
          end_time: query.end_time?.toISOString()
        },
        format
      }) as string;
      
      await this.logDataOperation(
        'export',
        'audit_logs',
        undefined,
        undefined,
        'internal',
        { query, format }
      );
      
      return filePath;
      
    } catch (error) {
      await this.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.DATA_EXPORT,
        operation: 'export_audit_logs',
        message: '审计日志导出失败',
        error_message: error instanceof Error ? error.message : String(error),
        details: { query, format }
      });
      
      throw error;
    }
  }
  
  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(retentionDays: number): Promise<number> {
    try {
      const deletedCount = await invoke('plugin:prospecting|cleanup_expired_audit_logs', {
        retention_days: retentionDays
      }) as number;
      
      await this.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.DATA_RETENTION_CLEANUP,
        operation: 'cleanup_expired_logs',
        message: `清理过期审计日志完成，删除 ${deletedCount} 条记录`,
        details: {
          retention_days: retentionDays,
          deleted_count: deletedCount
        }
      });
      
      return deletedCount;
      
    } catch (error) {
      await this.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.DATA_RETENTION_CLEANUP,
        operation: 'cleanup_expired_logs',
        message: '清理过期审计日志失败',
        error_message: error instanceof Error ? error.message : String(error),
        details: { retention_days: retentionDays }
      });
      
      throw error;
    }
  }
  
  /**
   * 定期刷新日志缓存
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushLogs().catch(error => {
          console.error('定期刷新审计日志失败:', error);
        });
      }
    }, this.FLUSH_INTERVAL_MS);
  }
  
  /**
   * 刷新日志缓存
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer.length = 0;
    
    try {
      await invoke('plugin:prospecting|batch_store_audit_logs', {
        logs: logsToFlush.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString()
        }))
      });
      
    } catch (error) {
      console.error('刷新审计日志失败:', error);
      // 将失败的日志重新加入缓存
      this.logBuffer.unshift(...logsToFlush);
    }
  }
  
  /**
   * 系统关闭时的清理
   */
  async shutdown(): Promise<void> {
    // 刷新剩余的日志
    await this.flushLogs();
    
    // 记录系统关闭事件
    await this.logEvent({
      level: AuditLogLevel.INFO,
      event_type: AuditEventType.SYSTEM_SHUTDOWN,
      operation: 'audit_system_shutdown',
      message: '审计系统关闭'
    });
    
    // 最后一次刷新
    await this.flushLogs();
  }
}