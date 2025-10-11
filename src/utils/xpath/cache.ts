// src/utils/xpath/cache.ts
// module: shared | layer: utils | role: utility
// summary: 工具函数

/**
 * XPath 缓存管理器
 * 为频繁调用的 XPath 操作提供智能缓存，显著提升性能
 */

export interface XPathCacheConfig {
  /** 验证缓存最大条目数 */
  maxValidationEntries?: number;
  /** 生成缓存最大条目数 */
  maxGenerationEntries?: number;
  /** 缓存过期时间（毫秒） */
  ttl?: number;
  /** 是否启用性能监控 */
  enablePerformanceTracking?: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hitCount: number;
}

interface PerformanceMetrics {
  validationHits: number;
  validationMisses: number;
  generationHits: number;
  generationMisses: number;
  totalComputeTime: number;
  cacheMemoryUsage: number;
}

/**
 * 高性能 XPath 缓存管理器
 */
export class XPathCacheManager {
  private validationCache = new Map<string, CacheEntry<boolean>>();
  private generationCache = new Map<string, CacheEntry<string | null>>();
  private config: Required<XPathCacheConfig>;
  private metrics: PerformanceMetrics;

  constructor(config: XPathCacheConfig = {}) {
    this.config = {
      maxValidationEntries: config.maxValidationEntries ?? 1000,
      maxGenerationEntries: config.maxGenerationEntries ?? 500,
      ttl: config.ttl ?? 5 * 60 * 1000, // 5分钟
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
    };

    this.metrics = {
      validationHits: 0,
      validationMisses: 0,
      generationHits: 0,
      generationMisses: 0,
      totalComputeTime: 0,
      cacheMemoryUsage: 0,
    };

    // 定期清理过期缓存
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanExpiredEntries(), 60000); // 每分钟清理一次
    }
  }

  /**
   * 缓存 XPath 验证结果
   */
  cacheValidation(xpath: string, result: boolean): void {
    if (this.validationCache.size >= this.config.maxValidationEntries) {
      this.evictLeastUsed(this.validationCache);
    }

    this.validationCache.set(xpath, {
      value: result,
      timestamp: Date.now(),
      hitCount: 0,
    });

    this.updateMemoryUsage();
  }

  /**
   * 获取缓存的验证结果
   */
  getCachedValidation(xpath: string): boolean | null {
    const entry = this.validationCache.get(xpath);
    
    if (!entry) {
      if (this.config.enablePerformanceTracking) {
        this.metrics.validationMisses++;
      }
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.validationCache.delete(xpath);
      if (this.config.enablePerformanceTracking) {
        this.metrics.validationMisses++;
      }
      return null;
    }

    // 更新命中计数
    entry.hitCount++;
    if (this.config.enablePerformanceTracking) {
      this.metrics.validationHits++;
    }

    return entry.value;
  }

  /**
   * 缓存 XPath 生成结果
   */
  cacheGeneration(elementKey: string, result: string | null): void {
    if (this.generationCache.size >= this.config.maxGenerationEntries) {
      this.evictLeastUsed(this.generationCache);
    }

    this.generationCache.set(elementKey, {
      value: result,
      timestamp: Date.now(),
      hitCount: 0,
    });

    this.updateMemoryUsage();
  }

  /**
   * 获取缓存的生成结果
   */
  getCachedGeneration(elementKey: string): string | null | undefined {
    const entry = this.generationCache.get(elementKey);
    
    if (!entry) {
      if (this.config.enablePerformanceTracking) {
        this.metrics.generationMisses++;
      }
      return undefined; // 未找到缓存
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.generationCache.delete(elementKey);
      if (this.config.enablePerformanceTracking) {
        this.metrics.generationMisses++;
      }
      return undefined;
    }

    // 更新命中计数
    entry.hitCount++;
    if (this.config.enablePerformanceTracking) {
      this.metrics.generationHits++;
    }

    return entry.value;
  }

  /**
   * 生成元素缓存键
   */
  generateElementKey(element: any): string {
    const keyParts = [
      element.resource_id || '',
      element.text || '',
      element.content_desc || '',
      element.class_name || '',
    ];
    return `elem:${keyParts.join('|')}`;
  }

  /**
   * 清理过期缓存条目
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const expiredThreshold = now - this.config.ttl;

    // 清理验证缓存 - 使用Array.from避免迭代器兼容性问题
    const validationEntries = Array.from(this.validationCache.entries());
    for (const [key, entry] of validationEntries) {
      if (entry.timestamp < expiredThreshold) {
        this.validationCache.delete(key);
      }
    }

    // 清理生成缓存 - 使用Array.from避免迭代器兼容性问题
    const generationEntries = Array.from(this.generationCache.entries());
    for (const [key, entry] of generationEntries) {
      if (entry.timestamp < expiredThreshold) {
        this.generationCache.delete(key);
      }
    }

    this.updateMemoryUsage();
  }

  /**
   * 淘汰最少使用的缓存条目
   */
  private evictLeastUsed<T>(cache: Map<string, CacheEntry<T>>): void {
    let leastUsedKey: string | null = null;
    let leastHitCount = Infinity;

    // 使用Array.from避免迭代器兼容性问题
    const cacheEntries = Array.from(cache.entries());
    for (const [key, entry] of cacheEntries) {
      if (entry.hitCount < leastHitCount) {
        leastHitCount = entry.hitCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      cache.delete(leastUsedKey);
    }
  }

  /**
   * 更新内存使用量统计
   */
  private updateMemoryUsage(): void {
    if (this.config.enablePerformanceTracking) {
      // 估算内存使用量（简化计算）
      const validationSize = this.validationCache.size * 100; // 估算每个条目100字节
      const generationSize = this.generationCache.size * 200; // 估算每个条目200字节
      this.metrics.cacheMemoryUsage = validationSize + generationSize;
    }
  }

  /**
   * 记录计算时间
   */
  recordComputeTime(duration: number): void {
    if (this.config.enablePerformanceTracking) {
      this.metrics.totalComputeTime += duration;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const validationHitRate = this.metrics.validationHits / 
      (this.metrics.validationHits + this.metrics.validationMisses) || 0;
    const generationHitRate = this.metrics.generationHits / 
      (this.metrics.generationHits + this.metrics.generationMisses) || 0;

    return {
      validation: {
        size: this.validationCache.size,
        maxSize: this.config.maxValidationEntries,
        hits: this.metrics.validationHits,
        misses: this.metrics.validationMisses,
        hitRate: Math.round(validationHitRate * 100) + '%',
      },
      generation: {
        size: this.generationCache.size,
        maxSize: this.config.maxGenerationEntries,
        hits: this.metrics.generationHits,
        misses: this.metrics.generationMisses,
        hitRate: Math.round(generationHitRate * 100) + '%',
      },
      memory: {
        usage: this.metrics.cacheMemoryUsage,
        ttl: this.config.ttl,
      },
      performance: {
        totalComputeTime: this.metrics.totalComputeTime,
        averageComputeTime: this.metrics.totalComputeTime / 
          (this.metrics.validationMisses + this.metrics.generationMisses) || 0,
      }
    };
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    this.validationCache.clear();
    this.generationCache.clear();
    this.metrics = {
      validationHits: 0,
      validationMisses: 0,
      generationHits: 0,
      generationMisses: 0,
      totalComputeTime: 0,
      cacheMemoryUsage: 0,
    };
  }

  /**
   * 预热缓存
   */
  warmup(commonXPaths: string[]): void {
    // 预先验证常用 XPath，填充缓存
    for (const xpath of commonXPaths) {
      // 这里应该调用实际的验证逻辑，暂时模拟
      const isValid = xpath.startsWith('/') || xpath.startsWith('//');
      this.cacheValidation(xpath, isValid);
    }
  }
}

// 单例实例
export const xpathCacheManager = new XPathCacheManager({
  maxValidationEntries: 1000,
  maxGenerationEntries: 500,
  ttl: 5 * 60 * 1000, // 5分钟
  enablePerformanceTracking: true,
});

// 便捷函数
export function getCachedValidation(xpath: string): boolean | null {
  return xpathCacheManager.getCachedValidation(xpath);
}

export function setCachedValidation(xpath: string, result: boolean): void {
  xpathCacheManager.cacheValidation(xpath, result);
}

export function getCachedGeneration(element: any): string | null | undefined {
  const key = xpathCacheManager.generateElementKey(element);
  return xpathCacheManager.getCachedGeneration(key);
}

export function setCachedGeneration(element: any, result: string | null): void {
  const key = xpathCacheManager.generateElementKey(element);
  xpathCacheManager.cacheGeneration(key, result);
}

export function getXPathCacheStats() {
  return xpathCacheManager.getCacheStats();
}