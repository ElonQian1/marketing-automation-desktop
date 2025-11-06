// src/modules/structural-matching/domain/services/structural-matching-monitoring-service.ts
// module: structural-matching | layer: domain | role: 监控服务
// summary: 综合监控服务，整合指标收集、错误追踪和性能分析

import { StructuralMatchingMetricsCollector } from './structural-matching-metrics-collector';
import { StructuralMatchingErrorRecoveryService } from './structural-matching-error-recovery-service';
import { StructuralMatchingEventBus } from '../events/structural-matching-event-bus';

/**
 * 监控配置
 */
export interface MonitoringConfig {
  // 是否启用监控
  enabled: boolean;
  
  // 报告间隔 (毫秒)
  reportingInterval: number;
  
  // 性能阈值配置
  performanceThresholds: {
    dataFetchTime: number;     // 数据获取时间阈值 (ms)
    validationTime: number;    // 验证时间阈值 (ms)
    matchingTime: number;      // 匹配时间阈值 (ms)
    memoryUsage: number;       // 内存使用阈值 (MB)
    errorRate: number;         // 错误率阈值 (%)
  };
  
  // 告警配置
  alerts: {
    enabled: boolean;
    channels: ('console' | 'event' | 'callback')[];
    callback?: (alert: MonitoringAlert) => void;
  };
  
  // 数据保留配置
  retention: {
    metrics: number;       // 指标保留时间 (毫秒)
    reports: number;       // 报告保留时间 (毫秒)
    alerts: number;        // 告警保留时间 (毫秒)
  };
}

/**
 * 监控告警
 */
export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'error' | 'threshold' | 'availability';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  component: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * 系统健康状态
 */
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    dataProvider: 'healthy' | 'degraded' | 'critical';
    validator: 'healthy' | 'degraded' | 'critical';
    eventBus: 'healthy' | 'degraded' | 'critical';
    errorRecovery: 'healthy' | 'degraded' | 'critical';
  };
  metrics: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    memoryUsage?: number;
  };
  lastUpdated: number;
}

/**
 * 监控报告
 */
export interface MonitoringReport {
  id: string;
  timestamp: number;
  timeRange: { from: number; to: number };
  
  summary: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    totalErrors: number;
    activeUsers?: number;
  };
  
  performance: {
    dataFetch: {
      count: number;
      averageTime: number;
      p95Time: number;
      successRate: number;
    };
    validation: {
      count: number;
      averageTime: number;
      averageQuality: number;
      autoRepairRate: number;
    };
    matching: {
      count: number;
      averageTime: number;
      averageAccuracy: number;
      strategyDistribution: Record<string, number>;
    };
  };
  
  errors: {
    totalCount: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recoveryRate: number;
    topErrors: Array<{
      message: string;
      count: number;
      lastOccurred: number;
    }>;
  };
  
  resources: {
    memoryUsage?: number;
    cacheHitRate: number;
    activeConnections: number;
  };
  
  alerts: MonitoringAlert[];
}

/**
 * 结构匹配监控服务
 */
export class StructuralMatchingMonitoringService {
  private static instance: StructuralMatchingMonitoringService;
  
  private metricsCollector: StructuralMatchingMetricsCollector;
  private errorRecoveryService: StructuralMatchingErrorRecoveryService;
  private eventBus: StructuralMatchingEventBus;
  
  private config: MonitoringConfig;
  private alerts: Map<string, MonitoringAlert> = new Map();
  private reports: MonitoringReport[] = [];
  private reportingTimer: NodeJS.Timeout | null = null;
  
  private startTime: number = Date.now();
  private lastHealthCheck: number = 0;
  
  private defaultConfig: MonitoringConfig = {
    enabled: true,
    reportingInterval: 5 * 60 * 1000, // 5分钟
    performanceThresholds: {
      dataFetchTime: 2000,    // 2秒
      validationTime: 1000,   // 1秒
      matchingTime: 3000,     // 3秒
      memoryUsage: 100,       // 100MB
      errorRate: 5            // 5%
    },
    alerts: {
      enabled: true,
      channels: ['console', 'event']
    },
    retention: {
      metrics: 24 * 60 * 60 * 1000,  // 24小时
      reports: 7 * 24 * 60 * 60 * 1000,  // 7天
      alerts: 30 * 24 * 60 * 60 * 1000   // 30天
    }
  };

