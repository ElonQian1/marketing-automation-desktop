import type { UIElement } from '../../../../../api/universal-ui';
import { XmlStructureParser } from './xmlStructureParser';
import type { HierarchyNode } from '../../../../../types/hierarchy';
import { ElementAnalyzer } from './elementAnalyzer';
import { BoundaryDetector } from '../utils/boundaryDetector';

// 重新导出 HierarchyNode 类型
export type { HierarchyNode };

/**
 * 层级构建器
 * 组合 XML 结构解析器、元素分析器等服务，提供完整的层级构建功能
 * 这是架构图组件的核心业务逻辑层
 */
export class HierarchyBuilder {
  
  /**
   * 构建完整的层级树
   * 这是主要的入口方法，集成了所有层级构建逻辑
   */
  static buildHierarchyTree(elements: UIElement[], targetElement: UIElement): HierarchyNode[] {
    console.log('🏗️ HierarchyBuilder: 开始构建层级树，目标元素:', targetElement.id);
    console.log('🏗️ HierarchyBuilder: 总元素数量:', elements.length);
    
    try {
      // 步骤1: 基于 XML 语义构建节点映射和父子关系
      const nodeMap = XmlStructureParser.buildXmlBasedHierarchy(elements, targetElement);
      
      // 步骤2: 查找目标元素节点
      console.log('🏗️ HierarchyBuilder: 查找目标元素');
      const targetNode = nodeMap.get(targetElement.id);
      if (!targetNode) {
        console.warn('🚨 HierarchyBuilder: 未找到目标元素节点');
        return [];
      }

      // 步骤3: 输出目标元素的父子关系调试信息
      console.log(`🎯 HierarchyBuilder: 目标元素 ${targetElement.id}(${targetElement.element_type}) 的父元素:`, 
        targetNode.parent?.id ? `${targetNode.parent.id}(${targetNode.parent.element.element_type})` : 'null');
      console.log(`🎯 HierarchyBuilder: 目标元素 ${targetElement.id} 的子元素:`, 
        targetNode.children.map(c => `${c.id}(${c.element.element_type})`));

      // 步骤4: 智能选择根节点 - 优先选择有意义的业务容器
      console.log('🏗️ HierarchyBuilder: 智能选择根节点');
      const rootAncestor = this.smartSelectRootNode(targetNode, nodeMap);

      // 步骤5: 计算关系
      console.log('🏗️ HierarchyBuilder: 计算关系');
      ElementAnalyzer.calculateRelationships([rootAncestor], targetNode);

      // 步骤6: 计算路径
      console.log('🏗️ HierarchyBuilder: 计算路径');
      ElementAnalyzer.calculatePaths(rootAncestor);

      // 步骤7: 设置层级深度
      console.log('🏗️ HierarchyBuilder: 设置层级深度');
      this.setLevels([rootAncestor], 0);

      console.log('✅ HierarchyBuilder: 层级树构建完成');
      console.log('🏠 HierarchyBuilder: 最终根节点:', `${rootAncestor.id}(${rootAncestor.element.element_type})`);
      console.log('📊 HierarchyBuilder: 根节点子元素数量:', rootAncestor.children.length);
      
      return [rootAncestor];
      
    } catch (error) {
      console.error('❌ HierarchyBuilder: 构建层级树时发生错误:', error);
      return [];
    }
  }
  
