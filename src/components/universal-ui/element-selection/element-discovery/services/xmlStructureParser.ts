import type { UIElement, ElementBounds } from '../../../../../api/universal-ui';

// 定义层级节点结构
export interface HierarchyNode {
  id: string;
  element: UIElement;
  level: number;
  children: HierarchyNode[];
  parent: HierarchyNode | null;
  isClickable: boolean;
  hasText: boolean;
  isHidden: boolean;
  relationship: 'self' | 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant';
  path: string;
}

/**
 * XML 结构解析服务
 * 专注于基于 XML 语义构建正确的父子关系，不依赖边界检测
 */
export class XmlStructureParser {
  
  /**
   * 根据 XML 语义推断父子关系
   * 针对小红书通讯录底部导航栏的特殊处理
   */
  static inferParentChildFromContext(
    parentCandidate: UIElement, 
    allElements: UIElement[], 
    nodeMap: Map<string, HierarchyNode>
  ): void {
    const parentNode = nodeMap.get(parentCandidate.id);
    if (!parentNode) return;
    
    // 🧭 特殊处理：底部导航容器
    if (parentCandidate.resource_id === 'com.hihonor.contacts:id/bottom_navgation') {
      console.log('🧭 处理底部导航容器:', parentCandidate.id);
      
      // 查找可点击的LinearLayout按钮 (高度1420的特征)
      const clickableButtons = allElements.filter(e => 
        e.element_type === 'android.widget.LinearLayout' && 
        e.is_clickable &&
        String(e.bounds).includes('1420') // 底部导航按钮的高度特征
      );
      
      console.log(`🔍 找到 ${clickableButtons.length} 个底部导航按钮:`, 
        clickableButtons.map(b => `${b.id}(${b.bounds})`));
      
      // 为每个按钮建立父子关系
      clickableButtons.forEach(button => {
        const buttonNode = nodeMap.get(button.id);
        if (buttonNode && !buttonNode.parent) {
          parentNode.children.push(buttonNode);
          buttonNode.parent = parentNode;
          console.log(`🔗 XML推断: 底部导航 ${parentCandidate.id} -> 按钮 ${button.id}`);
          
          // 为每个按钮查找其子元素（图标和文本）
          this.findButtonChildren(button, allElements, nodeMap);
        }
      });
      return;
    }
    
    // 🏷️ 特殊处理：其他业务容器（如果需要）
    // 文本容器的处理已经在 findButtonChildren 中完成
    if (parentCandidate.resource_id && 
        parentCandidate.resource_id.includes('com.hihonor.contacts') && 
        parentCandidate.resource_id !== 'com.hihonor.contacts:id/bottom_navgation') {
      console.log('🏢 处理其他业务容器:', parentCandidate.id, parentCandidate.resource_id);
      // 可以在这里添加其他业务容器的特殊处理逻辑
    }
  }
  
  /**
   * 为按钮查找其图标和文本子元素
   * 专门处理底部导航按钮的子元素发现
   */
  static findButtonChildren(
    button: UIElement, 
    allElements: UIElement[], 
    nodeMap: Map<string, HierarchyNode>
  ): void {
    const buttonNode = nodeMap.get(button.id);
    if (!buttonNode) return;
    
    console.log(`🔍 为按钮 ${button.id} 查找子元素`);
    
    // 查找所有ImageView图标
    const icons = allElements.filter(e => 
      e.element_type === 'android.widget.ImageView' &&
      e.resource_id === 'com.hihonor.contacts:id/top_icon'
    );
    
    // 查找所有文本容器
    const containers = allElements.filter(e => 
      e.element_type === 'android.widget.LinearLayout' &&
      e.resource_id === 'com.hihonor.contacts:id/container'
    );
    
    // 查找所有文本元素
    const textElements = allElements.filter(e => 
      e.element_type === 'android.widget.TextView' &&
      e.resource_id === 'com.hihonor.contacts:id/content' &&
      e.text && e.text.trim()
    );
    
    console.log(`📊 找到 ${icons.length} 个图标, ${containers.length} 个容器, ${textElements.length} 个文本`);
    
    // 为这个按钮找到对应的图标（在同一水平范围内）
    const buttonBounds = this.normalizeBounds(button.bounds);
    if (buttonBounds) {
      const matchingIcon = icons.find(icon => {
        const iconBounds = this.normalizeBounds(icon.bounds);
        if (!iconBounds) return false;
        
        // 图标应该在按钮的边界内
        return iconBounds.left >= buttonBounds.left && iconBounds.right <= buttonBounds.right &&
               iconBounds.top >= buttonBounds.top && iconBounds.bottom <= buttonBounds.bottom;
      });
      
      if (matchingIcon) {
        const iconNode = nodeMap.get(matchingIcon.id);
        if (iconNode && !iconNode.parent) {
          buttonNode.children.push(iconNode);
          iconNode.parent = buttonNode;
          console.log(`🔗 XML推断: 按钮 ${button.id} -> 图标 ${matchingIcon.id}`);
        }
      }
    }
    
    // 按照按钮在XML中的顺序分配文本和容器
    // 获取所有底部导航按钮并按bounds.left排序
    const allBottomButtons = allElements.filter(e => 
      e.element_type === 'android.widget.LinearLayout' && 
      e.is_clickable &&
      String(e.bounds).includes('1420') // 底部导航按钮的高度特征
    ).sort((a, b) => {
      const aBounds = this.normalizeBounds(a.bounds);
      const bBounds = this.normalizeBounds(b.bounds);
      if (!aBounds || !bBounds) return 0;
      return aBounds.left - bBounds.left;
    });
    
    const buttonIndex = allBottomButtons.findIndex(b => b.id === button.id);
    console.log(`📍 按钮 ${button.id} 在导航中的索引: ${buttonIndex}`);
    
    // 为此按钮分配对应的文本容器和文本
    if (buttonIndex >= 0 && buttonIndex < containers.length) {
      const targetContainer = containers[buttonIndex];
      const containerNode = nodeMap.get(targetContainer.id);
      
      if (containerNode && !containerNode.parent) {
        buttonNode.children.push(containerNode);
        containerNode.parent = buttonNode;
        console.log(`🔗 XML推断: 按钮 ${button.id} -> 文本容器 ${targetContainer.id}`);
        
        // 为容器分配对应的文本
        if (buttonIndex < textElements.length) {
          const targetText = textElements[buttonIndex];
          const textNode = nodeMap.get(targetText.id);
          
          if (textNode && !textNode.parent) {
            containerNode.children.push(textNode);
            textNode.parent = containerNode;
            console.log(`🔗 XML推断: 文本容器 ${targetContainer.id} -> 文本 ${targetText.id} ("${targetText.text}")`);
          }
        }
      }
    }
  }
  
