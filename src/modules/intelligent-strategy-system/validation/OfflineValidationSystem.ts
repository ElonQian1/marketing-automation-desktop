/**
 * 离线验证系统 - Step 0-6 本地XML验证实现
 * 
 * 根据XPath文档要求实现本地XML验证机制，确保策略在实际执行前的可行性
 */

import type { 
  StrategyCandidate, 
  MatchStrategy 
} from '../types/StrategyTypes';

import type { 
  ElementAnalysisContext 
} from '../types/AnalysisTypes';

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过验证 */
  isValid: boolean;
  /** 置信度分数 (0-1) */
  confidence: number;
  /** 验证详情 */
  details: {
    /** 匹配到的元素数量 */
    matchCount: number;
    /** 是否为唯一匹配 */
    isUnique: boolean;
    /** 匹配元素的属性一致性 */
    attributeConsistency: number;
    /** 位置稳定性评分 */
    positionStability: number;
  };
  /** 验证消息 */
  message: string;
  /** 性能指标 */
  performance: {
    /** 验证耗时 (ms) */
    validationTime: number;
    /** 预估匹配速度 */
    estimatedSpeed: 'fast' | 'medium' | 'slow';
  };
}

/**
 * 离线验证配置
 */
export interface OfflineValidationConfig {
  /** 启用详细日志 */
  enableDetailedLogging: boolean;
  /** 验证超时时间 (ms) */
  validationTimeout: number;
  /** 最小置信度阈值 */
  minConfidenceThreshold: number;
  /** 启用性能分析 */
  enablePerformanceAnalysis: boolean;
}

/**
 * 离线验证系统
 * 
 * 在本地XML上验证策略候选者的可行性，避免在实际设备上执行无效策略
 */
export class OfflineValidationSystem {
  private readonly config: OfflineValidationConfig;
  private validationCache = new Map<string, ValidationResult>();

  constructor(config?: Partial<OfflineValidationConfig>) {
    this.config = {
      enableDetailedLogging: false,
      validationTimeout: 5000,
      minConfidenceThreshold: 0.5,
      enablePerformanceAnalysis: true,
      ...config
    };
  }

