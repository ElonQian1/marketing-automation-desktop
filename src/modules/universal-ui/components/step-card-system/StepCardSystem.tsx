// src/modules/universal-ui/components/step-card-system/StepCardSystem.tsx
// module: universal-ui | layer: components | role: system-main
// summary: 步骤卡片系统主入口组件（临时实现版本）

import React, { useMemo } from 'react';
import type { StepCardSystemProps } from './types/step-card-system-types';

// 临时导入现有组件作为实现
import { UnifiedStepCard } from '../unified-step-card';
import type { IntelligentStepCard } from '../../types/intelligent-analysis-types';

/**
 * 步骤卡片系统主组件 (临时实现版本)
 * 
 * 🎯 核心理念：
 * 这是一个完整的步骤卡片系统，目前基于 UnifiedStepCard 实现
 * 未来将扩展为完整的层级架构系统
 * 
 * ⚠️ 重要说明：
 * - 外部开发者只应使用此组件
 * - 当前版本为临时实现，功能完整性有限
 * - 后续将实现完整的层级架构
 * 
 * @example
 * ```tsx
 * <StepCardSystem
 *   stepData={stepData}
 *   interactionConfig={{ enableDrag: true, enableEdit: true }}
 *   intelligentConfig={{ enableAnalysis: true, enableAutoUpgrade: true }}
 *   callbacks={{ onEdit: handleEdit, onUpgradeStrategy: handleUpgrade }}
 * />
 * ```
 */
export const StepCardSystem: React.FC<StepCardSystemProps> = ({
  stepData,
  stepIndex,
  className = '',
  showDebugInfo = false,
  interactionConfig = {},
  intelligentConfig = {},
  callbacks = {},
  systemMode = 'full',
}) => {
  // 临时实现：直接使用 UnifiedStepCard
  const adaptedStepData = useMemo((): IntelligentStepCard => {
    // 简单的数据适配逻辑
    if ('stepId' in stepData) {
      return stepData as IntelligentStepCard; // 已经是 IntelligentStepCard 格式
    }
    
    // 转换旧格式到新格式
    const legacyStep = stepData as Record<string, unknown>;
    const fallbackStrategy = {
      key: 'fallback',
      name: '默认策略',
      description: '基础XPath定位',
      confidence: 0.6,
      xpath: '//unknown',
      variant: 'index_fallback' as const,
      enabled: true,
      isRecommended: false,
    };
    
    return {
      stepId: (legacyStep.id as string) || 'unknown',
      stepName: (legacyStep.name as string) || 'Unknown Step',
      stepType: (legacyStep.step_type as string) || 'unknown',
      analysisState: 'idle' as const,
      elementContext: {
        snapshotId: 'temp',
        elementPath: (legacyStep.parameters as Record<string, unknown>)?.element_selector as string || '',
        elementType: (legacyStep.step_type as string) || 'unknown',
        elementBounds: '[0,0][100,100]',
        keyAttributes: {},
      },
      selectionHash: 'temp-hash',
      analysisProgress: 0,
      strategyMode: 'intelligent' as const,
      smartCandidates: [],
      staticCandidates: [],
      activeStrategy: fallbackStrategy,
      fallbackStrategy,
      autoFollowSmart: true,
      lockContainer: false,
      smartThreshold: 0.82,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }, [stepData]);

  if (showDebugInfo) {
    console.log('[StepCardSystem] 临时实现配置:', {
      original: stepData,
      adapted: adaptedStepData,
      config: { interactionConfig, intelligentConfig, systemMode },
      callbacks
    });
  }

  return (
    <div className={`step-card-system ${className}`}>
      {/* 临时实现：直接使用 UnifiedStepCard */}
      <UnifiedStepCard
        stepCard={adaptedStepData}
        stepIndex={stepIndex}
        showDebugInfo={showDebugInfo}
        draggable={interactionConfig.enableDrag}
        onEdit={callbacks.onEdit ? () => callbacks.onEdit?.(adaptedStepData.stepId) : undefined}
        onDelete={callbacks.onDelete ? () => callbacks.onDelete?.(adaptedStepData.stepId) : undefined}
        onTest={callbacks.onTest ? () => callbacks.onTest?.(adaptedStepData.stepId) : undefined}
        onCopy={callbacks.onCopy ? () => callbacks.onCopy?.(adaptedStepData.stepId) : undefined}
        onToggle={callbacks.onToggle ? () => callbacks.onToggle?.(adaptedStepData.stepId, true) : undefined}
        onUpgradeStrategy={callbacks.onUpgradeStrategy ? () => callbacks.onUpgradeStrategy?.(adaptedStepData.stepId) : undefined}
        onRetryAnalysis={callbacks.onRetryAnalysis ? () => callbacks.onRetryAnalysis?.(adaptedStepData.stepId) : undefined}
        onSwitchStrategy={callbacks.onSwitchStrategy ? (strategyKey: string) => callbacks.onSwitchStrategy?.(adaptedStepData.stepId, strategyKey) : undefined}
        onViewDetails={callbacks.onViewDetails ? () => callbacks.onViewDetails?.(adaptedStepData.stepId) : undefined}
        onCancelAnalysis={callbacks.onCancelAnalysis ? () => callbacks.onCancelAnalysis?.(adaptedStepData.stepId) : undefined}
      />
      
      {showDebugInfo && (
        <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', fontSize: 12 }}>
          <strong>🐛 StepCardSystem Debug Info:</strong>
          <br />Mode: {systemMode} | Drag: {interactionConfig.enableDrag ? '✅' : '❌'} | AI: {intelligentConfig.enableAnalysis ? '✅' : '❌'}
        </div>
      )}
    </div>
  );
};

export default StepCardSystem;