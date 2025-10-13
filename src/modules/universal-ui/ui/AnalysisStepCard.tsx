// src/modules/universal-ui/ui/AnalysisStepCard.tsx
// module: universal-ui | layer: ui | role: component
// summary: 支持智能分析的增强步骤卡片组件

import React from 'react';
import { StepCard, type StepCardProps } from './StepCard';
import { AnalysisStatusSection } from './components/AnalysisStatusSection';
import { useStepCardAnalysis, type UseStepCardAnalysisProps } from './hooks/useStepCardAnalysis';
import type { AnalysisEnhancedStepCardProps } from './types/AnalysisStepCard';

/**
 * 增强步骤卡片属性
 */
export interface AnalysisStepCardProps extends StepCardProps, AnalysisEnhancedStepCardProps {
  /** 步骤ID */
  stepId?: string;
  /** 选择哈希 */
  selectionHash?: string;
  /** Hook配置 */
  analysisConfig?: UseStepCardAnalysisProps;
  /** 子元素 */
  children?: React.ReactNode;
}

/**
 * 支持智能分析的增强步骤卡片
 * 在原有StepCard基础上增加分析状态显示和交互
 */
export const AnalysisStepCard: React.FC<AnalysisStepCardProps> = ({
  stepId,
  selectionHash,
  analysis: propAnalysis,
  analysisActions: propAnalysisActions,
  enableAnalysis = false,
  analysisConfig,
  children,
  ...stepCardProps
}) => {
  
  // 智能分析状态管理
  const { analysis, actions } = useStepCardAnalysis({
    stepId,
    selectionHash,
    initialAnalysis: propAnalysis,
    ...analysisConfig,
  });

  // 合并外部传入的actions
  const mergedActions = {
    ...actions,
    ...propAnalysisActions,
  };

  return (
    <StepCard {...stepCardProps}>
      {/* 分析状态区域 */}
      {enableAnalysis && (
        <AnalysisStatusSection
          analysis={analysis}
          actions={mergedActions}
          size={stepCardProps.size}
        />
      )}
      
      {/* 原有内容 */}
      {children}
    </StepCard>
  );
};

export default AnalysisStepCard;

// 导出相关类型和Hook
export { useStepCardAnalysis };
export type { 
  StepCardAnalysisData, 
  StepCardAnalysisActions, 
  AnalysisStepState 
} from './types/AnalysisStepCard';