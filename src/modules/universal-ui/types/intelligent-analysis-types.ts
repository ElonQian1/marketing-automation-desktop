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
}

/**
 * 选择哈希（防串扰）
 */
export type SelectionHash = string;

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
 */
export interface IntelligentStepCard {
  stepId: string;
  stepName: string;
  stepType: string;
  
  // 元素上下文
  elementContext: ElementSelectionContext;
  selectionHash: SelectionHash;
  
  // 分析状态（根据文档要求补齐字段）
  analysisState: StepAnalysisState;
  analysisJobId?: string;
  analysisProgress: number;
  analysisError?: string;
  estimatedTimeLeft?: number; // ETA毫秒
  
  // 文档要求的字段
  pendingAnalysis?: boolean;
  isAnalyzing?: boolean;
  
  // 策略信息
  strategyMode: StrategyMode;
  smartCandidates: StrategyCandidate[];
  staticCandidates: StrategyCandidate[];
  activeStrategy?: StrategyCandidate;
  recommendedStrategy?: StrategyCandidate;
  fallbackStrategy: StrategyCandidate;
  
  // 配置
  autoFollowSmart: boolean;
  lockContainer: boolean;
  smartThreshold: number; // 默认0.82
  
  // 时间戳
  createdAt: number;
  analyzedAt?: number;
  updatedAt: number;
}

/**
 * 步骤执行结果
 */
export interface StepExecutionResult {
  success: boolean;
  executedAt: number;
  duration: number;
  strategy: string;
  error?: string;
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
 * 分析完成事件
 */
export interface AnalysisDoneEvent {
  jobId: string;
  result: AnalysisResult;
}

/**
 * 分析错误事件
 */
export interface AnalysisErrorEvent {
  jobId: string;
  error: string;
  canRetry: boolean;
}