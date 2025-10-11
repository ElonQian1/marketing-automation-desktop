// src/modules/intelligent-strategy-system/analyzers/region-scoped/types.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * RegionScoped 模块类型定义
 * 区域范围分析相关的类型和接口
 */

/**
 * 区域信息
 */
export interface RegionInfo {
  /** 容器元素 */
  container: any;
  /** 区域边界 */
  bounds: { left: number; top: number; right: number; bottom: number };
  /** 区域面积 */
  area: number;
  /** 区域类型 */
  type?: RegionType;
  /** 区域特征 */
  features?: RegionFeatures;
}

/**
 * 区域类型
 */
export type RegionType = 
  | 'header'
  | 'content'
  | 'sidebar'
  | 'footer'
  | 'navigation'
  | 'toolbar'
  | 'list-item'
  | 'card'
  | 'dialog'
  | 'unknown';

/**
 * 区域特征
 */
export interface RegionFeatures {
  /** 密度信息 */
  density: {
    type: 'dense' | 'medium' | 'sparse';
    count: number;
    density: number;
  };
  /** 布局模式 */
  layoutPattern: {
    type: 'linear' | 'grid' | 'overlay' | 'unknown';
    index: number;
  };
  /** 内容签名 */
  contentSignature: {
    type: string;
    values: Record<string, number>;
  };
}

/**
 * 相对位置信息
 */
export interface RelativePosition {
  /** 相对方向 */
  direction: 'above' | 'below' | 'left' | 'right' | 'inside';
  /** 距离 */
  distance: number;
  /** 相对位置描述 */
  description: string;
}

/**
 * 屏幕区域
 */
export type ScreenRegion = 
  | 'top'
  | 'middle'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'unknown';

/**
 * 尺寸约束
 */
export interface SizeConstraints {
  /** 是否有效 */
  isValid: boolean;
  /** 宽度信息 */
  width: number;
  /** 高度信息 */
  height: number;
  /** 最小宽度 */
  minWidth: number;
  /** 最大宽度 */
  maxWidth: number;
  /** 最小高度 */
  minHeight: number;
  /** 最大高度 */
  maxHeight: number;
}

/**
 * 比例约束
 */
export interface ProportionConstraints {
  /** 是否有效 */
  isValid: boolean;
  /** 约束描述 */
  description: string;
  /** 约束值 */
  values: Record<string, number>;
}

/**
 * 文本参考信息
 */
export interface TextReference {
  /** 参考元素 */
  element: any;
  /** 文本内容 */
  text: string;
  /** 相对位置 */
  relativePosition: RelativePosition;
}