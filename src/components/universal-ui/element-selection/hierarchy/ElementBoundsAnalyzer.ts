/**
 * 元素边界关系分析工具
 * 用于调试和分析元素之间的包含关系
 */

import type { UIElement } from '../../../../api/universalUIAPI';

export class ElementBoundsAnalyzer {
  
  /**
   * 分析目标元素与所有其他元素的边界关系
   */
  static analyzeElementRelations(targetElement: UIElement, allElements: UIElement[]): {
    potentialChildren: Array<{
      element: UIElement;
      containmentRatio: number;
      overlapRatio: number;
      isContained: boolean;
    }>;
    potentialParents: Array<{
      element: UIElement;
      containmentRatio: number;
      isContaining: boolean;
    }>;
    analysis: {
      targetBounds: UIElement['bounds'];
      targetArea: number;
      candidateChildrenCount: number;
      candidateParentsCount: number;
    };
  } {
    const targetArea = this.getElementArea(targetElement);
    const potentialChildren: any[] = [];
    const potentialParents: any[] = [];

    allElements.forEach(element => {
      if (element.id === targetElement.id) return;

      // 检查是否为潜在子元素
      if (this.isElementContained(element, targetElement)) {
        const containmentRatio = this.getElementArea(element) / targetArea;
        potentialChildren.push({
          element,
          containmentRatio,
          overlapRatio: this.getOverlapRatio(element, targetElement),
          isContained: true
        });
      }

      // 检查是否为潜在父元素
      if (this.isElementContained(targetElement, element)) {
        const containmentRatio = targetArea / this.getElementArea(element);
        potentialParents.push({
          element,
          containmentRatio,
          isContaining: true
        });
      }
    });

    // 按包含比例排序
    potentialChildren.sort((a, b) => a.containmentRatio - b.containmentRatio);
    potentialParents.sort((a, b) => a.containmentRatio - b.containmentRatio);

    return {
      potentialChildren,
      potentialParents,
      analysis: {
        targetBounds: targetElement.bounds,
        targetArea,
        candidateChildrenCount: potentialChildren.length,
        candidateParentsCount: potentialParents.length
      }
    };
  }

  /**
   * 检查元素A是否被元素B包含
   */
  static isElementContained(elementA: UIElement, elementB: UIElement): boolean {
    return (
      elementB.bounds.left <= elementA.bounds.left &&
      elementB.bounds.top <= elementA.bounds.top &&
      elementB.bounds.right >= elementA.bounds.right &&
      elementB.bounds.bottom >= elementA.bounds.bottom
    );
  }

  /**
   * 计算元素面积
   */
  static getElementArea(element: UIElement): number {
    const width = element.bounds.right - element.bounds.left;
    const height = element.bounds.bottom - element.bounds.top;
    return Math.max(0, width * height);
  }

  /**
   * 计算两个元素的重叠比例
   */
  static getOverlapRatio(elementA: UIElement, elementB: UIElement): number {
    const overlapLeft = Math.max(elementA.bounds.left, elementB.bounds.left);
    const overlapTop = Math.max(elementA.bounds.top, elementB.bounds.top);
    const overlapRight = Math.min(elementA.bounds.right, elementB.bounds.right);
    const overlapBottom = Math.min(elementA.bounds.bottom, elementB.bounds.bottom);

    if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
      return 0;
    }

    const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
    const elementAArea = this.getElementArea(elementA);
    
    return elementAArea > 0 ? overlapArea / elementAArea : 0;
  }

  /**
   * 生成边界关系报告
   */
  static generateBoundsReport(targetElement: UIElement, allElements: UIElement[]): string {
    const analysis = this.analyzeElementRelations(targetElement, allElements);
    
    let report = `📊 元素边界关系分析报告\n`;
    report += `🎯 目标元素: ${targetElement.id}\n`;
    report += `📐 边界: [${targetElement.bounds.left}, ${targetElement.bounds.top}, ${targetElement.bounds.right}, ${targetElement.bounds.bottom}]\n`;
    report += `📏 面积: ${analysis.analysis.targetArea}\n\n`;

    report += `👶 潜在子元素 (${analysis.potentialChildren.length}个):\n`;
    analysis.potentialChildren.slice(0, 10).forEach((child, index) => {
      report += `  ${index + 1}. ${child.element.id} - 面积比例: ${(child.containmentRatio * 100).toFixed(2)}%`;
      if (child.element.text) {
        report += ` - 文本: "${child.element.text}"`;
      }
      report += `\n`;
    });

    report += `\n👴 潜在父元素 (${analysis.potentialParents.length}个):\n`;
    analysis.potentialParents.slice(0, 5).forEach((parent, index) => {
      report += `  ${index + 1}. ${parent.element.id} - 占用比例: ${(parent.containmentRatio * 100).toFixed(2)}%\n`;
    });

    return report;
  }

  /**
   * 调试打印边界关系
   */
  static debugElementRelations(targetElement: UIElement, allElements: UIElement[]): void {
    const report = this.generateBoundsReport(targetElement, allElements);
    console.log(report);
    
    const analysis = this.analyzeElementRelations(targetElement, allElements);
    console.log('🔍 详细分析数据:', analysis);
  }
}

export default ElementBoundsAnalyzer;