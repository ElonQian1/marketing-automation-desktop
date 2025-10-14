// src/modules/universal-ui/components/step-card-system/types/step-card-system-types.ts
// module: universal-ui | layer: types | role: system-types
// summary: 步骤卡片系统类型定义，明确系统组成和接口

import type { IntelligentStepCard } from '../../types/intelligent-analysis-types';

/**
 * 步骤卡片系统交互层配置
 * 控制系统的交互功能部件
 */
export interface StepCardInteractionConfig {
  /** 启用拖拽功能 */
  enableDrag?: boolean;
  /** 启用编辑功能 */
  enableEdit?: boolean;
  /** 启用测试功能 */
  enableTest?: boolean;
  /** 启用复制功能 */
  enableCopy?: boolean;
  /** 启用删除功能 */
  enableDelete?: boolean;
  /** 视觉主题 */
  theme?: 'default' | 'dark' | 'light' | 'compact';
  /** 拖拽时的视觉效果 */
  dragVisualEffect?: 'rotate' | 'scale' | 'shadow' | 'none';
}

/**
 * 步骤卡片系统智能层配置
 * 控制系统的智能分析功能部件
 */
export interface StepCardIntelligentConfig {
  /** 启用智能分析 */
  enableAnalysis?: boolean;
  /** 启用自动升级 */
  enableAutoUpgrade?: boolean;
  /** 智能升级阈值 */
  upgradeThreshold?: number;
  /** 显示分析详情 */
  showAnalysisDetails?: boolean;
  /** 显示候选策略 */
  showCandidates?: boolean;
  /** 最大候选数量 */
  maxCandidates?: number;
}

/**
 * 步骤卡片系统回调函数
 * 系统各层的事件回调统一管理
 */
export interface StepCardSystemCallbacks {
  // === 交互层回调 ===
  /** 拖拽开始 */
  onDragStart?: (stepId: string) => void;
  /** 拖拽结束 */
  onDragEnd?: (stepId: string, newPosition: number) => void;
  /** 编辑步骤 */
  onEdit?: (stepId: string) => void;
  /** 删除步骤 */
  onDelete?: (stepId: string) => void;
  /** 测试步骤 */
  onTest?: (stepId: string) => void;
  /** 复制步骤 */
  onCopy?: (stepId: string) => void;
  /** 切换启用状态 */
  onToggle?: (stepId: string, enabled: boolean) => void;
  /** 查看详情 */
  onViewDetails?: (stepId: string) => void;

  // === 智能层回调 ===
  /** 启动智能分析 */
  onStartAnalysis?: (stepId: string) => void;
  /** 取消智能分析 */
  onCancelAnalysis?: (stepId: string) => void;
  /** 重试智能分析 */
  onRetryAnalysis?: (stepId: string) => void;
  /** 升级到推荐策略 */
  onUpgradeStrategy?: (stepId: string) => void;
  /** 切换策略 */
  onSwitchStrategy?: (stepId: string, strategyKey: string) => void;
  /** 分析完成 */
  onAnalysisComplete?: (stepId: string, result: any) => void;
  /** 分析失败 */
  onAnalysisError?: (stepId: string, error: any) => void;
}

/**
 * 内部组件标记接口
 * 防止内部Layer组件被外部直接使用
 */
export interface InternalComponentMarker {
  /** 内部组件标记，外部无法构造 */
  readonly __internal: unique symbol;
}

/**
 * 步骤卡片系统主要属性接口
 * 这是外部开发者使用的主要接口
 */
export interface StepCardSystemProps {
  /** 步骤数据 */
  stepData: IntelligentStepCard;
  /** 步骤索引 */
  stepIndex?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;

  // === 系统配置 ===
  /** 交互层配置 */
  interactionConfig?: StepCardInteractionConfig;
  /** 智能层配置 */
  intelligentConfig?: StepCardIntelligentConfig;

  // === 系统回调 ===
  callbacks?: StepCardSystemCallbacks;

  // === 高级选项 ===
  /** 系统模式：完整模式包含所有功能 */
  systemMode?: 'full' | 'interaction-only' | 'intelligent-only';
  /** 是否启用实验性功能 */
  enableExperimentalFeatures?: boolean;
}

/**
 * 交互层内部属性（仅系统内部使用）
 */
export interface StepCardInteractionLayerProps extends InternalComponentMarker {
  stepData: IntelligentStepCard;
  stepIndex?: number;
  config: StepCardInteractionConfig;
  callbacks: Pick<StepCardSystemCallbacks, 
    'onDragStart' | 'onDragEnd' | 'onEdit' | 'onDelete' | 'onTest' | 'onCopy' | 'onToggle' | 'onViewDetails'
  >;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

/**
 * 智能层内部属性（仅系统内部使用）
 */
export interface StepCardIntelligentLayerProps extends InternalComponentMarker {
  stepData: IntelligentStepCard;
  config: StepCardIntelligentConfig;
  callbacks: Pick<StepCardSystemCallbacks,
    'onStartAnalysis' | 'onCancelAnalysis' | 'onRetryAnalysis' | 'onUpgradeStrategy' | 
    'onSwitchStrategy' | 'onAnalysisComplete' | 'onAnalysisError'
  >;
}

/**
 * 系统上下文类型
 * 用于内部组件间的通信
 */
export interface StepCardSystemContext {
  stepData: IntelligentStepCard;
  interactionConfig: Required<StepCardInteractionConfig>;
  intelligentConfig: Required<StepCardIntelligentConfig>;
  callbacks: StepCardSystemCallbacks;
  systemState: {
    isDragging: boolean;
    isAnalyzing: boolean;
    currentMode: 'full' | 'interaction-only' | 'intelligent-only';
  };
}

/**
 * 系统Hook返回类型
 */
export interface UseStepCardSystemReturn {
  /** 系统上下文 */
  context: StepCardSystemContext;
  /** 更新系统状态 */
  updateSystemState: (updates: Partial<StepCardSystemContext['systemState']>) => void;
  /** 获取层组件属性 */
  getInteractionLayerProps: () => StepCardInteractionLayerProps;
  getIntelligentLayerProps: () => StepCardIntelligentLayerProps;
}