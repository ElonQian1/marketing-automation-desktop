// src/modules/intelligent-strategy-system/scoring/uniqueness/types/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * UniquenessValidator 模块化类型定义
 * 统一简化版和复杂版的类型，提供清晰的接口
 */

import { MatchStrategy, StrategyRecommendation } from '../../../types/StrategyTypes';

/**
 * 相似度类型
 */
export type SimilarityType = 
  | 'identical'           // 完全相同
  | 'highly-similar'      // 高度相似  
  | 'moderately-similar'  // 中度相似
  | 'low-similar'         // 低相似度
  | 'different';          // 不同

/**
 * 相似性分析结果
 */
export interface SimilarityAnalysis {
  /** 策略对 */
  strategies: [MatchStrategy, MatchStrategy];
  /** 相似度分数 (0-1) */
  similarity: number;
  /** 相似度类型 */
  similarityType: SimilarityType;
  /** 建议操作 */
  recommendation: 'merge' | 'prioritize' | 'keep-both' | 'remove-weaker';
  /** 详细分析（可选，用于调试） */
  details?: {
    fieldMatches: Record<string, boolean>;
    valueMatches: Record<string, number>;
    strategyTypeMatch: boolean;
    parameterSimilarity: number;
  };
}

/**
 * 冲突检测结果
 */
export interface ConflictDetection {
  /** 是否有冲突 */
  hasConflict: boolean;
  /** 冲突类型 */
  conflictType?: 'mutually-exclusive' | 'redundant' | 'performance-impact';
  /** 冲突的策略 */
  conflictingStrategies: MatchStrategy[];
  /** 冲突描述 */
  description: string;
  /** 解决建议 */
  resolution?: {
    strategy: 'remove-conflict' | 'modify-parameters' | 'prioritize-one';
    steps: string[];
  };
}

/**
 * 元素上下文接口（统一版本）
 */
export interface ElementContext {
  /** 元素节点 */
  element: any;
  /** XML内容 */
  xmlContent: string;
  /** 设备配置（可选） */
  deviceProfiles?: any[];
  /** 分辨率配置（可选） */
  resolutionProfiles?: any[];
  /** 应用版本信息（可选） */
  appVersions?: any[];
  /** 环境信息（可选） */
  environment?: string;
}

/**
 * 唯一性验证结果
 */
export interface UniquenessValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 过滤后的策略 */
  filteredStrategies: StrategyRecommendation[];
  /** 相似性分析结果 */
  similarityAnalyses: SimilarityAnalysis[];
  /** 冲突检测结果 */
  conflictDetections: ConflictDetection[];
  /** 验证摘要 */
  summary: {
    originalCount: number;
    filteredCount: number;
    removedCount: number;
    similarPairsCount?: number;
    conflictsCount?: number;
    qualityScore: number;
  };
  /** 建议操作 */
  recommendations: string[];
}

/**
 * 唯一性校验配置
 */
export interface UniquenessValidatorConfig {
  /** 相似度阈值 */
  similarityThresholds: {
    identical: number;           // 0.95
    highlySimilar: number;       // 0.85  
    moderatelySimilar: number;   // 0.65
  };
  /** 是否启用冲突检测 */
  enableConflictDetection: boolean;
  /** 是否自动合并相似策略 */
  autoMergeSimilar: boolean;
  /** 最大推荐策略数量 */
  maxRecommendations: number;
  /** 最小置信度要求 */
  minConfidence: number;
  /** 高级选项（可选） */
  advanced?: {
    enableDetailedAnalysis: boolean;
    performanceMode: 'fast' | 'thorough';
    debugMode: boolean;
  };
}

/**
 * 默认配置
 */
export const DEFAULT_UNIQUENESS_CONFIG: UniquenessValidatorConfig = {
  similarityThresholds: {
    identical: 0.95,
    highlySimilar: 0.85,
    moderatelySimilar: 0.65
  },
  enableConflictDetection: true,
  autoMergeSimilar: true,
  maxRecommendations: 5,
  minConfidence: 0.6,
  advanced: {
    enableDetailedAnalysis: false,
    performanceMode: 'fast',
    debugMode: false
  }
};