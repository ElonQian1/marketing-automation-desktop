// src/modules/structural-matching/domain/constants/match-strategies.ts
// module: structural-matching | layer: domain | role: 匹配策略常量
// summary: 定义细粒度的匹配策略，支持复杂的评分规则

export enum MatchStrategy {
  /** 值完全相同 */
  EXACT_MATCH = 'EXACT_MATCH',
  
  /** 都非空即可（不关心具体值） */
  BOTH_NON_EMPTY = 'BOTH_NON_EMPTY',
  
  /** 保持空/非空一致性（原来空的匹配空，原来非空的匹配非空） */
  CONSISTENT_EMPTINESS = 'CONSISTENT_EMPTINESS',
  
  /** 结构匹配（子元素结构一致） */
  STRUCTURE_MATCH = 'STRUCTURE_MATCH',
  
  /** 值相似匹配（允许一定差异） */
  VALUE_SIMILARITY = 'VALUE_SIMILARITY',
  
  /** 不参与评分 */
  DISABLED = 'DISABLED',
}

/**
 * 匹配策略的评分规则
 */
export interface MatchingRule {
  /** 完全匹配时的分数 */
  exactMatchScore: number;
  
  /** 符合条件时的分数 */
  conditionMetScore: number;
  
  /** 不符合条件时的分数 */
  conditionFailScore: number;
  
  /** 权重倍数 */
  weightMultiplier: number;
}

/**
 * 匹配策略的评分规则映射
 */
export const MATCH_STRATEGY_RULES: Record<MatchStrategy, MatchingRule> = {
  [MatchStrategy.EXACT_MATCH]: {
    exactMatchScore: 1.0,      // 值完全一样 +大分
    conditionMetScore: 0.6,    // 都非空 +小分
    conditionFailScore: -0.3,  // 一个空一个非空 -分
    weightMultiplier: 1.0,
  },
  
  [MatchStrategy.BOTH_NON_EMPTY]: {
    exactMatchScore: 1.0,      // 值完全一样 +大分
    conditionMetScore: 0.8,    // 都非空 +分（比完全匹配稍低）
    conditionFailScore: -0.2,  // 有一个为空 -分
    weightMultiplier: 1.0,
  },
  
  [MatchStrategy.CONSISTENT_EMPTINESS]: {
    exactMatchScore: 1.0,      // 值完全一样 +大分
    conditionMetScore: 0.7,    // 空/非空一致 +分
    conditionFailScore: -0.3,  // 空/非空不一致 -分
    weightMultiplier: 1.0,
  },
  
  [MatchStrategy.STRUCTURE_MATCH]: {
    exactMatchScore: 1.0,      // 结构完全一致 +分
    conditionMetScore: 0.5,    // 部分结构一致 +小分
    conditionFailScore: -0.5,  // 结构不一致 -分
    weightMultiplier: 1.3,     // 结构匹配权重更高
  },
  
  [MatchStrategy.VALUE_SIMILARITY]: {
    exactMatchScore: 1.0,      // 值完全一样 +大分
    conditionMetScore: 0.6,    // 相似度高 +分
    conditionFailScore: -0.1,  // 相似度低 -小分
    weightMultiplier: 0.9,     // 相似匹配权重稍低
  },
  
  [MatchStrategy.DISABLED]: {
    exactMatchScore: 0,
    conditionMetScore: 0,
    conditionFailScore: 0,
    weightMultiplier: 0,
  },
};

/**
 * 匹配策略显示名称
 */
export const MATCH_STRATEGY_DISPLAY_NAMES: Record<MatchStrategy, string> = {
  [MatchStrategy.EXACT_MATCH]: '值完全匹配',
  [MatchStrategy.BOTH_NON_EMPTY]: '都非空即可',
  [MatchStrategy.CONSISTENT_EMPTINESS]: '保持空/非空一致',
  [MatchStrategy.STRUCTURE_MATCH]: '结构匹配',
  [MatchStrategy.VALUE_SIMILARITY]: '值相似匹配',
  [MatchStrategy.DISABLED]: '不参与评分',
};

/**
 * 匹配策略描述
 */
export const MATCH_STRATEGY_DESCRIPTIONS: Record<MatchStrategy, string> = {
  [MatchStrategy.EXACT_MATCH]: '值完全相同+大分，都非空+小分，都空+分，非空匹配空-分',
  [MatchStrategy.BOTH_NON_EMPTY]: '只要都不为空就得分，具体值可以不同',
  [MatchStrategy.CONSISTENT_EMPTINESS]: '原来空的匹配空，原来非空的匹配非空',
  [MatchStrategy.STRUCTURE_MATCH]: '检查子元素结构是否一致（类名序列）',
  [MatchStrategy.VALUE_SIMILARITY]: '基于相似度评分，允许值有一定差异',
  [MatchStrategy.DISABLED]: '此字段不影响匹配评分',
};