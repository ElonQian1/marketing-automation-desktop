// src/modules/universal-ui/types/unified-step-card-types.ts
// module: universal-ui | layer: types | role: unified-types
// summary: 统一的步骤卡片数据格式，兼容所有现有格式

import type { IntelligentStepCard, StrategyCandidate, ElementSelectionContext } from './intelligent-analysis-types';
import type { SmartScriptStep } from '../../../types/smartScript';

/**
 * 统一的步骤卡片数据格式
 * 兼容 DraggableStepCard (SmartScriptStep) 和 UnifiedStepCard (IntelligentStepCard) 格式
 */
export interface UnifiedStepCardData {
  // === 基础信息 (所有格式通用) ===
  /** 步骤ID */
  id: string;
  /** 步骤名称 */
  name: string;
  /** 步骤类型 */
  stepType: string;
  /** 步骤描述 */
  description?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 执行顺序 */
  order?: number;

  // === 执行参数 (传统格式) ===
  /** 执行参数 */
  parameters?: Record<string, any>;
  /** 查找条件 */
  findCondition?: any;
  /** 验证条件 */
  verification?: any;
  /** 重试配置 */
  retryConfig?: any;
  /** 回退动作 */
  fallbackActions?: UnifiedStepCardData[];
  /** 前置条件 */
  preConditions?: string[];
  /** 后置条件 */
  postConditions?: string[];

  // === 循环相关 (DraggableStepCard支持) ===
  /** 父循环ID */
  parentLoopId?: string;
  /** 循环配置 */
  loopConfig?: {
    condition?: string;
    maxIterations?: number;
    breakCondition?: string;
  };

  // === 智能分析相关 (IntelligentStepCard格式) ===
  /** 元素上下文 */
  elementContext?: ElementSelectionContext;
  /** 选择哈希 */
  selectionHash?: string;
  /** 分析状态 */
  analysisState?: 'idle' | 'pending_analysis' | 'analyzing' | 'analysis_completed' | 'analysis_failed' | 'analysis_stale' | 'upgrade_available';
  /** 分析作业ID */
  analysisJobId?: string;
  /** 分析进度 */
  analysisProgress?: number;
  /** 分析错误 */
  analysisError?: string;
  /** 预计剩余时间 */
  estimatedTimeLeft?: number;

  // === 策略相关 ===
  /** 策略模式 */
  strategyMode?: 'intelligent' | 'smart_variant' | 'static_user';
  /** 智能候选策略 */
  smartCandidates?: StrategyCandidate[];
  /** 静态候选策略 */
  staticCandidates?: StrategyCandidate[];
  /** 当前激活策略 */
  activeStrategy?: StrategyCandidate;
  /** 推荐策略 */
  recommendedStrategy?: StrategyCandidate;
  /** 回退策略 */
  fallbackStrategy?: StrategyCandidate;

  // === 配置选项 ===
  /** 自动跟随智能推荐 */
  autoFollowSmart?: boolean;
  /** 锁定容器 */
  lockContainer?: boolean;
  /** 智能升级阈值 */
  smartThreshold?: number;

  // === 时间戳 ===
  /** 创建时间 */
  createdAt?: number;
  /** 分析时间 */
  analyzedAt?: number;
  /** 更新时间 */
  updatedAt?: number;

