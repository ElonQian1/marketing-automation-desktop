// src/services/xml-cache-performance-monitor.ts
// module: xml | layer: service | role: performance-monitor
// summary: XML缓存性能监控与用户体验优化

import { XmlCacheManager } from './xml-cache-manager';

export interface CachePerformanceMetrics {
  /** 加载时间统计 */
  loadingTimes: {
    averageMs: number;
    lastLoadMs: number;
    fastestLoadMs: number;
    slowestLoadMs: number;
  };
  /** 缓存命中统计 */
  cacheHits: {
    memoryHits: number;
    persistentHits: number;
    misses: number;
    hitRate: number;
  };
  /** 用户体验指标 */
  userExperience: {
    fastLoads: number; // <100ms的加载
    acceptableLoads: number; // 100-500ms的加载  
    slowLoads: number; // >500ms的加载
    overallScore: 'excellent' | 'good' | 'fair' | 'poor';
  };
  /** 优化建议 */
  recommendations: string[];
}

/**
 * XML缓存性能监控器
 * 
 * 功能：
 * 1. 实时监控缓存加载性能
 * 2. 提供用户友好的性能报告
 * 3. 给出针对性的优化建议
 * 4. 自动检测性能瓶颈
 */
class XmlCachePerformanceMonitor {
  private static instance: XmlCachePerformanceMonitor;
  private loadingTimes: number[] = [];
  private cacheHitStats = { memory: 0, persistent: 0, miss: 0 };
  private lastReportTime = Date.now();
  
  private constructor() {}

