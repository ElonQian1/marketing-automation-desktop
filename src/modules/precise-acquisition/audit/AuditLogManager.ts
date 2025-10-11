// src/modules/precise-acquisition/audit/AuditLogManager.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客系统 - 审计日志系统
 * 
 * 记录全链路操作日志，支持合规审查和问题追踪
 */

import { 
  WatchTarget,
  Comment,
  Task 
} from '../../../modules/precise-acquisition/shared/types/core';
import { 
  Platform,
  TaskType,
  TaskStatus 
} from '../../../modules/precise-acquisition/shared/constants';

// ==================== 审计日志类型 ====================

/**
 * 审计日志级别
 */
export enum AuditLogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 审计日志分类
 */
export enum AuditLogCategory {
  CANDIDATE_POOL = 'candidate_pool',      // 候选池操作
  COMMENT_COLLECTION = 'comment_collection', // 评论采集
  COMMENT_FILTERING = 'comment_filtering',   // 评论筛选
  TASK_GENERATION = 'task_generation',       // 任务生成
  TASK_EXECUTION = 'task_execution',         // 任务执行
  TEMPLATE_MANAGEMENT = 'template_management', // 模板管理
  SYSTEM_CONFIG = 'system_config',           // 系统配置
  USER_ACTION = 'user_action',               // 用户操作
  API_CALL = 'api_call',                     // API调用
  DATA_EXPORT = 'data_export'                // 数据导出
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  level: AuditLogLevel;
  category: AuditLogCategory;
  action: string;                           // 操作名称
  description: string;                      // 详细描述
  user_id?: string;                         // 操作用户
  session_id?: string;                      // 会话ID
  platform?: Platform;                     // 相关平台
  target_id?: string;                       // 目标对象ID
  target_type?: string;                     // 目标对象类型
  metadata?: {                              // 元数据
    [key: string]: any;
  };
  context?: {                               // 上下文信息
    ip_address?: string;
    user_agent?: string;
    request_id?: string;
    correlation_id?: string;
  };
  result?: {                                // 操作结果
    success: boolean;
    error_code?: string;
    error_message?: string;
    duration_ms?: number;
  };
  compliance_flags?: string[];              // 合规标记
  sensitive_data_accessed?: boolean;        // 是否访问敏感数据
}

/**
 * 审计查询条件
 */
export interface AuditQueryParams {
  start_time?: Date;
  end_time?: Date;
  levels?: AuditLogLevel[];
  categories?: AuditLogCategory[];
  user_id?: string;
  platform?: Platform;
  target_id?: string;
  actions?: string[];
  success_only?: boolean;
  error_only?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: 'timestamp' | 'level' | 'category';
  sort_order?: 'asc' | 'desc';
}

/**
 * 审计查询结果
 */
export interface AuditQueryResult {
  logs: AuditLogEntry[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
  aggregations?: {
    by_level: { [key in AuditLogLevel]: number };
    by_category: { [key in AuditLogCategory]: number };
    by_platform: { [key in Platform]: number };
    error_rate: number;
    avg_duration_ms: number;
  };
}

// ==================== 审计日志管理器 ====================

/**
 * 审计日志管理器
 */
export class AuditLogManager {
  private logs: AuditLogEntry[];
  private maxLogSize: number;
  private enabledCategories: Set<AuditLogCategory>;
  private sessionId: string;
  
  constructor(maxLogSize: number = 10000) {
    this.logs = [];
    this.maxLogSize = maxLogSize;
    this.enabledCategories = new Set(Object.values(AuditLogCategory));
    this.sessionId = this.generateSessionId();
  }
  
