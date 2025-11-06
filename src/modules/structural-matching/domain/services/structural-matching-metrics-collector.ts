// src/modules/structural-matching/domain/services/structural-matching-metrics-collector.ts
// module: structural-matching | layer: domain | role: 指标收集器
// summary: 系统性能和业务指标收集服务

import { StructuralMatchingEventBus } from '../events/structural-matching-event-bus';

/**
 * 指标类型
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer' | 'set';

/**
 * 指标单位
 */
export type MetricUnit = 'ms' | 'seconds' | 'bytes' | 'kb' | 'mb' | 'count' | 'percentage' | 'ratio';

/**
 * 指标标签
 */
export interface MetricTags {
  [key: string]: string | number | boolean;
}

/**
 * 基础指标接口
 */
export interface BaseMetric {
  name: string;
  type: MetricType;
  unit: MetricUnit;
  timestamp: number;
  tags: MetricTags;
  component: string;
}

/**
 * 计数器指标
 */
export interface CounterMetric extends BaseMetric {
  type: 'counter';
  value: number;
  increment?: number;
}

/**
 * 仪表指标
 */
export interface GaugeMetric extends BaseMetric {
  type: 'gauge';
  value: number;
  previousValue?: number;
}

/**
 * 直方图指标
 */
export interface HistogramMetric extends BaseMetric {
  type: 'histogram';
  value: number;
  buckets: number[];
  counts: number[];
}

/**
 * 计时器指标
 */
export interface TimerMetric extends BaseMetric {
  type: 'timer';
  duration: number;
  startTime: number;
  endTime: number;
}

/**
 * 集合指标
 */
export interface SetMetric extends BaseMetric {
  type: 'set';
  values: (string | number)[];
  uniqueCount: number;
}

/**
 * 所有指标类型的联合
 */
export type Metric = CounterMetric | GaugeMetric | HistogramMetric | TimerMetric | SetMetric;

/**
 * 指标聚合结果
 */
export interface MetricAggregation {
  name: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
}

/**
 * 指标收集配置
 */
export interface MetricsCollectorConfig {
  // 是否启用收集
  enabled: boolean;
  
  // 指标保留时间 (毫秒)
  retentionTime: number;
  
  // 最大指标数量
  maxMetrics: number;
  
  // 聚合间隔 (毫秒)
  aggregationInterval: number;
  
  // 是否启用实时监控
  enableRealtimeMonitoring: boolean;
  
  // 采样率 (0-1)
  samplingRate: number;
  
  // 默认标签
  defaultTags: MetricTags;
  
  // 过滤规则
  filters?: {
    includePatterns?: RegExp[];
    excludePatterns?: RegExp[];
    componentFilter?: string[];
  };
}

/**
 * 结构匹配指标收集器
 */
export class StructuralMatchingMetricsCollector {
  private static instance: StructuralMatchingMetricsCollector;
  private eventBus: StructuralMatchingEventBus;
  
  private metrics: Map<string, Metric[]> = new Map();
  private timers: Map<string, { startTime: number; tags: MetricTags }> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  
  private aggregationInterval: NodeJS.Timeout | null = null;
  
  private config: MetricsCollectorConfig = {
    enabled: true,
    retentionTime: 24 * 60 * 60 * 1000, // 24小时
    maxMetrics: 10000,
    aggregationInterval: 60 * 1000, // 1分钟
    enableRealtimeMonitoring: true,
    samplingRate: 1.0,
    defaultTags: {
      version: '1.0.0',
      module: 'structural-matching'
    },
    filters: {
      excludePatterns: [/^internal_/, /^debug_/]
    }
  };

  private constructor() {
    this.eventBus = StructuralMatchingEventBus.getInstance();
    this.setupEventListeners();
    this.startAggregation();
    
    console.log('📊 [MetricsCollector] 初始化指标收集器');
  }

