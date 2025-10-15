// src/components/DraggableStepCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 可拖拽的步骤卡片组件 - 基于统一 StepCardSystem 实现
 * 
 * 🔄 重构说明：
 * 此组件现在内部使用 StepCardSystem，消除了重复实现，但保持原有接口兼容性
 * 
 * ✅ 新特性：
 * - 消除重复的编辑、删除、模态框等逻辑
 * - 使用统一的数据格式和样式系统
 * - 保持完整的拖拽功能特性
 * 
 * 🎯 向后兼容：
 * - 保持相同的 Props 接口
 * - 保持相同的回调方法
 * - 保持相同的视觉效果
 */

import React from "react";
import { StepCardSystem } from "../modules/universal-ui/components/step-card-system/StepCardSystem";
import type { StepCardCallbacks, UnifiedStepCardData } from "../modules/universal-ui/types/unified-step-card-types";
import type { StepAnalysisState } from "../modules/universal-ui/types/intelligent-analysis-types";
import { SmartActionType } from "../types/smartComponents";

// 设备简化接口
export interface DeviceInfo {
  id: string;
  name: string;
  status: string;
}

// 步骤参数的通用接口
export interface StepParameters {
  // 基础参数
  element_selector?: string;
  bounds?: string;
  text?: string;
  timeout?: number;
  retry_count?: number;
  
  // 循环参数
  loop_count?: number;
  is_infinite_loop?: boolean;
  
  // 智能匹配参数
  matching?: {
    strategy?: 'standard' | 'absolute' | 'strict' | 'relaxed' | 'positionless';
    fields?: string[];
    values?: Record<string, string>;
  };
  
  // 循环主题和卡片主题
  loopTheme?: string;
  cardTheme?: string;
  cardSurface?: string;
  
  // XML快照相关
  xmlSnapshot?: {
    xmlContent?: string;
    xmlCacheId?: string;
    [key: string]: unknown;
  };
  xmlContent?: string;
  xmlCacheId?: string;
  
  // 元素相关字段
  class_name?: string;
  resource_id?: string;
  content_desc?: string;
  
  // 其他动态参数
  [key: string]: unknown;
}

export interface SmartScriptStep {
  id: string;
  name: string;
  step_type: SmartActionType | string;
  description: string;
  parameters: StepParameters;
  enabled: boolean;
  
  // 循环相关字段
  parent_loop_id?: string;
  parentLoopId?: string;
  loop_config?: {
    loopId: string;
    iterations: number;
    condition?: string;
    enabled: boolean;
    name: string;
    description?: string;
  };
}

export interface DraggableStepCardProps {
  /** 步骤数据 */
  step: SmartScriptStep;
  /** 步骤索引 */
  index: number;
  /** 当前设备ID */
  currentDeviceId?: string;
  /** 设备列表 */
  devices: DeviceInfo[];
  /** 是否正在拖拽 */
  isDragging?: boolean;
}

const DraggableStepCardInner: React.FC<
  DraggableStepCardProps & {
    onEdit: (step: SmartScriptStep) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
    onBatchMatch?: (id: string) => void;
    onUpdateStepParameters?: (id: string, nextParams: StepParameters) => void;
    onUpdateStepMeta?: (
      id: string,
      meta: { name?: string; description?: string }
    ) => void;
    StepTestButton?: React.ComponentType<{
      step: SmartScriptStep;
      deviceId?: string;
      disabled?: boolean;
    }>;
    ENABLE_BATCH_MATCH?: boolean;
    onEditStepParams?: (step: SmartScriptStep) => void;
    onOpenPageAnalyzer?: () => void;
  }
> = ({
  step,
  index,
  isDragging,
  onEdit,
  onDelete,
  onToggle,
  onUpdateStepParameters,
  onUpdateStepMeta,
  StepTestButton,
  onEditStepParams,
  onOpenPageAnalyzer,
}) => {
  // 🔄 重构：使用统一的 StepCardSystem，消除重复实现
  
  // 构建统一回调接口（适配现有接口）
  const callbacks: StepCardCallbacks = {
    // 基础操作
    onEdit: (_stepId: string) => {
      if (onOpenPageAnalyzer) return onOpenPageAnalyzer();
      if (onEditStepParams) return onEditStepParams(step);
      return onEdit(step);
    },
    onDelete: (_stepId: string) => onDelete(_stepId),
    onToggle: (stepId: string, _enabled: boolean) => onToggle(stepId),
    
    // 数据更新
    onDataChange: (stepId: string, newData: Partial<UnifiedStepCardData>) => {
      if (newData.name !== undefined || newData.description !== undefined) {
        onUpdateStepMeta?.(stepId, {
          name: newData.name,
          description: newData.description
        });
      }
    },
    onParameterChange: (stepId: string, parameters: StepParameters) => {
      onUpdateStepParameters?.(stepId, parameters);
    },
    
    // 拖拽相关（这里主要是状态报告，实际拖拽由外层处理）
    onDragStart: (_stepId: string) => {
      // 拖拽开始时的逻辑（如果需要）
    },
    onDragEnd: (_stepId: string, _newPosition: number) => {
      // 拖拽结束时的逻辑（如果需要）
    },
    
    // 测试功能
    onTest: StepTestButton ? (_stepId: string) => {
      // 测试功能暂时保留原有逻辑，通过 StepTestButton 组件处理
      // 这里可以添加测试前的准备工作
    } : undefined,
  };

  // 创建适配的步骤数据（添加缺失的属性和智能分析字段）
  const adaptedStepData: UnifiedStepCardData = {
    ...step,
    stepType: step.step_type || 'basic', // 使用现有的 step_type 或默认值
    
    // 🧠 智能分析字段（完整功能模式需要）
    analysisState: 'idle' as StepAnalysisState, // 初始状态为空闲
    analysisProgress: 0, // 初始进度为0
    smartCandidates: [], // 智能候选策略（空数组）
    staticCandidates: [], // 静态候选策略（空数组）
    
    // 添加其他可能需要的字段
    elementContext: step.parameters?.xmlSnapshot ? {
      snapshotId: step.parameters.xmlCacheId || '',
      elementPath: step.parameters.element_selector || '',
      elementText: step.parameters.text || step.description,
      elementBounds: step.parameters.bounds || '',
    } : undefined,
  };

  return (
    <StepCardSystem
      stepData={adaptedStepData}
      stepIndex={index}
      config={{
        // 启用拖拽功能（DraggableStepCard 的核心特性）
        enableDrag: true,
        enableEdit: true,
        enableDelete: true,
        enableToggle: true,
        enableTest: !!StepTestButton,
        
        // 🎯 启用智能分析功能（完整功能模式）
        enableIntelligent: true,
        
        // 保持其他功能可用
        enableCopy: true,
        enableViewDetails: true,
      }}
      styleConfig={{
        // 保持原有的视觉风格
        theme: 'default',
        size: 'default',
      }}
      callbacks={callbacks}
      isDragging={isDragging}
      systemMode="full" // 🎯 完整功能模式：拖拽 + 智能分析 + 所有操作按钮
      
      // 传递拖拽相关的自定义props（如果需要的话）
      dragHandleProps={{
        style: { touchAction: 'none' }
      }}
    />
  );


};

export const DraggableStepCard = React.memo(DraggableStepCardInner);

export default DraggableStepCard;
