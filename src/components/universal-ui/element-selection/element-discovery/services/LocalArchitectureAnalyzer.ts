/**
 * 局部架构分析器
 * 专门用于元素发现模态框，只分析目标元素周围的相关架构
 * 
 * 核心原则：
 * 1. 以目标元素为中心，分析其父容器、兄弟元素、子元素
 * 2. 只显示2-3层的局部层级结构
 * 3. 过滤掉与目标元素无关的远距离元素
 */

import type { UIElement } from '../../../../../api/universal-ui';
import type { HierarchyNode } from '../../../../../types/hierarchy';

export interface LocalArchitectureResult {
  targetNode: HierarchyNode | null;
  localRoot: HierarchyNode | null;
  siblingNodes: HierarchyNode[];
  maxDepth: number;
  stats: {
    totalNodes: number;
    targetDepth: number;
    siblingCount: number;
    childrenCount: number;
  };
}

/**
 * 局部架构分析器
 * 专注于目标元素周围的局部结构分析
 */
export class LocalArchitectureAnalyzer {
  
  /**
   * 构建目标元素的局部架构
   */
  static buildLocalArchitecture(
    xmlContent: string, 
    elements: UIElement[], 
    targetElement: UIElement
  ): LocalArchitectureResult {
    console.log('🎯 [局部架构] 开始分析目标元素周围的架构:', {
      targetId: targetElement.id,
      targetType: targetElement.element_type,
      targetBounds: `[${targetElement.bounds.left},${targetElement.bounds.top}][${targetElement.bounds.right},${targetElement.bounds.bottom}]`,
      totalElements: elements.length
    });

    // 1. 解析XML获取DOM树结构
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    if (xmlDoc.querySelector('parsererror')) {
      console.error('❌ XML解析失败');
      return this.buildFallbackLocalArchitecture(elements, targetElement);
    }

    // 2. 找到目标元素对应的XML节点
    const targetXmlNode = this.findXmlNodeByElement(xmlDoc, targetElement);
    if (!targetXmlNode) {
      console.warn('⚠️ 未找到目标元素对应的XML节点');
      return this.buildFallbackLocalArchitecture(elements, targetElement);
    }

    // 3. 确定局部架构的根节点
    const localRootXmlNode = this.findLocalRoot(targetXmlNode);
    
    // 4. 筛选局部相关元素
    const localElements = this.filterLocalElements(elements, localRootXmlNode, xmlDoc);
    
    // 5. 构建节点映射
    const nodeMap = new Map<string, HierarchyNode>();
    localElements.forEach(element => {
      const node: HierarchyNode = {
        id: element.id,
        element,
        parent: null,
        children: [],
        level: 0,
        path: '',
        isClickable: element.is_clickable || false,
        hasText: Boolean(element.text && element.text.trim()),
        isHidden: this.isHiddenElement(element),
        relationship: element.id === targetElement.id ? 'self' : 'sibling',
        depth: 0,
        pathArray: []
      };
      nodeMap.set(element.id, node);
    });

    // 6. 构建层级关系
    const localRoot = this.buildLocalHierarchy(localRootXmlNode, nodeMap, localElements);
    
    // 7. 设置关系和层级
    const targetNode = nodeMap.get(targetElement.id) || null;
    const siblingNodes = targetNode?.parent?.children.filter(child => child.id !== targetElement.id) || [];

    if (targetNode && localRoot) {
      this.setRelationships(localRoot, targetNode);
      this.calculateLevels(localRoot, 0);
    }

    const stats = {
      totalNodes: nodeMap.size,
      targetDepth: targetNode?.level || 0,
      siblingCount: siblingNodes.length,
      childrenCount: targetNode?.children.length || 0
    };

    console.log('✅ [局部架构] 分析完成:', {
      stats,
      localRoot: localRoot?.element.id,
      targetNode: targetNode?.element.id
    });

    return {
      targetNode,
      localRoot,
      siblingNodes,
      maxDepth: this.calculateMaxDepth(localRoot),
      stats
    };
  }

  private static findXmlNodeByElement(xmlDoc: Document, targetElement: UIElement): Element | null {
    const allNodes = xmlDoc.querySelectorAll('node');
    
    for (const xmlNode of allNodes) {
      if (this.isMatchingXmlNode(xmlNode, targetElement)) {
        return xmlNode;
      }
    }
    
    return null;
  }

