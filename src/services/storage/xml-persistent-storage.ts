// src/services/storage/xml-persistent-storage.ts
// module: storage | layer: service | role: persistent-storage
// summary: IndexedDB持久化存储，避免页面刷新后XML缓存丢失

import { XmlCacheEntry } from '../xml-cache-manager';

/** IndexedDB数据库配置 */
const DB_NAME = 'SmartScriptXmlCache';
const DB_VERSION = 1;
const STORE_NAME = 'xmlSnapshots';
const INDEX_HASH = 'xmlHash';
const INDEX_TIMESTAMP = 'timestamp';

/** 存储配置 */
export interface PersistentStorageConfig {
  /** 最大存储条目数（超过后自动清理旧数据） */
  maxEntries: number;
  /** 最大缓存天数（超过后自动清理） */
  maxAgeDays: number;
  /** 是否启用自动清理 */
  autoCleanup: boolean;
  /** 自动清理间隔（毫秒） */
  cleanupIntervalMs: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: PersistentStorageConfig = {
  maxEntries: 500,
  maxAgeDays: 30,
  autoCleanup: true,
  cleanupIntervalMs: 60 * 60 * 1000, // 1小时
};

/** 存储统计信息 */
export interface StorageStats {
  totalEntries: number;
  oldestEntry: { cacheId: string; timestamp: number } | null;
  newestEntry: { cacheId: string; timestamp: number } | null;
  totalSizeBytes: number;
  avgEntrySizeBytes: number;
}

/**
 * XML持久化存储管理器
 * 
 * 功能：
 * 1. 使用IndexedDB存储XML缓存，避免页面刷新丢失
 * 2. 自动清理过期数据（超过30天）
 * 3. 限制存储数量（超过500条自动清理最旧的）
 * 4. 支持按hash和timestamp索引快速查询
 * 5. 提供存储统计和健康检查
 */
export class XmlPersistentStorage {
  private db: IDBDatabase | null = null;
  private config: PersistentStorageConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(config?: Partial<PersistentStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化IndexedDB数据库
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('⚠️ IndexedDB不可用，持久化存储将被禁用');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ 打开IndexedDB失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB已初始化:', DB_NAME);

        // 启动自动清理
        if (this.config.autoCleanup) {
          this.startAutoCleanup();
        }

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheId' });

          // 创建索引
          store.createIndex(INDEX_HASH, 'xmlHash', { unique: false });
          store.createIndex(INDEX_TIMESTAMP, 'timestamp', { unique: false });

          console.log('✅ 对象存储已创建:', STORE_NAME);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 保存XML缓存条目到IndexedDB
   */
  async put(entry: XmlCacheEntry): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      console.warn('⚠️ IndexedDB未初始化，跳过保存');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        console.log(`💾 XML缓存已持久化: ${entry.cacheId}`, {
          xmlHash: entry.xmlHash?.substring(0, 16) + '...',
          contentLength: entry.xmlContent.length,
        });
        resolve();
      };

