// src/modules/intelligent-strategy-system/scoring/types/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * scoring/types/index.ts
 * 评分系统类型统一导出
 */

// === 核心类型 ===
export type {
  ScoreWeightConfig,
  WeightPreset,
  WeightConfigOptions,
  PerformanceLevel,
  PerformanceMetrics,
  PerformanceBenchmark,
  StabilityLevel,
  StabilityFactors,
  StabilityAssessment,
  StrategyScore,
  ScoringDetails,
  UniquenessLevel,
  UniquenessValidation,
  // 新增 StrategyScorer 相关类型
  ComprehensiveScore,
  ScoreBreakdown,
  ScoringContext,
  ScoreComparison,
  ComprehensiveStrategyScore,
  SimilarElement,
  UniquenessFactors,
  ComprehensiveStrategyEvaluation,
  StrategyTesterConfig,
  ScoreThresholds,
  BatchScoringRequest,
  BatchScoringResult,
  ScoringStatistics,
} from './ScoringTypes';

// === 常量导出 ===
export {
  DEFAULT_WEIGHT_CONFIGS,
  DEFAULT_SCORE_THRESHOLDS,
  DEFAULT_PERFORMANCE_BENCHMARK,
} from './ScoringTypes';