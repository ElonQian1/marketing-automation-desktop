// src/shared/interfaces/xml-cache-interface.ts
// module: shared | layer: interfaces | role: cache-interface
// summary: 统一的XML缓存接口，协调不同缓存模块间的交互，避免功能混淆

import { XmlCoreCache, XmlCoreEntry } from '../cache/xml-core-cache';
import { PageHistoryCache, PageHistoryEntry } from '../../modules/page-analysis/services/page-history-cache';

export interface UnifiedXmlCacheInterface {
  // 核心快照缓存
  core: {
    putSnapshot(snapshotId: string, xmlContent: string, xmlHash: string, metadata?: any): Promise<void>;
    getSnapshot(snapshotId: string): Promise<XmlCoreEntry | null>;
    getByHash(xmlHash: string): Promise<XmlCoreEntry | null>;
    hasSnapshot(snapshotId: string): Promise<boolean>;
  };
  
  // 页面历史缓存
  history: {
    getHistoryList(filter?: any, options?: any): Promise<{ entries: PageHistoryEntry[]; total: number; hasMore: boolean }>;
    loadXmlContent(historyId: string): Promise<string | null>;
    getHistoryByApp(): Promise<Map<string, PageHistoryEntry[]>>;
    refresh(): Promise<void>;
  };
  
  // 统一操作
  unified: {
    findXmlByPackage(packageName: string): Promise<XmlCoreEntry | null>;
    getRecentXml(limit?: number): Promise<XmlCoreEntry[]>;
    importFromHistory(historyId: string): Promise<string | null>; // 从历史导入到核心缓存
    getStats(): Promise<{
      core: any;
      history: any;
      combined: { totalXmlSources: number; memoryCacheHits: number };
    }>;
  };
}

/**
 * 统一XML缓存管理器
 * 
 * 职责：
 * 1. 协调核心缓存和历史缓存的交互
 * 2. 提供统一的接口给不同功能模块使用
 * 3. 避免直接依赖导致的功能混淆
 * 4. 智能路由缓存请求到合适的存储层
 */
export class UnifiedXmlCache implements UnifiedXmlCacheInterface {
  private static instance: UnifiedXmlCache;
  
  private coreCache: XmlCoreCache;
  private historyCache: PageHistoryCache;
  
  private constructor() {
    this.coreCache = XmlCoreCache.getInstance();
    this.historyCache = PageHistoryCache.getInstance();
  }

  static getInstance(): UnifiedXmlCache {
    if (!this.instance) {
      this.instance = new UnifiedXmlCache();
    }
    return this.instance;
  }

  // 核心快照缓存接口
  core = {
    putSnapshot: async (snapshotId: string, xmlContent: string, xmlHash: string, metadata?: any) => {
      return this.coreCache.putSnapshot(snapshotId, xmlContent, xmlHash, metadata);
    },
    
    getSnapshot: async (snapshotId: string) => {
      return this.coreCache.getSnapshot(snapshotId);
    },
    
    getByHash: async (xmlHash: string) => {
      return this.coreCache.getByHash(xmlHash);
    },
    
    hasSnapshot: async (snapshotId: string) => {
      return this.coreCache.hasSnapshot(snapshotId);
    }
  };

  // 页面历史缓存接口
  history = {
    getHistoryList: async (filter?: any, options?: any) => {
      return this.historyCache.getHistoryList(filter, options);
    },
    
    loadXmlContent: async (historyId: string) => {
      return this.historyCache.loadXmlContent(historyId);
    },
    
    getHistoryByApp: async () => {
      return this.historyCache.getHistoryByApp();
    },
    
    refresh: async () => {
      return this.historyCache.refresh();
    }
  };

