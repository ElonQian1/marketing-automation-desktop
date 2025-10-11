// src/components/feature-modules/theme-system/providers/EnhancedThemeProvider.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 增强的主题提供者组件
 * 集成原生 Ant Design 5 暗黑模式
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd';
import { useThemeManager } from '../hooks/useThemeManager';
import type { 
  ThemeMode, 
  AppThemeConfig, 
  ThemeOptions,
  ThemeEventListener,
  ThemeEventType,
} from '../types';

/**
 * 主题上下文接口
 */
interface ThemeContextValue {
  /** 当前主题模式 */
  mode: ThemeMode;
  /** 主题配置 */
  config: AppThemeConfig;
  /** 是否正在切换主题 */
  isTransitioning: boolean;
  /** 切换主题模式 */
  setMode: (mode: ThemeMode) => Promise<void>;
  /** 更新主题配置 */
  updateConfig: (updates: Partial<AppThemeConfig>) => void;
  /** 重置主题配置 */
  resetConfig: () => void;
  /** 切换主题模式（light/dark 互切） */
  toggleMode: () => void;
  /** 跟随系统主题 */
  followSystemTheme: () => void;
  /** 添加事件监听器 */
  addEventListener: (type: ThemeEventType, listener: ThemeEventListener) => () => void;
  /** 移除事件监听器 */
  removeEventListener: (type: ThemeEventType, listener: ThemeEventListener) => void;
}

/**
 * 主题上下文
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 主题提供者属性
 */
interface EnhancedThemeProviderProps {
  /** 主题选项 */
  options?: Partial<ThemeOptions>;
  /** 子组件 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 Ant Design App 组件包装 */
  enableAntdApp?: boolean;
}

/**
 * 增强的主题提供者组件
 */
export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({
  options = {},
  children,
  className,
  enableAntdApp = true,
}) => {
  const themeManager = useThemeManager(options);
  const containerRef = useRef<HTMLDivElement>(null);

  // 应用主题类名到容器
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      
      // 移除旧的主题类名
      container.classList.remove('theme-light', 'theme-dark');
      
      // 添加新的主题类名
      container.classList.add(`theme-${themeManager.mode}`);
      
      // 设置数据属性
      container.setAttribute('data-theme', themeManager.mode);
    }
  }, [themeManager.mode]);

  // 上下文值
  const contextValue: ThemeContextValue = {
    mode: themeManager.mode,
    config: themeManager.config,
    isTransitioning: themeManager.isTransitioning,
    setMode: themeManager.setMode,
    updateConfig: themeManager.updateConfig,
    resetConfig: themeManager.resetConfig,
    toggleMode: themeManager.toggleMode,
    followSystemTheme: themeManager.followSystemTheme,
    addEventListener: themeManager.addEventListener,
    removeEventListener: themeManager.removeEventListener,
  };

  // Ant Design 主题配置
  const antdThemeConfig = {
    algorithm: themeManager.mode === 'dark' 
      ? [antdTheme.darkAlgorithm] 
      : [antdTheme.defaultAlgorithm],
    token: themeManager.config.token,
    components: themeManager.config.components,
  };

  // 渲染内容
  const renderContent = () => {
    if (enableAntdApp) {
      return (
        <AntdApp>
          {children}
        </AntdApp>
      );
    }
    return children;
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={antdThemeConfig}>
        <div 
          ref={containerRef}
          className={`theme-provider-container ${className || ''}`}
          data-theme={themeManager.mode}
          style={{
            minHeight: '100vh',
            transition: themeManager.options.animation.enabled 
              ? `background-color ${themeManager.options.animation.duration}ms ${themeManager.options.animation.easing}`
              : undefined,
          }}
        >
          {renderContent()}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

/**
 * 使用主题上下文的 Hook
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within an EnhancedThemeProvider');
  }
  
  return context;
};

/**
 * 主题状态 Hook（只读）
 */
export const useThemeState = () => {
  const { mode, config, isTransitioning } = useTheme();
  
  return {
    mode,
    config,
    isTransitioning,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };
};

/**
 * 主题操作 Hook
 */
export const useThemeActions = () => {
  const { 
    setMode, 
    updateConfig, 
    resetConfig, 
    toggleMode, 
    followSystemTheme 
  } = useTheme();
  
  return {
    setMode,
    updateConfig,
    resetConfig,
    toggleMode,
    followSystemTheme,
  };
};

/**
 * 主题事件 Hook
 */
export const useThemeEvents = () => {
  const { addEventListener, removeEventListener } = useTheme();
  
  return {
    addEventListener,
    removeEventListener,
  };
};