/**
 * XML重用管理器
 * 
 * 管理UI Dump XML的智能缓存和重用机制，减少重复获取
 */

export interface XmlCacheEntry {
  /** 设备ID */
  deviceId: string;
  /** XML内容 */
  content: string;
  /** 获取时间戳 */
  timestamp: number;
  /** XML文件哈希 */
  hash: string;
  /** 解析后的UI树（可选，延迟解析） */
  parsedTree?: any;
  /** 使用计数 */
  usageCount: number;
  /** 缓存版本 */
  version: number;
}

export interface XmlReuseConfig {
  /** 缓存过期时间（毫秒） */
  expiration: number;
  /** 最大缓存条目数 */
  maxEntries: number;
  /** 是否启用自动刷新 */
  autoRefresh: boolean;
  /** 自动刷新间隔（毫秒） */
  refreshInterval: number;
  /** 是否启用XML压缩 */
  enableCompression: boolean;
}

/**
 * XML重用管理器
 */
export class XmlReuseManager {
  private cache = new Map<string, XmlCacheEntry>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();
  private config: XmlReuseConfig;
  
  constructor(config: Partial<XmlReuseConfig> = {}) {
    this.config = {
      expiration: 30000,        // 30秒过期
      maxEntries: 20,           // 最多缓存20个设备的XML
      autoRefresh: false,       // 默认关闭自动刷新
      refreshInterval: 10000,   // 10秒刷新间隔
      enableCompression: false, // 默认关闭压缩
      ...config
    };
  }

  /**
   * 获取或刷新XML
   */
  async getOrRefreshXml(
    deviceId: string, 
    forceRefresh: boolean = false,
    xmlFetcher?: () => Promise<string>
  ): Promise<string> {
    const cacheKey = this.getCacheKey(deviceId);
    const cached = this.cache.get(cacheKey);
    
    // 检查是否需要刷新
    const needsRefresh = forceRefresh || 
                        !cached || 
                        this.isExpired(cached) ||
                        this.hasScreenChanged(deviceId);
    
    if (!needsRefresh && cached) {
      cached.usageCount++;
      return cached.content;
    }
    
    // 获取新的XML
    let xmlContent: string;
    if (xmlFetcher) {
      xmlContent = await xmlFetcher();
    } else {
      xmlContent = await this.fetchXmlFromDevice(deviceId);
    }
    
    // 更新缓存
    this.updateCache(deviceId, xmlContent);
    
    return xmlContent;
  }

  /**
   * 从设备获取XML（需要后端支持）
   */
  private async fetchXmlFromDevice(deviceId: string): Promise<string> {
    // 这里应该调用后端API获取XML
    // 临时返回空字符串，实际应该调用 Tauri 命令
    try {
      // 假设的Tauri命令调用
      // const xml = await invoke('get_ui_dump', { deviceId });
      // return xml;
      return ''; // 临时占位
    } catch (error) {
      console.error('获取XML失败:', error);
      throw error;
    }
  }

  /**
   * 更新缓存
   */
  private updateCache(deviceId: string, xmlContent: string): void {
    const cacheKey = this.getCacheKey(deviceId);
    const hash = this.calculateHash(xmlContent);
    const now = Date.now();
    
    const entry: XmlCacheEntry = {
      deviceId,
      content: xmlContent,
      timestamp: now,
      hash,
      usageCount: 1,
      version: (this.cache.get(cacheKey)?.version || 0) + 1
    };
    
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxEntries && !this.cache.has(cacheKey)) {
      this.evictOldestEntry();
    }
    
    this.cache.set(cacheKey, entry);
    
