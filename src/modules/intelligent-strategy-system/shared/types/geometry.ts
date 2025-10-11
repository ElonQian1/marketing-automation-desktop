// src/modules/intelligent-strategy-system/shared/types/geometry.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 统一的边界和几何类型定义
 * 
 * @description 替换项目中重复的边界相关类型定义
 */

/**
 * 基础矩形边界
 */
export interface BoundsRect {
  left: number;
  top: number;  
  right: number;
  bottom: number;
}

/**
 * 完整边界信息（包含计算属性）
 */
export interface BoundsInfo extends BoundsRect {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * 位置信息
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 尺寸信息
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 矩形区域（position + size 组合）
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 相对位置
 */
export interface RelativePosition {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'middle' | 'bottom';
  distance?: number;
}

/**
 * 方向枚举
 */
export type Direction = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

/**
 * 区域类型
 */
export type ScreenRegion = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'full-screen';

/**
 * 尺寸约束
 */
export interface SizeConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

/**
 * 比例约束
 */
export interface ProportionConstraints {
  widthRatio?: number;  // 宽度占屏幕比例
  heightRatio?: number; // 高度占屏幕比例
  areaRatio?: number;   // 面积占屏幕比例
}