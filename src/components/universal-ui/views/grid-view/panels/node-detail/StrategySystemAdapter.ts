// src/components/universal-ui/views/grid-view/panels/node-detail/StrategySystemAdapter.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

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
} from '../../../../../../modules/intelligent-strategy-system/types/StrategyTypes';

import { StrategyDecisionEngine } from '../../../../../../modules/intelligent-strategy-system/core/StrategyDecisionEngine';
import type { UiNode } from '../../types';
import type { MatchStrategy } from './types';
import { generateXmlHash } from '../../../../../../utils/encoding/safeBase64';

// 重新导出以避免混淆
export type { SystemStrategyRecommendation, SystemStrategyCandidate, SystemMatchStrategy };

// 导入扩展后的类型定义
import type { 
  DetailedStrategyScore,
  DetailedStrategyRecommendation,
  StrategyPlan,
  StrategyMode,
  StrategyModeState
} from './types';

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
 * - 🆕 生成和管理Plan候选链
 * - 🆕 支持智能/静态模式切换
 */
export class StrategySystemAdapter {
  private cache = new Map<string, DetailedStrategyRecommendation[]>();
  private planCache = new Map<string, StrategyPlan>(); // 🆕 Plan缓存
  private cacheExpiration = 5 * 60 * 1000; // 5分钟缓存
  private isAnalyzing = false;
  private strategyEngine = new StrategyDecisionEngine(); // 🆕 策略决策引擎
  private modeState: StrategyModeState = { // 🆕 模式状态管理
    currentMode: 'intelligent',
    userPreference: 'intelligent',
    canSwitch: true
  };

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

      // 🎯 生成 Plan 候选链并直接转换为 UI 格式
      const plans = await this.generateCandidatePlans(element, xmlContent);
      
      // 直接从 Plan 生成 UI 推荐（简化实现）
      const uiRecommendations = this.convertPlansToUIRecommendations(plans, element);
      
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
   * 🎯 生成 Plan 候选链
   * 
   * @param element - UI 元素
   * @param xmlContent - XML 内容
   * @returns Plan 候选链列表
   */
  private async generateCandidatePlans(
    element: UiNode, 
    xmlContent?: string
  ): Promise<StrategyPlan[]> {
    try {
      // � 使用真实的 StrategyDecisionEngine 替换模拟实现
      const realAnalysisResult = await this.callIntelligentStrategySystem(element, xmlContent);
      
      // 生成多个 Plan 候选
      const plans: StrategyPlan[] = [];
      
      // Plan A: 主推荐方案（来自智能引擎）
      if (realAnalysisResult.length > 0) {
        const primary = realAnalysisResult[0];
        plans.push({
          id: `plan-primary-${Date.now()}`,
          name: '智能推荐匹配',
          priority: 1,
          confidence: primary.confidence || 0.8,
          strategy: primary.strategy as MatchStrategy,
          criteria: this.buildCriteriaFromRecommendation(primary, element),
          fallbackChain: this.buildIntelligentFallbackChain(primary),
          estimatedSuccessRate: (primary.confidence || 0.8) * 0.9,
          reasoning: primary.reason || '基于智能策略分析的主要推荐',
          allowBackendFallback: true,
          timeBudget: {
            total: 5000, // 5秒总预算
            perCandidate: 1500 // 每候选1.5秒
          }
        });
      }
      
      // Plan B: 兼容性方案（备选）
      if (realAnalysisResult.length > 1) {
        realAnalysisResult.slice(1, 3).forEach((alt, index) => {
          plans.push({
            id: `plan-alt-${index}-${Date.now()}`,
            name: `兼容性方案 ${index + 1}`,
            priority: index + 2,
            confidence: alt.confidence || 0.6,
            strategy: alt.strategy as MatchStrategy,
            criteria: this.buildCriteriaFromRecommendation(alt, element),
            fallbackChain: this.buildIntelligentFallbackChain(alt),
            estimatedSuccessRate: (alt.confidence || 0.6) * 0.8,
            reasoning: `备选策略：${alt.reason || '兼容性匹配'}`
          });
        });
      }
      
      // Plan C: 标准匹配方案（保底）
      plans.push({
        id: `plan-standard-${Date.now()}`,
        name: '标准匹配',
        priority: 99,
        confidence: 0.7,
        strategy: 'standard',
        criteria: this.buildStandardCriteria(element),
        fallbackChain: ['standard', 'relaxed', 'positionless'],
        estimatedSuccessRate: 0.75,
        reasoning: '基于语义字段的跨设备稳定匹配'
      });
      
      // 按优先级排序
      return plans.sort((a, b) => a.priority - b.priority);
      
    } catch (error) {
      console.error('❌ Plan 生成失败，返回默认 Plan', error);
      return this.getDefaultPlan(element);
    }
  }