    // 设置自动刷新（如果启用）
    if (this.config.autoRefresh) {
      this.setupAutoRefresh(deviceId);
    }
  }

  /**
   * 计算XML内容哈希
   */
  private calculateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 检查是否过期
   */
  private isExpired(entry: XmlCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.expiration;
  }

  /**
   * 检查屏幕是否发生变化（简化版）
   */
  private hasScreenChanged(deviceId: string): boolean {
    // 这里可以实现更复杂的屏幕变化检测逻辑
    // 比如比较截图哈希、检查活动窗口等
    return false; // 临时返回false
  }

  /**
   * 淘汰最旧的缓存条目
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.clearAutoRefresh(oldestKey);
    }
  }

  /**
   * 设置自动刷新
   */
  private setupAutoRefresh(deviceId: string): void {
    const cacheKey = this.getCacheKey(deviceId);
    
    // 清除现有定时器
    this.clearAutoRefresh(cacheKey);
    
    // 设置新定时器
    const timer = setTimeout(() => {
      this.getOrRefreshXml(deviceId, true).catch(console.error);
    }, this.config.refreshInterval);
    
    this.refreshTimers.set(cacheKey, timer);
  }

  /**
   * 清除自动刷新定时器
   */
  private clearAutoRefresh(cacheKey: string): void {
    const timer = this.refreshTimers.get(cacheKey);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(cacheKey);
    }
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(deviceId: string): string {
    return `xml_${deviceId}`;
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalEntries: number;
    totalUsage: number;
    averageAge: number;
    hitRate: number;
  } {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const totalEntries = entries.length;
    const totalUsage = entries.reduce((sum, entry) => sum + entry.usageCount, 0);
    const averageAge = totalEntries > 0 
      ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / totalEntries 
      : 0;
    
    // 简化的命中率计算
    const hitRate = totalUsage > totalEntries ? (totalUsage - totalEntries) / totalUsage : 0;
    
    return {
      totalEntries,
      totalUsage,
      averageAge: Math.round(averageAge / 1000), // 转换为秒
      hitRate: Math.round(hitRate * 10000) / 100 // 转换为百分比
    };
  }

  /**
   * 批量预热缓存
   */
  async preloadXmlCache(deviceIds: string[]): Promise<void> {
    const promises = deviceIds.map(deviceId => 
      this.getOrRefreshXml(deviceId, true).catch(error => {
        console.warn(`预加载设备 ${deviceId} 的XML失败:`, error);
        return null;
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): number {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.expiration) {
        this.cache.delete(key);
        this.clearAutoRefresh(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * 强制刷新指定设备的XML
   */
  async forceRefreshDevice(deviceId: string): Promise<string> {
    return this.getOrRefreshXml(deviceId, true);
  }

  /**
   * 获取设备的XML版本号
   */
  getXmlVersion(deviceId: string): number {
    const cacheKey = this.getCacheKey(deviceId);
    const entry = this.cache.get(cacheKey);
    return entry?.version || 0;
  }

  /**
   * 检查XML是否发生变化
   */
  hasXmlChanged(deviceId: string, lastKnownHash?: string): boolean {
    const cacheKey = this.getCacheKey(deviceId);
    const entry = this.cache.get(cacheKey);
    
    if (!entry || !lastKnownHash) return true;
    
    return entry.hash !== lastKnownHash;
  }

  /**
   * 清空所有缓存
   */
  clearAllCache(): void {
    // 清除所有定时器
    for (const timer of this.refreshTimers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.refreshTimers.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<XmlReuseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 如果禁用了自动刷新，清除所有定时器
    if (!this.config.autoRefresh) {
      for (const [key, timer] of this.refreshTimers.entries()) {
        clearTimeout(timer);
      }
      this.refreshTimers.clear();
    }
  }

  /**
   * 获取设备XML缓存条目
   */
  getCacheEntry(deviceId: string): XmlCacheEntry | undefined {
    const cacheKey = this.getCacheKey(deviceId);
    return this.cache.get(cacheKey);
  }
}

/**
 * 全局XML重用管理器实例
 */
export const globalXmlReuseManager = new XmlReuseManager({
  expiration: 45000,      // 45秒过期
  maxEntries: 30,         // 缓存30个设备
  autoRefresh: false,     // 手动控制刷新
  refreshInterval: 15000, // 15秒刷新间隔
  enableCompression: false
});

/**
 * XML差异检测器
 */
export class XmlDiffDetector {
  
  /**
   * 检测两个XML之间的差异
   */
  static detectChanges(oldXml: string, newXml: string): {
    hasChanges: boolean;
    changeCount: number;
    changeTypes: string[];
  } {
    // 简化的差异检测
    const oldHash = this.calculateSimpleHash(oldXml);
    const newHash = this.calculateSimpleHash(newXml);
    
    const hasChanges = oldHash !== newHash;
    
    if (!hasChanges) {
      return {
        hasChanges: false,
        changeCount: 0,
        changeTypes: []
      };
    }
    
    // 分析变化类型（简化版）
    const changeTypes: string[] = [];
    const oldLength = oldXml.length;
    const newLength = newXml.length;
    
    if (Math.abs(oldLength - newLength) > oldLength * 0.1) {
      changeTypes.push('结构性变化');
    } else {
      changeTypes.push('内容变化');
    }
    
    return {
      hasChanges: true,
      changeCount: 1, // 简化计数
      changeTypes
    };
  }

  /**
   * 计算简单哈希
   */
  private static calculateSimpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}