// src/modules/structural-matching/domain/models/structural-field-config.ts
// module: structural-matching | layer: domain | role: 字段配置模型
// summary: 定义结构匹配的字段配置数据模型

import { FieldType, MatchMode } from '../constants/field-types';
import { ScoringRules } from '../constants/scoring-weights';

/**
 * 字段配置
 */
export interface StructuralFieldConfig {
  /** 字段类型 */
  fieldType: FieldType;
  
  /** 是否参与评分 */
  enabled: boolean;
  
  /** 匹配模式 */
  matchMode: MatchMode;
  
  /** 字段权重 (0-1) */
  weight: number;
  
  /** 评分细则 */
  scoringRules: ScoringRules;
  
  /** 显示名称 */
  displayName: string;
  
  /** 说明 */
  description?: string;
  
  /** 模板元素的字段值 (用于显示) */
  templateValue?: any;
}

/**
 * 结构匹配配置
 */
export interface StructuralMatchingConfig {
  /** 配置ID */
  configId: string;
  
  /** 模板元素ID */
  templateElementId: string;
  
  /** 模板元素完整结构 */
  templateStructure: any;
  
  /** 各字段配置 */
  fields: StructuralFieldConfig[];
  
  /** 全局阈值 (0-1) */
  globalThreshold: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 字段匹配结果
 */
export interface FieldMatchResult {
  /** 字段类型 */
  fieldType: FieldType;
  
  /** 得分 */
  score: number;
  
  /** 最大可能分数 */
  maxScore: number;
  
  /** 是否匹配 */
  matched: boolean;
  
  /** 原因说明 */
  reason: string;
}

/**
 * 匹配结果
 */
export interface StructuralMatchResult {
  /** 匹配的元素 (可选) */
  element?: any;
  
  /** 总分 */
  totalScore: number;
  
  /** 最大可能分数 */
  maxScore?: number;
  
  /** 各字段得分明细 */
  fieldResults: FieldMatchResult[];
  
  /** 是否通过阈值 */
  passed: boolean;
}
