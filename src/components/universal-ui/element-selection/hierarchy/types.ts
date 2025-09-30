/**
 * 元素层次分析相关类型定义
 */

import type { UIElement } from '../../../../api/universalUIAPI';

/**
 * 元素层次节点
 */
export interface ElementHierarchyNode {
  /** 当前元素 */
  element: UIElement;
  /** 父元素 */
  parent: ElementHierarchyNode | null;
  /** 子元素列表 */
  children: ElementHierarchyNode[];
  /** 在父元素中的索引 */
  indexInParent: number;
  /** 层级深度 */
  depth: number;
  /** 是否为叶子节点 */
  isLeaf: boolean;
}

/**
 * 层次分析结果
 */
export interface HierarchyAnalysisResult {
  /** 根节点 */
  root: ElementHierarchyNode;
  /** 元素ID到节点的映射 */
  nodeMap: Map<string, ElementHierarchyNode>;
  /** 所有叶子节点 */
  leafNodes: ElementHierarchyNode[];
  /** 树的最大深度 */
  maxDepth: number;
}

/**
 * 替代元素候选项
 */
export interface AlternativeElement {
  /** 元素节点 */
  node: ElementHierarchyNode;
  /** 与原元素的关系 */
  relationship: 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant';
  /** 关系距离（层级差距） */
  distance: number;
  /** 质量评分 */
  qualityScore: number;
  /** 推荐原因 */
  reason: string;
}

/**
 * 元素质量评分标准
 */
export interface ElementQuality {
  /** 文本内容质量 */
  textScore: number;
  /** 唯一性得分 */
  uniquenessScore: number;
  /** 稳定性得分 */
  stabilityScore: number;
  /** 可匹配性得分 */
  matchabilityScore: number;
  /** 总分 */
  totalScore: number;
}

/**
 * 层次遍历选项
 */
export interface TraversalOptions {
  /** 最大遍历深度 */
  maxDepth?: number;
  /** 是否包含兄弟节点 */
  includeSiblings?: boolean;
  /** 过滤条件 */
  filter?: (node: ElementHierarchyNode) => boolean;
  /** 排序方式 */
  sortBy?: 'depth' | 'quality' | 'distance';
}