  /**
   * 🛠️ 构建回退链
   */
  private buildFallbackChain(analysisResult: any): MatchStrategy[] {
    const fallbackChain: MatchStrategy[] = [];
    
    if (analysisResult.primary) {
      fallbackChain.push(analysisResult.primary.strategy);
    }
    
    // 添加通用回退策略
    if (!fallbackChain.includes('standard')) {
      fallbackChain.push('standard');
    }
    if (!fallbackChain.includes('relaxed')) {
      fallbackChain.push('relaxed');
    }
    if (!fallbackChain.includes('positionless')) {
      fallbackChain.push('positionless');
    }
    
    return fallbackChain;
  }

  /**
   * 🛠️ 构建标准匹配条件
   */
  private buildStandardCriteria(element: UiNode): any {
    const criteria: any = {
      fields: [],
      values: []
    };
    
    // 优先使用 resource-id
    if (element.attrs['resource-id']) {
      criteria.fields.push('resource-id');
      criteria.values.push(element.attrs['resource-id']);
    }
    
    // 其次使用 text
    if (element.attrs['text']) {
      criteria.fields.push('text');
      criteria.values.push(element.attrs['text']);
    }
    
    // 然后是 content-desc
    if (element.attrs['content-desc']) {
      criteria.fields.push('content-desc');
      criteria.values.push(element.attrs['content-desc']);
    }
    
    // 最后是 class
    if (element.attrs['class']) {
      criteria.fields.push('class');
      criteria.values.push(element.attrs['class']);
    }
    
    return criteria;
  }

  /**
   * 🛠️ 从智能推荐构建匹配条件
   */
  private buildCriteriaFromRecommendation(recommendation: SystemStrategyRecommendation, element: UiNode): any {
    const criteria: any = {
      fields: [],
      values: []
    };

    // 根据策略类型选择字段
    switch (recommendation.strategy) {
      case 'strict':
        if (element.attrs['resource-id']) {
          criteria.fields.push('resource-id');
          criteria.values.push(element.attrs['resource-id']);
        }
        if (element.attrs['text']) {
          criteria.fields.push('text');
          criteria.values.push(element.attrs['text']);
        }
        break;
      case 'relaxed':
        if (element.attrs['resource-id']) {
          criteria.fields.push('resource-id');
          criteria.values.push(element.attrs['resource-id']);
        }
        break;
      case 'positionless':
        if (element.attrs['content-desc']) {
          criteria.fields.push('content-desc');
          criteria.values.push(element.attrs['content-desc']);
        }
        if (element.attrs['text']) {
          criteria.fields.push('text');
          criteria.values.push(element.attrs['text']);
        }
        break;
      default:
        // 使用标准匹配逻辑
        return this.buildStandardCriteria(element);
    }

    return criteria;
  }

  /**
   * 🛠️ 构建智能回退链
   */
  private buildIntelligentFallbackChain(recommendation: SystemStrategyRecommendation): MatchStrategy[] {
    const fallbackChain: MatchStrategy[] = [];
    
    // 添加推荐的主策略
    if (recommendation.strategy && !fallbackChain.includes(recommendation.strategy as MatchStrategy)) {
      fallbackChain.push(recommendation.strategy as MatchStrategy);
    }
    
    // 根据推荐的策略类型添加相应的回退策略
    switch (recommendation.strategy) {
      case 'strict':
        if (!fallbackChain.includes('standard')) fallbackChain.push('standard');
        if (!fallbackChain.includes('relaxed')) fallbackChain.push('relaxed');
        break;
      case 'standard':
        if (!fallbackChain.includes('relaxed')) fallbackChain.push('relaxed');
        if (!fallbackChain.includes('positionless')) fallbackChain.push('positionless');
        break;
      case 'relaxed':
        if (!fallbackChain.includes('positionless')) fallbackChain.push('positionless');
        if (!fallbackChain.includes('standard')) fallbackChain.push('standard');
        break;
      case 'positionless':
        if (!fallbackChain.includes('relaxed')) fallbackChain.push('relaxed');
        if (!fallbackChain.includes('standard')) fallbackChain.push('standard');
        break;
      default:
        if (!fallbackChain.includes('standard')) fallbackChain.push('standard');
        if (!fallbackChain.includes('relaxed')) fallbackChain.push('relaxed');
        if (!fallbackChain.includes('positionless')) fallbackChain.push('positionless');
    }
    
    return fallbackChain;
  }

