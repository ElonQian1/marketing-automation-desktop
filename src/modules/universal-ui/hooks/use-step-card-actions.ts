// src/modules/universal-ui/hooks/use-step-card-actions.ts
// module: universal-ui | layer: hooks | role: shared-logic
// summary: 步骤卡片通用操作逻辑，消除各组件间的重复实现

import { useCallback } from 'react';
import type { UnifiedStepCardData, StepCardCallbacks } from '../types/unified-step-card-types';

/**
 * 步骤卡片通用操作 Hook
 * 提取编辑、删除、测试、复制等重复功能
 */
export interface UseStepCardActionsProps {
  /** 步骤数据 */
  stepData: UnifiedStepCardData;
  /** 外部回调函数 */
  callbacks?: StepCardCallbacks;
  /** 是否启用各种功能 */
  features?: {
    enableEdit?: boolean;
    enableDelete?: boolean;
    enableTest?: boolean;
    enableCopy?: boolean;
    enableToggle?: boolean;
    enableViewDetails?: boolean;
  };
}

export interface UseStepCardActionsReturn {
  /** 编辑步骤 */
  handleEdit: () => void;
  /** 删除步骤 */
  handleDelete: () => void;
  /** 测试步骤 */
  handleTest: () => void;
  /** 复制步骤 */
  handleCopy: () => void;
  /** 切换启用状态 */
  handleToggle: () => void;
  /** 查看详情 */
  handleViewDetails: () => void;
  /** 更新步骤数据 */
  handleDataChange: (updates: Partial<UnifiedStepCardData>) => void;
  /** 更新参数 */
  handleParameterChange: (parameters: Record<string, any>) => void;
  /** 更新元信息 */
  handleMetaUpdate: (meta: { name?: string; description?: string }) => void;
  /** 检查功能是否可用 */
  isFeatureEnabled: (feature: keyof NonNullable<UseStepCardActionsProps['features']>) => boolean;
}

export const useStepCardActions = ({
  stepData,
  callbacks = {},
  features = {}
}: UseStepCardActionsProps): UseStepCardActionsReturn => {
  
  const handleEdit = useCallback(() => {
    if (features.enableEdit !== false && callbacks.onEdit) {
      callbacks.onEdit(stepData.id);
    }
  }, [stepData.id, callbacks.onEdit, features.enableEdit]);

  const handleDelete = useCallback(() => {
    if (features.enableDelete !== false && callbacks.onDelete) {
      callbacks.onDelete(stepData.id);
    }
  }, [stepData.id, callbacks.onDelete, features.enableDelete]);

  const handleTest = useCallback(() => {
    if (features.enableTest !== false && callbacks.onTest) {
      callbacks.onTest(stepData.id);
    }
  }, [stepData.id, callbacks.onTest, features.enableTest]);

  const handleCopy = useCallback(() => {
    if (features.enableCopy !== false && callbacks.onCopy) {
      callbacks.onCopy(stepData.id);
    }
  }, [stepData.id, callbacks.onCopy, features.enableCopy]);

  const handleToggle = useCallback(() => {
    if (features.enableToggle !== false && callbacks.onToggle) {
      callbacks.onToggle(stepData.id, !stepData.enabled);
    }
  }, [stepData.id, stepData.enabled, callbacks.onToggle, features.enableToggle]);

  const handleViewDetails = useCallback(() => {
    if (features.enableViewDetails !== false && callbacks.onViewDetails) {
      callbacks.onViewDetails(stepData.id);
    }
  }, [stepData.id, callbacks.onViewDetails, features.enableViewDetails]);

  const handleDataChange = useCallback((updates: Partial<UnifiedStepCardData>) => {
    if (callbacks.onDataChange) {
      callbacks.onDataChange(stepData.id, updates);
    }
  }, [stepData.id, callbacks.onDataChange]);

  const handleParameterChange = useCallback((parameters: Record<string, any>) => {
    if (callbacks.onParameterChange) {
      callbacks.onParameterChange(stepData.id, parameters);
    }
  }, [stepData.id, callbacks.onParameterChange]);

  const handleMetaUpdate = useCallback((meta: { name?: string; description?: string }) => {
    if (callbacks.onMetaUpdate) {
      callbacks.onMetaUpdate(stepData.id, meta);
    }
  }, [stepData.id, callbacks.onMetaUpdate]);

  const isFeatureEnabled = useCallback((feature: keyof NonNullable<UseStepCardActionsProps['features']>) => {
    return features[feature] !== false;
  }, [features]);

  return {
    handleEdit,
    handleDelete,
    handleTest,
    handleCopy,
    handleToggle,
    handleViewDetails,
    handleDataChange,
    handleParameterChange,
    handleMetaUpdate,
    isFeatureEnabled
  };
};

