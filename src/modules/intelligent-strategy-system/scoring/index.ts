/**
 * scoring/index.ts
 * 评分系统模块导出
 * 
 * @description 统一导出评分系统相关类、函数和类型
 */

import { ScoreWeightConfigManager } from './ScoreWeightConfig';
import { PerformanceMetricsEvaluator } from './PerformanceMetrics';
import { StabilityAssessmentEvaluator } from './StabilityAssessment';

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

// === 便捷创建函数 ===

/**
 * 创建完整的评分系统
 */
export function createCompleteScoringSystem() {
  return {
    weightConfig: new ScoreWeightConfigManager(),
    performance: new PerformanceMetricsEvaluator(),
    stability: new StabilityAssessmentEvaluator(),
    
    // 便捷方法
    async evaluateStrategy(strategy: any, context: any) {
      const stabilityResult = await this.stability.evaluateStability(strategy, context.element, context.xmlContent, context);
      const performanceResult = await this.performance.evaluatePerformance(strategy, context.element, context.xmlContent);
      
      return {
        stability: stabilityResult,
        performance: performanceResult,
        overallScore: this.calculateOverallScore(stabilityResult, performanceResult)
      };
    },
    
    calculateOverallScore(stabilityResult: any, performanceResult: any) {
      const weights = this.weightConfig.getCurrentConfig();
      return Math.round(
        stabilityResult.score * weights.stability +
        performanceResult.score * weights.performance
      );
    }
  };
}

/**
 * 快速评分接口
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