  /**
   * 智能选择根节点
   * 优先选择业务相关的容器而不是顶层技术容器
   */
  static smartSelectRootNode(targetNode: HierarchyNode, nodeMap: Map<string, HierarchyNode>): HierarchyNode {
    console.log('🎯 HierarchyBuilder: 开始智能根节点选择');
    
    // 策略1: 如果目标元素在底部导航中，直接使用底部导航作为根
    const bottomNavContainer = Array.from(nodeMap.values()).find(node => 
      node.element.resource_id === 'com.hihonor.contacts:id/bottom_navgation'
    );
    
    if (bottomNavContainer) {
      console.log('🧭 HierarchyBuilder: 找到底部导航容器，将其作为根节点');
      return bottomNavContainer;
    }
    
    // 策略2: 查找有意义的业务容器（有resource-id且不是顶层框架容器）
    let candidate = targetNode;
    const visited = new Set<string>();
    const maxDepth = 10;
    let depth = 0;
    
    while (candidate.parent && depth < maxDepth && !visited.has(candidate.id)) {
      visited.add(candidate.id);
      const parent = candidate.parent;
      
      // 检查父容器是否是业务容器
      if (parent.element.resource_id && 
          !parent.element.resource_id.includes('android:id') &&
          parent.element.resource_id.includes('com.hihonor.contacts')) {
        console.log(`📦 HierarchyBuilder: 找到业务容器: ${parent.id}(${parent.element.resource_id})`);
        candidate = parent;
      } else {
        break;
      }
      
      depth++;
    }
    
    console.log(`🏠 HierarchyBuilder: 最终选择根节点: ${candidate.id}(${candidate.element.element_type})`);
    return candidate;
  }
  
  /**
   * 查找根祖先节点
   * 从目标节点向上追溯，找到最顶层的祖先节点
   */
  static findRootAncestor(targetNode: HierarchyNode): HierarchyNode {
    let rootAncestor = targetNode;
    const visited = new Set<string>();
    const maxDepth = 20; // 最大层级深度限制
    let depth = 0;
    
    // 🔍 追踪祖先链
    const ancestorChain: string[] = [`${targetNode.id}(${targetNode.element.element_type})`];
    
    while (rootAncestor.parent && depth < maxDepth && !visited.has(rootAncestor.id)) {
      visited.add(rootAncestor.id);
      rootAncestor = rootAncestor.parent;
      ancestorChain.push(`${rootAncestor.id}(${rootAncestor.element.element_type})`);
      depth++;
    }
    
    console.log('🏠 HierarchyBuilder: 完整祖先链:', ancestorChain.reverse().join(' -> '));
    console.log('📦 HierarchyBuilder: 最终根节点:', `${rootAncestor.id}(${rootAncestor.element.element_type})`);
    
    if (depth >= maxDepth) {
      console.warn('🚨 HierarchyBuilder: 达到最大层级深度限制，停止查找祖先');
    }
    
    return rootAncestor;
  }
  
  /**
   * 递归设置节点层级
   * 根据树结构设置每个节点的层级深度
   */
  static setLevels(nodes: HierarchyNode[], level: number): void {
    nodes.forEach(node => {
      node.level = level;
      this.setLevels(node.children, level + 1);
    });
  }
  
  /**
   * 转换为 Ant Design Tree 数据格式
   * 将内部的层级节点转换为 Tree 组件需要的数据格式
   */
  static convertToTreeData(hierarchyNodes: HierarchyNode[]): any[] {
    return hierarchyNodes.map(node => {
      const report = ElementAnalyzer.generateElementReport(node.element);
      
      return {
        key: node.id,
        title: this.generateNodeTitle(node, report),
        children: node.children.length > 0 ? this.convertToTreeData(node.children) : undefined,
        isLeaf: node.children.length === 0,
        icon: report.icon,
        className: this.getNodeClassName(node),
        data: {
          element: node.element,
          relationship: node.relationship,
          level: node.level,
          path: node.path,
          report
        }
      };
    });
  }
  
  /**
   * 生成节点标题
   * 创建用于 Tree 组件显示的节点标题
   */
  static generateNodeTitle(node: HierarchyNode, report: ReturnType<typeof ElementAnalyzer.generateElementReport>): string {
    const relationshipBadge = this.getRelationshipBadge(node.relationship);
    const levelInfo = `[L${node.level}]`;
    
    return `${relationshipBadge} ${levelInfo} ${report.label}`;
  }
  
  /**
   * 获取关系标识
   * 为不同的关系类型返回相应的标识符
   */
  static getRelationshipBadge(relationship: HierarchyNode['relationship']): string {
    switch (relationship) {
      case 'self':
        return '🎯';
      case 'parent':
        return '⬆️';
      case 'child':
        return '⬇️';
      case 'ancestor':
        return '🔼';
      case 'descendant':
        return '🔽';
      case 'sibling':
        return '↔️';
      default:
        return '🔹';
    }
  }
  
