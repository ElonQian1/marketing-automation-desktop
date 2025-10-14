// src/modules/universal-ui/styles/step-card-theme.ts
// module: universal-ui | layer: styles | role: theme-system
// summary: 统一的步骤卡片样式和主题系统，消除各组件间的样式重复

import type { CSSProperties } from 'react';

/**
 * 步骤卡片主题类型
 */
export type StepCardTheme = 'default' | 'compact' | 'modern' | 'dark' | 'light';

/**
 * 步骤卡片尺寸类型
 */
export type StepCardSize = 'small' | 'default' | 'large';

/**
 * 步骤卡片状态类型
 */
export type StepCardState = 'idle' | 'active' | 'disabled' | 'error' | 'analyzing' | 'completed';

/**
 * 拖拽效果类型
 */
export type DragEffect = 'rotate' | 'scale' | 'shadow' | 'none';

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    border: {
      default: string;
      active: string;
      disabled: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

/**
 * 默认主题配置
 */
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#13c2c2',
    background: '#ffffff',
    surface: '#fafafa',
    text: {
      primary: 'rgba(0, 0, 0, 0.88)',
      secondary: 'rgba(0, 0, 0, 0.65)',
      disabled: 'rgba(0, 0, 0, 0.25)',
      inverse: 'rgba(255, 255, 255, 0.85)'
    },
    border: {
      default: '#d9d9d9',
      active: '#1890ff',
      disabled: '#f0f0f0'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    md: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    lg: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease'
  }
};

/**
 * 紧凑主题配置
 */
export const compactTheme: ThemeConfig = {
  ...defaultTheme,
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '6px'
  }
};

/**
 * 现代主题配置
 */
export const modernTheme: ThemeConfig = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc'
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px'
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  }
};

/**
 * 深色主题配置
 */
export const darkTheme: ThemeConfig = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: '#141414',
    surface: '#1f1f1f',
    text: {
      primary: 'rgba(255, 255, 255, 0.88)',
      secondary: 'rgba(255, 255, 255, 0.65)',
      disabled: 'rgba(255, 255, 255, 0.25)',
      inverse: 'rgba(0, 0, 0, 0.88)'
    },
    border: {
      default: '#424242',
      active: '#1890ff',
      disabled: '#2f2f2f'
    }
  }
};

/**
 * 浅色主题配置
 */
export const lightTheme: ThemeConfig = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: '#ffffff',
    surface: '#ffffff',
    border: {
      default: '#e8e8e8',
      active: '#1890ff',
      disabled: '#f5f5f5'
    }
  }
};

/**
 * 主题映射
 */
export const THEMES: Record<StepCardTheme, ThemeConfig> = {
  default: defaultTheme,
  compact: compactTheme,
  modern: modernTheme,
  dark: darkTheme,
  light: lightTheme
};

/**
 * 尺寸配置
 */
export const SIZE_CONFIG: Record<StepCardSize, {
  padding: string;
  minHeight: string;
  fontSize: string;
  iconSize: string;
}> = {
  small: {
    padding: '8px 12px',
    minHeight: '48px',
    fontSize: '12px',
    iconSize: '14px'
  },
  default: {
    padding: '12px 16px',
    minHeight: '64px',
    fontSize: '14px',
    iconSize: '16px'
  },
  large: {
    padding: '16px 20px',
    minHeight: '80px',
    fontSize: '16px',
    iconSize: '18px'
  }
};

/**
 * 状态样式配置
 */
export const getStateStyles = (state: StepCardState, theme: ThemeConfig): CSSProperties => {
  switch (state) {
    case 'active':
      return {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.background,
        boxShadow: `0 0 0 2px ${theme.colors.primary}25`
      };
    case 'disabled':
      return {
        opacity: 0.5,
        backgroundColor: theme.colors.border.disabled,
        color: theme.colors.text.disabled
      };
    case 'error':
      return {
        borderColor: theme.colors.error,
        backgroundColor: `${theme.colors.error}08`
      };
    case 'analyzing':
      return {
        borderColor: theme.colors.info,
        backgroundColor: `${theme.colors.info}08`,
        position: 'relative'
      };
    case 'completed':
      return {
        borderColor: theme.colors.success,
        backgroundColor: `${theme.colors.success}08`
      };
    default:
      return {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border.default
      };
  }
};

/**
 * 拖拽效果样式
 */
