/**
 * PerformanceMetrics.ts
 * 性能指标评估模块
 * 
 * @description 提供策略执行性能的全面监控和评估
 */

import type {
  PerformanceMetrics,
  PerformanceLevel,
  PerformanceBenchmark
} from './types';

/**
 * 性能指标评估器
 * 
 * @description 监控和评估策略执行的各项性能指标
 */
export class PerformanceMetricsEvaluator {
  private benchmark: PerformanceBenchmark;
  private metricsHistory: PerformanceRecord[] = [];
  private isMonitoring: boolean = false;
  private currentSession?: PerformanceSession;

  constructor(benchmark?: Partial<PerformanceBenchmark>) {
    this.benchmark = {
      maxExecutionTime: 5000,     // 5秒
      minSuccessRate: 0.95,       // 95%
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxCpuUsage: 0.8,           // 80%
      ...benchmark
    };
  }

  /**
   * 开始性能监控会话
   */
  startPerformanceSession(sessionId: string): void {
    this.currentSession = {
      sessionId,
      startTime: performance.now(),
      operations: [],
      memoryStart: this.getCurrentMemoryUsage(),
      cpuStart: this.getCurrentCpuUsage()
    };
    this.isMonitoring = true;
  }

  /**
   * 快速评估策略性能
   */
  async evaluatePerformance(
    strategy: any,
    element: any,
    xmlContent: string
  ): Promise<PerformanceMetrics> {
    const operationName = `strategy_${strategy}_evaluation`;
    
    const { metrics } = await this.evaluateExecution(operationName, async () => {
      // 模拟策略执行过程
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return { success: true };
    });

    return metrics;
  }

  /**
   * 结束性能监控会话
   */
  endPerformanceSession(): PerformanceMetrics | null {
    if (!this.currentSession) {
      return null;
    }

    const endTime = performance.now();
    const session = this.currentSession;
    
    // 计算总体指标
    const executionTime = endTime - session.startTime;
    const memoryUsage = this.getCurrentMemoryUsage() - session.memoryStart;
    const cpuUsage = this.getCurrentCpuUsage() - session.cpuStart;
    
    // 计算成功率
    const totalOperations = session.operations.length;
    const successfulOperations = session.operations.filter(op => op.success).length;
    const successRate = totalOperations > 0 ? successfulOperations / totalOperations : 1;

    // 生成性能指标
    const metrics: PerformanceMetrics = {
      executionTime,
      successRate,
      memoryUsage,
      cpuUsage,
      level: this.calculatePerformanceLevel(executionTime, successRate, memoryUsage, cpuUsage),
      score: this.calculatePerformanceScore(executionTime, successRate, memoryUsage, cpuUsage)
    };

    // 记录历史
    this.recordPerformanceMetrics(session.sessionId, metrics);
    
    // 清理会话
    this.currentSession = undefined;
    this.isMonitoring = false;

    return metrics;
  }

  /**
   * 记录单个操作
   */
  recordOperation(operation: PerformanceOperation): void {
    if (!this.isMonitoring || !this.currentSession) {
      return;
    }

    this.currentSession.operations.push({
      ...operation,
      timestamp: performance.now()
    });
  }

  /**
   * 快速评估单次执行性能
   */
  async evaluateExecution<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const sessionId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.startPerformanceSession(sessionId);
    
    const startTime = performance.now();
    let result: T;
    let success = true;
    let error: Error | undefined;

    try {
      result = await operation();
    } catch (err) {
      success = false;
      error = err as Error;
      throw err;
    } finally {
      const endTime = performance.now();
      
      this.recordOperation({
        name: operationName,
        duration: endTime - startTime,
        success,
        error: error?.message,
        memoryDelta: 0, // 在实际应用中可以更精确计算
        metadata: {}
      });
    }

    const metrics = this.endPerformanceSession();
    
