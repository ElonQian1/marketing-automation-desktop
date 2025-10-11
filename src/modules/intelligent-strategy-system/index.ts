/**
 * 智能策略系统主导出文件
 * 
 * @description 统一导出已实现的核心组件和便捷函数
 */

// === 导入依赖 ===
import { StrategyDecisionEngine } from './core/StrategyDecisionEngine';
import { 
  createCompleteScoringSystem,
  quickScore,
  quickValidateUniqueness,
  quickBatchScoreAndValidate
} from './scoring';

// === 核心类型 ===
export type {
  DecisionContext,
  StrategyRecommendation,
  StrategyCandidate,
  MatchStrategy,
  ElementAnalysisContext,
  AnalysisStep,
} from './types';

// === 核心引擎 ===
export { StrategyDecisionEngine } from './core/StrategyDecisionEngine';
export { ElementContextAnalyzer } from './core/ElementContextAnalyzer';
export { ConfidenceCalculator } from './core/ConfidenceCalculator';

// 🆕 统一元素分析器
export { ElementAnalyzer } from './core/ElementAnalyzer';

// === 向后兼容类型 ===
export type { ElementFieldInfo, ElementAnalysisResult } from './core/ElementAnalyzer';

// === 增强功能 (XPath文档要求的新实现) ===
export { EnhancedStrategyDecisionEngine } from './engines/EnhancedStrategyDecisionEngine';
export { OfflineValidationSystem } from './validation/OfflineValidationSystem';
export { ControlledFallbackMechanism } from './fallback/ControlledFallbackMechanism';
export { RegionLimitedSearchOptimizer } from './optimization/RegionLimitedSearchOptimizer';

// === 分析器 ===
export { BaseAnalyzer } from './analyzers/BaseAnalyzer';
// export { AnalyzerFactory } from './analyzers/AnalyzerFactory';

// === 评分系统 ===
export { 
  createCompleteScoringSystem,
  quickScore,
  quickValidateUniqueness,
  quickBatchScoreAndValidate
} from './scoring';

// 导出评分系统核心组件
export {
  ScoreWeightConfigManager,
  PerformanceMetricsEvaluator,
  StabilityAssessmentEvaluator
} from './scoring';

// 导出评分系统类型
export type * from './scoring/types';

// === 便捷函数 ===

/**
 * 创建智能策略决策引擎实例
 * @returns 配置好的决策引擎实例
 */
export const createIntelligentStrategy = () => {
  return new StrategyDecisionEngine();
};

/**
 * 快速获取策略推荐（便捷函数）
 * @param element 目标元素节点
 * @param xmlContent XML内容
 * @returns 策略推荐结果
 */
export const getQuickRecommendation = async (
  element: any, 
  xmlContent: string
): Promise<any> => {
  const engine = createIntelligentStrategy();
  return await engine.analyzeAndRecommend(element, xmlContent);
};

/**
 * 批量分析多个元素的推荐策略
 * @param elements 元素列表
 * @param xmlContent XML内容
 * @returns 推荐结果列表
 */
export const getBatchRecommendations = async (
  elements: any[],
  xmlContent: string
): Promise<any[]> => {
  const engine = createIntelligentStrategy();
  return await Promise.all(
    elements.map(element => engine.analyzeAndRecommend(element, xmlContent))
  );
};

/**
 * 智能策略推荐并评分（综合函数）
 * @param element 目标元素节点
 * @param xmlContent XML内容
 * @returns 包含推荐和评分的综合结果
 */
export const getRecommendationWithScoring = async (
  element: any,
  xmlContent: string
): Promise<any> => {
  // 1. 获取策略推荐
  const recommendation = await getQuickRecommendation(element, xmlContent);
  
  // 2. 对推荐策略进行评分
  const scoringResult = await quickScore(
    recommendation.recommendedStrategy,
    element,
    xmlContent
  );
  
  return {
    ...recommendation,
    scoring: scoringResult,
    overallQuality: scoringResult.overallScore
  };
};

/**
 * 批量策略推荐、评分和验证（最强综合函数）
 * @param elements 元素列表
 * @param xmlContent XML内容
 * @returns 完整的分析、评分和验证结果
 */
export const getComprehensiveAnalysis = async (
  elements: any[],
  xmlContent: string
): Promise<any> => {
  // 1. 批量获取推荐
  const recommendations = await getBatchRecommendations(elements, xmlContent);
  
  // 2. 提取推荐策略列表
  const strategies = recommendations.map(rec => rec.recommendedStrategy);
  
  // 3. 批量评分和验证
  const scoringResults = await quickBatchScoreAndValidate(
    strategies,
    elements[0], // 使用第一个元素作为上下文
    xmlContent
  );
  
  return {
    recommendations,
    scoring: scoringResults,
    summary: {
      totalElements: elements.length,
      recommendedStrategies: strategies.length,
      averageQuality: scoringResults.validation?.summary?.qualityScore || 85
    }
  };
};