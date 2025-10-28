// src/components/action-system/coordinate-selector/index.ts
// module: action-system | layer: ui | role: 坐标选择器模块导出
// summary: 统一导出坐标选择器相关组件和类型

export { CoordinateSelector } from './CoordinateSelector';
export type { 
  CoordinatePoint,
  CoordinateRange,
  ScreenDimensions,
  CoordinateConfig,
  CoordinatePreset,
  CoordinateCalculatorOptions
} from './types';
export { CoordinateCalculator } from './types';

// 默认导出主组件
export { CoordinateSelector as default } from './CoordinateSelector';