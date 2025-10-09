/**
 * 统一的元素相关类型定义
 * 
 * @description 替换项目中重复的元素类型定义
 */

import type { ScreenInfo, AppInfo } from './device';

/**
 * 基础元素类型（替换多处 ElementLike 定义）
 */
export interface ElementLike {
  'resource-id'?: string;
  text?: string;
  'content-desc'?: string;
  class?: string;
  package?: string;
  bounds?: string;
  index?: number;
  clickable?: boolean;
  enabled?: boolean;
  focused?: boolean;
  selected?: boolean;
  checkable?: boolean;
  checked?: boolean;
  scrollable?: boolean;
  'long-clickable'?: boolean;
  password?: boolean;
  focusable?: boolean;
}

/**
 * 元素节点（带层级信息）
 */
export interface ElementNode extends ElementLike {
  children?: ElementNode[];
  parent?: ElementNode;
  depth?: number;
  path?: string;
  xpath?: string;
}

/**
 * 元素上下文信息
 */
export interface ElementContext {
  element: ElementLike;
  siblings: ElementLike[];
  parent?: ElementLike;
  children: ElementLike[];
  depth: number;
  path: string;
  xmlContent: string;
  screenInfo?: ScreenInfo;
  appInfo?: AppInfo;
}

/**
 * 元素特征
 */
export interface ElementFeatures {
  hasResourceId: boolean;
  hasText: boolean;
  hasContentDesc: boolean;
  isClickable: boolean;
  isScrollable: boolean;
  hasValidBounds: boolean;
  isLeafNode: boolean;
  uniquenessScore: number;
  stabilityScore: number;
}

/**
 * 元素匹配条件
 */
export interface ElementMatchCriteria {
  'resource-id'?: string | string[];
  text?: string | string[];
  'content-desc'?: string | string[];
  class?: string | string[];
  package?: string | string[];
  bounds?: string;
  index?: number | number[];
  xpath?: string;
  [key: string]: any;
}

/**
 * 元素验证结果
 */
export interface ElementValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  matchedFields: string[];
  element: ElementLike;
}