// src/components/action-system/coordinate-selector/types.ts
// module: action-system | layer: types | role: 坐标选择器类型定义
// summary: 坐标配置相关的类型定义

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface CoordinateRange {
  start: CoordinatePoint;
  end: CoordinatePoint;
}

export interface ScreenDimensions {
  width: number;
  height: number;
}

export interface CoordinateConfig {
  start_x?: number;
  start_y?: number;
  end_x?: number;
  end_y?: number;
  use_custom_coordinates?: boolean;
}

export type CoordinatePreset = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface CoordinateCalculatorOptions {
  screenSize: ScreenDimensions;
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  customStart?: CoordinatePoint;
}

/**
 * 坐标计算工具类
 */
export class CoordinateCalculator {
  /**
   * 计算默认滑动坐标
   */
  static calculateDefaultCoordinates(options: CoordinateCalculatorOptions): CoordinateRange {
    const { screenSize, direction, distance, customStart } = options;
    const { width, height } = screenSize;
    
    // 使用自定义起始点或屏幕中心
    const startX = customStart?.x ?? Math.floor(width / 2);
    const startY = customStart?.y ?? Math.floor(height / 2);
    
    const delta = Math.max(100, Math.min(distance, Math.floor(height * 0.8)));
    
    let endX = startX;
    let endY = startY;
    
    switch (direction) {
      case 'up':
        endY = startY - delta;
        break;
      case 'down':
        endY = startY + delta;
        break;
      case 'left':
        endX = startX - delta;
        break;
      case 'right':
        endX = startX + delta;
        break;
    }
    
    // 边界检查
    endX = Math.max(0, Math.min(endX, width));
    endY = Math.max(0, Math.min(endY, height));
    
    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY }
    };
  }
  
  /**
   * 计算预设位置坐标
   */
  static calculatePresetCoordinates(
    preset: CoordinatePreset, 
    screenSize: ScreenDimensions, 
    distance: number
  ): CoordinateRange {
    const { width, height } = screenSize;
    
    switch (preset) {
      case 'center':
        return this.calculateDefaultCoordinates({
          screenSize,
          direction: 'down',
          distance
        });
        
      case 'top':
        return {
          start: { x: Math.floor(width / 2), y: Math.floor(height * 0.2) },
          end: { x: Math.floor(width / 2), y: Math.floor(height * 0.2) + distance }
        };
        
      case 'bottom':
        return {
          start: { x: Math.floor(width / 2), y: Math.floor(height * 0.8) },
          end: { x: Math.floor(width / 2), y: Math.floor(height * 0.8) - distance }
        };
        
      case 'left':
        return {
          start: { x: Math.floor(width * 0.2), y: Math.floor(height / 2) },
          end: { x: Math.floor(width * 0.2) + distance, y: Math.floor(height / 2) }
        };
        
      case 'right':
        return {
          start: { x: Math.floor(width * 0.8), y: Math.floor(height / 2) },
          end: { x: Math.floor(width * 0.8) - distance, y: Math.floor(height / 2) }
        };
        
      default:
        return this.calculateDefaultCoordinates({
          screenSize,
          direction: 'down',
          distance
        });
    }
  }
  
  /**
   * 计算两点之间的距离
   */
  static calculateDistance(start: CoordinatePoint, end: CoordinatePoint): number {
    return Math.floor(Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    ));
  }
  
  /**
   * 验证坐标是否在屏幕范围内
   */
  static validateCoordinates(point: CoordinatePoint, screenSize: ScreenDimensions): boolean {
    return point.x >= 0 && point.x <= screenSize.width && 
           point.y >= 0 && point.y <= screenSize.height;
  }
}