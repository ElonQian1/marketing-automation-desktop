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
  enableExperimentalFeatures = false,
}) => {
  // 临时实现：直接使用 UnifiedStepCard
  const adaptedStepData = useMemo((): IntelligentStepCard => {
    // 简单的数据适配逻辑
    if ('stepId' in stepData) {
      return stepData as IntelligentStepCard; // 已经是 IntelligentStepCard 格式
    }
    
    // 转换旧格式到新格式
    const legacyStep = stepData as any;
    return {
      stepId: legacyStep.id || 'unknown',
      stepName: legacyStep.name || 'Unknown Step',
      stepType: legacyStep.step_type || 'unknown',
      analysisState: 'not_started' as const,
      elementContext: legacyStep.parameters?.element_selector || '',
      selectionHash: 'temp-hash',
      analysisProgress: 0,
      strategyMode: 'intelligent' as const,
      activeStrategy: null,
      fallbackStrategy: null,
      candidateStrategies: [],
      recommendedStrategy: null,
      analysisResult: null,
      lastAnalyzedAt: null,
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
        onEdit={callbacks.onEdit}
        onDelete={callbacks.onDelete}
        onTest={callbacks.onTest}
        onCopy={callbacks.onCopy}
        onToggle={callbacks.onToggle}
        onUpgradeStrategy={callbacks.onUpgradeStrategy}
        onRetryAnalysis={callbacks.onRetryAnalysis}
        onSwitchStrategy={callbacks.onSwitchStrategy}
        onViewDetails={callbacks.onViewDetails}
        onCancelAnalysis={callbacks.onCancelAnalysis}
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