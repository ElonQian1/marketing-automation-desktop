// src/components/adapters/drag/DragSelectorAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 拖拽选择器适配器 - Employee D 架构
 * 
 * 目的：为拖拽系统提供语义化选择器集合，零覆盖原则
 * 原则：适配器统一、单任务单文件、性能优化
 */

import React from 'react';

/**
 * 拖拽选择器类型枚举
 */
export enum DragSelectorType {
  DRAGGABLE_HANDLES = 'draggable-handles',
  NON_DRAGGABLE = 'non-draggable',
  IGNORE_ELEMENTS = 'ignore-elements',
  TABLE_CONTAINERS = 'table-containers',
  FILE_DROP_ZONES = 'file-drop-zones'
}

/**
 * 语义化选择器映射表
 * 替换所有.ant-*直接选择器为data属性或语义选择器
 */
const SEMANTIC_SELECTOR_MAP: Record<DragSelectorType, string[]> = {
  [DragSelectorType.DRAGGABLE_HANDLES]: [
    '[data-draggable="panel-header"]',  // 替换面板头部拖拽区域
    '[data-draggable="card-head"]',     // 替换卡片头部拖拽
    '[data-draggable="card-title"]'     // 替换卡片标题拖拽
  ],
  [DragSelectorType.NON_DRAGGABLE]: [
    '[data-draggable="false"]',
    '[data-drag-ignore="true"]',
    '[data-antd-component="button"]',   // 替换按钮组件
    '[data-antd-component="input"]',    // 替换输入组件
    '[data-antd-component="select"]',   // 替换选择组件
    '[data-antd-component="dropdown"]'  // 替换下拉菜单组件
  ],
  [DragSelectorType.IGNORE_ELEMENTS]: [
    '[data-antd-component="card-extra"]', // 替换卡片操作区域
    '[data-interaction="true"]',
    'input',
    'button',
    'select',
    'textarea'
  ],
  [DragSelectorType.TABLE_CONTAINERS]: [
    '[data-component="table-container"]', // 替换表格容器
    '[data-antd-component="table-thead"]', // 替换表头区域
    'table',
    '[role="table"]'
  ],
  [DragSelectorType.FILE_DROP_ZONES]: [
    '[data-drag-over="true"]',
    '[data-antd-component="upload-drag"]', // 替换上传拖拽区域
    '[data-drop-zone="true"]'
  ]
};

/**
 * 拖拽选择器配置
 */
export interface DragSelectorConfig {
  includeTypes?: DragSelectorType[];
  customSelectors?: string[];
  excludeSelectors?: string[];
}

/**
 * 默认拖拽选择器配置
 */
const DEFAULT_DRAG_CONFIG: DragSelectorConfig = {
  includeTypes: [
    DragSelectorType.DRAGGABLE_HANDLES,
    DragSelectorType.NON_DRAGGABLE,
    DragSelectorType.IGNORE_ELEMENTS
  ]
};

/**
 * 构建拖拽选择器字符串
 */
export function buildDragSelector(
  type: DragSelectorType,
  config: DragSelectorConfig = {}
): string {
  const finalConfig = { ...DEFAULT_DRAG_CONFIG, ...config };
  const baseSelectors = SEMANTIC_SELECTOR_MAP[type] || [];
  
  let selectors = [...baseSelectors];
  
  // 添加自定义选择器
  if (finalConfig.customSelectors?.length) {
    selectors.push(...finalConfig.customSelectors);
  }
  
  // 排除指定选择器
  if (finalConfig.excludeSelectors?.length) {
    selectors = selectors.filter(selector => 
      !finalConfig.excludeSelectors!.includes(selector)
    );
  }
  
  return selectors.join(', ');
}

/**
 * 拖拽选择器工具集
 */
export interface DragSelectorUtils {
  getDraggableHandles: () => string;
  getNonDraggableElements: () => string;
  getIgnoreElements: () => string;
  getTableContainers: () => string;
  getFileDropZones: () => string;
  isElementDraggable: (element: HTMLElement | null) => boolean;
  isElementIgnored: (element: HTMLElement | null) => boolean;
}

/**
 * 创建拖拽选择器工具集
 */
export function createDragSelectorUtils(
  config: DragSelectorConfig = {}
): DragSelectorUtils {
  return {
    getDraggableHandles: () => buildDragSelector(DragSelectorType.DRAGGABLE_HANDLES, config),
    getNonDraggableElements: () => buildDragSelector(DragSelectorType.NON_DRAGGABLE, config),
    getIgnoreElements: () => buildDragSelector(DragSelectorType.IGNORE_ELEMENTS, config),
    getTableContainers: () => buildDragSelector(DragSelectorType.TABLE_CONTAINERS, config),
    getFileDropZones: () => buildDragSelector(DragSelectorType.FILE_DROP_ZONES, config),
    
    isElementDraggable: (element: HTMLElement | null) => {
      if (!element) return false;
      const draggableSelector = buildDragSelector(DragSelectorType.DRAGGABLE_HANDLES, config);
      return element.closest(draggableSelector) !== null;
    },
    
    isElementIgnored: (element: HTMLElement | null) => {
      if (!element) return false;
      const ignoreSelector = buildDragSelector(DragSelectorType.IGNORE_ELEMENTS, config);
      return element.closest(ignoreSelector) !== null;
    }
  };
}

/**
 * React Hook：拖拽选择器
 */
export function useDragSelector(config?: DragSelectorConfig) {
  return React.useMemo(() => 
    createDragSelectorUtils(config), 
    [config]
  );
}

export default createDragSelectorUtils;