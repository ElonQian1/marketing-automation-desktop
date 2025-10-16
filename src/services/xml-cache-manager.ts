// src/services/xml-cache-manager.ts
// module: xml | layer: service | role: manager
// summary: xml-cache-manager.ts 文件

/**
 * XML缓存管理器
 * 统一管理XML页面的缓存、关联和加载
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

  static getInstance(): XmlCacheManager {
    if (!this.instance) {
      this.instance = new XmlCacheManager();
    }
    return this.instance;
  }

  /**
   * 缓存XML页面数据
   */
  cacheXmlPage(entry: XmlCacheEntry): string {
    const cacheId = entry.cacheId || this.generateCacheId();
    const completeEntry = { ...entry, cacheId };
    
    this.cache.set(cacheId, completeEntry);
    
    // 如果有hash，同时更新hash索引
    if (entry.xmlHash) {
      this.hashIndex.set(entry.xmlHash, completeEntry);
    }
    
    console.log(`📦 XML页面已缓存: ${cacheId}`, {
      deviceId: entry.deviceId,
      elementCount: entry.pageInfo.elementCount,
      contentLength: entry.xmlContent.length,
      xmlHash: entry.xmlHash?.substring(0, 16) + '...' || 'none'
    });
    
    return cacheId;
  }

  /**
   * 缓存XML数据（支持hash索引）
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
    
    this.cache.set(id, entry);
    this.hashIndex.set(xmlHash, entry);
    
    console.log(`📦 XML快照已缓存: ${id}`, {
      xmlHash: xmlHash.substring(0, 16) + '...',
      contentLength: xmlContent.length
    });
  }

  /**
   * 获取缓存的XML数据
   */
  getCachedXml(cacheId: string): XmlCacheEntry | null {
    const entry = this.cache.get(cacheId);
    if (!entry) {
      console.warn(`⚠️ 未找到XML缓存: ${cacheId}`);
      return null;
    }
    return entry;
  }

  /**
   * 通过hash获取XML数据
   */
  getByHash(xmlHash: string): XmlCacheEntry | null {
    const entry = this.hashIndex.get(xmlHash);
    if (!entry) {
      console.warn(`⚠️ 未找到XML哈希: ${xmlHash}`);
      return null;
    }
    return entry;
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
   */
  getStepXmlContext(stepId: string): { xmlData: XmlCacheEntry; context: StepXmlContext } | null {
    const stepContext = this.stepXmlMapping.get(stepId);
    if (!stepContext) {
      console.warn(`⚠️ 步骤未关联XML源: ${stepId}`);
      return null;
    }

    const xmlData = this.getCachedXml(stepContext.xmlCacheId);
    if (!xmlData) {
      console.warn(`⚠️ 步骤关联的XML缓存不存在: ${stepContext.xmlCacheId}`);
      return null;
    }

    return { xmlData, context: stepContext };
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [cacheId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.cache.delete(cacheId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 已清理 ${cleanedCount} 个过期XML缓存`);
    }
  }

  /**
   * 获取最新的XML缓存
   */
  getLatestXmlCache(): XmlCacheEntry | null {
    if (this.cache.size === 0) {
      return null;
    }
    
    const entries = Array.from(this.cache.values());
    return entries.sort((a, b) => b.timestamp - a.timestamp)[0];
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

export default XmlCacheManager;