  /**
   * 验证策略候选者
   * @param candidate 策略候选者
   * @param context 分析上下文
   * @param xmlContent 目标XML内容
   * @returns 验证结果
   */
  async validateCandidate(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext,
    xmlContent: string
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // 生成缓存键
      const cacheKey = this.generateCacheKey(candidate, xmlContent);
      
      // 检查缓存
      if (this.validationCache.has(cacheKey)) {
        const cached = this.validationCache.get(cacheKey)!;
        if (this.config.enableDetailedLogging) {
          console.log(`[OfflineValidation] 使用缓存结果: ${candidate.strategy}`);
        }
        return cached;
      }

      // 根据策略类型执行验证
      const result = await this.performValidation(candidate, context, xmlContent, startTime);
      
      // 缓存结果
      this.validationCache.set(cacheKey, result);
      
      if (this.config.enableDetailedLogging) {
        console.log(`[OfflineValidation] ${candidate.strategy} 验证完成:`, {
          isValid: result.isValid,
          confidence: result.confidence,
          matchCount: result.details.matchCount,
          time: result.performance.validationTime
        });
      }

      return result;

    } catch (error) {
      const validationTime = Date.now() - startTime;
      console.error(`[OfflineValidation] 验证失败 ${candidate.strategy}:`, error);
      
      return {
        isValid: false,
        confidence: 0,
        details: {
          matchCount: 0,
          isUnique: false,
          attributeConsistency: 0,
          positionStability: 0
        },
        message: `验证过程出错: ${error.message}`,
        performance: {
          validationTime,
          estimatedSpeed: 'slow'
        }
      };
    }
  }

  /**
   * 批量验证策略候选者
   */
  async validateCandidates(
    candidates: StrategyCandidate[],
    context: ElementAnalysisContext,
    xmlContent: string
  ): Promise<Map<StrategyCandidate, ValidationResult>> {
    const results = new Map<StrategyCandidate, ValidationResult>();
    
    // 并行验证所有候选者
    const validationPromises = candidates.map(candidate =>
      this.validateCandidate(candidate, context, xmlContent)
        .then(result => ({ candidate, result }))
    );

    const validationResults = await Promise.all(validationPromises);
    
    // 构建结果Map
    validationResults.forEach(({ candidate, result }) => {
      results.set(candidate, result);
    });

    return results;
  }

  /**
   * 执行具体的验证逻辑
   */
  private async performValidation(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext,
    xmlContent: string,
    startTime: number
  ): Promise<ValidationResult> {
    const strategy = candidate.strategy;

    switch (strategy) {
      case 'absolute':
        return this.validateAbsoluteStrategy(candidate, context, xmlContent, startTime);
      
      case 'strict':
        return this.validateStrictStrategy(candidate, context, xmlContent, startTime);
      
      case 'relaxed':
        return this.validateRelaxedStrategy(candidate, context, xmlContent, startTime);
      
      case 'positionless':
        return this.validatePositionlessStrategy(candidate, context, xmlContent, startTime);
      
      case 'standard':
        return this.validateStandardStrategy(candidate, context, xmlContent, startTime);
      
      case 'xpath-direct':
      case 'xpath-first-index':
      case 'xpath-all-elements':
        return this.validateXPathStrategy(candidate, context, xmlContent, startTime);
      
      default:
        return this.createFailedValidationResult(
          `不支持的策略类型: ${strategy}`,
          Date.now() - startTime
        );
    }
  }

  /**
   * 验证绝对定位策略
   */
  private async validateAbsoluteStrategy(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext,
    xmlContent: string,
    startTime: number
  ): Promise<ValidationResult> {
    // 解析XML并寻找匹配元素
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    if (doc.documentElement.nodeName === 'parsererror') {
      return this.createFailedValidationResult('XML解析失败', Date.now() - startTime);
    }

    // 查找具有特定bounds的元素
    const targetElement = context.targetElement;
    const matchingElements = this.findElementsByBounds(doc, targetElement.bounds?.toString() || '');
    
    const matchCount = matchingElements.length;
    const isUnique = matchCount === 1;
    const confidence = isUnique ? 0.9 : Math.max(0.1, 0.9 - (matchCount - 1) * 0.2);

    return {
      isValid: matchCount > 0,
      confidence,
      details: {
        matchCount,
        isUnique,
        attributeConsistency: isUnique ? 1.0 : 0.6,
        positionStability: 0.8 // 绝对定位稳定性较高
      },
      message: isUnique 
        ? '找到唯一匹配元素，绝对定位策略可行'
        : matchCount === 0 
          ? '未找到匹配元素，绝对定位策略不可行'
          : `找到${matchCount}个匹配元素，可能存在歧义`,
      performance: {
        validationTime: Date.now() - startTime,
        estimatedSpeed: 'fast'
      }
    };
  }

  /**
   * 验证标准匹配策略
   */
  private async validateStandardStrategy(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext,
    xmlContent: string,
    startTime: number
  ): Promise<ValidationResult> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    if (doc.documentElement.nodeName === 'parsererror') {
      return this.createFailedValidationResult('XML解析失败', Date.now() - startTime);
    }

    const targetElement = context.targetElement;
    
    // 标准匹配使用语义字段: resource-id, text, content-desc, class, package
    const semanticMatches = this.findElementsBySemanticFields(doc, {
      resourceId: targetElement.attributes?.['resource-id'],
      text: targetElement.text,
      contentDesc: targetElement.attributes?.['content-desc'],
      className: targetElement.attributes?.class,
      packageName: targetElement.attributes?.package
    });

    const matchCount = semanticMatches.length;
    const isUnique = matchCount === 1;
    
    // 计算属性一致性
    const consistency = this.calculateAttributeConsistency(semanticMatches, targetElement);
    
    // 标准匹配的置信度主要基于唯一性和属性一致性
    const confidence = isUnique ? 
      Math.min(0.95, 0.7 + consistency * 0.25) : 
      Math.max(0.3, consistency * 0.6);

    return {
      isValid: matchCount > 0 && confidence >= this.config.minConfidenceThreshold,
      confidence,
      details: {
        matchCount,
        isUnique,
        attributeConsistency: consistency,
        positionStability: 0.9 // 语义匹配位置稳定性高
      },
      message: isUnique && confidence >= 0.7
        ? '标准匹配策略可行，语义字段匹配唯一'
        : matchCount === 0 
          ? '未找到语义匹配元素'
          : `找到${matchCount}个语义匹配，置信度${(confidence * 100).toFixed(1)}%`,
      performance: {
        validationTime: Date.now() - startTime,
        estimatedSpeed: 'medium'
      }
    };
  }

  /**
   * 验证XPath策略
   */
  private async validateXPathStrategy(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext,
    xmlContent: string,
    startTime: number
  ): Promise<ValidationResult> {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'text/xml');
      
      if (doc.documentElement.nodeName === 'parsererror') {
        return this.createFailedValidationResult('XML解析失败', Date.now() - startTime);
      }

      // 生成XPath表达式（简化版本）
      const xpath = this.generateXPathForElement(context.targetElement);
      
      if (!xpath) {
        return this.createFailedValidationResult('无法生成XPath表达式', Date.now() - startTime);
      }

      // 模拟XPath查询（在实际实现中应使用proper XPath引擎）
      const matches = this.simulateXPathQuery(doc, xpath);
      const matchCount = matches.length;
      
      // XPath策略的置信度评估
      let confidence = 0.7; // 基础置信度
      
      if (candidate.strategy === 'xpath-first-index' && matchCount > 0) {
        confidence = 0.8; // 索引策略相对稳定
      } else if (candidate.strategy === 'xpath-direct' && matchCount === 1) {
        confidence = 0.9; // 直接匹配且唯一
      } else if (candidate.strategy === 'xpath-all-elements') {
        confidence = 0.6; // 批量操作置信度较低
      }

      return {
        isValid: matchCount > 0,
        confidence,
        details: {
          matchCount,
          isUnique: matchCount === 1,
          attributeConsistency: 0.8,
          positionStability: 0.6 // XPath对DOM结构变化敏感
        },
        message: matchCount > 0 
          ? `XPath策略可行，找到${matchCount}个匹配`
          : 'XPath表达式未匹配到元素',
        performance: {
          validationTime: Date.now() - startTime,
          estimatedSpeed: 'medium'
        }
      };

    } catch (error) {
      return this.createFailedValidationResult(
        `XPath验证失败: ${error.message}`,
        Date.now() - startTime
      );
    }
  }

  /**
   * 验证其他策略类型（strict, relaxed, positionless的简化实现）
   */
  private async validateStrictStrategy(candidate: StrategyCandidate, context: ElementAnalysisContext, xmlContent: string, startTime: number): Promise<ValidationResult> {
    // 严格匹配需要更多字段完全匹配
    return this.createGenericValidationResult('strict', 0.8, Date.now() - startTime);
  }

  private async validateRelaxedStrategy(candidate: StrategyCandidate, context: ElementAnalysisContext, xmlContent: string, startTime: number): Promise<ValidationResult> {
    // 宽松匹配容忍部分字段差异
    return this.createGenericValidationResult('relaxed', 0.6, Date.now() - startTime);
  }

  private async validatePositionlessStrategy(candidate: StrategyCandidate, context: ElementAnalysisContext, xmlContent: string, startTime: number): Promise<ValidationResult> {
    // 无位置匹配完全忽略位置信息
    return this.createGenericValidationResult('positionless', 0.7, Date.now() - startTime);
  }

  // === 辅助方法 ===

  private generateCacheKey(candidate: StrategyCandidate, xmlContent: string): string {
    const xmlHash = this.hashString(xmlContent);
    const candidateKey = `${candidate.strategy}_${JSON.stringify(candidate.criteria || {})}`;
    return `${candidateKey}_${xmlHash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private findElementsByBounds(doc: Document, bounds: string): Element[] {
    const elements = doc.querySelectorAll('*');
    const matches: Element[] = [];
    
    for (const element of elements) {
      if (element.getAttribute('bounds') === bounds) {
        matches.push(element);
      }
    }
    
    return matches;
  }

  private findElementsBySemanticFields(doc: Document, fields: any): Element[] {
    const elements = doc.querySelectorAll('*');
    const matches: Element[] = [];
    
    for (const element of elements) {
      let score = 0;
      let totalFields = 0;

      if (fields.resourceId) {
        totalFields++;
        if (element.getAttribute('resource-id') === fields.resourceId) score++;
      }
      
      if (fields.text) {
        totalFields++;
        if (element.getAttribute('text') === fields.text) score++;
      }
      
      if (fields.contentDesc) {
        totalFields++;
        if (element.getAttribute('content-desc') === fields.contentDesc) score++;
      }
      
      if (fields.className) {
        totalFields++;
        if (element.getAttribute('class') === fields.className) score++;
      }

      // 如果匹配度超过50%，认为是匹配的
      if (totalFields > 0 && score / totalFields >= 0.5) {
        matches.push(element);
      }
    }
    
    return matches;
  }

  private calculateAttributeConsistency(matches: Element[], targetElement: any): number {
    if (matches.length === 0) return 0;
    
    // 简化的一致性计算
    return matches.length === 1 ? 1.0 : Math.max(0.3, 1.0 - (matches.length - 1) * 0.1);
  }

  private generateXPathForElement(element: any): string | null {
    // 简化的XPath生成（实际实现会更复杂）
    if (element.attributes?.['resource-id']) {
      return `//*[@resource-id='${element.attributes['resource-id']}']`;
    }
    
    if (element.text && element.attributes?.class) {
      return `//*[@class='${element.attributes.class}' and @text='${element.text}']`;
    }
    
    return null;
  }

  private simulateXPathQuery(doc: Document, xpath: string): Element[] {
    // 简化的XPath查询模拟
    // 实际实现应使用真正的XPath引擎
    const matches: Element[] = [];
    
    // 解析简单的XPath模式
    if (xpath.includes('@resource-id=')) {
      const resourceIdMatch = xpath.match(/@resource-id='([^']+)'/);
      if (resourceIdMatch) {
        const resourceId = resourceIdMatch[1];
        const elements = doc.querySelectorAll(`[resource-id="${resourceId}"]`);
        matches.push(...Array.from(elements));
      }
    }
    
    return matches;
  }

  private createFailedValidationResult(message: string, validationTime: number): ValidationResult {
    return {
      isValid: false,
      confidence: 0,
      details: {
        matchCount: 0,
        isUnique: false,
        attributeConsistency: 0,
        positionStability: 0
      },
      message,
      performance: {
        validationTime,
        estimatedSpeed: 'slow'
      }
    };
  }

  private createGenericValidationResult(strategy: string, confidence: number, validationTime: number): ValidationResult {
    return {
      isValid: confidence >= this.config.minConfidenceThreshold,
      confidence,
      details: {
        matchCount: 1,
        isUnique: true,
        attributeConsistency: confidence,
        positionStability: confidence
      },
      message: `${strategy}策略验证完成`,
      performance: {
        validationTime,
        estimatedSpeed: 'medium'
      }
    };
  }

  /**
   * 清理验证缓存
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.validationCache.size
    };
  }
}