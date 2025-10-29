// src/types/decision-chain-config.ts
// module: types | layer: types | role: 决策链配置类型定义
// summary: 统一的决策链配置接口，用于步骤参数的序列化和反序列化

import type { SelectionMode } from './smartSelection';
import type { ActionKind } from './smartScript';
import type { BatchConfig, RandomConfig, MatchOriginalConfig } from '../components/strategy-selector/types/selection-config';

/**
 * 决策链配置接口
 * 用于保存和恢复步骤卡片上的决策链按钮状态
 */
export interface DecisionChainConfig {
  /** 执行链类型 */
  executionChain: 'intelligent_chain' | 'single_step' | 'static_strategy';
  
  /** 选择模式 */
  selectionMode: SelectionMode;
  
  /** 操作类型 */
  operationType: ActionKind;
  
  /** 批量配置（当 selectionMode === 'all' 时） */
  batchConfig?: BatchConfig;
  
  /** 随机配置（当 selectionMode === 'random' 时） */
  randomConfig?: RandomConfig;
  
  /** 精确匹配配置（当 selectionMode === 'match-original' 时） */
  matchOriginalConfig?: MatchOriginalConfig;
}

/**
 * 验证决策链配置的完整性
 * @param config 要验证的配置对象
 * @returns 有效的配置对象，如果无效则返回 null
 */
export function validateDecisionChainConfig(config: any): DecisionChainConfig | null {
  if (!config || typeof config !== 'object') {
    return null;
  }
  
  // 提供默认值
  const validated: DecisionChainConfig = {
    executionChain: config.executionChain || 'intelligent_chain',
    selectionMode: config.selectionMode || 'first',
    operationType: config.operationType || 'tap',
  };
  
  // 保留高级配置
  if (config.batchConfig && config.selectionMode === 'all') {
    validated.batchConfig = config.batchConfig;
  }
  
  if (config.randomConfig && config.selectionMode === 'random') {
    validated.randomConfig = config.randomConfig;
  }
  
  if (config.matchOriginalConfig && config.selectionMode === 'match-original') {
    validated.matchOriginalConfig = config.matchOriginalConfig;
  }
  
  return validated;
}

/**
 * 创建默认的决策链配置
 */
export function createDefaultDecisionChainConfig(): DecisionChainConfig {
  return {
    executionChain: 'intelligent_chain',
    selectionMode: 'first',
    operationType: 'tap',
  };
}
