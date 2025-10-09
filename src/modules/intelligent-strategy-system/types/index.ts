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
  StrategyCandidate,
  MatchStrategy,
  StrategyRecommendation,
  DecisionEngineConfig,
} from './DecisionTypes';

export { AnalysisStep } from './DecisionTypes';

// === 策略相关类型 ===
export type {
  MatchStrategy as MatchStrategyType,
  StrategyRecommendation as StrategyRecommendationType,
  StrategyCandidate as StrategyCandidateType,
  MatchingCriteria,
  ValidationResult,
  StrategyTag,
  StrategyConfig,
  StrategyComposition,
  StrategyExecutionResult,
  IStrategyAnalyzer,
  AnalysisContext,
} from './StrategyTypes';

// === 分析相关类型 ===
export type {
  ElementAnalysisContext,
  ElementNode,
  BoundsInfo,
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
  AnalysisCache,
  ElementAnalysisResult,
  ElementFeatureSummary,
  AnalysisMetadata,
  AnalysisPerformance,
  FieldHierarchy,
  HierarchyAnalysisResult,
} from './AnalysisTypes';

// === 便捷类型别名 ===

/**
 * 完整的策略推荐上下文
 */
export interface StrategyRecommendationContext {
  decision: DecisionContext;
  analysis: ElementAnalysisContext;
  options: AnalysisOptions;
}

/**
 * 快速分析选项
 */
export interface QuickAnalysisOptions {
  /** 分析模式 */
  mode?: AnalysisMode;
  
  /** 超时时间（毫秒） */
  timeout?: number;
  
  /** 是否启用缓存 */
  enableCaching?: boolean;
  
  /** 性能优先级 */
  priority?: 'speed' | 'accuracy';
}

/**
 * 批量分析请求
 */
export interface BatchAnalysisRequest {
  /** 要分析的元素列表 */
  elements: ElementNode[];
  
  /** 共享的XML内容 */
  xmlContent: string;
  
  /** 分析选项 */
  options: QuickAnalysisOptions;
  
  /** 并发限制 */
  concurrency?: number;
}

/**
 * 批量分析结果
 */
export interface BatchAnalysisResult {
  /** 各元素的分析结果 */
  results: ElementAnalysisResult[];
  
  /** 成功数量 */
  successCount: number;
  
  /** 失败数量 */
  failureCount: number;
  
  /** 总耗时 */
  totalTime: number;
  
  /** 错误信息 */
  errors: Array<{
    elementIndex: number;
    error: string;
  }>;
}

// === 事件类型 ===

/**
 * 策略分析事件
 */
export type StrategyAnalysisEvent = 
  | 'analysis_started'
  | 'step_completed'
  | 'strategy_found'
  | 'validation_completed'
  | 'analysis_completed'
  | 'analysis_failed';

/**
 * 事件数据接口
 */
export interface AnalysisEventData {
  /** 事件类型 */
  type: StrategyAnalysisEvent;
  
  /** 事件时间戳 */
  timestamp: number;
  
  /** 相关的元素 */
  element?: ElementNode;
  
  /** 当前步骤 */
  step?: AnalysisStep;
  
  /** 事件数据 */
  data?: any;
  
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * 事件监听器
 */
export type AnalysisEventListener = (event: AnalysisEventData) => void;

// === 配置相关类型 ===

/**
 * 全局配置
 */
export interface GlobalConfig {
  /** 调试模式 */
  debug: boolean;
  
  /** 默认超时时间 */
  defaultTimeout: number;
  
  /** 缓存配置 */
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  /** 性能配置 */
  performance: {
    maxConcurrency: number;
    enableMetrics: boolean;
    enableProfiling: boolean;
  };
  
  /** 日志配置 */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsoleOutput: boolean;
    enableFileOutput: boolean;
  };
}

/**
 * 分析器注册表项
 */
export interface AnalyzerRegistryEntry {
  /** 分析器名称 */
  name: string;
  
  /** 分析器版本 */
  version: string;
  
  /** 分析器类构造函数 */
  constructor: new (...args: any[]) => IStrategyAnalyzer;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 优先级 */
  priority: number;
  
  /** 依赖的其他分析器 */
  dependencies: string[];
  
  /** 分析器描述 */
  description: string;
}

// === 工具类型 ===

/**
 * 递归去除 readonly 的工具类型
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends readonly (infer U)[]
    ? Mutable<U>[]
    : T[P] extends readonly [...infer U]
    ? Mutable<U>
    : T[P] extends object
    ? Mutable<T[P]>
    : T[P];
};

/**
 * 深度部分可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 类型守卫工具
 */
export interface TypeGuards {
  isElementNode: (value: any) => value is ElementNode;
  isStrategyCandidate: (value: any) => value is StrategyCandidate;
  isAnalysisResult: (value: any) => value is ElementAnalysisResult;
  isMatchStrategy: (value: string) => value is MatchStrategy;
}

// === 常量导出 ===

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  TIMEOUT: 5000,
  MAX_DEPTH: 10,
  CACHE_TTL: 60000,
  MIN_CONFIDENCE: 0.5,
  MAX_CANDIDATES: 10,
} as const;

/**
 * 分析步骤权重
 */
export const STEP_WEIGHTS = {
  [AnalysisStep.SELF_ANCHOR]: 100,
  [AnalysisStep.CHILD_ANCHOR]: 80,
  [AnalysisStep.PARENT_CLICKABLE]: 70,
  [AnalysisStep.REGION_SCOPED]: 60,
  [AnalysisStep.NEIGHBOR_RELATIVE]: 50,
  [AnalysisStep.INDEX_FALLBACK]: 20,
} as const;

/**
 * 策略标签优先级
 */
export const TAG_PRIORITIES = {
  recommended: 100,
  fast: 90,
  stable: 85,
  precise: 80,
  fallback: 30,
  experimental: 20,
  legacy: 10,
} as const;