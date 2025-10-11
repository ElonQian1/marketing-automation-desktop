// src/components/universal-ui/views/tree-view/utils/treeBuilder.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UIElementTree 树形结构构建工具
 * 处理树形数据的构建、排序和层级关系
 */

import { ElementWithHierarchy } from '../types';
import { 
  removeCircularReferences, 
  findParentElement, 
  calculateDepth,
  assessElementQuality 
} from './elementUtils';

/**
 * 构建树形结构
 */
export const buildTreeStructure = (elements: ElementWithHierarchy[]): ElementWithHierarchy[] => {
  if (!elements || elements.length === 0) {
    return [];
  }

  console.log('🌲 开始构建树形结构，元素数量:', elements.length);
  
  // 1. 移除循环引用
  const safeElements = removeCircularReferences(elements);
  
  // 2. 添加层级信息
  const elementsWithHierarchy = safeElements.map((element, index) => {
    const parent = findParentElement(element, safeElements);
    const depth = calculateDepth(element, safeElements);
    
    return {
      ...element,
      depth,
      parentId: parent?.id,
      originalIndex: index,
    };
  });

  // 3. 按层级和质量排序
  const sortedElements = sortElementsForTree(elementsWithHierarchy);
  
  console.log('✅ 树形结构构建完成，处理后元素数量:', sortedElements.length);
  return sortedElements;
};

/**
 * 排序元素以优化树形显示
 */
export const sortElementsForTree = (elements: ElementWithHierarchy[]): ElementWithHierarchy[] => {
  return elements.sort((a, b) => {
    // 首先按层级排序（深度较浅的在前）
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    
    // 同层级按质量排序（质量高的在前）
    const qualityA = assessElementQuality(a);
    const qualityB = assessElementQuality(b);
    if (qualityA !== qualityB) {
      return qualityB - qualityA;
    }
    
    // 同质量按原始索引排序（保持稳定性）
    return a.originalIndex - b.originalIndex;
  });
};

/**
 * 获取子元素
 */
export const getChildElements = (
  parentId: string, 
  allElements: ElementWithHierarchy[]
): ElementWithHierarchy[] => {
  return allElements.filter(element => element.parentId === parentId);
};

/**
 * 获取根元素（没有父元素的元素）
 */
export const getRootElements = (elements: ElementWithHierarchy[]): ElementWithHierarchy[] => {
  return elements.filter(element => !element.parentId);
};

/**
 * 计算树的最大深度
 */
export const getMaxDepth = (elements: ElementWithHierarchy[]): number => {
  return elements.reduce((max, element) => Math.max(max, element.depth), 0);
};

/**
 * 获取树形统计信息
 */
export const getTreeStats = (elements: ElementWithHierarchy[]) => {
  const rootElements = getRootElements(elements);
  const maxDepth = getMaxDepth(elements);
  const avgDepth = elements.reduce((sum, el) => sum + el.depth, 0) / elements.length;

  // 按层级分组统计
  const depthDistribution = elements.reduce((acc, element) => {
    acc[element.depth] = (acc[element.depth] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    totalElements: elements.length,
    rootElements: rootElements.length,
    maxDepth,
    avgDepth: Math.round(avgDepth * 100) / 100,
    depthDistribution,
  };
};

/**
 * 扁平化树形结构（用于搜索）
 */
export const flattenTree = (elements: ElementWithHierarchy[]): ElementWithHierarchy[] => {
  const result: ElementWithHierarchy[] = [];
  const visited = new Set<string>();

  const traverse = (element: ElementWithHierarchy) => {
    if (visited.has(element.id)) return;
    
    visited.add(element.id);
    result.push(element);
    
    const children = getChildElements(element.id, elements);
    children.forEach(traverse);
  };

  // 从根元素开始遍历
  const rootElements = getRootElements(elements);
  rootElements.forEach(traverse);

  return result;
};

/**
 * 查找元素的所有祖先
 */
export const getAncestors = (
  element: ElementWithHierarchy, 
  allElements: ElementWithHierarchy[]
): ElementWithHierarchy[] => {
  const ancestors: ElementWithHierarchy[] = [];
  let current = element;

  while (current.parentId) {
    const parent = allElements.find(el => el.id === current.parentId);
    if (!parent) break;
    
    ancestors.unshift(parent); // 祖先排序：最远祖先在前
    current = parent;
  }

  return ancestors;
};

/**
 * 查找元素的所有后代
 */
export const getDescendants = (
  element: ElementWithHierarchy,
  allElements: ElementWithHierarchy[]
): ElementWithHierarchy[] => {
  const descendants: ElementWithHierarchy[] = [];
  const visited = new Set<string>();

  const collectDescendants = (parentId: string) => {
    if (visited.has(parentId)) return;
    visited.add(parentId);

    const children = getChildElements(parentId, allElements);
    children.forEach(child => {
      descendants.push(child);
      collectDescendants(child.id);
    });
  };

  collectDescendants(element.id);
  return descendants;
};