// src/components/universal-ui/data-transform/ElementContextCreator.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 元素上下文创建器
 * 负责为VisualUIElement创建完整的上下文信息
 */

import { VisualUIElement } from '../xml-parser/types';
import { UIElement } from '../../../api/universalUIAPI';
import { ElementContext } from './types';
import type { ElementLike } from '../../../modules/intelligent-strategy-system/shared/types/element';

export class ElementContextCreator {
  
  /**
   * 为可视化元素创建完整的上下文信息
   * @param element 可视化元素
   * @param allElements 所有元素（用于建立关系）
   * @param screenSize 屏幕尺寸
   * @returns 元素上下文
   */
  static createElementContext(
    element: VisualUIElement,
    allElements: VisualUIElement[] = [],
    screenSize: { width: number; height: number } = { width: 1080, height: 1920 }
  ): ElementContext {
    
    const position = element.position || { x: 0, y: 0, width: 100, height: 50 };
    
    // 基本上下文信息
    const context: ElementContext = {
      element: {
        'resource-id': '', // 需要从原始XML获取
        text: element.text || '',
        'content-desc': element.description || '',
        class: element.type || '',
        clickable: element.clickable || false,
        enabled: true,
        bounds: this.formatBounds(position)
      },
      siblings: [], // 稍后填充
      parent: undefined, // 稍后填充
      children: [], // 稍后填充
      depth: 0, // 稍后计算
      path: '', // 稍后生成
      xmlContent: '' // 稍后填充
    };
    
    // 如果提供了所有元素，建立关系
    if (allElements.length > 0) {
      this.establishRelationships(element, context, allElements);
    }
    
    return context;
  }

  /**
   * 批量创建元素上下文
   * @param elements 可视化元素数组
   * @param screenSize 屏幕尺寸
   * @returns 元素上下文数组
   */
  static createContextsBatch(
    elements: VisualUIElement[],
    screenSize: { width: number; height: number } = { width: 1080, height: 1920 }
  ): ElementContext[] {
    return elements.map(element => 
      this.createElementContext(element, elements, screenSize)
    );
  }

  /**
   * 创建简化的上下文信息（兼容旧接口）
   * @param element 可视化元素
   * @returns 简化的上下文信息
   */
  static createSimpleContext(element: VisualUIElement): ElementContext {
    const position = element.position || { x: 0, y: 0, width: 100, height: 50 };
    
    return {
      element: {
        'resource-id': '',
        text: element.text || '',
        'content-desc': element.description || '',
        class: element.type || '',
        clickable: element.clickable || false,
        enabled: true,
        bounds: this.formatBounds(position)
      },
      siblings: [],
      parent: undefined,
      children: [],
      depth: 0,
      path: '',
      xmlContent: ''
    };
  }

  /**
   * 格式化边界信息为字符串
   * @param position 位置信息
   * @returns 边界字符串
   */
  private static formatBounds(position: { x: number; y: number; width: number; height: number }): string {
    return `[${position.x},${position.y}][${position.x + position.width},${position.y + position.height}]`;
  }

  /**
   * 推断元素是否可滚动
   * @param element 可视化元素
   * @returns 是否可滚动
   */
  private static inferScrollable(element: VisualUIElement): boolean {
    const type = element.type?.toLowerCase() || '';
    const scrollableTypes = [
      'scrollview', 
      'recyclerview', 
      'listview', 
      'viewpager',
      'nestedscrollview',
      'horizontalscrollview'
    ];
    
    return scrollableTypes.some(scrollType => type.includes(scrollType));
  }

  /**
   * 推断元素是否可勾选
   * @param element 可视化元素
   * @returns 是否可勾选
   */
  private static inferCheckable(element: VisualUIElement): boolean {
    const type = element.type?.toLowerCase() || '';
    const text = element.text?.toLowerCase() || '';
    const desc = element.description?.toLowerCase() || '';
    
    const checkableTypes = ['checkbox', 'radiobutton', 'switch', 'togglebutton'];
    const checkableKeywords = ['选择', '勾选', '开关', '切换'];
    
    return checkableTypes.some(checkType => type.includes(checkType)) ||
           checkableKeywords.some(keyword => text.includes(keyword) || desc.includes(keyword));
  }

