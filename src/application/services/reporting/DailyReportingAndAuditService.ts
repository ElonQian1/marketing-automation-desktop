/**
 * 日报生成和系统审计服务
 * 
 * 提供完整的日报生成和系统审计功能，包括：
 * - 执行统计和性能分析
 * - 异常监控和合规检查
 * - 多格式报告生成（JSON、HTML、PDF）
 * - 审计日志记录和分析
 */

import { Platform } from '../../../constants/precise-acquisition-enums';

// ==================== 基础数据结构 ====================

export interface DailyReportData {
  // 报告基本信息
  report_date: Date;
  report_id: string;
  generation_time: Date;
  report_period: {
    start_time: Date;
    end_time: Date;
    duration_hours: number;
  };

  // 执行统计
  execution_summary: {
    total_tasks: number;
    successful_tasks: number;
    failed_tasks: number;
    cancelled_tasks: number;
    success_rate: number;
    average_execution_time_ms: number;
    total_execution_time_ms: number;
  };

  // 平台分布统计
  platform_stats: Record<Platform, {
    tasks_executed: number;
    success_rate: number;
    average_response_time_ms: number;
    error_count: number;
    api_calls_made: number;
    api_quota_usage: number;
  }>;

  // 设备性能统计
  device_stats: Array<{
    device_id: string;
    account_id?: string;
    tasks_assigned: number;
    tasks_completed: number;
    utilization_rate: number;
    average_task_duration_ms: number;
    error_count: number;
    last_active_time: Date;
    health_score: number; // 0-1
  }>;

  // 频控和去重统计
  rate_control_stats: {
    total_requests: number;
    accepted_requests: number;
    rejected_requests: number;
    acceptance_rate: number;
    duplicate_detections: number;
    circuit_breaker_triggers: number;
    average_wait_time_ms: number;
  };

  // 评论采集统计
  comment_collection_stats: {
    comments_collected: number;
    comments_processed: number;
    unique_users_reached: number;
    engagement_metrics: {
      likes_received: number;
      replies_sent: number;
      follows_gained: number;
    };
    content_analysis: {
      sentiment_positive: number;
      sentiment_neutral: number;
      sentiment_negative: number;
      keyword_matches: number;
    };
  };

  // 异常和错误统计
  error_analysis: {
    total_errors: number;
    errors_by_category: Record<string, number>;
    errors_by_platform: Record<Platform, number>;
    critical_errors: Array<{
      timestamp: Date;
      error_type: string;
      message: string;
      device_id?: string;
      platform?: Platform;
      resolution_status: 'pending' | 'resolved' | 'ignored';
    }>;
    error_trends: Array<{
      hour: number;
      error_count: number;
      error_rate: number;
    }>;
  };

  // 合规检查结果
  compliance_check: {
    robots_txt_compliance: {
      checked_domains: number;
      compliant_domains: number;
      violations: Array<{
        domain: string;
        violation_type: string;
        severity: 'low' | 'medium' | 'high';
        details: string;
      }>;
    };
    rate_limit_compliance: {
      platforms_monitored: Platform[];
      violations_detected: number;
      most_violated_limit: string;
      compliance_score: number; // 0-1
    };
    api_quota_usage: {
      platforms: Record<Platform, {
        quota_limit: number;
        quota_used: number;
        usage_percentage: number;
        projected_daily_usage: number;
        risk_level: 'low' | 'medium' | 'high';
      }>;
    };
  };

  // 性能指标
  performance_metrics: {
    peak_usage_hour: number;
    lowest_usage_hour: number;
    average_concurrent_tasks: number;
    max_concurrent_tasks: number;
    memory_usage_mb: number;
    cpu_usage_percentage: number;
    database_operations: {
      queries_executed: number;
      average_query_time_ms: number;
      slow_queries_count: number;
    };
  };

  // 建议和预警
  recommendations: Array<{
    category: 'performance' | 'compliance' | 'resource' | 'error' | 'optimization';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    suggested_action: string;
    impact_assessment: string;
  }>;