  /**
   * 获取节点 CSS 类名
   * 根据节点特征返回相应的样式类名
   */
  static getNodeClassName(node: HierarchyNode): string {
    const classes = ['hierarchy-node'];
    
    if (node.relationship === 'self') {
      classes.push('target-element');
    }
    
    if (node.isClickable) {
      classes.push('clickable-element');
    }
    
    if (node.hasText) {
      classes.push('text-element');
    }
    
    if (node.isHidden) {
      classes.push('hidden-element');
    }
    
    classes.push(`level-${node.level}`);
    classes.push(`relationship-${node.relationship}`);
    
    return classes.join(' ');
  }
  
  /**
   * 获取展开的键列表
   * 返回应该默认展开的节点键列表，通常包括目标元素的路径
   */
  static getDefaultExpandedKeys(hierarchyNodes: HierarchyNode[], targetElementId: string): string[] {
    const expandedKeys: string[] = [];
    
    const collectKeysToTarget = (nodes: HierarchyNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === targetElementId) {
          expandedKeys.push(node.id);
          return true;
        }
        
        if (node.children.length > 0 && collectKeysToTarget(node.children)) {
          expandedKeys.push(node.id);
          return true;
        }
      }
      return false;
    };
    
    collectKeysToTarget(hierarchyNodes);
    return expandedKeys;
  }
  
  /**
   * 查找节点
   * 在层级树中查找指定ID的节点
   */
  static findNode(hierarchyNodes: HierarchyNode[], nodeId: string): HierarchyNode | null {
    for (const node of hierarchyNodes) {
      if (node.id === nodeId) {
        return node;
      }
      
      const found = this.findNode(node.children, nodeId);
      if (found) {
        return found;
      }
    }
    return null;
  }
  
  /**
   * 获取层级统计信息
   * 返回树的统计数据，用于调试和展示
   */
  static getTreeStatistics(hierarchyNodes: HierarchyNode[]): {
    totalNodes: number;
    maxDepth: number;
    leafNodes: number;
    containerNodes: number;
    clickableNodes: number;
    textNodes: number;
    hiddenNodes: number;
    averageChildren: number;
  } {
    let totalNodes = 0;
    let maxDepth = 0;
    let leafNodes = 0;
    let containerNodes = 0;
    let clickableNodes = 0;
    let textNodes = 0;
    let hiddenNodes = 0;
    let totalChildren = 0;
    
    const traverse = (nodes: HierarchyNode[], depth = 0) => {
      for (const node of nodes) {
        totalNodes++;
        maxDepth = Math.max(maxDepth, depth);
        
        if (node.children.length === 0) leafNodes++;
        if (node.children.length > 0) containerNodes++;
        if (node.isClickable) clickableNodes++;
        if (node.hasText) textNodes++;
        if (node.isHidden) hiddenNodes++;
        
        totalChildren += node.children.length;
        
        traverse(node.children, depth + 1);
      }
    };
    
    traverse(hierarchyNodes);
    
    return {
      totalNodes,
      maxDepth,
      leafNodes,
      containerNodes,
      clickableNodes,
      textNodes,
      hiddenNodes,
      averageChildren: totalNodes > 0 ? totalChildren / totalNodes : 0
    };
  }
  
  /**
   * 验证层级树的完整性
   * 检查树结构是否正确，用于调试
   */
  static validateTree(hierarchyNodes: HierarchyNode[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const visitedIds = new Set<string>();
    
    const validate = (nodes: HierarchyNode[], parentId?: string) => {
      for (const node of nodes) {
        // 检查重复ID
        if (visitedIds.has(node.id)) {
          errors.push(`重复的节点ID: ${node.id}`);
        } else {
          visitedIds.add(node.id);
        }
        
        // 检查父子关系一致性
        if (parentId && (!node.parent || node.parent.id !== parentId)) {
          errors.push(`节点 ${node.id} 的父节点关系不一致`);
        }
        
        // 检查子节点的父节点指向
        for (const child of node.children) {
          if (!child.parent || child.parent.id !== node.id) {
            errors.push(`子节点 ${child.id} 的父节点指向错误`);
          }
        }
        
        // 递归验证子节点
        validate(node.children, node.id);
      }
    };
    
    validate(hierarchyNodes);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}