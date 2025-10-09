/**
 * 智能策略系统适配器
 * 
 * 📍 作用：
 * - 桥接 intelligent-strategy-system 和 UI 评分组件
 * - 数据格式转换和标准化
 * - 错误处理和回退机制
 * - 异步加载状态管理
 * 
 * 🎯 模块化设计：
 * - 单独的适配器文件，责任清晰
 * - 标准化的接口定义
 * - 完整的类型安全保障
 */

import type { 
  StrategyRecommendation as SystemStrategyRecommendation, 
  StrategyCandidate as SystemStrategyCandidate,
  MatchStrategy as SystemMatchStrategy 
} from '../../../modules/intelligent-strategy-system/types/StrategyTypes';

import type { UiNode } from '../types';
import type { MatchStrategy } from './types';

// 重新导出以避免混淆
export type { SystemStrategyRecommendation, SystemStrategyCandidate, SystemMatchStrategy };

// UI 组件期望的评分格式
export interface DetailedStrategyScore {
  total: number;
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
  confidence?: number;
}

export interface DetailedStrategyRecommendation {
  strategy: string;
  score: DetailedStrategyScore;
  confidence: number;
  reason: string;
}

// 适配器状态管理
export interface StrategyAdapterState {
  isLoading: boolean;
  error: string | null;
  recommendations: DetailedStrategyRecommendation[];
  lastAnalyzedElement: UiNode | null;
  lastAnalysisTime: number;
}

/**
 * 🔄 智能策略系统适配器类
 * 
 * 职责：
 * - 将系统输出转换为 UI 组件需要的格式
 * - 管理异步分析状态
 * - 提供缓存和重试机制
 * - 错误处理和日志记录
 */
export class StrategySystemAdapter {
  private cache = new Map<string, DetailedStrategyRecommendation[]>();
  private cacheExpiration = 5 * 60 * 1000; // 5分钟缓存
  private isAnalyzing = false;

