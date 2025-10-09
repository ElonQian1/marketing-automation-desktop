/**
 * PositionCalculator.ts
 * 位置计算工具
 */

import { BoundsCalculator, type BoundsRect } from '../../../shared';
import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';

export class PositionCalculator {
  
  /**
   * 计算元素在屏幕中的相对位置
   */
  calculateRelativePosition(
    elementBounds: BoundsRect, 
    screenBounds: BoundsRect
  ): { x: number; y: number } {
    const elementCenter = BoundsCalculator.getCenter(elementBounds);
    const screenCenter = BoundsCalculator.getCenter(screenBounds);
    
    return {
      x: (elementCenter.x - screenCenter.x) / (screenBounds.right - screenBounds.left),
      y: (elementCenter.y - screenCenter.y) / (screenBounds.bottom - screenBounds.top)
    };
  }

  /**
   * 计算元素的位置描述
   */
  getPositionDescription(bounds: BoundsRect, screenBounds: BoundsRect): string {
    const center = BoundsCalculator.getCenter(bounds);
    const screenWidth = screenBounds.right - screenBounds.left;
    const screenHeight = screenBounds.bottom - screenBounds.top;
    
    const xPercent = center.x / screenWidth;
    const yPercent = center.y / screenHeight;
    
    let horizontal = '';
    if (xPercent < 0.33) horizontal = '左侧';
    else if (xPercent > 0.67) horizontal = '右侧';
    else horizontal = '中央';
    
    let vertical = '';
    if (yPercent < 0.33) vertical = '上部';
    else if (yPercent > 0.67) vertical = '下部';
    else vertical = '中部';
    
    return `${vertical}${horizontal}`;
  }

  /**
   * 计算两个元素的位置关系
   */
  calculatePositionRelation(bounds1: BoundsRect, bounds2: BoundsRect): string {
    const center1 = BoundsCalculator.getCenter(bounds1);
    const center2 = BoundsCalculator.getCenter(bounds2);
    
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? '右方' : '左方';
    } else {
      return dy > 0 ? '下方' : '上方';
    }
  }

  /**
   * 检查元素是否在可视区域内
   */
  isInViewport(elementBounds: BoundsRect, viewportBounds: BoundsRect): boolean {
    return BoundsCalculator.contains(viewportBounds, elementBounds) ||
           BoundsCalculator.isOverlapping(viewportBounds, elementBounds);
  }

  /**
   * 计算元素到边界的距离
   */
  calculateEdgeDistances(bounds: BoundsRect, containerBounds: BoundsRect): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    return {
      top: bounds.top - containerBounds.top,
      right: containerBounds.right - bounds.right,
      bottom: containerBounds.bottom - bounds.bottom,
      left: bounds.left - containerBounds.left
    };
  }

  /**
   * 生成基于位置的XPath约束
   */
  generatePositionConstraints(bounds: BoundsRect): string {
    const center = BoundsCalculator.getCenter(bounds);
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    
    // 生成位置约束条件
    const constraints = [
      `@bounds and contains(@bounds, '[${bounds.left},${bounds.top}]')`,
      `@bounds and contains(@bounds, '[${bounds.right},${bounds.bottom}]')`
    ];
    
    return constraints.join(' and ');
  }
}