/**
 * types/index.ts
 * 智能策略系统类型统一导出
 * 
 * @description 提供所有类型的统一导出接口
 */

// === 决策相关类型 ===
export type {
  DecisionContext,
  StepAnalysisResult,
  DecisionResult,
  DecisionEngineConfig,
} from './DecisionTypes';

export { AnalysisStep } from './DecisionTypes';

// === 策略相关类型 ===
export type {
  StrategyRecommendation,
  StrategyCandidate,
  MatchStrategy,
  MatchingCriteria,
  ValidationResult,
} from './StrategyTypes';

// === 分析相关类型 ===
export type {
  ElementAnalysisContext,
  ElementNode,
  NodeHierarchyInfo,
  DocumentStructure,
  DocumentStatistics,
  AppInfo,
  DeviceInfo,
  AnchorPoint,
  AnchorType,
  AnchorFeatures,
  AnalysisOptions,
  AnalysisMode,
  ElementAnalysisResult,
} from './AnalysisTypes';

// === 几何相关类型 ===
export type {
  BoundsInfo
} from '../shared/types/geometry';