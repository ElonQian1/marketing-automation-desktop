// src/shared/bounds/BoundsCalculator.ts
// module: shared | layer: shared | role: 共享工具
// summary: 跨模块共享的工具和类型

/**
 * BoundsCalculator.ts  
 * 统一的边界计算工具 - 项目级共享版本
 * 
 * @description 统一项目中所有bounds相关的解析和计算逻辑，消除重复代码
 * @replaces 15+个重复的parseBounds实现
 */

export interface BoundsRect {
  left: number;
  top: number;  
  right: number;
  bottom: number;
}

export interface BoundsInfo extends BoundsRect {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * 统一的Bounds计算器
 * 替换项目中15+个重复的parseBounds实现
 */
export class BoundsCalculator {
  
  /**
   * 解析bounds字符串为BoundsRect对象
   * 支持多种格式：[left,top][right,bottom] 或 left,top,right,bottom
   * 
   * @param boundsStr - bounds字符串
   * @returns BoundsRect对象或null
   * 
   * @example
   * BoundsCalculator.parseBounds("[100,200][300,400]") 
   * // => { left: 100, top: 200, right: 300, bottom: 400 }
   * 
   * BoundsCalculator.parseBounds("100,200,300,400")
   * // => { left: 100, top: 200, right: 300, bottom: 400 }
   */
  static parseBounds(boundsStr?: string | null): BoundsRect | null {
    if (!boundsStr || typeof boundsStr !== 'string') {
      return null;
    }

    const trimmed = boundsStr.trim();
    if (!trimmed) return null;

    // 处理 [left,top][right,bottom] 格式
    const bracketMatch = trimmed.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (bracketMatch) {
      const [, left, top, right, bottom] = bracketMatch.map(Number);
      return { left, top, right, bottom };
    }

    // 处理 left,top,right,bottom 格式
    const parts = trimmed.split(',').map(p => p.trim());
    if (parts.length === 4) {
      const numbers = parts.map(Number);
      if (!numbers.some(isNaN)) {
        const [left, top, right, bottom] = numbers;
        return { left, top, right, bottom };
      }
    }

    return null;
  }

  /**
   * 获取完整的bounds信息
   */
  static getBoundsInfo(boundsStr?: string | null): BoundsInfo | null {
    const bounds = this.parseBounds(boundsStr);
    if (!bounds) return null;

    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const centerX = bounds.left + width / 2;
    const centerY = bounds.top + height / 2;

    return {
      ...bounds,
      width,
      height,
      centerX,
      centerY
    };
  }

  /**
   * 获取bounds中心点
   */
  static getCenter(bounds: BoundsRect): { x: number; y: number } {
    return {
      x: bounds.left + (bounds.right - bounds.left) / 2,
      y: bounds.top + (bounds.bottom - bounds.top) / 2
    };
  }

  /**
   * 计算两个bounds之间的距离
   */
  static calculateDistance(bounds1: BoundsRect, bounds2: BoundsRect): number {
    const center1 = this.getCenter(bounds1);
    const center2 = this.getCenter(bounds2);
    
    const deltaX = center2.x - center1.x;
    const deltaY = center2.y - center1.y;
    
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * 计算相对方向
   */
  static calculateDirection(from: BoundsRect, to: BoundsRect): string {
    const fromCenter = this.getCenter(from);
    const toCenter = this.getCenter(to);
    
    const deltaX = toCenter.x - fromCenter.x;
    const deltaY = toCenter.y - fromCenter.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'below' : 'above';
    }
  }

  /**
   * 检查bounds是否包含另一个bounds
   */
  static contains(container: BoundsRect, contained: BoundsRect): boolean {
    return (
      container.left <= contained.left &&
      container.top <= contained.top &&
      container.right >= contained.right &&
      container.bottom >= contained.bottom
    );
  }

  /**
   * 检查两个bounds是否重叠
   */
  static isOverlapping(bounds1: BoundsRect, bounds2: BoundsRect): boolean {
    return !(
      bounds1.right < bounds2.left ||
      bounds2.right < bounds1.left ||
      bounds1.bottom < bounds2.top ||
      bounds2.bottom < bounds1.top
    );
  }

  /**
   * 将bounds转换为字符串
   */
  static toString(bounds: BoundsRect): string {
    return `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
  }

  /**
   * 将bounds对象转换为字符串格式
   * 兼容性方法：rectToBoundsString
   */
  static rectToBoundsString(rect: BoundsRect): string {
    return BoundsCalculator.toString(rect);
  }

  /**
   * 兼容性方法：支持旧的parseBoundsString函数名
   * @deprecated 请使用 parseBounds 方法
   */
  static parseBoundsString = BoundsCalculator.parseBounds;
}