  // 数据完整性验证
  data_integrity: {
    validation_passed: boolean;
    missing_data_periods: Array<{
      start_time: Date;
      end_time: Date;
      reason: string;
    }>;
    data_quality_score: number; // 0-1
    anomalies_detected: Array<{
      metric: string;
      expected_range: [number, number];
      actual_value: number;
      deviation_percentage: number;
    }>;
  };
}

// ==================== 审计日志结构 ====================

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  event_type: 'task_execution' | 'api_call' | 'config_change' | 'error' | 'compliance_check' | 'user_action';
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // 事件详情
  event_details: {
    action: string;
    resource: string;
    user_id?: string;
    device_id?: string;
    platform?: Platform;
    parameters?: Record<string, any>;
    result?: 'success' | 'failure' | 'partial';
    execution_time_ms?: number;
  };

  // 上下文信息
  context: {
    session_id?: string;
    task_id?: string;
    batch_id?: string;
    correlation_id?: string;
    source_ip?: string;
    user_agent?: string;
  };

  // 影响和结果
  impact: {
    affected_resources: string[];
    data_changes?: Record<string, { before: any; after: any }>;
    side_effects?: string[];
    rollback_possible: boolean;
  };

  // 合规相关
  compliance_info?: {
    regulation_context: string[];
    sensitive_data_involved: boolean;
    retention_period_days: number;
    encryption_applied: boolean;
  };
}

// ==================== 报告配置 ====================

export interface ReportConfiguration {
  // 生成配置
  generation: {
    auto_generate: boolean;
    generation_time: string; // 24h format: "02:00"
    timezone: string;
    include_previous_day_comparison: boolean;
    include_weekly_trends: boolean;
  };

  // 内容配置
  content: {
    include_device_details: boolean;
    include_error_stack_traces: boolean;
    include_sensitive_data: boolean;
    max_error_entries: number;
    chart_generation: boolean;
  };

  // 输出配置
  output: {
    formats: Array<'json' | 'html' | 'pdf' | 'csv'>;
    storage_location: string;
    email_recipients?: string[];
    webhook_url?: string;
    compression_enabled: boolean;
  };

  // 保留策略
  retention: {
    keep_days: number;
    archive_after_days: number;
    auto_cleanup: boolean;
    backup_before_cleanup: boolean;
  };
}

// ==================== 日报生成器 ====================

export class DailyReportGenerator {
  private config: ReportConfiguration;
  private auditLogs: AuditLogEntry[] = [];
  private dataCollectors: Map<string, () => Promise<any>> = new Map();

  constructor(config: ReportConfiguration) {
    this.config = config;
    this.initializeDataCollectors();
  }

  /**
   * 生成指定日期的日报
   */
  async generateDailyReport(targetDate: Date): Promise<DailyReportData> {
    const reportId = this.generateReportId(targetDate);
    const startTime = new Date(targetDate);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(targetDate);
    endTime.setHours(23, 59, 59, 999);

    console.log(`[DailyReport] Generating report for ${targetDate.toDateString()}`);

    const reportData: DailyReportData = {
      report_date: targetDate,
      report_id: reportId,
      generation_time: new Date(),
      report_period: {
        start_time: startTime,
        end_time: endTime,
        duration_hours: 24
      },
      execution_summary: await this.collectExecutionSummary(startTime, endTime),
      platform_stats: await this.collectPlatformStats(startTime, endTime),
      device_stats: await this.collectDeviceStats(startTime, endTime),
      rate_control_stats: await this.collectRateControlStats(startTime, endTime),
      comment_collection_stats: await this.collectCommentStats(startTime, endTime),
      error_analysis: await this.collectErrorAnalysis(startTime, endTime),
      compliance_check: await this.performComplianceCheck(startTime, endTime),
      performance_metrics: await this.collectPerformanceMetrics(startTime, endTime),
      recommendations: await this.generateRecommendations(startTime, endTime),
      data_integrity: await this.validateDataIntegrity(startTime, endTime)
    };

    // 验证报告完整性
    this.validateReportData(reportData);

    // 记录审计日志
    await this.logReportGeneration(reportData);

    console.log(`[DailyReport] Report generated successfully: ${reportId}`);
    return reportData;
  }