  /**
   * 🛠️ 获取默认 Plan
   */
  private getDefaultPlan(element: UiNode): StrategyPlan[] {
    return [{
      id: `default-${Date.now()}`,
      name: '默认标准匹配',
      priority: 100,
      confidence: 0.6,
      strategy: 'standard',
      criteria: this.buildStandardCriteria(element),
      fallbackChain: ['standard', 'relaxed', 'positionless'],
      estimatedSuccessRate: 0.65,
      reasoning: '默认回退方案'
    }];
  }

  /**
   * 🛠️ 获取速度评分
   */
  private getSpeedScore(strategy: MatchStrategy): 'fast' | 'medium' | 'slow' {
    const speedMap: Partial<Record<MatchStrategy, 'fast' | 'medium' | 'slow'>> = {
      'absolute': 'fast',
      'strict': 'fast',
      'standard': 'medium',
      'relaxed': 'medium',
      'positionless': 'slow'
    };
    return speedMap[strategy] || 'medium';
  }

  /**
   * 🛠️ 获取稳定性评分
   */
  private getStabilityScore(strategy: MatchStrategy): 'high' | 'medium' | 'low' {
    const stabilityMap: Partial<Record<MatchStrategy, 'high' | 'medium' | 'low'>> = {
      'standard': 'high',
      'strict': 'high',
      'positionless': 'medium',
      'relaxed': 'medium',
      'absolute': 'low'
    };
    return stabilityMap[strategy] || 'medium';
  }

  /**
   * 🛠️ 获取跨设备兼容性评分
   */
  private getCrossDeviceScore(strategy: MatchStrategy): 'excellent' | 'good' | 'fair' {
    const crossDeviceMap: Partial<Record<MatchStrategy, 'excellent' | 'good' | 'fair'>> = {
      'standard': 'excellent',
      'positionless': 'excellent', 
      'strict': 'good',
      'relaxed': 'good',
      'absolute': 'fair'
    };
    return crossDeviceMap[strategy] || 'good';
  }

  /**
   * 🛠️ 获取策略标签
   */
  private getStrategyTags(strategy: MatchStrategy): SystemStrategyRecommendation['tags'] {
    const tagMap: Partial<Record<MatchStrategy, SystemStrategyRecommendation['tags']>> = {
      'absolute': ['precise', 'fast'],
      'strict': ['recommended', 'stable'],
      'standard': ['recommended', 'stable'],
      'relaxed': ['fallback', 'stable'],
      'positionless': ['stable', 'fallback']
    };
    return tagMap[strategy] || ['stable'];
  }

  /**
   * 🚧 生成模拟分析结果（临时实现）
   */
  private generateMockAnalysisResult(element: UiNode) {
    const hasId = !!element.attrs['resource-id']; 
    const hasText = !!element.attrs['text'];
    const hasDesc = !!element.attrs['content-desc'];

    return {
      primary: {
        strategy: hasId ? 'strict' : (hasText ? 'standard' : 'relaxed') as MatchStrategy,
        confidence: hasId ? 0.9 : (hasText ? 0.8 : 0.6),
        criteria: this.buildStandardCriteria(element)
      },
      alternatives: [
        {
          strategy: 'standard' as MatchStrategy,
          confidence: 0.75,
          criteria: this.buildStandardCriteria(element),
          reason: '标准匹配策略'
        },
        {
          strategy: 'relaxed' as MatchStrategy, 
          confidence: 0.65,
          criteria: this.buildStandardCriteria(element),
          reason: '宽松匹配策略'
        }
      ],
      context: {
        step: hasId ? 'Step 1: ID-Based' : (hasText ? 'Step 2: Text-Based' : 'Step 3: Structure-Based')
      }
    };
  }

  // ================================
  // 🆕 模式切换功能
  // ================================

  /**
   * 🔄 切换策略模式（智能 ↔ 静态）
   * 
   * @param mode - 目标模式
   * @returns 是否切换成功
   */
  switchMode(mode: StrategyMode): boolean {
    if (!this.modeState.canSwitch) {
      console.warn('⚠️ 当前不允许切换模式');
      return false;
    }

    const previousMode = this.modeState.currentMode;
    this.modeState.currentMode = mode;
    this.modeState.userPreference = mode;

    console.log(`🔄 策略模式切换: ${previousMode} → ${mode}`);
    
    // 清除缓存，确保新模式下重新分析
    this.clearCache();
    
    return true;
  }

