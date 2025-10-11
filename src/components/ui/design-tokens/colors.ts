// src/components/ui/design-tokens/colors.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Design Tokens - Colors
 * 统一的颜色设计令牌，确保品牌一致性
 */

export const colors = {
  // 主品牌色
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd', 
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // 主色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // 辅助色
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',  // 辅助色
    600: '#475569',
    700: '#334155', 
    800: '#1e293b',
    900: '#0f172a',
  },

  // 功能色
  success: {
    50: '#f0fdf4',
    100: '#dcfce7', 
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // 成功色
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // 警告色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // 错误色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // 中性色
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',  // 中性色
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// 语义化颜色映射
export const semanticColors = {
  // 文本颜色
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[400],
    inverse: colors.neutral[50],
    link: colors.primary[600],
    linkHover: colors.primary[700],
  },

  // 背景色
  background: {
    primary: colors.neutral[50],
    secondary: colors.neutral[100],
    tertiary: colors.neutral[200],
    inverse: colors.neutral[900],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // 边框颜色
  border: {
    primary: colors.neutral[200],
    secondary: colors.neutral[300],
    focus: colors.primary[500],
    error: colors.error[500],
    success: colors.success[500],
  },

  // 状态颜色
  status: {
    info: colors.primary[500],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
  },
};

// CSS 自定义属性导出
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-hover': colors.primary[600],
  '--color-secondary': colors.secondary[500],
  '--color-success': colors.success[500],
  '--color-warning': colors.warning[500],
  '--color-error': colors.error[500],
  '--color-text-primary': semanticColors.text.primary,
  '--color-text-secondary': semanticColors.text.secondary,
  '--color-background-primary': semanticColors.background.primary,
  '--color-background-secondary': semanticColors.background.secondary,
  '--color-border-primary': semanticColors.border.primary,
} as const;

export default colors;