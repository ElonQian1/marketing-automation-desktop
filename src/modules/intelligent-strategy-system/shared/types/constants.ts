/**
 * 统一的常量定义
 * 
 * @description 替换项目中重复的常量和默认配置
 */

import type { SizeConstraints, ProportionConstraints } from './geometry';

/**
 * 默认尺寸约束
 */
export const DEFAULT_SIZE_CONSTRAINTS: SizeConstraints = {
  minWidth: 20,
  minHeight: 20,
  maxWidth: 2000,
  maxHeight: 2000,
};

/**
 * 默认比例约束
 */
export const DEFAULT_PROPORTION_CONSTRAINTS: ProportionConstraints = {
  widthRatio: 0.1,
  heightRatio: 0.1,
  areaRatio: 0.01,
};

/**
 * 常用分辨率
 */
export const COMMON_RESOLUTIONS = {
  HD: { width: 720, height: 1280, density: 2.0 },
  FHD: { width: 1080, height: 1920, density: 3.0 },
  QHD: { width: 1440, height: 2560, density: 4.0 },
  UHD: { width: 2160, height: 3840, density: 6.0 },
} as const;

/**
 * 设备类型
 */
export const DEVICE_TYPES = {
  PHONE: 'phone',
  TABLET: 'tablet',
  FOLDABLE: 'foldable',
  TV: 'tv',
} as const;

/**
 * 匹配策略常量
 */
export const MATCH_STRATEGIES = {
  ABSOLUTE: 'absolute',
  STRICT: 'strict',
  RELAXED: 'relaxed',
  POSITIONLESS: 'positionless',
  STANDARD: 'standard',
} as const;

/**
 * 稳定性级别
 */
export const STABILITY_LEVELS = {
  VERY_STABLE: 'very-stable',
  STABLE: 'stable',
  MODERATE: 'moderate',
  UNSTABLE: 'unstable',
  VERY_UNSTABLE: 'very-unstable',
} as const;

/**
 * 默认权重配置
 */
export const DEFAULT_WEIGHTS = {
  STABILITY: {
    deviceCompatibility: 0.25,
    resolutionAdaptability: 0.25,
    versionStability: 0.20,
    layoutTolerance: 0.15,
    elementAccuracy: 0.15,
  },
  UNIQUENESS: {
    resourceId: 0.4,
    text: 0.3,
    contentDesc: 0.2,
    class: 0.1,
  },
  SCORING: {
    uniqueness: 0.3,
    stability: 0.25,
    accuracy: 0.2,
    performance: 0.15,
    maintainability: 0.1,
  },
} as const;

/**
 * 元素属性权重
 */
export const ELEMENT_FIELD_WEIGHTS = {
  'resource-id': 0.4,
  'text': 0.3,
  'content-desc': 0.2,
  'class': 0.15,
  'package': 0.1,
  'bounds': 0.05,
  'index': 0.02,
} as const;

/**
 * 分析模式
 */
export const ANALYSIS_MODES = {
  FAST: 'fast',
  BALANCED: 'balanced',
  THOROUGH: 'thorough',
  COMPREHENSIVE: 'comprehensive',
} as const;

/**
 * 缓存时间常量（毫秒）
 */
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5分钟
  MEDIUM: 30 * 60 * 1000,    // 30分钟
  LONG: 2 * 60 * 60 * 1000,  // 2小时
  VERY_LONG: 24 * 60 * 60 * 1000, // 24小时
} as const;

/**
 * 性能阈值
 */
export const PERFORMANCE_THRESHOLDS = {
  ANALYSIS_TIMEOUT: 30000,     // 30秒
  ELEMENT_LIMIT: 10000,        // 最大元素数
  DEPTH_LIMIT: 50,             // 最大深度
  SIMILARITY_THRESHOLD: 0.8,   // 相似度阈值
  UNIQUENESS_THRESHOLD: 0.7,   // 唯一性阈值
  STABILITY_THRESHOLD: 0.75,   // 稳定性阈值
} as const;

/**
 * 错误类型
 */
export const ERROR_TYPES = {
  PARSE_ERROR: 'parse_error',
  VALIDATION_ERROR: 'validation_error',
  TIMEOUT_ERROR: 'timeout_error',
  NETWORK_ERROR: 'network_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;