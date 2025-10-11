// src/types/hierarchy.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

/**
 * 层级节点统一类型定义
 * 
 * 本文件作为项目中所有层级节点类型的唯一定义源
 * 消除 HierarchyNode、ElementHierarchyNode 等重复定义
 */

import type { UIElement } from '../api/universal-ui';

/**
 * 层级节点核心接口
 * 统一所有层级相关功能的基础类型
 */
export interface HierarchyNode {
  /** 节点唯一标识符 */
  id: string;
  
  /** 关联的UI元素 */
  element: UIElement;
  
  /** 子节点列表 */
  children: HierarchyNode[];
  
  /** 父节点引用 */
  parent: HierarchyNode | null;
  
  /** 层级深度 */
  level: number;
  
  /** 到根节点的路径 */
  path: string;
  
  /** 是否可点击 */
  isClickable: boolean;
  
  /** 是否包含文本 */
  hasText: boolean;
  
  /** 是否为隐藏元素 */
  isHidden: boolean;
  
  /** 节点关系类型 */
  relationship: 'self' | 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant';
  
  /** 可选的扩展深度（用于兼容） */
  depth?: number;
  
  /** 可选的路径数组（用于兼容） */
  pathArray?: string[];
  
  /** 节点关系类型（用于兼容） */
  relationType?: 'container' | 'component' | 'content' | 'navigation';
}

/**
 * 树数据结构（用于 Ant Design Tree 组件）
 */
export interface TreeNodeData {
  key: string;
  title: string;
  children?: TreeNodeData[];
  isLeaf?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  selectable?: boolean;
  checkable?: boolean;
  disableCheckbox?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 层级统计信息
 */
export interface HierarchyStatistics {
  /** 总节点数 */
  totalNodes: number;
  
  /** 最大深度 */
  maxDepth: number;
  
  /** 叶子节点数 */
  leafNodes: number;
  
  /** 容器节点数 */
  containerNodes: number;
  
  /** 可点击节点数 */
  clickableNodes: number;
  
  /** 文本节点数 */
  textNodes: number;
  
  /** 隐藏节点数 */
  hiddenNodes: number;
  
  /** 平均子节点数 */
  averageChildren: number;
}

/**
 * 层级验证结果
 */
export interface HierarchyValidation {
  /** 是否有效 */
  isValid: boolean;
  
  /** 验证错误信息 */
  errors: string[];
  
  /** 验证警告信息 */
  warnings: string[];
  
  /** 孤立节点（无父节点且非根节点） */
  orphanedNodes: string[];
  
  /** 循环引用节点 */
  circularReferences: string[];
}

/**
 * 元素关系分析结果
 */
export interface ElementRelationship {
  /** 关系类型 */
  type: 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant';
  
  /** 关联元素ID */
  elementId: string;
  
  /** 关系强度 (0-1) */
  strength: number;
  
  /** 关系依据 */
  basis: 'containment' | 'proximity' | 'semantic' | 'layout';
  
  /** 额外信息 */
  metadata?: Record<string, any>;
}

/**
 * 层级构建选项
 */
export interface HierarchyBuildOptions {
  /** 是否包含隐藏元素 */
  includeHidden?: boolean;
  
  /** 是否包含零边界元素 */
  includeZeroBounds?: boolean;
  
  /** 最大深度限制 */
  maxDepth?: number;
  
  /** 目标元素ID（构建时的焦点） */
  targetElementId?: string;
  
  /** 根节点选择策略 */
  rootSelectionStrategy?: 'smart' | 'target' | 'top-level' | 'container';
  
  /** 是否计算节点关系 */
  calculateRelationships?: boolean;
  
  /** 是否验证层级结构 */
  validateStructure?: boolean;
}

/**
 * 层级节点过滤条件
 */
export interface HierarchyFilter {
  /** 元素类型过滤 */
  elementTypes?: string[];
  
  /** 是否包含可点击元素 */
  clickableOnly?: boolean;
  
  /** 是否包含文本元素 */
  textOnly?: boolean;
  
  /** 最小深度 */
  minDepth?: number;
  
  /** 最大深度 */
  maxDepth?: number;
  
  /** 资源ID模式匹配 */
  resourceIdPattern?: string;
  
  /** 文本内容模式匹配 */
  textPattern?: string;
  
  /** 自定义过滤函数 */
  customFilter?: (node: HierarchyNode) => boolean;
}

/**
 * 层级搜索结果
 */
export interface HierarchySearchResult {
  /** 匹配的节点 */
  node: HierarchyNode;
  
  /** 匹配分数 (0-1) */
  score: number;
  
  /** 匹配字段 */
  matchedFields: string[];
  
  /** 到根节点的路径 */
  path: HierarchyNode[];
}

// 兼容性别名（逐步废弃）
/** @deprecated 使用 HierarchyNode 代替 */
export type ElementHierarchyNode = HierarchyNode;

/** @deprecated 使用 HierarchyStatistics 代替 */
export type TreeStatistics = HierarchyStatistics;

/** @deprecated 使用 HierarchyValidation 代替 */
export type TreeValidation = HierarchyValidation;