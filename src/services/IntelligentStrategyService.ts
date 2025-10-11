// src/services/IntelligentStrategyService.ts
// module: shared | layer: unknown | role: component
// summary: IntelligentStrategyService.ts 文件

/**
 * IntelligentStrategyService.ts
 * 智能策略推荐服务 - 统一服务入口
 * 
 * @description 封装智能策略决策引擎，提供简洁的API接口
 */

import { StrategyDecisionEngine } from '../modules/intelligent-strategy-system/core/StrategyDecisionEngine';
import type { 
  StrategyRecommendation,
  MatchStrategy 
} from '../modules/intelligent-strategy-system/types/StrategyTypes';
import type { DecisionEngineConfig } from '../modules/intelligent-strategy-system/types/DecisionTypes';
// 使用项目中实际的元素类型定义
interface ElementLike {
  text?: string;
  resource_id?: string;
  content_desc?: string;
  class?: string;
  class_name?: string;
  tag?: string;
  xpath?: string;
  index?: string | number;
  bounds?: string;
  element_type?: string;
  is_clickable?: boolean;
  is_scrollable?: boolean;
  is_enabled?: boolean;
  attrs?: Record<string, string>;
}

/**
 * 推荐结果扩展信息
 */
export interface EnhancedRecommendation extends StrategyRecommendation {
  /** 生成的步骤卡片参数 */
  stepCardParams?: {
    xmlSnapshot: string;
    absoluteXPath: string;
    selectedStrategy: MatchStrategy;
    plan?: any[];
    recommendedIndex?: number;
  };
  
  /** 执行统计 */
  executionStats?: {
    totalTime: number;
    stepCount: number;
    candidateCount: number;
  };
}

/**
 * 智能策略推荐服务
 * 
 * 核心功能：
 * 1. 分析元素并推荐最佳匹配策略
 * 2. 生成步骤卡片所需的完整参数
 * 3. 提供批量分析能力
 */
export class IntelligentStrategyService {
  private readonly decisionEngine: StrategyDecisionEngine;
  private static instance: IntelligentStrategyService | null = null;

  constructor(config?: Partial<DecisionEngineConfig>) {
    this.decisionEngine = new StrategyDecisionEngine(config);
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<DecisionEngineConfig>): IntelligentStrategyService {
    if (!this.instance) {
      this.instance = new IntelligentStrategyService(config);
    }
    return this.instance;
  }

  /**
   * 🎯 核心方法：分析元素并推荐策略
   * 这是"点击确定即生成推荐策略"的核心实现
   * 
   * @param element 目标UI元素节点
   * @param xmlContent 页面XML内容
   * @returns 增强的推荐结果，包含步骤卡片参数
   */
  async analyzeElementAndRecommend(
    element: ElementLike, 
    xmlContent: string
  ): Promise<EnhancedRecommendation> {
    const startTime = Date.now();
    
    try {
      // 1. 执行智能决策引擎分析
      const recommendation = await this.decisionEngine.analyzeAndRecommend(element, xmlContent);
      
      // 2. 生成步骤卡片参数
      const stepCardParams = this.generateStepCardParams(element, xmlContent, recommendation);
      
      // 3. 计算执行统计
      const executionStats = {
        totalTime: Date.now() - startTime,
        stepCount: 6, // Step 0-6
        candidateCount: recommendation.alternatives?.length || 0
      };

      // 4. 返回增强的推荐结果
      const enhancedRecommendation: EnhancedRecommendation = {
        ...recommendation,
        stepCardParams,
        executionStats
      };

      console.log('✅ 智能策略推荐完成', {
        strategy: recommendation.strategy,
        confidence: recommendation.confidence,
        totalTime: executionStats.totalTime
      });

      return enhancedRecommendation;
      
    } catch (error) {
      console.error('❌ 智能策略推荐失败:', error);
      
      // 返回回退推荐
      return this.createFallbackRecommendation(element, xmlContent, error as Error);
    }
  }

  /**
   * 🔄 批量分析多个元素
   * 
   * @param elements 元素数组
   * @param xmlContent XML内容
   * @returns 推荐结果数组
   */
  async batchAnalyzeElements(
    elements: ElementLike[], 
    xmlContent: string
  ): Promise<EnhancedRecommendation[]> {
    const results = await Promise.all(
      elements.map(element => this.analyzeElementAndRecommend(element, xmlContent))
    );
    
    console.log(`✅ 批量策略分析完成，处理了 ${elements.length} 个元素`);
    return results;
  }