/**
 * 拖拽功能 Hook
 * 提取重复的拖拽逻辑
 */
export interface UseStepCardDragProps {
  /** 步骤数据 */
  stepData: UnifiedStepCardData;
  /** 是否启用拖拽 */
  enableDrag?: boolean;
  /** 是否正在拖拽 */
  isDragging?: boolean;
  /** 拖拽句柄属性 */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  /** 拖拽回调 */
  callbacks?: {
    onDragStart?: (stepId: string) => void;
    onDragEnd?: (stepId: string, newPosition: number) => void;
  };
}

export interface UseStepCardDragReturn {
  /** 拖拽是否启用 */
  isDragEnabled: boolean;
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 拖拽句柄属性 */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  /** 拖拽开始处理 */
  handleDragStart: () => void;
  /** 拖拽结束处理 */
  handleDragEnd: (newPosition: number) => void;
  /** 拖拽样式类名 */
  dragClassName: string;
  /** 拖拽样式 */
  dragStyle: React.CSSProperties;
}

export const useStepCardDrag = ({
  stepData,
  enableDrag = false,
  isDragging = false,
  dragHandleProps,
  callbacks = {}
}: UseStepCardDragProps): UseStepCardDragReturn => {

  const handleDragStart = useCallback(() => {
    if (enableDrag && callbacks.onDragStart) {
      callbacks.onDragStart(stepData.id);
    }
  }, [stepData.id, enableDrag, callbacks.onDragStart]);

  const handleDragEnd = useCallback((newPosition: number) => {
    if (enableDrag && callbacks.onDragEnd) {
      callbacks.onDragEnd(stepData.id, newPosition);
    }
  }, [stepData.id, enableDrag, callbacks.onDragEnd]);

  const dragClassName = isDragging ? 'dragging' : '';
  
  const dragStyle: React.CSSProperties = isDragging ? {
    opacity: 0.7,
    transform: 'rotate(2deg) scale(0.98)',
    transition: 'none'
  } : {
    transition: 'all 0.2s ease'
  };

  return {
    isDragEnabled: enableDrag,
    isDragging,
    dragHandleProps,
    handleDragStart,
    handleDragEnd,
    dragClassName,
    dragStyle
  };
};

/**
 * 智能分析功能 Hook
 * 提取重复的智能分析逻辑
 */
export interface UseStepCardIntelligentProps {
  /** 步骤数据 */
  stepData: UnifiedStepCardData;
  /** 是否启用智能分析 */
  enableIntelligent?: boolean;
  /** 智能分析回调 */
  callbacks?: {
    onStartAnalysis?: (stepId: string) => void;
    onCancelAnalysis?: (stepId: string) => void;
    onRetryAnalysis?: (stepId: string) => void;
    onUpgradeStrategy?: (stepId: string) => void;
    onSwitchStrategy?: (stepId: string, strategyKey: string) => void;
    onAnalysisComplete?: (stepId: string, result: any) => void;
    onAnalysisError?: (stepId: string, error: any) => void;
  };
}

