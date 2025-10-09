/**
 * 响应式工具函数
 */

/**
 * 生成移动端按钮样式类
 */
export function generateMobileButtonClasses(variant: 'primary' | 'secondary' | 'default' = 'default'): string {
  const baseClasses = 'touch-manipulation select-none active:scale-95 transition-transform';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    default: 'bg-white hover:bg-gray-50 border border-gray-200'
  };
  
  return `${baseClasses} ${variantClasses[variant]}`;
}

/**
 * 生成无障碍焦点样式类
 */
export function generateA11yFocusClasses(): string {
  return 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
}

/**
 * 合并 CSS 类名
 */
export function mergeClasses(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 生成响应式网格类
 */
export function generateResponsiveGridClasses(columns: { xs?: number; sm?: number; md?: number; lg?: number }): string {
  const classes: string[] = [];
  
  if (columns.xs) classes.push(`grid-cols-${columns.xs}`);
  if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
  if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
  if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
  
  return classes.join(' ');
}

/**
 * 生成响应式间距类
 */
export function generateResponsiveSpacingClasses(spacing: { xs?: number; sm?: number; md?: number; lg?: number }): string {
  const classes: string[] = [];
  
  if (spacing.xs) classes.push(`space-y-${spacing.xs}`);
  if (spacing.sm) classes.push(`sm:space-y-${spacing.sm}`);
  if (spacing.md) classes.push(`md:space-y-${spacing.md}`);
  if (spacing.lg) classes.push(`lg:space-y-${spacing.lg}`);
  
  return classes.join(' ');
}