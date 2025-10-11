// src/modules/intelligent-strategy-system/scoring/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * scoring/index.ts
 * 评分系统模块导出
 * 
 * @description 统一导出评分系统相关类、函数和类型
 */

import { ScoreWeightConfigManager } from './ScoreWeightConfig';
import { PerformanceMetricsEvaluator } from './PerformanceMetrics';
import { StabilityAssessmentEvaluator } from './StabilityAssessment';
// 尝试恢复模块导入
import { StrategyScorer, createStrategyScorer } from './StrategyScorer';
// 使用新的模块化 UniquenessValidator

// === 类型导出 ===
export type * from './types';

// === 核心评分组件 ===
export { 
  ScoreWeightConfigManager,
  createWeightConfigManager,
  createPresetWeightConfig,
  validateWeightConfig,
  type PerformanceAdjustmentData,
  type WeightAdjustmentRecord
} from './ScoreWeightConfig';

export { 
  PerformanceMetricsEvaluator,
  createPerformanceEvaluator,
  quickPerformanceTest,
  type PerformanceOperation,
  type PerformanceRecord,
  type BatchPerformanceResult
} from './PerformanceMetrics';

export { 
  StabilityAssessmentEvaluator,
  createStabilityEvaluator,
  quickStabilityAssessment,
  type StabilityEvaluationContext,
  type DeviceProfile,
  type ResolutionProfile,
  type AppVersionProfile,
  type LayoutVariation
} from './StabilityAssessment';

export {
  StrategyScorer,
  createStrategyScorer,
  quickScoreStrategy,
  quickGetBestStrategy
} from './StrategyScorer';

export {
  UniquenessValidator,
  ValidationEngine,
  SimilarityAnalyzer,
  ConflictDetector,
  DEFAULT_UNIQUENESS_CONFIG,
  type UniquenessValidationResult,
  type SimilarityAnalysis,
  type ConflictDetection,
  type UniquenessValidatorConfig
} from './uniqueness';

// 向后兼容的便捷创建函数  
import { 
  UniquenessValidator as NewUniquenessValidator,
  UniquenessValidatorConfig,
  ElementContext
} from './uniqueness';
import { StrategyRecommendation } from '../types/StrategyTypes';

export function createUniquenessValidator(config?: Partial<UniquenessValidatorConfig>) {
  return new NewUniquenessValidator(config);
}

export async function validateUniqueness(
  recommendations: StrategyRecommendation[],
  context: ElementContext,
  config?: Partial<UniquenessValidatorConfig>
) {
  const validator = createUniquenessValidator(config);
  return validator.validateUniqueness(recommendations, context);
}

// === 便捷创建函数 ===

/**
 * 创建完整的评分系统
 * 包含所有评分组件和唯一性校验
 */
export function createCompleteScoringSystem() {
  const weightConfig = new ScoreWeightConfigManager();
  const performance = new PerformanceMetricsEvaluator();
  const stability = new StabilityAssessmentEvaluator();
  const scorer = createStrategyScorer(weightConfig);
  const uniquenessValidator = new NewUniquenessValidator();

  return {
    weightConfig,
    performance,
    stability,
    scorer,
    uniquenessValidator,
    
    // 便捷方法
    async evaluateStrategy(strategy: any, context: any) {
      // 使用策略评分器进行评分
      const scoringResult = await scorer.scoreStrategy(strategy, context.element, context.xmlContent, context);
      
      // 保持向后兼容的返回格式
      return {
        stability: scoringResult.breakdown.stability,
        performance: scoringResult.breakdown.performance,
        overallScore: scoringResult.overall.total,
        detailed: scoringResult // 提供详细结果
      };
    },
    
    async evaluateMultipleStrategies(strategies: any[], context: any) {
      // 使用策略评分器进行批量评分
      const results = await Promise.all(
        strategies.map(strategy => scorer.scoreStrategy(strategy, context.element, context.xmlContent, context))
      );
      
      // 转换为推荐格式
      const recommendations = results.map((result, index) => {
        const perfScore = result.breakdown.performance.score;
        const stabScore = result.breakdown.stability.score;
        const crossScore = result.breakdown.crossDevice?.score || 70;
        
        return {
          strategy: strategies[index],
          confidence: result.confidence >= 0.8 ? 0.8 : result.confidence >= 0.6 ? 0.6 : 0.4,
          reason: `综合评分: ${result.overall.total}分`,
          score: result.overall.total,
          performance: {
            speed: (perfScore >= 80 ? 'fast' : perfScore >= 60 ? 'medium' : 'slow') as 'fast' | 'medium' | 'slow',
            stability: (stabScore >= 80 ? 'high' : stabScore >= 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
            crossDevice: (crossScore >= 80 ? 'excellent' : crossScore >= 60 ? 'good' : 'fair') as 'excellent' | 'good' | 'fair'
          },
          alternatives: [],
          tags: [],
          scenarios: []
        };
      });

      // 唯一性验证
      const validationResult = await uniquenessValidator.validateUniqueness(recommendations, {
        element: context.element,
        xmlContent: context.xmlContent
      });
      
      return {
        original: results,
        recommendations: validationResult.filteredStrategies,
        validation: validationResult
      };
    },
    
    calculateOverallScore(stabilityResult: any, performanceResult: any) {
      const weights = weightConfig.getCurrentConfig();
      return Math.round(
        stabilityResult.score * weights.stability +
        performanceResult.score * weights.performance
      );
    }
  };
}

/**
 * 快速评分接口
 * 增强版，支持更完整的评分功能
 */
export async function quickScore(strategy: any, element: any, xmlContent: string = '') {
  const system = createCompleteScoringSystem();
  const context = {
    element,
    xmlContent,
    deviceProfiles: [],
    resolutionProfiles: [],
    appVersions: []
  };
  
  return await system.evaluateStrategy(strategy, context);
}

/**
 * 快速唯一性验证接口
 */
export async function quickValidateUniqueness(
  recommendations: any[],
  context: any
) {
  const validator = createUniquenessValidator();
  return await validator.validateUniqueness(recommendations, {
    element: context.element,
    xmlContent: context.xmlContent
  });
}

/**
 * 快速批量评分和验证接口
 */
export async function quickBatchScoreAndValidate(
  strategies: any[],
  element: any,
  xmlContent: string = ''
) {
  const system = createCompleteScoringSystem();
  const context = {
    element,
    xmlContent,
    deviceProfiles: [],
    resolutionProfiles: [],
    appVersions: []
  };
  
  return await system.evaluateMultipleStrategies(strategies, context);
}