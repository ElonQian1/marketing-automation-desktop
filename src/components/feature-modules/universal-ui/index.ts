/**
 * 主题感知的页面增强模块导出
 * 提供统一的页面主题组件和工具
 */

// 导出所有主题增强组件
export {
  ThemeAwareStatCard,
  ThemeAwareProgressCard,
  ThemeAwareUserCard,
  ThemeAwareFeatureCard,
  ThemeAwareEmpty,
} from './ThemeEnhanced';

// 导出所有主题布局组件
export {
  ThemeAwarePageContainer,
  ThemeAwareGridLayout,
  ThemeAwareSidebarLayout,
  ThemeAwareCardGrid,
  ThemeAwareFloatingToolbar,
} from './ThemeLayouts';

// 导出页面特定主题组件
export {
  ThemeAwareDeviceCard,
  ThemeAwareSessionTable,
} from './ThemePageComponents';

// 导出高级主题组件（使用模块化实现）
export { ThemeColorPicker, ThemePresetSelector, ThemeAnimationSettings } from './theme-advanced';

// 导出类型定义
export type {
  ThemeAwareStatCardProps,
  ThemeAwareProgressCardProps,
  ThemeAwareUserCardProps,
  ThemeAwareFeatureCardProps,
  ThemeAwareEmptyProps,
} from './ThemeEnhanced';

export type {
  ThemeAwarePageContainerProps,
  ThemeAwareGridLayoutProps,
  ThemeAwareSidebarLayoutProps,
  ThemeAwareCardGridProps,
  ThemeAwareFloatingToolbarProps,
} from './ThemeLayouts';

export type {
  ThemeAwareDeviceCardProps,
  ThemeAwareSessionTableProps,
  ImportSession,
} from './ThemePageComponents';

export type { ThemeColorPickerProps, ThemePresetSelectorProps, ThemeAnimationSettingsProps, ThemePreset } from './theme-advanced';

// 重新导出主题管理钩子
export { useThemeManager } from '../theme-system';