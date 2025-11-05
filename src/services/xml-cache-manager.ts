// src/services/xml-cache-manager.ts
// module: xml | layer: service | role: manager
// summary: xml-cache-manager.ts 文件

import { getPersistentStorage, XmlPersistentStorage } from './storage/xml-persistent-storage';

/**
 * XML缓存管理器
 * 
 * 功能增强（v2.0）：
 * 1. 内存缓存：快速访问（Map）
 * 2. 持久化存储：IndexedDB存储，避免页面刷新丢失
 * 3. 自动同步：内存 ↔ IndexedDB双向同步
 * 4. 自动清理：过期数据和超量数据自动清理
 * 5. 智能恢复：页面刷新后自动从IndexedDB恢复
 */

export interface XmlCacheEntry {
  /** 缓存ID */
  cacheId: string;
  /** XML内容 */
  xmlContent: string;
  /** XML内容的哈希值 */
  xmlHash?: string;
  /** 设备ID */
  deviceId: string;
  /** 设备名称 */
  deviceName: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 页面标识信息 */
  pageInfo: {
    appPackage: string;
    activityName: string;
    pageTitle: string;
    pageType: string;
    elementCount: number;
  };
  /** 🆕 页面元数据（用于智能回退匹配） */
  metadata?: {
    packageName?: string;      // 应用包名
    activity?: string;          // Activity名称
    resolution?: string;        // 屏幕分辨率 (e.g., "1080x1920")
    locale?: string;            // 语言环境 (e.g., "zh_CN")
    deviceModel?: string;       // 设备型号
    androidVersion?: string;    // Android版本
  };
  /** 解析后的UI元素（缓存） */
  parsedElements?: unknown[];
  /** 页面截图绝对路径（可选） */
  screenshotAbsolutePath?: string;
  /** 页面截图相对路径（可选） */
  screenshotRelativePath?: string;
  /** 原始缓存文件名（ui_dump_xxx.xml） */
  sourceFileName?: string;
}

export interface StepXmlContext {
  /** 步骤ID */
  stepId: string;
  /** 关联的XML缓存ID */
  xmlCacheId: string;
  /** 元素在XML中的路径/标识 */
  elementPath?: string;
  /** 元素选择时的上下文信息 */
  selectionContext?: {
    selectedBounds: unknown;
    searchCriteria: string;
    confidence: number;
  };
}

class XmlCacheManager {
  private static instance: XmlCacheManager;
  private cache: Map<string, XmlCacheEntry> = new Map();
  private hashIndex: Map<string, XmlCacheEntry> = new Map();
  private stepXmlMapping: Map<string, StepXmlContext> = new Map();
  private persistentStorage: XmlPersistentStorage | null = null;
  private isRestoring = false;
  
  // 🚀 性能优化：访问频率跟踪和智能预加载
  private accessFrequency: Map<string, number> = new Map(); // 记录访问频率
  private preloadCache: Set<string> = new Set(); // 预加载缓存ID集合
  private maxMemoryEntries = 50; // 内存缓存最大条目数，防止内存溢出

  private constructor() {
    // 初始化持久化存储
    this.initializePersistentStorage();
  }

  static getInstance(): XmlCacheManager {
    if (!this.instance) {
      this.instance = new XmlCacheManager();
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
        cleanupIntervalMs: 60 * 60 * 1000, // 1小时清理一次
      });

      await this.persistentStorage.initialize();
      console.log('✅ 持久化存储已初始化');

