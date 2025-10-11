// src/components/ui/motion/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 文件路径：src/components/ui/motion/index.ts

/**
 * Motion 动效系统入口
 *
 * 轻组件统一通过此文件导入动效参数与预设。
 * 具体的时长、缓动与 Variants 定义在 presets.ts 中，
 * 此处仅做导出聚合，方便按需引用。
 */

export * from "./presets";

export { motionPresets } from "./presets";