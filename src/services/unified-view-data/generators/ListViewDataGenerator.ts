// src/services/unified-view-data/generators/ListViewDataGenerator.ts
// module: shared | layer: unknown | role: component
// summary: ListViewDataGenerator.ts 文件

/**
 * 列表视图数据生成器
 * 为列表视图生成分组、过滤和搜索数据
 */

import { EnhancedUIElement, ListViewData, ElementStatistics, SearchIndex } from '../types';

export class ListViewDataGenerator {
  /**
   * 生成列表视图数据
   */
  static async generate(elements: EnhancedUIElement[]): Promise<ListViewData> {
    console.log('📋 生成列表视图数据...');

    // 1. 按类型分组
    const groupedElements = this.groupElementsByType(elements);

    // 2. 应用默认过滤
    const filteredElements = this.applyDefaultFilters(elements);

    // 3. 生成统计信息
    const statistics = this.generateStatistics(elements);

    // 4. 构建搜索索引
    const searchIndex = this.buildSearchIndex(elements);

    return {
      groupedElements,
      filteredElements,
      statistics,
      searchIndex,
    };
  }

  /**
   * 按类型分组元素
   */
  private static groupElementsByType(elements: EnhancedUIElement[]): Record<string, EnhancedUIElement[]> {
    const groups: Record<string, EnhancedUIElement[]> = {};

    for (const element of elements) {
      const groupKey = this.getGroupKey(element);
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(element);
    }

    // 按质量分数排序每个组内的元素
    for (const group of Object.values(groups)) {
      group.sort((a, b) => b.qualityScore - a.qualityScore);
    }

    return groups;
  }

  /**
   * 应用默认过滤
   */
  private static applyDefaultFilters(elements: EnhancedUIElement[]): EnhancedUIElement[] {
    return elements.filter(element => {
      // 过滤掉质量分数过低的元素
      if (element.qualityScore < 30) return false;
      
      // 过滤掉过小的元素
      const area = this.calculateArea(element.bounds);
      if (area < 10) return false;
      
      // 过滤掉不可见元素
      if (element.bounds.right <= element.bounds.left || 
          element.bounds.bottom <= element.bounds.top) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // 按质量分数和交互性排序
      if (a.qualityScore !== b.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      
      if (a.is_clickable !== b.is_clickable) {
        return a.is_clickable ? -1 : 1;
      }
      
      return 0;
    });
  }

  /**
   * 生成统计信息
   */
  private static generateStatistics(elements: EnhancedUIElement[]): ElementStatistics {
    let interactableCount = 0;
    let visibleCount = 0;
    const categorized: Record<string, number> = {};

    for (const element of elements) {
      // 统计交互元素
      if (element.is_clickable || element.is_scrollable) {
        interactableCount++;
      }
      
      // 统计可见元素
      if (this.isElementVisible(element)) {
        visibleCount++;
      }
      
      // 统计分类
      const category = element.visualCategory;
      categorized[category] = (categorized[category] || 0) + 1;
    }

    return {
      totalElements: elements.length,
      interactableElements: interactableCount,
      visibleElements: visibleCount,
      categorizedElements: categorized,
    };
  }

  /**
   * 构建搜索索引
   */
  private static buildSearchIndex(elements: EnhancedUIElement[]): SearchIndex {
    const textIndex = new Map<string, string[]>();
    const attributeIndex = new Map<string, string[]>();
    const fastLookup = new Map<string, EnhancedUIElement>();

    for (const element of elements) {
      // 文本索引
      if (element.text) {
        const words = element.text.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 1) {
            if (!textIndex.has(word)) {
              textIndex.set(word, []);
            }
            textIndex.get(word)!.push(element.id);
          }
        }
      }

      // 属性索引
      const searchableAttributes = [
        element.resource_id,
        element.content_desc,
        element.element_type,
        element.class_name,
        element.visualCategory,
        element.functionality,
        element.interactionType,
      ];

      for (const attr of searchableAttributes) {
        if (attr) {
          const key = attr.toLowerCase();
          if (!attributeIndex.has(key)) {
            attributeIndex.set(key, []);
          }
          attributeIndex.get(key)!.push(element.id);
        }
      }

      // 快速查找
      fastLookup.set(element.id, element);
    }

    return {
      textIndex,
      attributeIndex,
      fastLookup,
    };
  }

  /**
   * 获取分组键
   */
  private static getGroupKey(element: EnhancedUIElement): string {
    // 优先按功能分组
    if (element.functionality !== 'unknown') {
      return `功能: ${element.functionality}`;
    }
    
    // 其次按视觉分类分组
    if (element.visualCategory !== 'unknown') {
      return `类型: ${element.visualCategory}`;
    }
    
    // 最后按元素类型分组
    const simpleType = element.element_type.split('.').pop() || element.element_type;
    return `元素: ${simpleType}`;
  }

  /**
   * 计算元素面积
   */
  private static calculateArea(bounds: any): number {
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }

  /**
   * 检查元素是否可见
   */
  private static isElementVisible(element: EnhancedUIElement): boolean {
    const area = this.calculateArea(element.bounds);
    return area > 1 && 
           element.bounds.right > element.bounds.left && 
           element.bounds.bottom > element.bounds.top;
  }
}