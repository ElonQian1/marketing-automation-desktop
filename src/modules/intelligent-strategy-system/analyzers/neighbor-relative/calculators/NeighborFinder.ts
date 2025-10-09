/**
 * NeighborFinder.ts
 * 邻居元素查找器
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import { BoundsCalculator } from '../../../shared';

export interface NeighborGroup {
  direction: string;
  elements: any[];
  distance: number;
}

export interface NeighborAnalysis {
  all: any[];
  byDirection: Record<string, any[]>;
  byDistance: Record<string, any[]>;
  siblings: any[];
  best: any | null;
}

/**
 * 邻居元素查找和分析器
 */
export class NeighborFinder {
  /**
   * 查找所有邻居元素
   */
  static findNeighborElements(element: any, context: ElementAnalysisContext): any[] {
    const neighbors: any[] = [];
    const targetBounds = BoundsCalculator.parseBounds(element.bounds);
    
    if (!targetBounds) return neighbors;

    // 遍历所有元素查找邻居
    context.document.allNodes?.forEach(candidate => {
      if (candidate === element) return; // 跳过自身

      const candidateBounds = BoundsCalculator.parseBounds(candidate.bounds?.toString());
      if (!candidateBounds) return;

      // 计算距离
      const distance = BoundsCalculator.calculateDistance(targetBounds, candidateBounds);
      
      // 距离阈值过滤 (可配置)
      const maxDistance = 500; // pixels
      if (distance <= maxDistance) {
        neighbors.push({
          ...candidate,
          _neighborMeta: {
            distance,
            direction: this.calculateDirection(targetBounds, candidateBounds)
          }
        });
      }
    });

    return neighbors.sort((a, b) => 
      a._neighborMeta.distance - b._neighborMeta.distance
    );
  }

  /**
   * 进行完整的邻居分析
   */
  static analyzeNeighbors(element: any, context: ElementAnalysisContext): NeighborAnalysis {
    const allNeighbors = this.findNeighborElements(element, context);
    
    return {
      all: allNeighbors,
      byDirection: this.groupNeighborsByDirection(allNeighbors),
      byDistance: this.groupNeighborsByDistance(allNeighbors),
      siblings: this.findSiblingElements(element, allNeighbors, context),
      best: this.findBestNeighbor(allNeighbors, context)
    };
  }

  /**
   * 按方向分组邻居
   */
  static groupNeighborsByDirection(neighbors: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      'left': [],
      'right': [],
      'above': [],
      'below': [],
      'diagonal': []
    };

    neighbors.forEach(neighbor => {
      const direction = neighbor._neighborMeta.direction;
      if (groups[direction]) {
        groups[direction].push(neighbor);
      } else {
        groups['diagonal'].push(neighbor);
      }
    });

    return groups;
  }

  /**
   * 按距离范围分组邻居
   */
  static groupNeighborsByDistance(neighbors: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      'near': [],     // 0-50px
      'medium': [],   // 50-150px
      'far': []       // 150px+
    };

    neighbors.forEach(neighbor => {
      const distance = neighbor._neighborMeta.distance;
      if (distance < 50) {
        groups['near'].push(neighbor);
      } else if (distance < 150) {
        groups['medium'].push(neighbor);
      } else {
        groups['far'].push(neighbor);
      }
    });

    return groups;
  }

  /**
   * 查找兄弟元素（同一父元素）
   */
  static findSiblingElements(element: any, neighbors: any[], context: ElementAnalysisContext): any[] {
    // 简化实现 - 实际需要XML树遍历
    return neighbors.filter(neighbor => {
      // 基于相同父元素类型或相近位置判断
      return Math.abs(
        BoundsCalculator.parseBounds(element.bounds)?.top - 
        BoundsCalculator.parseBounds(neighbor.bounds)?.top
      ) < 100; // 垂直距离很近认为是兄弟元素
    });
  }

  /**
   * 找到最佳邻居元素
   */
  static findBestNeighbor(neighbors: any[], context: ElementAnalysisContext): any | null {
    if (neighbors.length === 0) return null;
    
    // 按评分排序
    const scored = neighbors.map(neighbor => ({
      element: neighbor,
      score: this.calculateElementScore(neighbor, context)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.element || null;
  }

  /**
   * 计算元素评分
   */
  static calculateElementScore(element: any, context: ElementAnalysisContext): number {
    let score = 0;

    // resource-id 加分
    if (element.attributes?.['resource-id']) {
      score += 20;
      if (this.isResourceIdUnique(element.attributes['resource-id'], context)) {
        score += 10;
      }
    }

    // 有意义文本加分
    if (element.text && element.text.trim().length > 0 && element.text.length < 50) {
      score += 15;
    }

    // content-desc 加分
    if (element.attributes?.['content-desc']) {
      score += 10;
    }

    // 特定控件类型加分
    if (this.isSpecificControlType(element.tag)) {
      score += 8;
    }

    // 距离近加分
    const distance = element._neighborMeta?.distance || 999;
    if (distance < 50) {
      score += 10;
    } else if (distance < 150) {
      score += 5;
    }

    return score;
  }

  /**
   * 计算方向
   */
  private static calculateDirection(elementBounds: any, otherBounds: any): string {
    const centerX1 = elementBounds.left + elementBounds.width / 2;
    const centerY1 = elementBounds.top + elementBounds.height / 2;
    const centerX2 = otherBounds.left + otherBounds.width / 2;
    const centerY2 = otherBounds.top + otherBounds.height / 2;

    const deltaX = centerX2 - centerX1;
    const deltaY = centerY2 - centerY1;
    
    // 优先考虑更明显的方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'below' : 'above';
    }
  }

  /**
   * 检查 resource-id 是否唯一
   */
  private static isResourceIdUnique(resourceId: string, context: ElementAnalysisContext): boolean {
    let count = 0;
    context.document.allNodes?.forEach(element => {
      if (element.attributes['resource-id'] === resourceId) {
        count++;
        if (count > 1) return false;
      }
    });
    return count === 1;
  }

  /**
   * 检查是否为特定控件类型
   */
  private static isSpecificControlType(tagName: string): boolean {
    const specificTypes = [
      'android.widget.Button',
      'android.widget.EditText', 
      'android.widget.TextView',
      'android.widget.ImageView',
      'android.widget.CheckBox',
      'android.widget.RadioButton'
    ];
    return specificTypes.includes(tagName);
  }
}