// src/modules/structural-matching/ui/components/visual-preview/index.ts
// module: structural-matching | layer: ui | role: 主入口
// summary: 结构匹配可视化预览模块统一导出

// ========== 类型定义 ==========
export * from './types';

// ========== 核心算法 ==========
export * from './core';

// ========== Hooks ==========
export * from './hooks';

// ========== 组件 ==========
export * from './components';

// ========== 工具函数 ==========
export * from './utils';

// ========== 向后兼容导出 ==========
// 提供旧版接口名称，避免破坏现有引用
export {
  StructuralMatchingVisualOverlay as FloatingVisualOverlay,
  type StructuralMatchingVisualOverlayProps as FloatingVisualOverlayProps,
} from './components';

export {
  StructuralMatchingFloatingWindow as FloatingVisualWindow,
} from './components';

export {
  useStructuralMatchingStepData as useStepCardData,
} from './hooks';

export {
  useStructuralMatchingTreeCoordination as useTreeVisualCoordination,
  type UseStructuralMatchingTreeCoordinationProps as UseTreeVisualCoordinationProps,
} from './hooks';