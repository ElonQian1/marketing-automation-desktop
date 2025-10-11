// src/components/universal-ui/element-selection/element-discovery/services/PureXmlStructureAnalyzer.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 纯XML结构分析器
 * 专门用于元素发现模态框，只基于XML DOM树结构分析，不依赖边界检查
 * 
 * 核心原则：
 * 1. 严格按照XML DOM层级构建父子关系
 * 2. 不过滤任何元素（包括bounds=[0,0][0,0]的隐藏元素）
 * 3. 保持完整的3级层级结构：按钮→文本容器→文本元素
 */

import type { UIElement } from '../../../../../api/universal-ui';
import type { HierarchyNode } from '../../../../../types/hierarchy';

export interface PureXmlHierarchy {
  root: HierarchyNode | null;
  nodeMap: Map<string, HierarchyNode>;
  leafNodes: HierarchyNode[];
  maxDepth: number;
  stats: {
    totalNodes: number;
    hiddenElements: number;
    textElements: number;
    hiddenTextElements: number;
    orphanNodes?: number;
  };
}

/**
 * 纯XML结构分析器
 * 专注于DOM树结构，不进行任何边界过滤
 */
export class PureXmlStructureAnalyzer {
  
  /**
   * 从XML源数据构建完整的层级结构
   * @param xmlContent - 原始XML字符串
   * @param elements - 解析后的元素数组
   */
  static buildHierarchyFromXml(xmlContent: string, elements: UIElement[]): PureXmlHierarchy {
    console.log('🧩 [纯XML] 开始构建层级结构:', {
      xmlLength: xmlContent.length,
      elementsCount: elements.length
    });

    // 1. 解析XML获取DOM树结构
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('❌ XML解析失败:', parseError.textContent);
      return this.buildFallbackHierarchy(elements);
    }

    // 2. 创建节点映射
    const nodeMap = new Map<string, HierarchyNode>();
    let idCounter = 0;