  // 统一操作接口
  unified = {
    /**
     * 根据包名智能查找XML
     * 优先从核心缓存查找，再从历史查找
     */
    findXmlByPackage: async (packageName: string): Promise<XmlCoreEntry | null> => {
      console.log(`🔍 按包名查找XML: ${packageName}`);
      
      // 1. 先从核心缓存查找
      const coreStats = await this.coreCache.getStats();
      for (const recent of coreStats.recentAccess) {
        const coreEntry = await this.coreCache.getSnapshot(recent.snapshotId);
        if (coreEntry?.metadata?.packageName === packageName) {
          console.log(`✅ 从核心缓存找到匹配: ${recent.snapshotId}`);
          return coreEntry;
        }
      }
      
      // 2. 从历史缓存查找并导入
      const historyFilter = { appPackage: packageName, limit: 5 };
      const historyResult = await this.historyCache.getHistoryList(historyFilter);
      
      if (historyResult.entries.length > 0) {
        const latestHistory = historyResult.entries[0];
        const xmlContent = await this.historyCache.loadXmlContent(latestHistory.historyId);
        
        if (xmlContent) {
          // 导入到核心缓存
          const xmlHash = this.generateXmlHash(xmlContent);
          const snapshotId = `imported_${latestHistory.historyId}`;
          
          await this.coreCache.putSnapshot(snapshotId, xmlContent, xmlHash, {
            packageName,
            activity: 'unknown',
            importedFrom: 'history',
            originalHistoryId: latestHistory.historyId
          });
          
          console.log(`✅ 从历史导入到核心缓存: ${snapshotId}`);
          return this.coreCache.getSnapshot(snapshotId);
        }
      }
      
      console.warn(`⚠️ 未找到包名为 ${packageName} 的XML`);
      return null;
    },
    
    /**
     * 获取最近的XML（合并核心缓存和历史）
     */
    getRecentXml: async (limit: number = 10): Promise<XmlCoreEntry[]> => {
      const recentEntries: XmlCoreEntry[] = [];
      
      // 从核心缓存获取最近访问
      const coreStats = await this.coreCache.getStats();
      
      for (const recent of coreStats.recentAccess.slice(0, limit)) {
        const entry = await this.coreCache.getSnapshot(recent.snapshotId);
        if (entry) {
          recentEntries.push(entry);
        }
      }
      
      // 如果核心缓存数量不足，从历史补充
      if (recentEntries.length < limit) {
        const remainingCount = limit - recentEntries.length;
        const historyResult = await this.historyCache.getHistoryList({}, { limit: remainingCount });
        
        for (const historyEntry of historyResult.entries) {
          // 检查是否已在核心缓存中
          const existsInCore = recentEntries.some(e => 
            e.metadata?.originalHistoryId === historyEntry.historyId
          );
          
          if (!existsInCore) {
            // 创建临时条目表示历史记录
            const tempEntry: XmlCoreEntry = {
              snapshotId: `history_${historyEntry.historyId}`,
              xmlContent: '', // 懒加载
              xmlHash: '',
              timestamp: historyEntry.timestamp,
              deviceId: 'history',
              metadata: {
                packageName: historyEntry.appPackage,
                isHistoryEntry: true,
                originalHistoryId: historyEntry.historyId
              }
            };
            recentEntries.push(tempEntry);
            
            if (recentEntries.length >= limit) {
              break;
            }
          }
        }
      }
      
      return recentEntries.sort((a, b) => b.timestamp - a.timestamp);
    },
    
    /**
     * 从历史导入XML到核心缓存
     */
    importFromHistory: async (historyId: string): Promise<string | null> => {
      console.log(`📥 从历史导入XML: ${historyId}`);
      
      const xmlContent = await this.historyCache.loadXmlContent(historyId);
      if (!xmlContent) {
        console.error(`❌ 无法加载历史XML内容: ${historyId}`);
        return null;
      }
      
      const historyEntry = await this.historyCache.getHistoryById(historyId);
      const xmlHash = this.generateXmlHash(xmlContent);
      const snapshotId = `imported_${historyId}`;
      
      // 检查是否已存在
      const existing = await this.coreCache.getByHash(xmlHash);
      if (existing) {
        console.log(`✅ XML已存在于核心缓存: ${existing.snapshotId}`);
        return existing.snapshotId;
      }
      
      // 导入到核心缓存
      await this.coreCache.putSnapshot(snapshotId, xmlContent, xmlHash, {
        packageName: historyEntry?.appPackage,
        activity: 'unknown',
        importedFrom: 'history',
        originalHistoryId: historyId,
        importedAt: Date.now()
      });
      
      console.log(`✅ 历史XML已导入到核心缓存: ${snapshotId}`);
      return snapshotId;
    },
    
    /**
     * 获取统计信息
     */
    getStats: async () => {
      const coreStats = await this.coreCache.getStats();
      const historyStats = this.historyCache.getStats();
      
      return {
        core: coreStats,
        history: historyStats,
        combined: {
          totalXmlSources: coreStats.memoryCount + historyStats.totalFiles,
          memoryCacheHits: coreStats.recentAccess.reduce((sum, item) => sum + item.accessCount, 0)
        }
      };
    }
  };

  /**
   * 生成XML哈希
   */
  private generateXmlHash(xmlContent: string): string {
    // 简单哈希函数，实际项目可以使用更强的哈希
    let hash = 0;
    for (let i = 0; i < xmlContent.length; i++) {
      const char = xmlContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 清理所有缓存
   */
  async clearAll(): Promise<void> {
    console.log('🧹 清理所有XML缓存...');
    
    await this.coreCache.cleanup();
    this.historyCache.clear();
    
    console.log('✅ 所有XML缓存已清理');
  }

  /**
   * 预热缓存
   */
  async warmup(): Promise<void> {
    console.log('🔥 预热XML缓存...');
    
    // 初始化历史缓存
    await this.historyCache.initialize();
    
    // 预热核心缓存
    await this.coreCache.warmup();
    
    console.log('✅ XML缓存预热完成');
  }
}

// 导出单例实例
export const unifiedXmlCache = UnifiedXmlCache.getInstance();

// 便捷导出
export default UnifiedXmlCache;