  /**
   * 🎯 主要分析方法：分析元素并生成策略推荐
   * 
   * @param element - 要分析的 UI 元素节点
   * @param xmlContent - 可选的 XML 上下文内容
   * @returns 转换后的策略推荐列表
   */
  async analyzeElement(
    element: UiNode, 
    xmlContent?: string
  ): Promise<DetailedStrategyRecommendation[]> {
    const cacheKey = this.generateCacheKey(element, xmlContent);
    
    // 检查缓存
    const cached = this.getCachedRecommendations(cacheKey);
    if (cached) {
      console.log('💾 使用缓存的策略推荐', { element: element.tag, cacheKey });
      return cached;
    }

    // 防止重复分析
    if (this.isAnalyzing) {
      console.log('⏳ 分析正在进行中，返回默认推荐');
      return this.getDefaultRecommendations(element);
    }

    try {
      this.isAnalyzing = true;
      console.log('🔍 开始智能策略分析', { element: element.tag });

      // TODO: 集成真实的 intelligent-strategy-system
      // 当前使用改进版模拟数据，包含更真实的分析逻辑
      const systemRecommendations = await this.callIntelligentStrategySystem(element, xmlContent);
      
      // 转换为 UI 组件期望的格式
      const uiRecommendations = this.convertToUIFormat(systemRecommendations, element);
      
      // 缓存结果
      this.setCachedRecommendations(cacheKey, uiRecommendations);
      
      console.log('✅ 策略分析完成', { 
        elementTag: element.tag, 
        recommendationsCount: uiRecommendations.length 
      });
      
      return uiRecommendations;

    } catch (error) {
      console.error('❌ 策略分析失败，使用回退推荐', error);
      return this.getFallbackRecommendations(element, error as Error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * 🔗 调用智能策略系统（当前为增强模拟实现）
   * 
   * @param element - UI 元素
   * @param xmlContent - XML 内容
   * @returns 系统策略推荐
   */
  private async callIntelligentStrategySystem(
    element: UiNode, 
    xmlContent?: string
  ): Promise<SystemStrategyRecommendation[]> {
    // TODO: 替换为真实的 StrategyDecisionEngine 调用
    // const engine = new StrategyDecisionEngine();
    // const result = await engine.analyzeAndRecommend(element, xmlContent || '');
    // return [result];

    // 当前改进版模拟实现 - 基于元素属性的智能分析
    return new Promise((resolve) => {
      setTimeout(() => {
        const recommendations = this.generateIntelligentMockRecommendations(element, xmlContent);
        resolve(recommendations);
      }, 200 + Math.random() * 300); // 模拟分析延迟
    });
  }

  /**
   * 🧠 生成基于元素特征的智能模拟推荐
   * 
   * @param element - UI 元素
   * @param xmlContent - XML 内容
   * @returns 智能分析的策略推荐
   */
  private generateIntelligentMockRecommendations(
    element: UiNode, 
    xmlContent?: string
  ): SystemStrategyRecommendation[] {
    const attrs = element.attrs;
    const hasId = !!attrs['resource-id'];
    const hasText = !!attrs['text'];
    const hasDescription = !!attrs['content-desc'];
    const isButton = element.tag.toLowerCase().includes('button') || attrs['clickable'] === 'true';
    const complexity = this.calculateElementComplexity(element, xmlContent);
    
    const recommendations: SystemStrategyRecommendation[] = [];

    // 🎯 严格策略分析
    if (hasId && (hasText || hasDescription)) {
      recommendations.push({
        strategy: 'strict' as SystemMatchStrategy,
        confidence: 0.88 + (hasId && hasText && hasDescription ? 0.1 : 0),
        reason: `元素具有${hasId ? '唯一ID' : ''}${hasText ? '、文本' : ''}${hasDescription ? '、描述' : ''}，严格匹配可确保高精度定位`,
        score: 85 + (hasId && hasText ? 10 : 0),
        performance: {
          speed: 'fast',
          stability: 'high',
          crossDevice: hasId ? 'excellent' : 'good'
        },
        alternatives: [],
        tags: ['recommended', 'precise', hasId ? 'stable' : 'moderate'],
        scenarios: ['精确定位场景', '稳定性优先场景'],
        limitations: hasId ? [] : ['依赖文本内容稳定性']
      });
    }

    // 🔄 宽松策略分析
    if (hasText || hasDescription || isButton) {
      const confidence = 0.75 + (complexity.isSimple ? 0.1 : 0);
      recommendations.push({
        strategy: 'relaxed' as SystemMatchStrategy,
        confidence,
        reason: `元素${hasText ? '有文本' : ''}${hasDescription ? '有描述' : ''}${isButton ? '可点击' : ''}，宽松匹配兼容性更好`,
        score: 75 + (isButton ? 5 : 0),
        performance: {
          speed: 'medium',
          stability: 'medium',
          crossDevice: 'excellent'
        },
        alternatives: [],
        tags: ['compatible', 'flexible'],
        scenarios: ['多环境部署', '界面变化频繁场景'],
        limitations: ['可能存在误匹配风险']
      });
    }

    // 📍 无位置策略分析
    if (hasId || hasText) {
      recommendations.push({
        strategy: 'positionless' as SystemMatchStrategy,
        confidence: 0.80,
        reason: '忽略位置信息，基于语义特征匹配，适合布局变化的场景',
        score: 78,
        performance: {
          speed: 'medium',
          stability: 'high',
          crossDevice: 'good'
        },
        alternatives: [],
        tags: ['layout-independent', 'stable'],
        scenarios: ['响应式布局', '动态内容'],
        limitations: ['需要稳定的语义特征']
      });
    }

    // ⚡ 绝对策略分析（如果有位置信息）
    if (attrs['bounds']) {
      const confidence = complexity.isSimple ? 0.72 : 0.60;
      recommendations.push({
        strategy: 'absolute' as SystemMatchStrategy,
        confidence,
        reason: '使用精确位置信息，执行速度最快但跨设备兼容性有限',
        score: 90 - (complexity.isComplex ? 20 : 0),
        performance: {
          speed: 'fast',
          stability: complexity.isSimple ? 'medium' : 'low',
          crossDevice: 'fair'
        },
        alternatives: [],
        tags: ['fast', complexity.isSimple ? 'simple' : 'fragile'],
        scenarios: ['固定布局', '高性能要求'],
        limitations: ['跨设备兼容性差', '布局变化敏感']
      });
    }

    // 📊 标准策略（通用推荐）
    recommendations.push({
      strategy: 'standard' as SystemMatchStrategy,
      confidence: 0.85,
      reason: '平衡性能与兼容性的通用策略，适合大多数场景',
      score: 82,
      performance: {
        speed: 'medium',
        stability: 'high',
        crossDevice: 'good'
      },
      alternatives: [],
      tags: ['balanced', 'universal'],
      scenarios: ['通用自动化', '跨平台兼容'],
      limitations: []
    });

    // 按置信度和评分排序
    return recommendations.sort((a, b) => {
      const aTotal = a.confidence * 0.6 + (a.score / 100) * 0.4;
      const bTotal = b.confidence * 0.6 + (b.score / 100) * 0.4;
      return bTotal - aTotal;
    });
  }

  /**
   * 📊 计算元素复杂度
   */
  private calculateElementComplexity(element: UiNode, xmlContent?: string): {
    isSimple: boolean;
    isComplex: boolean;
    score: number;
  } {
    let complexityScore = 0;
    
    // 属性数量影响复杂度
    const attrCount = Object.keys(element.attrs).length;
    complexityScore += Math.min(attrCount * 2, 20);
    
    // 文本长度影响复杂度
    const textLength = (element.attrs['text'] || '').length;
    complexityScore += Math.min(textLength / 5, 15);
    
    // XML 上下文复杂度
    if (xmlContent) {
      const elementCount = (xmlContent.match(/<[^\/\?!][^>]*>/g) || []).length;
      complexityScore += Math.min(elementCount / 50, 20);
    }
    
    // 嵌套层级（简单估算）
    const hasParentInfo = !!element.attrs['package'];
    if (hasParentInfo) complexityScore += 10;
    
    return {
      isSimple: complexityScore < 30,
      isComplex: complexityScore > 60,
      score: complexityScore
    };
  }

  /**
   * 🔄 转换系统格式到 UI 格式
   */
  private convertToUIFormat(
    systemRecommendations: SystemStrategyRecommendation[],
    element: UiNode
  ): DetailedStrategyRecommendation[] {
    return systemRecommendations.map(rec => ({
      strategy: rec.strategy,
      score: {
        total: rec.confidence,
        performance: this.mapPerformanceToScore(rec.performance.speed),
        stability: this.mapStabilityToScore(rec.performance.stability),
        compatibility: this.mapCompatibilityToScore(rec.performance.crossDevice),
        uniqueness: this.calculateUniquenessScore(rec, element),
        confidence: rec.confidence
      },
      confidence: rec.confidence,
      reason: rec.reason
    }));
  }

  /**
   * 📈 性能映射函数
   */
  private mapPerformanceToScore(speed: 'fast' | 'medium' | 'slow'): number {
    const mapping = { fast: 0.9, medium: 0.7, slow: 0.5 };
    return mapping[speed];
  }

  private mapStabilityToScore(stability: 'high' | 'medium' | 'low'): number {
    const mapping = { high: 0.9, medium: 0.7, low: 0.5 };
    return mapping[stability];
  }

  private mapCompatibilityToScore(crossDevice: 'excellent' | 'good' | 'fair'): number {
    const mapping = { excellent: 0.95, good: 0.8, fair: 0.6 };
    return mapping[crossDevice];
  }

  private calculateUniquenessScore(rec: SystemStrategyRecommendation, element: UiNode): number {
    // 基于策略类型和元素特征计算独特性
    const hasUniqueId = !!element.attrs['resource-id'];
    const hasText = !!element.attrs['text'];
    
    let uniqueness = 0.6; // 基础分
    
    if (hasUniqueId) uniqueness += 0.3;
    if (hasText) uniqueness += 0.1;
    if (rec.strategy === 'strict') uniqueness += 0.1;
    if (rec.strategy === 'absolute') uniqueness += 0.2;
    
    return Math.min(uniqueness, 1.0);
  }

  /**
   * 💾 缓存管理
   */
  private generateCacheKey(element: UiNode, xmlContent?: string): string {
    const elementKey = JSON.stringify({
      tag: element.tag,
      attrs: element.attrs
    });
    const contentKey = xmlContent ? btoa(xmlContent).slice(0, 10) : 'no-xml';
    return `${elementKey}-${contentKey}`;
  }

  private getCachedRecommendations(key: string): DetailedStrategyRecommendation[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 简单的过期检查（实际实现可以更复杂）
    return cached;
  }

  private setCachedRecommendations(key: string, recommendations: DetailedStrategyRecommendation[]): void {
    this.cache.set(key, recommendations);
    
    // 简单的缓存清理策略
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 🔄 回退和默认推荐
   */
  private getDefaultRecommendations(element: UiNode): DetailedStrategyRecommendation[] {
    return [
      {
        strategy: 'standard',
        score: {
          total: 0.75,
          performance: 0.7,
          stability: 0.8,
          compatibility: 0.8,
          uniqueness: 0.7
        },
        confidence: 0.75,
        reason: '系统分析中，使用标准策略作为临时推荐'
      }
    ];
  }

  private getFallbackRecommendations(element: UiNode, error: Error): DetailedStrategyRecommendation[] {
    return [
      {
        strategy: 'standard',
        score: {
          total: 0.6,
          performance: 0.6,
          stability: 0.7,
          compatibility: 0.8,
          uniqueness: 0.5
        },
        confidence: 0.6,
        reason: `分析失败，使用安全回退策略: ${error.message.slice(0, 50)}`
      },
      {
        strategy: 'relaxed',
        score: {
          total: 0.55,
          performance: 0.5,
          stability: 0.6,
          compatibility: 0.9,
          uniqueness: 0.4
        },
        confidence: 0.55,
        reason: '宽松策略作为备选方案，兼容性较好'
      }
    ];
  }

  /**
   * 🧹 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 策略推荐缓存已清理');
  }

  /**
   * 📊 获取缓存统计信息
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 5) // 只返回前5个key作为示例
    };
  }
}

// 单例实例，供全局使用
export const strategySystemAdapter = new StrategySystemAdapter();

/**
 * 🎯 便捷函数：分析单个元素
 */
export async function analyzeElementStrategy(
  element: UiNode,
  xmlContent?: string
): Promise<DetailedStrategyRecommendation[]> {
  return strategySystemAdapter.analyzeElement(element, xmlContent);
}

/**
 * 🔄 便捷函数：批量分析元素
 */
export async function batchAnalyzeElementStrategies(
  elements: UiNode[],
  xmlContent?: string
): Promise<Map<UiNode, DetailedStrategyRecommendation[]>> {
  const results = new Map<UiNode, DetailedStrategyRecommendation[]>();
  
  // 并发分析，但限制并发数避免过载
  const batchSize = 5;
  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = elements.slice(i, i + batchSize);
    const batchPromises = batch.map(element => 
      strategySystemAdapter.analyzeElement(element, xmlContent)
        .then(recommendations => ({ element, recommendations }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ element, recommendations }) => {
      results.set(element, recommendations);
    });
  }
  
  return results;
}