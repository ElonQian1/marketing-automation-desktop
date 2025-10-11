// src/components/feature-modules/theme-system/tokens/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 主题令牌配置
 * 基于 Ant Design 5 原生暗黑模式的设计令牌
 */

import type { ThemeMode, ThemeTokens, ComponentThemeConfig, CSSVariables } from '../types';

/**
 * 基础颜色调色板
 */
const colorPalette = {
  // 主色调 - 小红书风格的粉红色
  pink: {
    50: '#fff0f2',
    100: '#ffe1e6',
    200: '#ffc2cc',
    300: '#ff94a3',
    400: '#ff566b',
    500: '#ff6b8a', // 主色
    600: '#e63946',
    700: '#cc2936',
    800: '#b91e2b',
    900: '#a61e27',
  },
  // 中性色
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
    950: '#141414',
  },
  // 功能色
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
} as const;

/**
 * 亮色主题令牌
 */
const lightThemeTokens: ThemeTokens = {
  // 主色调
  colorPrimary: colorPalette.pink[500],
  colorSuccess: colorPalette.success,
  colorWarning: colorPalette.warning,
  colorError: colorPalette.error,
  colorInfo: colorPalette.info,
  
  // 背景色
  colorBgBase: '#ffffff',
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f5f5f5',
  colorBgElevated: '#ffffff',
  colorBgMask: 'rgba(0, 0, 0, 0.45)',
  
  // 文本色
  colorText: 'rgba(0, 0, 0, 0.88)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  colorTextDisabled: 'rgba(0, 0, 0, 0.25)',
  
  // 边框色
  colorBorder: '#d9d9d9',
  colorBorderSecondary: '#f0f0f0',
  colorSplit: 'rgba(5, 5, 5, 0.06)',
  
  // 特效
  boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  colorBgBlur: 'rgba(255, 255, 255, 0.8)',
  colorBorderGlass: 'rgba(255, 255, 255, 0.2)',
};

/**
 * 暗色主题令牌
 */
const darkThemeTokens: ThemeTokens = {
  // 主色调（在暗色下略微提升亮度，增强可读性）
  colorPrimary: colorPalette.pink[500], // #ff6b8a
  colorSuccess: '#7ee787',
  colorWarning: '#e3b341',
  colorError: '#ff7b72',
  colorInfo: '#79c0ff',

  // 背景层级（对齐 GitHub Dark 风格）
  colorBgBase: '#0d1117',
  colorBgContainer: '#161b22',
  colorBgLayout: '#0d1117',
  colorBgElevated: '#1f232a',
  colorBgMask: 'rgba(1, 4, 9, 0.65)',

  // 文本（AntD 建议的透明度系数，兼顾可读性）
  colorText: 'rgba(240, 246, 252, 0.88)', // #f0f6fc
  colorTextSecondary: 'rgba(240, 246, 252, 0.65)',
  colorTextDisabled: 'rgba(240, 246, 252, 0.35)',

  // 边框与分割线（微对比增强）
  colorBorder: '#30363d',
  colorBorderSecondary: '#21262d',
  colorSplit: 'rgba(240, 246, 252, 0.12)',

  // 阴影与玻璃效果
  boxShadow: '0 6px 16px 0 rgba(1, 4, 9, 0.45), 0 3px 6px -4px rgba(1, 4, 9, 0.6), 0 9px 28px 8px rgba(1, 4, 9, 0.35)',
  colorBgBlur: 'rgba(22, 27, 34, 0.8)',
  colorBorderGlass: 'rgba(240, 246, 252, 0.12)',
};

/**
 * 获取主题令牌
 */
export const getThemeTokens = (mode: ThemeMode): ThemeTokens => {
  return mode === 'dark' ? darkThemeTokens : lightThemeTokens;
};

/**
 * 亮色模式组件配置
 */
