// src/components/ui/design-tokens/spacing.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Design Tokens - Spacing
 * 统一的间距设计令牌，确保布局一致性
 */

// 基础间距单位 (4px 基数系统)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
};

// 语义化间距
export const semanticSpacing = {
  // 组件内部间距
  component: {
    xs: spacing[1],       // 4px - 极小间距
    sm: spacing[2],       // 8px - 小间距
    base: spacing[4],     // 16px - 基础间距  
    lg: spacing[6],       // 24px - 大间距
    xl: spacing[8],       // 32px - 特大间距
  },

  // 布局间距
  layout: {
    xs: spacing[4],       // 16px - 最小布局间距
    sm: spacing[6],       // 24px - 小布局间距
    base: spacing[8],     // 32px - 基础布局间距
    lg: spacing[12],      // 48px - 大布局间距
    xl: spacing[16],      // 64px - 特大布局间距
    xxl: spacing[24],     // 96px - 超大布局间距
  },

  // 栅格间距
  grid: {
    xs: spacing[2],       // 8px
    sm: spacing[4],       // 16px
    base: spacing[6],     // 24px
    lg: spacing[8],       // 32px
    xl: spacing[12],      // 48px
  },
};

// 圆角系统
export const borderRadius = {
  none: '0',
  sm: '0.125rem',       // 2px
  base: '0.25rem',      // 4px  
  md: '0.375rem',       // 6px
  lg: '0.5rem',         // 8px
  xl: '0.75rem',        // 12px
  '2xl': '1rem',        // 16px
  '3xl': '1.5rem',      // 24px
  full: '9999px',       // 圆形
};

// 阴影系统
export const boxShadow = {
  none: '0 0 #0000',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

// 边框宽度
export const borderWidth = {
  0: '0px',
  DEFAULT: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
};

// Z-index 系统
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  notification: '1070',
};

// 容器最大宽度
export const maxWidth = {
  none: 'none',
  0: '0rem',
  xs: '20rem',          // 320px
  sm: '24rem',          // 384px  
  md: '28rem',          // 448px
  lg: '32rem',          // 512px
  xl: '36rem',          // 576px
  '2xl': '42rem',       // 672px
  '3xl': '48rem',       // 768px
  '4xl': '56rem',       // 896px
  '5xl': '64rem',       // 1024px
  '6xl': '72rem',       // 1152px
  '7xl': '80rem',       // 1280px
  full: '100%',
  prose: '65ch',        // 文本阅读最佳宽度
};

// CSS 自定义属性导出
export const spacingCssVariables = {
  '--spacing-xs': spacing[1],
  '--spacing-sm': spacing[2],
  '--spacing-base': spacing[4],
  '--spacing-lg': spacing[6],
  '--spacing-xl': spacing[8],
  '--spacing-2xl': spacing[12],
  '--spacing-3xl': spacing[16],
  '--border-radius-sm': borderRadius.sm,
  '--border-radius-base': borderRadius.base,
  '--border-radius-lg': borderRadius.lg,
  '--shadow-sm': boxShadow.sm,
  '--shadow-base': boxShadow.base,
  '--shadow-lg': boxShadow.lg,
  '--z-index-dropdown': zIndex.dropdown,
  '--z-index-modal': zIndex.modal,
  '--z-index-tooltip': zIndex.tooltip,
} as const;

// 导出所有间距相关的设计令牌
export {
  borderRadius as radius,
  boxShadow as shadow,
  borderWidth as border, 
  zIndex as layers,
  maxWidth as container,
};

export default spacing;