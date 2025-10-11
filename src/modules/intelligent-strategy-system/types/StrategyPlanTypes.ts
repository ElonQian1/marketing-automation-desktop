// src/modules/intelligent-strategy-system/types/StrategyPlanTypes.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * StrategyPlanTypes.ts
 * 策略计划相关类型定义
 * 
 * @description 定义候选链、回退机制等核心类型
 */

import type { MatchStrategy, StrategyCandidate } from './StrategyTypes';

// === 策略计划核心类型 ===

/**
 * 策略计划 - 候选链的完整描述
 */
export interface StrategyPlan {
  /** 计划ID */
  planId: string;
  
  /** 目标元素指纹 */
  elementFingerprint: string;
  
  /** 候选策略列表（已排序） */
  candidates: StrategyCandidate[];
  
  /** 推荐策略索引 */
  recommendedIndex: number;
  
  /** 计划元数据 */
  metadata: PlanMetadata;
  
  /** 执行配置 */
  execution: ExecutionConfig;
  
  /** 本地验证结果 */
  localValidation: LocalValidationResult;
}

/**
 * 计划元数据
 */
export interface PlanMetadata {
  /** 生成时间戳 */
  generatedAt: number;
  
  /** 生成引擎版本 */
  engineVersion: string;
  
  /** XML快照哈希 */
  xmlHash: string;
  
  /** 设备信息 */
  deviceInfo?: {
    deviceId: string;
    appPackage: string;
    activityName: string;
  };
  
  /** 分析统计 */
  statistics: {
    totalCandidates: number;
    analysisTimeMs: number;
    stepsExecuted: string[];
  };
}

/**
 * 执行配置
 */
export interface ExecutionConfig {
  /** 是否允许后端回退 */
  allowBackendFallback: boolean;
  
  /** 总时间预算(ms) */
  timeBudgetMs?: number;
  
  /** 单个候选时间预算(ms) */
  perCandidateBudgetMs?: number;
  
  /** 严格模式（只执行推荐策略） */
  strictMode?: boolean;
  
  /** 多语言同义词 */
  i18nAlias?: string[];
  
  /** 断言列表 */
  assertions?: AssertionRule[];
  
  /** 性能优先级 */
  performancePriority: 'speed' | 'accuracy' | 'balanced';
}

/**
 * 本地验证结果
 */
export interface LocalValidationResult {
  /** 是否通过验证 */
  passed: boolean;
  
  /** 验证详情 */
  details: CandidateValidation[];
  
  /** 验证时间 */
  validationTimeMs: number;
  
  /** 验证警告 */
  warnings: string[];
}

/**
 * 候选策略验证结果
 */
export interface CandidateValidation {
  /** 候选策略索引 */
  candidateIndex: number;
  
  /** 匹配元素数量 */
  matchCount: number;
  
  /** 是否通过验证 */
  passed: boolean;
  
  /** 验证详情 */
  details: {
    isUnique: boolean;
    hasRequiredAttributes: boolean;
    passedAssertion: boolean;
  };
  
  /** 风险评估 */
  risks: ValidationRisk[];
}

/**
 * 验证风险
 */
export interface ValidationRisk {
  /** 风险级别 */
  level: 'low' | 'medium' | 'high';
  
  /** 风险类型 */
  type: 'duplicate_match' | 'missing_attribute' | 'structural_change' | 'performance_concern';
  
  /** 风险描述 */
  message: string;
  
  /** 建议措施 */
  suggestion?: string;
}

/**
 * 断言规则
 */
export interface AssertionRule {
  /** 断言类型 */
  type: 'pre_click' | 'post_click' | 'element_state';
  
  /** 断言条件 */
  condition: string;
  
  /** 期望值 */
  expected: any;
  
  /** 断言描述 */
  description: string;
}

// === 回退执行相关 ===

/**
 * 回退执行上下文
 */
export interface FallbackExecutionContext {
  /** 当前设备ID */
  deviceId: string;
  
  /** 策略计划 */
  plan: StrategyPlan;
  
  /** 当前尝试索引 */
  currentAttempt: number;
  
  /** 执行历史 */
  executionHistory: ExecutionAttempt[];
  
  /** 剩余时间预算 */
  remainingBudgetMs: number;
}

/**
 * 执行尝试记录
 */
export interface ExecutionAttempt {
  /** 尝试索引 */
  attemptIndex: number;
  
  /** 使用的候选策略 */
  candidateUsed: StrategyCandidate;
  
  /** 执行结果 */
  result: ExecutionResult;
  
  /** 执行时间 */
  executionTimeMs: number;
  
  /** 失败原因（如果失败） */
  failureReason?: string;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 匹配到的元素 */
  matchedElement?: {
    xpath: string;
    bounds: string;
    attributes: Record<string, string>;
  };
  
  /** 执行坐标 */
  coordinates?: {
    x: number;
    y: number;
  };
  
  /** 错误信息 */
  error?: string;
  
  /** 执行日志 */
  logs: string[];
}

// === 计划生成器配置 ===

/**
 * 计划生成器配置
 */
export interface PlanGeneratorConfig {
  /** 最大候选数量 */
  maxCandidates: number;
  
  /** 最小置信度阈值 */
  minConfidenceThreshold: number;
  
  /** 是否启用本地验证 */
  enableLocalValidation: boolean;
  
  /** 性能模式 */
  performanceMode: 'fast' | 'balanced' | 'thorough';
  
  /** 是否生成多语言支持 */
  enableI18nSupport: boolean;
  
  /** 是否生成断言 */
  enableAssertions: boolean;
}

// === 策略优化器 ===

/**
 * 策略优化建议
 */
export interface StrategyOptimization {
  /** 原始计划 */
  originalPlan: StrategyPlan;
  
  /** 优化后计划 */
  optimizedPlan: StrategyPlan;
  
  /** 优化变更 */
  changes: OptimizationChange[];
  
  /** 优化收益 */
  benefits: {
    performanceImprovement: number;
    stabilityImprovement: number;
    accuracyImprovement: number;
  };
}

/**
 * 优化变更
 */
export interface OptimizationChange {
  /** 变更类型 */
  type: 'reorder' | 'remove' | 'enhance' | 'add';
  
  /** 变更描述 */
  description: string;
  
  /** 影响的候选索引 */
  affectedCandidates: number[];
  
  /** 变更原因 */
  reason: string;
}

// === 导出类型集合 ===
// 所有类型已通过 interface 声明自动导出