  // === 扩展字段（用于业务特化） ===
  /** 业务类型 */
  businessType?: 'prospecting' | 'script-builder' | 'contact-import' | 'adb';
  /** 业务特定数据 */
  businessData?: Record<string, any>;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 步骤卡片功能配置
 */
export interface StepCardFeatureConfig {
  /** 启用拖拽功能 */
  enableDrag?: boolean;
  /** 启用智能分析功能 */
  enableIntelligent?: boolean;
  /** 启用编辑功能 */
  enableEdit?: boolean;
  /** 启用删除功能 */
  enableDelete?: boolean;
  /** 启用测试功能 */
  enableTest?: boolean;
  /** 启用复制功能 */
  enableCopy?: boolean;
  /** 启用切换功能 */
  enableToggle?: boolean;
  /** 启用详情查看 */
  enableViewDetails?: boolean;
  /** 显示调试信息 */
  showDebugInfo?: boolean;
}

/**
 * 步骤卡片样式配置
 */
export interface StepCardStyleConfig {
  /** 主题 */
  theme?: 'default' | 'compact' | 'modern' | 'dark' | 'light';
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 拖拽视觉效果 */
  dragEffect?: 'rotate' | 'scale' | 'shadow' | 'none';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 步骤卡片回调函数类型
 */
export interface StepCardCallbacks {
  // === 基础操作 ===
  onEdit?: (stepId: string) => void;
  onDelete?: (stepId: string) => void;
  onTest?: (stepId: string) => void;
  onCopy?: (stepId: string) => void;
  onToggle?: (stepId: string, enabled: boolean) => void;
  onViewDetails?: (stepId: string) => void;

  // === 拖拽相关 ===
  onDragStart?: (stepId: string) => void;
  onDragEnd?: (stepId: string, newPosition: number) => void;

  // === 智能分析相关 ===
  onStartAnalysis?: (stepId: string) => void;
  onCancelAnalysis?: (stepId: string) => void;
  onRetryAnalysis?: (stepId: string) => void;
  onUpgradeStrategy?: (stepId: string) => void;
  onSwitchStrategy?: (stepId: string, strategyKey: string) => void;
  onAnalysisComplete?: (stepId: string, result: any) => void;
  onAnalysisError?: (stepId: string, error: any) => void;