  /**
   * 建立元素之间的关系
   * @param currentElement 当前元素
   * @param context 当前元素上下文
   * @param allElements 所有元素
   */
  private static establishRelationships(
    currentElement: VisualUIElement,
    context: ElementContext,
    allElements: VisualUIElement[]
  ): void {
    
    // 简化的关系推断逻辑
    const currentBounds = currentElement.position;
    if (!currentBounds) return;
    
    for (const otherElement of allElements) {
      if (otherElement.id === currentElement.id) continue;
      
      const otherBounds = otherElement.position;
      if (!otherBounds) continue;
      
      // 判断是否为父子关系（简化版本：通过包含关系判断）
      if (this.isContainedIn(otherBounds, currentBounds)) {
        // otherElement 可能是 currentElement 的子元素
        const childElement = this.convertToElementLike(otherElement);
        context.children.push(childElement);
      } else if (this.isContainedIn(currentBounds, otherBounds)) {
        // otherElement 可能是 currentElement 的父元素
        context.parent = this.convertToElementLike(otherElement);
      } else if (this.areSiblings(currentBounds, otherBounds)) {
        // 可能是兄弟元素（相同层级）
        const siblingElement = this.convertToElementLike(otherElement);
        context.siblings.push(siblingElement);
      }
    }
  }

  /**
   * 判断一个元素是否包含在另一个元素中
   * @param container 容器元素边界
   * @param contained 被包含元素边界
   * @returns 是否包含
   */
  private static isContainedIn(
    container: { x: number; y: number; width: number; height: number },
    contained: { x: number; y: number; width: number; height: number }
  ): boolean {
    return container.x <= contained.x &&
           container.y <= contained.y &&
           (container.x + container.width) >= (contained.x + contained.width) &&
           (container.y + container.height) >= (contained.y + contained.height);
  }

  /**
   * 判断两个元素是否为兄弟关系（简化版本）
   * @param bounds1 第一个元素边界
   * @param bounds2 第二个元素边界
   * @returns 是否为兄弟关系
   */
  private static areSiblings(
    bounds1: { x: number; y: number; width: number; height: number },
    bounds2: { x: number; y: number; width: number; height: number }
  ): boolean {
    // 简化的兄弟判断：y坐标接近且不重叠
    const yDiff = Math.abs(bounds1.y - bounds2.y);
    const heightThreshold = Math.min(bounds1.height, bounds2.height) * 0.5;
    
    return yDiff < heightThreshold && !this.isOverlapping(bounds1, bounds2);
  }

  /**
   * 判断两个元素是否重叠
   * @param bounds1 第一个元素边界
   * @param bounds2 第二个元素边界
   * @returns 是否重叠
   */
  private static isOverlapping(
    bounds1: { x: number; y: number; width: number; height: number },
    bounds2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(bounds1.x + bounds1.width <= bounds2.x || 
             bounds2.x + bounds2.width <= bounds1.x || 
             bounds1.y + bounds1.height <= bounds2.y || 
             bounds2.y + bounds2.height <= bounds1.y);
  }

  /**
   * 为子元素创建简化上下文
   * @param element 子元素  
   * @returns 简化上下文
   */
  private static createSimpleChildContext(element: VisualUIElement): ElementContext {
    const position = element.position || { x: 0, y: 0, width: 100, height: 50 };
    
    return {
      element: {
        'resource-id': '',
        text: element.text || '',
        'content-desc': element.description || '',
        class: element.type || '',
        clickable: element.clickable || false,
        enabled: true,
        bounds: this.formatBounds(position)
      },
      siblings: [],
      parent: undefined,
      children: [],
      depth: 0,
      path: '',
      xmlContent: ''
    };
  }

  /**
   * 为父元素创建简化上下文
   * @param element 父元素
   * @returns 简化上下文
   */
  private static createSimpleParentContext(element: VisualUIElement): ElementContext {
    return this.createSimpleChildContext(element); // 使用相同的简化逻辑
  }

  /**
   * 为兄弟元素创建简化上下文
   * @param element 兄弟元素
   * @returns 简化上下文
   */
  private static createSimpleSiblingContext(element: VisualUIElement): ElementContext {
    return this.createSimpleChildContext(element); // 使用相同的简化逻辑
  }

  /**
   * 从UIElement创建ElementContext
   * @param element UIElement
   * @returns ElementContext
   */
  static createContextFromUIElement(element: UIElement): ElementContext {
    return {
      element: {
        'resource-id': '', // UIElement通常没有resourceId信息
        text: element.text || '',
        'content-desc': element.content_desc || '',
        class: element.element_type || '',
        clickable: element.is_clickable || false,
        enabled: element.is_enabled !== false,
        bounds: `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`
      },
      siblings: [],
      parent: undefined,
      children: [],
      depth: 0,
      path: '',
      xmlContent: ''
    };
  }

  /**
   * 将VisualUIElement转换为ElementLike
   */
  private static convertToElementLike(element: VisualUIElement): ElementLike {
    const position = element.position || { x: 0, y: 0, width: 100, height: 50 };
    return {
      'resource-id': '', // VisualUIElement没有resource-id
      text: element.text || '',
      'content-desc': element.description || '',
      class: element.type || '',
      clickable: element.clickable || false,
      enabled: true,
      bounds: this.formatBounds(position)
    };
  }
}