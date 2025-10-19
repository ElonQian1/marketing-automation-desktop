// src/modules/universal-ui/types/intelligent-analysis-types.ts
// module: universal-ui | layer: types | role: type-definitions
// summary: 智能分析工作流的核心类型定义

/**
 * 元素选择上下文
 */
export interface ElementSelectionContext {
  /** XML快照ID */
  snapshotId: string;
  /** 元素路径（node_index_chain） */
  elementPath: string;
  /** 元素文本内容 */
  elementText?: string;
  /** 元素边界框 */
  elementBounds?: string;
  /** 元素类型 */
  elementType?: string;
  /** XML内容（用于重新分析） */
  xmlContent?: string;
  /** XML哈希（用于验证） */
  xmlHash?: string;
  /** 关键属性（resource-id, class等） */
  keyAttributes?: Record<string, string>;
  /** 容器信息 */
  containerInfo?: {
    containerType: string;
    containerPath: string;
    itemIndex?: number;
    totalItems?: number;
  };
  /** 页面上下文 */
  pageContext?: {
    currentUrl: string;
    pageType: string;
    appVersion: string;
  };
  /** 设备ID (向后兼容测试) */
  deviceId?: string;
  /** 设备名称 (向后兼容测试) */
  device_id?: string;
}

/**
 * 选择哈希（防串扰）
 */
export type SelectionHash = string;

/**
 * 分析状态（向后兼容）
 */
export type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'failed';

/**
 * 分析进度（向后兼容）
 */
export interface AnalysisProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  stepDescription: string;
}

/**
 * 分析作业状态
 */
export type AnalysisJobState = 
  | 'queued'      // 队列中
  | 'running'     // 运行中
  | 'completed'   // 完成
  | 'failed'      // 失败
  | 'canceled';   // 已取消

/**
 * 分析作业
 */
export interface AnalysisJob {
  jobId: string;
  selectionHash: SelectionHash;
  stepId?: string;
  state: AnalysisJobState;
  progress: number;
  estimatedTimeLeft?: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
  result?: AnalysisResult;
}

/**
 * 策略性能指标
 */
export interface StrategyPerformance {
  speed: 'fast' | 'medium' | 'slow';
  stability: 'high' | 'medium' | 'low';
  crossDevice: 'excellent' | 'good' | 'fair';
}

/**
 * 策略候选项
 */
export interface StrategyCandidate {
  key: string;
  name: string;
  confidence: number;
  description: string;
  variant: 'self_anchor' | 'child_driven' | 'region_scoped' | 'neighbor_relative' | 'index_fallback';
  xpath?: string;
  enabled: boolean;
  isRecommended: boolean;
  
  // UI展示增强字段（可选）
  performance?: StrategyPerformance;
  pros?: string[];
  cons?: string[];
  scenarios?: string[];
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  selectionHash: SelectionHash;
  stepId?: string;
  smartCandidates: StrategyCandidate[];
  staticCandidates: StrategyCandidate[];
  recommendedKey: string;
  recommendedConfidence: number;
  fallbackStrategy: StrategyCandidate;
}

/**
 * 步骤卡片分析状态
 */
export type StepAnalysisState = 
  | 'idle'                // 未开始
  | 'pending_analysis'    // 等待分析
  | 'analyzing'          // 分析中
  | 'analysis_completed' // 分析完成
  | 'analysis_failed'    // 分析失败
  | 'analysis_stale'     // 分析过期
  | 'upgrade_available'; // 可升级

/**
 * 策略模式
 */
export type StrategyMode = 
  | 'intelligent'       // 智能匹配（推荐）
  | 'smart_variant'     // 智能-单步固定
  | 'static_user';      // 用户自建静态

/**
 * 智能步骤卡片数据
 * 
 * 🎯 完整字段说明（符合文档7要求）：
 * - 基础信息：stepId, stepName, stepType
 * - 元素上下文：elementContext, selectionHash
 * - 分析状态：analysisState, analysisJobId, analysisProgress等
 * - 策略信息：strategyMode, smartCandidates, activeStrategy等
 * - 配置开关：autoFollowSmart, lockContainer, smartThreshold
 * - 时间戳：createdAt, analyzedAt, updatedAt
 * - UI状态：isFallbackActive, canUpgrade等
 */
export interface IntelligentStepCard {
  // === 基础信息 ===
  stepId: string;
  stepName: string;
  stepType: string;
  
  // === 元素上下文 ===
  elementContext: ElementSelectionContext;
  selectionHash: SelectionHash;
  
  // === 分析状态（核心字段） ===
  /** 当前分析状态 */
  analysisState: StepAnalysisState;
  /** 分析任务ID */
  analysisJobId?: string;
  /** 分析进度（0-100） */
  analysisProgress: number;
  /** 分析错误信息 */
  analysisError?: string;
  /** 预计剩余时间（毫秒） */
  estimatedTimeLeft?: number;
  
