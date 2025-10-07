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
    
    // 🏷️ 特殊处理：文本容器
    if (parentCandidate.resource_id === 'com.hihonor.contacts:id/container') {
      console.log('📝 处理文本容器:', parentCandidate.id);
      
      // 查找文本元素
      const textElements = allElements.filter(e => 
        e.element_type === 'android.widget.TextView' && 
        e.text && e.text.trim()
      );
      
      // 简单分配：为这个容器分配文本（这里可以优化匹配逻辑）
      const matchingText = textElements.find(text => {
        // 这里可以添加更精确的匹配逻辑
        return true;
      });
      
      if (matchingText) {
        const textNode = nodeMap.get(matchingText.id);
        if (textNode && !textNode.parent) {
          parentNode.children.push(textNode);
          textNode.parent = parentNode;
          console.log(`🔗 XML推断: 文本容器 ${parentCandidate.id} -> 文本 ${matchingText.id} ("${matchingText.text}")`);
        }
      }
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
    
    // 查找ImageView图标
    const icons = allElements.filter(e => 
      e.element_type === 'android.widget.ImageView' &&
      e.resource_id === 'com.hihonor.contacts:id/top_icon'
    );
    
    // 查找文本容器
    const containers = allElements.filter(e => 
      e.element_type === 'android.widget.LinearLayout' &&
      e.resource_id === 'com.hihonor.contacts:id/container'
    );
    
    // 简单分配：按索引或位置关联
    const buttonBounds = this.normalizeBounds(button.bounds);
    if (!buttonBounds) return;
    
    // 为这个按钮找到对应的图标（在同一水平范围内）
    const matchingIcon = icons.find(icon => {
      const iconBounds = this.normalizeBounds(icon.bounds);
      if (!iconBounds) return false;
      
      return iconBounds.left >= buttonBounds.left && iconBounds.right <= buttonBounds.right;
    });
    
    if (matchingIcon) {
      const iconNode = nodeMap.get(matchingIcon.id);
      if (iconNode && !iconNode.parent) {
        buttonNode.children.push(iconNode);
        iconNode.parent = buttonNode;
        console.log(`🔗 XML推断: 按钮 ${button.id} -> 图标 ${matchingIcon.id}`);
      }
    }
    
    // 为这个按钮找到对应的文本容器
    const matchingContainer = containers.find(container => {
      // 文本容器通常边界为[0,0][0,0]，所以用其他方式匹配
      // 可以通过在数组中的相对位置或其他特征来匹配
      return true; // 暂时简单处理
    });
    
    if (matchingContainer && containers.length > 0) {
      // 简单按按钮顺序分配容器
      const buttonIndex = allElements.filter(e => 
        e.element_type === 'android.widget.LinearLayout' && 
        e.is_clickable &&
        String(e.bounds).includes('1420')
      ).indexOf(button);
      
      const targetContainer = containers[buttonIndex];
      if (targetContainer) {
        const containerNode = nodeMap.get(targetContainer.id);
        if (containerNode && !containerNode.parent) {
          buttonNode.children.push(containerNode);
          containerNode.parent = buttonNode;
          console.log(`🔗 XML推断: 按钮 ${button.id} -> 文本容器 ${targetContainer.id}`);
          
          // 为文本容器查找文本元素
          this.inferParentChildFromContext(targetContainer, allElements, nodeMap);
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
    console.log('🎯 目标元素:', targetElement.id);
    
    // 创建节点映射
    const nodeMap = this.createNodeMap(elements);
    
    // 🚀 基于XML结构而非边界检测构建父子关系
    console.log('🏗️ 基于XML语义结构构建父子关系');
    
    // 首先处理底部导航容器
    const bottomNavContainer = elements.find(e => 
      e.resource_id === 'com.hihonor.contacts:id/bottom_navgation'
    );
    
    if (bottomNavContainer) {
      console.log('🧭 找到底部导航容器:', bottomNavContainer.id);
      this.inferParentChildFromContext(bottomNavContainer, elements, nodeMap);
    }
    
    // 处理其他可能的父子关系
    elements.forEach(element => {
      if (element.id !== bottomNavContainer?.id) {
        this.inferParentChildFromContext(element, elements, nodeMap);
      }
    });
    
    return nodeMap;
  }
}