  /**
   * 🎨 预览策略效果
   * 在不生成步骤卡片的情况下预览推荐策略
   * 
   * @param element 目标元素
   * @param xmlContent XML内容
   * @returns 仅包含策略推荐的结果
   */
  async previewStrategyRecommendation(
    element: ElementLike, 
    xmlContent: string
  ): Promise<StrategyRecommendation> {
    return await this.decisionEngine.analyzeAndRecommend(element, xmlContent);
  }

  /**
   * ⚙️ 更新引擎配置
   * 
   * @param newConfig 新的配置选项
   */
  updateEngineConfig(newConfig: Partial<DecisionEngineConfig>): void {
    this.decisionEngine.updateConfig(newConfig);
  }

  /**
   * 📊 获取引擎统计信息
   */
  getEngineStats(): any {
    return {
      config: this.decisionEngine.getConfig(),
      version: '1.0.0',
      features: [
        'Step 0-6 智能分析',
        '候选策略评分',
        '本地唯一性验证',
        '跨设备兼容性评估'
      ]
    };
  }

  // === 私有辅助方法 ===

  /**
   * 生成步骤卡片所需的参数
   */
  private generateStepCardParams(
    element: ElementLike, 
    xmlContent: string, 
    recommendation: StrategyRecommendation
  ): any {
    return {
      xmlSnapshot: xmlContent,
      absoluteXPath: this.generateAbsoluteXPath(element),
      selectedStrategy: recommendation.strategy,
      plan: recommendation.alternatives || [],
      recommendedIndex: 0, // 推荐策略默认为第一个
      
      // 扩展参数
      confidence: recommendation.confidence,
      performance: recommendation.performance,
      assertions: this.generateAssertions(element),
      allowBackendFallback: true,
      timeBudgetMs: 1200 // 按文档建议的时间预算
    };
  }

  /**
   * 生成元素的绝对XPath
   */
  private generateAbsoluteXPath(element: ElementLike): string {
    // 如果元素已有XPath，直接使用
    if (element.xpath) {
      return element.xpath;
    }
    
    // 否则生成基于位置的绝对XPath
    // 这里可以集成现有的XPath生成逻辑
    const index = element.index || element.attrs?.['index'];
    return `//node[@index='${index}']`; // 简化实现
  }

  /**
   * 生成轻校验断言
   */
  private generateAssertions(element: ElementLike): string[] {
    const assertions: string[] = [];
    
    if (element.text) {
      assertions.push(`contains text: "${element.text}"`);
    }
    
    if (element.resource_id) {
      assertions.push(`has resource-id: "${element.resource_id}"`);
    }
    
    if (element.tag || element.class || element.class_name) {
      const elementType = element.tag || element.class || element.class_name;
      assertions.push(`element type: "${elementType}"`);
    }
    
    return assertions;
  }

  /**
   * 创建回退推荐（当智能分析失败时）
   */
  private createFallbackRecommendation(
    element: ElementLike, 
    xmlContent: string, 
    error: Error
  ): EnhancedRecommendation {
    const fallbackStrategy: MatchStrategy = element.xpath ? 'xpath-direct' : 'standard';
    
    return {
      strategy: fallbackStrategy,
      confidence: 0.3,
      reason: `智能分析失败，使用回退策略: ${error.message}`,
      score: 30,
      performance: {
        speed: 'medium',
        stability: 'medium',
        crossDevice: 'fair'
      },
      alternatives: [],
      tags: ['fallback'],
      scenarios: ['智能分析失败时的安全选择'],
      limitations: ['未经智能优化，可能不是最佳策略'],
      
      stepCardParams: this.generateStepCardParams(element, xmlContent, {
        strategy: fallbackStrategy,
        confidence: 0.3,
        reason: 'Fallback strategy',
        score: 30,
        performance: { speed: 'medium', stability: 'medium', crossDevice: 'fair' },
        alternatives: [],
        tags: [],
        scenarios: [],
        limitations: []
      }),
      
      executionStats: {
        totalTime: 0,
        stepCount: 0,
        candidateCount: 0
      }
    };
  }
}

// === 便捷的导出函数 ===

/**
 * 🚀 快速分析元素并推荐策略
 * 适合在页面分析器的"确定"按钮中直接调用
 */
export const analyzeElementForStrategy = async (
  element: ElementLike, 
  xmlContent: string
): Promise<EnhancedRecommendation> => {
  const service = IntelligentStrategyService.getInstance();
  return await service.analyzeElementAndRecommend(element, xmlContent);
};

/**
 * 🎯 预览策略推荐
 * 适合在策略选择器中显示推荐标识
 */
export const previewStrategyForElement = async (
  element: ElementLike, 
  xmlContent: string
): Promise<StrategyRecommendation> => {
  const service = IntelligentStrategyService.getInstance();
  return await service.previewStrategyRecommendation(element, xmlContent);
};

// 默认导出服务类
export default IntelligentStrategyService;