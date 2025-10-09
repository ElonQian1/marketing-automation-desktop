/**
 * 统一的边界解析工具
 * 
 * @description 替换项目中15+个重复的parseBounds实现
 */

import type { BoundsRect, BoundsInfo, Rectangle } from '../types/geometry';

/**
 * 统一的边界解析器
 * 替换所有重复实现
 */
export class UnifiedBoundsParser {
  /**
   * 解析边界字符串为BoundsRect
   * 
   * @param boundsStr 边界字符串，格式：[x1,y1][x2,y2]
   * @returns 解析后的边界矩形或null
   */
  static parseBounds(boundsStr?: string | null): BoundsRect | null {
    if (!boundsStr || typeof boundsStr !== 'string') {
      return null;
    }

    try {
      // 解析 [x1,y1][x2,y2] 格式
      const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (match) {
        const [, x1Str, y1Str, x2Str, y2Str] = match;
        const x1 = parseInt(x1Str, 10);
        const y1 = parseInt(y1Str, 10);
        const x2 = parseInt(x2Str, 10);
        const y2 = parseInt(y2Str, 10);

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
          return null;
        }

        return {
          left: x1,
          top: y1,
          right: x2,
          bottom: y2,
        };
      }
    } catch (error) {
      console.warn('解析bounds失败:', boundsStr, error);
    }

    return null;
  }

  /**
   * 解析边界字符串为完整边界信息
   * 
   * @param boundsStr 边界字符串
   * @returns 包含计算属性的完整边界信息
   */
  static parseBoundsInfo(boundsStr?: string | null): BoundsInfo | null {
    const bounds = this.parseBounds(boundsStr);
    if (!bounds) return null;

    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;

    return {
      ...bounds,
      width,
      height,
      centerX: bounds.left + width / 2,
      centerY: bounds.top + height / 2,
    };
  }

  /**
   * 解析边界字符串为Rectangle格式
   * 
   * @param boundsStr 边界字符串
   * @returns Rectangle格式的边界信息
   */
  static parseBoundsAsRectangle(boundsStr?: string | null): Rectangle | null {
    const bounds = this.parseBounds(boundsStr);
    if (!bounds) return null;

    return {
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    };
  }

  /**
   * 计算两个边界的距离
   * 
   * @param bounds1 第一个边界
   * @param bounds2 第二个边界
   * @returns 距离值
   */
  static calculateDistance(bounds1: BoundsRect | null, bounds2: BoundsRect | null): number {
    if (!bounds1 || !bounds2) return Infinity;

    const center1 = {
      x: bounds1.left + (bounds1.right - bounds1.left) / 2,
      y: bounds1.top + (bounds1.bottom - bounds1.top) / 2,
    };

    const center2 = {
      x: bounds2.left + (bounds2.right - bounds2.left) / 2,
      y: bounds2.top + (bounds2.bottom - bounds2.top) / 2,
    };

    const dx = center1.x - center2.x;
    const dy = center1.y - center2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两个边界的相对方向
   * 
   * @param from 起始边界
   * @param to 目标边界
   * @returns 方向字符串
   */
  static calculateDirection(from: BoundsRect | null, to: BoundsRect | null): string {
    if (!from || !to) return 'unknown';

    const fromCenter = {
      x: from.left + (from.right - from.left) / 2,
      y: from.top + (from.bottom - from.top) / 2,
    };

    const toCenter = {
      x: to.left + (to.right - to.left) / 2,
      y: to.top + (to.bottom - to.top) / 2,
    };

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < 10 && absY < 10) return 'center';

    if (absX > absY * 2) {
      return dx > 0 ? 'right' : 'left';
    } else if (absY > absX * 2) {
      return dy > 0 ? 'down' : 'up';
    } else {
      if (dx > 0 && dy > 0) return 'down-right';
      if (dx > 0 && dy < 0) return 'up-right';
      if (dx < 0 && dy > 0) return 'down-left';
      if (dx < 0 && dy < 0) return 'up-left';
    }

    return 'unknown';
  }

  /**
   * 判断边界是否重叠
   * 
   * @param bounds1 第一个边界
   * @param bounds2 第二个边界
   * @returns 是否重叠
   */
  static isOverlapping(bounds1: BoundsRect | null, bounds2: BoundsRect | null): boolean {
    if (!bounds1 || !bounds2) return false;

    return !(
      bounds1.right < bounds2.left ||
      bounds2.right < bounds1.left ||
      bounds1.bottom < bounds2.top ||
      bounds2.bottom < bounds1.top
    );
  }

  /**
   * 判断一个边界是否完全包含另一个边界
   * 
   * @param container 容器边界
   * @param contained 被包含的边界
   * @returns 是否包含
   */
  static contains(container: BoundsRect | null, contained: BoundsRect | null): boolean {
    if (!container || !contained) return false;

    return (
      container.left <= contained.left &&
      container.top <= contained.top &&
      container.right >= contained.right &&
      container.bottom >= contained.bottom
    );
  }

  /**
   * 计算边界面积
   * 
   * @param bounds 边界
   * @returns 面积
   */
  static calculateArea(bounds: BoundsRect | null): number {
    if (!bounds) return 0;
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    return Math.max(0, width) * Math.max(0, height);
  }

  /**
   * 判断边界是否有效（非空且尺寸为正）
   * 
   * @param bounds 边界
   * @returns 是否有效
   */
  static isValidBounds(bounds: BoundsRect | null): boolean {
    if (!bounds) return false;
    return bounds.right > bounds.left && bounds.bottom > bounds.top;
  }

  /**
   * 格式化边界为字符串
   * 
   * @param bounds 边界
   * @returns 格式化的字符串
   */
  static formatBounds(bounds: BoundsRect | null): string {
    if (!bounds) return '[0,0][0,0]';
    return `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
  }
}

// 兼容性导出（替换原有的静态函数）
export const parseBounds = UnifiedBoundsParser.parseBounds;
export const parseBoundsInfo = UnifiedBoundsParser.parseBoundsInfo;
export const calculateDistance = UnifiedBoundsParser.calculateDistance;
export const calculateDirection = UnifiedBoundsParser.calculateDirection;