    // 为每个元素创建节点
    elements.forEach(element => {
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
        relationship: 'self',
        depth: 0,
        pathArray: []
      };
      nodeMap.set(element.id, node);
    });

    // 3. 基于XML DOM树构建父子关系
    let root: HierarchyNode | null = null;
    const processedNodes = new Set<string>();

    const buildNodeRelations = (xmlNode: Element, parentHierarchyNode: HierarchyNode | null = null, depth = 0) => {
      // 尝试找到对应的UI元素
      const matchingElement = this.findMatchingElement(xmlNode, elements, processedNodes);
      
      if (matchingElement) {
        const hierarchyNode = nodeMap.get(matchingElement.id);
        if (hierarchyNode && !processedNodes.has(matchingElement.id)) {
          processedNodes.add(matchingElement.id);
          
          // 设置父子关系
          if (parentHierarchyNode) {
            hierarchyNode.parent = parentHierarchyNode;
            parentHierarchyNode.children.push(hierarchyNode);
            hierarchyNode.relationship = 'child';
          } else {
            root = hierarchyNode; // 第一个根节点
            hierarchyNode.relationship = 'self';
          }
          
          // 设置深度和路径
          hierarchyNode.level = depth;
          hierarchyNode.depth = depth;
          hierarchyNode.path = parentHierarchyNode 
            ? `${parentHierarchyNode.path}/${matchingElement.id}`
            : matchingElement.id;
          hierarchyNode.pathArray = parentHierarchyNode 
            ? [...(parentHierarchyNode.pathArray || []), matchingElement.id]
            : [matchingElement.id];

          console.log(`📦 [纯XML] 构建节点关系:`, {
            节点ID: matchingElement.id,
            元素类型: matchingElement.element_type,
            文本内容: matchingElement.text || '无',
            深度: depth,
            父节点: parentHierarchyNode?.element.id || '根节点',
            边界: matchingElement.bounds,
            是否隐藏: this.isHiddenElement(matchingElement)
          });

          // 递归处理子节点
          const xmlChildren = Array.from(xmlNode.children);
          xmlChildren.forEach(xmlChild => {
            buildNodeRelations(xmlChild, hierarchyNode, depth + 1);
          });
        }
      } else {
        // 即使没有找到匹配元素，也要递归处理子节点
        const xmlChildren = Array.from(xmlNode.children);
        xmlChildren.forEach(xmlChild => {
          buildNodeRelations(xmlChild, parentHierarchyNode, depth);
        });
      }
    };

    // 从XML根节点开始构建
    const xmlRoot = xmlDoc.documentElement;
    if (xmlRoot) {
      buildNodeRelations(xmlRoot);
    }

    // 4. 计算统计信息
    const stats = this.calculateStats(elements, nodeMap);
    
    // 5. 处理未关联的孤立节点
    const orphanNodes = this.handleOrphanNodes(elements, nodeMap, processedNodes);
    
    const result: PureXmlHierarchy = {
      root,
      nodeMap,
      leafNodes: Array.from(nodeMap.values()).filter(node => node.children.length === 0),
      maxDepth: Math.max(...Array.from(nodeMap.values()).map(node => node.depth)),
      stats: {
        ...stats,
        orphanNodes: orphanNodes.length
      }
    };

    console.log('✅ [纯XML] 层级结构构建完成:', {
      总节点数: nodeMap.size,
      根节点: root?.element.id || '无',
      最大深度: result.maxDepth,
      叶子节点数: result.leafNodes.length,
      统计信息: result.stats
    });

    return result;
  }

  /**
   * 检查元素是否为隐藏元素
   */
  static isHiddenElement(element: UIElement): boolean {
    return element.bounds.left === 0 && 
           element.bounds.top === 0 && 
           element.bounds.right === 0 && 
           element.bounds.bottom === 0;
  }

  /**
   * 查找XML节点对应的UI元素
   */
  private static findMatchingElement(
    xmlNode: Element, 
    elements: UIElement[], 
    processedNodes: Set<string>
  ): UIElement | null {
    // 获取XML节点属性
    const xmlIndex = xmlNode.getAttribute('index');
    const xmlClass = xmlNode.getAttribute('class');
    const xmlResourceId = xmlNode.getAttribute('resource-id');
    const xmlText = xmlNode.getAttribute('text');
    const xmlBounds = xmlNode.getAttribute('bounds');
    const xmlContentDesc = xmlNode.getAttribute('content-desc');

    // 多重匹配策略：优先精确匹配，然后语义匹配
    const candidates = elements.filter(element => !processedNodes.has(element.id));

    // 策略1: 边界精确匹配（最可靠）
    if (xmlBounds) {
      const exactMatch = candidates.find(element => {
        const elementBounds = `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`;
        return elementBounds === xmlBounds;
      });
      if (exactMatch) {
        console.log(`🎯 [纯XML] 边界精确匹配:`, {
          XML边界: xmlBounds,
          元素ID: exactMatch.id,
          元素类型: exactMatch.element_type
        });
        return exactMatch;
      }
    }

    // 策略2: 语义组合匹配（resource-id + class + text）
    const semanticMatch = candidates.find(element => {
      let score = 0;
      
      // resource-id 匹配（权重最高）
      if (xmlResourceId && element.resource_id === xmlResourceId) score += 10;
      
      // class 匹配
      if (xmlClass && element.element_type === xmlClass) score += 5;
      
      // 文本匹配
      if (xmlText && element.text === xmlText) score += 8;
      
      // content-desc 匹配
      if (xmlContentDesc && element.content_desc === xmlContentDesc) score += 6;
      
      // 需要至少有一个强匹配项
      return score >= 8;
    });

    if (semanticMatch) {
      console.log(`🧠 [纯XML] 语义匹配:`, {
        XML属性: { xmlResourceId, xmlClass, xmlText },
        匹配元素: semanticMatch.id,
        元素属性: {
          resource_id: semanticMatch.resource_id,
          element_type: semanticMatch.element_type,
          text: semanticMatch.text
        }
      });
      return semanticMatch;
    }

    // 策略3: 宽松匹配（仅class + index）
    if (xmlClass && xmlIndex) {
      const relaxedMatch = candidates.find(element => 
        element.element_type === xmlClass
      );
      if (relaxedMatch) {
        console.log(`🔄 [纯XML] 宽松匹配:`, {
          XML: { xmlClass, xmlIndex },
          匹配元素: relaxedMatch.id
        });
        return relaxedMatch;
      }
    }

    console.log(`⚠️ [纯XML] 未找到匹配元素:`, {
      XML属性: { xmlClass, xmlResourceId, xmlText, xmlBounds }
    });
    return null;
  }

  /**
   * 计算层级统计信息
   */
  private static calculateStats(elements: UIElement[], nodeMap: Map<string, HierarchyNode>) {
    const hiddenElements = elements.filter(this.isHiddenElement).length;
    const textElements = elements.filter(e => e.text && e.text.trim().length > 0).length;
    const hiddenTextElements = elements.filter(e => 
      this.isHiddenElement(e) && e.text && e.text.trim().length > 0
    ).length;

    return {
      totalNodes: nodeMap.size,
      hiddenElements,
      textElements,
      hiddenTextElements
    };
  }

  /**
   * 处理未关联的孤立节点
   */
  private static handleOrphanNodes(
    elements: UIElement[], 
    nodeMap: Map<string, HierarchyNode>, 
    processedNodes: Set<string>
  ): HierarchyNode[] {
    const orphanNodes: HierarchyNode[] = [];
    
    elements.forEach(element => {
      if (!processedNodes.has(element.id)) {
        const node = nodeMap.get(element.id);
        if (node) {
          orphanNodes.push(node);
          console.log(`🏝️ [纯XML] 发现孤立节点:`, {
            节点ID: element.id,
            元素类型: element.element_type,
            文本: element.text || '无',
            是否隐藏: this.isHiddenElement(element)
          });
        }
      }
    });

    console.log(`📊 [纯XML] 孤立节点统计: ${orphanNodes.length}/${elements.length}`);
    return orphanNodes;
  }

  /**
   * 降级方案：当XML解析失败时使用基础层级构建
   */
  private static buildFallbackHierarchy(elements: UIElement[]): PureXmlHierarchy {
    console.log('🔄 [纯XML] 使用降级方案构建层级');
    
    const nodeMap = new Map<string, HierarchyNode>();
    
    // 创建扁平结构
    elements.forEach(element => {
      const node: HierarchyNode = {
        id: element.id,
        element,
        parent: null,
        children: [],
        level: 0,
        path: element.id,
        isClickable: element.is_clickable || false,
        hasText: Boolean(element.text && element.text.trim()),
        isHidden: this.isHiddenElement(element),
        relationship: 'self',
        depth: 0,
        pathArray: [element.id]
      };
      nodeMap.set(element.id, node);
    });

    const stats = this.calculateStats(elements, nodeMap);

    return {
      root: nodeMap.values().next().value || null,
      nodeMap,
      leafNodes: Array.from(nodeMap.values()),
      maxDepth: 0,
      stats
    };
  }

  /**
   * 查找指定元素的完整路径
   */
  static findElementPath(elementId: string, hierarchy: PureXmlHierarchy): string[] {
    const node = hierarchy.nodeMap.get(elementId);
    if (!node) return [];

    const path: string[] = [];
    let currentNode: HierarchyNode | null = node;

    while (currentNode) {
      path.unshift(currentNode.id);
      currentNode = currentNode.parent;
    }

    return path;
  }

  /**
   * 获取指定深度的所有节点
   */
  static getNodesAtDepth(hierarchy: PureXmlHierarchy, depth: number): HierarchyNode[] {
    return Array.from(hierarchy.nodeMap.values()).filter(node => node.depth === depth);
  }

  /**
   * 验证层级结构的完整性
   */
  static validateHierarchy(hierarchy: PureXmlHierarchy): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查循环引用
    for (const node of hierarchy.nodeMap.values()) {
      const visited = new Set<string>();
      let current: HierarchyNode | null = node;
      
      while (current) {
        if (visited.has(current.id)) {
          issues.push(`检测到循环引用: ${current.id}`);
          break;
        }
        visited.add(current.id);
        current = current.parent;
      }
    }

    // 检查孤立节点
    const nodesWithoutParent = Array.from(hierarchy.nodeMap.values()).filter(
      node => !node.parent && node !== hierarchy.root
    );
    
    if (nodesWithoutParent.length > 0) {
      issues.push(`发现 ${nodesWithoutParent.length} 个孤立节点`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}