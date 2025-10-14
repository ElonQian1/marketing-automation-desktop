// src/modules/universal-ui/components/improved-smart-step-wrapper.tsx
// module: universal-ui | layer: components | role: wrapper-adapter
// summary: 改进的智能步骤卡片包装器，使用新的StepCardSystem替代DraggableStepCard

import React from "react";
import { StepCardSystem } from "./step-card-system/StepCardSystem";
import type { SmartScriptStep } from "../../../types/smartScript";
import type { StepCardCallbacks, UnifiedStepCardData } from "../types/unified-step-card-types";

interface ImprovedSmartStepWrapperProps {
  /** 步骤数据 */
  step: SmartScriptStep;
  /** 步骤索引 */
  stepIndex?: number;
  /** 是否正在拖拽 */
  isDragging?: boolean;
  /** 拖拽句柄属性 */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  
  // === 传统回调函数（兼容现有接口） ===
  /** 编辑步骤 */
  onEdit: (step: SmartScriptStep) => void;
  /** 删除步骤 */
  onDelete: (id: string) => void;
  /** 切换步骤启用状态 */
  onToggle: (id: string) => void;
  /** 编辑步骤参数 */
  onEditStepParams?: (step: SmartScriptStep) => void;
  /** 更新步骤元信息 */
  onUpdateStepMeta?: (stepId: string, meta: { name?: string; description?: string }) => void;
  /** 测试步骤 */
  onTest?: (step: SmartScriptStep) => void;
  /** 复制步骤 */
  onCopy?: (step: SmartScriptStep) => void;
  /** 打开页面分析器（可选） */
  onOpenPageAnalyzer?: () => void;
  
  // === 拖拽相关 ===
  /** 拖拽开始 */
  onDragStart?: (stepId: string) => void;
  /** 拖拽结束 */
  onDragEnd?: (stepId: string, newPosition: number) => void;
  
  // === 智能分析相关（可选） ===
  /** 启动智能分析 */
  onStartAnalysis?: (stepId: string) => void;
  /** 升级到推荐策略 */
  onUpgradeStrategy?: (stepId: string) => void;
  /** 重试分析 */
  onRetryAnalysis?: (stepId: string) => void;
  
  // === 配置选项 ===
  /** 是否启用智能分析功能 */
  enableIntelligent?: boolean;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 自定义样式主题 */
  theme?: 'default' | 'compact' | 'modern';
}

/**
 * 改进的智能步骤卡片包装器
 * 
 * 🎯 核心优势：
 * 1. 使用统一的 StepCardSystem 替代分散的 DraggableStepCard
 * 2. 自动适配数据格式，无需手动转换
 * 3. 统一的功能配置和样式系统
 * 4. 完整的向后兼容性，现有代码无需修改
 * 5. 可选的智能分析功能集成
 * 
 * 📋 迁移指南：
 * ```tsx
 * // 旧用法
 * <SmartStepCardWrapper
 *   step={step}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onToggle={handleToggle}
 * />
 * 
 * // 新用法（完全兼容）
 * <ImprovedSmartStepWrapper
 *   step={step}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onToggle={handleToggle}
 *   enableIntelligent={true}  // 可选：启用智能分析
 *   theme="modern"           // 可选：使用现代主题
 * />
 * ```
 */
export const ImprovedSmartStepWrapper: React.FC<ImprovedSmartStepWrapperProps> = ({
  step,
  stepIndex,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggle,
  onEditStepParams,
  onUpdateStepMeta,
  onTest,
  onCopy,
  onOpenPageAnalyzer,
  onDragStart,
  onDragEnd,
  onStartAnalysis,
  onUpgradeStrategy,
  onRetryAnalysis,
  enableIntelligent = false,
  showDebugInfo = false,
  theme = 'default'
}) => {
  // 构建统一的回调函数
  const callbacks: StepCardCallbacks = {
    // 基础操作（适配现有接口）
    onEdit: () => {
      onEdit(step);
    },
    onDelete: (stepId: string) => {
      onDelete(stepId);
    },
    onToggle: (stepId: string) => {
      onToggle(stepId);
    },
    onTest: onTest ? () => {
      onTest(step);
    } : undefined,
    onCopy: onCopy ? () => {
      onCopy(step);
    } : undefined,
    
    // 数据更新
    onMetaUpdate: onUpdateStepMeta ? (stepId: string, meta: { name?: string; description?: string }) => {
      onUpdateStepMeta(stepId, meta);
    } : undefined,
    onParameterChange: onEditStepParams ? (_stepId: string, parameters: Record<string, unknown>) => {
      const updatedStep = { ...step, parameters };
      onEditStepParams(updatedStep);
    } : undefined,
    
    // 拖拽操作
    onDragStart,
    onDragEnd,
    
    // 智能分析操作
    onStartAnalysis,
    onUpgradeStrategy,
    onRetryAnalysis,
    
    // 详情查看（如果有页面分析器）
    onViewDetails: onOpenPageAnalyzer ? () => {
      onOpenPageAnalyzer();
    } : undefined
  };

  // 转换 SmartScriptStep 到 UnifiedStepCardData 格式
  const unifiedStepData: UnifiedStepCardData = {
    ...step,
    stepType: step.step_type || 'click', // SmartScriptStep 使用 'step_type'，UnifiedStepCardData 使用 'stepType'
  };

  return (
    <StepCardSystem
      stepData={unifiedStepData}
      stepIndex={stepIndex}
      isDragging={isDragging}
      dragHandleProps={dragHandleProps}
      config={{
        enableDrag: true,
        enableEdit: true,
        enableDelete: true,
        enableTest: !!onTest,
        enableCopy: !!onCopy,
        enableToggle: true,
        enableViewDetails: !!onOpenPageAnalyzer,
        enableIntelligent,
        showDebugInfo
      }}
      styleConfig={{
        theme,
        size: 'default',
        className: 'improved-smart-step-wrapper'
      }}
      callbacks={callbacks}
      systemMode={enableIntelligent ? 'full' : 'interaction-only'}
    />
  );
};

/**
 * 兼容性别名，方便渐进式迁移
 * 可以直接替换现有的 SmartStepCardWrapper 导入
 */
export const SmartStepCardWrapperV2 = ImprovedSmartStepWrapper;

export default ImprovedSmartStepWrapper;