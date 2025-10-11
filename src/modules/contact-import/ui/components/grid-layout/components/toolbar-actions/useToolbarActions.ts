// src/modules/contact-import/ui/components/grid-layout/components/toolbar-actions/useToolbarActions.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 工具栏操作Hook
 * 封装工具栏的所有操作逻辑，提供统一的接口
 */

import { useState, useCallback, useMemo } from 'react';
import { ToolbarActionManager, type ToolbarActionCallbacks, type LayoutResetOptions } from './ToolbarActionManager';
import { createEnhancedSettingsMenu, createCompactSettingsMenu, type ToolbarSettings, type EnhancedSettingsMenuConfig } from './EnhancedSettingsMenu';
import type { PanelConfig } from '../../GridLayoutWrapper';

export interface UseToolbarActionsConfig {
  panels: PanelConfig[];
  onPanelVisibilityChange: (panelId: string, visible: boolean) => void;
  onLayoutChange?: (layout: any[]) => void;
  enablePerformanceMode?: boolean;
  onPerformanceModeChange?: (enabled: boolean) => void;
  onToolbarVisibilityChange?: (visible: boolean) => void;
}

export interface UseToolbarActionsReturn {
  // 工具栏设置
  settings: ToolbarSettings;
  updateSettings: (newSettings: Partial<ToolbarSettings>) => void;
  
  // 操作方法
  resetLayout: (options?: LayoutResetOptions) => void;
  togglePerformanceMode: () => void;
  hideToolbar: () => void;
  applyLayoutPreset: (presetName: string) => void;
  toggleAllPanels: (visible: boolean) => void;
  
  // 菜单配置
  enhancedSettingsMenuItems: any[];
  compactSettingsMenuItems: any[];
  
  // 工具栏状态
  availablePresets: string[];
}

export const useToolbarActions = (config: UseToolbarActionsConfig): UseToolbarActionsReturn => {
  const {
    panels,
    onPanelVisibilityChange,
    onLayoutChange,
    enablePerformanceMode = false,
    onPerformanceModeChange,
    onToolbarVisibilityChange
  } = config;

  // 工具栏设置状态
  const [settings, setSettings] = useState<ToolbarSettings>({
    isPinned: false,
    isCollapsed: false
  });

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<ToolbarSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 创建回调配置
  const callbacks: ToolbarActionCallbacks = useMemo(() => ({
    onPanelVisibilityChange,
    onLayoutChange,
    onPerformanceModeChange,
    onToolbarVisibilityChange
  }), [onPanelVisibilityChange, onLayoutChange, onPerformanceModeChange, onToolbarVisibilityChange]);

  // 创建动作管理器
  const actionManager = useMemo(() => {
    return new ToolbarActionManager(panels, callbacks);
  }, [panels, callbacks]);

  // 更新面板数据
  useMemo(() => {
    actionManager.updatePanels(panels);
  }, [actionManager, panels]);

  // 操作方法
  const resetLayout = useCallback((options?: LayoutResetOptions) => {
    actionManager.resetLayout(options);
  }, [actionManager]);

  const togglePerformanceMode = useCallback(() => {
    actionManager.togglePerformanceMode(enablePerformanceMode);
  }, [actionManager, enablePerformanceMode]);

  const hideToolbar = useCallback(() => {
    actionManager.hideToolbar();
  }, [actionManager]);

  const applyLayoutPreset = useCallback((presetName: string) => {
    actionManager.applyLayoutPreset(presetName);
  }, [actionManager]);

  const toggleAllPanels = useCallback((visible: boolean) => {
    actionManager.toggleAllPanels(visible);
  }, [actionManager]);

  // 获取可用预设
  const availablePresets = useMemo(() => {
    return actionManager.getAvailablePresets();
  }, [actionManager]);

  // 增强设置菜单配置
  const enhancedMenuConfig: EnhancedSettingsMenuConfig = useMemo(() => ({
    settings,
    enablePerformanceMode,
    availablePresets,
    onSettingsChange: updateSettings,
    onPerformanceModeToggle: togglePerformanceMode,
    onLayoutPresetApply: applyLayoutPreset,
    onHideToolbar: hideToolbar,
    onResetLayout: resetLayout,
    onToggleAllPanels: toggleAllPanels
  }), [
    settings,
    enablePerformanceMode,
    availablePresets,
    updateSettings,
    togglePerformanceMode,
    applyLayoutPreset,
    hideToolbar,
    resetLayout,
    toggleAllPanels
  ]);

  // 菜单项
  const enhancedSettingsMenuItems = useMemo(() => {
    return createEnhancedSettingsMenu(enhancedMenuConfig);
  }, [enhancedMenuConfig]);

  const compactSettingsMenuItems = useMemo(() => {
    return createCompactSettingsMenu({
      settings,
      onSettingsChange: updateSettings,
      onHideToolbar: hideToolbar
    });
  }, [settings, updateSettings, hideToolbar]);

  return {
    settings,
    updateSettings,
    resetLayout,
    togglePerformanceMode,
    hideToolbar,
    applyLayoutPreset,
    toggleAllPanels,
    enhancedSettingsMenuItems,
    compactSettingsMenuItems,
    availablePresets
  };
};