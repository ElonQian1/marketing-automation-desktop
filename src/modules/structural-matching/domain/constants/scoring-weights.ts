// src/modules/structural-matching/domain/constants/scoring-weights.ts
// module: structural-matching | layer: domain | role: 默认评分权重
// summary: 定义各字段的默认评分规则和权重

import { FieldType } from './field-types';

/**
 * 评分规则
 */
export interface ScoringRules {
  /** 值完全一样 (大分) */
  exactMatch: number;
  
  /** 都非空但值不同 (小分) */
  bothNonEmpty: number;
  
  /** 都为空 (小分) */
  bothEmpty: number;
  
  /** 一个空一个非空 (负分) */
  mismatchPenalty: number;
}

/**
 * 默认评分规则 - Resource-ID
 */
export const DEFAULT_RESOURCE_ID_SCORING: ScoringRules = {
  exactMatch: 0.3,       // 值完全一样 +30%
  bothNonEmpty: 0.1,     // 都非空但不同 +10%
  bothEmpty: 0.05,       // 都为空 +5%
  mismatchPenalty: -0.2, // 一个空一个非空 -20%
};

/**
 * 默认评分规则 - Content-Desc
 */
export const DEFAULT_CONTENT_DESC_SCORING: ScoringRules = {
  exactMatch: 0.25,      // 值完全一样 +25%
  bothNonEmpty: 0.15,    // 都非空即可 +15% (笔记卡片重点)
  bothEmpty: 0.05,       // 都为空 +5%
  mismatchPenalty: -0.15, // 一个空一个非空 -15%
};

/**
 * 默认评分规则 - Text
 */
export const DEFAULT_TEXT_SCORING: ScoringRules = {
  exactMatch: 0.0,       // 不检查具体值
  bothNonEmpty: 0.1,     // 都非空即可 +10%
  bothEmpty: 0.05,       // 都为空 +5%
  mismatchPenalty: -0.1, // 一个空一个非空 -10%
};

/**
 * 默认评分规则 - Class Name
 */
export const DEFAULT_CLASS_NAME_SCORING: ScoringRules = {
  exactMatch: 0.2,       // 类名完全一样 +20%
  bothNonEmpty: 0.05,    // 都非空但不同 +5%
  bothEmpty: 0.0,        // 都为空 0%
  mismatchPenalty: -0.15, // 不匹配 -15%
};

/**
 * 默认评分规则 - 子元素结构
 */
export const DEFAULT_CHILDREN_STRUCTURE_SCORING: ScoringRules = {
  exactMatch: 0.3,       // 结构完全一样 +30%
  bothNonEmpty: 0.0,     // 不适用
  bothEmpty: 0.0,        // 不适用
  mismatchPenalty: -0.25, // 结构不同 -25%
};

/**
 * 字段默认权重
 */
export const DEFAULT_FIELD_WEIGHTS: Record<FieldType, number> = {
  [FieldType.RESOURCE_ID]: 1.0,
  [FieldType.CONTENT_DESC]: 1.0,
  [FieldType.TEXT]: 0.8,
  [FieldType.CLASS_NAME]: 0.9,
  [FieldType.CHILDREN_STRUCTURE]: 1.2, // 结构匹配权重最高
  [FieldType.BOUNDS]: 0.0, // 不使用
};

/**
 * 全局默认阈值
 */
export const DEFAULT_GLOBAL_THRESHOLD = 0.6; // 60%以上认为匹配
