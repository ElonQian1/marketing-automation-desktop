// src/shared/cache/xml-core-cache.ts
// module: shared | layer: cache | role: core-cache
// summary: 核心XML缓存管理，专注于快照存储和检索，不涉及UI层逻辑

import { getPersistentStorage, XmlPersistentStorage } from '../storage/xml-persistent-storage';

export interface XmlCoreEntry {
  /** 缓存ID（快照ID） */
  snapshotId: string;
  /** XML内容 */
  xmlContent: string;
  /** XML内容的哈希值 */
  xmlHash: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 设备标识 */
  deviceId: string;
  /** 元数据（可选） */
  metadata?: {
    packageName?: string;
    activity?: string;
    resolution?: string;
    locale?: string;
  };
}

export interface CacheStats {
  memoryCount: number;
  persistentCount: number;
  memoryUsageRatio: number;
  recentAccess: Array<{ snapshotId: string; accessCount: number }>;
}

/**
 * 核心XML缓存管理器
 * 
 * 职责：
 * 1. 管理XML快照的存储和检索
 * 2. 提供内存+持久化双层缓存
 * 3. 性能优化（LRU、懒加载、智能预热）
 * 4. 与UI层解耦，专注核心缓存逻辑
 */
export class XmlCoreCache {
  private static instance: XmlCoreCache;
  
  // 内存缓存（LRU策略）
  private memoryCache: Map<string, XmlCoreEntry> = new Map();
  private hashIndex: Map<string, string> = new Map(); // hash -> snapshotId
  private accessCounts: Map<string, number> = new Map();
  
  // 持久化存储
  private persistentStorage: XmlPersistentStorage | null = null;
  
  // 配置
  private readonly maxMemoryEntries = 50;
  private readonly preloadBatchSize = 10;
  
  private constructor() {
    this.initializePersistentStorage();
  }

  static getInstance(): XmlCoreCache {
    if (!this.instance) {
      this.instance = new XmlCoreCache();
    }
    return this.instance;
  }

  /**
   * 初始化持久化存储
   */
  private async initializePersistentStorage(): Promise<void> {
    try {
      this.persistentStorage = getPersistentStorage({
        maxEntries: 500,
        maxAgeDays: 30,
        autoCleanup: true,
      });

      await this.persistentStorage.initialize();
      console.log('✅ XML核心缓存持久化存储已初始化');
    } catch (error) {
      console.error('❌ XML核心缓存持久化存储初始化失败:', error);
    }
  }

  /**
   * 存储XML快照
   */
  async putSnapshot(snapshotId: string, xmlContent: string, xmlHash: string, metadata?: XmlCoreEntry['metadata']): Promise<void> {
    const entry: XmlCoreEntry = {
      snapshotId,
      xmlContent,
      xmlHash,
      timestamp: Date.now(),
      deviceId: metadata?.packageName || 'unknown',
      metadata,
    };

    // 存储到内存缓存（LRU策略）
    this.addToMemoryCache(entry);
    
    // 更新哈希索引
    this.hashIndex.set(xmlHash, snapshotId);
    
    // 异步同步到持久化存储
    this.syncToPersistentStorage(entry).catch(error => {
      console.error('❌ 同步XML快照到持久化存储失败:', error);
    });
    
    console.log(`📦 XML快照已存储: ${snapshotId}`, {
      xmlHash: xmlHash.substring(0, 16) + '...',
      contentSize: xmlContent.length,
      hasMetadata: !!metadata
    });
  }

