/**
 * 主题管理 Hook
 * 提供主题状态管理和切换功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  ThemeMode, 
  AppThemeConfig, 
  ThemeOptions, 
  ThemeEventListener,
  ThemeEventData,
  ThemeEventType,
} from '../types';
import { generateCSSVariables, generateAntdThemeConfig } from '../tokens';

/**
 * 默认主题选项
 */
const defaultThemeOptions: Required<ThemeOptions> = {
  defaultMode: 'dark',
  presets: [],
  animation: {
    enabled: true,
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enableDarkModeTransition: true,
  },
  storage: {
    key: 'app-theme-mode',
    autoSave: true,
    persistent: true,
  },
  detectSystemTheme: true,
  customConfig: {},
};

/**
 * 主题管理 Hook
 */
export const useThemeManager = (options: Partial<ThemeOptions> = {}) => {
  const opts = { ...defaultThemeOptions, ...options };
  const eventListenersRef = useRef<Map<string, ThemeEventListener[]>>(new Map());
  
  // 检测系统主题
  const detectSystemTheme = useCallback((): ThemeMode => {
    if (typeof window === 'undefined') return opts.defaultMode;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    } catch {
      return opts.defaultMode;
    }
  }, [opts.defaultMode]);

  // 从存储中获取保存的主题
  const getSavedTheme = useCallback((): ThemeMode => {
    if (typeof window === 'undefined' || !opts.storage.persistent) {
      return opts.defaultMode;
    }
    
    try {
      const saved = localStorage.getItem(opts.storage.key);
      if (saved && (saved === 'light' || saved === 'dark')) {
        return saved as ThemeMode;
      }
    } catch {
      // localStorage 不可用
    }
    
    return opts.detectSystemTheme ? detectSystemTheme() : opts.defaultMode;
  }, [opts.defaultMode, opts.detectSystemTheme, opts.storage.key, opts.storage.persistent, detectSystemTheme]);

  // 状态管理
  const [mode, setModeState] = useState<ThemeMode>(getSavedTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [config, setConfigState] = useState<AppThemeConfig>(() => ({
    mode,
    ...generateAntdThemeConfig(mode),
    ...opts.customConfig,
  }));

  // 事件发射器
  const emitEvent = useCallback((type: ThemeEventType, data: Partial<ThemeEventData> = {}) => {
    const eventData: ThemeEventData = {
      type,
      mode,
      config,
      timestamp: Date.now(),
      ...data,
    };

    const listeners = eventListenersRef.current.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error(`主题事件监听器错误 [${type}]:`, error);
      }
    });
  }, [mode, config]);

  // 保存主题到存储
  const saveTheme = useCallback((newMode: ThemeMode) => {
    if (typeof window === 'undefined' || !opts.storage.autoSave || !opts.storage.persistent) {
      return;
    }
    
    try {
      localStorage.setItem(opts.storage.key, newMode);
    } catch (error) {
      console.warn('无法保存主题设置:', error);
    }
  }, [opts.storage.autoSave, opts.storage.key, opts.storage.persistent]);

  // 应用主题到 DOM
  const applyThemeToDom = useCallback((newMode: ThemeMode, newConfig: AppThemeConfig) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // 设置主题属性
    root.setAttribute('data-theme', newMode);
    // 统一设置更克制的描边密度，弱化“线框感”
    if (!root.getAttribute('data-outline')) {
      root.setAttribute('data-outline', 'minimal'); // minimal | default | strong
    }
    // Tailwind 兼容：darkMode: 'class'，同步 html.dark 类
    if (newMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // 兼容性类名
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${newMode}`);
    
    // 应用 CSS 变量
    const cssVars = generateCSSVariables(newMode);
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // 设置过渡动画
    if (opts.animation.enabled) {
      root.style.setProperty('--theme-transition-duration', `${opts.animation.duration}ms`);
      root.style.setProperty('--theme-transition-function', opts.animation.easing);
      
      if (opts.animation.enableDarkModeTransition) {
        root.style.transition = `background-color ${opts.animation.duration}ms ${opts.animation.easing}`;
      }
    }
  }, [opts.animation]);

  // 切换主题模式
  const setMode = useCallback(async (newMode: ThemeMode) => {
    if (newMode === mode) return;

    setIsTransitioning(true);
    emitEvent('transitionStart', { mode: newMode });

    try {
      // 更新配置
      const newConfig: AppThemeConfig = {
        mode: newMode,
        ...generateAntdThemeConfig(newMode),
        ...opts.customConfig,
      };

      // 应用主题
      applyThemeToDom(newMode, newConfig);

      // 等待动画完成
      if (opts.animation.enabled) {
        await new Promise(resolve => setTimeout(resolve, opts.animation.duration));
      }

      // 更新状态
      setModeState(newMode);
      setConfigState(newConfig);

      // 保存设置
      saveTheme(newMode);

      emitEvent('modeChanged', { mode: newMode, config: newConfig });
    } catch (error) {
      console.error('主题切换失败:', error);
    } finally {
      setIsTransitioning(false);
      emitEvent('transitionEnd', { mode: newMode });
    }
  }, [mode, opts.customConfig, opts.animation, applyThemeToDom, saveTheme, emitEvent]);

  // 更新主题配置
  const updateConfig = useCallback((updates: Partial<AppThemeConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfigState(newConfig);
    
    if (newConfig.mode !== mode) {
      setMode(newConfig.mode);
    } else {
      applyThemeToDom(mode, newConfig);
      emitEvent('configUpdated', { config: newConfig });
    }
  }, [config, mode, setMode, applyThemeToDom, emitEvent]);

  // 重置主题配置
  const resetConfig = useCallback(() => {
    const defaultConfig: AppThemeConfig = {
      mode,
      ...generateAntdThemeConfig(mode),
    };
    
    setConfigState(defaultConfig);
    applyThemeToDom(mode, defaultConfig);
    emitEvent('reset', { config: defaultConfig });
  }, [mode, applyThemeToDom, emitEvent]);

  // 切换主题模式（light/dark 互切）
  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  // 跟随系统主题
  const followSystemTheme = useCallback(() => {
    const systemTheme = detectSystemTheme();
    setMode(systemTheme);
  }, [detectSystemTheme, setMode]);

  // 添加事件监听器
  const addEventListener = useCallback((type: ThemeEventType, listener: ThemeEventListener) => {
    const listeners = eventListenersRef.current.get(type) || [];
    listeners.push(listener);
    eventListenersRef.current.set(type, listeners);

    // 返回移除监听器的函数
    return () => {
      const currentListeners = eventListenersRef.current.get(type) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        eventListenersRef.current.set(type, currentListeners);
      }
    };
  }, []);

  // 移除事件监听器
  const removeEventListener = useCallback((type: ThemeEventType, listener: ThemeEventListener) => {
    const listeners = eventListenersRef.current.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      eventListenersRef.current.set(type, listeners);
    }
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    if (!opts.detectSystemTheme || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      emitEvent('modeChanged', { mode: systemTheme });
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // 旧版浏览器兼容
      return undefined;
    }
  }, [opts.detectSystemTheme, emitEvent]);

  // 初始化主题
  useEffect(() => {
    applyThemeToDom(mode, config);
  }, []); // 只在组件挂载时执行一次

  return {
    // 状态
    mode,
    config,
    isTransitioning,
    
    // 操作方法
    setMode,
    updateConfig,
    resetConfig,
    toggleMode,
    followSystemTheme,
    
    // 事件管理
    addEventListener,
    removeEventListener,
    
    // 工具方法
    detectSystemTheme,
    getSavedTheme,
    
    // 配置选项
    options: opts,
  };
};