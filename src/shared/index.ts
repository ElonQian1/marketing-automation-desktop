/**
 * src/shared/index.ts
 * 项目级共享工具统一导出
 * 
 * @description 统一导出所有共享工具，替换项目中的重复实现
 */

// Bounds 相关工具
export {
  BoundsCalculator,
  type BoundsRect,
  type BoundsInfo
} from './bounds/BoundsCalculator';

// 兼容性导出 - 支持现有代码的迁移
import { BoundsCalculator } from './bounds/BoundsCalculator';

export const {
  parseBounds,
  parseBoundsString, // 兼容旧函数名
  rectToBoundsString, // 兼容旧函数名
  getBoundsInfo,
  getCenter,
  calculateDistance,
  calculateDirection,
  contains,
  isOverlapping,
  toString: boundsToString
} = BoundsCalculator;