  private static isMatchingXmlNode(xmlNode: Element, element: UIElement): boolean {
    const xmlBounds = xmlNode.getAttribute('bounds');
    const xmlClass = xmlNode.getAttribute('class');
    const elementBounds = `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`;
    
    return xmlBounds === elementBounds && xmlClass === element.element_type;
  }

  private static findLocalRoot(targetXmlNode: Element): Element {
    let currentNode = targetXmlNode;
    let parentLevels = 0;
    let bestCandidate = targetXmlNode;
    
    while (currentNode.parentElement && parentLevels < 4) {
      const parent = currentNode.parentElement;
      const parentClass = parent.getAttribute('class');
      const parentResourceId = parent.getAttribute('resource-id');
      
      if (parentClass?.includes('LinearLayout') || 
          parentClass?.includes('RelativeLayout') || 
          parentClass?.includes('FrameLayout')) {
        
        const childCount = parent.children.length;
        const hasImportantId = parentResourceId && (
          parentResourceId.includes('navigation') ||
          parentResourceId.includes('bottom') ||
          parentResourceId.includes('button') ||
          parentResourceId.includes('tab')
        );
        
        if (childCount >= 2 && (parentLevels >= 1 || hasImportantId)) {
          bestCandidate = parent;
          if (hasImportantId && childCount >= 2) {
            break;
          }
        }
      }
      
      currentNode = parent;
      parentLevels++;
    }
    
    console.log('🏠 [局部架构] 选择局部根节点:', {
      class: bestCandidate.getAttribute('class'),
      resourceId: bestCandidate.getAttribute('resource-id'),
      childCount: bestCandidate.children.length
    });
    
    return bestCandidate;
  }

  private static filterLocalElements(
    elements: UIElement[], 
    localRootXmlNode: Element, 
    xmlDoc: Document
  ): UIElement[] {
    const localRootElement = elements.find(el => 
      this.isMatchingXmlNode(localRootXmlNode, el)
    );
    
    if (!localRootElement) {
      return elements;
    }
    
    const localXmlNodesSet = new Set<Element>();
    localXmlNodesSet.add(localRootXmlNode);
    
    const addXmlNodesRecursively = (xmlNode: Element, currentDepth: number = 0) => {
      if (currentDepth >= 4) return;
      
      Array.from(xmlNode.children).forEach(childXmlNode => {
        localXmlNodesSet.add(childXmlNode);
        addXmlNodesRecursively(childXmlNode, currentDepth + 1);
      });
    };
    
    addXmlNodesRecursively(localRootXmlNode);
    
    const localElements = elements.filter(element => {
      return Array.from(localXmlNodesSet).some(xmlNode => 
        this.isMatchingXmlNode(xmlNode, element)
      );
    });
    
    const uniqueLocalElements = localElements.filter((element, index, array) => 
      array.findIndex(el => el.id === element.id) === index
    );
    
    console.log('🔍 [局部架构] 筛选结果:', {
      总元素数: elements.length,
      局部元素数: uniqueLocalElements.length,
      文本元素: uniqueLocalElements.filter(el => el.text && el.text.trim()).map(el => el.text)
    });
    
    return uniqueLocalElements;
  }

  private static buildLocalHierarchy(
    localRootXmlNode: Element,
    nodeMap: Map<string, HierarchyNode>,
    localElements: UIElement[]
  ): HierarchyNode | null {
    const processedElementIds = new Set<string>();
    
    const buildRelations = (xmlNode: Element, parentHierarchyNode: HierarchyNode | null = null, depth: number = 0): HierarchyNode | null => {
      if (depth > 4) return null;
      
      const matchingElement = localElements.find(el => this.isMatchingXmlNode(xmlNode, el));
      
      if (matchingElement && !processedElementIds.has(matchingElement.id)) {
        processedElementIds.add(matchingElement.id);
        
        const hierarchyNode = nodeMap.get(matchingElement.id);
        if (hierarchyNode) {
          // 设置父子关系
          if (parentHierarchyNode) {
            hierarchyNode.parent = parentHierarchyNode;
            if (!parentHierarchyNode.children.some(child => child.id === hierarchyNode.id)) {
              parentHierarchyNode.children.push(hierarchyNode);
            }
          }
          
          hierarchyNode.level = depth;
          hierarchyNode.depth = depth;
          hierarchyNode.path = parentHierarchyNode 
            ? `${parentHierarchyNode.path}/${matchingElement.id}`
            : matchingElement.id;
          
          // 递归处理子节点，当前节点作为父节点
          Array.from(xmlNode.children).forEach(xmlChild => {
            buildRelations(xmlChild, hierarchyNode, depth + 1);
          });
          
          return hierarchyNode;
        }
      }
      
      // 如果当前XML节点没有匹配的元素，递归处理子节点但不改变父节点和深度
      // 这是关键修复：保持正确的层级关系
      if (xmlNode.children.length > 0) {
        Array.from(xmlNode.children).forEach(xmlChild => {
          buildRelations(xmlChild, parentHierarchyNode, depth);
        });
      }
      
      return null;
    };
    
    return buildRelations(localRootXmlNode);
  }