  private constructor() {
    this.metricsCollector = StructuralMatchingMetricsCollector.getInstance();
    this.errorRecoveryService = StructuralMatchingErrorRecoveryService.getInstance();
    this.eventBus = StructuralMatchingEventBus.getInstance();
    
    this.config = { ...this.defaultConfig };
    this.setupEventListeners();
    this.startReporting();
    
    console.log('🔍 [MonitoringService] 初始化监控服务');
  }

  public static getInstance(): StructuralMatchingMonitoringService {
    if (!this.instance) {
      this.instance = new StructuralMatchingMonitoringService();
    }
    return this.instance;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    console.log('⚙️ [MonitoringService] 配置已更新:', newConfig);
    
    // 重新设置报告间隔
    if (newConfig.reportingInterval && this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.startReporting();
    }
  }

  /**
   * 获取系统健康状态
   */
  public getSystemHealth(): SystemHealth {
    const now = Date.now();
    const realtimeStats = this.metricsCollector.getRealtimeStats();
    const errorStats = this.errorRecoveryService.getErrorStatistics();
    
    // 计算组件健康状态
    const componentHealth = this.assessComponentHealth(realtimeStats, errorStats);
    
    // 计算整体健康状态
    const overallHealth = this.calculateOverallHealth(componentHealth);
    
    this.lastHealthCheck = now;
    
    return {
      overall: overallHealth,
      components: componentHealth,
      metrics: {
        uptime: now - this.startTime,
        averageResponseTime: realtimeStats.averageResponseTime,
        errorRate: errorStats.recoverySuccessRate ? (1 - errorStats.recoverySuccessRate) * 100 : 0,
        throughput: realtimeStats.metricsPerSecond * 60, // 转换为每分钟
        memoryUsage: this.getMemoryUsage()
      },
      lastUpdated: now
    };
  }