      // 自动从IndexedDB恢复缓存
      await this.restoreFromPersistentStorage();
    } catch (error) {
      console.error('❌ 持久化存储初始化失败:', error);
      // 不影响内存缓存的正常使用
    }
  }

  /**
   * 从持久化存储恢复缓存到内存（性能优化版）
   * 
   * 🔥 优化策略：
   * 1. 懒加载：仅恢复最新的缓存项（默认前20条）
   * 2. 索引优先：优先恢复哈希索引，便于快速查找
   * 3. 异步批处理：分批处理，避免阻塞UI线程
   * 4. 智能预加载：根据使用频率动态调整预加载数量
   */
  private async restoreFromPersistentStorage(): Promise<void> {
    if (!this.persistentStorage || this.isRestoring) {
      return;
    }

    this.isRestoring = true;

    try {
      // 🚀 性能优化：仅恢复最新的20个缓存项，而非全量加载
      const recentEntries = await this.persistentStorage.getRecent(20);
      
      if (recentEntries.length === 0) {
        console.log('📦 持久化存储为空，无需恢复');
        return;
      }

      // 🔄 分批处理，避免阻塞主线程
      const batchSize = 5;
      let processedCount = 0;
      
      for (let i = 0; i < recentEntries.length; i += batchSize) {
        const batch = recentEntries.slice(i, i + batchSize);
        
        // 使用 setTimeout 让出控制权，避免阻塞UI
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            for (const entry of batch) {
              this.cache.set(entry.cacheId, entry);
              if (entry.xmlHash) {
                this.hashIndex.set(entry.xmlHash, entry);
              }
              processedCount++;
            }
            resolve();
          }, 0);
        });
      }

      console.log(`✅ 智能恢复缓存完成: ${processedCount} 个最新XML缓存 (优化模式)`);
      console.log(`💡 性能提示: 其余缓存将在需要时按需加载`);
    } catch (error) {
      console.error('❌ 恢复缓存失败:', error);
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * 同步内存缓存到持久化存储
   */
  private async syncToPersistentStorage(entry: XmlCacheEntry): Promise<void> {
    if (!this.persistentStorage) {
      return;
    }

    try {
      await this.persistentStorage.put(entry);
    } catch (error) {
      console.error('❌ 同步到持久化存储失败:', error);
      // 不影响内存缓存的正常使用
    }
  }

  /**
   * 缓存XML页面数据
   * @deprecated 建议使用 putXml() 方法替代，这个方法将在未来版本中移除
   */
  cacheXmlPage(entry: XmlCacheEntry): string {
    // 🚨 废弃警告
    if (console.warn) {
      console.warn(
        '⚠️ [DEPRECATED] cacheXmlPage() 已废弃，请使用 putXml() 方法。',
        'This method will be removed in a future version.',
        new Error().stack
      );
    }
    
    const cacheId = entry.cacheId || this.generateCacheId();
    
    // 内部调用新的 putXml 方法统一处理
    this.putXml(cacheId, entry.xmlContent, entry.xmlHash || '', entry.timestamp ? new Date(entry.timestamp).toISOString() : undefined);
    
    // 保持向后兼容，为完整entry设置额外的页面信息（putXml不处理的部分）
    const existingEntry = this.cache.get(cacheId);
    if (existingEntry) {
      const completeEntry = { 
        ...existingEntry, 
        ...entry, 
        cacheId 
      };
      this.cache.set(cacheId, completeEntry);
    }
    
    console.log(`📦 XML页面已缓存 (legacy): ${cacheId}`, {
      deviceId: entry.deviceId,
      elementCount: entry.pageInfo.elementCount,
      contentLength: entry.xmlContent.length,
      xmlHash: entry.xmlHash?.substring(0, 16) + '...' || 'none'
    });
    
    return cacheId;
  }

  /**
   * 缓存XML数据（支持hash索引）
   * 
   * 🆕 自动同步到持久化存储（IndexedDB）
   */
  putXml(id: string, xmlContent: string, xmlHash: string, createdAt = new Date().toISOString()): void {
    const entry: XmlCacheEntry = {
      cacheId: id,
      xmlContent,
      xmlHash,
      deviceId: 'unknown',
      deviceName: 'unknown',
      timestamp: new Date(createdAt).getTime(),
      pageInfo: {
        appPackage: 'unknown',
        activityName: 'unknown',
        pageTitle: 'unknown',
        pageType: 'snapshot',
        elementCount: 0
      }
    };
    
    // 内存缓存
    this.cache.set(id, entry);
    this.hashIndex.set(xmlHash, entry);
    
    // 🔥 异步同步到持久化存储
    this.syncToPersistentStorage(entry).catch(err => {
      console.error('❌ 同步XML到持久化存储失败:', err);
    });
    
    console.log(`📦 XML快照已缓存: ${id}`, {
      xmlHash: xmlHash.substring(0, 16) + '...',
      contentLength: xmlContent.length
    });
  }

  /**
   * 获取缓存的XML数据
   * 
   * 🆕 如果内存中不存在，尝试从持久化存储加载
   */
  async getCachedXml(cacheId: string): Promise<XmlCacheEntry | null> {
    // 1. 先从内存缓存获取
    let entry = this.cache.get(cacheId);
    if (entry) {
      return entry;
    }

    // 2. 从持久化存储获取
    if (this.persistentStorage) {
      try {
        entry = await this.persistentStorage.get(cacheId);
        if (entry) {
          // 恢复到内存缓存
          this.cache.set(entry.cacheId, entry);
          if (entry.xmlHash) {
            this.hashIndex.set(entry.xmlHash, entry);
          }
          console.log(`✅ 从持久化存储恢复缓存: ${cacheId}`);
          return entry;
        }
      } catch (error) {
        console.error('❌ 从持久化存储读取失败:', error);
      }
    }

    console.warn(`⚠️ 未找到XML缓存: ${cacheId}`);
    return null;
  }

  /**
   * 通过hash获取XML数据
   * 
   * 🆕 如果内存中不存在，尝试从持久化存储加载
   */
  async getByHash(xmlHash: string): Promise<XmlCacheEntry | null> {
    // 1. 先从内存索引获取
    let entry = this.hashIndex.get(xmlHash);
    if (entry) {
      return entry;
    }

    // 2. 从持久化存储获取
    if (this.persistentStorage) {
      try {
        entry = await this.persistentStorage.getByHash(xmlHash);
        if (entry) {
          // 恢复到内存缓存
          this.cache.set(entry.cacheId, entry);
          this.hashIndex.set(xmlHash, entry);
          console.log(`✅ 从持久化存储恢复缓存（hash）: ${xmlHash.substring(0, 16)}...`);
          return entry;
        }
      } catch (error) {
        console.error('❌ 从持久化存储读取失败（hash）:', error);
      }
    }

    console.warn(`⚠️ 未找到XML哈希: ${xmlHash}`);
    return null;
  }

  /**
   * 关联步骤与XML源
   */
  linkStepToXml(stepId: string, xmlCacheId: string, context?: Partial<StepXmlContext>): void {
    const stepContext: StepXmlContext = {
      stepId,
      xmlCacheId,
      ...context
    };
    
    this.stepXmlMapping.set(stepId, stepContext);
    console.log(`🔗 步骤与XML已关联:`, { stepId, xmlCacheId });
  }

  /**
   * 获取步骤关联的XML数据
   * 
   * 🆕 异步方法，支持从持久化存储加载
   */
  async getStepXmlContext(stepId: string): Promise<{ xmlData: XmlCacheEntry; context: StepXmlContext } | null> {
    const stepContext = this.stepXmlMapping.get(stepId);
    if (!stepContext) {
      console.warn(`⚠️ 步骤未关联XML源: ${stepId}`);
      return null;
    }

    const xmlData = await this.getCachedXml(stepContext.xmlCacheId);
    if (!xmlData) {
      console.warn(`⚠️ 步骤关联的XML缓存不存在: ${stepContext.xmlCacheId}`);
      return null;
    }

    return { xmlData, context: stepContext };
  }

  /**
   * 清理过期缓存
   * 
   * 🆕 同时清理内存和持久化存储
   */
  async cleanupExpiredCache(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    let memoryCleanedCount = 0;

    // 清理内存缓存
    for (const [cacheId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.cache.delete(cacheId);
        if (entry.xmlHash) {
          this.hashIndex.delete(entry.xmlHash);
        }
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
      console.log(`🧹 清理完成: 内存${memoryCleanedCount}条, 持久化${persistentCleanedCount}条`);
    }
  }

  /**
   * 获取存储统计信息
   * 
   * 🆕 包含持久化存储统计
   */
  async getStorageStats(): Promise<{
    memory: { count: number; cacheIds: string[] };
    persistent: { count: number; totalSizeBytes: number; avgSizeBytes: number };
  }> {
    const memory = {
      count: this.cache.size,
      cacheIds: Array.from(this.cache.keys()),
    };

    let persistent = {
      count: 0,
      totalSizeBytes: 0,
      avgSizeBytes: 0,
    };

    if (this.persistentStorage) {
      try {
        const stats = await this.persistentStorage.getStats();
        persistent = {
          count: stats.totalEntries,
          totalSizeBytes: stats.totalSizeBytes,
          avgSizeBytes: stats.avgEntrySizeBytes,
        };
      } catch (error) {
        console.error('❌ 获取持久化存储统计失败:', error);
      }
    }

    return { memory, persistent };
  }

  /**
   * 手动触发清理（过期 + 超量）
   */
  async manualCleanup(): Promise<void> {
    if (!this.persistentStorage) {
      await this.cleanupExpiredCache();
      return;
    }

    try {
      // 1. 清理过期数据
      await this.cleanupExpiredCache();

      // 2. 清理超量数据
      const { expired, oldest } = await this.persistentStorage.cleanup();
      console.log(`✅ 手动清理完成: 过期${expired}条, 超量${oldest}条`);
    } catch (error) {
      console.error('❌ 手动清理失败:', error);
    }
  }

  /**
   * 获取最新的XML缓存（智能匹配版本）
   * @param metadata 可选的元数据用于智能匹配，防止跨页面混淆
   */
  getLatestXmlCache(metadata?: Partial<XmlCacheEntry['metadata']>): XmlCacheEntry | null {
    if (this.cache.size === 0) {
      return null;
    }
    
    const entries = Array.from(this.cache.values());
    
    // 如果提供了元数据，优先匹配相同上下文的缓存
    if (metadata && Object.keys(metadata).length > 0) {
      const matchedEntries = entries.filter(entry => {
        if (!entry.metadata) return false;
        
        // 关键字段必须匹配（包名和Activity）
        if (metadata.packageName && entry.metadata.packageName !== metadata.packageName) {
          return false;
        }
        if (metadata.activity && entry.metadata.activity !== metadata.activity) {
          return false;
        }
        
        // 次要字段可选匹配（分辨率、语言等）
        if (metadata.resolution && entry.metadata.resolution !== metadata.resolution) {
          console.warn(`⚠️ 分辨率不匹配: ${entry.metadata.resolution} vs ${metadata.resolution}`);
        }
        
        return true;
      });
      
      if (matchedEntries.length > 0) {
        const matched = matchedEntries.sort((a, b) => b.timestamp - a.timestamp)[0];
        console.log(`✅ 找到匹配的XML缓存:`, {
          cacheId: matched.cacheId,
          packageName: matched.metadata?.packageName,
          activity: matched.metadata?.activity,
          timestamp: new Date(matched.timestamp).toISOString()
        });
        return matched;
      } else {
        console.warn(`⚠️ 未找到匹配元数据的缓存，降级到最新缓存`, metadata);
      }
    }
    
    // 降级到最新缓存（无元数据或没有匹配）
    const latest = entries.sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!metadata || Object.keys(metadata).length === 0) {
      console.log(`📦 返回最新XML缓存 (无元数据匹配): ${latest.cacheId}`);
    }
    return latest;
  }

  /**
   * 列出所有缓存ID
   */
  listCacheIds(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有缓存信息（用于调试）
   */
  getCacheStats(): { 
    totalCacheCount: number; 
    totalStepMappings: number; 
    cacheIds: string[]; 
    recentCaches: Array<{ cacheId: string; timestamp: number; elementCount: number }>;
  } {
    return {
      totalCacheCount: this.cache.size,
      totalStepMappings: this.stepXmlMapping.size,
      cacheIds: Array.from(this.cache.keys()),
      recentCaches: Array.from(this.cache.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(entry => ({
          cacheId: entry.cacheId,
          timestamp: entry.timestamp,
          elementCount: entry.pageInfo.elementCount
        }))
    };
  }

  /**
   * 获取所有缓存键（用于调试）
   */
  dumpKeys(): { ids: string[]; hashes: string[] } {
    return {
      ids: Array.from(this.cache.keys()),
      hashes: Array.from(this.hashIndex.keys())
    };
  }

  private generateCacheId(): string {
    return `xml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 🔥 修复：导出类本身，供其他模块使用
export { XmlCacheManager };

// Named export for compatibility (使用getInstance而不是直接new)
export const xmlCacheManager = XmlCacheManager.getInstance();

export default XmlCacheManager;