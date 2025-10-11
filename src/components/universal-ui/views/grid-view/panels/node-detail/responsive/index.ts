// src/components/universal-ui/views/grid-view/panels/node-detail/responsive/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 🎨 响应式设计模块统一导出

// 常量和配置
export {
  BREAKPOINTS,
  DEVICE_TYPES,
  GRID_COLUMNS,
  SPACING,
  COMPONENT_SIZES,
  FONT_SIZES,
  TOUCH_TARGET_SIZES,
  CONTAINER_MAX_WIDTHS,
  MEDIA_QUERIES,
  RESPONSIVE_CLASSES,
  type Breakpoint,
  type DeviceType,
  type GridColumns,
  type ComponentSizes,
  type FontSizes
} from './constants';

// 响应式 Hooks
export {
  useBreakpoint,
  useViewport,
  useMobileDetection,
  useMediaQuery,
  useResponsiveValue,
  useContainerQuery
} from './hooks';

// 工具函数
export {
  generateResponsiveGridClasses,
  generateResponsiveSpacing,
  generateResponsiveTextClasses,
  getComponentSizeForBreakpoint,
  getFontSizeForBreakpoint,
  getSpacingForBreakpoint,
  getGridColumnsForBreakpoint,
  generateContainerResponsiveClasses,
  generateMobileFriendlyClasses,
  generateMobileButtonClasses,
  generateResponsiveCardClasses,
  generateResponsiveTableClasses,
  generateResponsiveModalClasses,
  generateContentBasedLayout,
  generateA11yFocusClasses,
  mergeClasses
} from './utils';