export const getDragEffectStyles = (effect: DragEffect, isDragging: boolean): CSSProperties => {
  if (!isDragging) {
    return {};
  }

  switch (effect) {
    case 'rotate':
      return {
        transform: 'rotate(2deg) scale(0.98)',
        opacity: 0.7,
        transition: 'none',
        zIndex: 1000
      };
    case 'scale':
      return {
        transform: 'scale(0.95)',
        opacity: 0.8,
        transition: 'none',
        zIndex: 1000
      };
    case 'shadow':
      return {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        opacity: 0.9,
        transition: 'none',
        zIndex: 1000
      };
    default:
      return {
        opacity: 0.7,
        transition: 'none',
        zIndex: 1000
      };
  }
};

/**
 * 生成完整的步骤卡片样式
 */
export const generateStepCardStyles = ({
  theme = 'default',
  size = 'default',
  state = 'idle',
  dragEffect = 'rotate',
  isDragging = false,
  customClassName = '',
  customStyle = {}
}: {
  theme?: StepCardTheme;
  size?: StepCardSize;
  state?: StepCardState;
  dragEffect?: DragEffect;
  isDragging?: boolean;
  customClassName?: string;
  customStyle?: CSSProperties;
}) => {
  const themeConfig = THEMES[theme];
  const sizeConfig = SIZE_CONFIG[size];
  
  const baseStyles: CSSProperties = {
    padding: sizeConfig.padding,
    minHeight: sizeConfig.minHeight,
    fontSize: sizeConfig.fontSize,
    borderRadius: themeConfig.borderRadius.md,
    border: `1px solid ${themeConfig.colors.border.default}`,
    transition: themeConfig.transitions.normal,
    cursor: 'default',
    ...getStateStyles(state, themeConfig),
    ...getDragEffectStyles(dragEffect, isDragging),
    ...customStyle
  };

  const className = [
    'unified-step-card',
    `unified-step-card--${theme}`,
    `unified-step-card--${size}`,
    `unified-step-card--${state}`,
    isDragging ? 'unified-step-card--dragging' : '',
    customClassName
  ].filter(Boolean).join(' ');

  return {
    styles: baseStyles,
    className,
    themeConfig,
    sizeConfig
  };
};

/**
 * CSS-in-JS 样式生成器
 */
export const createStepCardCSS = () => {
  const css = `
    .unified-step-card {
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      word-wrap: break-word;
      transition: all 0.2s ease;
    }

    .unified-step-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
    }

    .unified-step-card--dragging {
      cursor: grabbing;
    }

    .unified-step-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .unified-step-card__title {
      font-weight: 500;
      margin: 0;
      flex: 1;
    }

    .unified-step-card__actions {
      display: flex;
      gap: 4px;
    }

    .unified-step-card__content {
      flex: 1;
    }

    .unified-step-card__status-bar {
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .unified-step-card__status-bar--analyzing {
      background-color: #e6f7ff;
      border: 1px solid #91d5ff;
      color: #0050b3;
    }

    .unified-step-card__status-bar--completed {
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #389e0d;
    }

    .unified-step-card__status-bar--error {
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
      color: #cf1322;
    }

    .unified-step-card__progress {
      flex: 1;
    }

    .unified-step-card__drag-handle {
      cursor: grab;
      padding: 4px;
      margin: -4px;
      border-radius: 4px;
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }

    .unified-step-card__drag-handle:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.04);
    }

    .unified-step-card__drag-handle:active {
      cursor: grabbing;
    }

    /* 主题特定样式 */
    .unified-step-card--dark {
      background-color: #1f1f1f;
      border-color: #424242;
      color: rgba(255, 255, 255, 0.88);
    }

    .unified-step-card--dark:hover {
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
    }

    .unified-step-card--compact {
      padding: 8px 12px;
      min-height: 48px;
    }

    .unified-step-card--modern {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* 状态特定样式 */
    .unified-step-card--disabled {
      pointer-events: none;
    }

    .unified-step-card--analyzing::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #1890ff, #13c2c2);
      border-radius: 2px 2px 0 0;
      animation: analyzing-pulse 2s ease-in-out infinite;
    }

    @keyframes analyzing-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .unified-step-card {
        padding: 8px 12px;
      }
      
      .unified-step-card__actions {
        gap: 2px;
      }
    }

    /* 强制浅色主题 */
    .light-theme-force .unified-step-card {
      background-color: #ffffff;
      color: rgba(0, 0, 0, 0.88);
      border-color: #d9d9d9;
    }
  `;

  return css;
};