  private static setRelationships(root: HierarchyNode, targetNode: HierarchyNode): void {
    const setRelationship = (node: HierarchyNode) => {
      if (node.id === targetNode.id) {
        node.relationship = 'self';
      } else if (node.parent?.id === targetNode.id) {
        // 直接子节点
        node.relationship = 'child';
      } else if (targetNode.parent?.id === node.id) {
        // 直接父节点
        node.relationship = 'parent';
      } else if (node.parent?.id === targetNode.parent?.id && node.parent) {
        // 同级兄弟节点
        node.relationship = 'sibling';
      } else if (this.isAncestor(node, targetNode)) {
        // 祖先节点 (祖父、曾祖父等)
        node.relationship = 'ancestor';
      } else if (this.isDescendant(node, targetNode)) {
        // 后代节点 (孙子、曾孙等)
        node.relationship = 'descendant';
      } else if (node.level > targetNode.level) {
        // 📋 新增：基于层级深度的后代判断
        // 在局部架构中，层级更深的节点（如侄子、表亲的子节点）可以视为某种形式的后代
        node.relationship = 'descendant';
      } else if (node.level < targetNode.level) {
        // 📋 新增：基于层级深度的祖先判断  
        // 层级更浅的节点可能是某种形式的祖先
        node.relationship = 'ancestor';
      } else {
        // 其他关系节点，默认为兄弟关系 (表兄弟、叔侄等，在局部架构中很少见)
        node.relationship = 'sibling';
      }
      
      node.children.forEach(setRelationship);
    };
    
    setRelationship(root);
  }

  private static isAncestor(ancestor: HierarchyNode, descendant: HierarchyNode): boolean {
    let current = descendant.parent;
    while (current) {
      if (current.id === ancestor.id) return true;
      current = current.parent;
    }
    return false;
  }

  private static isDescendant(descendant: HierarchyNode, ancestor: HierarchyNode): boolean {
    // 检查 descendant 是否是 ancestor 的后代节点
    let current = descendant.parent;
    while (current) {
      if (current.id === ancestor.id) return true;
      current = current.parent;
    }
    return false;
  }

  private static calculateLevels(node: HierarchyNode, level: number): void {
    node.level = level;
    node.depth = level;
    node.children.forEach(child => {
      this.calculateLevels(child, level + 1);
    });
  }

  private static calculateMaxDepth(root: HierarchyNode | null): number {
    if (!root) return 0;
    
    let maxDepth = root.level;
    const traverse = (node: HierarchyNode) => {
      maxDepth = Math.max(maxDepth, node.level);
      node.children.forEach(traverse);
    };
    
    traverse(root);
    return maxDepth;
  }

  private static isHiddenElement(element: UIElement): boolean {
    return element.bounds.left === 0 && 
           element.bounds.top === 0 && 
           element.bounds.right === 0 && 
           element.bounds.bottom === 0;
  }

  private static buildFallbackLocalArchitecture(
    elements: UIElement[], 
    targetElement: UIElement
  ): LocalArchitectureResult {
    console.log('🔄 [局部架构] 使用回退方案');
    
    const targetNode: HierarchyNode = {
      id: targetElement.id,
      element: targetElement,
      parent: null,
      children: [],
      level: 0,
      path: targetElement.id,
      isClickable: targetElement.is_clickable || false,
      hasText: Boolean(targetElement.text && targetElement.text.trim()),
      isHidden: this.isHiddenElement(targetElement),
      relationship: 'self',
      depth: 0,
      pathArray: [targetElement.id]
    };
    
    return {
      targetNode,
      localRoot: targetNode,
      siblingNodes: [],
      maxDepth: 0,
      stats: {
        totalNodes: 1,
        targetDepth: 0,
        siblingCount: 0,
        childrenCount: 0
      }
    };
  }
}