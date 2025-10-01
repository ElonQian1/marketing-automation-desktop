/**
 * 可视化视图数据生成器
 * 为可视化视图生成叠加层和交互区域数据
 */

import { EnhancedUIElement, VisualViewData, ElementOverlay, InteractionZone, VisualCategory } from '../types';

export class VisualViewDataGenerator {
  /**
   * 生成可视化视图数据
   */
  static async generate(elements: EnhancedUIElement[]): Promise<VisualViewData> {
    console.log('🎨 生成可视化视图数据...');

    // 1. 计算屏幕尺寸
    const screenDimensions = this.calculateScreenDimensions(elements);

    // 2. 生成元素叠加层
    const elementOverlays = this.generateElementOverlays(elements);

    // 3. 识别交互区域
    const interactionZones = this.identifyInteractionZones(elements);

    // 4. 生成视觉分类
    const visualCategories = this.generateVisualCategories(elements);

    return {
      screenDimensions,
      elementOverlays,
      interactionZones,
      visualCategories,
    };
  }

  /**
   * 计算屏幕尺寸
   */
  private static calculateScreenDimensions(elements: EnhancedUIElement[]) {
    let maxRight = 0;
    let maxBottom = 0;

    for (const element of elements) {
      maxRight = Math.max(maxRight, element.bounds.right);
      maxBottom = Math.max(maxBottom, element.bounds.bottom);
    }

    return {
      width: maxRight || 1080, // 默认值
      height: maxBottom || 1920,
    };
  }

  /**
   * 生成元素叠加层
   */
  private static generateElementOverlays(elements: EnhancedUIElement[]): ElementOverlay[] {
    return elements.map(element => ({
      id: element.id,
      bounds: {
        x: element.bounds.left,
        y: element.bounds.top,
        width: element.bounds.right - element.bounds.left,
        height: element.bounds.bottom - element.bounds.top,
      },
      className: this.getOverlayClassName(element),
      isVisible: this.isElementVisible(element),
    }));
  }

  /**
   * 识别交互区域
   */
  private static identifyInteractionZones(elements: EnhancedUIElement[]): InteractionZone[] {
    const zones: InteractionZone[] = [];
    const processedElements = new Set<string>();

    for (const element of elements) {
      if (processedElements.has(element.id) || !element.is_clickable) {
        continue;
      }

      // 查找相邻的可交互元素
      const nearbyElements = this.findNearbyInteractableElements(element, elements, 100);
      
      if (nearbyElements.length > 1) {
        const zoneBounds = this.calculateZoneBounds([element, ...nearbyElements]);
        
        zones.push({
          type: this.determineZoneType(element, nearbyElements),
          elements: [element.id, ...nearbyElements.map(el => el.id)],
          bounds: zoneBounds,
        });

        // 标记已处理的元素
        processedElements.add(element.id);
        nearbyElements.forEach(el => processedElements.add(el.id));
      }
    }

    return zones;
  }

  /**
   * 生成视觉分类
   */
  private static generateVisualCategories(elements: EnhancedUIElement[]): VisualCategory[] {
    const categories = new Map<string, {
      elements: string[];
      color: string;
    }>();

    // 按视觉分类分组
    for (const element of elements) {
      const category = element.visualCategory;
      if (!categories.has(category)) {
        categories.set(category, {
          elements: [],
          color: this.getCategoryColor(category),
        });
      }
      categories.get(category)!.elements.push(element.id);
    }

    // 转换为数组格式
    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      color: data.color,
      elements: data.elements,
      count: data.elements.length,
    }));
  }

  /**
   * 获取叠加层CSS类名
   */
  private static getOverlayClassName(element: EnhancedUIElement): string {
    const classes = ['element-overlay'];
    
    classes.push(`category-${element.visualCategory}`);
    classes.push(`interaction-${element.interactionType}`);
    
    if (element.is_clickable) classes.push('clickable');
    if (element.is_scrollable) classes.push('scrollable');
    
    // 质量等级
    if (element.qualityScore >= 80) classes.push('high-quality');
    else if (element.qualityScore >= 60) classes.push('medium-quality');
    else classes.push('low-quality');

    return classes.join(' ');
  }

  /**
   * 检查元素是否可见
   */
  private static isElementVisible(element: EnhancedUIElement): boolean {
    const area = (element.bounds.right - element.bounds.left) * 
                 (element.bounds.bottom - element.bounds.top);
    return area > 1 && element.bounds.right > element.bounds.left;
  }

  /**
   * 查找附近的可交互元素
   */
  private static findNearbyInteractableElements(
    target: EnhancedUIElement,
    allElements: EnhancedUIElement[],
    maxDistance: number
  ): EnhancedUIElement[] {
    const nearby: EnhancedUIElement[] = [];
    const targetCenter = this.getElementCenter(target);

    for (const element of allElements) {
      if (element.id === target.id || !element.is_clickable) {
        continue;
      }

      const elementCenter = this.getElementCenter(element);
      const distance = this.calculateDistance(targetCenter, elementCenter);

      if (distance <= maxDistance) {
        nearby.push(element);
      }
    }

    return nearby;
  }

  /**
   * 计算区域边界
   */
  private static calculateZoneBounds(elements: EnhancedUIElement[]) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const element of elements) {
      minX = Math.min(minX, element.bounds.left);
      minY = Math.min(minY, element.bounds.top);
      maxX = Math.max(maxX, element.bounds.right);
      maxY = Math.max(maxY, element.bounds.bottom);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * 确定区域类型
   */
  private static determineZoneType(
    primary: EnhancedUIElement,
    nearby: EnhancedUIElement[]
  ): string {
    if (nearby.some(el => el.element_type.includes('Button'))) {
      return 'button-group';
    }
    if (nearby.some(el => el.element_type.includes('Tab'))) {
      return 'tab-bar';
    }
    if (nearby.some(el => el.element_type.includes('Menu'))) {
      return 'menu';
    }
    return 'interaction-cluster';
  }

  /**
   * 获取分类颜色
   */
  private static getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      button: '#52c41a',
      text: '#1890ff',
      image: '#fa8c16',
      input: '#722ed1',
      container: '#13c2c2',
      other: '#8c8c8c',
    };
    return colors[category] || '#d9d9d9';
  }

  /**
   * 获取元素中心点
   */
  private static getElementCenter(element: EnhancedUIElement) {
    return {
      x: (element.bounds.left + element.bounds.right) / 2,
      y: (element.bounds.top + element.bounds.bottom) / 2,
    };
  }

  /**
   * 计算两点间距离
   */
  private static calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  }
}