const lightComponentConfig: ComponentThemeConfig = {
  Layout: {
    headerBg: '#ffffff',
    bodyBg: '#f5f5f5',
    siderBg: '#ffffff',
    footerBg: '#f5f5f5',
  },
  Menu: {
    colorBgContainer: '#ffffff',
    itemBg: 'transparent',
    itemSelectedBg: 'rgba(255, 107, 138, 0.1)',
    itemSelectedColor: colorPalette.pink[500],
    itemHoverBg: 'rgba(0, 0, 0, 0.04)',
    itemHoverColor: 'rgba(0, 0, 0, 0.88)',
  },
  Card: {
    colorBgContainer: '#ffffff',
    colorBorderSecondary: '#f0f0f0',
    paddingLG: 24,
    borderRadiusLG: 12,
  },
  Button: {
    controlHeight: 36,
    borderRadius: 8,
    fontWeight: 500,
    primaryShadow: '0 2px 4px rgba(255, 107, 138, 0.2)',
  },
  Table: {
    colorBgContainer: '#ffffff',
    colorBorderSecondary: '#f0f0f0',
    headerBg: '#fafafa',
    rowHoverBg: '#fafafa',
  },
  Modal: {
    colorBgElevated: '#ffffff',
    colorBgMask: 'rgba(0, 0, 0, 0.45)',
    borderRadiusLG: 12,
  },
  Input: {
    colorBgContainer: '#ffffff',
    colorBorder: '#d9d9d9',
    borderRadius: 8,
    controlHeight: 36,
  },
};

/**
 * 暗色模式组件配置
 */
const darkComponentConfig: ComponentThemeConfig = {
  Layout: {
    headerBg: '#0d1117',
    bodyBg: '#0d1117',
    siderBg: '#161b22',
    footerBg: '#0d1117',
  },
  Menu: {
    colorBgContainer: '#161b22',
    itemBg: 'transparent',
    itemSelectedBg: 'rgba(255, 107, 138, 0.16)',
    itemSelectedColor: colorPalette.pink[500],
    itemHoverBg: 'rgba(240, 246, 252, 0.08)',
    itemHoverColor: 'rgba(240, 246, 252, 0.88)',
  },
  Card: {
    colorBgContainer: '#161b22',
    colorBorderSecondary: '#21262d',
    paddingLG: 24,
    borderRadiusLG: 12,
  },
  Button: {
    controlHeight: 36,
    borderRadius: 8,
    fontWeight: 500,
    primaryShadow: '0 2px 4px rgba(255, 107, 138, 0.28)',
  },
  Table: {
    colorBgContainer: 'rgba(240, 246, 252, 0.02)',
    colorBorderSecondary: '#21262d',
    headerBg: '#1f232a',
    rowHoverBg: '#1e2630',
  },
  Modal: {
    colorBgElevated: '#1f232a',
    colorBgMask: 'rgba(1, 4, 9, 0.65)',
    borderRadiusLG: 12,
  },
  Input: {
    colorBgContainer: '#161b22',
    colorBorder: '#30363d',
    borderRadius: 8,
    controlHeight: 36,
  },
};

/**
 * 获取组件主题配置
 */
export const getComponentConfig = (mode: ThemeMode): ComponentThemeConfig => {
  return mode === 'dark' ? darkComponentConfig : lightComponentConfig;
};

/**
 * 生成 CSS 变量
 */
export const generateCSSVariables = (mode: ThemeMode): CSSVariables => {
  const tokens = getThemeTokens(mode);
  const componentConfig = getComponentConfig(mode);
  
  return {
    // 基础颜色变量
    '--color-primary': tokens.colorPrimary,
    '--color-success': tokens.colorSuccess,
    '--color-warning': tokens.colorWarning,
    '--color-error': tokens.colorError,
    '--color-info': tokens.colorInfo,
    
    // 背景颜色变量
    '--color-bg-base': tokens.colorBgBase,
    '--color-bg-container': tokens.colorBgContainer,
    '--color-bg-layout': tokens.colorBgLayout,
    '--color-bg-elevated': tokens.colorBgElevated,
    '--color-bg-mask': tokens.colorBgMask,
    '--color-bg-blur': tokens.colorBgBlur,
    
    // 文本颜色变量
    '--color-text': tokens.colorText,
    '--color-text-secondary': tokens.colorTextSecondary,
    '--color-text-disabled': tokens.colorTextDisabled,
    
    // 边框颜色变量
    '--color-border': tokens.colorBorder,
    '--color-border-secondary': tokens.colorBorderSecondary,
    '--color-border-glass': tokens.colorBorderGlass,
    '--color-split': tokens.colorSplit,
    
    // 阴影变量
    '--box-shadow': tokens.boxShadow,
    '--box-shadow-card': mode === 'dark' 
      ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    '--box-shadow-elevated': mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.5)'
      : '0 4px 16px rgba(0, 0, 0, 0.12)',
    
    // 特殊效果变量
    '--backdrop-blur': 'blur(8px)',
    '--glass-opacity': mode === 'dark' ? '0.8' : '0.9',
    
    // 组件特定变量
    '--header-bg': componentConfig.Layout?.headerBg || tokens.colorBgContainer,
    '--sider-bg': componentConfig.Layout?.siderBg || tokens.colorBgContainer,
    '--card-bg': componentConfig.Card?.colorBgContainer || tokens.colorBgContainer,
    '--button-border-radius': `${componentConfig.Button?.borderRadius || 8}px`,
    '--input-border-radius': `${componentConfig.Input?.borderRadius || 8}px`,
    '--modal-border-radius': `${componentConfig.Modal?.borderRadiusLG || 12}px`,
    
    // 过渡动画变量
    '--transition-duration': '0.2s',
    '--transition-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
    '--theme-transition': 'background-color var(--transition-duration) var(--transition-function), color var(--transition-duration) var(--transition-function), border-color var(--transition-duration) var(--transition-function)',
  };
};

