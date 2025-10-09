/**
 * ScoringTypes.ts
 * 评分系统核心类型定义
 * 
 * @description 定义策略评分、性能评估、稳定性分析等相关类型
 */

import type { MatchStrategy } from '../../types/StrategyTypes';
import type { AnalysisStep } from '../../types/DecisionTypes';

// === 评分权重配置 ===

/**
 * 评分权重配置接口
 */
export interface ScoreWeightConfig {
  /** 性能权重 (0-1) */
  performance: number;
  
  /** 稳定性权重 (0-1) */
  stability: number;
  
  /** 准确性权重 (0-1) */
  accuracy: number;
  
  /** 跨设备兼容性权重 (0-1) */
  crossDevice: number;
  
  /** 可维护性权重 (0-1) */
  maintainability: number;
}

/**
 * 预设权重方案
 */
export type WeightPreset = 'speed-first' | 'stability-first' | 'accuracy-first' | 'balanced' | 'cross-device';

/**
 * 权重配置选项
 */
export interface WeightConfigOptions {
  preset?: WeightPreset;
  custom?: Partial<ScoreWeightConfig>;
  enableDynamicAdjustment?: boolean;
}

// === 性能指标 ===

/**
 * 性能级别
 */
export type PerformanceLevel = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  /** 执行速度 (ms) */
  executionTime: number;
  
  /** 成功率 (0-1) */
  successRate: number;
  
  /** 内存使用量 (bytes) */
  memoryUsage: number;
  
  /** CPU使用率 (0-1) */
  cpuUsage: number;
  
  /** 性能级别 */
  level: PerformanceLevel;
  
  /** 性能分数 (0-100) */
  score: number;
}

/**
 * 性能基准配置
 */
export interface PerformanceBenchmark {
  /** 最大执行时间 (ms) */
  maxExecutionTime: number;
  
  /** 最小成功率 */
  minSuccessRate: number;
  
  /** 最大内存使用量 */
  maxMemoryUsage: number;
  
  /** 最大CPU使用率 */
  maxCpuUsage: number;
}

// === 稳定性评估 ===

/**
 * 稳定性级别
 */
export type StabilityLevel = 'very-stable' | 'stable' | 'moderate' | 'unstable' | 'very-unstable';

/**
 * 稳定性因素
 */
export interface StabilityFactors {
  /** 设备兼容性 (0-1) */
  deviceCompatibility: number;
  
  /** 分辨率适应性 (0-1) */
  resolutionAdaptability: number;
  
  /** 版本稳定性 (0-1) */
  versionStability: number;
  
  /** 布局变化容忍度 (0-1) */
  layoutTolerance: number;
  
  /** 元素定位准确性 (0-1) */
  elementAccuracy: number;
}

/**
 * 稳定性评估结果
 */
export interface StabilityAssessment {
  /** 稳定性级别 */
  level: StabilityLevel;
  
  /** 稳定性分数 (0-100) */
  score: number;
  
  /** 稳定性因素分析 */
  factors: StabilityFactors;
  
  /** 风险因素 */
  risks: string[];
  
  /** 改进建议 */
  recommendations: string[];
}

// === 策略评分 ===

/**
 * 策略评分结果
 */
export interface StrategyScore {
  /** 策略类型 */
  strategy: MatchStrategy;
  
  /** 总分 (0-100) */
  totalScore: number;
  
  /** 性能评分 */
  performanceScore: number;
  
  /** 稳定性评分 */
  stabilityScore: number;
  
  /** 准确性评分 */
  accuracyScore: number;
  
  /** 跨设备评分 */
  crossDeviceScore: number;
  
  /** 可维护性评分 */
  maintainabilityScore: number;
  
  /** 权重配置 */
  weights: ScoreWeightConfig;
  
  /** 评分详情 */
  details: ScoringDetails;
}

/**
 * 评分详情
 */
export interface ScoringDetails {
  /** 评分时间戳 */
  timestamp: number;
  
  /** 评分版本 */
  version: string;
  
  /** 分析步骤 */
  analysisStep?: AnalysisStep;
  
  /** 评分依据 */
  rationale: string[];
  
  /** 扣分项 */
  penalties: string[];
  
  /** 加分项 */
  bonuses: string[];
}

// === 唯一性验证 ===

/**
 * 唯一性级别
 */
export type UniquenessLevel = 'unique' | 'mostly-unique' | 'somewhat-unique' | 'not-unique';