      request.onerror = () => {
        console.error('❌ 保存XML缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 批量保存XML缓存条目
   */
  async putBatch(entries: XmlCacheEntry[]): Promise<void> {
    await this.ensureInitialized();

    if (!this.db || entries.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      let errors: unknown[] = [];

      for (const entry of entries) {
        const request = store.put(entry);

        request.onsuccess = () => {
          completed++;
          if (completed === entries.length) {
            console.log(`💾 批量保存完成: ${completed}/${entries.length}条`);
            resolve();
          }
        };

        request.onerror = () => {
          errors.push(request.error);
          completed++;
          if (completed === entries.length) {
            if (errors.length > 0) {
              console.error(`❌ 批量保存部分失败: ${errors.length}/${entries.length}条`);
              reject(new Error(`${errors.length} entries failed to save`));
            } else {
              resolve();
            }
          }
        };
      }
    });
  }

  /**
   * 通过cacheId获取XML缓存
   */
  async get(cacheId: string): Promise<XmlCacheEntry | null> {
    await this.ensureInitialized();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cacheId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('❌ 读取XML缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 通过xmlHash查询XML缓存
   */
  async getByHash(xmlHash: string): Promise<XmlCacheEntry | null> {
    await this.ensureInitialized();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEX_HASH);
      const request = index.get(xmlHash);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('❌ 通过hash读取失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取所有XML缓存条目
   */
  async getAll(): Promise<XmlCacheEntry[]> {
    await this.ensureInitialized();

    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('❌ 读取所有缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 删除XML缓存条目
   */
  async delete(cacheId: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(cacheId);

      request.onsuccess = () => {
        console.log(`🗑️ XML缓存已删除: ${cacheId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ 删除XML缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 清理过期的XML缓存
   * @param maxAgeDays 最大缓存天数（默认使用配置值）
   * @returns 清理的条目数
   */
  async cleanupExpired(maxAgeDays?: number): Promise<number> {
    await this.ensureInitialized();

    if (!this.db) {
      return 0;
    }

    const days = maxAgeDays ?? this.config.maxAgeDays;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEX_TIMESTAMP);

      // 查询所有timestamp小于cutoffTime的条目
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 清理过期缓存: 删除了${deletedCount}条（超过${days}天）`);
          }
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('❌ 清理过期缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 清理最旧的条目，直到总数不超过maxEntries
   * @returns 清理的条目数
   */
  async cleanupOldest(): Promise<number> {
    await this.ensureInitialized();

    if (!this.db) {
      return 0;
    }

    // 1. 获取当前总数
    const totalCount = await this.count();

    if (totalCount <= this.config.maxEntries) {
      return 0; // 不需要清理
    }

    const deleteCount = totalCount - this.config.maxEntries;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEX_TIMESTAMP);

      // 按时间戳升序（最旧的在前）
      const request = index.openCursor(null, 'next');

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

        if (cursor && deletedCount < deleteCount) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 清理最旧缓存: 删除了${deletedCount}条（保留最新${this.config.maxEntries}条）`);
          }
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('❌ 清理最旧缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 执行完整清理（过期 + 超量）
   */
  async cleanup(): Promise<{ expired: number; oldest: number }> {
    const expired = await this.cleanupExpired();
    const oldest = await this.cleanupOldest();

    console.log(`✅ 清理完成: 过期${expired}条, 超量${oldest}条`);

    return { expired, oldest };
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<StorageStats> {
    await this.ensureInitialized();

    if (!this.db) {
      return {
        totalEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        totalSizeBytes: 0,
        avgEntrySizeBytes: 0,
      };
    }

    const entries = await this.getAll();

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        totalSizeBytes: 0,
        avgEntrySizeBytes: 0,
      };
    }

    // 排序
    const sorted = entries.sort((a, b) => a.timestamp - b.timestamp);
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    // 计算总大小
    const totalSizeBytes = entries.reduce((sum, entry) => {
      return sum + entry.xmlContent.length;
    }, 0);

    return {
      totalEntries: entries.length,
      oldestEntry: { cacheId: oldest.cacheId, timestamp: oldest.timestamp },
      newestEntry: { cacheId: newest.cacheId, timestamp: newest.timestamp },
      totalSizeBytes,
      avgEntrySizeBytes: Math.round(totalSizeBytes / entries.length),
    };
  }

  /**
   * 获取存储条目总数
   */
  async count(): Promise<number> {
    await this.ensureInitialized();

    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ 统计条目数失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ 所有XML缓存已清空');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ 清空缓存失败:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      return; // 已经启动
    }

    console.log(`⏰ 启动自动清理定时器（间隔: ${this.config.cleanupIntervalMs / 1000 / 60}分钟）`);

    this.cleanupTimer = setInterval(async () => {
      try {
        console.log('🔄 执行自动清理...');
        await this.cleanup();
      } catch (error) {
        console.error('❌ 自动清理失败:', error);
      }
    }, this.config.cleanupIntervalMs);
  }

  /**
   * 停止自动清理定时器
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('⏹️ 自动清理定时器已停止');
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.stopAutoCleanup();

    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('👋 IndexedDB连接已关闭');
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db && !this.initPromise) {
      await this.initialize();
    } else if (this.initPromise) {
      await this.initPromise;
    }
  }
}

// 单例实例
let persistentStorageInstance: XmlPersistentStorage | null = null;

/**
 * 获取持久化存储单例
 */
export function getPersistentStorage(config?: Partial<PersistentStorageConfig>): XmlPersistentStorage {
  if (!persistentStorageInstance) {
    persistentStorageInstance = new XmlPersistentStorage(config);
  }
  return persistentStorageInstance;
}

/**
 * 重置持久化存储单例（主要用于测试）
 */
export function resetPersistentStorage(): void {
  if (persistentStorageInstance) {
    persistentStorageInstance.close();
    persistentStorageInstance = null;
  }
}
