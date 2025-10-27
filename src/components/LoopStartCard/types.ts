// src/components/LoopStartCard/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环开始卡片相关类型定义

import type { LoopConfig, ExtendedSmartScriptStep } from "../../types/loopScript";

export interface LoopStartCardProps {
  /** 循环步骤数据 */
  step: ExtendedSmartScriptStep;
  /** 循环配置 */
  loopConfig?: LoopConfig;
  /** 是否正在拖拽 */
  isDragging?: boolean;
  /** 循环配置更新回调 */
  onLoopConfigUpdate: (updates: LoopConfig) => void;
  /** 删除循环回调 */
  onDeleteLoop: () => void;
}

export interface LoopHeaderProps {
  tempConfig: LoopConfig;
  isEditing: boolean;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onTempConfigChange: (updates: Partial<LoopConfig>) => void;
  onDeleteLoop: (loopId: string) => void;
}

export interface LoopConfigFormProps {
  tempConfig: LoopConfig;
  isEditing: boolean;
  onTempConfigChange: (updates: Partial<LoopConfig>) => void;
}