export interface UseStepCardIntelligentReturn {
  /** 智能分析是否启用 */
  isIntelligentEnabled: boolean;
  /** 是否正在分析 */
  isAnalyzing: boolean;
  /** 分析进度 */
  analysisProgress: number;
  /** 是否有推荐策略 */
  hasRecommendation: boolean;
  /** 是否可以升级 */
  canUpgrade: boolean;
  /** 分析状态文本 */
  analysisStatusText: string;
  /** 开始分析 */
  handleStartAnalysis: () => void;
  /** 取消分析 */
  handleCancelAnalysis: () => void;
  /** 重试分析 */
  handleRetryAnalysis: () => void;
  /** 升级到推荐策略 */
  handleUpgradeStrategy: () => void;
  /** 切换策略 */
  handleSwitchStrategy: (strategyKey: string) => void;
}

export const useStepCardIntelligent = ({
  stepData,
  enableIntelligent = false,
  callbacks = {}
}: UseStepCardIntelligentProps): UseStepCardIntelligentReturn => {

  const isAnalyzing = stepData.analysisState === 'analyzing' || stepData.analysisState === 'pending_analysis';
  const analysisProgress = stepData.analysisProgress || 0;
  const hasRecommendation = !!stepData.recommendedStrategy && stepData.recommendedStrategy.confidence >= (stepData.smartThreshold || 0.82);
  const canUpgrade = stepData.analysisState === 'analysis_completed' && hasRecommendation && !stepData.autoFollowSmart;

  const getAnalysisStatusText = () => {
    switch (stepData.analysisState) {
      case 'idle':
        return '未开始分析';
      case 'pending_analysis':
        return '等待分析中...';
      case 'analyzing':
        return `智能分析进行中... ${analysisProgress}%`;
      case 'analysis_completed':
        if (hasRecommendation) {
          return `发现更优策略：${stepData.recommendedStrategy?.name} (${Math.round((stepData.recommendedStrategy?.confidence || 0) * 100)}%)`;
        }
        return '分析完成';
      case 'analysis_failed':
        return `分析失败：${stepData.analysisError || '未知错误'}`;
      case 'analysis_stale':
        return '分析可能过期';
      case 'upgrade_available':
        return '有可用升级';
      default:
        return '状态未知';
    }
  };

  const handleStartAnalysis = useCallback(() => {
    if (enableIntelligent && callbacks.onStartAnalysis) {
      callbacks.onStartAnalysis(stepData.id);
    }
  }, [stepData.id, enableIntelligent, callbacks.onStartAnalysis]);

  const handleCancelAnalysis = useCallback(() => {
    if (enableIntelligent && callbacks.onCancelAnalysis) {
      callbacks.onCancelAnalysis(stepData.id);
    }
  }, [stepData.id, enableIntelligent, callbacks.onCancelAnalysis]);

  const handleRetryAnalysis = useCallback(() => {
    if (enableIntelligent && callbacks.onRetryAnalysis) {
      callbacks.onRetryAnalysis(stepData.id);
    }
  }, [stepData.id, enableIntelligent, callbacks.onRetryAnalysis]);

  const handleUpgradeStrategy = useCallback(() => {
    if (enableIntelligent && callbacks.onUpgradeStrategy) {
      callbacks.onUpgradeStrategy(stepData.id);
    }
  }, [stepData.id, enableIntelligent, callbacks.onUpgradeStrategy]);

  const handleSwitchStrategy = useCallback((strategyKey: string) => {
    if (enableIntelligent && callbacks.onSwitchStrategy) {
      callbacks.onSwitchStrategy(stepData.id, strategyKey);
    }
  }, [stepData.id, enableIntelligent, callbacks.onSwitchStrategy]);

  return {
    isIntelligentEnabled: enableIntelligent,
    isAnalyzing,
    analysisProgress,
    hasRecommendation,
    canUpgrade,
    analysisStatusText: getAnalysisStatusText(),
    handleStartAnalysis,
    handleCancelAnalysis,
    handleRetryAnalysis,
    handleUpgradeStrategy,
    handleSwitchStrategy
  };
};