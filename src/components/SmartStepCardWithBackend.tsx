// src/components/SmartStepCardWithBackend.tsx
// module: components | layer: ui | role: 智能步骤卡片后端集成包装器
// summary: 集成真实后端服务的步骤卡片，支持完整的策略选择器功能

import React from 'react';
import DraggableStepCard from './DraggableStepCard';
import type { SmartScriptStep, DeviceInfo } from './DraggableStepCard';
import { useSmartStrategyAnalysis } from '../hooks/useSmartStrategyAnalysis';
import type { UIElement } from '../api/universalUIAPI';
import type { StrategyCandidate } from '../types/strategySelector';

interface SmartStepCardWithBackendProps {
  step: SmartScriptStep;
  index: number;
  devices: DeviceInfo[];
  currentDeviceId?: string;
  element?: UIElement; // 用于智能分析的元素信息
  onEdit: (step: SmartScriptStep) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onStepUpdate?: (step: SmartScriptStep) => void;
}

/**
 * 智能步骤卡片后端集成包装器
 * 
 * 将策略选择器与真实的智能分析后端服务集成，提供：
 * - 真实的策略分析和候选生成
 * - 实时分析进度和状态更新
 * - 策略应用和保存功能
 * - 与后端服务的完整交互
 */
export const SmartStepCardWithBackend: React.FC<SmartStepCardWithBackendProps> = ({
  step,
  index,
  devices,
  currentDeviceId,
  element,
  onEdit,
  onDelete,
  onToggle,
  onStepUpdate
}) => {
  // 使用智能策略分析Hook
  const {
    strategySelector,
    startAnalysis,
    cancelAnalysis,
    applyStrategy,
    saveAsStatic
  } = useSmartStrategyAnalysis({
    step,
    element
  });

  // 创建增强的步骤对象
  const enhancedStep: SmartScriptStep = {
    ...step,
    strategySelector: strategySelector || undefined
  };

  // 策略变更处理
  const handleStrategyChange = (stepId: string, selection: { type: string; key?: string }) => {
    console.log('🎯 [SmartStepCard] 策略变更:', { stepId, selection });
    applyStrategy(selection as { type: 'smart-auto' | 'smart-single' | 'static'; key?: string });
    
    // 通知父组件更新步骤
    if (onStepUpdate) {
      onStepUpdate({
        ...enhancedStep,
        parameters: {
          ...enhancedStep.parameters,
          strategy: selection.type,
          strategyKey: selection.key
        }
      });
    }
  };

  // 重新分析处理
  const handleReanalyze = (stepId: string) => {
    console.log('🔄 [SmartStepCard] 重新分析:', stepId);
    startAnalysis();
  };

  // 保存为静态策略处理
  const handleSaveAsStatic = (stepId: string, candidate: StrategyCandidate) => {
    console.log('💾 [SmartStepCard] 保存静态策略:', { stepId, candidate });
    saveAsStatic(candidate);
  };

  // 打开元素检查器处理
  const handleOpenElementInspector = (stepId: string) => {
    console.log('🔍 [SmartStepCard] 打开元素检查器:', stepId);
    // TODO: 实现元素检查器打开逻辑
    // 可以打开一个模态框或侧边栏，显示元素的详细信息和分析结果
  };

  // 取消分析处理
  const handleCancelAnalysis = (stepId: string, jobId: string) => {
    console.log('⏹️ [SmartStepCard] 取消分析:', { stepId, jobId });
    cancelAnalysis();
  };

  // 应用推荐策略处理
  const handleApplyRecommendation = (stepId: string, key: string) => {
    console.log('✨ [SmartStepCard] 应用推荐策略:', { stepId, key });
    
    if (!strategySelector?.recommended) {
      console.warn('⚠️ 没有推荐策略可应用');
      return;
    }

    // 找到推荐的候选策略
    const allCandidates = [
      ...strategySelector.candidates.smart,
      ...strategySelector.candidates.static
    ];
    
    const recommendedCandidate = allCandidates.find(c => c.key === key);
    
    if (recommendedCandidate) {
      // 根据候选策略类型确定策略模式
      const strategyType = recommendedCandidate.type === 'smart' ? 'smart-auto' : 'static';
      
      applyStrategy({
        type: strategyType,
        key: recommendedCandidate.key
      });

      // 更新推荐状态
      if (onStepUpdate) {
        onStepUpdate({
          ...enhancedStep,
          parameters: {
            ...enhancedStep.parameters,
            strategy: strategyType,
            strategyKey: recommendedCandidate.key
          }
        });
      }
    }
  };

  return (
    <DraggableStepCard
      step={enhancedStep}
      index={index}
      devices={devices}
      currentDeviceId={currentDeviceId}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggle={onToggle}
      onStrategyChange={handleStrategyChange}
      onReanalyze={handleReanalyze}
      onSaveAsStatic={handleSaveAsStatic}
      onOpenElementInspector={handleOpenElementInspector}
      onCancelAnalysis={handleCancelAnalysis}
      onApplyRecommendation={handleApplyRecommendation}
    />
  );
};

export default SmartStepCardWithBackend;