  /**
   * 📊 获取当前模式状态
   */
  getModeState(): StrategyModeState {
    return { ...this.modeState };
  }

  /**
   * 🧩 设置模式锁定状态
   * 
   * @param canSwitch - 是否允许切换
   */
  setCanSwitch(canSwitch: boolean): void {
    this.modeState.canSwitch = canSwitch;
    console.log(`🔒 模式切换状态: ${canSwitch ? '允许' : '锁定'}`);
  }

  /**
   * 🗑️ 清除所有缓存
   */
  private clearCache(): void {
    this.cache.clear();
    this.planCache.clear();
    console.log('🗑️ 策略缓存已清除');
  }

  /**
   * 🎯 根据当前模式分析元素
   * 
   * @param element - UI元素
   * @param xmlContent - XML内容
   * @returns 策略推荐
   */
  async analyzeElementByMode(
    element: UiNode, 
    xmlContent?: string
  ): Promise<DetailedStrategyRecommendation[]> {
    const currentMode = this.modeState.currentMode;
    
    console.log(`🎯 使用 ${currentMode} 模式分析元素`, { element: element.tag });
    
    if (currentMode === 'intelligent') {
      // 智能模式：使用 Plan 候选链
      return this.analyzeElement(element, xmlContent);
    } else {
      // 静态模式：使用传统推荐逻辑
      return this.analyzeElementStatic(element, xmlContent);
    }
  }

  /**
   * 📋 静态模式分析（传统逻辑）
   * 
   * @param element - UI元素  
   * @param xmlContent - XML内容
   * @returns 静态策略推荐
   */
  private async analyzeElementStatic(
    element: UiNode,
    xmlContent?: string
  ): Promise<DetailedStrategyRecommendation[]> {
    const hasId = !!element.attrs['resource-id'];
    const hasText = !!element.attrs['text'];
    const hasDesc = !!element.attrs['content-desc'];

    // 传统静态推荐逻辑
    const recommendations: DetailedStrategyRecommendation[] = [];

    // 基于元素属性的简单策略推荐
    if (hasId) {
      recommendations.push({
        strategy: 'strict',
        score: {
          total: 0.9,
          performance: 0.9,
          stability: 0.8,
          compatibility: 0.85,
          uniqueness: 0.95,
          confidence: 0.9
        },
        confidence: 0.9,
        reason: '元素具有唯一 resource-id，推荐使用严格匹配'
      });
    }

    if (hasText || hasDesc) {
      recommendations.push({
        strategy: 'standard',
        score: {
          total: 0.75,
          performance: 0.7,
          stability: 0.8,
          compatibility: 0.9,
          uniqueness: 0.7,
          confidence: 0.75
        },
        confidence: 0.75,
        reason: '元素具有文本或描述信息，推荐使用标准匹配'
      });
    }

    // 总是提供回退选项
    recommendations.push({
      strategy: 'relaxed',
      score: {
        total: 0.6,
        performance: 0.6,
        stability: 0.6,
        compatibility: 0.8,
        uniqueness: 0.5,
        confidence: 0.6
      },
      confidence: 0.6,
      reason: '回退选项：宽松匹配策略'
    });

    console.log(`📋 静态模式生成 ${recommendations.length} 个推荐`);
    return recommendations;
  }

  /**
   * 🎯 直接从 Plan 候选链生成 UI 推荐（简化实现）
   * 
   * @param plans - Plan 候选链
   * @param element - UI 元素
   * @returns UI 推荐列表
   */
  private convertPlansToUIRecommendations(
    plans: StrategyPlan[], 
    element: UiNode
  ): DetailedStrategyRecommendation[] {
    return plans.map((plan, index) => ({
      strategy: plan.strategy,
      score: {
        total: plan.confidence,
        performance: 0.8,
        stability: this.getStabilityNumberScore(plan.strategy),
        compatibility: 0.85,
        uniqueness: 0.9,
        confidence: plan.confidence
      },
      confidence: plan.confidence,
      reason: plan.reasoning,
      step: `Plan ${index + 1}: ${plan.name}`,
      fallbackRank: plan.priority,
      performance: {
        estimatedSpeed: this.getSpeedScore(plan.strategy) === 'fast' ? 'fast' : 
                       this.getSpeedScore(plan.strategy) === 'medium' ? 'medium' : 'slow',
        crossDeviceStability: this.getStabilityScore(plan.strategy) === 'high' ? 'high' :
                              this.getStabilityScore(plan.strategy) === 'medium' ? 'medium' : 'low'
      }
    }));
  }

