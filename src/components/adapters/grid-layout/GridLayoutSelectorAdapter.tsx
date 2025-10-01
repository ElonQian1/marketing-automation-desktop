/**
 * 网格布局选择器适配器 - Employee D 架构
 * 
 * 目的：为网格布局系统提供语义化选择器，替换.ant-*直接选择器
 * 原则：零覆盖、适配器统一、Employee D "单任务单文件"
 */

import React from 'react';

/**
 * 网格布局选择器配置
 */
export interface GridLayoutSelectorConfig {
  /** 排除的布局区域选择器 */
  excludeSelectors?: string[];
  /** 拖拽句柄选择器 */
  draggableHandles?: string[];
  /** 自定义布局控制选择器 */
  customControlSelectors?: string[];
}

/**
 * 默认网格布局选择器配置
 */
const DEFAULT_GRID_CONFIG: GridLayoutSelectorConfig = {
  excludeSelectors: [
    '[data-layout-exclude="header"]',  // 替换布局头部区域
    '[data-layout-exclude="controls"]' // 替换布局控制区域
  ],
  draggableHandles: [
    '[data-draggable="panel-header"]',  // 替换面板头部拖拽
    '[data-draggable="card-title"]'     // 替换卡片标题拖拽
  ],
  customControlSelectors: []
};

/**
 * 构建视口高度计算的排除选择器
 */
export function buildViewportExcludeSelectors(config: GridLayoutSelectorConfig = {}): string[] {
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  return [
    ...finalConfig.excludeSelectors || [],
    ...finalConfig.customControlSelectors || []
  ];
}

/**
 * 构建拖拽句柄选择器字符串
 */
export function buildDraggableHandleSelector(config: GridLayoutSelectorConfig = {}): string {
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  return [
    ...finalConfig.draggableHandles || [],
    ...finalConfig.customControlSelectors || []
  ].join(', ');
}

/**
 * 网格布局选择器适配器工具
 */
export interface GridLayoutSelectorUtils {
  /** 视口排除选择器列表 */
  viewportExcludeSelectors: string[];
  /** 拖拽句柄选择器字符串 */
  draggableHandleSelector: string;
  /** 检查元素是否为拖拽句柄 */
  isDraggableHandle: (element: HTMLElement | null) => boolean;
}

/**
 * 创建网格布局选择器工具
 */
export function createGridLayoutSelectorUtils(
  config: GridLayoutSelectorConfig = {}
): GridLayoutSelectorUtils {
  const viewportExcludeSelectors = buildViewportExcludeSelectors(config);
  const draggableHandleSelector = buildDraggableHandleSelector(config);

  return {
    viewportExcludeSelectors,
    draggableHandleSelector,
    isDraggableHandle: (element: HTMLElement | null) => {
      if (!element || !draggableHandleSelector) return false;
      return element.closest(draggableHandleSelector) !== null;
    }
  };
}

/**
 * React Hook：网格布局选择器
 */
export function useGridLayoutSelector(config?: GridLayoutSelectorConfig) {
  return React.useMemo(() => 
    createGridLayoutSelectorUtils(config), 
    [config]
  );
}

export default createGridLayoutSelectorUtils;