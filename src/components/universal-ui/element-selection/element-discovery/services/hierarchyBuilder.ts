import type { UIElement } from '../../../../../api/universal-ui';
import { XmlStructureParser, type HierarchyNode } from './xmlStructureParser';
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
    console.log('🏗️ HierarchyBuilder: 开始构建层级树');
    console.log('🎯 HierarchyBuilder: 目标元素详细信息:', {
      id: targetElement.id,
      element_type: targetElement.element_type,
      resource_id: targetElement.resource_id,
      text: targetElement.text,
      bounds: targetElement.bounds,
      is_clickable: targetElement.is_clickable
    });
    console.log('🏗️ HierarchyBuilder: 总元素数量:', elements.length);
    
    // 输出一些关键元素的信息用于调试
    console.log('🔍 HierarchyBuilder: 底部导航元素信息:');
    const bottomNavElements = elements.filter(e => 
      e.resource_id === 'com.hihonor.contacts:id/bottom_navgation' ||
      e.resource_id === 'com.xingin.xhs:id/bottom_navgation'
    );
    bottomNavElements.forEach(e => {
      console.log(`  📦 底部导航: ${e.id} - ${e.element_type} - ${e.resource_id}`);
    });
    
    const clickableButtons = elements.filter(e => 
      e.element_type === 'android.widget.LinearLayout' && 
      e.is_clickable &&
      (String(e.bounds).includes('1420') || String(e.bounds).includes('1436'))
    );
    console.log(`🔍 HierarchyBuilder: 找到 ${clickableButtons.length} 个可点击按钮:`);
    clickableButtons.forEach(e => {
      console.log(`  🔘 按钮: ${e.id} - ${e.bounds} - selected: ${e.selected}`);
    });
    
    try {
      // 步骤1: 基于 XML 语义构建节点映射和父子关系
      const nodeMap = XmlStructureParser.buildXmlBasedHierarchy(elements, targetElement);
      
      console.log('🏗️ HierarchyBuilder: 节点映射构建完成，总节点数:', nodeMap.size);
      
      // 步骤2: 查找目标元素节点
      console.log('🏗️ HierarchyBuilder: 查找目标元素');
      const targetNode = nodeMap.get(targetElement.id);
      if (!targetNode) {
        console.warn('🚨 HierarchyBuilder: 未找到目标元素节点');
        // 输出所有节点的ID用于调试
        console.log('📋 HierarchyBuilder: 所有可用节点ID:', Array.from(nodeMap.keys()));
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
      console.log('🌳 HierarchyBuilder: 完整树结构:');
      this.printTreeStructure(rootAncestor, 0);
      
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
   * 创建用于 Tree 组件显示的节点标题，传达清晰的层级关系
   */
  static generateNodeTitle(node: HierarchyNode, report: ReturnType<typeof ElementAnalyzer.generateElementReport>): string {
    const relationshipLabel = this.getRelationshipLabel(node.relationship, node.level);
    const elementDescription = this.getElementDescription(node.element, report);
    const isTarget = node.relationship === 'self' ? ' ⭐ 当前选中' : '';
    
    return `${relationshipLabel} ${elementDescription}${isTarget}`;
  }
  
  /**
   * 获取层级关系标签
   * 根据关系类型和层级返回中文描述
   */
  static getRelationshipLabel(relationship: HierarchyNode['relationship'], level: number): string {
    switch (relationship) {
      case 'self':
        return `🎯 [L${level}]`;
      case 'ancestor':
        if (level === 0) return `📦 祖父: [L${level}]`;
        if (level === 1) return `📦 父: [L${level}]`;
        return `📦 祖先: [L${level}]`;
      case 'descendant':
        return `📁 子: [L${level}]`;
      case 'parent':
        return `📦 父: [L${level}]`;
      case 'child':
        return `📁 子: [L${level}]`;
      case 'sibling':
        return `↔️ [L${level}]`;
      default:
        return `🔹 [L${level}]`;
    }
  }
  
  /**
   * 获取元素描述
   * 结合元素类型、文本和功能生成清晰的描述
   */
  static getElementDescription(element: UIElement, report: any): string {
    const parts = [];
    
    // 显示元素ID
    parts.push(`element_${element.id}`);
    
    // 显示元素功能描述
    const functionDesc = this.getElementFunctionDescription(element);
    if (functionDesc) {
      parts.push(`(${functionDesc})`);
    }
    
    // 显示文本内容
    if (element.text && element.text.trim()) {
      const text = element.text.trim();
      const shortText = text.length > 15 ? text.substring(0, 15) + '...' : text;
      parts.push(`"${shortText}"`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * 获取元素功能描述
   * 根据元素类型和属性返回功能描述
   */
  static getElementFunctionDescription(element: UIElement): string {
    const elementType = element.element_type?.toLowerCase() || '';
    const resourceId = element.resource_id?.toLowerCase() || '';
    const text = element.text?.toLowerCase() || '';
    
    // 特殊功能区域识别
    if (resourceId.includes('navigation') || resourceId.includes('tab')) {
      return '底部导航栏容器';
    }
    
    // 按钮类型识别
    if (elementType.includes('button') || element.is_clickable) {
      if (text.includes('电话') || resourceId.includes('phone')) {
        return '电话按钮';
      }
      if (text.includes('联系人') || resourceId.includes('contact')) {
        return '联系人按钮';
      }
      if (text.includes('收藏') || resourceId.includes('favorite')) {
        return '收藏按钮';
      }
      return '按钮';
    }
    
    // 文本类型
    if (elementType.includes('textview')) {
      if (text.includes('电话') || text.includes('联系人') || text.includes('收藏')) {
        return '按钮文本';
      }
      return '文本';
    }
    
    // 图片类型
    if (elementType.includes('imageview')) {
      if (resourceId.includes('icon')) {
        return '图标';
      }
      return '图片';
    }
    
    // 容器类型
    if (elementType.includes('layout')) {
      return '容器';
    }
    
    // 输入框
    if (elementType.includes('edittext')) {
      return '输入框';
    }
    
    // 默认
    const shortType = elementType.includes('.') ? elementType.split('.').pop() : elementType;
    return shortType || '元素';
  }
  
  /**
   * 获取关系标识（保留用于向后兼容）
   * 为不同的关系类型返回相应的标识符
   */
  static getRelationshipBadge(relationship: HierarchyNode['relationship']): string {
    switch (relationship) {
      case 'self':
        return '🎯';
      case 'parent':
        return '📦';
      case 'child':
        return '📁';
      case 'ancestor':
        return '�';
      case 'descendant':
        return '�';
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
    clickableNodes: number;
    textNodes: number;
    hiddenNodes: number;
  } {
    let totalNodes = 0;
    let maxDepth = 0;
    let clickableNodes = 0;
    let textNodes = 0;
    let hiddenNodes = 0;
    
    const traverse = (nodes: HierarchyNode[], depth = 0) => {
      for (const node of nodes) {
        totalNodes++;
        maxDepth = Math.max(maxDepth, depth);
        
        if (node.isClickable) clickableNodes++;
        if (node.hasText) textNodes++;
        if (node.isHidden) hiddenNodes++;
        
        traverse(node.children, depth + 1);
      }
    };
    
    traverse(hierarchyNodes);
    
    return {
      totalNodes,
      maxDepth,
      clickableNodes,
      textNodes,
      hiddenNodes
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
  
  /**
   * 打印树结构用于调试
   * 递归输出完整的树层次结构
   */
  static printTreeStructure(node: HierarchyNode, depth: number): void {
    const indent = '  '.repeat(depth);
    const icon = ElementAnalyzer.getElementIcon(node.element);
    const label = ElementAnalyzer.getElementLabel(node.element);
    console.log(`${indent}${icon} ${node.id} - ${label} (${node.children.length} children)`);
    
    node.children.forEach(child => {
      this.printTreeStructure(child, depth + 1);
    });
  }
}