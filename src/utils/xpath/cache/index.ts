// src/utils/xpath/cache/index.ts
// module: shared | layer: utils | role: utility
// summary: 工具函数

/**
 * 缓存模块统一导出文件
 * 
 * 集中导出所有缓存相关的类和工具
 */

// XPath预编译缓存
export {
  XPathPrecompilerCache,
  XPathPerformanceOptimizer,
  globalXPathCache,
  type CompiledSelector,
  type CacheConfig
} from './XPathPrecompilerCache';

// XML重用管理
export {
  XmlReuseManager,
  XmlDiffDetector,
  globalXmlReuseManager,
  type XmlCacheEntry,
  type XmlReuseConfig
} from './XmlReuseManager';

// 导入类型和实例用于内部使用
import {
  XPathPrecompilerCache,
  globalXPathCache,
  type CacheConfig
} from './XPathPrecompilerCache';

import {
  XmlReuseManager,
  globalXmlReuseManager,
  type XmlReuseConfig
} from './XmlReuseManager';

/**
 * 缓存管理器工厂
 */
export class CacheManagerFactory {
  
  /**
   * 创建XPath缓存实例
   */
  static createXPathCache(config?: Partial<CacheConfig>): XPathPrecompilerCache {
    return new XPathPrecompilerCache(config);
  }

  /**
   * 创建XML重用管理器实例
   */
  static createXmlReuseManager(config?: Partial<XmlReuseConfig>): XmlReuseManager {
    return new XmlReuseManager(config);
  }

  /**
   * 获取全局缓存统计
   */
  static getGlobalCacheStats(): {
    xpath: ReturnType<XPathPrecompilerCache['getCacheStats']>;
    xml: ReturnType<XmlReuseManager['getCacheStats']>;
  } {
    return {
      xpath: globalXPathCache.getCacheStats(),
      xml: globalXmlReuseManager.getCacheStats()
    };
  }

  /**
   * 清理所有全局缓存
   */
  static clearAllGlobalCaches(): void {
    globalXPathCache.clearCache();
    globalXmlReuseManager.clearAllCache();
  }

  /**
   * 预热所有缓存
   */
  static async warmupCaches(deviceIds: string[] = []): Promise<void> {
    // 预编译常用XPath选择器
    globalXPathCache.precompileCommonSelectors();
    
    // 预加载设备XML（如果提供了设备ID）
    if (deviceIds.length > 0) {
      await globalXmlReuseManager.preloadXmlCache(deviceIds);
    }
  }
}

/**
 * 统一缓存接口
 */
export interface UnifiedCacheInterface {
  /** 获取缓存统计 */
  getStats(): any;
  /** 清理缓存 */
  clear(): void;
  /** 清理过期项 */
  cleanExpired(): number;
}

/**
 * 缓存监控器
 */
export class CacheMonitor {
  private static instance: CacheMonitor;
  private monitoringEnabled = false;
  private monitorInterval?: NodeJS.Timeout;

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  /**
   * 开始监控缓存性能
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringEnabled) return;

    this.monitoringEnabled = true;
    this.monitorInterval = setInterval(() => {
      this.logCacheMetrics();
    }, intervalMs);

    console.log('✅ 缓存监控已启动');
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
    this.monitoringEnabled = false;
    console.log('⏹️ 缓存监控已停止');
  }

  /**
   * 记录缓存指标
   */
  private logCacheMetrics(): void {
    const stats = CacheManagerFactory.getGlobalCacheStats();
    
    console.group('📊 缓存性能报告');
    console.log('XPath缓存:', {
      '缓存数量': stats.xpath.totalCached,
      '高频选择器': stats.xpath.highFrequencyCount,
      '平均使用次数': stats.xpath.averageUsage,
      '命中率': `${stats.xpath.hitRate}%`
    });
    
    console.log('XML缓存:', {
      '缓存条目': stats.xml.totalEntries,
      '总使用次数': stats.xml.totalUsage,
      '平均年龄': `${stats.xml.averageAge}秒`,
      '命中率': `${stats.xml.hitRate}%`
    });
    console.groupEnd();
  }

  /**
   * 获取监控状态
   */
  isMonitoring(): boolean {
    return this.monitoringEnabled;
  }
}

// 默认导出全局缓存管理器
export default CacheManagerFactory;