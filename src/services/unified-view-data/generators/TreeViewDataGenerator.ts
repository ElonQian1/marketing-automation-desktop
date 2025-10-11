// src/services/unified-view-data/generators/TreeViewDataGenerator.ts
// module: shared | layer: unknown | role: component
// summary: TreeViewDataGenerator.ts 文件

/**
 * 树形视图数据生成器
 * 为树形视图生成层级结构数据
 */

import { EnhancedUIElement, TreeViewData, TreeNode } from '../types';

export class TreeViewDataGenerator {
  /**
   * 生成树形视图数据
   */
  static async generate(elements: EnhancedUIElement[]): Promise<TreeViewData> {
    console.log('🌲 生成树形视图数据...');

    const hierarchyMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];
    let maxDepth = 0;

    // 1. 创建所有节点
    for (const element of elements) {
      const node: TreeNode = {
        id: element.id,
        element,
        children: [],
        depth: element.depth,
      };
      hierarchyMap.set(element.id, node);
      maxDepth = Math.max(maxDepth, element.depth);
    }

    // 2. 建立父子关系
    for (const element of elements) {
      const node = hierarchyMap.get(element.id)!;
      
      // 查找父节点
      const parentElement = this.findParentElement(element, elements);
      if (parentElement) {
        const parent = hierarchyMap.get(parentElement.id);
        if (parent) {
          node.parent = parent;
          parent.children.push(node);
        }
      } else {
        // 没有父节点，是根节点
        rootNodes.push(node);
      }
    }

    // 3. 排序子节点
    this.sortChildrenRecursively(rootNodes);

    return {
      rootNodes,
      maxDepth,
      hierarchyMap,
    };
  }

  /**
   * 查找父元素
   */
  private static findParentElement(
    element: EnhancedUIElement,
    allElements: EnhancedUIElement[]
  ): EnhancedUIElement | null {
    let bestParent: EnhancedUIElement | null = null;
    let smallestArea = Infinity;

    for (const candidate of allElements) {
      if (candidate.id !== element.id && this.isContainedBy(element, candidate)) {
        const area = this.calculateArea(candidate.bounds);
        if (area < smallestArea) {
          bestParent = candidate;
          smallestArea = area;
        }
      }
    }

    return bestParent;
  }

  /**
   * 检查元素是否被包含
   */
  private static isContainedBy(inner: EnhancedUIElement, outer: EnhancedUIElement): boolean {
    const innerBounds = inner.bounds;
    const outerBounds = outer.bounds;

    return (
      innerBounds.left >= outerBounds.left &&
      innerBounds.top >= outerBounds.top &&
      innerBounds.right <= outerBounds.right &&
      innerBounds.bottom <= outerBounds.bottom &&
      !(
        innerBounds.left === outerBounds.left &&
        innerBounds.top === outerBounds.top &&
        innerBounds.right === outerBounds.right &&
        innerBounds.bottom === outerBounds.bottom
      )
    );
  }

  /**
   * 计算区域面积
   */
  private static calculateArea(bounds: any): number {
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }

  /**
   * 递归排序子节点
   */
  private static sortChildrenRecursively(nodes: TreeNode[]): void {
    // 按质量分数和位置排序
    nodes.sort((a, b) => {
      // 首先按质量分数排序
      if (a.element.qualityScore !== b.element.qualityScore) {
        return b.element.qualityScore - a.element.qualityScore;
      }
      
      // 然后按位置排序（从左到右，从上到下）
      if (a.element.bounds.top !== b.element.bounds.top) {
        return a.element.bounds.top - b.element.bounds.top;
      }
      
      return a.element.bounds.left - b.element.bounds.left;
    });

    // 递归排序子节点
    for (const node of nodes) {
      if (node.children.length > 0) {
        this.sortChildrenRecursively(node.children);
      }
    }
  }
}