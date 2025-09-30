/**
 * 元素层次分析器
 * 负责从UIElement列表中构建层次树结构
 */

import type { UIElement } from '../../../../api/universalUIAPI';
import type { 
  ElementHierarchyNode, 
  HierarchyAnalysisResult 
} from './types';

export class ElementHierarchyAnalyzer {

  /**
   * 分析元素列表，构建层次树
   * @param elements UI元素列表
   * @returns 层次分析结果
   */
  static analyzeHierarchy(elements: UIElement[]): HierarchyAnalysisResult {
    console.log('🔍 开始分析元素层次结构，元素数量:', elements.length);
    
    // 1. 创建节点映射
    const nodeMap = new Map<string, ElementHierarchyNode>();
    
    // 2. 为每个元素创建节点
    elements.forEach(element => {
      const node: ElementHierarchyNode = {
        element,
        parent: null,
        children: [],
        indexInParent: 0,
        depth: 0,
        isLeaf: true
      };
      nodeMap.set(element.id, node);
    });

    // 3. 建立父子关系
    this.buildParentChildRelations(nodeMap, elements);

    // 4. 查找根节点
    const rootNode = this.findRootNode(nodeMap);
    
    // 5. 计算深度和索引
    this.calculateDepthAndIndex(rootNode);

    // 6. 收集叶子节点
    const leafNodes = this.collectLeafNodes(rootNode);

    // 7. 计算最大深度
    const maxDepth = Math.max(...Array.from(nodeMap.values()).map(n => n.depth));

    console.log('✅ 层次分析完成:', {
      总节点数: nodeMap.size,
      叶子节点数: leafNodes.length,
      最大深度: maxDepth
    });

    return {
      root: rootNode,
      nodeMap,
      leafNodes,
      maxDepth
    };
  }

  /**
   * 建立父子关系
   */
  private static buildParentChildRelations(
    nodeMap: Map<string, ElementHierarchyNode>,
    elements: UIElement[]
  ): void {
    // 通过边界包含关系推断父子关系
    elements.forEach(element => {
      const currentNode = nodeMap.get(element.id);
      if (!currentNode) return;

      // 查找可能的父元素（完全包含当前元素的最小元素）
      const potentialParents = elements.filter(other => 
        other.id !== element.id && this.isElementContained(element, other)
      );

      if (potentialParents.length > 0) {
        // 选择面积最小的作为直接父元素
        const directParent = potentialParents.reduce((smallest, current) => {
          const smallestArea = this.getElementArea(smallest);
          const currentArea = this.getElementArea(current);
          return currentArea < smallestArea ? current : smallest;
        });

        const parentNode = nodeMap.get(directParent.id);
        if (parentNode) {
          currentNode.parent = parentNode;
          parentNode.children.push(currentNode);
          parentNode.isLeaf = false;
        }
      }
    });
  }

  /**
   * 检查元素A是否被元素B包含
   */
  private static isElementContained(elementA: UIElement, elementB: UIElement): boolean {
    return (
      elementB.bounds.left <= elementA.bounds.left &&
      elementB.bounds.top <= elementA.bounds.top &&
      elementB.bounds.right >= elementA.bounds.right &&
      elementB.bounds.bottom >= elementA.bounds.bottom
    );
  }

  /**
   * 计算元素面积
   */
  private static getElementArea(element: UIElement): number {
    const width = element.bounds.right - element.bounds.left;
    const height = element.bounds.bottom - element.bounds.top;
    return width * height;
  }

  /**
   * 查找根节点
   */
  private static findRootNode(nodeMap: Map<string, ElementHierarchyNode>): ElementHierarchyNode {
    // 寻找没有父节点的节点作为根节点
    const rootCandidates = Array.from(nodeMap.values()).filter(node => !node.parent);
    
    if (rootCandidates.length === 0) {
      throw new Error('无法找到根节点');
    }

    // 如果有多个根候选，选择面积最大的
    if (rootCandidates.length > 1) {
      return rootCandidates.reduce((largest, current) => {
        const largestArea = this.getElementArea(largest.element);
        const currentArea = this.getElementArea(current.element);
        return currentArea > largestArea ? current : largest;
      });
    }

    return rootCandidates[0];
  }

  /**
   * 计算深度和在父元素中的索引
   */
  private static calculateDepthAndIndex(node: ElementHierarchyNode, depth = 0): void {
    node.depth = depth;
    
    // 为子元素设置索引并递归计算深度
    node.children.forEach((child, index) => {
      child.indexInParent = index;
      this.calculateDepthAndIndex(child, depth + 1);
    });
  }

  /**
   * 收集所有叶子节点
   */
  private static collectLeafNodes(root: ElementHierarchyNode): ElementHierarchyNode[] {
    const leafNodes: ElementHierarchyNode[] = [];
    
    const traverse = (node: ElementHierarchyNode) => {
      if (node.isLeaf) {
        leafNodes.push(node);
      } else {
        node.children.forEach(traverse);
      }
    };
    
    traverse(root);
    return leafNodes;
  }

  /**
   * 根据元素ID查找节点
   */
  static findNodeById(
    nodeMap: Map<string, ElementHierarchyNode>, 
    elementId: string
  ): ElementHierarchyNode | null {
    return nodeMap.get(elementId) || null;
  }

  /**
   * 获取元素的所有祖先节点
   */
  static getAncestors(node: ElementHierarchyNode): ElementHierarchyNode[] {
    const ancestors: ElementHierarchyNode[] = [];
    let current = node.parent;
    
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    
    return ancestors;
  }

  /**
   * 获取元素的所有后代节点
   */
  static getDescendants(node: ElementHierarchyNode): ElementHierarchyNode[] {
    const descendants: ElementHierarchyNode[] = [];
    
    const traverse = (currentNode: ElementHierarchyNode) => {
      currentNode.children.forEach(child => {
        descendants.push(child);
        traverse(child);
      });
    };
    
    traverse(node);
    return descendants;
  }

  /**
   * 获取兄弟节点
   */
  static getSiblings(node: ElementHierarchyNode): ElementHierarchyNode[] {
    if (!node.parent) return [];
    
    return node.parent.children.filter(sibling => sibling.element.id !== node.element.id);
  }
}