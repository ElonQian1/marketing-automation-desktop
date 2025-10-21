// src/components/SmartStepCardWrapper.tsx
// module: ui | layer: ui | role: 现代化智能步骤卡片包装器
// summary: 使用现代化DraggableStepCard替代旧的UnifiedStepCard，解决白底白字问题

/**
 * 智能步骤卡片包装器
 * - 根据步骤类型自动选择合适的卡片组件
 * - 循环步骤使用专门的 LoopStepCard
 * - 普通步骤使用现代化 DraggableStepCard
 * - 保持完整的向后兼容性
 */

import React from "react";
import { DraggableStepCard } from "./DraggableStepCard";
import { LoopStepCard } from "../modules/loop-control/components/LoopStepCard";
import { LoopStartCard } from "./LoopStartCard";
import { LoopEndCard } from "./LoopEndCard";
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
  // 🔄 智能分析功能
  onReanalyze?: (stepId: string) => Promise<void>;
  isAnalyzing?: boolean;
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
    onOpenPageAnalyzer,
    // 🔄 智能分析功能
    onReanalyze,
    isAnalyzing
  } = props;

  // 🎯 智能路由：根据步骤类型选择合适的卡片组件
  
  // 循环开始步骤 - 使用专门的循环开始卡片
  if (step.step_type === 'loop_start') {
    return (
      <LoopStartCard
        step={step}
        index={index}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        // 循环卡片特定属性
        loopConfig={step.parameters?.loop_config || {
          loopId: step.parameters?.loop_id as string || `loop_${step.id}`,
          name: step.parameters?.loop_name as string || step.name,
          iterations: step.parameters?.loop_count as number || 1,
          enabled: step.enabled
        }}
        onLoopConfigUpdate={(config) => {
          // 更新循环配置
          if (onUpdateStepParameters) {
            onUpdateStepParameters(step.id, {
              ...step.parameters,
              loop_config: config,
              loop_id: config.loopId,
              loop_name: config.name,
              loop_count: config.iterations
            });
          }
        }}
        onDeleteLoop={() => onDelete(step.id)}
      />
    );
  }

  // 循环结束步骤 - 使用专门的循环结束卡片
  if (step.step_type === 'loop_end') {
    return (
      <LoopEndCard
        step={step}
        index={index}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        // 循环卡片特定属性
        loopConfig={step.parameters?.loop_config || {
          loopId: step.parameters?.loop_id as string || `loop_${step.id}`,
          name: step.parameters?.loop_name as string || step.name,
          iterations: step.parameters?.loop_count as number || 1,
          enabled: step.enabled
        }}
      />
    );
  }

  // 普通步骤 - 使用现代化拖拽卡片
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
      // 🔄 智能分析功能
      onReanalyze={onReanalyze}
      isAnalyzing={isAnalyzing}
    />
  );
};

export default SmartStepCardWrapper;