/**
 * 通用网格拖拽布局系统
 * 
 * 此模块提供了完整的拖拽布局解决方案，可在任何页面中复用
 * 
 * 核心特性：
 * ✅ 标题栏拖拽 - 只有标题栏空白区域可拖拽
 * ✅ 事件隔离 - 按钮和内容区域不受拖拽影响
 * ✅ 性能优化 - 智能事件处理和渲染优化
 * ✅ 响应式设计 - 支持多断点布局
 * ✅ 版本管理 - 布局状态的保存和恢复
 * ✅ 预设模板 - 常用布局的快速应用
 */

// === 核心组件 ===
export { DraggableGridLayout } from './components/DraggableGridLayout';
export { DraggableHeaderPanel } from './components/DraggableHeaderPanel';
export { GridLayoutToolbar } from './components/GridLayoutToolbar';

// === 拖拽优化工具 ===
export { DragBehaviorOptimizer } from './utils/DragBehaviorOptimizer';
export { createDragConfig } from './utils/dragConfigFactory';

// === React Hooks ===
export { useDraggableGrid } from './hooks/useDraggableGrid';
export { useGridPerformance } from './hooks/useGridPerformance';
export { useLayoutPersistence } from './hooks/useLayoutPersistence';

// === 类型定义 ===
export type {
  DraggableGridProps,
  GridPanel,
  GridLayoutConfig,
  DragConfig,
  LayoutTemplate,
  PerformanceOptions
} from './types';

// === 预设模板 ===
export { layoutTemplates } from './templates';

// === 工具函数 ===
export {
  createPanel,
  createLayout,
  validateLayout,
  optimizeLayout
} from './utils';

// === 默认配置 ===
export const defaultDragConfig = {
  // 标题栏拖拽配置
  headerDrag: {
    draggableSelector: '.draggable-header, .ant-card-head-title',
    noDragSelectors: [
      '.ant-btn',
      '.ant-input',
      '.ant-select',
      '.ant-dropdown',
      '.panel-content',
      '.panel-actions',
      '[data-no-drag]'
    ] as const,
    dragThreshold: 3,
    enableVisualFeedback: true
  },
  
  // 性能配置
  performance: {
    enableRAFThrottle: true,
    enableEventDebounce: true,
    maxPanels: 20,
    autoCleanup: true
  },
  
  // 响应式断点
  breakpoints: {
    xxl: 1600,
    xl: 1200,
    lg: 992,
    md: 768,
    sm: 576,
    xs: 0
  }
};