// src/services/enhancedLocationService.ts
// module: shared | layer: services | role: 增强定位服务
// summary: 前端增强定位算法集成，提供智能容错匹配能力

import { invoke } from '@tauri-apps/api/core';

/**
 * 增强匹配配置接口
 */
export interface EnhancedMatchingConfig {
  /** 相似度匹配阈值 (0.0 - 1.0) */
  similarityThreshold?: number;
  /** 是否启用模糊匹配 */
  enableFuzzyMatching?: boolean;
  /** 是否启用上下文感知匹配 */
  enableContextMatching?: boolean;
  /** 最大回溯层数 */
  maxFallbackLayers?: number;
  /** 属性权重配置 */
  attributeWeights?: AttributeWeights;
}

/**
 * 属性匹配权重配置
 */
export interface AttributeWeights {
  resourceId?: number;
  text?: number;
  contentDesc?: number;
  className?: number;
  bounds?: number;
  index?: number;
  parentContext?: number;
  siblingContext?: number;
}

/**
 * 增强匹配结果
 */
export interface EnhancedMatchResult {
  success: boolean;
  confidence: number;
  coordinates?: [number, number];
  bounds?: string;
  matchedElement?: ElementInfo;
  matchingStrategy: string;
  fallbackUsed: boolean;
  debugInfo: string[];
}

/**
 * 元素信息接口
 */
export interface ElementInfo {
  className: string;
  resourceId?: string;
  text?: string;
  contentDesc?: string;
  bounds: string;
  index?: number;
  xpath?: string;
}

/**
 * XPath 候选项接口
 */
export interface XPathCandidate {
  xpath: string;
  strategy: string;
  confidence: number;
  description: string;
}

/**
 * 增强定位服务类
 * 
 * 提供多层级容错匹配能力：
 * 1. 智能 XPath 生成和优化
 * 2. 模糊匹配和相似度计算
 * 3. 上下文感知定位
 * 4. 自适应策略调整
 */
export class EnhancedLocationService {
  
  /**
   * 使用增强策略匹配元素
   */
  static async matchElement(
    targetCriteria: Record<string, string>,
    deviceId: string,
    config?: EnhancedMatchingConfig
  ): Promise<EnhancedMatchResult> {
    try {
      const result = await invoke<EnhancedMatchResult>('match_element_enhanced', {
        targetCriteria,
        deviceId,
        config: config || this.getDefaultConfig()
      });

      return result;
    } catch (error) {
      console.error('增强元素匹配失败:', error);
      return {
        success: false,
        confidence: 0,
        matchingStrategy: 'error',
        fallbackUsed: false,
        debugInfo: [`匹配过程出错: ${error}`]
      };
    }
  }

  /**
   * 生成智能 XPath 候选项
   */
  static async generateXPathCandidates(
    elementAttributes: Record<string, string>
  ): Promise<XPathCandidate[]> {
    try {
      const candidates = await invoke<XPathCandidate[]>('generate_xpath_candidates', {
        attributes: elementAttributes
      });

      return candidates;
    } catch (error) {
      console.error('XPath 候选生成失败:', error);
      return [];
    }
  }

  /**
   * 生成最佳 XPath
   */
  static async generateBestXPath(
    elementAttributes: Record<string, string>
  ): Promise<XPathCandidate | null> {
    try {
      const bestCandidate = await invoke<XPathCandidate | null>('generate_best_xpath', {
        attributes: elementAttributes
      });

      return bestCandidate;
    } catch (error) {
      console.error('最佳 XPath 生成失败:', error);
      return null;
    }
  }

  /**
   * 验证 XPath 语法
   */
  static async validateXPath(xpath: string): Promise<boolean> {
    try {
      const isValid = await invoke<boolean>('validate_xpath', {
        xpath
      });

      return isValid;
    } catch (error) {
      console.error('XPath 验证失败:', error);
      return false;
    }
  }

  /**
   * 更新策略成功率（用于自适应优化）
   */
  static async updateStrategySuccessRate(
    strategy: string,
    success: boolean
  ): Promise<void> {
    try {
      await invoke('update_xpath_strategy_success_rate', {
        strategy,
        success
      });
    } catch (error) {
      console.error('策略成功率更新失败:', error);
    }
  }

