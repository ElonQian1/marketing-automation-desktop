import { useState, useCallback, useEffect } from 'react';

export type ToolbarType = 'fixed' | 'floating' | 'hidden';
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ToolbarSettings {
  type: ToolbarType;
  position: ToolbarPosition;
  isCollapsed: boolean;
  isPinned: boolean;
  autoHide: boolean;
  autoHideDelay: number; // 毫秒
}

export interface UseToolbarManagerOptions {
  storageKey?: string;
  defaultSettings?: Partial<ToolbarSettings>;
}

const DEFAULT_SETTINGS: ToolbarSettings = {
  type: 'floating',
  position: 'top-right',
  isCollapsed: false,
  isPinned: false,
  autoHide: false,
  autoHideDelay: 3000
};

export function useToolbarManager({
  storageKey = 'layout-toolbar-settings',
  defaultSettings = {}
}: UseToolbarManagerOptions = {}) {
  // 从 localStorage 加载设置
  const loadSettings = useCallback((): ToolbarSettings => {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS, ...defaultSettings };

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load toolbar settings:', error);
    }
    return { ...DEFAULT_SETTINGS, ...defaultSettings };
  }, [storageKey, defaultSettings]);

  const [settings, setSettings] = useState<ToolbarSettings>(loadSettings);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // 保存设置到 localStorage
  const saveSettings = useCallback((newSettings: ToolbarSettings) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save toolbar settings:', error);
    }
  }, [storageKey]);

  // 更新设置
  const updateSettings = useCallback((updates: Partial<ToolbarSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 切换工具栏类型
  const setToolbarType = useCallback((type: ToolbarType) => {
    updateSettings({ type });
    if (type !== 'hidden') {
      setIsVisible(true);
    }
  }, [updateSettings]);

  // 切换工具栏位置
  const setToolbarPosition = useCallback((position: ToolbarPosition) => {
    updateSettings({ position });
  }, [updateSettings]);

  // 切换折叠状态
  const toggleCollapsed = useCallback(() => {
    updateSettings({ isCollapsed: !settings.isCollapsed });
  }, [settings.isCollapsed, updateSettings]);

  // 切换固定状态
  const togglePinned = useCallback(() => {
    updateSettings({ isPinned: !settings.isPinned });
  }, [settings.isPinned, updateSettings]);

  // 切换自动隐藏
  const toggleAutoHide = useCallback(() => {
    updateSettings({ autoHide: !settings.autoHide });
  }, [settings.autoHide, updateSettings]);

  // 显示/隐藏工具栏
  const showToolbar = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideToolbar = useCallback(() => {
    if (settings.type === 'hidden') return;
    setIsVisible(false);
  }, [settings.type]);

  // 重置到默认设置
  const resetSettings = useCallback(() => {
    const defaultSettings = { ...DEFAULT_SETTINGS };
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    setIsVisible(true);
  }, [saveSettings]);

  // 自动隐藏逻辑
  useEffect(() => {
    if (!settings.autoHide || settings.isPinned || isHovering) return;

    const timer = setTimeout(() => {
      if (!isHovering) {
        hideToolbar();
      }
    }, settings.autoHideDelay);

    return () => clearTimeout(timer);
  }, [settings.autoHide, settings.isPinned, settings.autoHideDelay, isHovering, hideToolbar]);

  // 根据位置计算初始坐标
  const getInitialPosition = useCallback((): { x: number; y: number } => {
    const margin = 20;
    const toolbarWidth = settings.isCollapsed ? 150 : 350;
    const toolbarHeight = settings.isCollapsed ? 50 : 80;

    switch (settings.position) {
      case 'top-left':
        return { x: margin, y: margin };
      case 'top-right':
        return { x: window.innerWidth - toolbarWidth - margin, y: margin };
      case 'bottom-left':
        return { x: margin, y: window.innerHeight - toolbarHeight - margin };
      case 'bottom-right':
        return { 
          x: window.innerWidth - toolbarWidth - margin, 
          y: window.innerHeight - toolbarHeight - margin 
        };
      default:
        return { x: window.innerWidth - toolbarWidth - margin, y: margin };
    }
  }, [settings.position, settings.isCollapsed]);

  // 获取固定工具栏的样式
  const getFixedToolbarStyle = useCallback(() => {
    const margin = 20;
    
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      // 移除硬编码背景，使用CSS类控制
      padding: '8px 12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #f0f0f0',
    };

    switch (settings.position) {
      case 'top-left':
        return { ...baseStyle, top: margin, left: margin };
      case 'top-right':
        return { ...baseStyle, top: margin, right: margin };
      case 'bottom-left':
        return { ...baseStyle, bottom: margin, left: margin };
      case 'bottom-right':
        return { ...baseStyle, bottom: margin, right: margin };
      default:
        return { ...baseStyle, top: margin, right: margin };
    }
  }, [settings.position]);

  // 鼠标事件处理器
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (settings.autoHide) {
      showToolbar();
    }
  }, [settings.autoHide, showToolbar]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return {
    // 状态
    settings,
    isVisible,
    isHovering,
    
    // 设置控制
    setToolbarType,
    setToolbarPosition,
    toggleCollapsed,
    togglePinned,
    toggleAutoHide,
    updateSettings,
    resetSettings,
    
    // 显示控制
    showToolbar,
    hideToolbar,
    
    // 工具函数
    getInitialPosition,
    getFixedToolbarStyle,
    
    // 事件处理器
    mouseHandlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    },
    
    // 便捷属性
    shouldShowToolbar: isVisible && settings.type !== 'hidden',
    isFloating: settings.type === 'floating',
    isFixed: settings.type === 'fixed'
  };
}