    return {
      result: result!,
      metrics: metrics!
    };
  }

  /**
   * 批量评估性能
   */
  async evaluateBatchExecution<T>(
    operations: Array<{ name: string; fn: () => Promise<T> }>
  ): Promise<BatchPerformanceResult<T>> {
    const sessionId = `batch_${Date.now()}`;
    this.startPerformanceSession(sessionId);

    const results: Array<{ name: string; result?: T; error?: Error; metrics: PerformanceOperation }> = [];
    
    for (const { name, fn } of operations) {
      const startTime = performance.now();
      let result: T | undefined;
      let success = true;
      let error: Error | undefined;

      try {
        result = await fn();
      } catch (err) {
        success = false;
        error = err as Error;
      }

      const endTime = performance.now();
      const operationMetrics: PerformanceOperation = {
        name,
        duration: endTime - startTime,
        success,
        error: error?.message,
        memoryDelta: 0,
        metadata: {}
      };

      this.recordOperation(operationMetrics);
      
      results.push({
        name,
        result,
        error,
        metrics: operationMetrics
      });
    }

    const overallMetrics = this.endPerformanceSession();

    return {
      results,
      overallMetrics: overallMetrics!,
      statistics: this.calculateBatchStatistics(results)
    };
  }

  /**
   * 获取性能历史
   */
  getPerformanceHistory(limit?: number): PerformanceRecord[] {
    const history = [...this.metricsHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 获取性能趋势分析
   */
  getPerformanceTrends(timeRange?: number): PerformanceTrends {
    const cutoffTime = timeRange ? Date.now() - timeRange : 0;
    const relevantHistory = this.metricsHistory.filter(
      record => record.timestamp > cutoffTime
    );

    if (relevantHistory.length === 0) {
      return this.createEmptyTrends();
    }

    return {
      averageExecutionTime: this.calculateAverage(relevantHistory, 'executionTime'),
      averageSuccessRate: this.calculateAverage(relevantHistory, 'successRate'),
      averageMemoryUsage: this.calculateAverage(relevantHistory, 'memoryUsage'),
      averageCpuUsage: this.calculateAverage(relevantHistory, 'cpuUsage'),
      averageScore: this.calculateAverage(relevantHistory, 'score'),
      trend: this.calculateTrendDirection(relevantHistory),
      sampleSize: relevantHistory.length,
      timeRange: timeRange || (Date.now() - relevantHistory[0].timestamp)
    };
  }

  /**
   * 重置性能基准
   */
  updateBenchmark(newBenchmark: Partial<PerformanceBenchmark>): void {
    this.benchmark = {
      ...this.benchmark,
      ...newBenchmark
    };
  }

  /**
   * 清理历史记录
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }

  // === 私有方法 ===

  /**
   * 计算性能级别
   */
  private calculatePerformanceLevel(
    executionTime: number,
    successRate: number,
    memoryUsage: number,
    cpuUsage: number
  ): PerformanceLevel {
    let score = 0;

    // 执行时间评分 (25%)
    if (executionTime <= this.benchmark.maxExecutionTime * 0.5) score += 25;
    else if (executionTime <= this.benchmark.maxExecutionTime * 0.8) score += 20;
    else if (executionTime <= this.benchmark.maxExecutionTime) score += 15;
    else score += 5;

    // 成功率评分 (30%)
    if (successRate >= this.benchmark.minSuccessRate) score += 30;
    else if (successRate >= 0.9) score += 25;
    else if (successRate >= 0.8) score += 20;
    else if (successRate >= 0.7) score += 15;
    else score += 5;

    // 内存使用评分 (25%)
    if (memoryUsage <= this.benchmark.maxMemoryUsage * 0.5) score += 25;
    else if (memoryUsage <= this.benchmark.maxMemoryUsage * 0.8) score += 20;
    else if (memoryUsage <= this.benchmark.maxMemoryUsage) score += 15;
    else score += 5;

    // CPU使用评分 (20%)
    if (cpuUsage <= this.benchmark.maxCpuUsage * 0.5) score += 20;
    else if (cpuUsage <= this.benchmark.maxCpuUsage * 0.8) score += 16;
    else if (cpuUsage <= this.benchmark.maxCpuUsage) score += 12;
    else score += 4;

    // 根据总分确定级别
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * 计算性能分数
   */
  private calculatePerformanceScore(
    executionTime: number,
    successRate: number,
    memoryUsage: number,
    cpuUsage: number
  ): number {
    // 执行时间分数 (0-25)
    const timeScore = Math.max(0, 25 - (executionTime / this.benchmark.maxExecutionTime) * 25);
    
    // 成功率分数 (0-30)
    const successScore = successRate * 30;
    
    // 内存使用分数 (0-25)
    const memoryScore = Math.max(0, 25 - (memoryUsage / this.benchmark.maxMemoryUsage) * 25);
    
    // CPU使用分数 (0-20)
    const cpuScore = Math.max(0, 20 - (cpuUsage / this.benchmark.maxCpuUsage) * 20);

    return Math.round(timeScore + successScore + memoryScore + cpuScore);
  }

  /**
   * 获取当前内存使用量
   */
  private getCurrentMemoryUsage(): number {
    // 在浏览器环境中，这个信息可能有限
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      return (window.performance as any).memory?.usedJSHeapSize || 0;
    }
    
    // Node.js环境
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    return 0;
  }

  /**
   * 获取当前CPU使用率（简化实现）
   */
  private getCurrentCpuUsage(): number {
    // 这是一个简化的实现，实际应用中可能需要更复杂的CPU监控
    // 在浏览器环境中很难准确获取CPU使用率
    return 0;
  }

  /**
   * 记录性能指标到历史记录
   */
  private recordPerformanceMetrics(sessionId: string, metrics: PerformanceMetrics): void {
    this.metricsHistory.push({
      sessionId,
      timestamp: Date.now(),
      metrics
    });

    // 保持历史记录在合理范围内
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-500);
    }
  }

  /**
   * 计算批量统计
   */
  private calculateBatchStatistics(
    results: Array<{ name: string; result?: any; error?: Error; metrics: PerformanceOperation }>
  ): BatchStatistics {
    const total = results.length;
    const successful = results.filter(r => !r.error).length;
    const failed = total - successful;
    
    const durations = results.map(r => r.metrics.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / total;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return {
      totalOperations: total,
      successfulOperations: successful,
      failedOperations: failed,
      successRate: successful / total,
      averageDuration: avgDuration,
      maxDuration,
      minDuration,
      totalDuration: durations.reduce((sum, d) => sum + d, 0)
    };
  }

  /**
   * 计算平均值
   */
  private calculateAverage(records: PerformanceRecord[], field: keyof PerformanceMetrics): number {
    if (records.length === 0) return 0;
    const sum = records.reduce((total, record) => total + (record.metrics[field] as number), 0);
    return sum / records.length;
  }

  /**
   * 计算趋势方向
   */
  private calculateTrendDirection(records: PerformanceRecord[]): 'improving' | 'declining' | 'stable' {
    if (records.length < 2) return 'stable';

    const mid = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, mid);
    const secondHalf = records.slice(mid);

    const firstHalfAvg = this.calculateAverage(firstHalf, 'score');
    const secondHalfAvg = this.calculateAverage(secondHalf, 'score');

    const difference = secondHalfAvg - firstHalfAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * 创建空趋势对象
   */
  private createEmptyTrends(): PerformanceTrends {
    return {
      averageExecutionTime: 0,
      averageSuccessRate: 0,
      averageMemoryUsage: 0,
      averageCpuUsage: 0,
      averageScore: 0,
      trend: 'stable',
      sampleSize: 0,
      timeRange: 0
    };
  }
}