/**
 * 唯一性验证结果
 */
export interface UniquenessValidation {
  /** 唯一性级别 */
  level: UniquenessLevel;
  
  /** 唯一性分数 (0-100) */
  score: number;
  
  /** 冲突元素数量 */
  conflictCount: number;
  
  /** 相似元素列表 */
  similarElements: SimilarElement[];
  
  /** 唯一性因素 */
  uniquenessFactors: UniquenessFactors;
}

/**
 * 相似元素信息
 */
export interface SimilarElement {
  /** 元素描述 */
  description: string;
  
  /** 相似度 (0-1) */
  similarity: number;
  
  /** 相似的属性 */
  similarAttributes: string[];
  
  /** 位置信息 */
  bounds?: { left: number; top: number; right: number; bottom: number };
}

/**
 * 唯一性因素分析
 */
export interface UniquenessFactors {
  /** 文本唯一性 */
  textUniqueness: number;
  
  /** ID唯一性 */
  idUniqueness: number;
  
  /** 类名唯一性 */
  classUniqueness: number;
  
  /** 位置唯一性 */
  positionUniqueness: number;
  
  /** 层级唯一性 */
  hierarchyUniqueness: number;
}

// === 综合评分 ===

/**
 * 综合策略评估结果
 */
export interface ComprehensiveStrategyEvaluation {
  /** 策略类型 */
  strategy: MatchStrategy;
  
  /** 策略评分 */
  strategyScore: StrategyScore;
  
  /** 性能指标 */
  performanceMetrics: PerformanceMetrics;
  
  /** 稳定性评估 */
  stabilityAssessment: StabilityAssessment;
  
  /** 唯一性验证 */
  uniquenessValidation: UniquenessValidation;
  
  /** 综合推荐度 (0-100) */
  overallRecommendation: number;
  
  /** 推荐排名 */
  rank: number;
  
  /** 适用场景 */
  applicableScenarios: string[];
  
  /** 不适用场景 */
  notApplicableScenarios: string[];
}

// === 评分器配置 ===

/**
 * 策略评分器配置
 */
export interface StrategyTesterConfig {
  /** 权重配置 */
  weights: ScoreWeightConfig;
  
  /** 性能基准 */
  performanceBenchmark: PerformanceBenchmark;
  
  /** 启用详细分析 */
  enableDetailedAnalysis: boolean;
  
  /** 启用缓存 */
  enableCaching: boolean;
  
  /** 缓存过期时间 (ms) */
  cacheExpiration: number;
  
  /** 评分阈值 */
  scoreThresholds: ScoreThresholds;
}

/**
 * 评分阈值配置
 */
export interface ScoreThresholds {
  /** 优秀阈值 */
  excellent: number;
  
  /** 良好阈值 */
  good: number;
  
  /** 一般阈值 */
  fair: number;
  
  /** 差阈值 */
  poor: number;
}

// === 批量评分 ===

/**
 * 批量评分请求
 */
export interface BatchScoringRequest {
  /** 策略列表 */
  strategies: MatchStrategy[];
  
  /** 目标元素 */
  targetElement: any;
  
  /** XML内容 */
  xmlContent: string;
  
  /** 评分配置 */
  config?: StrategyTesterConfig;
  
  /** 并行处理 */
  parallel?: boolean;
}

/**
 * 批量评分结果
 */
export interface BatchScoringResult {
  /** 评分结果列表 */
  results: ComprehensiveStrategyEvaluation[];
  
  /** 最佳策略 */
  bestStrategy: ComprehensiveStrategyEvaluation;
  
  /** 评分统计 */
  statistics: ScoringStatistics;
  
  /** 处理时间 (ms) */
  processingTime: number;
  
  /** 错误信息 */
  errors: string[];
}

/**
 * 评分统计信息
 */
export interface ScoringStatistics {
  /** 总策略数 */
  totalStrategies: number;
  
  /** 成功评分数 */
  successfulScoring: number;
  
  /** 失败评分数 */
  failedScoring: number;
  
  /** 平均分数 */
  averageScore: number;
  
  /** 最高分数 */
  highestScore: number;
  
  /** 最低分数 */
  lowestScore: number;
  
  /** 分数分布 */
  scoreDistribution: { [range: string]: number };
}

// === 导出常量 ===

/**
 * 默认权重配置
 */
