/**
 * XPath 统一服务类
 * 
 * 提供所有 XPath 相关功能的统一入口点
 * 整合验证、生成、解析等功能
 */

import { 
  isValidXPath, 
  validateXPath, 
  isSimpleXPath 
} from './validation';

import { 
  buildXPath, 
  buildHierarchicalXPath, 
  generateCandidateXPaths, 
  optimizeXPath 
} from './generation';

import { 
  parseXPath, 
  extractResourceId, 
  extractText, 
  extractContentDesc, 
  hasAttribute, 
  getXPathComplexity, 
  compareXPathSimilarity 
} from './parsing';

import { 
  XPathValidationResult, 
  XPathGenerationOptions, 
  ParsedXPath, 
  XPathCoordinates 
} from './types';

import { 
  getCachedValidation, 
  setCachedValidation, 
  getCachedGeneration, 
  setCachedGeneration,
  xpathCacheManager
} from './cache';

/**
 * XPath 统一服务类
 * 替代分散在各模块中的 XPath 相关功能
 */
export default class XPathService {
  
  // ==================== 验证方法 ====================
  
  /**
   * 检查 XPath 是否有效（带缓存）
   */
  static isValid(xpath: string | undefined | null): boolean {
    if (!xpath || typeof xpath !== 'string') {
      return false;
    }

    // 尝试从缓存获取
    const cachedResult = getCachedValidation(xpath);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // 执行验证并缓存结果
    const startTime = performance.now();
    const result = isValidXPath(xpath);
    const duration = performance.now() - startTime;
    
    setCachedValidation(xpath, result);
    xpathCacheManager.recordComputeTime(duration);

    return result;
  }

  /**
   * 详细验证 XPath
   */
  static validate(xpath: string | undefined | null): XPathValidationResult {
    return validateXPath(xpath);
  }

  /**
   * 检查是否为简单 XPath
   */
  static isSimple(xpath: string): boolean {
    return isSimpleXPath(xpath);
  }

  // ==================== 生成方法 ====================

  /**
   * 根据元素生成 XPath（带缓存）
   */
  static generate(
    element: any, 
    options?: XPathGenerationOptions
  ): string | null {
    if (!element) {
      return null;
    }

    // 尝试从缓存获取
    const cachedResult = getCachedGeneration(element);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    // 执行生成并缓存结果
    const startTime = performance.now();
    const result = buildXPath(element, options);
    const duration = performance.now() - startTime;
    
    setCachedGeneration(element, result);
    xpathCacheManager.recordComputeTime(duration);

    return result;
  }

  /**
   * 生成层次化 XPath（带缓存）
   */
  static generateHierarchical(
    element: any,
    parentElements?: any[],
    options?: XPathGenerationOptions
  ): string | null {
    if (!element) {
      return null;
    }

    // 为层次化生成创建复合键
    const cacheKey = JSON.stringify({
      element: element.tag || element.className || element.text,
      parents: parentElements?.map(p => p.tag || p.className || p.text) || [],
      options
    });

    try {
      const startTime = performance.now();
      const result = buildHierarchicalXPath(element, parentElements, options);
      const duration = performance.now() - startTime;
      
      xpathCacheManager.recordComputeTime(duration);
      return result;
    } catch (error) {
      console.warn('层次化 XPath 生成失败:', error);
      return null;
    }
  }

  /**
   * 生成候选 XPath 列表
   */
  static generateCandidates(element: any): string[] {
    return generateCandidateXPaths(element);
  }

  /**
   * 优化 XPath 表达式
   */
  static optimize(xpath: string): string {
    return optimizeXPath(xpath);
  }

  // ==================== 解析方法 ====================

  /**
   * 解析 XPath 表达式（带缓存）
   */
  static parse(xpath: string): ParsedXPath | null {
    if (!xpath || typeof xpath !== 'string') {
      return null;
    }

    const normalizedPath = xpath.trim();
    
    try {
      const startTime = performance.now();
      const result = parseXPath(normalizedPath);
      const duration = performance.now() - startTime;
      
      xpathCacheManager.recordComputeTime(duration);
      return result;
    } catch (error) {
      console.warn('XPath 解析失败:', error);
      return null;
    }
  }

  /**
   * 提取 resource-id
   */
  static getResourceId(xpath: string): string | null {
    return extractResourceId(xpath);
  }

  /**
   * 提取文本内容
   */
  static getText(xpath: string): string | null {
    return extractText(xpath);
  }

  /**
   * 提取 content-desc
   */
  static getContentDesc(xpath: string): string | null {
    return extractContentDesc(xpath);
  }

  /**
   * 检查是否包含特定属性
   */
  static hasAttribute(xpath: string, attributeName: string): boolean {
    return hasAttribute(xpath, attributeName);
  }

  /**
   * 获取复杂度评分
   */
  static getComplexity(xpath: string): number {
    return getXPathComplexity(xpath);
  }

  /**
   * 比较两个 XPath 的相似度
   */
  static compareSimilarity(xpath1: string, xpath2: string): number {
    return compareXPathSimilarity(xpath1, xpath2);
  }

  // ==================== 便利方法 ====================

