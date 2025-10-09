import { 
  RESPONSIVE_CLASSES, 
  COMPONENT_SIZES, 
  FONT_SIZES,
  SPACING,
  GRID_COLUMNS,
  type Breakpoint 
} from './constants';

/**
 * 🎨 响应式样式生成工具函数集合
 */

/**
 * 根据断点生成响应式网格类名
 */
export const generateResponsiveGridClasses = (
  type: 'adaptive' | 'cards' | 'widgets' | 'compact' = 'adaptive'
): string => {
  return RESPONSIVE_CLASSES.gridCols[type];
};

/**
 * 根据断点生成响应式间距类名
 */
export const generateResponsiveSpacing = (
  type: 'gap' | 'padding',
  size: 'tight' | 'normal' | 'loose' = 'normal'
): string => {
  if (type === 'gap') {
    return RESPONSIVE_CLASSES.gap[size];
  }
  return RESPONSIVE_CLASSES.padding[size];
};

/**
 * 根据断点生成响应式文字大小类名
 */
export const generateResponsiveTextClasses = (
  type: 'title' | 'subtitle' | 'body' | 'caption'
): string => {
  return RESPONSIVE_CLASSES.text[type];
};

/**
 * 根据当前断点获取组件尺寸配置
 */
export const getComponentSizeForBreakpoint = (
  component: keyof typeof COMPONENT_SIZES,
  breakpoint: Breakpoint
) => {
  return COMPONENT_SIZES[component][breakpoint];
};

/**
 * 根据当前断点获取字体配置
 */
export const getFontSizeForBreakpoint = (breakpoint: Breakpoint) => {
  return FONT_SIZES[breakpoint];
};

/**
 * 根据当前断点获取间距配置
 */
export const getSpacingForBreakpoint = (breakpoint: Breakpoint) => {
  return SPACING[breakpoint];
};

/**
 * 根据当前断点获取推荐网格列数
 */
export const getGridColumnsForBreakpoint = (breakpoint: Breakpoint): number => {
  return GRID_COLUMNS[breakpoint];
};

/**
 * 生成基于容器查询的响应式类名
 */
export const generateContainerResponsiveClasses = (containerWidth: number) => {
  if (containerWidth < 480) {
    return {
      grid: 'grid-cols-1',
      gap: 'gap-2',
      padding: 'p-3',
      text: 'text-sm'
    };
  }
  
  if (containerWidth < 768) {
    return {
      grid: 'grid-cols-1 sm:grid-cols-2',
      gap: 'gap-3',
      padding: 'p-4',
      text: 'text-base'
    };
  }
  
  if (containerWidth < 1024) {
    return {
      grid: 'grid-cols-2 lg:grid-cols-3',
      gap: 'gap-4',
      padding: 'p-6',
      text: 'text-lg'
    };
  }
  
  return {
    grid: 'grid-cols-3 xl:grid-cols-4',
    gap: 'gap-6',
    padding: 'p-8',
    text: 'text-xl'
  };
};

/**
 * 移动端优化的触摸友好样式
 */
export const generateMobileFriendlyClasses = (isMobile: boolean) => {
  if (!isMobile) return '';
  
  return [
    'min-h-[44px]',        // 最小触摸目标 44px
    'touch-manipulation',   // 优化触摸响应
    'select-none',         // 禁止文本选择
    'tap-highlight-transparent' // 移除点击高亮
  ].join(' ');
};

/**
 * 生成适合移动端的按钮样式
 */
export const generateMobileButtonClasses = (isMobile: boolean, size: 'sm' | 'md' | 'lg' = 'md') => {
  const baseClasses = 'inline-flex items-center justify-center rounded transition-colors';
  
  if (!isMobile) {
    const desktopSizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[36px]',
      lg: 'px-6 py-3 text-lg min-h-[40px]'
    };
    return `${baseClasses} ${desktopSizes[size]}`;
  }
  
  // 移动端：更大的触摸目标
  const mobileSizes = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };
  
  return [
    baseClasses,
    mobileSizes[size],
    'touch-manipulation',
    'active:scale-95',     // 移动端按下反馈
    'select-none'
  ].join(' ');
};

/**
 * 生成响应式卡片布局样式
 */
export const generateResponsiveCardClasses = (breakpoint: Breakpoint, isCompact: boolean = false) => {
  const baseClasses = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200';
  
  const spacingConfig = getSpacingForBreakpoint(breakpoint);
  const paddingClass = isCompact ? `p-${Math.max(2, spacingConfig.padding - 1)}` : `p-${spacingConfig.padding}`;
  
  return `${baseClasses} ${paddingClass}`;
};

/**
 * 生成响应式表格样式
 */
export const generateResponsiveTableClasses = (isMobile: boolean) => {
  if (isMobile) {
    return [
      'block',                    // 移动端块级显示
      'overflow-x-auto',          // 水平滚动
      'whitespace-nowrap',        // 防止换行
      'scrollbar-thin',           // 细滚动条
      'scrollbar-thumb-gray-300'  // 滚动条颜色
    ].join(' ');
  }
  
  return 'table-auto w-full';
};

/**
 * 生成响应式模态框样式
 */
export const generateResponsiveModalClasses = (isMobile: boolean) => {
  if (isMobile) {
    return [
      'fixed inset-0',           // 全屏覆盖
      'bg-white dark:bg-gray-900', // 背景色
      'overflow-y-auto',         // 垂直滚动
      'p-4',                     // 内边距
      'safe-area-inset'          // 安全区域适配
    ].join(' ');
  }
  
  return [
    'relative',
    'bg-white dark:bg-gray-900',
    'rounded-lg',
    'shadow-xl',
    'max-w-2xl',
    'mx-auto',
    'p-6'
  ].join(' ');
};

/**
 * 生成基于内容长度的响应式布局
 */
export const generateContentBasedLayout = (
  itemCount: number,
  breakpoint: Breakpoint
): string => {
  const maxCols = getGridColumnsForBreakpoint(breakpoint);
  const idealCols = Math.min(itemCount, maxCols);
  
  // 基于当前断点和内容数量决定列数
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return itemCount <= 2 ? 'grid-cols-1' : 'grid-cols-2';
  }
  
  if (breakpoint === 'md') {
    return idealCols <= 2 ? 'grid-cols-2' : 'grid-cols-3';
  }
  
  return `grid-cols-${Math.min(idealCols, 4)}`;
};

/**
 * 工具函数：类名合并（去重并清理）
 */
export const mergeClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter((cls, index, arr) => cls && arr.indexOf(cls) === index) // 去重
    .join(' ');
};

/**
 * 生成可访问性友好的焦点样式
 */
export const generateA11yFocusClasses = () => {
  return [
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-2',
    'focus:ring-offset-white',
    'dark:focus:ring-offset-gray-900'
  ].join(' ');
};