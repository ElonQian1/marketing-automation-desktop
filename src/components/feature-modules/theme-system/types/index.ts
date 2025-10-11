// src/components/feature-modules/theme-system/types/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 主题系统类型定义
 * 基于 Ant Design 5 原生暗黑模式的主题管理类型
 */

import type { ThemeConfig } from 'antd';

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 主题配置接口
 */
export interface AppThemeConfig extends ThemeConfig {
  /** 主题模式 */
  mode: ThemeMode;
  /** 自定义组件主题配置 */
  customComponents?: {
    [key: string]: any;
  };
  /** 额外的CSS变量 */
  cssVariables?: Record<string, string>;
}

/**
 * 主题上下文接口
 */
export interface ThemeContextValue {
  /** 当前主题模式 */
  mode: ThemeMode;
  /** 当前主题配置 */
  config: AppThemeConfig;
  /** 切换主题模式 */
  setMode: (mode: ThemeMode) => void;
  /** 更新主题配置 */
  updateConfig: (config: Partial<AppThemeConfig>) => void;
  /** 重置主题配置 */
  resetConfig: () => void;
  /** 是否正在切换主题 */
  isTransitioning: boolean;
}

/**
 * 主题令牌接口
 */
export interface ThemeTokens {
  /** 主色调 */
  colorPrimary: string;
  /** 成功色 */
  colorSuccess: string;
  /** 警告色 */
  colorWarning: string;
  /** 错误色 */
  colorError: string;
  /** 信息色 */
  colorInfo: string;
  /** 背景色 */
  colorBgBase: string;
  /** 容器背景色 */
  colorBgContainer: string;
  /** 布局背景色 */
  colorBgLayout: string;
  /** 悬浮背景色 */
  colorBgElevated: string;
  /** 遮罩背景色 */
  colorBgMask: string;
  /** 文本色 */
  colorText: string;
  /** 次要文本色 */
  colorTextSecondary: string;
  /** 禁用文本色 */
  colorTextDisabled: string;
  /** 边框色 */
  colorBorder: string;
  /** 次要边框色 */
  colorBorderSecondary: string;
  /** 分割线色 */
  colorSplit: string;
  /** 阴影 */
  boxShadow: string;
  /** 模糊背景 */
  colorBgBlur: string;
  /** 玻璃效果边框 */
  colorBorderGlass: string;
}

/**
 * 组件主题配置
 */
export interface ComponentThemeConfig {
  /** Layout 组件配置 */
  Layout?: {
    headerBg?: string;
    bodyBg?: string;
    siderBg?: string;
    footerBg?: string;
  };
  /** Menu 组件配置 */
  Menu?: {
    colorBgContainer?: string;
    itemBg?: string;
    itemSelectedBg?: string;
    itemSelectedColor?: string;
    itemHoverBg?: string;
    itemHoverColor?: string;
  };
  /** Card 组件配置 */
  Card?: {
    colorBgContainer?: string;
    colorBorderSecondary?: string;
    paddingLG?: number;
    borderRadiusLG?: number;
  };
  /** Button 组件配置 */
  Button?: {
    controlHeight?: number;
    borderRadius?: number;
    fontWeight?: number;
    primaryShadow?: string;
  };
  /** Table 组件配置 */
  Table?: {
    colorBgContainer?: string;
    colorBorderSecondary?: string;
    headerBg?: string;
    rowHoverBg?: string;
  };
  /** Modal 组件配置 */
  Modal?: {
    colorBgElevated?: string;
    colorBgMask?: string;
    borderRadiusLG?: number;
  };
  /** Input 组件配置 */
  Input?: {
    colorBgContainer?: string;
    colorBorder?: string;
    borderRadius?: number;
    controlHeight?: number;
  };
}

/**
 * 主题预设配置
 */
export interface ThemePreset {
  /** 预设名称 */
  name: string;
  /** 预设描述 */
  description: string;
  /** 预设标识 */
  key: string;
  /** 预设图标 */
  icon?: string;
  /** 预设颜色（用于显示） */
  color: string;
  /** 主题配置 */
  config: AppThemeConfig;
}

/**
 * 主题动画配置
 */
export interface ThemeAnimationConfig {
  /** 是否启用动画 */
  enabled: boolean;
  /** 切换动画时长 */
  duration: number;
  /** 动画缓动函数 */
  easing: string;
  /** 是否启用深色模式过渡动画 */
  enableDarkModeTransition: boolean;
}

/**
 * 主题存储配置
 */
export interface ThemeStorageConfig {
  /** 存储键名 */
  key: string;
  /** 是否自动保存 */
  autoSave: boolean;
  /** 是否记住用户选择 */
  persistent: boolean;
}

/**
 * 主题配置选项
 */
export interface ThemeOptions {
  /** 默认主题模式 */
  defaultMode?: ThemeMode;
  /** 主题预设列表 */
  presets?: ThemePreset[];
  /** 动画配置 */
  animation?: ThemeAnimationConfig;
  /** 存储配置 */
  storage?: ThemeStorageConfig;
  /** 是否启用系统主题检测 */
  detectSystemTheme?: boolean;
  /** 自定义主题配置 */
  customConfig?: Partial<AppThemeConfig>;
}

/**
 * 主题事件类型
 */
export type ThemeEventType = 
  | 'modeChanged'
  | 'configUpdated'
  | 'transitionStart'
  | 'transitionEnd'
  | 'presetChanged'
  | 'reset';

/**
 * 主题事件数据
 */
export interface ThemeEventData {
  type: ThemeEventType;
  mode?: ThemeMode;
  config?: AppThemeConfig;
  preset?: ThemePreset;
  timestamp: number;
}

/**
 * 主题事件监听器
 */
export type ThemeEventListener = (data: ThemeEventData) => void;

/**
 * CSS 变量映射
 */
export interface CSSVariables {
  [key: string]: string;
}

/**
 * 主题工具函数类型
 */
export interface ThemeUtils {
  /** 生成CSS变量 */
  generateCSSVariables: (tokens: ThemeTokens) => CSSVariables;
  /** 应用主题到DOM */
  applyThemeToDom: (config: AppThemeConfig) => void;
  /** 检测系统主题 */
  detectSystemTheme: () => ThemeMode;
  /** 验证主题配置 */
  validateThemeConfig: (config: AppThemeConfig) => boolean;
  /** 合并主题配置 */
  mergeThemeConfig: (base: AppThemeConfig, override: Partial<AppThemeConfig>) => AppThemeConfig;
}

// 所有类型都已通过 export 关键字导出，无需重复导出