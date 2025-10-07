import type { UIElement, ElementBounds } from '../../../../../api/universal-ui';

/**
 * 边界检测工具类
 * 专门用于可视化目的的元素边界检测，不用于 DOM 层级构建
 */
export class BoundaryDetector {
  
  /**
   * 检查子元素是否被父元素包含（仅用于可视化）
   * 注意：此方法仅用于可视化布局分析，不应用于 XML DOM 结构构建
   */
  static isElementContainedIn(child: UIElement, parent: UIElement): boolean {
    if (!child.bounds || !parent.bounds) return false;
    
    const childBounds = this.normalizeBounds(child.bounds);
    const parentBounds = this.normalizeBounds(parent.bounds);
    
    if (!childBounds || !parentBounds) return false;
    
    // 🔧 特殊处理：零边界元素的父子关系判断
    const isChildZeroBounds = this.isZeroBounds(childBounds);
    const isParentZeroBounds = this.isZeroBounds(parentBounds);
    
    // 如果子元素是零边界，检查是否有相同的resource-id前缀或文本相关性
    if (isChildZeroBounds) {
      // 检查resource-id关联性（同属bottom_navgation系统）
      if (child.resource_id && parent.resource_id) {
        const childIsNavRelated = child.resource_id.includes('com.hihonor.contacts:id/');
        const parentIsNavRelated = parent.resource_id.includes('com.hihonor.contacts:id/') || 
                                  parent.resource_id.includes('bottom_navgation');
        if (childIsNavRelated && parentIsNavRelated) {
          // 零边界元素的resource-id关联性检查
          return true;
        }
      }
      
      // 检查文本元素与按钮的关联性
      if (child.text && (child.text.includes('电话') || child.text.includes('联系人') || child.text.includes('收藏'))) {
        const parentIsClickable = parent.is_clickable;
        if (parentIsClickable) {
          // 文本与可点击按钮的关联性
          return true;
        }
      }
      
      // 如果父元素也是零边界，可能是嵌套的文本容器
      if (isParentZeroBounds && child.resource_id?.includes('content') && parent.resource_id?.includes('container')) {
        // 文本容器嵌套关系
        return true;
      }
      
      return false; // 零边界元素默认不被非关联元素包含
    }
    
    // 常规边界包含检查
    const isContained = (
      childBounds.left >= parentBounds.left &&
      childBounds.top >= parentBounds.top &&
      childBounds.right <= parentBounds.right &&
      childBounds.bottom <= parentBounds.bottom
    );
    
    return isContained;
  }
  
  /**
   * 统一边界类型处理（支持对象和字符串）
   * 兼容新旧数据格式
   */
  static normalizeBounds(bounds: ElementBounds | any): ElementBounds | null {
    // 如果已经是 ElementBounds 对象类型，直接返回
    if (bounds && typeof bounds === 'object' && 'left' in bounds) {
      return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom
      };
    }
    
    // 如果是字符串类型，解析为对象（兼容旧格式）
    if (typeof bounds === 'string') {
      const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (!match) return null;
      
      return {
        left: parseInt(match[1]),
        top: parseInt(match[2]),
        right: parseInt(match[3]),
        bottom: parseInt(match[4])
      };
    }
    
    return null;
  }
  
  /**
   * 计算元素面积（用于可视化布局分析）
   */
  static getElementArea(element: UIElement): number {
    const bounds = this.normalizeBounds(element.bounds);
    if (!bounds) return Infinity;
    
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }
  
  /**
   * 检查是否为零边界
   */
  static isZeroBounds(bounds: ElementBounds): boolean {
    return bounds.left === 0 && bounds.top === 0 && bounds.right === 0 && bounds.bottom === 0;
  }
  
  /**
   * 检查两个元素是否有边界重叠（用于可视化冲突检测）
   */
  static hasOverlap(elementA: UIElement, elementB: UIElement): boolean {
    const boundsA = this.normalizeBounds(elementA.bounds);
    const boundsB = this.normalizeBounds(elementB.bounds);
    
    if (!boundsA || !boundsB) return false;
    
    return !(
      boundsA.right <= boundsB.left ||
      boundsA.left >= boundsB.right ||
      boundsA.bottom <= boundsB.top ||
      boundsA.top >= boundsB.bottom
    );
  }
  
  /**
   * 计算两个元素的距离（用于可视化布局分析）
   */
  static calculateDistance(elementA: UIElement, elementB: UIElement): number {
    const boundsA = this.normalizeBounds(elementA.bounds);
    const boundsB = this.normalizeBounds(elementB.bounds);
    
    if (!boundsA || !boundsB) return Infinity;
    
    // 计算中心点
    const centerA = {
      x: (boundsA.left + boundsA.right) / 2,
      y: (boundsA.top + boundsA.bottom) / 2
    };
    
    const centerB = {
      x: (boundsB.left + boundsB.right) / 2,
      y: (boundsB.top + boundsB.bottom) / 2
    };
    
    // 欧几里得距离
    return Math.sqrt(
      Math.pow(centerA.x - centerB.x, 2) + 
      Math.pow(centerA.y - centerB.y, 2)
    );
  }
  
  /**
   * 查找元素的可视化边界（包含所有子元素的最小边界）
   */
  static calculateVisualBounds(elements: UIElement[]): ElementBounds | null {
    if (elements.length === 0) return null;
    
    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;
    
    for (const element of elements) {
      const bounds = this.normalizeBounds(element.bounds);
      if (!bounds || this.isZeroBounds(bounds)) continue;
      
      minLeft = Math.min(minLeft, bounds.left);
      minTop = Math.min(minTop, bounds.top);
      maxRight = Math.max(maxRight, bounds.right);
      maxBottom = Math.max(maxBottom, bounds.bottom);
    }
    
    if (minLeft === Infinity) return null;
    
    return {
      left: minLeft,
      top: minTop,
      right: maxRight,
      bottom: maxBottom
    };
  }
  
  /**
   * 相对位置分析（用于可视化布局关系）
   */
  static analyzeRelativePosition(elementA: UIElement, elementB: UIElement): {
    direction: 'left' | 'right' | 'above' | 'below' | 'inside' | 'overlapping';
    distance: number;
  } | null {
    const boundsA = this.normalizeBounds(elementA.bounds);
    const boundsB = this.normalizeBounds(elementB.bounds);
    
    if (!boundsA || !boundsB) return null;
    
    // 检查是否包含
    if (this.isElementContainedIn(elementA, elementB)) {
      return { direction: 'inside', distance: 0 };
    }
    
    if (this.isElementContainedIn(elementB, elementA)) {
      return { direction: 'inside', distance: 0 };
    }
    
    // 检查是否重叠
    if (this.hasOverlap(elementA, elementB)) {
      return { direction: 'overlapping', distance: 0 };
    }
    
    // 计算相对位置
    const centerA = {
      x: (boundsA.left + boundsA.right) / 2,
      y: (boundsA.top + boundsA.bottom) / 2
    };
    
    const centerB = {
      x: (boundsB.left + boundsB.right) / 2,
      y: (boundsB.top + boundsB.bottom) / 2
    };
    
    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 确定主要方向
    if (Math.abs(dx) > Math.abs(dy)) {
      return {
        direction: dx > 0 ? 'right' : 'left',
        distance
      };
    } else {
      return {
        direction: dy > 0 ? 'below' : 'above',
        distance
      };
    }
  }
}