  public static getInstance(): StructuralMatchingMetricsCollector {
    if (!this.instance) {
      this.instance = new StructuralMatchingMetricsCollector();
    }
    return this.instance;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<MetricsCollectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    console.log('⚙️ [MetricsCollector] 配置已更新:', newConfig);
    
    // 重新设置聚合间隔
    if (newConfig.aggregationInterval && this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.startAggregation();
    }
  }

  /**
   * 记录计数器指标
   */
  public incrementCounter(
    name: string,
    increment: number = 1,
    tags: MetricTags = {},
    component: string = 'unknown'
  ): void {
    if (!this.shouldCollect(name)) return;

    const key = this.getMetricKey(name, tags, component);
    const currentCount = this.counters.get(key) || 0;
    this.counters.set(key, currentCount + increment);

    const metric: CounterMetric = {
      name,
      type: 'counter',
      unit: 'count',
      timestamp: Date.now(),
      tags: { ...this.config.defaultTags, ...tags },
      component,
      value: currentCount + increment,
      increment
    };

    this.storeMetric(metric);
    this.emitRealtimeMetric(metric);
  }

  /**
   * 记录仪表指标
   */
  public recordGauge(
    name: string,
    value: number,
    unit: MetricUnit = 'count',
    tags: MetricTags = {},
    component: string = 'unknown'
  ): void {
    if (!this.shouldCollect(name)) return;

    const key = this.getMetricKey(name, tags, component);
    const previousValue = this.gauges.get(key);
    this.gauges.set(key, value);

    const metric: GaugeMetric = {
      name,
      type: 'gauge',
      unit,
      timestamp: Date.now(),
      tags: { ...this.config.defaultTags, ...tags },
      component,
      value,
      previousValue
    };

    this.storeMetric(metric);
    this.emitRealtimeMetric(metric);
  }

  /**
   * 开始计时
   */
  public startTimer(
    name: string,
    tags: MetricTags = {},
    component: string = 'unknown'
  ): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.timers.set(timerId, {
      startTime: performance.now(),
      tags: { ...this.config.defaultTags, ...tags, component }
    });