  // === 数据更新 ===
  onDataChange?: (stepId: string, newData: Partial<UnifiedStepCardData>) => void;
  onParameterChange?: (stepId: string, parameters: Record<string, any>) => void;
  onMetaUpdate?: (stepId: string, meta: { name?: string; description?: string }) => void;
}

/**
 * 数据适配器函数类型
 */
export type DataAdapter<TSource, TTarget> = (source: TSource) => TTarget;

/**
 * 从传统 SmartScriptStep 格式适配到统一格式
 */
export const adaptFromSmartScriptStep: DataAdapter<SmartScriptStep, UnifiedStepCardData> = (step) => ({
  id: step.id,
  name: step.name,
  stepType: step.step_type,
  description: step.description,
  enabled: step.enabled,
  order: step.order,
  parameters: step.parameters,
  findCondition: step.find_condition,
  verification: step.verification,
  retryConfig: step.retry_config,
  fallbackActions: step.fallback_actions?.map(adaptFromSmartScriptStep),
  preConditions: step.pre_conditions,
  postConditions: step.post_conditions,
  // 添加默认的智能分析字段
  analysisState: 'idle',
  analysisProgress: 0,
  autoFollowSmart: true,
  smartThreshold: 0.82,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

/**
 * 从智能步骤卡片格式适配到统一格式
 */
export const adaptFromIntelligentStepCard: DataAdapter<IntelligentStepCard, UnifiedStepCardData> = (card) => ({
  id: card.stepId,
  name: card.stepName,
  stepType: card.stepType,
  enabled: true, // IntelligentStepCard 默认启用
  elementContext: card.elementContext,
  selectionHash: card.selectionHash,
  analysisState: card.analysisState,
  analysisJobId: card.analysisJobId,
  analysisProgress: card.analysisProgress,
  analysisError: card.analysisError,
  estimatedTimeLeft: card.estimatedTimeLeft,
  strategyMode: card.strategyMode,
  smartCandidates: card.smartCandidates,
  staticCandidates: card.staticCandidates,
  activeStrategy: card.activeStrategy,
  recommendedStrategy: card.recommendedStrategy,
  fallbackStrategy: card.fallbackStrategy,
  autoFollowSmart: card.autoFollowSmart,
  lockContainer: card.lockContainer,
  smartThreshold: card.smartThreshold,
  createdAt: card.createdAt,
  analyzedAt: card.analyzedAt,
  updatedAt: card.updatedAt
});

/**
 * 转换统一格式到传统 SmartScriptStep 格式
 */
export const adaptToSmartScriptStep: DataAdapter<UnifiedStepCardData, SmartScriptStep> = (data) => ({
  id: data.id,
  name: data.name,
  step_type: data.stepType,
  description: data.description || '',
  enabled: data.enabled ?? true,
  order: data.order ?? 0,
  parameters: data.parameters || {},
  find_condition: data.findCondition,
  verification: data.verification,
  retry_config: data.retryConfig,
  fallback_actions: data.fallbackActions?.map(adaptToSmartScriptStep),
  pre_conditions: data.preConditions,
  post_conditions: data.postConditions
});

/**
 * 转换统一格式到智能步骤卡片格式
 */
export const adaptToIntelligentStepCard: DataAdapter<UnifiedStepCardData, IntelligentStepCard> = (data) => ({
  stepId: data.id,
  stepName: data.name,
  stepType: data.stepType,
  elementContext: data.elementContext || {
    snapshotId: 'temp',
    elementPath: data.parameters?.element_selector as string || '',
    elementType: data.stepType,
    elementBounds: '[0,0][100,100]',
    keyAttributes: {}
  },
  selectionHash: data.selectionHash || 'temp-hash',
  analysisState: data.analysisState || 'idle',
  analysisJobId: data.analysisJobId,
  analysisProgress: data.analysisProgress || 0,
  analysisError: data.analysisError,
  estimatedTimeLeft: data.estimatedTimeLeft,
  pendingAnalysis: data.analysisState === 'pending_analysis',
  isAnalyzing: data.analysisState === 'analyzing',
  strategyMode: data.strategyMode || 'intelligent',
  smartCandidates: data.smartCandidates || [],
  staticCandidates: data.staticCandidates || [],
  activeStrategy: data.activeStrategy,
  recommendedStrategy: data.recommendedStrategy,
  fallbackStrategy: data.fallbackStrategy || {
    key: 'fallback',
    name: '默认策略',
    description: '基础XPath定位',
    confidence: 0.6,
    xpath: data.parameters?.element_selector as string || '//unknown',
    variant: 'index_fallback',
    enabled: true,
    isRecommended: false
  },
  autoFollowSmart: data.autoFollowSmart ?? true,
  lockContainer: data.lockContainer ?? false,
  smartThreshold: data.smartThreshold ?? 0.82,
  createdAt: data.createdAt || Date.now(),
  analyzedAt: data.analyzedAt,
  updatedAt: data.updatedAt || Date.now()
});

/**
 * 检查数据是否为 SmartScriptStep 格式
 */
export const isSmartScriptStep = (data: any): data is SmartScriptStep => {
  return data && typeof data.step_type !== 'undefined' && typeof data.parameters !== 'undefined';
};

/**
 * 检查数据是否为 IntelligentStepCard 格式
 */
export const isIntelligentStepCard = (data: any): data is IntelligentStepCard => {
  return data && typeof data.stepId !== 'undefined' && typeof data.analysisState !== 'undefined';
};

/**
 * 智能适配器：自动识别数据格式并转换为统一格式
 */
export const smartAdapt = (data: any): UnifiedStepCardData => {
  if (isIntelligentStepCard(data)) {
    return adaptFromIntelligentStepCard(data);
  }
  if (isSmartScriptStep(data)) {
    return adaptFromSmartScriptStep(data);
  }
  // 如果已经是统一格式，直接返回
  if (data.id && data.name && data.stepType) {
    return data as UnifiedStepCardData;
  }
  
  // 最后的兜底处理
  console.warn('[SmartAdapt] Unknown data format, using fallback adaptation:', data);
  return {
    id: data.id || data.stepId || 'unknown',
    name: data.name || data.stepName || 'Unknown Step',
    stepType: data.stepType || data.step_type || 'unknown',
    description: data.description,
    enabled: data.enabled ?? true,
    parameters: data.parameters,
    analysisState: 'idle',
    analysisProgress: 0,
    autoFollowSmart: true,
    smartThreshold: 0.82,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
};