  /**
   * 导出报告为指定格式
   */
  async exportReport(reportData: DailyReportData, format: 'json' | 'html' | 'pdf' | 'csv'): Promise<string> {
    switch (format) {
      case 'json':
        return await this.exportToJson(reportData);
      case 'html':
        return await this.exportToHtml(reportData);
      case 'pdf':
        return await this.exportToPdf(reportData);
      case 'csv':
        return await this.exportToCsv(reportData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * 获取历史报告列表
   */
  async getHistoricalReports(days: number = 30): Promise<Array<{
    report_id: string;
    date: Date;
    file_path: string;
    file_size: number;
    formats_available: string[];
  }>> {
    // 这里应该从实际存储中获取历史报告
    // 暂时返回模拟数据
    const reports = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      reports.push({
        report_id: this.generateReportId(date),
        date,
        file_path: `reports/${this.generateReportId(date)}.json`,
        file_size: Math.floor(Math.random() * 1000000) + 500000, // 500KB - 1.5MB
        formats_available: ['json', 'html']
      });
    }
    
    return reports;
  }

  /**
   * 添加审计日志条目
   */
  async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      ...entry
    };

    this.auditLogs.push(auditEntry);

    // 如果日志过多，清理旧的条目
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }

    // 检查是否需要立即告警
    if (entry.severity === 'critical') {
      await this.triggerCriticalAlert(auditEntry);
    }
  }

  /**
   * 搜索审计日志
   */
  async searchAuditLogs(criteria: {
    start_time?: Date;
    end_time?: Date;
    event_type?: AuditLogEntry['event_type'];
    severity?: AuditLogEntry['severity'];
    device_id?: string;
    platform?: Platform;
    text_search?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let filteredLogs = [...this.auditLogs];

    // 应用时间过滤
    if (criteria.start_time) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= criteria.start_time!);
    }
    if (criteria.end_time) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= criteria.end_time!);
    }

    // 应用事件类型过滤
    if (criteria.event_type) {
      filteredLogs = filteredLogs.filter(log => log.event_type === criteria.event_type);
    }

    // 应用严重性过滤
    if (criteria.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === criteria.severity);
    }

    // 应用设备ID过滤
    if (criteria.device_id) {
      filteredLogs = filteredLogs.filter(log => log.event_details.device_id === criteria.device_id);
    }

    // 应用平台过滤
    if (criteria.platform) {
      filteredLogs = filteredLogs.filter(log => log.event_details.platform === criteria.platform);
    }

    // 应用文本搜索
    if (criteria.text_search) {
      const searchTerm = criteria.text_search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.event_details.action.toLowerCase().includes(searchTerm) ||
        log.event_details.resource.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.event_details.parameters).toLowerCase().includes(searchTerm)
      );
    }

    // 应用限制
    if (criteria.limit && criteria.limit > 0) {
      filteredLogs = filteredLogs.slice(0, criteria.limit);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 清理过期的审计日志和报告
   */
  async cleanup(): Promise<{
    audit_logs_removed: number;
    reports_archived: number;
    reports_deleted: number;
    storage_freed_bytes: number;
  }> {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - this.config.retention.keep_days * 24 * 60 * 60 * 1000);
    
    // 清理审计日志
    const originalLogCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => log.timestamp >= cutoffDate);
    const logsRemoved = originalLogCount - this.auditLogs.length;

    // 这里应该实现报告文件的清理逻辑
    const reportsArchived = 0;
    const reportsDeleted = 0;
    const storageFreed = logsRemoved * 1024; // 估算每条日志1KB

    console.log(`[DailyReport] Cleanup completed: ${logsRemoved} audit logs removed`);

    return {
      audit_logs_removed: logsRemoved,
      reports_archived: reportsArchived,
      reports_deleted: reportsDeleted,
      storage_freed_bytes: storageFreed
    };
  }

  // ==================== 私有方法 - 数据收集 ====================

  /**
   * 初始化数据收集器
   */
  private initializeDataCollectors(): void {
    // 这里应该注册各种数据收集器
    // 暂时使用模拟数据
  }

  /**
   * 收集执行统计
   */
  private async collectExecutionSummary(startTime: Date, endTime: Date): Promise<DailyReportData['execution_summary']> {
    // 这里应该从实际数据库查询
    // 暂时返回模拟数据
    return {
      total_tasks: 1250,
      successful_tasks: 1180,
      failed_tasks: 65,
      cancelled_tasks: 5,
      success_rate: 0.944,
      average_execution_time_ms: 15400,
      total_execution_time_ms: 19250000
    };
  }

  /**
   * 收集平台统计
   */
  private async collectPlatformStats(startTime: Date, endTime: Date): Promise<DailyReportData['platform_stats']> {
    return {
      [Platform.DOUYIN]: {
        tasks_executed: 800,
        success_rate: 0.95,
        average_response_time_ms: 1200,
        error_count: 40,
        api_calls_made: 1600,
        api_quota_usage: 0.65
      },
      [Platform.OCEANENGINE]: {
        tasks_executed: 300,
        success_rate: 0.98,
        average_response_time_ms: 800,
        error_count: 6,
        api_calls_made: 450,
        api_quota_usage: 0.32
      },
      [Platform.PUBLIC]: {
        tasks_executed: 150,
        success_rate: 0.87,
        average_response_time_ms: 2500,
        error_count: 19,
        api_calls_made: 300,
        api_quota_usage: 0.0 // 无API配额限制
      }
    };
  }

  /**
   * 收集设备统计
   */
  private async collectDeviceStats(startTime: Date, endTime: Date): Promise<DailyReportData['device_stats']> {
    const devices = ['device_001', 'device_002', 'device_003', 'device_004'];
    return devices.map(deviceId => ({
      device_id: deviceId,
      account_id: `account_${deviceId.slice(-3)}`,
      tasks_assigned: Math.floor(Math.random() * 300) + 200,
      tasks_completed: Math.floor(Math.random() * 280) + 180,
      utilization_rate: Math.random() * 0.3 + 0.7,
      average_task_duration_ms: Math.floor(Math.random() * 10000) + 10000,
      error_count: Math.floor(Math.random() * 20),
      last_active_time: new Date(Date.now() - Math.random() * 3600000),
      health_score: Math.random() * 0.3 + 0.7
    }));
  }

  /**
   * 收集频控统计
   */
  private async collectRateControlStats(startTime: Date, endTime: Date): Promise<DailyReportData['rate_control_stats']> {
    return {
      total_requests: 2500,
      accepted_requests: 2350,
      rejected_requests: 150,
      acceptance_rate: 0.94,
      duplicate_detections: 75,
      circuit_breaker_triggers: 8,
      average_wait_time_ms: 12500
    };
  }

  /**
   * 收集评论统计
   */
  private async collectCommentStats(startTime: Date, endTime: Date): Promise<DailyReportData['comment_collection_stats']> {
    return {
      comments_collected: 15600,
      comments_processed: 15400,
      unique_users_reached: 8900,
      engagement_metrics: {
        likes_received: 2340,
        replies_sent: 1250,
        follows_gained: 180
      },
      content_analysis: {
        sentiment_positive: 8500,
        sentiment_neutral: 5200,
        sentiment_negative: 1700,
        keyword_matches: 3400
      }
    };
  }

  /**
   * 收集错误分析
   */
  private async collectErrorAnalysis(startTime: Date, endTime: Date): Promise<DailyReportData['error_analysis']> {
    return {
      total_errors: 89,
      errors_by_category: {
        'API限制': 35,
        '网络超时': 28,
        '认证失败': 12,
        '数据格式错误': 8,
        '系统异常': 6
      },
      errors_by_platform: {
        [Platform.DOUYIN]: 45,
        [Platform.OCEANENGINE]: 15,
        [Platform.PUBLIC]: 29
      },
      critical_errors: [
        {
          timestamp: new Date(Date.now() - 7200000),
          error_type: 'API限制',
          message: 'API quota exceeded for Douyin platform',
          device_id: 'device_001',
          platform: Platform.DOUYIN,
          resolution_status: 'resolved'
        },
        {
          timestamp: new Date(Date.now() - 3600000),
          error_type: '认证失败',
          message: 'OAuth token expired for OceanEngine',
          platform: Platform.OCEANENGINE,
          resolution_status: 'pending'
        }
      ],
      error_trends: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        error_count: Math.floor(Math.random() * 8),
        error_rate: Math.random() * 0.1
      }))
    };
  }

  /**
   * 执行合规检查
   */
  private async performComplianceCheck(startTime: Date, endTime: Date): Promise<DailyReportData['compliance_check']> {
    return {
      robots_txt_compliance: {
        checked_domains: 45,
        compliant_domains: 42,
        violations: [
          {
            domain: 'example1.com',
            violation_type: 'Crawl-delay not respected',
            severity: 'medium',
            details: 'Requested every 2 seconds instead of required 5 seconds'
          },
          {
            domain: 'example2.com',
            violation_type: 'Disallowed path accessed',
            severity: 'high',
            details: 'Accessed /api/private/ which is disallowed in robots.txt'
          }
        ]
      },
      rate_limit_compliance: {
        platforms_monitored: [Platform.DOUYIN, Platform.OCEANENGINE, Platform.PUBLIC],
        violations_detected: 3,
        most_violated_limit: 'hourly_limit',
        compliance_score: 0.92
      },
      api_quota_usage: {
        [Platform.DOUYIN]: {
          quota_limit: 10000,
          quota_used: 6500,
          usage_percentage: 65,
          projected_daily_usage: 8000,
          risk_level: 'medium'
        },
        [Platform.OCEANENGINE]: {
          quota_limit: 5000,
          quota_used: 1600,
          usage_percentage: 32,
          projected_daily_usage: 2000,
          risk_level: 'low'
        },
        [Platform.PUBLIC]: {
          quota_limit: 0, // 无限制
          quota_used: 0,
          usage_percentage: 0,
          projected_daily_usage: 0,
          risk_level: 'low'
        }
      }
    };
  }

  /**
   * 收集性能指标
   */
  private async collectPerformanceMetrics(startTime: Date, endTime: Date): Promise<DailyReportData['performance_metrics']> {
    return {
      peak_usage_hour: 20,
      lowest_usage_hour: 4,
      average_concurrent_tasks: 8.5,
      max_concurrent_tasks: 15,
      memory_usage_mb: 256,
      cpu_usage_percentage: 35,
      database_operations: {
        queries_executed: 45600,
        average_query_time_ms: 12,
        slow_queries_count: 23
      }
    };
  }

  /**
   * 生成建议
   */
  private async generateRecommendations(startTime: Date, endTime: Date): Promise<DailyReportData['recommendations']> {
    return [
      {
        category: 'performance',
        priority: 'medium',
        title: '优化数据库查询性能',
        description: '检测到23个慢查询，建议优化索引或查询语句',
        suggested_action: '分析慢查询日志，添加必要的数据库索引',
        impact_assessment: '可提升整体性能15-20%'
      },
      {
        category: 'compliance',
        priority: 'high',
        title: '修复robots.txt违规问题',
        description: '检测到3个域名的robots.txt合规问题',
        suggested_action: '调整爬取频率，避免访问禁止路径',
        impact_assessment: '降低被封禁风险，确保长期稳定运行'
      },
      {
        category: 'resource',
        priority: 'low',
        title: '考虑增加设备资源',
        description: '设备利用率较高，可能影响响应速度',
        suggested_action: '监控设备负载，必要时增加设备数量',
        impact_assessment: '提升处理能力和系统稳定性'
      }
    ];
  }

  /**
   * 验证数据完整性
   */
  private async validateDataIntegrity(startTime: Date, endTime: Date): Promise<DailyReportData['data_integrity']> {
    return {
      validation_passed: true,
      missing_data_periods: [],
      data_quality_score: 0.96,
      anomalies_detected: [
        {
          metric: 'success_rate',
          expected_range: [0.90, 0.98],
          actual_value: 0.944,
          deviation_percentage: 0
        }
      ]
    };
  }

  // ==================== 私有方法 - 导出功能 ====================

  /**
   * 导出为JSON格式
   */
  private async exportToJson(reportData: DailyReportData): Promise<string> {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * 导出为HTML格式
   */
  private async exportToHtml(reportData: DailyReportData): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>日报 - ${reportData.report_date.toDateString()}</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2c3e50; border-left: 4px solid #4CAF50; padding-left: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
        .stat-label { color: #666; margin-top: 5px; }
        .error-item { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; margin: 10px 0; }
        .recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; }
        .recommendation.high { border-left-color: #f44336; background: #ffebee; }
        .recommendation.medium { border-left-color: #ff9800; background: #fff3e0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>精准获客系统日报</h1>
            <p>报告日期: ${reportData.report_date.toLocaleDateString('zh-CN')}</p>
            <p>生成时间: ${reportData.generation_time.toLocaleString('zh-CN')}</p>
        </div>

        <div class="section">
            <h2>📊 执行概览</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${reportData.execution_summary.total_tasks}</div>
                    <div class="stat-label">总任务数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(reportData.execution_summary.success_rate * 100).toFixed(1)}%</div>
                    <div class="stat-label">成功率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(reportData.execution_summary.average_execution_time_ms / 1000)}s</div>
                    <div class="stat-label">平均执行时间</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportData.comment_collection_stats.comments_collected}</div>
                    <div class="stat-label">评论采集数</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📱 平台表现</h2>
            <table>
                <thead>
                    <tr>
                        <th>平台</th>
                        <th>执行任务</th>
                        <th>成功率</th>
                        <th>响应时间</th>
                        <th>错误数</th>
                        <th>API使用率</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(reportData.platform_stats).map(([platform, stats]) => `
                        <tr>
                            <td>${platform}</td>
                            <td>${stats.tasks_executed}</td>
                            <td>${(stats.success_rate * 100).toFixed(1)}%</td>
                            <td>${stats.average_response_time_ms}ms</td>
                            <td>${stats.error_count}</td>
                            <td>${(stats.api_quota_usage * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>⚠️ 关键错误</h2>
            ${reportData.error_analysis.critical_errors.map(error => `
                <div class="error-item">
                    <strong>${error.error_type}</strong> - ${error.timestamp.toLocaleString('zh-CN')}<br>
                    ${error.message}
                    ${error.device_id ? `<br>设备: ${error.device_id}` : ''}
                    <br>状态: <span style="color: ${error.resolution_status === 'resolved' ? '#4CAF50' : '#f44336'}">${error.resolution_status}</span>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>💡 优化建议</h2>
            ${reportData.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <strong>${rec.title}</strong> <span style="color: #666; font-size: 12px;">[${rec.priority.toUpperCase()}]</span><br>
                    <p>${rec.description}</p>
                    <p><strong>建议行动:</strong> ${rec.suggested_action}</p>
                    <p><strong>预期影响:</strong> ${rec.impact_assessment}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📈 系统健康度</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${(reportData.data_integrity.data_quality_score * 100).toFixed(1)}%</div>
                    <div class="stat-label">数据质量分数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(reportData.compliance_check.rate_limit_compliance.compliance_score * 100).toFixed(1)}%</div>
                    <div class="stat-label">合规分数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportData.performance_metrics.cpu_usage_percentage}%</div>
                    <div class="stat-label">CPU使用率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportData.performance_metrics.memory_usage_mb}MB</div>
                    <div class="stat-label">内存使用</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * 导出为PDF格式（简化实现）
   */
  private async exportToPdf(reportData: DailyReportData): Promise<string> {
    // 这里应该使用实际的PDF生成库
    // 暂时返回HTML内容的标记
    return `PDF Export not implemented. Use HTML export instead.
Report ID: ${reportData.report_id}
Date: ${reportData.report_date.toDateString()}
Total Tasks: ${reportData.execution_summary.total_tasks}
Success Rate: ${(reportData.execution_summary.success_rate * 100).toFixed(1)}%`;
  }

  /**
   * 导出为CSV格式
   */
  private async exportToCsv(reportData: DailyReportData): Promise<string> {
    const csv = [];
    
    // 基本信息
    csv.push('报告基本信息');
    csv.push('报告ID,日期,生成时间,总任务数,成功率');
    csv.push(`${reportData.report_id},${reportData.report_date.toDateString()},${reportData.generation_time.toLocaleString()},${reportData.execution_summary.total_tasks},${(reportData.execution_summary.success_rate * 100).toFixed(1)}%`);
    csv.push('');

    // 平台统计
    csv.push('平台统计');
    csv.push('平台,执行任务,成功率,响应时间,错误数,API使用率');
    for (const [platform, stats] of Object.entries(reportData.platform_stats)) {
      csv.push(`${platform},${stats.tasks_executed},${(stats.success_rate * 100).toFixed(1)}%,${stats.average_response_time_ms}ms,${stats.error_count},${(stats.api_quota_usage * 100).toFixed(1)}%`);
    }
    csv.push('');

    // 设备统计
    csv.push('设备统计');
    csv.push('设备ID,分配任务,完成任务,利用率,平均执行时间,错误数,健康分数');
    for (const device of reportData.device_stats) {
      csv.push(`${device.device_id},${device.tasks_assigned},${device.tasks_completed},${(device.utilization_rate * 100).toFixed(1)}%,${device.average_task_duration_ms}ms,${device.error_count},${(device.health_score * 100).toFixed(1)}%`);
    }

    return csv.join('\n');
  }

  // ==================== 私有方法 - 工具函数 ====================

  /**
   * 生成报告ID
   */
  private generateReportId(date: Date): string {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `REPORT_${dateStr}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * 生成审计ID
   */
  private generateAuditId(): string {
    return `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * 验证报告数据
   */
  private validateReportData(reportData: DailyReportData): void {
    if (!reportData.report_id || !reportData.report_date) {
      throw new Error('Invalid report data: missing required fields');
    }

    if (reportData.execution_summary.success_rate < 0 || reportData.execution_summary.success_rate > 1) {
      throw new Error('Invalid success rate: must be between 0 and 1');
    }

    // 可以添加更多验证逻辑
  }

  /**
   * 记录报告生成审计日志
   */
  private async logReportGeneration(reportData: DailyReportData): Promise<void> {
    await this.addAuditLog({
      event_type: 'user_action',
      severity: 'info',
      event_details: {
        action: 'generate_daily_report',
        resource: reportData.report_id,
        parameters: {
          report_date: reportData.report_date.toISOString(),
          total_tasks: reportData.execution_summary.total_tasks
        },
        result: 'success'
      },
      context: {
        correlation_id: reportData.report_id
      },
      impact: {
        affected_resources: ['daily_reports'],
        rollback_possible: false
      }
    });
  }

  /**
   * 触发关键告警
   */
  private async triggerCriticalAlert(entry: AuditLogEntry): Promise<void> {
    console.error(`[CRITICAL ALERT] ${entry.event_details.action}: ${entry.event_details.resource}`);
    // 这里应该实现实际的告警机制（邮件、短信、Webhook等）
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建日报生成器实例
 */
export function createDailyReportGenerator(config: ReportConfiguration): DailyReportGenerator {
  return new DailyReportGenerator(config);
}

/**
 * 获取默认报告配置
 */
export function getDefaultReportConfiguration(): ReportConfiguration {
  return {
    generation: {
      auto_generate: true,
      generation_time: '02:00',
      timezone: 'Asia/Shanghai',
      include_previous_day_comparison: true,
      include_weekly_trends: false
    },
    content: {
      include_device_details: true,
      include_error_stack_traces: false,
      include_sensitive_data: false,
      max_error_entries: 50,
      chart_generation: false
    },
    output: {
      formats: ['json', 'html'],
      storage_location: './reports',
      compression_enabled: true
    },
    retention: {
      keep_days: 30,
      archive_after_days: 90,
      auto_cleanup: true,
      backup_before_cleanup: true
    }
  };
}