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
    let relationCount = 0;
    
    // 按面积从小到大排序，优先处理小元素（它们更可能是子元素）
    const sortedElements = [...elements].sort((a, b) => {
      const areaA = this.getElementArea(a);
      const areaB = this.getElementArea(b);
      return areaA - areaB;
    });

    console.log('🔍 开始建立父子关系，排序后的元素:', sortedElements.length);
    
    // 通过边界包含关系推断父子关系
    sortedElements.forEach((element, index) => {
      const currentNode = nodeMap.get(element.id);
      if (!currentNode) return;

      // 查找可能的父元素（完全包含当前元素的元素）
      const potentialParents = elements.filter(other => {
        if (other.id === element.id) return false;
        
        // 必须完全包含当前元素
        if (!this.isElementContained(element, other)) return false;
        
        // 父元素面积必须大于子元素
        const parentArea = this.getElementArea(other);
        const childArea = this.getElementArea(element);
        
        // 面积差异不能太小（避免边界重叠的误判）
        const areaRatio = childArea / parentArea;
        return areaRatio < 0.95; // 子元素面积不应超过父元素的95%
      });

      // 特殊调试：如果是element_17，记录详细信息
      if (element.id === 'element_17') {
        console.log('🎯 调试element_17:', {
          elementBounds: element.bounds,
          elementArea: this.getElementArea(element),
          potentialParentsCount: potentialParents.length,
          potentialParents: potentialParents.map(p => ({
            id: p.id,
            bounds: p.bounds,
            area: this.getElementArea(p)
          }))
        });
      }

      if (potentialParents.length > 0) {
        // 选择面积最小的作为直接父元素（最近的父容器）
        const directParent = potentialParents.reduce((smallest, current) => {
          const smallestArea = this.getElementArea(smallest);
          const currentArea = this.getElementArea(current);
          return currentArea < smallestArea ? current : smallest;
        });

        const parentNode = nodeMap.get(directParent.id);
        if (parentNode && !currentNode.parent) { // 确保没有重复设置父节点
          currentNode.parent = parentNode;
          parentNode.children.push(currentNode);
          parentNode.isLeaf = false;
          relationCount++;

          // 特殊调试：如果父节点是element_17，记录子节点信息
          if (directParent.id === 'element_17') {
            console.log('🧩 element_17获得子节点:', {
              childId: element.id,
              childBounds: element.bounds,
              childText: element.text,
              childType: element.element_type,
              totalChildren: parentNode.children.length
            });
          }
        }
      }
    });
    
    // 检查element_17的最终状态
    const element17Node = nodeMap.get('element_17');
    if (element17Node) {
      console.log('📊 element_17最终状态:', {
        id: 'element_17',
        childrenCount: element17Node.children.length,
        children: element17Node.children.map(c => ({
          id: c.element.id,
          text: c.element.text,
          type: c.element.element_type
        })),
        isLeaf: element17Node.isLeaf
      });
    }
    
    console.log('🔗 父子关系建立完成:', {
      建立的关系数: relationCount,
      总元素数: elements.length,
      无父节点的元素数: Array.from(nodeMap.values()).filter(n => !n.parent).length
    });
  }

  /**
   * 检查元素A是否被元素B包含
   */
  private static isElementContained(elementA: UIElement, elementB: UIElement): boolean {
    // 基本包含检查
    const basicContained = (
      elementB.bounds.left <= elementA.bounds.left &&
      elementB.bounds.top <= elementA.bounds.top &&
      elementB.bounds.right >= elementA.bounds.right &&
      elementB.bounds.bottom >= elementA.bounds.bottom
    );

    if (basicContained) return true;

    // 容错检查：允许小幅边界误差（1-2像素）
    const tolerance = 2;
    const tolerantContained = (
      elementB.bounds.left <= elementA.bounds.left + tolerance &&
      elementB.bounds.top <= elementA.bounds.top + tolerance &&
      elementB.bounds.right >= elementA.bounds.right - tolerance &&
      elementB.bounds.bottom >= elementA.bounds.bottom - tolerance
    );

    // 同时检查面积关系，确保B确实比A大
    if (tolerantContained) {
      const areaA = this.getElementArea(elementA);
      const areaB = this.getElementArea(elementB);
      return areaB > areaA;
    }

    return false;
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
      console.warn('⚠️ 未找到无父节点的根节点，使用备选策略');
      
      // 备选策略：重新构建层次关系
      const allNodes = Array.from(nodeMap.values());
      if (allNodes.length === 0) {
        throw new Error('无法找到根节点: 没有可用元素');
      }
      
      // 1. 重置所有关系
      allNodes.forEach(node => {
        node.parent = null;
        node.children = [];
        node.isLeaf = true;
      });
      
      // 2. 重新建立更精确的层次关系
      this.rebuildHierarchyRelations(allNodes);
      
      // 3. 再次查找根节点
      const newRootCandidates = allNodes.filter(node => !node.parent);
      
      if (newRootCandidates.length === 0) {
        // 如果仍然没有根节点，选择面积最大的作为根节点
        const rootNode = allNodes.reduce((largest, current) => {
          const largestArea = this.getElementArea(largest.element);
          const currentArea = this.getElementArea(current.element);
          return currentArea > largestArea ? current : largest;
        });
        
        console.log('✅ 使用面积最大元素作为根节点:', rootNode.element.id);
        return rootNode;
      }
      
      // 选择面积最大的根节点
      const rootNode = newRootCandidates.reduce((largest, current) => {
        const largestArea = this.getElementArea(largest.element);
        const currentArea = this.getElementArea(current.element);
        return currentArea > largestArea ? current : largest;
      });
      
      console.log('✅ 重建后找到根节点:', rootNode.element.id);
      return rootNode;
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
   * 重新构建层次关系（更精确的算法）
   */
  private static rebuildHierarchyRelations(nodes: ElementHierarchyNode[]): void {
    console.log('� 开始重新构建层次关系');
    
    // 按面积排序，从小到大
    const sortedNodes = [...nodes].sort((a, b) => {
      const areaA = this.getElementArea(a.element);
      const areaB = this.getElementArea(b.element);
      return areaA - areaB;
    });

    // 为每个节点找到最合适的父节点
    sortedNodes.forEach(node => {
      const potentialParents = sortedNodes.filter(other => {
        if (other === node) return false;
        // 只有面积更大的元素才能作为父元素
        if (this.getElementArea(other.element) <= this.getElementArea(node.element)) return false;
        // 必须完全包含当前元素
        return this.isElementContained(node.element, other.element);
      });

      if (potentialParents.length > 0) {
        // 选择面积最小的包含元素作为直接父元素
        const directParent = potentialParents.reduce((smallest, current) => {
          const smallestArea = this.getElementArea(smallest.element);
          const currentArea = this.getElementArea(current.element);
          return currentArea < smallestArea ? current : smallest;
        });

        // 建立父子关系
        node.parent = directParent;
        directParent.children.push(node);
        directParent.isLeaf = false;
      }
    });

    const rootCount = nodes.filter(n => !n.parent).length;
    const maxDepth = this.calculateMaxDepth(nodes);
    
    console.log('🔧 层次关系重建完成:', {
      根节点数: rootCount,
      最大深度: maxDepth,
      总节点数: nodes.length
    });
  }

  /**
   * 计算最大深度（用于调试）
   */
  private static calculateMaxDepth(nodes: ElementHierarchyNode[]): number {
    let maxDepth = 0;
    
    const calculateDepth = (node: ElementHierarchyNode, currentDepth: number = 0): number => {
      let depth = currentDepth;
      node.children.forEach(child => {
        depth = Math.max(depth, calculateDepth(child, currentDepth + 1));
      });
      return depth;
    };

    nodes.filter(n => !n.parent).forEach(rootNode => {
      maxDepth = Math.max(maxDepth, calculateDepth(rootNode));
    });

    return maxDepth;
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