  /**
   * 获取XML快照
   */
  async getSnapshot(snapshotId: string): Promise<XmlCoreEntry | null> {
    // 记录访问
    this.recordAccess(snapshotId);

    // 1. 尝试从内存缓存获取
    const memoryEntry = this.memoryCache.get(snapshotId);
    if (memoryEntry) {
      return memoryEntry;
    }

    // 2. 从持久化存储获取
    if (this.persistentStorage) {
      try {
        const persistentEntry = await this.persistentStorage.get(snapshotId);
        if (persistentEntry) {
          // 转换为核心缓存条目格式
          const coreEntry: XmlCoreEntry = {
            snapshotId: persistentEntry.cacheId,
            xmlContent: persistentEntry.xmlContent,
            xmlHash: persistentEntry.xmlHash || '',
            timestamp: persistentEntry.timestamp,
            deviceId: persistentEntry.deviceId,
            metadata: persistentEntry.metadata,
          };
          
          // 恢复到内存缓存
          this.addToMemoryCache(coreEntry);
          return coreEntry;
        }
      } catch (error) {
        console.error('❌ 从持久化存储获取XML快照失败:', error);
      }
    }

    console.warn(`⚠️ 未找到XML快照: ${snapshotId}`);
    return null;
  }

  /**
   * 通过哈希获取快照
   */
  async getByHash(xmlHash: string): Promise<XmlCoreEntry | null> {
    // 1. 从哈希索引获取snapshotId
    const snapshotId = this.hashIndex.get(xmlHash);
    if (snapshotId) {
      return await this.getSnapshot(snapshotId);
    }

    // 2. 从持久化存储查找
    if (this.persistentStorage) {
      try {
        const persistentEntry = await this.persistentStorage.getByHash(xmlHash);
        if (persistentEntry) {
          const coreEntry: XmlCoreEntry = {
            snapshotId: persistentEntry.cacheId,
            xmlContent: persistentEntry.xmlContent,
            xmlHash: persistentEntry.xmlHash || '',
            timestamp: persistentEntry.timestamp,
            deviceId: persistentEntry.deviceId,
            metadata: persistentEntry.metadata,
          };
          
          // 更新索引和内存缓存
          this.hashIndex.set(xmlHash, coreEntry.snapshotId);
          this.addToMemoryCache(coreEntry);
          return coreEntry;
        }
      } catch (error) {
        console.error('❌ 通过哈希从持久化存储获取失败:', error);
      }
    }

    return null;
  }

  /**
   * 检查快照是否存在
   */
  async hasSnapshot(snapshotId: string): Promise<boolean> {
    // 1. 检查内存缓存
    if (this.memoryCache.has(snapshotId)) {
      return true;
    }

    // 2. 检查持久化存储
    if (this.persistentStorage) {
      try {
        const entry = await this.persistentStorage.get(snapshotId);
        return !!entry;
      } catch (error) {
        console.error('❌ 检查快照存在性失败:', error);
      }
    }

    return false;
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    let persistentCount = 0;
    
    if (this.persistentStorage) {
      try {
        const stats = await this.persistentStorage.getStats();
        persistentCount = stats.totalEntries;
      } catch (error) {
        console.error('❌ 获取持久化存储统计失败:', error);
      }
    }

    const recentAccess = Array.from(this.accessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([snapshotId, accessCount]) => ({ snapshotId, accessCount }));

    return {
      memoryCount: this.memoryCache.size,
      persistentCount,
      memoryUsageRatio: this.memoryCache.size / this.maxMemoryEntries,
      recentAccess,
    };
  }