export const DEFAULT_WEIGHT_CONFIGS: Record<WeightPreset, ScoreWeightConfig> = {
  'speed-first': {
    performance: 0.4,
    stability: 0.2,
    accuracy: 0.2,
    crossDevice: 0.1,
    maintainability: 0.1
  },
  'stability-first': {
    performance: 0.1,
    stability: 0.4,
    accuracy: 0.2,
    crossDevice: 0.2,
    maintainability: 0.1
  },
  'accuracy-first': {
    performance: 0.1,
    stability: 0.2,
    accuracy: 0.4,
    crossDevice: 0.2,
    maintainability: 0.1
  },
  'balanced': {
    performance: 0.2,
    stability: 0.2,
    accuracy: 0.2,
    crossDevice: 0.2,
    maintainability: 0.2
  },
  'cross-device': {
    performance: 0.1,
    stability: 0.3,
    accuracy: 0.1,
    crossDevice: 0.4,
    maintainability: 0.1
  }
};

/**
 * 默认评分阈值
 */
export const DEFAULT_SCORE_THRESHOLDS: ScoreThresholds = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 40
};

/**
 * 默认性能基准
 */
export const DEFAULT_PERFORMANCE_BENCHMARK: PerformanceBenchmark = {
  maxExecutionTime: 5000, // 5秒
  minSuccessRate: 0.95,   // 95%
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  maxCpuUsage: 0.8        // 80%
};

// === StrategyScorer 综合评分器类型 ===

/**
 * 综合评分结果
 */
export interface ComprehensiveScore {
  /** 总分 (0-100) */
  total: number;
  
  /** 加权分数明细 */
  weighted: {
    performance: number;
    stability: number;
    accuracy: number;
    crossDevice: number;
    maintainability: number;
  };
  
  /** 原始分数明细 */
  breakdown: {
    performance: number;
    stability: number;
    accuracy: number;
    crossDevice: number;
    maintainability: number;
  };
}

/**
 * 评分明细
 */
export interface ScoreBreakdown {
  /** 性能评分 */
  performance: {
    score: number;
    level: string;
    details: any;
  };
  
  /** 稳定性评分 */
  stability: {
    score: number;
    level: string;
    details: any;
  };
  
  /** 准确性评分 */
  accuracy: {
    score: number;
    level: string;
    details: any;
  };
  
  /** 跨设备兼容性评分 */
  crossDevice: {
    score: number;
    level: string;
    details: any;
  };
  
  /** 可维护性评分 */
  maintainability: {
    score: number;
    level: string;
    details: any;
  };
}

/**
 * 策略综合评分结果（新版本，避免与旧版本冲突）
 */
export interface ComprehensiveStrategyScore {
  /** 策略类型 */
  strategy: MatchStrategy;
  
  /** 综合评分 */
  overall: ComprehensiveScore;
  
  /** 评分明细 */
  breakdown: ScoreBreakdown;
  
  /** 评分等级 */
  level: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** 优势列表 */
  strengths: string[];
  
  /** 弱点列表 */
  weaknesses: string[];
  
  /** 改进建议 */
  recommendations: string[];
  
  /** 置信度 (0-1) */
  confidence: number;
  
  /** 元数据 */
  metadata: {
    evaluatedAt: number;
    sessionId: string;
    context: any;
  };
}

/**
 * 评分上下文
 */
export interface ScoringContext {
  /** 设备配置 */
  deviceProfiles?: any[];
  
  /** 分辨率配置 */
  resolutionProfiles?: any[];
  
  /** 应用版本 */
  appVersions?: any[];
  
  /** 测试环境 */
  environment?: string;
  
  /** 额外配置 */
  [key: string]: any;
}

/**
 * 策略对比结果
 */
export interface ScoreComparison {
  /** 策略组A */
  groupA: {
    strategies: MatchStrategy[];
    scores: ComprehensiveStrategyScore[];
    averageScore: number;
    bestStrategy: ComprehensiveStrategyScore;
    worstStrategy: ComprehensiveStrategyScore;
  };
  
  /** 策略组B */
  groupB: {
    strategies: MatchStrategy[];
    scores: ComprehensiveStrategyScore[];
    averageScore: number;
    bestStrategy: ComprehensiveStrategyScore;
    worstStrategy: ComprehensiveStrategyScore;
  };
  
  /** 获胜方 */
  winner: 'A' | 'B' | 'tie';
  
  /** 显著差异 */
  significantDifferences: string[];
  
  /** 对比建议 */
  recommendations: string[];
}