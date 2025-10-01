/**
 * 元素增强处理器
 * 将基础UI元素转换为增强的UI元素
 */

import { UIElement } from '../../../api/universal-ui';
import { EnhancedUIElement, EnhancementConfig } from '../types';

export class ElementEnhancer {
  private static readonly DEFAULT_CONFIG: EnhancementConfig = {
    enableHierarchyAnalysis: true,
    enableVisualCategorization: true,
    enableInteractionAnalysis: true,
    enableContextFingerprinting: true,
    qualityThresholds: {
      high: 80,
      medium: 60,
      low: 40,
    },
  };

  /**
   * 增强UI元素数组
   */
  static async enhance(
    elements: UIElement[], 
    config: Partial<EnhancementConfig> = {}
  ): Promise<EnhancedUIElement[]> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const enhanced: EnhancedUIElement[] = [];

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const enhancedElement = await this.enhanceElement(element, elements, i, finalConfig);
      enhanced.push(enhancedElement);
    }

    return enhanced;
  }

  /**
   * 增强单个元素
   */
  private static async enhanceElement(
    element: UIElement,
    allElements: UIElement[],
    index: number,
    config: EnhancementConfig
  ): Promise<EnhancedUIElement> {
    const enhanced: EnhancedUIElement = {
      ...element,
      depth: 0,
      hierarchyLevel: 'unknown',
      visualCategory: 'unknown',
      functionality: 'unknown',
      interactionType: 'none',
      parentContext: '',
      siblingContext: [],
      contextFingerprint: '',
      qualityScore: 0,
      reliability: 0,
    };

    // 层级分析
    if (config.enableHierarchyAnalysis) {
      this.analyzeHierarchy(enhanced, allElements);
    }

    // 视觉分类
    if (config.enableVisualCategorization) {
      this.categorizeVisually(enhanced);
    }

    // 交互分析
    if (config.enableInteractionAnalysis) {
      this.analyzeInteraction(enhanced);
    }

    // 上下文指纹
    if (config.enableContextFingerprinting) {
      this.generateContextFingerprint(enhanced, allElements, index);
    }

    // 质量评分
    enhanced.qualityScore = this.calculateQualityScore(enhanced, config.qualityThresholds);
    enhanced.reliability = this.calculateReliability(enhanced);

    return enhanced;
  }

  /**
   * 分析元素层级关系
   */
  private static analyzeHierarchy(element: EnhancedUIElement, allElements: UIElement[]): void {
    let depth = 0;
    const elementBounds = element.bounds;

    // 通过包含关系计算深度
    for (const other of allElements) {
      if (other.id !== element.id && this.isContainedBy(elementBounds, other.bounds)) {
        depth++;
      }
    }

    element.depth = depth;
    element.hierarchyLevel = this.getHierarchyLevel(depth);
  }

  /**
   * 视觉分类
   */
  private static categorizeVisually(element: EnhancedUIElement): void {
    const { element_type, bounds, text, is_clickable, is_scrollable } = element;
    
    // 基于元素类型和属性进行分类
    if (element_type.includes('Button') || is_clickable) {
      element.visualCategory = 'button';
    } else if (element_type.includes('Text') || text) {
      element.visualCategory = 'text';
    } else if (element_type.includes('Image')) {
      element.visualCategory = 'image';
    } else if (element_type.includes('Input') || element_type.includes('Edit')) {
      element.visualCategory = 'input';
    } else if (is_scrollable) {
      element.visualCategory = 'container';
    } else {
      element.visualCategory = 'other';
    }

    // 生成CSS位置
    if (bounds) {
      element.cssPosition = {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.right - bounds.left}px`,
        height: `${bounds.bottom - bounds.top}px`,
      };
    }
  }

  /**
   * 分析交互类型
   */
  private static analyzeInteraction(element: EnhancedUIElement): void {
    const { is_clickable, is_scrollable, element_type, text } = element;

    if (is_clickable) {
      if (element_type.includes('Button')) {
        element.interactionType = 'button-click';
        element.functionality = text || 'button';
      } else if (element_type.includes('Link')) {
        element.interactionType = 'navigation';
        element.functionality = 'navigate';
      } else {
        element.interactionType = 'tap';
        element.functionality = 'action';
      }
    } else if (is_scrollable) {
      element.interactionType = 'scroll';
      element.functionality = 'container';
    } else if (element_type.includes('Input') || element_type.includes('Edit')) {
      element.interactionType = 'input';
      element.functionality = 'data-entry';
    } else {
      element.interactionType = 'none';
      element.functionality = text ? 'display-text' : 'display-element';
    }
  }

  /**
   * 生成上下文指纹
   */
  private static generateContextFingerprint(
    element: EnhancedUIElement,
    allElements: UIElement[],
    index: number
  ): void {
    const siblings: string[] = [];
    let parentContext = '';

    // 查找父元素和兄弟元素
    for (const other of allElements) {
      if (other.id !== element.id) {
        if (this.isContainedBy(element.bounds, other.bounds)) {
          // 找到可能的父元素
          if (!parentContext || this.getArea(other.bounds) < this.getArea({ left: 0, top: 0, right: 1000, bottom: 1000 })) {
            parentContext = other.element_type + (other.text ? `:${other.text}` : '');
          }
        } else if (this.areAtSameLevel(element, other, allElements)) {
          // 找到兄弟元素
          siblings.push(other.element_type);
        }
      }
    }

    element.parentContext = parentContext;
    element.siblingContext = siblings.slice(0, 5); // 限制数量

    // 生成指纹
    const fingerprint = [
      element.element_type,
      element.visualCategory,
      element.interactionType,
      parentContext,
      siblings.slice(0, 3).join(',')
    ].join('|');

    element.contextFingerprint = this.hashString(fingerprint);
  }

  /**
   * 计算质量评分
   */
  private static calculateQualityScore(
    element: EnhancedUIElement,
    thresholds: EnhancementConfig['qualityThresholds']
  ): number {
    let score = 50; // 基础分数

    // 文本内容
    if (element.text && element.text.trim()) {
      score += 20;
    }

    // 资源ID
    if (element.resource_id) {
      score += 15;
    }

    // 交互性
    if (element.is_clickable) score += 10;
    if (element.is_scrollable) score += 5;

    // 内容描述
    if (element.content_desc) {
      score += 10;
    }

    // 合理的尺寸
    const area = this.getArea(element.bounds);
    if (area > 100 && area < 1000000) {
      score += 5;
    }

    // 层级合理性
    if (element.depth > 0 && element.depth < 10) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算可靠性
   */
  private static calculateReliability(element: EnhancedUIElement): number {
    let reliability = 0.5;

    if (element.resource_id) reliability += 0.3;
    if (element.text) reliability += 0.2;
    if (element.contextFingerprint) reliability += 0.1;

    return Math.min(1.0, reliability);
  }

  /**
   * 辅助方法
   */
  private static isContainedBy(inner: any, outer: any): boolean {
    return (
      inner.left >= outer.left &&
      inner.top >= outer.top &&
      inner.right <= outer.right &&
      inner.bottom <= outer.bottom
    );
  }

  private static getArea(bounds: any): number {
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }

  private static getHierarchyLevel(depth: number): string {
    if (depth === 0) return 'root';
    if (depth <= 2) return 'primary';
    if (depth <= 4) return 'secondary';
    return 'deep';
  }

  private static areAtSameLevel(
    element1: UIElement,
    element2: UIElement,
    allElements: UIElement[]
  ): boolean {
    // 简化的同级判断逻辑
    const area1 = this.getArea(element1.bounds);
    const area2 = this.getArea(element2.bounds);
    return Math.abs(area1 - area2) / Math.max(area1, area2) < 0.5;
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}