// === 辅助类型 ===

/**
 * 性能会话
 */
interface PerformanceSession {
  sessionId: string;
  startTime: number;
  operations: PerformanceOperation[];
  memoryStart: number;
  cpuStart: number;
}

/**
 * 性能操作记录
 */
export interface PerformanceOperation {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
  memoryDelta: number;
  metadata: Record<string, any>;
  timestamp?: number;
}

/**
 * 性能记录
 */
export interface PerformanceRecord {
  sessionId: string;
  timestamp: number;
  metrics: PerformanceMetrics;
}

/**
 * 批量性能结果
 */
export interface BatchPerformanceResult<T> {
  results: Array<{
    name: string;
    result?: T;
    error?: Error;
    metrics: PerformanceOperation;
  }>;
  overallMetrics: PerformanceMetrics;
  statistics: BatchStatistics;
}

/**
 * 批量统计
 */
export interface BatchStatistics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  totalDuration: number;
}

/**
 * 性能趋势
 */
export interface PerformanceTrends {
  averageExecutionTime: number;
  averageSuccessRate: number;
  averageMemoryUsage: number;
  averageCpuUsage: number;
  averageScore: number;
  trend: 'improving' | 'declining' | 'stable';
  sampleSize: number;
  timeRange: number;
}

// === 便捷函数 ===

/**
 * 创建性能评估器
 */
export function createPerformanceEvaluator(benchmark?: Partial<PerformanceBenchmark>): PerformanceMetricsEvaluator {
  return new PerformanceMetricsEvaluator(benchmark);
}

/**
 * 快速性能测试
 */
export async function quickPerformanceTest<T>(
  name: string,
  operation: () => Promise<T>,
  benchmark?: Partial<PerformanceBenchmark>
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const evaluator = createPerformanceEvaluator(benchmark);
  return await evaluator.evaluateExecution(name, operation);
}