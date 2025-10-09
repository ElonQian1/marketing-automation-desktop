/**
 * intelligent-strategy-system/index.ts
 * 智能策略系统统一导出接口
 * 
 * @description 提供基于 Step 0-6 决策流程的智能匹配策略推荐系统
 * @version 1.0.0
 * @author GitHub Copilot
 */

// === 核心类型导出 ===
export type {
  // 决策相关类型
  DecisionContext,
  DecisionResult,
  AnalysisStep,
  
  // 策略相关类型
  StrategyRecommendation,
  StrategyCandidate,
  MatchStrategy,
  
  // 分析相关类型
  ElementAnalysisContext,
  NodeHierarchyInfo,
  AnchorPoint,
} from './types';

// === 核心决策引擎 ===
export { StrategyDecisionEngine } from './core/StrategyDecisionEngine';
export { ElementContextAnalyzer } from './core/ElementContextAnalyzer';
export { ConfidenceCalculator } from './core/ConfidenceCalculator';

// === 分析器链 ===
export { SelfAnchorAnalyzer } from './analyzers/SelfAnchorAnalyzer';
export { ChildAnchorAnalyzer } from './analyzers/ChildAnchorAnalyzer';
export { ParentClickableAnalyzer } from './analyzers/ParentClickableAnalyzer';
export { RegionScopedAnalyzer } from './analyzers/RegionScopedAnalyzer';
export { NeighborRelativeAnalyzer } from './analyzers/NeighborRelativeAnalyzer';
export { IndexFallbackAnalyzer } from './analyzers/IndexFallbackAnalyzer';

// === 评分系统 ===
export { StrategyScorer } from './scoring/StrategyScorer';
export { UniquenessValidator } from './scoring/UniquenessValidator';
export { ScoreWeightConfig } from './scoring/ScoreWeightConfig';

// === 生成器 ===
export { RecommendationGenerator } from './generators/RecommendationGenerator';
export { StepInfoGenerator } from './generators/StepInfoGenerator';

// === 集成适配 ===
export { UIIntegrationAdapter } from './integration/UIIntegrationAdapter';
export { LegacyCompatibilityLayer } from './integration/LegacyCompatibilityLayer';

// === 工具函数 ===
export { XmlAnalysisUtils } from './utils/XmlAnalysisUtils';
export { ElementFingerprinting } from './utils/ElementFingerprinting';

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
): Promise<StrategyRecommendation> => {
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
): Promise<StrategyRecommendation[]> => {
  const engine = createIntelligentStrategy();
  return await Promise.all(
    elements.map(element => engine.analyzeAndRecommend(element, xmlContent))
  );
};

/**
 * 兼容旧版 SmartStepGenerator 的接口
 * @deprecated 请使用 StepInfoGenerator 替代
 */
export const legacyGenerateStepInfo = (element: any) => {
  console.warn('legacyGenerateStepInfo 已废弃，请使用 StepInfoGenerator');
  const generator = new StepInfoGenerator();
  return generator.generateFromLegacyElement(element);
};

// === 默认导出（主要的决策引擎） ===
export { StrategyDecisionEngine as default } from './core/StrategyDecisionEngine';