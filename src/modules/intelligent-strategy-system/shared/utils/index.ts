// src/modules/intelligent-strategy-system/shared/utils/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 统一工具函数导出
 * 
 * @description 提供所有统一工具的集中导出
 */

// 导入工具类
import { UnifiedBoundsParser } from './boundsParser';
import { UnifiedElementUtils } from './elementUtils';
import { UnifiedCalculationUtils } from './calculationUtils';

// 边界解析工具
export {
  UnifiedBoundsParser,
  parseBounds,
  parseBoundsInfo,
  calculateDistance as boundsCalculateDistance,
  calculateDirection,
} from './boundsParser';

// 元素处理工具
export {
  UnifiedElementUtils,
  isValidElement,
  getElementIdentifier,
  getElementBounds,
  isClickable,
} from './elementUtils';

// 计算工具
export {
  UnifiedCalculationUtils,
  calculateCenter,
  calculateArea,
  calculateWeightedScore,
  calculateDistance as calcCalculateDistance,
} from './calculationUtils';

// 工具类型
export type {
  // 从geometry重新导出
  BoundsRect,
  BoundsInfo,
  Position,
  Size,
  Rectangle,
} from '../types/geometry';

export type {
  // 从element重新导出
  ElementLike,
  ElementNode,
  ElementContext,
  ElementFeatures,
  ElementMatchCriteria,
  ElementValidationResult,
} from '../types/element';

export type {
  // 从device重新导出
  DeviceProfile,
  ResolutionProfile,
  ScreenInfo,
  DeviceInfo,
  AppInfo,
} from '../types/device';

/**
 * 快速访问常用工具函数
 */
export const BoundsUtils = UnifiedBoundsParser;
export const ElementUtils = UnifiedElementUtils;
export const CalcUtils = UnifiedCalculationUtils;

/**
 * 工具版本信息
 */
export const UTILS_VERSION = '1.0.0';
export const UTILS_BUILD_DATE = '2025-01-20';

/**
 * 兼容性映射（用于逐步迁移）
 */
export const CompatibilityMap = {
  // 旧函数名 -> 新函数
  parseBounds: UnifiedBoundsParser.parseBounds,
  isValidElement: UnifiedElementUtils.isValidElement,
  getElementBounds: UnifiedElementUtils.getElementBounds,
  calculateDistance: UnifiedBoundsParser.calculateDistance,
  calculateArea: UnifiedCalculationUtils.calculateArea,
  calculateCenter: UnifiedCalculationUtils.calculateCenter,
} as const;

/**
 * 工具使用统计（开发时用于追踪迁移进度）
 */
export interface UtilsUsageStats {
  boundsParserCalls: number;
  elementUtilsCalls: number;
  calculationUtilsCalls: number;
  lastUsed: string;
  version: string;
}

/**
 * 创建使用统计记录器（开发环境）
 */
export function createUsageTracker(): UtilsUsageStats {
  return {
    boundsParserCalls: 0,
    elementUtilsCalls: 0,
    calculationUtilsCalls: 0,
    lastUsed: new Date().toISOString(),
    version: UTILS_VERSION,
  };
}