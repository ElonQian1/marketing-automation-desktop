/**
 * 缓存管理器
 * 处理统一视图数据的缓存存储和检索
 */

import { UnifiedViewData, CacheEntry, CacheStats } from '../types';

export class CacheManager {
  private static cache = new Map<string, CacheEntry>();
  private static readonly MAX_CACHE_SIZE = 50;
  private static readonly CACHE_EXPIRE_MS = 30 * 60 * 1000; // 30分钟

  /**
   * 生成缓存键
   */
  static generateCacheKey(xmlContent: string): string {
    // 使用XML内容的哈希作为缓存键
    let hash = 0;
    for (let i = 0; i < xmlContent.length; i++) {
      const char = xmlContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return `unified_view_${Math.abs(hash)}`;
  }

  /**
   * 获取缓存数据
   */
  static get(cacheKey: string): UnifiedViewData | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }

    // 更新访问次数
    entry.accessCount++;
    return entry.data;
  }

  /**
   * 存储缓存数据
   */
  static set(cacheKey: string, data: UnifiedViewData): void {
    // 清理过期缓存
    this.cleanup();

    // 如果缓存已满，移除最旧的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.removeLeastUsed();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      size: this.calculateSize(data),
      accessCount: 1,
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * 检查缓存是否有效
   */
  static isValid(data: UnifiedViewData): boolean {
    return !!(
      data &&
      data.enhancedElements &&
      data.treeViewData &&
      data.visualViewData &&
      data.listViewData &&
      data.metadata
    );
  }

  /**
   * 检查缓存条目是否过期
   */
  private static isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_EXPIRE_MS;
  }

  /**
   * 清理过期缓存
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_EXPIRE_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 移除最少使用的缓存条目
   */
  private static removeLeastUsed(): void {
    let leastUsedKey = '';
    let leastAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount) {
        leastAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * 计算数据大小（估算）
   */
  private static calculateSize(data: UnifiedViewData): number {
    try {
      return JSON.stringify(data).length * 2; // 粗略估算
    } catch {
      return 1000; // 默认大小
    }
  }

  /**
   * 获取缓存统计信息
   */
  static getStats(): CacheStats {
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let totalAccess = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      totalAccess += entry.accessCount;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
    }

    return {
      totalEntries: this.cache.size,
      totalSizeBytes: totalSize,
      hitRate: totalAccess / Math.max(1, this.cache.size),
      oldestEntry: oldestTimestamp,
    };
  }

  /**
   * 清空所有缓存
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * 删除指定缓存
   */
  static delete(cacheKey: string): boolean {
    return this.cache.delete(cacheKey);
  }
}