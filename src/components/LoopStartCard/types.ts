// src/components/LoopStartCard/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环开始卡片相关类型定义

import type { LoopConfig, ExtendedSmartScriptStep } from "../../types/loopScript";
import type { LoopTestState } from "../../modules/loop-control/application/use-loop-test-manager";

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
  onDeleteLoop: (loopId: string) => void;
  
  // 🎯 循环测试联动支持
  /** 循环测试状态 */
  loopTestState?: LoopTestState;
  /** 是否可以开始测试 */
  canStartTest?: boolean;
  /** 是否可以停止测试 */
  canStopTest?: boolean;
  /** 开始测试回调 */
  onStartTest?: () => Promise<void>;
  /** 停止测试回调 */
  onStopTest?: () => Promise<void>;
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