  /**
   * 记录审计日志
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'session_id'>): void {
    if (!this.enabledCategories.has(entry.category)) {
      return;
    }
    
    const logEntry: AuditLogEntry = {
      ...entry,
      id: this.generateLogId(),
      timestamp: new Date(),
      session_id: this.sessionId
    };
    
    this.logs.push(logEntry);
    
    // 保持日志大小限制
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }
    
    // 输出到控制台（可选）
    if (entry.level === AuditLogLevel.ERROR || entry.level === AuditLogLevel.CRITICAL) {
      console.error('[AUDIT]', logEntry);
    } else if (entry.level === AuditLogLevel.WARN) {
      console.warn('[AUDIT]', logEntry);
    } else {
      console.log('[AUDIT]', logEntry);
    }
  }
  
  /**
   * 查询审计日志
   */
  query(params: AuditQueryParams = {}): AuditQueryResult {
    let filteredLogs = this.logs;
    
    // 时间过滤
    if (params.start_time) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= params.start_time!);
    }
    if (params.end_time) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= params.end_time!);
    }
    
    // 级别过滤
    if (params.levels && params.levels.length > 0) {
      filteredLogs = filteredLogs.filter(log => params.levels!.includes(log.level));
    }
    
    // 分类过滤
    if (params.categories && params.categories.length > 0) {
      filteredLogs = filteredLogs.filter(log => params.categories!.includes(log.category));
    }
    
    // 用户过滤
    if (params.user_id) {
      filteredLogs = filteredLogs.filter(log => log.user_id === params.user_id);
    }
    
    // 平台过滤
    if (params.platform) {
      filteredLogs = filteredLogs.filter(log => log.platform === params.platform);
    }
    
    // 目标ID过滤
    if (params.target_id) {
      filteredLogs = filteredLogs.filter(log => log.target_id === params.target_id);
    }
    
    // 操作过滤
    if (params.actions && params.actions.length > 0) {
      filteredLogs = filteredLogs.filter(log => params.actions!.includes(log.action));
    }
    
    // 成功/失败过滤
    if (params.success_only) {
      filteredLogs = filteredLogs.filter(log => log.result?.success === true);
    }
    if (params.error_only) {
      filteredLogs = filteredLogs.filter(log => log.result?.success === false);
    }
    
    // 排序
    const sortBy = params.sort_by || 'timestamp';
    const sortOrder = params.sort_order || 'desc';
    
    filteredLogs.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'level':
          comparison = a.level.localeCompare(b.level);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.page_size || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    // 聚合统计
    const aggregations = this.calculateAggregations(filteredLogs);
    
    return {
      logs: paginatedLogs,
      total_count: filteredLogs.length,
      page,
      page_size: pageSize,
      has_more: endIndex < filteredLogs.length,
      aggregations
    };
  }
  
  /**
   * 导出审计日志
   */
  export(
    params: AuditQueryParams = {},
    format: 'json' | 'csv' = 'json'
  ): string {
    const result = this.query(params);
    
    if (format === 'csv') {
      return this.exportToCsv(result.logs);
    } else {
      return JSON.stringify(result, null, 2);
    }
  }
  
  /**
   * 清理过期日志
   */
  cleanup(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    
    const cleanedCount = initialCount - this.logs.length;
    
    if (cleanedCount > 0) {
      this.log({
        level: AuditLogLevel.INFO,
        category: AuditLogCategory.SYSTEM_CONFIG,
        action: 'cleanup_logs',
        description: `清理了 ${cleanedCount} 条过期日志`,
        result: {
          success: true,
          duration_ms: 0
        },
        metadata: {
          cleaned_count: cleanedCount,
          cutoff_date: cutoffDate.toISOString(),
          remaining_count: this.logs.length
        }
      });
    }
    
    return cleanedCount;
  }
  
  /**
   * 获取统计摘要
   */
  getSummary(days: number = 7): {
    total_logs: number;
    logs_per_day: { [date: string]: number };
    error_rate: number;
    top_actions: Array<{ action: string; count: number }>;
    platform_usage: { [platform: string]: number };
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentLogs = this.logs.filter(log => log.timestamp > cutoffDate);
    
    // 按日期统计
    const logsPerDay: { [date: string]: number } = {};
    const actionCounts: { [action: string]: number } = {};
    const platformUsage: { [platform: string]: number } = {};
    
    let errorCount = 0;
    
    for (const log of recentLogs) {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      logsPerDay[dateKey] = (logsPerDay[dateKey] || 0) + 1;
      
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      if (log.platform) {
        platformUsage[log.platform] = (platformUsage[log.platform] || 0) + 1;
      }
      
      if (log.result?.success === false) {
        errorCount++;
      }
    }
    
    // 排序热门操作
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      total_logs: recentLogs.length,
      logs_per_day: logsPerDay,
      error_rate: recentLogs.length > 0 ? errorCount / recentLogs.length : 0,
      top_actions: topActions,
      platform_usage: platformUsage
    };
  }
  
  // ==================== 便捷记录方法 ====================
  
  /**
   * 记录候选池操作
   */
  logCandidatePoolAction(
    action: string,
    description: string,
    userId?: string,
    metadata?: any,
    result?: { success: boolean; error_message?: string; duration_ms?: number }
  ): void {
    this.log({
      level: result?.success === false ? AuditLogLevel.ERROR : AuditLogLevel.INFO,
      category: AuditLogCategory.CANDIDATE_POOL,
      action,
      description,
      user_id: userId,
      metadata,
      result
    });
  }
  
  /**
   * 记录评论采集操作
   */
  logCommentCollectionAction(
    action: string,
    description: string,
    platform: Platform,
    targetId?: string,
    metadata?: any,
    result?: { success: boolean; error_message?: string; duration_ms?: number }
  ): void {
    this.log({
      level: result?.success === false ? AuditLogLevel.ERROR : AuditLogLevel.INFO,
      category: AuditLogCategory.COMMENT_COLLECTION,
      action,
      description,
      platform,
      target_id: targetId,
      target_type: 'watch_target',
      metadata,
      result
    });
  }
  
  /**
   * 记录任务执行操作
   */
  logTaskExecutionAction(
    action: string,
    description: string,
    task: Task,
    result?: { success: boolean; error_message?: string; duration_ms?: number }
  ): void {
    this.log({
      level: result?.success === false ? AuditLogLevel.ERROR : AuditLogLevel.INFO,
      category: AuditLogCategory.TASK_EXECUTION,
      action,
      description,
      platform: task.platform,
      target_id: task.id,
      target_type: 'task',
      metadata: {
        task_type: task.type,
        task_status: task.status,
        task_priority: task.priority,
        scheduled_time: task.scheduledTime?.toISOString(),
        source_target_id: task.sourceTargetId
      },
      result,
      compliance_flags: task.type === TaskType.REPLY ? ['content_review'] : ['user_interaction']
    });
  }
  
  /**
   * 记录API调用
   */
  logApiCall(
    action: string,
    description: string,
    platform: Platform,
    endpoint: string,
    result: { success: boolean; error_message?: string; duration_ms?: number },
    requestData?: any
  ): void {
    this.log({
      level: result.success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
      category: AuditLogCategory.API_CALL,
      action,
      description,
      platform,
      metadata: {
        endpoint,
        request_data: requestData
      },
      result,
      sensitive_data_accessed: true
    });
  }
  
  /**
   * 记录数据导出操作
   */
  logDataExport(
    action: string,
    description: string,
    userId: string,
    dataType: string,
    recordCount: number,
    result: { success: boolean; error_message?: string; duration_ms?: number }
  ): void {
    this.log({
      level: AuditLogLevel.INFO,
      category: AuditLogCategory.DATA_EXPORT,
      action,
      description,
      user_id: userId,
      metadata: {
        data_type: dataType,
        record_count: recordCount,
        export_timestamp: new Date().toISOString()
      },
      result,
      sensitive_data_accessed: true,
      compliance_flags: ['data_export', 'privacy_sensitive']
    });
  }
  
  // ==================== 私有方法 ====================
  
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  private calculateAggregations(logs: AuditLogEntry[]) {
    const aggregations = {
      by_level: {} as { [key in AuditLogLevel]: number },
      by_category: {} as { [key in AuditLogCategory]: number },
      by_platform: {} as { [key in Platform]: number },
      error_rate: 0,
      avg_duration_ms: 0
    };
    
    // 初始化计数器
    for (const level of Object.values(AuditLogLevel)) {
      aggregations.by_level[level] = 0;
    }
    for (const category of Object.values(AuditLogCategory)) {
      aggregations.by_category[category] = 0;
    }
    for (const platform of Object.values(Platform)) {
      aggregations.by_platform[platform] = 0;
    }
    
    let errorCount = 0;
    let totalDuration = 0;
    let durationCount = 0;
    
    // 统计
    for (const log of logs) {
      aggregations.by_level[log.level]++;
      aggregations.by_category[log.category]++;
      
      if (log.platform) {
        aggregations.by_platform[log.platform]++;
      }
      
      if (log.result?.success === false) {
        errorCount++;
      }
      
      if (log.result?.duration_ms) {
        totalDuration += log.result.duration_ms;
        durationCount++;
      }
    }
    
    aggregations.error_rate = logs.length > 0 ? errorCount / logs.length : 0;
    aggregations.avg_duration_ms = durationCount > 0 ? totalDuration / durationCount : 0;
    
    return aggregations;
  }
  
  private exportToCsv(logs: AuditLogEntry[]): string {
    const headers = [
      'ID', 'Timestamp', 'Level', 'Category', 'Action', 'Description',
      'User ID', 'Platform', 'Target ID', 'Success', 'Error Message', 'Duration (ms)'
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.action,
      `"${log.description.replace(/"/g, '""')}"`,
      log.user_id || '',
      log.platform || '',
      log.target_id || '',
      log.result?.success?.toString() || '',
      log.result?.error_message ? `"${log.result.error_message.replace(/"/g, '""')}"` : '',
      log.result?.duration_ms?.toString() || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// ==================== 全局审计管理器 ====================

/**
 * 全局审计管理器实例
 */
export const globalAuditManager = new AuditLogManager();

/**
 * 便捷的全局记录函数
 */
export const auditLog = {
  candidatePool: (action: string, description: string, userId?: string, metadata?: any, result?: any) =>
    globalAuditManager.logCandidatePoolAction(action, description, userId, metadata, result),
  
  commentCollection: (action: string, description: string, platform: Platform, targetId?: string, metadata?: any, result?: any) =>
    globalAuditManager.logCommentCollectionAction(action, description, platform, targetId, metadata, result),
  
  taskExecution: (action: string, description: string, task: Task, result?: any) =>
    globalAuditManager.logTaskExecutionAction(action, description, task, result),
  
  apiCall: (action: string, description: string, platform: Platform, endpoint: string, result: any, requestData?: any) =>
    globalAuditManager.logApiCall(action, description, platform, endpoint, result, requestData),
  
  dataExport: (action: string, description: string, userId: string, dataType: string, recordCount: number, result: any) =>
    globalAuditManager.logDataExport(action, description, userId, dataType, recordCount, result),
  
  general: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'session_id'>) =>
    globalAuditManager.log(entry)
};

// ==================== 工厂函数 ====================

/**
 * 创建审计日志管理器
 */
export function createAuditLogManager(maxLogSize?: number): AuditLogManager {
  return new AuditLogManager(maxLogSize);
}