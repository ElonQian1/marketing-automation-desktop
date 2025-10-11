// src/api/universal-ui/UniversalUIUtils.ts
// module: api | layer: api | role: universal-ui-utils
// summary: Universal UI工具函数，提供UI操作的辅助工具

/**
 * Universal UI 工具函数
 * 提供元素操作和分析的实用工具
 */

import { invoke } from '@tauri-apps/api/core';
import type { UIElement, ElementBounds } from './types';

/**
 * Universal UI 工具类
 */
export class UniversalUIUtils {

  /**
   * 去重元素
   */
  static async deduplicateElements(elements: UIElement[]): Promise<UIElement[]> {
    try {
      return await invoke<UIElement[]>('deduplicate_elements', { elements });
    } catch (error) {
      console.error('Failed to deduplicate elements:', error);
      throw new Error(`去重元素失败: ${error}`);
    }
  }

  /**
   * 获取元素的可读描述
   */
  static getElementDescription(element: UIElement): string {
    const parts: string[] = [];
    
    if (element.text.trim()) {
      parts.push(`文本: "${element.text}"`);
    }
    
    if (element.content_desc) {
      parts.push(`描述: "${element.content_desc}"`);
    }
    
    if (element.resource_id) {
      parts.push(`ID: ${element.resource_id}`);
    }
    
    parts.push(`类型: ${element.element_type}`);
    
    const states: string[] = [];
    if (element.is_clickable) states.push('可点击');
    if (element.is_scrollable) states.push('可滚动');
    if (element.is_enabled) states.push('启用');
    if (element.checkable) states.push('可选择');
    if (element.checked) states.push('已选择');
    
    if (states.length > 0) {
      parts.push(`状态: ${states.join(', ')}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * 计算元素中心点坐标
   */
  static getElementCenter(bounds: ElementBounds): { x: number; y: number } {
    return {
      x: Math.round((bounds.left + bounds.right) / 2),
      y: Math.round((bounds.top + bounds.bottom) / 2),
    };
  }

  /**
   * 过滤可交互的元素
   */
  static filterInteractiveElements(elements: UIElement[]): UIElement[] {
    return elements.filter(element => 
      element.is_clickable || 
      element.is_scrollable || 
      element.checkable ||
      element.element_type === 'EditText' ||
      element.element_type === 'Button'
    );
  }

  /**
   * 按类型分组元素
   */
  static groupElementsByType(elements: UIElement[]): Record<string, UIElement[]> {
    const grouped: Record<string, UIElement[]> = {};
    
    elements.forEach(element => {
      const type = element.element_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(element);
    });
    
    return grouped;
  }

  /**
   * 搜索包含指定文本的元素
   */
  static searchElementsByText(elements: UIElement[], searchText: string): UIElement[] {
    const lowerSearchText = searchText.toLowerCase();
    
    return elements.filter(element =>
      element.text.toLowerCase().includes(lowerSearchText) ||
      (element.content_desc && element.content_desc.toLowerCase().includes(lowerSearchText)) ||
      (element.resource_id && element.resource_id.toLowerCase().includes(lowerSearchText))
    );
  }

  /**
   * 计算元素的尺寸
   */
  static getElementSize(bounds: ElementBounds): { width: number; height: number } {
    return {
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top
    };
  }

  /**
   * 检查两个元素是否重叠
   */
  static isElementsOverlapping(bounds1: ElementBounds, bounds2: ElementBounds): boolean {
    return !(bounds1.right <= bounds2.left || 
             bounds2.right <= bounds1.left || 
             bounds1.bottom <= bounds2.top || 
             bounds2.bottom <= bounds1.top);
  }

  /**
   * 计算两个元素边界的距离
   */
  static calculateDistance(bounds1: ElementBounds, bounds2: ElementBounds): number {
    const center1 = this.getElementCenter(bounds1);
    const center2 = this.getElementCenter(bounds2);
    
    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );
  }

  /**
   * 按区域过滤元素
   */
  static filterElementsByRegion(
    elements: UIElement[], 
    region: ElementBounds
  ): UIElement[] {
    return elements.filter(element => 
      element.bounds.left >= region.left &&
      element.bounds.top >= region.top &&
      element.bounds.right <= region.right &&
      element.bounds.bottom <= region.bottom
    );
  }

  /**
   * 查找最近的元素
   */
  static findNearestElement(
    targetElement: UIElement, 
    candidates: UIElement[]
  ): UIElement | null {
    if (candidates.length === 0) return null;

    let nearest = candidates[0];
    let minDistance = this.calculateDistance(targetElement.bounds, nearest.bounds);

    for (let i = 1; i < candidates.length; i++) {
      const distance = this.calculateDistance(targetElement.bounds, candidates[i].bounds);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = candidates[i];
      }
    }

    return nearest;
  }

  /**
   * 验证元素边界的有效性
   */
  static isValidBounds(bounds: ElementBounds): boolean {
    return bounds.right > bounds.left && 
           bounds.bottom > bounds.top &&
           bounds.left >= 0 && 
           bounds.top >= 0;
  }
}