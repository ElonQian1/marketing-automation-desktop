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

  static getInstance(): XmlCacheManager {
    if (!this.instance) {
      this.instance = new XmlCacheManager();
    }
    return this.instance;
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

export default XmlCacheManager;