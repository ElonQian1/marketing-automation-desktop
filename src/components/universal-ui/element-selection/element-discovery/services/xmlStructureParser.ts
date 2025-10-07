import type { UIElement, ElementBounds } from '../../../../../api/universal-ui';
import type { HierarchyNode } from '../../../../../types/hierarchy';

// HierarchyNode 类型定义已迁移到 /src/types/hierarchy.ts
// 此文件中的定义已废弃，请使用统一的类型定义

/**
 * XML 结构解析服务
 * 专注于基于 XML 语义构建正确的父子关系，不依赖边界检测
 */
export class XmlStructureParser {
  
  /**
   * 根据 XML 语义推断父子关系
   * 针对小红书通讯录底部导航栏的特殊处理
            if (isDirectParent) {
            parentNode.children.push(childNode);
            childNode.parent = parentNode;
            
            // 记录关系建立，但不需要计数器
            const isTextChild = potentialChild.text || potentialChild.content_desc;
            if (isTextChild && (potentialChild.text === '电话' || potentialChild.text === '联系人' || potentialChild.text === '收藏')) {
              console.log(`  ✅ 关键导航文本: ${potentialParent.id} -> ${potentialChild.text}`);
            }
          }ferParentChildFromContext(
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
        e.bounds.top >= 1420 // 底部导航按钮的高度特征 - 修复bounds对象访问
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
    
    const buttonBounds = this.normalizeBounds(button.bounds);
    if (!buttonBounds) {
      return;
    }

    // 查找所有可能的子元素（在按钮边界内的元素）
    const potentialChildren = allElements.filter((element) => {
      if (element.id === button.id) return false; // 排除自己
      
      const elementBounds = this.normalizeBounds(element.bounds);
      if (!elementBounds) return false;

      // 检查元素是否在按钮边界内
      const isContained = (
        elementBounds.left >= buttonBounds.left &&
        elementBounds.right <= buttonBounds.right &&
        elementBounds.top >= buttonBounds.top &&
        elementBounds.bottom <= buttonBounds.bottom
      );

      if (isContained) {
        // 发现子元素，但不输出详细日志
      }

      return isContained;
    });

    // 找到潜在子元素，开始建立关系

    // 按照层级优先级建立父子关系
    // 1. 直接子元素（图标、文本容器和文本元素）
    const directChildren = potentialChildren.filter((element) => {
      // 图标元素
      if (element.element_type === "android.widget.ImageView") {
        return true;
      }
      
      // 文本容器
      if (element.element_type === "android.widget.LinearLayout") {
        return true;
      }
      
      // 直接的文本元素（如果没有中间容器）
      if (element.element_type === "android.widget.TextView" || 
          (element.text && element.text.trim().length > 0) ||
          (element.content_desc && element.content_desc.trim().length > 0)) {
        return true;
      }
      
      return false;
    });

    // 建立直接父子关系
    directChildren.forEach((child) => {
      const childNode = nodeMap.get(child.id);
      if (childNode && !childNode.parent) {
        buttonNode.children.push(childNode);
        childNode.parent = buttonNode;
        
        // 只记录关键文本元素
        if (child.text === '电话' || child.text === '联系人' || child.text === '收藏') {
          console.log(`✅ 导航文本关联: ${button.id} -> "${child.text}"`);
        }
        
        // 如果是布局容器，继续查找其文本子元素
        if (child.element_type === "android.widget.LinearLayout") {
          this.findTextChildrenForContainer(child, allElements, nodeMap);
        }
      }
    });
  }

  /**
   * 为文本容器查找其文本子元素
   */
  static findTextChildrenForContainer(
    container: UIElement,
    allElements: UIElement[],
    nodeMap: Map<string, HierarchyNode>
  ): void {
    // 为文本容器查找文本子元素
    const containerNode = nodeMap.get(container.id);
    if (!containerNode) return;

    const containerBounds = this.normalizeBounds(container.bounds);
    if (!containerBounds) return;

    // 查找在容器边界内的文本元素 - 使用更宽松的条件
    const textChildren = allElements.filter((element) => {
      if (element.id === container.id) return false;
      
      // 更宽松的文本元素识别：任何 TextView 或包含文本内容的元素
      const isTextElement = element.element_type === "android.widget.TextView" || 
                          (element.text && element.text.trim().length > 0) ||
                          (element.content_desc && element.content_desc.trim().length > 0);
      
      if (!isTextElement) return false;
      
      const elementBounds = this.normalizeBounds(element.bounds);
      if (!elementBounds) return false;

      // 检查是否在容器边界内
      return (
        elementBounds.left >= containerBounds.left &&
        elementBounds.right <= containerBounds.right &&
        elementBounds.top >= containerBounds.top &&
        elementBounds.bottom <= containerBounds.bottom
      );
    });

    textChildren.forEach((textElement) => {
      const textNode = nodeMap.get(textElement.id);
      if (textNode && !textNode.parent) {
        containerNode.children.push(textNode);
        textNode.parent = containerNode;
        
        // 只记录关键导航文本
        if (textElement.text === '电话' || textElement.text === '联系人' || textElement.text === '收藏') {
          console.log(`✅ 文本容器关联: ${container.id} -> "${textElement.text}"`);
        }
      }
    });
  }  /**
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
   * @param elements - UI元素数组
   * @param mode - 使用模式，默认为 element-discovery
   */
  static createNodeMap(elements: UIElement[], mode: 'element-discovery' | 'visualization' = 'element-discovery'): Map<string, HierarchyNode> {
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
        isHidden: this.checkIsHiddenElement(element, mode),
        relationship: 'sibling',
        path: ''
      });
    });
    
    return nodeMap;
  }
  
  /**
   * 检查元素是否为隐藏元素
   * 基于元素特征判断是否应该在层级中显示
   * @param element - 要检查的UI元素
   * @param mode - 使用模式：'element-discovery' | 'visualization'
   */
  static checkIsHiddenElement(element: UIElement, mode: 'element-discovery' | 'visualization' = 'visualization'): boolean {
    // 🔍 发现元素模式：显示完整的XML节点结构，不过滤任何元素
    if (mode === 'element-discovery') {
      // 只记录关键导航文本元素
      if (element.text === '电话' || element.text === '联系人' || element.text === '收藏') {
        console.log('🎯 保留导航文本:', element.text);
      }
      return false; // 在发现元素模式下，所有XML节点都应该可见
    }
    
    // 🎨 可视化视图模式：过滤掉布局无关或隐藏的元素
    if (mode === 'visualization') {
      // 如果bounds为零区域，可能是隐藏或占位元素
      if (element.bounds.left === 0 && element.bounds.top === 0 && 
          element.bounds.right === 0 && element.bounds.bottom === 0) {
        return true;
      }
      
      // 其他可视化相关的隐藏判断逻辑可以在这里添加
    }
    
    return false;
  }
  
  /**
   * 基于 XML 语义构建完整的层级关系
   * 这是主要的构建入口，专注于 XML 结构而非边界检测
   * @param elements - UI元素数组
   * @param targetElement - 目标元素
   * @param mode - 使用模式，默认为 element-discovery
   */
  static buildXmlBasedHierarchy(
    elements: UIElement[], 
    targetElement: UIElement,
    mode: 'element-discovery' | 'visualization' = 'element-discovery'
  ): Map<string, HierarchyNode> {
    console.log('🏗️ 构建架构图 - 模式:', mode);
    
    // 🔍 关注关键导航文本元素
    const navTextElements = elements.filter(el => 
      (el.text === '电话' || el.text === '联系人' || el.text === '收藏') &&
      el.bounds.left === 0 && el.bounds.top === 0 && 
      el.bounds.right === 0 && el.bounds.bottom === 0
    );
    
    if (navTextElements.length > 0) {
      console.log(`✅ 发现导航文本: ${navTextElements.map(el => el.text).join(', ')} (模式: ${mode})`);
    }
    
    // 创建节点映射 - 在发现元素模式下不过滤任何节点
    const nodeMap = this.createNodeMap(elements, mode);
    
    // 🚀 第一步：处理特殊的底部导航容器
    console.log('🏗️ 第一步：处理底部导航容器');
    const bottomNavContainer = elements.find(e => 
      e.resource_id === 'com.hihonor.contacts:id/bottom_navgation'
    );
    
    if (bottomNavContainer) {
      console.log('🧭 找到底部导航容器:', bottomNavContainer.id);
      // 设置为根节点
      const bottomNavNode = nodeMap.get(bottomNavContainer.id);
      if (bottomNavNode) {
        bottomNavNode.parent = null;
        console.log('🏠 将底部导航设置为根节点');
      }
    }
    
    // 🚀 第二步：处理所有其他元素的通用父子关系
    console.log('🏗️ 第二步：建立通用父子关系');
    this.buildGeneralParentChildRelations(elements, nodeMap);
    
    // 🚀 第三步：确保所有文本元素都有机会显示（发现元素模式下不过滤）
    console.log('🏗️ 第三步：确保文本元素可见性');
    this.ensureTextElementsVisibility(elements, nodeMap);
    
    return nodeMap;
  }

  /**
   * 建立通用的父子关系
   * 基于边界包含关系建立父子关系
   */
  static buildGeneralParentChildRelations(
    elements: UIElement[],
    nodeMap: Map<string, HierarchyNode>
  ): void {
    
    // 按照区域大小排序，面积大的在前（潜在的父容器）
    const sortedElements = [...elements].sort((a, b) => {
      const aArea = (a.bounds.right - a.bounds.left) * (a.bounds.bottom - a.bounds.top);
      const bArea = (b.bounds.right - b.bounds.left) * (b.bounds.bottom - b.bounds.top);
      return bArea - aArea; // 大的在前
    });


    for (let i = 0; i < sortedElements.length; i++) {
      const potentialParent = sortedElements[i];
      const parentNode = nodeMap.get(potentialParent.id);
      if (!parentNode) continue;

      const parentBounds = this.normalizeBounds(potentialParent.bounds);
      if (!parentBounds) continue;

      // 查找可能的子元素
      for (let j = i + 1; j < sortedElements.length; j++) {
        const potentialChild = sortedElements[j];
        const childNode = nodeMap.get(potentialChild.id);
        
        // 跳过已经有父节点的元素
        if (!childNode || childNode.parent) continue;

        const childBounds = this.normalizeBounds(potentialChild.bounds);
        if (!childBounds) continue;

        // 检查子元素是否在父元素边界内
        const isContained = (
          childBounds.left >= parentBounds.left &&
          childBounds.right <= parentBounds.right &&
          childBounds.top >= parentBounds.top &&
          childBounds.bottom <= parentBounds.bottom &&
          // 确保不是自己
          potentialParent.id !== potentialChild.id
        );

        if (isContained) {
          // 检查是否是直接父子关系（没有中间容器）
          const isDirectParent = this.isDirectParentChild(
            potentialParent, potentialChild, elements
          );

          if (isDirectParent) {
            parentNode.children.push(childNode);
            childNode.parent = parentNode;
            
            // 记录关键导航文本
            const isTextChild = potentialChild.text || potentialChild.content_desc;
            if (isTextChild && (potentialChild.text === '电话' || potentialChild.text === '联系人' || potentialChild.text === '收藏')) {
              console.log(`  ✅ 关键导航文本: ${potentialParent.id} -> ${potentialChild.text}`);
            }
            
            console.log(`  ✅ 建立关系: ${potentialParent.id} -> ${potentialChild.id} (${potentialChild.element_type})`);
            if (isTextChild) {
              console.log(`    📝 文本子元素: "${potentialChild.text || potentialChild.content_desc}"`);
            }
          }
        }
      }
    }
    
    // 构建关系统计完成
  }

  /**
   * 检查两个元素是否是直接父子关系
   * 避免跨层级的父子关系（即中间没有其他容器元素）
   */
  static isDirectParentChild(
    parent: UIElement,
    child: UIElement,
    allElements: UIElement[]
  ): boolean {
    const parentBounds = this.normalizeBounds(parent.bounds);
    const childBounds = this.normalizeBounds(child.bounds);
    
    if (!parentBounds || !childBounds) return false;

    // 查找是否有中间容器
    const intermediateContainers = allElements.filter(element => {
      if (element.id === parent.id || element.id === child.id) return false;
      
      const elementBounds = this.normalizeBounds(element.bounds);
      if (!elementBounds) return false;

      // 检查这个元素是否在parent和child之间
      const containsChild = (
        elementBounds.left <= childBounds.left &&
        elementBounds.right >= childBounds.right &&
        elementBounds.top <= childBounds.top &&
        elementBounds.bottom >= childBounds.bottom
      );

      const containedInParent = (
        elementBounds.left >= parentBounds.left &&
        elementBounds.right <= parentBounds.right &&
        elementBounds.top >= parentBounds.top &&
        elementBounds.bottom <= parentBounds.bottom
      );

      return containsChild && containedInParent;
    });

    // 如果没有中间容器，则是直接父子关系
    return intermediateContainers.length === 0;
  }
  
  /**
   * 递归记录子节点结构（用于调试）
   */
  static logChildrenRecursively(node: HierarchyNode, indent: string): void {
    node.children.forEach(child => {
      const textContent = child.element.text || child.element.content_desc || '';
      const hasText = textContent.trim().length > 0;
      console.log(`${indent}├─ ${child.id}(${child.element.element_type})${hasText ? ` "${textContent}"` : ' [无文本]'} [子元素:${child.children.length}]`);
      if (child.children.length > 0) {
        this.logChildrenRecursively(child, indent + '  ');
      }
    });
  }

  /**
   * 确保文本元素在发现元素模式下的可见性
   * 修复版本：基于XML父子关系而不是边界包含来建立层次结构
   */
  static ensureTextElementsVisibility(elements: UIElement[], nodeMap: Map<string, HierarchyNode>): void {
    console.log('🔍 确保文本元素可见性：开始检查孤立的文本元素');
    
    // 查找所有文本类型的元素
    const textElements = elements.filter(el => 
      el.element_type?.includes('TextView') || 
      (el.text && el.text.trim().length > 0) ||
      (el.content_desc && el.content_desc.trim().length > 0)
    );
    
    console.log(`📝 发现 ${textElements.length} 个文本元素`);
    
    // 检查哪些文本元素还没有建立父子关系
    const orphanTextElements = textElements.filter(el => {
      const node = nodeMap.get(el.id);
      return node && !node.parent;
    });
    
    console.log(`🔸 发现 ${orphanTextElements.length} 个孤立文本元素`);
    
    if (orphanTextElements.length > 0) {
      console.log('🔸 孤立文本元素列表:');
      orphanTextElements.forEach(el => {
        console.log(`  - ${el.id} (${el.element_type}): "${el.text || el.content_desc || 'N/A'}"`);
      });
      
      // 🔧 修复：基于XML hierarchy建立父子关系
      this.attachTextElementsByXmlHierarchy(orphanTextElements, elements, nodeMap);
    }
  }

  /**
   * 🔧 修复版本：基于XML层级关系附加文本元素
   * 不再依赖边界包含关系，而是基于XML的实际父子关系
   */
  static attachTextElementsByXmlHierarchy(
    orphanTextElements: UIElement[],
    allElements: UIElement[],
    nodeMap: Map<string, HierarchyNode>
  ): void {
    console.log('🔗 基于XML层级关系附加孤立文本元素');
    
    orphanTextElements.forEach(textEl => {
      const textNode = nodeMap.get(textEl.id);
      if (!textNode || textNode.parent) return;
      
      console.log(`🔍 为文本元素 ${textEl.id} ("${textEl.text || textEl.content_desc}") 寻找XML父容器`);
      
      // 🎯 基于XML结构的启发式匹配：
      // 对于导航按钮，通常结构是：
      // LinearLayout (可点击容器) -> ImageView (图标) + LinearLayout (文本容器) -> TextView (文本)
      
      // 1. 查找相近ID的可能父容器（文本容器）
      const textElementNum = this.extractElementNumber(textEl.id);
      let bestContainer: UIElement | null = null;
      
      if (textElementNum !== null) {
        // 查找相近ID的Layout容器（通常是文本的直接父容器）
        const potentialParents = allElements.filter(el => {
          const elNum = this.extractElementNumber(el.id);
          return elNum !== null && 
                 Math.abs(elNum - textElementNum) <= 2 && // ID相近
                 el.element_type?.includes('LinearLayout') && // 是Layout容器
                 el.id !== textEl.id && // 不是自己
                 el.bounds.left === 0 && el.bounds.top === 0 && // 也是隐藏容器
                 el.bounds.right === 0 && el.bounds.bottom === 0;
        });
        
        // 如果找到相近的隐藏Layout容器，选择ID最接近的
        if (potentialParents.length > 0) {
          bestContainer = potentialParents.reduce((closest, current) => {
            const closestNum = this.extractElementNumber(closest.id) || 0;
            const currentNum = this.extractElementNumber(current.id) || 0;
            const closestDiff = Math.abs(closestNum - textElementNum);
            const currentDiff = Math.abs(currentNum - textElementNum);
            return currentDiff < closestDiff ? current : closest;
          });
          
          // 🔧 重要：同时将文本容器关联到按钮
          if (bestContainer) {
            this.ensureContainerToButtonRelation(bestContainer, allElements, nodeMap);
          }
        }
      }
      
      // 建立父子关系
      if (bestContainer) {
        const containerNode = nodeMap.get(bestContainer.id);
        if (containerNode && !textNode.parent) {
          containerNode.children.push(textNode);
          textNode.parent = containerNode;
          console.log(`  ✅ 文本元素 ${textEl.id} ("${textEl.text}") 附加到容器 ${bestContainer.id} (${bestContainer.element_type})`);
        }
      } else {
        console.log(`  ⚠️ 未找到合适的XML父容器，文本元素 ${textEl.id} 保持为根元素`);
        // 文本元素将作为根元素显示，这在发现元素模式下是可接受的
      }
    });
  }

  /**
   * 🔧 确保文本容器正确关联到按钮
   */
  static ensureContainerToButtonRelation(
    container: UIElement,
    allElements: UIElement[],
    nodeMap: Map<string, HierarchyNode>
  ): void {
    const containerNode = nodeMap.get(container.id);
    if (!containerNode || containerNode.parent) {
      console.log(`  🔍 文本容器 ${container.id} 已有父节点或不存在，跳过关联`);
      return; // 已有父节点
    }
    
    const containerNum = this.extractElementNumber(container.id);
    if (containerNum === null) return;
    
    console.log(`  🔍 为文本容器 ${container.id} 寻找按钮父节点...`);
    
    // 查找相近ID的可点击按钮
    const candidateButtons = allElements.filter(el => {
      const elNum = this.extractElementNumber(el.id);
      return elNum !== null &&
             Math.abs(elNum - containerNum) <= 4 && // ID范围
             el.is_clickable === true && // 可点击的按钮
             el.element_type?.includes('LinearLayout'); // LinearLayout按钮
    });
    
    console.log(`  📋 找到 ${candidateButtons.length} 个候选按钮:`, candidateButtons.map(b => `${b.id}(可点击:${b.is_clickable})`));
    
    if (candidateButtons.length > 0) {
      const bestButton = candidateButtons.reduce((closest, current) => {
        const closestNum = this.extractElementNumber(closest.id) || 0;
        const currentNum = this.extractElementNumber(current.id) || 0;
        const closestDiff = Math.abs(closestNum - containerNum);
        const currentDiff = Math.abs(currentNum - containerNum);
        return currentDiff < closestDiff ? current : closest;
      });
      
      const buttonNode = nodeMap.get(bestButton.id);
      if (buttonNode) {
        buttonNode.children.push(containerNode);
        containerNode.parent = buttonNode;
        console.log(`  ✅ 文本容器 ${container.id} 成功关联到按钮 ${bestButton.id}`);
      } else {
        console.log(`  ❌ 找到按钮 ${bestButton.id} 但节点不存在`);
      }
    } else {
      console.log(`  ⚠️ 没有找到合适的按钮为文本容器 ${container.id}`);
    }
  }

  /**
   * 从元素ID中提取数字（用于相似性匹配）
   */
  static extractElementNumber(elementId: string): number | null {
    const match = elementId.match(/element_(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}