  /**
   * 生成监控报告
   */
  public generateReport(timeRange?: { from: number; to: number }): MonitoringReport {
    const now = Date.now();
    const defaultTimeRange = {
      from: now - 60 * 60 * 1000, // 最近1小时
      to: now
    };
    const actualTimeRange = timeRange || defaultTimeRange;
    
    const reportId = `report_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 收集各类指标
    const performanceMetrics = this.collectPerformanceMetrics(actualTimeRange);
    const errorMetrics = this.collectErrorMetrics(actualTimeRange);
    const resourceMetrics = this.collectResourceMetrics(actualTimeRange);
    const recentAlerts = this.getActiveAlerts(actualTimeRange);
    
    const report: MonitoringReport = {
      id: reportId,
      timestamp: now,
      timeRange: actualTimeRange,
      
      summary: {
        totalRequests: performanceMetrics.totalRequests,
        successRate: performanceMetrics.successRate,
        averageResponseTime: performanceMetrics.averageResponseTime,
        totalErrors: errorMetrics.totalCount
      },
      
      performance: {
        dataFetch: performanceMetrics.dataFetch,
        validation: performanceMetrics.validation,
        matching: performanceMetrics.matching
      },
      
      errors: errorMetrics,
      resources: resourceMetrics,
      alerts: recentAlerts
    };
    
    // 存储报告
    this.storeReport(report);
    
    // 发射报告生成事件
    this.eventBus.emit('PERFORMANCE_MEASURED', {
      metric: {
        name: 'monitoring_report_generated',
        value: 1,
        unit: 'count'
      },
      context: {
        operation: 'generate_report',
        component: 'MonitoringService',
        dataSize: JSON.stringify(report).length
      }
    }, 'MonitoringService').catch(console.error);
    
    return report;
  }

  /**
   * 创建告警
   */
  public createAlert(
    type: MonitoringAlert['type'],
    severity: MonitoringAlert['severity'],
    title: string,
    message: string,
    component: string,
    metadata: Record<string, unknown> = {}
  ): MonitoringAlert {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: MonitoringAlert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      timestamp: Date.now(),
      component,
      metadata,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    
    // 发送告警
    this.sendAlert(alert);
    
    console.warn(`🚨 [MonitoringService] 创建告警 [${severity.toUpperCase()}]: ${title}`);
    
    return alert;
  }

  /**
   * 解决告警
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }
    
    alert.resolved = true;
    alert.resolvedAt = Date.now();
    
    console.log(`✅ [MonitoringService] 告警已解决: ${alert.title}`);
    
    return true;
  }

  /**
   * 获取活跃告警
   */
  public getActiveAlerts(timeRange?: { from: number; to: number }): MonitoringAlert[] {
    let alerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    
    if (timeRange) {
      alerts = alerts.filter(alert => 
        alert.timestamp >= timeRange.from && alert.timestamp <= timeRange.to
      );
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取历史报告
   */
  public getReports(limit: number = 10): MonitoringReport[] {
    return this.reports
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 检查性能阈值
   */
  public checkPerformanceThresholds(): void {
    const health = this.getSystemHealth();
    const thresholds = this.config.performanceThresholds;
    
    // 检查响应时间
    if (health.metrics.averageResponseTime > thresholds.dataFetchTime) {
      this.createAlert(
        'performance',
        'warning',
        '响应时间过高',
        `平均响应时间 ${health.metrics.averageResponseTime.toFixed(2)}ms 超过阈值 ${thresholds.dataFetchTime}ms`,
        'PerformanceMonitor',
        { 
          currentValue: health.metrics.averageResponseTime,
          threshold: thresholds.dataFetchTime
        }
      );
    }
    
    // 检查错误率
    if (health.metrics.errorRate > thresholds.errorRate) {
      this.createAlert(
        'error',
        'critical',
        '错误率过高',
        `当前错误率 ${health.metrics.errorRate.toFixed(2)}% 超过阈值 ${thresholds.errorRate}%`,
        'ErrorMonitor',
        { 
          currentValue: health.metrics.errorRate,
          threshold: thresholds.errorRate
        }
      );
    }
    
    // 检查内存使用
    if (health.metrics.memoryUsage && health.metrics.memoryUsage > thresholds.memoryUsage) {
      this.createAlert(
        'performance',
        'warning',
        '内存使用过高',
        `当前内存使用 ${health.metrics.memoryUsage.toFixed(2)}MB 超过阈值 ${thresholds.memoryUsage}MB`,
        'ResourceMonitor',
        { 
          currentValue: health.metrics.memoryUsage,
          threshold: thresholds.memoryUsage
        }
      );
    }
  }

  /**
   * 私有方法
   */
  private setupEventListeners(): void {
    // 监听错误事件
    this.eventBus.subscribe('ERROR_OCCURRED', (event) => {
      if (event.payload.error.severity === 'critical') {
        this.createAlert(
          'error',
          'critical',
          '系统严重错误',
          event.payload.error.message,
          event.payload.context.component,
          { errorCode: event.payload.error.code }
        );
      }
    });
    
    // 监听性能事件
    this.eventBus.subscribe('PERFORMANCE_MEASURED', (event) => {
      const value = event.payload.metric.value;
      const name = event.payload.metric.name;
      
      // 检查特定性能指标
      if (name.includes('duration') && value > 5000) { // 5秒
        this.createAlert(
          'performance',
          'warning',
          '操作耗时过长',
          `${name} 耗时 ${value}ms`,
          event.payload.context.component,
          { metricName: name, value }
        );
      }
    });
  }

  private startReporting(): void {
    if (!this.config.enabled) return;
    
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    
    this.reportingTimer = setInterval(() => {
      try {
        this.generateReport();
        this.checkPerformanceThresholds();
        this.cleanupOldData();
      } catch (error) {
        console.error('❌ [MonitoringService] 定期报告生成失败:', error);
      }
    }, this.config.reportingInterval);
  }

  private assessComponentHealth(
    realtimeStats: any,
    errorStats: any
  ): SystemHealth['components'] {
    const errorRate = errorStats.recoverySuccessRate ? (1 - errorStats.recoverySuccessRate) * 100 : 0;
    const responseTime = realtimeStats.averageResponseTime;
    
    // 简化的健康评估逻辑
    const getHealthStatus = (errorRate: number, responseTime: number) => {
      if (errorRate > 10 || responseTime > 5000) return 'critical';
      if (errorRate > 5 || responseTime > 2000) return 'degraded';
      return 'healthy';
    };
    
    const baseHealth = getHealthStatus(errorRate, responseTime);
    
    return {
      dataProvider: baseHealth,
      validator: baseHealth,
      eventBus: baseHealth,
      errorRecovery: errorStats.recoverySuccessRate > 0.8 ? 'healthy' : 'degraded'
    };
  }

  private calculateOverallHealth(components: SystemHealth['components']): SystemHealth['overall'] {
    const values = Object.values(components);
    
    if (values.some(status => status === 'critical')) return 'critical';
    if (values.some(status => status === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // 转换为MB
    }
    return 0;
  }

  private collectPerformanceMetrics(timeRange: { from: number; to: number }) {
    const dataFetchMetrics = this.metricsCollector.getAggregation('data_fetch_duration', timeRange);
    const validationMetrics = this.metricsCollector.getAggregation('data_quality_score', timeRange);
    const matchingMetrics = this.metricsCollector.getAggregation('matching_duration', timeRange);
    
    return {
      totalRequests: (dataFetchMetrics?.count || 0) + (matchingMetrics?.count || 0),
      successRate: 0.95, // 占位符
      averageResponseTime: dataFetchMetrics?.avg || 0,
      
      dataFetch: {
        count: dataFetchMetrics?.count || 0,
        averageTime: dataFetchMetrics?.avg || 0,
        p95Time: dataFetchMetrics?.p95 || 0,
        successRate: 0.98 // 占位符
      },
      
      validation: {
        count: validationMetrics?.count || 0,
        averageTime: 0, // 需要从其他指标获取
        averageQuality: validationMetrics?.avg || 0,
        autoRepairRate: 0.15 // 占位符
      },
      
      matching: {
        count: matchingMetrics?.count || 0,
        averageTime: matchingMetrics?.avg || 0,
        averageAccuracy: 0.92, // 占位符
        strategyDistribution: {} // 占位符
      }
    };
  }

  private collectErrorMetrics(timeRange: { from: number; to: number }) {
    const errorStats = this.errorRecoveryService.getErrorStatistics();
    
    return {
      totalCount: errorStats.totalErrors,
      byCategory: errorStats.errorsByCategory,
      bySeverity: errorStats.errorsBySeverity,
      recoveryRate: errorStats.recoverySuccessRate,
      topErrors: [] // 占位符
    };
  }

  private collectResourceMetrics(timeRange: { from: number; to: number }) {
    return {
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: 0.85, // 占位符
      activeConnections: 1 // 占位符
    };
  }

  private storeReport(report: MonitoringReport): void {
    this.reports.push(report);
    
    // 限制报告数量
    if (this.reports.length > 100) {
      this.reports.shift();
    }
  }

  private sendAlert(alert: MonitoringAlert): void {
    if (!this.config.alerts.enabled) return;
    
    const channels = this.config.alerts.channels;
    
    if (channels.includes('console')) {
      const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.warn(`${emoji} [ALERT] ${alert.title}: ${alert.message}`);
    }
    
    if (channels.includes('event')) {
      this.eventBus.emit('WARNING_ISSUED', {
        warning: {
          code: `MONITORING_${alert.type.toUpperCase()}`,
          message: alert.message,
          severity: alert.severity === 'critical' ? 'important' : alert.severity
        },
        context: {
          component: alert.component,
          trigger: 'monitoring_service'
        },
        suggestion: '请检查系统状态并采取相应措施'
      }, 'MonitoringService').catch(console.error);
    }
    
    if (channels.includes('callback') && this.config.alerts.callback) {
      this.config.alerts.callback(alert);
    }
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const { retention } = this.config;
    
    // 清理过期告警
    for (const [id, alert] of this.alerts.entries()) {
      if (now - alert.timestamp > retention.alerts) {
        this.alerts.delete(id);
      }
    }
    
    // 清理过期报告
    this.reports = this.reports.filter(report => 
      now - report.timestamp <= retention.reports
    );
    
    console.log('🧹 [MonitoringService] 清理过期数据完成');
  }

  /**
   * 销毁监控服务
   */
  public destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    
    this.alerts.clear();
    this.reports = [];
    
    console.log('💥 [MonitoringService] 监控服务已销毁');
  }
}

export default StructuralMatchingMonitoringService;