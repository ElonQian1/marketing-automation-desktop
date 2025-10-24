// src/components/universal-ui/xml-parser/BoundsParser.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 边界解析器
 * 负责解析Android XML中的bounds属性
 */

import { ElementBounds } from './types';

export class BoundsParser {
  /**
   * 从 bounds 字符串解析出坐标和尺寸信息
   * @param bounds 形如 "[x1,y1][x2,y2]" 的字符串
   * @returns 解析后的坐标和尺寸信息
   */
  static parseBounds(bounds: string): ElementBounds {
    if (!bounds || typeof bounds !== 'string') {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) {
      console.warn(`无法解析边界信息: ${bounds}`);
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const [, x1Str, y1Str, x2Str, y2Str] = match;
    const x1 = parseInt(x1Str, 10);
    const y1 = parseInt(y1Str, 10);
    const x2 = parseInt(x2Str, 10);
    const y2 = parseInt(y2Str, 10);

    // 🔍 菜单元素调试：检查是否为菜单元素bounds
    if (bounds === '[39,143][102,206]') {
      console.log('🎯 [BoundsParser] 检测到菜单元素bounds解析:', {
        原始bounds: bounds,
        解析坐标: { x1, y1, x2, y2 },
        计算结果: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
      });
    }

    // 验证坐标有效性
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      console.warn(`边界坐标包含非数字值: ${bounds}`);
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const width = x2 - x1;
    const height = y2 - y1;

    // 验证尺寸有效性
    if (width < 0 || height < 0) {
      console.warn(`边界计算出负数尺寸: ${bounds}, width=${width}, height=${height}`);
      return { x: x1, y: y1, width: Math.abs(width), height: Math.abs(height) };
    }

    return {
      x: x1,
      y: y1,
      width: width,
      height: height
    };
  }

  /**
   * 验证边界信息是否有效
   * @param bounds 边界信息
   * @returns 是否有效
   */
  static isValidBounds(bounds: ElementBounds): boolean {
    return bounds.width > 0 && bounds.height > 0 && 
           bounds.x >= 0 && bounds.y >= 0;
  }

  /**
   * 将边界信息转换为字符串格式
   * @param bounds 边界信息
   * @returns 字符串格式的边界信息
   */
  static boundsToString(bounds: ElementBounds): string {
    const { x, y, width, height } = bounds;
    return `[${x},${y}][${x + width},${y + height}]`;
  }

  /**
   * 检查两个元素是否重叠
   * @param bounds1 第一个元素的边界
   * @param bounds2 第二个元素的边界
   * @returns 是否重叠
   */
  static isOverlapping(bounds1: ElementBounds, bounds2: ElementBounds): boolean {
    return !(bounds1.x + bounds1.width <= bounds2.x || 
             bounds2.x + bounds2.width <= bounds1.x || 
             bounds1.y + bounds1.height <= bounds2.y || 
             bounds2.y + bounds2.height <= bounds1.y);
  }

  /**
   * 计算元素的中心点坐标
   * @param bounds 边界信息
   * @returns 中心点坐标
   */
  static getCenter(bounds: ElementBounds): { x: number; y: number } {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
  }
}