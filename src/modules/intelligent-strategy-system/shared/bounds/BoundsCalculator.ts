/**
 * BoundsCalculator.ts
 * 统一的边界计算工具
 * 
 * @description 统一项目中所有bounds相关的解析和计算逻辑，消除重复代码
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
      const [left, top, right, bottom] = parts.map(Number);
      if (parts.every(p => !isNaN(Number(p)))) {
        return { left, top, right, bottom };
      }
    }

    return null;
  }

  /**
   * 将BoundsRect转换为完整的BoundsInfo
   */
  static toBoundsInfo(bounds: BoundsRect): BoundsInfo {
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
   * 将BoundsInfo转换为字符串格式
   */
  static toString(bounds: BoundsRect): string {
    return `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
  }

  /**
   * 计算两个元素的中心点距离
   */
  static calculateDistance(bounds1: BoundsRect, bounds2: BoundsRect): number {
    const info1 = this.toBoundsInfo(bounds1);
    const info2 = this.toBoundsInfo(bounds2);
    
    const dx = info1.centerX - info2.centerX;
    const dy = info1.centerY - info2.centerY;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 判断第二个元素相对于第一个元素的方向
   */
  static calculateDirection(bounds1: BoundsRect, bounds2: BoundsRect): 'left' | 'right' | 'above' | 'below' {
    const info1 = this.toBoundsInfo(bounds1);
    const info2 = this.toBoundsInfo(bounds2);
    
    const dx = info2.centerX - info1.centerX;
    const dy = info2.centerY - info1.centerY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'below' : 'above';
    }
  }

  /**
   * 检查两个bounds是否重叠
   */
  static isOverlapping(bounds1: BoundsRect, bounds2: BoundsRect): boolean {
    return !(bounds1.right <= bounds2.left || 
             bounds2.right <= bounds1.left || 
             bounds1.bottom <= bounds2.top || 
             bounds2.bottom <= bounds1.top);
  }

  /**
   * 检查第一个bounds是否完全包含第二个bounds
   */
  static contains(container: BoundsRect, element: BoundsRect): boolean {
    return container.left <= element.left &&
           container.top <= element.top &&
           container.right >= element.right &&
           container.bottom >= element.bottom;
  }

  /**
   * 计算bounds的面积
   */
  static calculateArea(bounds: BoundsRect): number {
    const info = this.toBoundsInfo(bounds);
    return info.width * info.height;
  }

  /**
   * 验证bounds是否有效
   */
  static isValid(bounds: BoundsRect | null): bounds is BoundsRect {
    if (!bounds) return false;
    
    return bounds.left >= 0 &&
           bounds.top >= 0 &&
           bounds.right > bounds.left &&
           bounds.bottom > bounds.top;
  }

  /**
   * 获取bounds的中心点坐标
   */
  static getCenter(bounds: BoundsRect): { x: number; y: number } {
    const info = this.toBoundsInfo(bounds);
    return { x: info.centerX, y: info.centerY };
  }
}