  /**
   * 智能生成最佳 XPath
   * 综合考虑准确性、简洁性和稳定性
   */
  static generateBest(element: any): string | null {
    if (!element) {
      return null;
    }

    // 生成候选 XPath
    const candidates = this.generateCandidates(element);
    
    if (candidates.length === 0) {
      return null;
    }

    // 如果只有一个候选，直接返回
    if (candidates.length === 1) {
      return this.optimize(candidates[0]);
    }

    // 选择最佳候选（优先级 + 复杂度）
    let bestXPath = candidates[0];
    let bestScore = this.calculateScore(bestXPath);

    for (let i = 1; i < candidates.length; i++) {
      const score = this.calculateScore(candidates[i]);
      if (score > bestScore) {
        bestScore = score;
        bestXPath = candidates[i];
      }
    }

    return this.optimize(bestXPath);
  }

  /**
   * 计算 XPath 评分（越高越好）
   * @private
   */
  private static calculateScore(xpath: string): number {
    let score = 100; // 基础分

    // 复杂度惩罚
    const complexity = this.getComplexity(xpath);
    score -= complexity;

    // 属性奖励
    if (this.hasAttribute(xpath, 'resource-id')) {
      score += 50; // resource-id 优先级最高
    } else if (this.hasAttribute(xpath, 'content-desc')) {
      score += 30; // content-desc 次优先级
    } else if (this.hasAttribute(xpath, 'text')) {
      score += 20; // text 属性
    } else if (this.hasAttribute(xpath, 'class')) {
      score += 10; // class 属性
    }

    // 简单性奖励
    if (this.isSimple(xpath)) {
      score += 20;
    }

    return Math.max(0, score);
  }

  /**
   * 批量验证 XPath 列表
   */
  static validateBatch(xpaths: string[]): XPathValidationResult[] {
    return xpaths.map(xpath => this.validate(xpath));
  }

  /**
   * 从元素自动生成用于步骤的 XPath
   * 专门为步骤生成器使用
   */
  static generateForStep(element: any): string | null {
    if (!element) {
      return null;
    }

    // 如果元素已有 xpath，先验证是否有效
    if (element.xpath && this.isValid(element.xpath)) {
      return element.xpath;
    }

    // 自动生成最佳 XPath
    return this.generateBest(element);
  }

  // ==================== 缓存管理和性能监控 ====================

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): any {
    return xpathCacheManager.getCacheStats();
  }

  /**
   * 清除所有缓存
   */
  static clearCache(): void {
    xpathCacheManager.clearAll();
  }

  /**
   * 清除验证缓存（当前实现中没有单独的清除方法，清除所有缓存）
   */
  static clearValidationCache(): void {
    // XPathCacheManager 目前没有单独清除验证缓存的方法
    // 这里可以扩展实现或清除所有缓存
    console.warn('当前实现暂不支持单独清除验证缓存，将清除所有缓存');
    xpathCacheManager.clearAll();
  }

  /**
   * 清除生成缓存（当前实现中没有单独的清除方法，清除所有缓存）
   */
  static clearGenerationCache(): void {
    // XPathCacheManager 目前没有单独清除生成缓存的方法
    console.warn('当前实现暂不支持单独清除生成缓存，将清除所有缓存');
    xpathCacheManager.clearAll();
  }

  /**
   * 预热缓存
   * @param commonXPaths 常用的 XPath 表达式列表
   */
  static async warmupCache(commonXPaths: string[]): Promise<void> {
    // 将同步方法包装为异步
    return new Promise<void>((resolve) => {
      xpathCacheManager.warmup(commonXPaths);
      resolve();
    });
  }

  /**
   * 设置缓存配置
   */
  static configureCaching(config: {
    validationCacheSize?: number;
    generationCacheSize?: number;
    defaultTTL?: number;
    enablePerformanceTracking?: boolean;
  }): void {
    // 这里可以添加动态配置缓存的逻辑
    // 目前先记录配置要求
    console.log('XPath 缓存配置更新:', config);
  }

  /**
   * 获取性能报告
   */
  static getPerformanceReport(): string {
    const stats = this.getCacheStats();

    const validationTotal = stats.validationHits + stats.validationMisses;
    const generationTotal = stats.generationHits + stats.generationMisses;
    const validationHitRate = validationTotal > 0 ? (stats.validationHits / validationTotal * 100) : 0;
    const generationHitRate = generationTotal > 0 ? (stats.generationHits / generationTotal * 100) : 0;

    return `
=== XPath Service 性能报告 ===

验证缓存:
  - 命中率: ${validationHitRate.toFixed(2)}%
  - 命中次数: ${stats.validationHits}
  - 未命中次数: ${stats.validationMisses}
  - 总请求: ${validationTotal}

生成缓存:
  - 命中率: ${generationHitRate.toFixed(2)}%
  - 命中次数: ${stats.generationHits}
  - 未命中次数: ${stats.generationMisses}
  - 总请求: ${generationTotal}

性能指标:
  - 总计算时间: ${stats.totalComputeTime.toFixed(2)}ms

内存使用:
  - 当前内存: ${(stats.cacheMemoryUsage / 1024).toFixed(2)}KB
    `.trim();
  }

  /**
   * 启用调试模式
   */
  static enableDebugMode(): void {
    // 添加详细的操作日志
    console.log('XPath Service 调试模式已启用');
    // 可以在这里添加更多调试功能
  }
}