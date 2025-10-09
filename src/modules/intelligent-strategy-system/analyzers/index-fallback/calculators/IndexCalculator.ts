/**
 * IndexCalculator.ts
 * 索引计算工具
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';

export class IndexCalculator {
  
  /**
   * 计算基础优先级
   */
  calculateBasePriority(element: any, context: ElementAnalysisContext): number {
    let priority = 0;
    
    // 如果有XPath信息，稍微提高优先级
    if (element.xpath) {
      priority += 1;
    }
    
    // 如果有边界信息，稍微提高优先级
    if (element.bounds) {
      priority += 1;
    }
    
    // 如果有明确的tag，稍微提高优先级
    if (element.tag && element.tag !== 'View') {
      priority += 1;
    }
    
    // 检查是否是唯一的tag类型
    const sameTagCount = this.countSameTagElements(element, context);
    if (sameTagCount === 1) {
      priority += 2; // 唯一tag类型可以提高可靠性
    }
    
    return priority;
  }

  /**
   * 计算相同tag元素的数量
   */
  private countSameTagElements(element: any, context: ElementAnalysisContext): number {
    if (!element.tag || !context.document?.allNodes) {
      return 0;
    }

    return context.document.allNodes.filter((node: any) => 
      node.tag === element.tag
    ).length;
  }

  /**
   * 提取XPath中的索引
   */
  extractIndexFromPath(xpath: string): number {
    const match = xpath.match(/\[(\d+)\]$/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * 简化XPath路径
   */
  simplifyXPath(xpath: string): string {
    // 移除具体的索引号，但保留[1]
    return xpath.replace(/\[(\d+)\]/g, (match, num) => {
      return num === '1' ? '[1]' : '';
    });
  }

  /**
   * 计算XPath的复杂度
   */
  calculateXPathComplexity(xpath: string): 'simple' | 'medium' | 'complex' {
    const parts = xpath.split('/').filter(p => p.length > 0);
    const hasPredicates = xpath.includes('[') && xpath.includes(']');
    
    if (parts.length <= 3 && !hasPredicates) {
      return 'simple';
    } else if (parts.length <= 6 || hasPredicates) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * 验证索引的有效性
   */
  isValidIndex(index: number, totalCount: number): boolean {
    return index > 0 && index <= totalCount;
  }
}