    return timerId;
  }

  /**
   * 结束计时
   */
  public endTimer(
    timerId: string,
    name?: string,
    unit: MetricUnit = 'ms'
  ): number | null {
    const timerData = this.timers.get(timerId);
    if (!timerData) {
      console.warn(`⚠️ [MetricsCollector] 计时器未找到: ${timerId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - timerData.startTime;
    
    this.timers.delete(timerId);

    if (!name || !this.shouldCollect(name)) return duration;

    const metric: TimerMetric = {
      name: name || 'timer',
      type: 'timer',
      unit,
      timestamp: Date.now(),
      tags: timerData.tags,
      component: (timerData.tags.component as string) || 'unknown',
      duration,
      startTime: timerData.startTime,
      endTime
    };

    this.storeMetric(metric);
    this.emitRealtimeMetric(metric);

    return duration;
  }

  /**
   * 记录直方图指标
   */
  public recordHistogram(
    name: string,
    value: number,
    buckets: number[] = [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    unit: MetricUnit = 'ms',
    tags: MetricTags = {},
    component: string = 'unknown'
  ): void {
    if (!this.shouldCollect(name)) return;

    const counts = new Array(buckets.length).fill(0);
    for (let i = 0; i < buckets.length; i++) {
      if (value <= buckets[i]) {
        counts[i]++;
        break;
      }
    }

    const metric: HistogramMetric = {
      name,
      type: 'histogram',
      unit,
      timestamp: Date.now(),
      tags: { ...this.config.defaultTags, ...tags },
      component,
      value,
      buckets,
      counts
    };

    this.storeMetric(metric);
    this.emitRealtimeMetric(metric);
  }

  /**
   * 记录集合指标
   */
  public recordSet(
    name: string,
    values: (string | number)[],
    unit: MetricUnit = 'count',
    tags: MetricTags = {},
    component: string = 'unknown'
  ): void {
    if (!this.shouldCollect(name)) return;

    const uniqueValues = [...new Set(values)];

    const metric: SetMetric = {
      name,
      type: 'set',
      unit,
      timestamp: Date.now(),
      tags: { ...this.config.defaultTags, ...tags },
      component,
      values: uniqueValues,
      uniqueCount: uniqueValues.length
    };

    this.storeMetric(metric);
    this.emitRealtimeMetric(metric);
  }

  /**
   * 业务指标便捷方法
   */
  public recordDataFetchTime(duration: number, source: string, success: boolean): void {
    this.recordHistogram('data_fetch_duration', duration, undefined, 'ms', {
      source,
      success: success.toString()
    }, 'DataProvider');
  }

  public recordValidationResult(quality: number, hasErrors: boolean, repairApplied: boolean): void {
    this.recordGauge('data_quality_score', quality, 'percentage', {
      has_errors: hasErrors.toString(),
      repair_applied: repairApplied.toString()
    }, 'DataValidator');
  }

  public recordMatchingPerformance(
    algorithm: string,
    elementCount: number,
    duration: number,
    accuracy: number
  ): void {
    this.recordHistogram('matching_duration', duration, undefined, 'ms', {
      algorithm,
      element_count_range: this.getElementCountRange(elementCount)
    }, 'MatchingEngine');
    
    this.recordGauge('matching_accuracy', accuracy, 'percentage', {
      algorithm
    }, 'MatchingEngine');
  }

  public recordUserInteraction(action: string, component: string, success: boolean): void {
    this.incrementCounter('user_interactions', 1, {
      action,
      success: success.toString()
    }, component);
  }

  public recordErrorOccurrence(category: string, severity: string, recovered: boolean): void {
    this.incrementCounter('errors_total', 1, {
      category,
      severity,
      recovered: recovered.toString()
    }, 'ErrorRecovery');
  }

  /**
   * 获取指标数据
   */
  public getMetrics(
    name?: string,
    timeRange?: { from: number; to: number },
    tags?: MetricTags
  ): Metric[] {
    let allMetrics: Metric[] = [];

    if (name) {
      const metrics = this.metrics.get(name) || [];
      allMetrics = metrics;
    } else {
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics);
      }
    }

    // 应用时间范围过滤
    if (timeRange) {
      allMetrics = allMetrics.filter(m => 
        m.timestamp >= timeRange.from && m.timestamp <= timeRange.to
      );
    }

    // 应用标签过滤
    if (tags) {
      allMetrics = allMetrics.filter(m => {
        return Object.entries(tags).every(([key, value]) => 
          m.tags[key] === value
        );
      });
    }

    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取聚合统计
   */
  public getAggregation(
    name: string,
    timeRange?: { from: number; to: number },
    tags?: MetricTags
  ): MetricAggregation | null {
    const metrics = this.getMetrics(name, timeRange, tags);
    
    if (metrics.length === 0) return null;

    const values = metrics.map(m => {
      switch (m.type) {
        case 'counter':
        case 'gauge':
          return m.value;
        case 'timer':
          return m.duration;
        case 'histogram':
          return m.value;
        case 'set':
          return m.uniqueCount;
        default:
          return 0;
      }
    }).filter(v => typeof v === 'number');

    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    // 计算百分位数
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    // 计算标准差
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      name,
      count: values.length,
      sum,
      avg,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
      stdDev
    };
  }

  /**
   * 获取实时统计摘要
   */
  public getRealtimeStats(): {
    totalMetrics: number;
    metricsPerSecond: number;
    topComponents: Array<{ name: string; count: number }>;
    recentErrors: number;
    averageResponseTime: number;
  } {
    const now = Date.now();
    const lastMinute = now - 60 * 1000;
    
    let totalMetrics = 0;
    const componentCounts: Record<string, number> = {};
    let recentMetrics = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let recentErrors = 0;

    for (const metrics of this.metrics.values()) {
      totalMetrics += metrics.length;
      
      for (const metric of metrics) {
        componentCounts[metric.component] = (componentCounts[metric.component] || 0) + 1;
        
        if (metric.timestamp >= lastMinute) {
          recentMetrics++;
          
          if (metric.type === 'timer') {
            totalResponseTime += metric.duration;
            responseTimeCount++;
          }
          
          if (metric.name.includes('error')) {
            recentErrors++;
          }
        }
      }
    }

    const topComponents = Object.entries(componentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalMetrics,
      metricsPerSecond: recentMetrics / 60,
      topComponents,
      recentErrors,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0
    };
  }

  /**
   * 私有方法
   */
  private shouldCollect(name: string): boolean {
    if (!this.config.enabled) return false;
    
    // 采样率检查
    if (Math.random() > this.config.samplingRate) return false;
    
    // 过滤规则检查
    const { filters } = this.config;
    if (filters) {
      if (filters.excludePatterns?.some(pattern => pattern.test(name))) return false;
      if (filters.includePatterns?.length && 
          !filters.includePatterns.some(pattern => pattern.test(name))) return false;
    }
    
    return true;
  }

  private getMetricKey(name: string, tags: MetricTags, component: string): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${component}:${name}:${tagString}`;
  }

  private storeMetric(metric: Metric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metrics = this.metrics.get(metric.name)!;
    metrics.push(metric);
    
    // 限制指标数量
    if (metrics.length > this.config.maxMetrics) {
      metrics.shift();
    }
    
    // 清理过期指标
    const cutoff = Date.now() - this.config.retentionTime;
    const filtered = metrics.filter(m => m.timestamp > cutoff);
    this.metrics.set(metric.name, filtered);
  }

  private emitRealtimeMetric(metric: Metric): void {
    if (!this.config.enableRealtimeMonitoring) return;
    
    this.eventBus.emit('PERFORMANCE_MEASURED', {
      metric: {
        name: metric.name,
        value: this.getMetricValue(metric),
        unit: metric.unit
      },
      context: {
        operation: 'metric_collection',
        component: metric.component,
        dataSize: JSON.stringify(metric).length
      }
    }, 'MetricsCollector').catch(error => {
      console.error('❌ [MetricsCollector] 发射实时指标失败:', error);
    });
  }

  private getMetricValue(metric: Metric): number {
    switch (metric.type) {
      case 'counter':
      case 'gauge':
        return metric.value;
      case 'timer':
        return metric.duration;
      case 'histogram':
        return metric.value;
      case 'set':
        return metric.uniqueCount;
      default:
        return 0;
    }
  }

  private setupEventListeners(): void {
    // 监听各种事件来自动收集指标
    this.eventBus.subscribe('DATA_FETCHED', (event) => {
      this.recordDataFetchTime(
        event.payload.fetchTime,
        event.payload.source,
        true
      );
    });

    this.eventBus.subscribe('DATA_VALIDATED', (event) => {
      this.recordValidationResult(
        event.payload.validation.qualityScore || 0,
        event.payload.validation.hasErrors,
        event.payload.autoRepairApplied
      );
    });

    this.eventBus.subscribe('ERROR_OCCURRED', (event) => {
      this.recordErrorOccurrence(
        event.payload.context.component,
        event.payload.error.severity,
        event.payload.recovery?.successful || false
      );
    });
  }

  private startAggregation(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    this.aggregationInterval = setInterval(() => {
      this.performAggregation();
    }, this.config.aggregationInterval);
  }

  private performAggregation(): void {
    const stats = this.getRealtimeStats();
    
    console.log('📈 [MetricsCollector] 定期聚合统计:', {
      totalMetrics: stats.totalMetrics,
      metricsPerSecond: stats.metricsPerSecond.toFixed(2),
      recentErrors: stats.recentErrors,
      avgResponseTime: stats.averageResponseTime.toFixed(2) + 'ms'
    });
  }

  private getElementCountRange(count: number): string {
    if (count <= 10) return 'small';
    if (count <= 50) return 'medium';
    if (count <= 200) return 'large';
    return 'xlarge';
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    this.metrics.clear();
    this.timers.clear();
    this.counters.clear();
    this.gauges.clear();
    
    console.log('🧹 [MetricsCollector] 指标收集器已销毁');
  }
}

export default StructuralMatchingMetricsCollector;