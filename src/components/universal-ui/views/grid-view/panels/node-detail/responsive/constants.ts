/**
 * 🎨 响应式设计常量和断点配置
 * 
 * 为评分 UI 组件提供统一的响应式设计标准
 * 基于 Tailwind CSS 断点系统和现代设备规格
 */

// 标准断点定义（基于 Tailwind CSS）
export const BREAKPOINTS = {
  xs: 0,      // 超小屏设备（手机竖屏）
  sm: 640,    // 小屏设备（手机横屏）
  md: 768,    // 中等屏幕（平板竖屏）
  lg: 1024,   // 大屏幕（平板横屏、小笔记本）
  xl: 1280,   // 超大屏幕（桌面显示器）
  '2xl': 1536 // 超宽屏幕（大桌面显示器）
} as const;

// 设备类型映射
export const DEVICE_TYPES = {
  mobile: { min: BREAKPOINTS.xs, max: BREAKPOINTS.md - 1 },
  tablet: { min: BREAKPOINTS.md, max: BREAKPOINTS.lg - 1 },
  desktop: { min: BREAKPOINTS.lg, max: Infinity }
} as const;

// 网格列数配置（响应式）
export const GRID_COLUMNS = {
  xs: 1,  // 手机：单列
  sm: 1,  // 小屏：单列  
  md: 2,  // 平板：双列
  lg: 3,  // 笔记本：三列
  xl: 4,  // 桌面：四列
  '2xl': 4 // 大屏：四列
} as const;

// 间距配置（响应式）
export const SPACING = {
  xs: { gap: 2, padding: 3 },     // 手机：紧凑间距
  sm: { gap: 3, padding: 4 },     // 小屏：适中间距
  md: { gap: 4, padding: 4 },     // 平板：标准间距
  lg: { gap: 4, padding: 6 },     // 笔记本：宽松间距
  xl: { gap: 6, padding: 6 },     // 桌面：舒适间距
  '2xl': { gap: 6, padding: 8 }   // 大屏：豪华间距
} as const;

// 组件尺寸配置（响应式）
export const COMPONENT_SIZES = {
  // 策略评分卡片
  scoreCard: {
    xs: { minHeight: '120px', padding: '12px' },
    sm: { minHeight: '140px', padding: '16px' },
    md: { minHeight: '160px', padding: '16px' },
    lg: { minHeight: '180px', padding: '20px' },
    xl: { minHeight: '200px', padding: '24px' },
    '2xl': { minHeight: '220px', padding: '24px' }
  },
  
  // 权重滑块
  weightSlider: {
    xs: { height: '32px', thumbSize: '16px' },
    sm: { height: '36px', thumbSize: '18px' },
    md: { height: '40px', thumbSize: '20px' },
    lg: { height: '44px', thumbSize: '22px' },
    xl: { height: '48px', thumbSize: '24px' },
    '2xl': { height: '48px', thumbSize: '24px' }
  },

  // 雷达图
  radarChart: {
    xs: { size: 200, strokeWidth: 1 },
    sm: { size: 240, strokeWidth: 1.5 },
    md: { size: 280, strokeWidth: 2 },
    lg: { size: 320, strokeWidth: 2 },
    xl: { size: 360, strokeWidth: 2.5 },
    '2xl': { size: 400, strokeWidth: 3 }
  }
} as const;

// 字体大小配置（响应式）
export const FONT_SIZES = {
  xs: {
    title: 'text-base',      // 16px
    subtitle: 'text-sm',     // 14px
    body: 'text-xs',         // 12px
    caption: 'text-[10px]'   // 10px
  },
  sm: {
    title: 'text-lg',       // 18px
    subtitle: 'text-base',   // 16px
    body: 'text-sm',         // 14px
    caption: 'text-xs'       // 12px
  },
  md: {
    title: 'text-xl',       // 20px
    subtitle: 'text-lg',     // 18px
    body: 'text-base',       // 16px
    caption: 'text-sm'       // 14px
  },
  lg: {
    title: 'text-2xl',      // 24px
    subtitle: 'text-xl',     // 20px
    body: 'text-lg',         // 18px
    caption: 'text-base'     // 16px
  },
  xl: {
    title: 'text-3xl',      // 30px
    subtitle: 'text-2xl',    // 24px
    body: 'text-xl',         // 20px
    caption: 'text-lg'       // 18px
  },
  '2xl': {
    title: 'text-3xl',      // 30px
    subtitle: 'text-2xl',    // 24px
    body: 'text-xl',         // 20px
    caption: 'text-lg'       // 18px
  }
} as const;

// 触摸友好的最小尺寸（符合 WCAG 2.1 AA 标准）
export const TOUCH_TARGET_SIZES = {
  minimum: '44px',  // WCAG 2.1 最小触摸目标
  comfortable: '48px', // 舒适的触摸目标
  spacious: '56px'  // 宽敞的触摸目标
} as const;

// 容器最大宽度配置
export const CONTAINER_MAX_WIDTHS = {
  xs: '100%',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// 响应式断点媒体查询助手
export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  
  // 设备类型查询
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`
} as const;

// 预定义的响应式类名组合
export const RESPONSIVE_CLASSES = {
  // 网格布局
  gridCols: {
    adaptive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    cards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    widgets: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    compact: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  },
  
  // 间距
  gap: {
    tight: 'gap-2 md:gap-3 lg:gap-4',
    normal: 'gap-3 md:gap-4 lg:gap-6',
    loose: 'gap-4 md:gap-6 lg:gap-8'
  },
  
  // 内边距
  padding: {
    tight: 'p-3 md:p-4 lg:p-6',
    normal: 'p-4 md:p-6 lg:p-8',
    loose: 'p-6 md:p-8 lg:p-12'
  },
  
  // 文字大小
  text: {
    title: 'text-lg md:text-xl lg:text-2xl',
    subtitle: 'text-base md:text-lg lg:text-xl',
    body: 'text-sm md:text-base lg:text-lg',
    caption: 'text-xs md:text-sm lg:text-base'
  }
} as const;

// 类型导出
export type Breakpoint = keyof typeof BREAKPOINTS;
export type DeviceType = keyof typeof DEVICE_TYPES;
export type GridColumns = typeof GRID_COLUMNS;
export type ComponentSizes = typeof COMPONENT_SIZES;
export type FontSizes = typeof FONT_SIZES;