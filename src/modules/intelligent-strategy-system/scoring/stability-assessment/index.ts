// src/modules/intelligent-strategy-system/scoring/stability-assessment/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 稳定性评估模块统一导出
 * 
 * @description 提供稳定性评估的统一接口，保持向后兼容性
 */

// 类型导入
import { MatchStrategy } from '../../types/StrategyTypes';
import type {
  StabilityAssessment,
  StabilityEvaluationContext,
  DeviceProfile,
  ResolutionProfile,
  DeviceCompatibilityReport,
  ResolutionAdaptabilityReport,
  StabilityTrendAnalysis
} from './types';
import { StabilityAssessmentEngine } from './core/StabilityAssessmentEngine';

// 核心组件导出
export { StabilityAssessmentEngine } from './core/StabilityAssessmentEngine';

// 计算器导出
export { 
  StabilityScoreCalculator,
  createStabilityScoreCalculator,
  calculateStabilityScore,
  determineStabilityLevel,
  DEFAULT_STABILITY_WEIGHTS
} from './calculators/StabilityScoreCalculator';

// 分析策略导出
export { DeviceCompatibilityAnalyzer } from './strategies/DeviceCompatibilityAnalyzer';
export { ResolutionAdaptabilityAnalyzer } from './strategies/ResolutionAdaptabilityAnalyzer';

// 工具导出
export { RiskAssessmentEngine } from './utils/RiskAssessmentEngine';
export { RecommendationGenerator } from './utils/RecommendationGenerator';

// 类型导出
export type * from './types';

// === 兼容性接口 ===

/**
 * 稳定性评估器（兼容原接口）
 * 
 * @description 保持与原 StabilityAssessmentEvaluator 的接口兼容性
 */
export class StabilityAssessmentEvaluator {
  private engine: StabilityAssessmentEngine;

  constructor() {
    this.engine = new StabilityAssessmentEngine();
  }

  /**
   * 综合稳定性评估
   */
  async evaluateStability(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string,
    context: StabilityEvaluationContext
  ): Promise<StabilityAssessment> {
    return await this.engine.evaluateStability(strategy, element, xmlContent, context);
  }

  /**
   * 设备兼容性专项评估
   */
  async evaluateDeviceCompatibility(
    strategy: MatchStrategy,
    element: any,
    targetDevices: DeviceProfile[]
  ): Promise<DeviceCompatibilityReport> {
    return await this.engine.evaluateDeviceCompatibility(strategy, element, targetDevices);
  }

  /**
   * 分辨率适应性评估
   */
  async evaluateResolutionAdaptability(
    strategy: MatchStrategy,
    element: any,
    resolutions: ResolutionProfile[]
  ): Promise<ResolutionAdaptabilityReport> {
    return await this.engine.evaluateResolutionAdaptability(strategy, element, resolutions);
  }

  /**
   * 获取稳定性历史趋势
   */
  getStabilityTrends(
    strategy?: MatchStrategy,
    timeRange?: number
  ): StabilityTrendAnalysis {
    return this.engine.getStabilityTrends(strategy, timeRange);
  }
}

// === 便捷函数 ===

/**
 * 创建稳定性评估器
 */
export function createStabilityEvaluator(): StabilityAssessmentEvaluator {
  return new StabilityAssessmentEvaluator();
}

/**
 * 快速稳定性评估
 */
export async function quickStabilityAssessment(
  strategy: MatchStrategy,
  element: any,
  context: Partial<StabilityEvaluationContext> = {}
): Promise<StabilityAssessment> {
  const evaluator = createStabilityEvaluator();
  const fullContext: StabilityEvaluationContext = {
    deviceProfiles: [],
    resolutionProfiles: [],
    appVersions: [],
    ...context
  };
  
  return await evaluator.evaluateStability(strategy, element, '', fullContext);
}

/**
 * 批量稳定性评估
 */
export async function batchStabilityAssessment(
  assessments: Array<{
    strategy: MatchStrategy;
    element: any;
    xmlContent?: string;
    context?: Partial<StabilityEvaluationContext>;
  }>
): Promise<StabilityAssessment[]> {
  const evaluator = createStabilityEvaluator();
  
  return await Promise.all(
    assessments.map(async ({ strategy, element, xmlContent = '', context = {} }) => {
      const fullContext: StabilityEvaluationContext = {
        deviceProfiles: [],
        resolutionProfiles: [],
        appVersions: [],
        ...context
      };
      
      return await evaluator.evaluateStability(strategy, element, xmlContent, fullContext);
    })
  );
}

// === 默认导出（向后兼容） ===
export default StabilityAssessmentEvaluator;