  // === 兼容字段（向后兼容） ===
  /** 是否等待分析（兼容旧代码） */
  pendingAnalysis?: boolean;
  /** 是否正在分析（兼容旧代码） */
  isAnalyzing?: boolean;
  
  // === 策略信息 ===
  /** 策略模式：intelligent | smart_variant | static_user */
  strategyMode: StrategyMode;
  /** 智能候选策略列表（Step1-Step6） */
  smartCandidates: StrategyCandidate[];
  /** 静态候选策略列表（兜底策略） */
  staticCandidates: StrategyCandidate[];
  /** 当前激活的策略 */
  activeStrategy?: StrategyCandidate;
  /** 推荐策略 */
  recommendedStrategy?: StrategyCandidate;
  /** 兜底策略（必需，保底可用） */
  fallbackStrategy: StrategyCandidate;
  
  // === UI 状态字段（新增，文档要求） ===
  /** 是否正在使用兜底策略 */
  isFallbackActive?: boolean;
  /** 是否可以升级到推荐策略 */
  canUpgrade?: boolean;
  /** 是否显示升级按钮 */
  showUpgradeButton?: boolean;
  
  // === 配置开关 ===
  /** 是否自动跟随智能推荐（置信度≥阈值时自动切换） */
  autoFollowSmart: boolean;
  /** 是否锁定容器（作为先验传入分析） */
  lockContainer: boolean;
  /** 智能推荐阈值（默认0.82） */
  smartThreshold: number;
  
  // === 执行配置（可选） ===
  /** 是否允许后端受控回退 */
  allowBackendFallback?: boolean;
  /** 单次候选时间片（毫秒） */
  candidateTimeoutMs?: number;
  /** 总预算时间（毫秒） */
  totalBudgetMs?: number;
  
  // === 时间戳 ===
  /** 创建时间 */
  createdAt: number;
  /** 分析完成时间 */
  analyzedAt?: number;
  /** 最后更新时间 */
  updatedAt: number;
  
  // === 执行历史（可选） ===
  /** 上次执行结果 */
  lastExecutionResult?: StepExecutionResult;
  /** 执行历史（最近N次） */
  executionHistory?: StepExecutionResult[];
}

/**
 * 步骤执行结果
 */
export interface StepExecutionResult {
  /** 执行ID（唯一标识） */
  executionId: string;
  /** 是否成功 */
  success: boolean;
  /** 执行时间戳 */
  executedAt: number;
  /** 执行耗时（毫秒） */
  duration: number;
  /** 使用的策略名称 */
  strategy: string;
  /** 策略类型（智能/兜底/用户自建） */
  strategyType?: 'smart' | 'fallback' | 'user';
  /** 执行状态 */
  status?: 'success' | 'failed' | 'timeout' | 'skipped';
  /** 错误信息 */
  error?: string;
  /** 重试次数 */
  retryCount?: number;
}

/**
 * 分析进度事件
 */
export interface AnalysisProgressEvent {
  jobId: string;
  progress: number;
  message: string;
  estimatedTimeLeft?: number;
}

/**
 * 置信度证据分项
 */
export interface ConfidenceEvidence {
  /** 模型置信度分数 (0-1) */
  model?: number;
  /** 定位稳定性加分 (0-1) */
  locator?: number;
  /** 可见性加分 (0-1) */
  visibility?: number;
  /** 设备可用性加分 (0-1) */
  device?: number;
}

/**
 * 单步分析评分结果
 */
export interface SingleStepScore {
  /** 置信度 (0-1) */
  confidence: number;
  /** 来源：auto_chain | static | model */
  source?: 'auto_chain' | 'static' | 'model';
  /** 评分原因 */
  reasons?: string[];
  /** 评分时间 (ISO字符串) */
  at?: string;
}

/**
 * 步骤卡片元数据
 */
export interface StepCardMeta {
  /** 单步分析评分 */
  singleStepScore?: SingleStepScore;
}

/**
 * 分析完成事件
 */
export interface AnalysisDoneEvent {
  jobId: string;
  result: AnalysisResult;
  /** 整体置信度 (0-1) */
  confidence?: number;
  /** 置信度证据分项 */
  evidence?: ConfidenceEvidence;
  /** 推荐策略名称（冗余字段，便于事件处理） */
  recommended?: string;
  /** 卡片ID（冗余字段，便于事件路由） */
  card_id?: string;
  /** 元素UID（冗余字段，便于兜底路由） */
  element_uid?: string;
}

/**
 * 分析错误事件
 */
export interface AnalysisErrorEvent {
  jobId: string;
  error: string;
  canRetry: boolean;
}