  static getInstance(): XmlCachePerformanceMonitor {
    if (!this.instance) {
      this.instance = new XmlCachePerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * 记录缓存加载性能
   */
  recordCacheLoad(startTime: number, source: 'memory' | 'persistent' | 'miss'): void {
    const loadTime = Date.now() - startTime;
    this.loadingTimes.push(loadTime);
    
    // 保留最近50次记录
    if (this.loadingTimes.length > 50) {
      this.loadingTimes.shift();
    }

    // 更新命中统计
    switch (source) {
      case 'memory':
        this.cacheHitStats.memory++;
        break;
      case 'persistent':
        this.cacheHitStats.persistent++;
        break;
      case 'miss':
        this.cacheHitStats.miss++;
        break;
    }

    // 记录性能日志
    if (loadTime > 1000) {
      console.warn(`⚠️ XML缓存加载较慢: ${loadTime}ms (来源: ${source})`);
    } else if (loadTime < 50) {
      console.log(`⚡ XML缓存加载快速: ${loadTime}ms (来源: ${source})`);
    }
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): CachePerformanceMetrics {
    const times = this.loadingTimes;
    const totalHits = this.cacheHitStats.memory + this.cacheHitStats.persistent;
    const totalRequests = totalHits + this.cacheHitStats.miss;

    // 计算加载时间统计
    const loadingTimes = {
      averageMs: times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : 0,
      lastLoadMs: times[times.length - 1] || 0,
      fastestLoadMs: times.length > 0 ? Math.min(...times) : 0,
      slowestLoadMs: times.length > 0 ? Math.max(...times) : 0,
    };

    // 计算缓存命中统计
    const cacheHits = {
      memoryHits: this.cacheHitStats.memory,
      persistentHits: this.cacheHitStats.persistent,
      misses: this.cacheHitStats.miss,
      hitRate: totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) / 100 : 0,
    };

    // 计算用户体验指标
    const fastLoads = times.filter(t => t < 100).length;
    const acceptableLoads = times.filter(t => t >= 100 && t <= 500).length;
    const slowLoads = times.filter(t => t > 500).length;
    
    let overallScore: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (loadingTimes.averageMs < 100 && cacheHits.hitRate > 0.8) {
      overallScore = 'excellent';
    } else if (loadingTimes.averageMs < 300 && cacheHits.hitRate > 0.6) {
      overallScore = 'good';
    } else if (loadingTimes.averageMs < 800 && cacheHits.hitRate > 0.4) {
      overallScore = 'fair';
    }

    const userExperience = {
      fastLoads,
      acceptableLoads,
      slowLoads,
      overallScore,
    };

    // 生成优化建议
    const recommendations = this.generateRecommendations(loadingTimes, cacheHits, userExperience);

    return {
      loadingTimes,
      cacheHits,
      userExperience,
      recommendations,
    };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(
    loadingTimes: CachePerformanceMetrics['loadingTimes'],
    cacheHits: CachePerformanceMetrics['cacheHits'],
    userExperience: CachePerformanceMetrics['userExperience']
  ): string[] {
    const recommendations: string[] = [];

    // 缓存命中率建议
    if (cacheHits.hitRate < 0.5) {
      recommendations.push('缓存命中率较低，建议增加内存缓存大小或检查缓存策略');
    } else if (cacheHits.hitRate > 0.9) {
      recommendations.push('缓存命中率很高，性能表现优秀！');
    }

    // 加载速度建议
    if (loadingTimes.averageMs > 500) {
      recommendations.push('平均加载时间过长，建议启用缓存预热功能');
    } else if (loadingTimes.averageMs < 100) {
      recommendations.push('加载速度很快，用户体验优秀！');
    }

    // 内存使用建议
    const xmlCacheManager = XmlCacheManager.getInstance();
    const performanceStats = xmlCacheManager.getPerformanceStats();
    
    if (performanceStats.memoryUsage.utilizationRate > 0.9) {
      recommendations.push('内存缓存使用率过高，建议适当增加内存缓存容量');
    } else if (performanceStats.memoryUsage.utilizationRate < 0.3) {
      recommendations.push('内存缓存利用率较低，可以适当减少缓存容量');
    }

    // 用户体验建议
    if (userExperience.slowLoads > userExperience.fastLoads) {
      recommendations.push('慢加载次数较多，建议执行缓存清理或重启应用');
    }

    // 没有问题时的正面反馈
    if (recommendations.length === 0) {
      recommendations.push('缓存性能表现良好，无需特别优化');
    }

    return recommendations;
  }

  /**
   * 自动性能检查与提醒
   */
  checkPerformanceAndNotify(): void {
    const now = Date.now();
    
    // 每5分钟检查一次
    if (now - this.lastReportTime < 5 * 60 * 1000) {
      return;
    }

    this.lastReportTime = now;
    const report = this.generatePerformanceReport();

    // 性能警告
    if (report.userExperience.overallScore === 'poor') {
      console.warn('⚠️ XML缓存性能较差，建议执行优化操作:', report.recommendations);
    } else if (report.userExperience.overallScore === 'excellent') {
      console.log('✅ XML缓存性能优秀！', `平均加载: ${report.loadingTimes.averageMs}ms, 命中率: ${report.cacheHits.hitRate * 100}%`);
    }
  }

  /**
   * 获取简化的性能摘要（用于UI显示）
   */
  getPerformanceSummary(): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    message: string;
    details: string;
  } {
    const report = this.generatePerformanceReport();
    
    let message = '';
    let details = '';

    switch (report.userExperience.overallScore) {
      case 'excellent':
        message = '缓存性能优秀';
        details = `平均${report.loadingTimes.averageMs}ms，命中率${Math.round(report.cacheHits.hitRate * 100)}%`;
        break;
      case 'good':
        message = '缓存性能良好';
        details = `平均${report.loadingTimes.averageMs}ms，建议适当优化`;
        break;
      case 'fair':
        message = '缓存性能一般';
        details = `平均${report.loadingTimes.averageMs}ms，建议执行清理`;
        break;
      case 'poor':
        message = '缓存性能较差';
        details = `平均${report.loadingTimes.averageMs}ms，请立即优化`;
        break;
    }

    return {
      status: report.userExperience.overallScore,
      message,
      details,
    };
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.loadingTimes = [];
    this.cacheHitStats = { memory: 0, persistent: 0, miss: 0 };
    this.lastReportTime = Date.now();
    console.log('🔄 性能监控统计已重置');
  }
}

// 导出单例
export const xmlCachePerformanceMonitor = XmlCachePerformanceMonitor.getInstance();

// 包装原始的getCachedXml方法，添加性能监控
const originalGetCachedXml = XmlCacheManager.prototype.getCachedXml;
XmlCacheManager.prototype.getCachedXml = async function(cacheId: string) {
  const startTime = Date.now();
  const result = await originalGetCachedXml.call(this, cacheId);
  
  // 记录性能数据
  let source: 'memory' | 'persistent' | 'miss';
  if (result) {
    // 判断是从内存还是持久化存储获取的（简化判断）
    source = Date.now() - startTime < 10 ? 'memory' : 'persistent';
  } else {
    source = 'miss';
  }
  
  xmlCachePerformanceMonitor.recordCacheLoad(startTime, source);
  xmlCachePerformanceMonitor.checkPerformanceAndNotify();
  
  return result;
};

export default XmlCachePerformanceMonitor;