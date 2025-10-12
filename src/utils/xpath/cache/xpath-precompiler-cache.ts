// src/utils/xpath/cache/xpath-precompiler-cache.ts
// module: xpath | layer: utils | role: cache
// summary: xpath-precompiler-cache.ts 文件

/**
 * 预编译选择器缓存系统
 * 
 * 提供XPath选择器的预编译和缓存功能，优化执行性能
 */

export interface CompiledSelector {
  /** 原始XPath表达式 */
  original: string;
  /** 编译后的选择器标识 */
  compiledId: string;
  /** 编译时间戳 */
  compiledAt: number;
  /** 使用计数 */
  usageCount: number;
  /** 最后使用时间 */
  lastUsed: number;
  /** 是否为高频选择器 */
  isHighFrequency: boolean;
}

export interface CacheConfig {
  /** 最大缓存数量 */
  maxCacheSize: number;
  /** 缓存过期时间（毫秒） */
  expirationTime: number;
  /** 高频选择器阈值 */
  highFrequencyThreshold: number;
  /** 是否启用预编译 */
  enablePrecompilation: boolean;
}

/**
 * XPath预编译缓存管理器
 */
export class XpathPrecompilerCache {
  private cache = new Map<string, CompiledSelector>();
  private config: CacheConfig;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxCacheSize: 1000,
      expirationTime: 30 * 60 * 1000, // 30分钟
      highFrequencyThreshold: 10,
      enablePrecompilation: true,
      ...config
    };
  }

  /**
   * 获取或编译选择器
   */
  getOrCompile(xpath: string): CompiledSelector {
    // 1. 检查缓存
    const cached = this.cache.get(xpath);
    if (cached && !this.isExpired(cached)) {
      cached.usageCount++;
      cached.lastUsed = Date.now();
      this.updateFrequencyStatus(cached);
      return cached;
    }

    // 2. 编译新选择器
    const compiled = this.compileSelector(xpath);
    
    // 3. 添加到缓存
    this.addToCache(xpath, compiled);
    
    return compiled;
  }

  /**
   * 编译选择器
   */
  private compileSelector(xpath: string): CompiledSelector {
    const compiledId = this.generateCompileId(xpath);
    
    return {
      original: xpath,
      compiledId,
      compiledAt: Date.now(),
      usageCount: 1,
      lastUsed: Date.now(),
      isHighFrequency: false
    };
  }

  /**
   * 生成编译ID
   */
  private generateCompileId(xpath: string): string {
    // 1. 标准化XPath表达式
    const normalized = this.normalizeXPath(xpath);
    
    // 2. 生成哈希ID
    return this.hashString(normalized);
  }

  /**
   * 标准化XPath表达式
   */
  private normalizeXPath(xpath: string): string {
    return xpath
      .trim()
      .replace(/\s+/g, ' ')              // 标准化空格
      .replace(/\[\s*(\d+)\s*\]/g, '[$1]') // 标准化索引格式
      .replace(/\[\s*@([^=\]]+)=\s*'([^']*)'\s*\]/g, "[@$1='$2']"); // 标准化属性格式
  }

  /**
   * 字符串哈希函数
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 添加到缓存
   */
  private addToCache(xpath: string, compiled: CompiledSelector): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(xpath, compiled);
  }

  /**
   * 淘汰最少使用的缓存项
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, selector] of this.cache.entries()) {
      if (selector.lastUsed < oldestTime) {
        oldestTime = selector.lastUsed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 检查是否过期
   */
  private isExpired(selector: CompiledSelector): boolean {
    return Date.now() - selector.compiledAt > this.config.expirationTime;
  }

  /**
   * 更新频率状态
   */
  private updateFrequencyStatus(selector: CompiledSelector): void {
    if (selector.usageCount >= this.config.highFrequencyThreshold) {
      selector.isHighFrequency = true;
    }
  }

  /**
   * 预热常用选择器
   */
  precompileCommonSelectors(): void {
    const commonSelectors = [
      // 通用可点击元素
      "//*[@clickable='true']",
      "//*[@text and @clickable='true']",
      
      // 导航相关
      "//*[contains(@resource-id, 'nav')]",
      "//*[contains(@resource-id, 'tab')]",
      "//*[contains(@resource-id, 'bottom')]",
      
      // 按钮相关
      "//*[contains(@class, 'Button')]",
      "//*[@text='确定' or @text='取消' or @text='保存']",
      
      // 输入框相关
      "//*[contains(@class, 'EditText')]",
      "//*[@focusable='true' and @class='android.widget.EditText']",
      
      // 列表相关
      "//*[contains(@class, 'RecyclerView')]",
      "//*[contains(@class, 'ListView')]",
      
      // 图片相关
      "//*[contains(@class, 'ImageView') and @clickable='true']"
    ];
    
    for (const xpath of commonSelectors) {
      this.getOrCompile(xpath);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): number {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [key, selector] of this.cache.entries()) {
      if (now - selector.compiledAt > this.config.expirationTime) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalCached: number;
    highFrequencyCount: number;
    averageUsage: number;
    hitRate: number;
  } {
    const selectors = Array.from(this.cache.values());
    const totalCached = selectors.length;
    const highFrequencyCount = selectors.filter(s => s.isHighFrequency).length;
    const totalUsage = selectors.reduce((sum, s) => sum + s.usageCount, 0);
    const averageUsage = totalCached > 0 ? totalUsage / totalCached : 0;
    
    // 命中率计算（简化版）
    const hitRate = totalUsage > totalCached ? (totalUsage - totalCached) / totalUsage : 0;
    
    return {
      totalCached,
      highFrequencyCount,
      averageUsage: Math.round(averageUsage * 100) / 100,
      hitRate: Math.round(hitRate * 10000) / 100 // 转换为百分比
    };
  }

  /**
   * 导出高频选择器
   */
  exportHighFrequencySelectors(): CompiledSelector[] {
    return Array.from(this.cache.values())
      .filter(selector => selector.isHighFrequency)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * 批量预编译选择器
   */
  batchPrecompile(xpaths: string[]): CompiledSelector[] {
    return xpaths.map(xpath => this.getOrCompile(xpath));
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 设置配置
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 全局预编译缓存实例
 */
export const globalXPathCache = new XpathPrecompilerCache({
  maxCacheSize: 2000,
  expirationTime: 60 * 60 * 1000, // 1小时
  highFrequencyThreshold: 5,
  enablePrecompilation: true
});

/**
 * XPath性能优化工具
 */
export class XPathPerformanceOptimizer {
  
  /**
   * 优化XPath表达式
   */
  static optimizeXPath(xpath: string): string {
    let optimized = xpath;
    
    // 1. 移除不必要的 descendant-or-self
    optimized = optimized.replace(/\/\/\./g, '/');
    
    // 2. 使用更具体的轴
    optimized = optimized.replace(/\/\/\*/g, '/descendant::*');
    
    // 3. 将文本匹配移到更早的位置
    optimized = this.moveTextMatchesToFront(optimized);
    
    // 4. 简化重复的属性条件
    optimized = this.simplifyAttributeConditions(optimized);
    
    return optimized;
  }

  /**
   * 将文本匹配移到前面
   */
  private static moveTextMatchesToFront(xpath: string): string {
    // 如果XPath包含文本匹配且不在开头，尝试重新排列
    const textMatch = xpath.match(/\[@text='([^']+)'\]/);
    if (textMatch && !xpath.startsWith(`//*[@text='${textMatch[1]}']`)) {
      return `//*[@text='${textMatch[1]}']` + xpath.replace(textMatch[0], '');
    }
    return xpath;
  }

  /**
   * 简化属性条件
   */
  private static simplifyAttributeConditions(xpath: string): string {
    // 合并相同属性的多个条件
    return xpath.replace(/\[@([^=]+)='([^']+)'\].*?\[@\1='([^']+)'\]/g, (match, attr, val1, val2) => {
      if (val1 === val2) {
        return `[@${attr}='${val1}']`;
      }
      return match;
    });
  }

  /**
   * 估算XPath复杂度
   */
  static estimateComplexity(xpath: string): {
    score: number;
    factors: string[];
  } {
    let score = 0;
    const factors: string[] = [];
    
    // 基础复杂度
    score += xpath.length * 0.1;
    
    // descendant-or-self 轴 (//) 增加复杂度
    const descendantCount = (xpath.match(/\/\//g) || []).length;
    score += descendantCount * 3;
    if (descendantCount > 0) factors.push(`${descendantCount}个//轴`);
    
    // 通配符增加复杂度
    const wildcardCount = (xpath.match(/\*/g) || []).length;
    score += wildcardCount * 2;
    if (wildcardCount > 0) factors.push(`${wildcardCount}个通配符`);
    
    // 文本匹配条件
    const textConditions = (xpath.match(/\[@text=/g) || []).length;
    score += textConditions * 1;
    if (textConditions > 0) factors.push(`${textConditions}个文本条件`);
    
    // contains 函数增加复杂度
    const containsCount = (xpath.match(/contains\(/g) || []).length;
    score += containsCount * 1.5;
    if (containsCount > 0) factors.push(`${containsCount}个contains`);
    
    return {
      score: Math.round(score * 100) / 100,
      factors
    };
  }
}