// src/modules/contact-import/ui/components/grid-layout/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 原始组件导出
export { GridLayoutWrapper } from './GridLayoutWrapper';
export { ResizablePanel } from './ResizablePanel';
export { useGridLayout } from './useGridLayout';

// 增强组件导出
export { GridLayoutWrapper as GridLayoutWrapperEnhanced } from './GridLayoutWrapperEnhanced';

// 版本管理
export { useLayoutVersions } from './hooks/useLayoutVersions';
export { LayoutVersionManager } from './components/LayoutVersionManager';

// 性能优化
export { useLayoutPerformance } from './hooks/useLayoutPerformance';

// 工具栏
export { LayoutControlToolbar } from './components/LayoutControlToolbar';

// 原始类型定义
export type {
  PanelConfig,
  GridLayoutWrapperProps,
} from './GridLayoutWrapper';

export type {
  ResizablePanelProps,
} from './ResizablePanel';

export type {
  LayoutConfig,
  UseGridLayoutOptions,
} from './useGridLayout';

// 增强功能类型定义
export type { LayoutVersion, UseLayoutVersionsOptions } from './hooks/useLayoutVersions';
export type { PerformanceMetrics, UseLayoutPerformanceOptions } from './hooks/useLayoutPerformance';

// 工具函数
export const createDefaultPanels = (configs: Array<{
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content?: React.ReactNode;
}>) => {
  return configs.map(config => ({
    i: config.id,
    title: config.title,
    x: config.x,
    y: config.y,
    w: config.w,
    h: config.h,
    visible: true,
    content: config.content || null,
    isDraggable: true,
    isResizable: true,
  }));
};

// 预设布局模板
export const layoutTemplates = {
  // 工作台布局：左侧设备，右侧分为上下两个面板
  workbench: createDefaultPanels([
    { id: 'devices', title: '设备管理', x: 0, y: 0, w: 4, h: 12 },
    { id: 'tools', title: '工具面板', x: 4, y: 0, w: 8, h: 6 },
    { id: 'data', title: '数据面板', x: 4, y: 6, w: 8, h: 6 },
  ]),
  
  // 监控布局：四个相等的象限
  monitoring: createDefaultPanels([
    { id: 'status', title: '状态监控', x: 0, y: 0, w: 6, h: 6 },
    { id: 'metrics', title: '性能指标', x: 6, y: 0, w: 6, h: 6 },
    { id: 'logs', title: '日志记录', x: 0, y: 6, w: 6, h: 6 },
    { id: 'alerts', title: '告警信息', x: 6, y: 6, w: 6, h: 6 },
  ]),
  
  // 简单布局：上下两个面板
  simple: createDefaultPanels([
    { id: 'main', title: '主面板', x: 0, y: 0, w: 12, h: 8 },
    { id: 'secondary', title: '辅助面板', x: 0, y: 8, w: 12, h: 4 },
  ]),
  
  // 侧边栏布局：左侧窄面板，右侧主面板
  sidebar: createDefaultPanels([
    { id: 'sidebar', title: '侧边栏', x: 0, y: 0, w: 3, h: 12 },
    { id: 'main', title: '主内容', x: 3, y: 0, w: 9, h: 12 },
  ]),
};