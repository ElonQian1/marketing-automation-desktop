// src/components/SmartStepCardWrapper.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 智能步骤卡片包装器
 * - 切换到 UnifiedStepCard 以支持智能分析状态显示
 */

import React from "react";
import { UnifiedStepCard } from "../modules/universal-ui/components/unified-step-card";
import type { IntelligentStepCard, ElementSelectionContext, SelectionHash, StrategyCandidate } from "../modules/universal-ui/types/intelligent-analysis-types";
import { SmartScriptStep } from "../types/smartScript"; // 使用统一的类型定义

interface SmartStepCardWrapperProps {
  step: SmartScriptStep; // 使用统一的SmartScriptStep类型
  index: number; // 步骤索引
  isDragging?: boolean; // 是否正在拖拽
  currentDeviceId?: string; // 当前设备ID
  devices: { id: string; name: string; status: string }[]; // 设备列表
  onOpenPageAnalyzer?: () => void; // 仅容器层使用，不向下透传
  // 操作回调（与 UnifiedStepCard 对齐，必传）
  onEdit: (step: SmartScriptStep) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEditStepParams?: (step: SmartScriptStep) => void;
  // 更新元信息（名称/描述）
  onUpdateStepMeta?: (stepId: string, meta: { name?: string; description?: string }) => void;
  // 测试按钮组件（向后兼容）
  StepTestButton?: React.ComponentType<{ step: SmartScriptStep; deviceId?: string; disabled?: boolean }>;
  // 其他可能的属性（向后兼容）
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, unknown>) => void;
  onBatchMatch?: (stepId: string) => void;
  ENABLE_BATCH_MATCH?: boolean;
}

/**
 * 将 SmartScriptStep 适配为 IntelligentStepCard 格式
 */
function adaptStepToIntelligentCard(step: SmartScriptStep): IntelligentStepCard {
  const now = Date.now();
  
  // 创建模拟的元素选择上下文
  const mockElementContext: ElementSelectionContext = {
    snapshotId: step.parameters?.xmlCacheId || `mock_${step.id}`,
    elementPath: step.parameters?.element_selector || `//*[@id="${step.id}"]`,
    elementText: step.parameters?.text || step.name,
    elementBounds: step.parameters?.bounds,
    elementType: step.step_type,
    keyAttributes: {
      'resource-id': step.parameters?.resource_id || '',
      'class': step.parameters?.class_name || '',
      'content-desc': step.parameters?.content_desc || ''
    }
  };

  // 创建模拟的策略候选项
  const mockCandidates: StrategyCandidate[] = [
    {
      key: 'primary',
      name: '智能推荐策略',
      confidence: 85,
      description: `基于${step.step_type}的智能识别策略`,
      variant: 'self_anchor',
      xpath: step.parameters?.element_selector,
      enabled: true,
      isRecommended: true,
      performance: {
        speed: 'fast',
        stability: 'high',
        crossDevice: 'excellent'
      }
    }
  ];

  return {
    // 基础信息
    stepId: step.id,
    stepName: step.name,
    stepType: step.step_type,
    
    // 元素上下文
    elementContext: mockElementContext,
    selectionHash: `hash_${step.id}` as SelectionHash,
    
    // 分析状态（演示不同状态）
    analysisState: Math.random() > 0.7 ? 'analysis_completed' : 
                   Math.random() > 0.5 ? 'analyzing' : 'idle',
    analysisProgress: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0,
    
    // 策略信息
    strategyMode: 'intelligent',
    smartCandidates: mockCandidates,
    staticCandidates: [],
    activeStrategy: mockCandidates[0],
    recommendedStrategy: mockCandidates[0],
    fallbackStrategy: mockCandidates[0],
    
    // UI 状态
    canUpgrade: Math.random() > 0.6,
    showUpgradeButton: Math.random() > 0.7,
    
    // 配置开关
    autoFollowSmart: true,
    lockContainer: false,
    smartThreshold: 0.82,
    
    // 时间戳
    createdAt: now,
    updatedAt: now
  };
}

export const SmartStepCardWrapper: React.FC<SmartStepCardWrapperProps> = (props) => {
  const { step, index, onEdit, onDelete, onToggle } = props;

  // 适配数据格式
  const intelligentStep = React.useMemo(() => adaptStepToIntelligentCard(step), [step]);

  return (
    <UnifiedStepCard
      stepCard={intelligentStep}
      stepIndex={index}
      size="default"
      onEdit={() => onEdit(step)}
      onDelete={() => onDelete(step.id)}
      onToggle={() => onToggle(step.id)}
      onUpgradeStrategy={() => {
        console.log('🚀 升级策略:', step.name);
      }}
      onRetryAnalysis={() => {
        console.log('🔄 重试分析:', step.name);
      }}
      onViewDetails={() => {
        console.log('👁️ 查看详情:', step.name);
      }}
      onSwitchStrategy={(strategyKey, followSmart) => {
        console.log('🔀 切换策略:', strategyKey, 'followSmart:', followSmart);
      }}
    />
  );
};

export default SmartStepCardWrapper;
