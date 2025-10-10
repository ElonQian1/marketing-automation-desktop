/**
 * 统一的共享类型导出
 * 
 * @description 所有共享类型的统一入口，避免循环依赖
 */

// 几何和边界相关类型
export type {
  BoundsRect,
  BoundsInfo,
  Position,
  Size,
  Rectangle,
  RelativePosition,
  Direction,
  ScreenRegion,
  SizeConstraints,
  ProportionConstraints,
} from './geometry';

// 元素相关类型
export type {
  ElementLike,
  ElementNode,
  ElementContext,
  ElementFeatures,
  ElementMatchCriteria,
  ElementValidationResult,
} from './element';

// 设备和应用相关类型
export type {
  DeviceProfile,
  ScreenInfo,
  ResolutionProfile,
  AppInfo,
  AppVersionProfile,
  DeviceInfo,
  DeviceCompatibilityResult,
  DeviceCompatibilityReport,
  ResolutionTestResult,
  ResolutionAdaptabilityReport,
} from './device';

// 常量导出
export {
  DEFAULT_SIZE_CONSTRAINTS,
  DEFAULT_PROPORTION_CONSTRAINTS,
  COMMON_RESOLUTIONS,
  DEVICE_TYPES,
  MATCH_STRATEGIES,
  STABILITY_LEVELS,
  DEFAULT_WEIGHTS,
  ELEMENT_FIELD_WEIGHTS,
  ANALYSIS_MODES,
  CACHE_TTL,
  PERFORMANCE_THRESHOLDS,
  ERROR_TYPES,
} from './constants';

// 导入常量用于类型定义
import {
  MATCH_STRATEGIES,
  STABILITY_LEVELS,
  ANALYSIS_MODES,
  DEVICE_TYPES,
  ERROR_TYPES,
} from './constants';

// 导入统一的策略类型定义
import type { MatchStrategy } from '../../types/StrategyTypes';
export type { MatchStrategy };
export type StabilityLevel = typeof STABILITY_LEVELS[keyof typeof STABILITY_LEVELS];
export type AnalysisMode = typeof ANALYSIS_MODES[keyof typeof ANALYSIS_MODES];
export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];
export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];