  /**
   * 获取默认配置
   */
  private static getDefaultConfig(): EnhancedMatchingConfig {
    return {
      similarityThreshold: 0.75,
      enableFuzzyMatching: true,
      enableContextMatching: true,
      maxFallbackLayers: 3,
      attributeWeights: {
        resourceId: 0.9,
        text: 0.8,
        contentDesc: 0.8,
        className: 0.6,
        bounds: 0.3,
        index: 0.4,
        parentContext: 0.7,
        siblingContext: 0.5
      }
    };
  }

  /**
   * 从旧版匹配条件转换为增强匹配条件
   */
  static convertLegacyCriteria(legacyCriteria: any): Record<string, string> {
    const enhanced: Record<string, string> = {};

    // 映射旧版字段到新版
    const fieldMappings: Record<string, string> = {
      'resource_id': 'resource-id',
      'resource-id': 'resource-id',
      'text': 'text',
      'element_text': 'text',
      'content_desc': 'content-desc',
      'content-desc': 'content-desc',
      'class': 'class',
      'className': 'class',
      'element_type': 'class',
      'bounds': 'bounds'
    };

    // 转换已知字段
    for (const [oldKey, newKey] of Object.entries(fieldMappings)) {
      if (legacyCriteria[oldKey]) {
        enhanced[newKey] = legacyCriteria[oldKey];
      }
    }

    // 处理嵌套的 values 对象
    if (legacyCriteria.values && typeof legacyCriteria.values === 'object') {
      for (const [key, value] of Object.entries(legacyCriteria.values)) {
        if (typeof value === 'string' && value.trim()) {
          const mappedKey = fieldMappings[key] || key;
          enhanced[mappedKey] = value;
        }
      }
    }

    return enhanced;
  }

  /**
   * 智能匹配建议
   * 根据元素属性推荐最佳匹配策略
   */
  static suggestMatchingStrategy(elementAttributes: Record<string, string>): {
    strategy: string;
    confidence: number;
    reason: string;
  } {
    // 检查各种属性的可用性和稳定性
    const hasResourceId = elementAttributes['resource-id'] && 
                         elementAttributes['resource-id'].length > 0;
    const hasText = elementAttributes['text'] && 
                   elementAttributes['text'].length > 0;
    const hasContentDesc = elementAttributes['content-desc'] && 
                          elementAttributes['content-desc'].length > 0;
    const hasClass = elementAttributes['class'] && 
                    elementAttributes['class'].length > 0;

    // 策略推荐逻辑
    if (hasResourceId) {
      return {
        strategy: 'xpath-direct',
        confidence: 0.9,
        reason: '具有稳定的 resource-id 属性，推荐使用 XPath 直接定位'
      };
    }

    if (hasContentDesc) {
      return {
        strategy: 'xpath-direct',
        confidence: 0.85,
        reason: '具有明确的 content-desc 属性，适合 XPath 定位'
      };
    }

    if (hasText && elementAttributes['text'].length < 20) {
      return {
        strategy: 'xpath-direct',
        confidence: 0.8,
        reason: '文本内容简短稳定，适合基于文本的 XPath 定位'
      };
    }

    if (hasClass && hasText) {
      return {
        strategy: 'enhanced',
        confidence: 0.75,
        reason: '具有类名和文本，推荐使用增强策略进行组合匹配'
      };
    }

    return {
      strategy: 'enhanced',
      confidence: 0.6,
      reason: '属性信息有限，推荐使用增强策略进行智能容错匹配'
    };
  }

  /**
   * 匹配质量评估
   * 评估匹配结果的可靠性
   */
  static assessMatchQuality(result: EnhancedMatchResult): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = result.confidence;

    // 根据不同因素调整评分
    if (result.fallbackUsed) {
      score *= 0.8;
      suggestions.push('使用了容错机制，建议优化元素属性');
    }

    if (result.matchingStrategy === 'enhanced') {
      if (result.confidence > 0.9) {
        score *= 1.1;
      } else {
        suggestions.push('增强匹配置信度较低，建议检查元素属性完整性');
      }
    }

    if (result.matchingStrategy === 'xpath-direct' && result.confidence > 0.95) {
      score *= 1.2;
      suggestions.push('XPath 直接匹配表现优秀');
    }

    // 评定质量等级
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 0.9) {
      quality = 'excellent';
    } else if (score >= 0.75) {
      quality = 'good';
    } else if (score >= 0.6) {
      quality = 'fair';
      suggestions.push('匹配质量一般，建议优化定位策略');
    } else {
      quality = 'poor';
      suggestions.push('匹配质量较差，需要重新分析元素属性');
    }

    return {
      quality,
      score: Math.min(score, 1.0),
      suggestions
    };
  }
}

export default EnhancedLocationService;