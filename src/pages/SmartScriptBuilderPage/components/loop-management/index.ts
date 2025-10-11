// src/pages/SmartScriptBuilderPage/components/loop-management/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环管理模块统一导出

export { LoopManager } from "./LoopManager";
export { useLoopManagement } from "./useLoopManagement";
export { LOOP_ACTION_CONFIGS } from "./loopConfigs";

// 重新导出类型
export type { ExtendedSmartScriptStep, LoopConfig } from "../../../../types/loopScript";
export { SmartActionType } from "../../../../types/smartComponents";