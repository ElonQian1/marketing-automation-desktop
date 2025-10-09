/**
 * 元素验证与操作工具
 * 
 * @description 统一的元素处理函数集合
 */

import type { ElementLike, ElementContext } from '../types/element';
import type { BoundsRect } from '../types/geometry';
import { UnifiedBoundsParser } from './boundsParser';

/**
 * 统一的元素工具类
 */
export class UnifiedElementUtils {
  /**
   * 验证元素是否有效
   * 
   * @param element 元素对象
   * @returns 是否为有效元素
   */
  static isValidElement(element: any): element is ElementLike {
    if (!element || typeof element !== 'object') {
      return false;
    }

    // 基本字段检查
    const hasBasicFields = (
      typeof element.class === 'string' ||
      typeof element['resource-id'] === 'string' ||
      typeof element.text === 'string' ||
      typeof element['content-desc'] === 'string'
    );

    return hasBasicFields;
  }

  /**
   * 获取元素的可读标识符
   * 
   * @param element 元素
   * @returns 可读的标识符字符串
   */
  static getElementIdentifier(element: ElementLike | null): string {
    if (!element) return '[无效元素]';

    const identifiers: string[] = [];

    if (element['resource-id']) {
      identifiers.push(`id:${element['resource-id']}`);
    }

    if (element.text?.trim()) {
      identifiers.push(`text:"${element.text.trim()}"`);
    }

    if (element['content-desc']?.trim()) {
      identifiers.push(`desc:"${element['content-desc'].trim()}"`);
    }

    if (element.class) {
      const shortClass = element.class.split('.').pop() || element.class;
      identifiers.push(`class:${shortClass}`);
    }

    if (identifiers.length === 0) {
      return `[${element.class || '未知元素'}]`;
    }

    return identifiers.join(' ');
  }

  /**
   * 获取元素的边界信息
   * 
   * @param element 元素
   * @returns 边界矩形或null
   */
  static getElementBounds(element: ElementLike | null): BoundsRect | null {
    if (!element?.bounds) return null;
    return UnifiedBoundsParser.parseBounds(element.bounds);
  }

  /**
   * 判断元素是否可点击
   * 
   * @param element 元素
   * @returns 是否可点击
   */
  static isClickable(element: ElementLike | null): boolean {
    if (!element) return false;

    // 明确标记为可点击
    if (element.clickable === true) {
      return true;
    }

    // 特定类型默认可点击
    const clickableClasses = [
      'Button', 'ImageButton', 'ImageView',
      'TextView', 'EditText', 'CheckBox',
      'RadioButton', 'Switch', 'ToggleButton'
    ];

    const className = element.class || '';
    const shortClass = className.split('.').pop() || '';
    
    return clickableClasses.some(cls => 
      shortClass.includes(cls) || className.includes(cls)
    );
  }

  /**
   * 判断元素是否为文本输入框
   * 
   * @param element 元素
   * @returns 是否为输入框
   */
  static isInputField(element: ElementLike | null): boolean {
    if (!element) return false;

    const className = element.class || '';
    const shortClass = className.split('.').pop() || '';

    return (
      shortClass.includes('EditText') ||
      className.includes('EditText') ||
      element.focusable === true
    );
  }

  /**
   * 判断元素是否包含文本
   * 
   * @param element 元素
   * @returns 是否包含文本
   */
  static hasText(element: ElementLike | null): boolean {
    if (!element) return false;
    return !!(element.text?.trim() || element['content-desc']?.trim());
  }

  /**
   * 获取元素的显示文本（优先text，其次content-desc）
   * 
   * @param element 元素
   * @returns 显示文本
   */
  static getDisplayText(element: ElementLike | null): string {
    if (!element) return '';
    
    const text = element.text?.trim();
    if (text) return text;

    const desc = element['content-desc']?.trim();
    if (desc) return desc;

    return '';
  }

  /**
   * 判断元素是否在屏幕可见区域内
   * 
   * @param element 元素
   * @param screenBounds 屏幕边界（可选）
   * @returns 是否可见
   */
  static isVisible(element: ElementLike | null, screenBounds?: BoundsRect): boolean {
    if (!element) return false;

    const bounds = this.getElementBounds(element);
    if (!bounds || !UnifiedBoundsParser.isValidBounds(bounds)) {
      return false;
    }

    // 如果提供了屏幕边界，检查是否在可见范围内
    if (screenBounds) {
      return UnifiedBoundsParser.isOverlapping(bounds, screenBounds);
    }

    // 基本可见性检查：元素有有效尺寸
    return bounds.right > bounds.left && bounds.bottom > bounds.top;
  }

  /**
   * 比较两个元素是否相同（基于关键属性）
   * 
   * @param element1 第一个元素
   * @param element2 第二个元素
   * @returns 是否相同
   */
  static isSameElement(element1: ElementLike | null, element2: ElementLike | null): boolean {
    if (!element1 || !element2) return element1 === element2;

    // 比较关键属性
    const props = ['resource-id', 'class', 'text', 'content-desc', 'bounds'] as const;
    
    return props.every(prop => element1[prop] === element2[prop]);
  }

  /**
   * 创建元素的简化副本（仅保留核心属性）
   * 
   * @param element 原始元素
   * @returns 简化的元素副本
   */
  static createSimplifiedElement(element: ElementLike): Partial<ElementLike> {
    const {
      'resource-id': resourceId,
      class: className,
      text,
      'content-desc': contentDesc,
      bounds,
      clickable,
      focusable,
      enabled,
      ...others
    } = element;

    return {
      'resource-id': resourceId,
      class: className,
      text,
      'content-desc': contentDesc,
      bounds,
      clickable,
      focusable,
      enabled,
    };
  }

  /**
   * 创建元素上下文信息
   * 
   * @param element 目标元素
   * @param parent 父元素（可选）
   * @param siblings 兄弟元素（可选）
   * @param children 子元素（可选）
   * @returns 元素上下文
   */
  static createElementContext(
    element: ElementLike,
    parent?: ElementLike | null,
    siblings?: ElementLike[],
    children?: ElementLike[]
  ): ElementContext {
    return {
      element,
      parent: parent || undefined,
      siblings: siblings || [],
      children: children || [],
      depth: 0,
      path: this.getElementIdentifier(element),
      xmlContent: '',
    };
  }

  /**
   * 根据文本内容查找相似元素
   * 
   * @param elements 元素列表
   * @param targetText 目标文本
   * @param threshold 相似度阈值（0-1）
   * @returns 相似的元素列表
   */
  static findSimilarByText(
    elements: ElementLike[],
    targetText: string,
    threshold: number = 0.8
  ): ElementLike[] {
    if (!targetText.trim()) return [];

    return elements.filter(element => {
      const elementText = this.getDisplayText(element);
      if (!elementText) return false;

      const similarity = this.calculateTextSimilarity(elementText, targetText);
      return similarity >= threshold;
    });
  }

  /**
   * 计算两个文本的相似度
   * 
   * @param text1 第一个文本
   * @param text2 第二个文本
   * @returns 相似度（0-1）
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const str1 = text1.toLowerCase().trim();
    const str2 = text2.toLowerCase().trim();

    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    // 简单的编辑距离计算
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }
}

// 兼容性导出
export const isValidElement = UnifiedElementUtils.isValidElement;
export const getElementIdentifier = UnifiedElementUtils.getElementIdentifier;
export const getElementBounds = UnifiedElementUtils.getElementBounds;
export const isClickable = UnifiedElementUtils.isClickable;