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
    
    // 🔍 检查关键文本元素（底部导航）
    const navTextElements = elements.filter(el => 
      (el.text === '电话' || el.text === '联系人' || el.text === '收藏')
    );
    if (navTextElements.length > 0) {
      console.log('✅ 发现关键导航文本元素:', navTextElements.map(el => el.text).join(', '));
    }
    
    try {
      // 步骤1: 基于 XML 语义构建节点映射和父子关系
      const nodeMap = XmlStructureParser.buildXmlBasedHierarchy(elements, targetElement, 'element-discovery');
      
      // 🔍 调试：检查关键文本元素的层级关系
      const textElements = ['element_37', 'element_41', 'element_45']; // 电话、联系人、收藏
      textElements.forEach(textId => {
        const textNode = nodeMap.get(textId);
        if (textNode) {
          console.log(`🔍 文本元素 ${textId} 层级关系:`, {
            hasParent: !!textNode.parent,
            parentId: textNode.parent?.id,
            parentType: textNode.parent?.element.element_type,
            hasChildren: textNode.children.length > 0,
            text: textNode.element.text
          });
        } else {
          console.log(`⚠️ 文本元素 ${textId} 不存在于节点映射中`);
        }
      });
      
      // 🔍 调试：检查按钮的子元素
      const buttonElements = ['element_34', 'element_38', 'element_42']; // 三个按钮
      buttonElements.forEach(buttonId => {
        const buttonNode = nodeMap.get(buttonId);
        if (buttonNode) {
          console.log(`🔍 按钮 ${buttonId} 子元素:`, {
            childrenCount: buttonNode.children.length,
            children: buttonNode.children.map(child => ({
              id: child.id,
              type: child.element.element_type,
              text: child.element.text || 'N/A'
            }))
          });
        }
      });
      
      // 步骤2: 查找目标元素节点
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

      // 步骤4: 智能选择根节点
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

      console.log('✅ 架构图构建完成 - 根节点:', `${rootAncestor.id}(${rootAncestor.element.element_type})`, '子元素:', rootAncestor.children.length);
      
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
   * 🆕 转换为交互式树节点数据格式
   * 支持自定义React组件渲染，用于InteractiveTreeNode
   */
  static convertToInteractiveTreeData(
    hierarchyNodes: HierarchyNode[], 
    targetElementId: string,
    callbacks?: {
      onSwitchToElement?: (element: UIElement) => void;
      onViewDetails?: (element: UIElement) => void;
      onHighlightElement?: (element: UIElement) => void;
      onCopyElementInfo?: (element: UIElement) => void;
      onShowBounds?: (element: UIElement) => void;
    }
  ): any[] {
    return hierarchyNodes.map(node => {
      const report = ElementAnalyzer.generateElementReport(node.element);
      
      return {
        key: node.id,
        title: node.id, // 临时保持简单，实际渲染由titleRender处理
        children: node.children.length > 0 
          ? this.convertToInteractiveTreeData(node.children, targetElementId, callbacks) 
          : undefined,
        isLeaf: node.children.length === 0,
        icon: report.icon,
        className: this.getNodeClassName(node),
        // 🔧 新增：支持自定义渲染的数据
        nodeData: {
          node,
          element: node.element,
          title: this.generateCleanTitle(node, report),
          relationship: node.relationship,
          level: node.level,
          isTarget: node.element.id === targetElementId,
          report,
          callbacks
        }
      };
    });
  }

  /**
   * 🆕 生成清洁的节点标题（用于InteractiveTreeNode）
   * 移除额外的标记，交给组件处理
   */
  static generateCleanTitle(node: HierarchyNode, report: ReturnType<typeof ElementAnalyzer.generateElementReport>): string {
    const element = node.element;
    
    // 如果有文本内容，优先显示
    if (element.text && element.text.trim()) {
      return element.text.trim();
    } 
    // 如果有内容描述，也优先显示
    else if (element.content_desc && element.content_desc.trim()) {
      return element.content_desc.trim();
    }
    // 否则基于元素类型生成描述
    else {
      const elementType = this.getElementTypeDescription(element);
      const elementId = element.id.replace('element_', '');
      return `${elementType} (${elementId})`;
    }
  }
  
  /**
   * 生成节点标题
   * 创建用户友好的节点标题，突出显示文本元素和功能描述
   */
  static generateNodeTitle(node: HierarchyNode, report: ReturnType<typeof ElementAnalyzer.generateElementReport>): string {
    const element = node.element;
    
    // 获取关系标识和层级信息
    const relationshipBadge = this.getRelationshipBadge(node.relationship);
    const levelInfo = `[L${node.level}]`;
    const elementId = element.id.replace('element_', '');
    
    // 构建用户友好的标题
    let title = '';
    
    // 如果有文本内容，优先显示并突出标记
    if (element.text && element.text.trim()) {
      const textContent = element.text.trim();
      // 特别突出文本元素，因为用户说这些更容易搜索
      title = `📝 "${textContent}" ${relationshipBadge}${levelInfo}`;
    } 
    // 如果有内容描述，也优先显示
    else if (element.content_desc && element.content_desc.trim()) {
      const descContent = element.content_desc.trim();
      title = `💬 "${descContent}" ${relationshipBadge}${levelInfo}`;
    }
    // 否则基于元素类型和属性生成描述
    else {
      const elementType = this.getElementTypeDescription(element);
      title = `${elementType} ${relationshipBadge}${levelInfo} (${elementId})`;
    }
    
    return title;
  }

  /**
   * 基于元素属性生成用户友好的类型描述
   */
  static getElementTypeDescription(element: UIElement): string {
    const className = element.element_type?.toLowerCase() || '';
    const resourceId = element.resource_id?.toLowerCase() || '';
    const isClickable = element.is_clickable;
    
    // 首先基于类名进行基础分类，这样更准确
    
    // 文本类型元素 - 用户最关心的
    if (className.includes('textview')) {
      return '📝 文本显示';
    }
    if (className.includes('edittext')) {
      return '✏️ 输入框';
    }
    
    // 基于resource_id识别（更精确的匹配）
    if (resourceId.includes('phone') || resourceId.includes('call')) {
      return '📞 电话按钮';
    }
    // 更精确的联系人匹配，避免误识别
    if (resourceId.endsWith('contacts') || resourceId.includes('contacts_tab') || 
        (resourceId.includes('contact') && (resourceId.includes('btn') || resourceId.includes('tab')))) {
      return '👥 联系人按钮';
    }
    if (resourceId.includes('favorite') || resourceId.includes('star')) {
      return '⭐ 收藏按钮';
    }
    if (resourceId.includes('search')) {
      return '🔍 搜索';
    }
    if (resourceId.includes('menu') || resourceId.includes('navigation')) {
      return '📋 菜单';
    }
    if (resourceId.includes('icon') || resourceId.includes('image')) {
      return '🖼️ 图标';
    }
    if (resourceId.includes('text') || resourceId.includes('label')) {
      return '📝 文本';
    }
    
    // 基于类名识别（继续其他类型）
    if (className.includes('button')) {
      return isClickable ? '🔘 按钮' : '📦 按钮容器';
    }
    if (className.includes('imageview')) {
      return '🖼️ 图片';
    }
    if (className.includes('imagebutton')) {
      return '🖼️ 图片按钮';
    }
    if (className.includes('linearlayout') || className.includes('relativelayout') || className.includes('framelayout')) {
      return '📦 布局容器';
    }
    if (className.includes('recyclerview') || className.includes('listview')) {
      return '📋 列表';
    }
    if (className.includes('scrollview')) {
      return '� 滚动视图';
    }
    if (className.includes('checkbox')) {
      return '☑️ 复选框';
    }
    if (className.includes('radiobutton')) {
      return '🔘 单选按钮';
    }
    if (className.includes('switch')) {
      return '🔀 开关';
    }
    if (className.includes('progressbar')) {
      return '📊 进度条';
    }
    if (className.includes('seekbar')) {
      return '🎚️ 滑动条';
    }
    if (className.includes('webview')) {
      return '🌐 网页视图';
    }
    
    // 基于可点击性和其他属性
    if (isClickable) {
      return '👆 可点击元素';
    }
    
    // 检查是否是容器类型
    if (className.includes('layout') || className.includes('container')) {
      return '📦 容器';
    }
    
    // 基于尺寸判断是否可能是图标
    const width = element.bounds.right - element.bounds.left;
    const height = element.bounds.bottom - element.bounds.top;
    const area = width * height;
    
    if (area > 0 && area < 5000) { // 小尺寸元素可能是图标
      return '🔹 小型元素';
    }
    
    // 默认情况
    return '📱 UI元素';
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