/**
 * Ant Design 主题配置生成器
 */
export const generateAntdThemeConfig = (mode: ThemeMode) => {
  const tokens = getThemeTokens(mode);
  const componentConfig = getComponentConfig(mode);
  
  return {
    token: {
      colorPrimary: tokens.colorPrimary,
      colorSuccess: tokens.colorSuccess,
      colorWarning: tokens.colorWarning,
      colorError: tokens.colorError,
      colorInfo: tokens.colorInfo,
      colorBgBase: tokens.colorBgBase,
      colorBgContainer: tokens.colorBgContainer,
      colorBgLayout: tokens.colorBgLayout,
      colorBgElevated: tokens.colorBgElevated,
      colorText: tokens.colorText,
      colorTextSecondary: tokens.colorTextSecondary,
      colorBorder: tokens.colorBorder,
      colorBorderSecondary: tokens.colorBorderSecondary,
      // 更轻盈的描边，减少“线框感”
      lineWidth: 1,
      lineWidthBold: 2,
      borderRadius: 8,
      controlHeight: 36,
      fontSize: 14,
      lineHeight: 1.5,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      boxShadow: tokens.boxShadow,
    },
    components: {
      Layout: componentConfig.Layout,
      Menu: componentConfig.Menu,
      Card: componentConfig.Card,
      Button: componentConfig.Button,
      Table: componentConfig.Table,
      Modal: componentConfig.Modal,
      Input: componentConfig.Input,
      // 全局组件样式优化
      Message: {
        contentBg: tokens.colorBgElevated,
        colorText: tokens.colorText,
      },
      Notification: {
        colorBgElevated: tokens.colorBgElevated,
        colorText: tokens.colorText,
        colorIcon: tokens.colorPrimary,
      },
      Tooltip: {
        colorBgSpotlight: tokens.colorBgElevated,
        colorTextLightSolid: tokens.colorText,
      },
      Drawer: {
        colorBgElevated: tokens.colorBgElevated,
        colorBgMask: tokens.colorBgMask,
      },
      Select: {
        colorBgElevated: tokens.colorBgElevated,
        optionSelectedBg: 'rgba(255, 107, 138, 0.1)',
      },
      DatePicker: {
        colorBgElevated: tokens.colorBgElevated,
        colorBgContainer: tokens.colorBgContainer,
      },
      Segmented: {
        itemSelectedBg: 'rgba(255, 107, 138, 0.16)',
        itemHoverBg: 'rgba(240, 246, 252, 0.08)',
        borderRadius: 999,
        controlHeight: 32,
      },
      Tag: {
        borderRadiusSM: 999,
        defaultBg: mode === 'dark' ? 'rgba(240, 246, 252, 0.06)' : 'rgba(0, 0, 0, 0.04)',
        defaultColor: tokens.colorTextSecondary,
      },
      Tabs: {
        itemSelectedColor: tokens.colorText,
        inkBarColor: tokens.colorPrimary,
        itemHoverColor: tokens.colorText,
        cardBg: tokens.colorBgElevated,
      },
      Badge: {
        colorBg: tokens.colorPrimary,
        colorText: '#ffffff',
      },
      Divider: {
        colorSplit: tokens.colorSplit,
        marginLG: 16,
      },
    },
  };
};