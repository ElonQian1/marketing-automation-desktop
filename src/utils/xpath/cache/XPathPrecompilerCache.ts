// src/utils/xpath/cache/XPathPrecompilerCache.ts
// module: shared | layer: utils | role: cache-stub
// summary: XPath预编译缓存存根实现

/**
 * XPath预编译缓存存根
 * TODO: 需要实现完整的XPath缓存功能
 */
export class XPathPrecompilerCache {
  private cache = new Map<string, unknown>();

  get(key: string): unknown {
    console.warn('XPathPrecompilerCache.get: 使用存根实现', key);
    return this.cache.get(key);
  }

  set(key: string, value: unknown): void {
    console.warn('XPathPrecompilerCache.set: 使用存根实现', key, value);
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    console.warn('XPathPrecompilerCache.has: 使用存根实现', key);
    return this.cache.has(key);
  }

  clear(): void {
    console.warn('XPathPrecompilerCache.clear: 使用存根实现');
    this.cache.clear();
  }

  size(): number {
    console.warn('XPathPrecompilerCache.size: 使用存根实现');
    return this.cache.size;
  }
}

// 导出单例实例
export const xpathPrecompilerCache = new XPathPrecompilerCache();
export default xpathPrecompilerCache;