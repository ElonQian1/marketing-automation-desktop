/**
 * 智能策略系统主导出文件
 * 
 * @description 统一导出已实现的核心组件和便捷函数
 */

// === 导入依赖 ===
import { StrategyDecisionEngine } from './core/StrategyDecisionEngine';

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

// === 分析器 ===
export { BaseAnalyzer } from './analyzers/BaseAnalyzer';
// export { AnalyzerFactory } from './analyzers/AnalyzerFactory';

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