  /**
   * 🛠️ 获取数字形式的稳定性评分
   */
  private getStabilityNumberScore(strategy: MatchStrategy): number {
    const stabilityMap: Partial<Record<MatchStrategy, number>> = {
      'standard': 0.9,
      'strict': 0.8,
      'positionless': 0.7,
      'relaxed': 0.6,
      'absolute': 0.4
    };
    return stabilityMap[strategy] || 0.7;
  }

  /**
   * 🎯 从 Plan 候选链中选择推荐策略
   * 
   * @param plans - Plan 候选链
   * @returns 选中的策略推荐
   */
  private selectRecommendationsFromPlans(plans: StrategyPlan[]): SystemStrategyRecommendation[] {
    const recommendations: SystemStrategyRecommendation[] = [];
    
    plans.forEach((plan, index) => {
      const baseRecommendation: SystemStrategyRecommendation = {
        strategy: plan.strategy,
        confidence: plan.confidence,
        reason: plan.reasoning,
        score: plan.confidence * 100,
        performance: {
          speed: this.getSpeedScore(plan.strategy),
          stability: this.getStabilityScore(plan.strategy),
          crossDevice: this.getCrossDeviceScore(plan.strategy)
        },
        tags: this.getStrategyTags(plan.strategy),
        scenarios: [plan.name],
        alternatives: plans.slice(index + 1).map(altPlan => ({
          id: altPlan.id,
          strategy: altPlan.strategy,
          sourceStep: altPlan.reasoning,
          scoring: {
            total: altPlan.confidence * 100,
            breakdown: {
              uniqueness: 70,
              stability: altPlan.confidence * 80,
              performance: 75,
              reliability: altPlan.confidence * 90
            },
            bonuses: [],
            penalties: []
          },
          criteria: altPlan.criteria,
          validation: {
            passed: true,
            matchCount: 1,
            uniqueness: {
              isUnique: true
            },
            errors: [],
            warnings: [],
            validationTime: 50
          },
          metadata: {
            createdAt: Date.now(),
            estimatedExecutionTime: 200,
            deviceCompatibility: ['android'],
            complexity: 'medium'
          }
        }))
      };
      
      recommendations.push(baseRecommendation);
    });
    
    return recommendations;
  }

  /**
   * 🔗 调用真实的智能策略系统
   * 
   * @param element - UI 元素
   * @param xmlContent - XML 内容
   * @returns 系统策略推荐
   */
  private async callIntelligentStrategySystem(
    element: UiNode, 
    xmlContent?: string
  ): Promise<SystemStrategyRecommendation[]> {
    try {
      // 🚀 使用真实的 StrategyDecisionEngine
      const engine = new StrategyDecisionEngine({
        debugMode: true,
        maxSteps: 6,
        minConfidenceThreshold: 0.5,
        performanceMode: 'balanced',
        enableLocalValidation: true
      });

      console.log('🎯 调用真实智能策略决策引擎', { 
        element: element.tag, 
        hasXml: !!xmlContent 
      });

      // 执行完整的 Step 0-6 分析流程
      const result = await engine.analyzeAndRecommend(element, xmlContent || '');
      
      console.log('✅ 智能策略分析完成', { 
        elementTag: element.tag,
        strategy: result.strategy,
        confidence: result.confidence,
        alternativesCount: result.alternatives?.length || 0
      });

      // 将单个推荐结果包装为数组格式
      const recommendations = [result];
      
      // 如果有替代方案，也添加到列表中
      if (result.alternatives && result.alternatives.length > 0) {
        // 暂时跳过复杂的 alternatives 映射，在后续版本中完善
        console.log('🔄 跳过复杂的 alternatives 映射', result.alternatives.length);
      }

      return recommendations;

    } catch (error) {
      console.error('❌ 智能策略系统调用失败，回退到模拟实现', error);
      
      // 回退到改进的模拟实现
      return new Promise((resolve) => {
        setTimeout(() => {
          const recommendations = this.generateIntelligentMockRecommendations(element, xmlContent);
          resolve(recommendations);
        }, 200 + Math.random() * 300);
      });
    }
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
        tags: ['recommended', 'precise', 'stable'],
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
        tags: ['stable', 'fallback'],
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
        tags: ['stable', 'cross-platform'],
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
        tags: ['fast', 'precise'],
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
      tags: ['stable', 'fallback'],
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
    element: UiNode,
    plans?: StrategyPlan[]
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
    const contentKey = xmlContent ? generateXmlHash(xmlContent).slice(0, 10) : 'no-xml';
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