  /**
   * 预热缓存
   */
  async warmup(targetCount: number = this.preloadBatchSize): Promise<void> {
    if (!this.persistentStorage) {
      console.warn('⚠️ 持久化存储未初始化，无法预热');
      return;
    }

    try {
      console.log(`🔥 开始预热XML缓存（目标: ${targetCount}个）...`);
      
      const recentEntries = await this.persistentStorage.getRecent(targetCount);
      let warmedCount = 0;

      for (const entry of recentEntries) {
        if (!this.memoryCache.has(entry.cacheId) && this.memoryCache.size < this.maxMemoryEntries) {
          const coreEntry: XmlCoreEntry = {
            snapshotId: entry.cacheId,
            xmlContent: entry.xmlContent,
            xmlHash: entry.xmlHash || '',
            timestamp: entry.timestamp,
            deviceId: entry.deviceId,
            metadata: entry.metadata,
          };
          
          this.addToMemoryCache(coreEntry);
          if (coreEntry.xmlHash) {
            this.hashIndex.set(coreEntry.xmlHash, coreEntry.snapshotId);
          }
          warmedCount++;
        }
      }

      console.log(`✅ XML缓存预热完成: ${warmedCount}/${targetCount}个快照已加载`);
    } catch (error) {
      console.error('❌ XML缓存预热失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    let memoryCleanedCount = 0;

    // 清理内存缓存
    for (const [snapshotId, entry] of this.memoryCache) {
      if (now - entry.timestamp > maxAgeMs) {
        this.memoryCache.delete(snapshotId);
        this.hashIndex.delete(entry.xmlHash);
        this.accessCounts.delete(snapshotId);
        memoryCleanedCount++;
      }
    }

    // 清理持久化存储
    let persistentCleanedCount = 0;
    if (this.persistentStorage) {
      try {
        const maxAgeDays = Math.ceil(maxAgeMs / (24 * 60 * 60 * 1000));
        persistentCleanedCount = await this.persistentStorage.cleanupExpired(maxAgeDays);
      } catch (error) {
        console.error('❌ 清理持久化存储失败:', error);
      }
    }

    if (memoryCleanedCount > 0 || persistentCleanedCount > 0) {
      console.log(`🧹 XML缓存清理完成: 内存${memoryCleanedCount}条, 持久化${persistentCleanedCount}条`);
    }
  }

  /**
   * 添加到内存缓存（LRU策略）
   */
  private addToMemoryCache(entry: XmlCoreEntry): void {
    // LRU淘汰策略
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // 找到访问次数最少的条目
      let lruSnapshotId = '';
      let minAccessCount = Infinity;
      
      for (const [snapshotId] of this.memoryCache) {
        const accessCount = this.accessCounts.get(snapshotId) || 0;
        if (accessCount < minAccessCount) {
          minAccessCount = accessCount;
          lruSnapshotId = snapshotId;
        }
      }
      
      if (lruSnapshotId) {
        const removedEntry = this.memoryCache.get(lruSnapshotId);
        this.memoryCache.delete(lruSnapshotId);
        this.accessCounts.delete(lruSnapshotId);
        
        if (removedEntry) {
          this.hashIndex.delete(removedEntry.xmlHash);
        }
        
        console.log(`🗑️ LRU淘汰快照: ${lruSnapshotId} (访问次数: ${minAccessCount})`);
      }
    }

    this.memoryCache.set(entry.snapshotId, entry);
  }

  /**
   * 同步到持久化存储
   */
  private async syncToPersistentStorage(entry: XmlCoreEntry): Promise<void> {
    if (!this.persistentStorage) {
      return;
    }

    try {
      // 转换为持久化存储格式
      const persistentEntry = {
        cacheId: entry.snapshotId,
        xmlContent: entry.xmlContent,
        xmlHash: entry.xmlHash,
        timestamp: entry.timestamp,
        deviceId: entry.deviceId,
        deviceName: 'unknown',
        metadata: entry.metadata,
        pageInfo: {
          appPackage: entry.metadata?.packageName || 'unknown',
          activityName: entry.metadata?.activity || 'unknown',
          pageTitle: 'snapshot',
          pageType: 'xml-core',
          elementCount: 0,
        },
      };

      await this.persistentStorage.put(persistentEntry);
    } catch (error) {
      console.error('❌ 同步到持久化存储失败:', error);
    }
  }

  /**
   * 记录访问
   */
  private recordAccess(snapshotId: string): void {
    const currentCount = this.accessCounts.get(snapshotId) || 0;
    this.accessCounts.set(snapshotId, currentCount + 1);
  }
}

// 导出单例实例
export const xmlCoreCache = XmlCoreCache.getInstance();
export default XmlCoreCache;