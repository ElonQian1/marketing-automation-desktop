// src/modules/structural-matching/ui/components/visual-preview/core/positioning/structural-matching-positioning-types.ts
// module: structural-matching | layer: ui | role: 定位类型定义
// summary: 浮窗定位策略与选项的类型约束，供视口对齐算法使用

export type StructuralMatchingPositioningMode =
  | "auto" // 根据锚点与屏幕空间自动选择左右
  | "right-edge" // 靠屏幕右侧固定边距
  | "anchor-right" // 优先锚点右侧，空间不足再自动
  | "fixed"; // 使用固定位置

export interface StructuralMatchingPositioningOptions {
  mode?: StructuralMatchingPositioningMode;
  /** 与屏幕边缘的安全边距 */
  margin?: number; // 默认 20-24
  /** 固定位置（当 mode=fixed 时生效） */
  fixedPosition?: { x: number; y: number };
}