  /**
   * 规范化边界对象
   * ElementBounds 已经是对象格式，直接返回
   */
  static normalizeBounds(bounds: ElementBounds): ElementBounds | null {
    try {
      // ElementBounds 已经是正确的对象格式
      if (bounds && typeof bounds === 'object' && 
          typeof bounds.left === 'number' && 
          typeof bounds.top === 'number' && 
          typeof bounds.right === 'number' && 
          typeof bounds.bottom === 'number') {
        return bounds;
      }
      return null;
    } catch (error) {
      console.warn('边界解析失败:', bounds, error);
      return null;
    }
  }
  
  /**
   * 创建层级节点映射
   * 为所有元素创建初始的节点结构
   */
  static createNodeMap(elements: UIElement[]): Map<string, HierarchyNode> {
    const nodeMap = new Map<string, HierarchyNode>();
    
    elements.forEach(element => {
      nodeMap.set(element.id, {
        id: element.id,
        element,
        level: 0,
        children: [],
        parent: null,
        isClickable: element.is_clickable,
        hasText: !!(element.text && element.text.trim()),
        isHidden: this.checkIsHiddenElement(element),
        relationship: 'sibling',
        path: ''
      });
    });
    
    return nodeMap;
  }
  
  /**
   * 检查元素是否为隐藏元素
   * 基于元素特征判断是否应该在层级中显示
   */
  static checkIsHiddenElement(element: UIElement): boolean {
    // 如果bounds为零区域，可能是隐藏或占位元素
    if (element.bounds.left === 0 && element.bounds.top === 0 && 
        element.bounds.right === 0 && element.bounds.bottom === 0) {
      return true;
    }
    
    // 其他隐藏判断逻辑可以在这里添加
    return false;
  }
  
  /**
   * 基于 XML 语义构建完整的层级关系
   * 这是主要的构建入口，专注于 XML 结构而非边界检测
   */
  static buildXmlBasedHierarchy(
    elements: UIElement[], 
    targetElement: UIElement
  ): Map<string, HierarchyNode> {
    console.log('🏗️ 开始基于XML构建层级关系');
    console.log('🏗️ 总元素数量:', elements.length);
    console.log('🎯 目标元素:', targetElement.id, targetElement.element_type);
    
    // 创建节点映射
    const nodeMap = this.createNodeMap(elements);
    
    // 🚀 基于XML结构而非边界检测构建父子关系
    console.log('🏗️ 基于XML语义结构构建父子关系');
    
    // 首先处理底部导航容器 - 这应该作为根节点显示
    const bottomNavContainer = elements.find(e => 
      e.resource_id === 'com.hihonor.contacts:id/bottom_navgation'
    );
    
    if (bottomNavContainer) {
      console.log('🧭 找到底部导航容器:', bottomNavContainer.id, '作为根节点');
      this.inferParentChildFromContext(bottomNavContainer, elements, nodeMap);
      
      // 🔧 强制将底部导航作为根节点 - 清除其parent关系
      const bottomNavNode = nodeMap.get(bottomNavContainer.id);
      if (bottomNavNode) {
        bottomNavNode.parent = null;
        console.log('🏠 将底部导航设置为根节点');
      }
    }
    
    // 处理其他父子关系（但不覆盖底部导航的根状态）
    elements.forEach(element => {
      if (element.id !== bottomNavContainer?.id) {
        this.inferParentChildFromContext(element, elements, nodeMap);
      }
    });
    
    // 🔍 调试输出：验证构建的层级结构
    console.log('🔍 构建完成后的节点关系:');
    nodeMap.forEach((node, id) => {
      if (node.parent === null) {
        console.log(`🏠 根节点: ${id}(${node.element.element_type})`);
        this.logChildrenRecursively(node, '  ');
      }
    });
    
    return nodeMap;
  }
  
  /**
   * 递归记录子节点结构（用于调试）
   */
  static logChildrenRecursively(node: HierarchyNode, indent: string): void {
    node.children.forEach(child => {
      console.log(`${indent}├─ ${child.id}(${child.element.element_type})${child.element.text ? ` "${child.element.text}"` : ''}`);
      if (child.children.length > 0) {
        this.logChildrenRecursively(child, indent + '  ');
      }
    });
  }
}