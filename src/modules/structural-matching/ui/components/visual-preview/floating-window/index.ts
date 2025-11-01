// src/modules/structural-matching/ui/components/visual-preview/floating-window/index.ts
// module: structural-matching | layer: ui | role: component
// summary: 浮窗可视化模块导出

// 主组件
export { FloatingVisualWindow } from "./components/floating-visual-window";

// 子组件
export { FloatingWindowFrame } from "./components/floating-window-frame";
export { ScreenshotDisplay } from "./components/screenshot-display";
export { ElementTreeView } from "./components/element-tree-view";
export { AlignedImageDisplay } from "./components/aligned-image-display";
export { FloatingWindowDemo } from "./components/floating-window-demo";

// Hooks
export { useStepCardData } from "./hooks/use-step-card-data";

// 工具函数
export {
  calculateCropConfig,
  absoluteToRelativeCoords,
  relativeToAbsoluteCoords,
  calculateElementVisibility,
  calculateOverlapArea,
  calculateCenter,
  calculateDistance,
} from "./utils/coordinate-transform";

export {
  calculateViewportAlignment,
  calculateSmartWindowPosition,
} from "./utils/viewport-alignment";

export {
  correctElementBounds,
  recalculateChildElements,
} from "./utils/element-bounds-corrector";

// 类型导出
export type {
  WindowState,
  StepCardData,
  ElementTreeData,
  CropConfig,
  ViewportAlignment,
  FloatingVisualWindowProps,
  LoadingState,
} from "./types";
