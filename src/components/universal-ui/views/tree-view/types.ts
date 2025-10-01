/**
 * UIElementTree 类型定义
 */

import type { DataNode } from 'antd/es/tree';

// 简化的UIElement接口定义
export interface UIElement {
  id: string;
  element_type: string;
  text: string;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  xpath: string;
  resource_id?: string;
  class_name?: string;
  is_clickable: boolean;
  is_scrollable: boolean;
  is_enabled: boolean;
  is_focused: boolean;
  checkable: boolean;
  checked: boolean;
  selected: boolean;
  password: boolean;
  content_desc?: string;
}

export interface UITreeNode extends DataNode {
  element: UIElement;
  children?: UITreeNode[];
}

export interface UIElementTreeProps {
  elements: UIElement[];
  selectedElements?: UIElement[];
  onElementSelect: (elements: UIElement[]) => void;
  showOnlyClickable?: boolean;
  maxDisplayElements?: number; // 最大显示元素数量，用于性能控制
}

// 过滤选项接口
export interface FilterOptions {
  showHighQualityOnly: boolean;
  showInteractableOnly: boolean;
  showWithTextOnly: boolean;
  showWithIdOnly: boolean;
  hideSmallElements: boolean;
}

// 过滤选项常量
export const FILTER_OPTIONS = {
  all: {
    showHighQualityOnly: false,
    showInteractableOnly: false,
    showWithTextOnly: false,
    showWithIdOnly: false,
    hideSmallElements: false,
  },
  highQuality: {
    showHighQualityOnly: true,
    showInteractableOnly: false,
    showWithTextOnly: false,
    showWithIdOnly: false,
    hideSmallElements: true,
  },
  interactable: {
    showHighQualityOnly: false,
    showInteractableOnly: true,
    showWithTextOnly: false,
    showWithIdOnly: false,
    hideSmallElements: false,
  },
  withText: {
    showHighQualityOnly: false,
    showInteractableOnly: false,
    showWithTextOnly: true,
    showWithIdOnly: false,
    hideSmallElements: false,
  },
  withId: {
    showHighQualityOnly: false,
    showInteractableOnly: false,
    showWithTextOnly: false,
    showWithIdOnly: true,
    hideSmallElements: false,
  }
} as const;

export type FilterType = keyof typeof FILTER_OPTIONS;

// 质量评估阈值
export const QUALITY_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40
} as const;

export interface ElementWithHierarchy extends UIElement {
  depth: number;
  parentId?: string;
  originalIndex: number;
}