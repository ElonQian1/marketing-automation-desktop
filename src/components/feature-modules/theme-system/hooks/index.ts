// src/components/feature-modules/theme-system/hooks/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 主题系统 Hook 导出
 */

export { useThemeManager } from './useThemeManager';
export { useSystemTheme, useSystemThemeSimple, usePrefersDark, usePrefersLight } from './useSystemTheme';
export { useThemeUtils, useThemeDebug } from './useThemeUtils';

// 导出类型
export type { SystemThemeOptions, SystemThemeResult } from './useSystemTheme';
export type { ThemeUtilsResult } from './useThemeUtils';