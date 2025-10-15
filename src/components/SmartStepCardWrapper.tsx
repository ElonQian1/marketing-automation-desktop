// src/components/SmartStepCardWrapper.tsx
// module: ui | layer: ui | role: 现代化智能步骤卡片包装器
// summary: 使用现代化DraggableStepCard替代旧的UnifiedStepCard，解决白底白字问题

/**
 * 智能步骤卡片包装器
 * - 切换到现代化 DraggableStepCard 以解决白底白字问题
 * - 保持完整的向后兼容性
 * - 提供更好的视觉体验和交互反馈
 */

import React from "react";
import { DraggableStepCard } from "./DraggableStepCard";
import { SmartScriptStep } from "../types/smartScript"; // 使用统一的类型定义

interface SmartStepCardWrapperProps {
  step: SmartScriptStep; // 使用统一的SmartScriptStep类型
  index: number; // 步骤索引
  isDragging?: boolean; // 是否正在拖拽
  currentDeviceId?: string; // 当前设备ID
  devices: { id: string; name: string; status: string }[]; // 设备列表
  onOpenPageAnalyzer?: () => void; // 仅容器层使用，不向下透传
  // 操作回调（与 DraggableStepCard 对齐，必传）
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

export const SmartStepCardWrapper: React.FC<SmartStepCardWrapperProps> = (props) => {
  const { 
    step, 
    index, 
    isDragging,
    currentDeviceId,
    devices,
    onEdit, 
    onDelete, 
    onToggle,
    onEditStepParams,
    onUpdateStepMeta,
    StepTestButton,
    onUpdateStepParameters,
    onBatchMatch,
    ENABLE_BATCH_MATCH,
    onOpenPageAnalyzer
  } = props;

  return (
    <DraggableStepCard
      step={step}
      index={index}
      isDragging={isDragging}
      currentDeviceId={currentDeviceId}
      devices={devices}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggle={onToggle}
      onEditStepParams={onEditStepParams}
      onUpdateStepMeta={onUpdateStepMeta}
      StepTestButton={StepTestButton}
      onUpdateStepParameters={onUpdateStepParameters}
      onBatchMatch={onBatchMatch}
      ENABLE_BATCH_MATCH={ENABLE_BATCH_MATCH}
      onOpenPageAnalyzer={onOpenPageAnalyzer}
    />
  );
};

export default SmartStepCardWrapper;