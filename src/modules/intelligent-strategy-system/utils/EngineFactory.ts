// src/modules/intelligent-strategy-system/utils/EngineFactory.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 引擎工厂 - 提供便捷的创建方法
 */

import { StrategyDecisionEngine } from '../core/StrategyDecisionEngine';
import type { DecisionEngineConfig } from '../types/DecisionTypes';

/**
 * 创建默认配置的决策引擎
 */
export function createDefaultDecisionEngine(config?: Partial<DecisionEngineConfig>): StrategyDecisionEngine {
  const defaultConfig: DecisionEngineConfig = {
    debugMode: false,
    maxSteps: 6,
    minConfidenceThreshold: 0.5,
    performanceMode: 'balanced',
    enableLocalValidation: true,
    ...config
  };

  return new StrategyDecisionEngine(defaultConfig);
}

/**
 * 创建调试模式的决策引擎
 */
export function createDebugDecisionEngine(): StrategyDecisionEngine {
  return createDefaultDecisionEngine({
    debugMode: true,
    performanceMode: 'thorough'
  });
}

/**
 * 创建性能优化模式的决策引擎
 */
export function createFastDecisionEngine(): StrategyDecisionEngine {
  return createDefaultDecisionEngine({
    performanceMode: 'fast',
    maxSteps: 3,
    minConfidenceThreshold: 0.3
  });
}