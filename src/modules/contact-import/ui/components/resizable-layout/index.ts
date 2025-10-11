// src/modules/contact-import/ui/components/resizable-layout/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 导出可拖拽布局系统的所有组件和工具
export { useResizableLayout } from "./useResizableLayout";
export type { PanelConfig, LayoutState } from "./useResizableLayout";

export { ResizableDraggablePanel } from "./ResizableDraggablePanel";
export { LayoutManager } from "./LayoutManager";
export { NumberPoolPanel } from "./NumberPoolPanel";
export { DeviceAssignmentPanel } from "./DeviceAssignmentPanel";
export { TxtImportPanel } from "./TxtImportPanel";

// 预定义的面板配置
import type { PanelConfig } from "./useResizableLayout";

export const DEFAULT_PANELS: PanelConfig[] = [
  {
    id: "device-assignment",
    title: "设备与VCF",
    x: 20,
    y: 20,
    width: 1200,
    height: 400,
    minWidth: 800,
    minHeight: 300,
    isVisible: true,
    zIndex: 1,
  },
  {
    id: "txt-import",
    title: "导入 TXT 到号码池",
    x: 20,
    y: 440,
    width: 800,
    height: 300,
    minWidth: 600,
    minHeight: 200,
    isVisible: true,
    zIndex: 2,
  },
  {
    id: "number-pool",
    title: "号码池",
    x: 840,
    y: 440,
    width: 900,
    height: 500,
    minWidth: 700,
    minHeight: 400,
    isVisible: true,
    zIndex: 3,
  },
];
