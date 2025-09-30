/**
 * 系统主题检测 Hook
 * 提供系统主题检测和监听功能
 */

import { useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '../types';

/**
 * 系统主题检测选项
 */
export interface SystemThemeOptions {
  /** 检测失败时的默认主题 */
  fallback?: ThemeMode;
  /** 是否实时监听系统主题变化 */
  watchChanges?: boolean;
  /** 主题变化时的回调函数 */
  onChange?: (theme: ThemeMode) => void;
}

/**
 * 系统主题检测结果
 */
export interface SystemThemeResult {
  /** 当前系统主题 */
  theme: ThemeMode;
  /** 是否支持系统主题检测 */
  isSupported: boolean;
  /** 是否正在监听变化 */
  isWatching: boolean;
  /** 手动刷新系统主题 */
  refresh: () => ThemeMode;
  /** 开始监听系统主题变化 */
  startWatching: () => void;
  /** 停止监听系统主题变化 */
  stopWatching: () => void;
}

/**
 * 检测浏览器是否支持 prefers-color-scheme
 */
const isMediaQuerySupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia !== undefined && 
           window.matchMedia('(prefers-color-scheme: dark)') !== null;
  } catch {
    return false;
  }
};

/**
 * 获取当前系统主题
 */
const getCurrentSystemTheme = (fallback: ThemeMode = 'light'): ThemeMode => {
  if (!isMediaQuerySupported()) return fallback;
  
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  } catch {
    return fallback;
  }
};

/**
 * 系统主题检测 Hook
 */
export const useSystemTheme = (options: SystemThemeOptions = {}): SystemThemeResult => {
  const {
    fallback = 'light',
    watchChanges = true,
    onChange,
  } = options;

  const [theme, setTheme] = useState<ThemeMode>(() => getCurrentSystemTheme(fallback));
  const [isWatching, setIsWatching] = useState(false);
  const isSupported = isMediaQuerySupported();

  // 手动刷新系统主题
  const refresh = useCallback((): ThemeMode => {
    const currentTheme = getCurrentSystemTheme(fallback);
    setTheme(currentTheme);
    return currentTheme;
  }, [fallback]);

  // 处理系统主题变化
  const handleThemeChange = useCallback((e: MediaQueryListEvent) => {
    const newTheme = e.matches ? 'dark' : 'light';
    setTheme(newTheme);
    onChange?.(newTheme);
  }, [onChange]);

  // 开始监听系统主题变化
  const startWatching = useCallback(() => {
    if (!isSupported || isWatching) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleThemeChange);
      setIsWatching(true);
      
      // 立即检查一次当前主题
      refresh();
    } catch (error) {
      console.warn('无法监听系统主题变化:', error);
    }
  }, [isSupported, isWatching, handleThemeChange, refresh]);

  // 停止监听系统主题变化
  const stopWatching = useCallback(() => {
    if (!isSupported || !isWatching) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', handleThemeChange);
      setIsWatching(false);
    } catch (error) {
      console.warn('无法停止监听系统主题变化:', error);
    }
  }, [isSupported, isWatching, handleThemeChange]);

  // 自动开始监听（如果启用）
  useEffect(() => {
    if (watchChanges && isSupported) {
      startWatching();
      return stopWatching;
    }
  }, [watchChanges, isSupported, startWatching, stopWatching]);

  // 组件卸载时清理监听器
  useEffect(() => {
    return () => {
      if (isWatching) {
        stopWatching();
      }
    };
  }, [isWatching, stopWatching]);

  return {
    theme,
    isSupported,
    isWatching,
    refresh,
    startWatching,
    stopWatching,
  };
};

/**
 * 简化版系统主题检测 Hook
 * 只返回当前系统主题，不提供监听功能
 */
export const useSystemThemeSimple = (fallback: ThemeMode = 'light'): ThemeMode => {
  const [theme, setTheme] = useState<ThemeMode>(() => getCurrentSystemTheme(fallback));

  useEffect(() => {
    const currentTheme = getCurrentSystemTheme(fallback);
    setTheme(currentTheme);
  }, [fallback]);

  return theme;
};

/**
 * 检查系统是否偏好暗色主题
 */
export const usePrefersDark = (): boolean => {
  const theme = useSystemThemeSimple();
  return theme === 'dark';
};

/**
 * 检查系统是否偏好亮色主题
 */
export const usePrefersLight = (): boolean => {
  const theme = useSystemThemeSimple();
  return theme === 'light';
};

/**
 * 导出工具函数
 */
export {
  isMediaQuerySupported,
  getCurrentSystemTheme,
};