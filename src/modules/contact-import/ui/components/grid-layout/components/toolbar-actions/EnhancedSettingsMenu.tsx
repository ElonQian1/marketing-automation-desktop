/**
 * 增强的工具栏设置菜单配置
 * 模块化管理工具栏的各种设置选项
 */

import React from 'react';
import type { MenuProps } from 'antd';
import { 
  PushpinOutlined, 
  PushpinFilled, 
  ExpandOutlined, 
  CompressOutlined,
  ThunderboltOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
  LayoutOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

export interface ToolbarSettings {
  isPinned: boolean;
  isCollapsed: boolean;
}

export interface EnhancedSettingsMenuConfig {
  settings: ToolbarSettings;
  enablePerformanceMode: boolean;
  availablePresets: string[];
  onSettingsChange: (settings: Partial<ToolbarSettings>) => void;
  onPerformanceModeToggle: () => void;
  onLayoutPresetApply: (presetName: string) => void;
  onHideToolbar: () => void;
  onResetLayout: () => void;
  onToggleAllPanels: (visible: boolean) => void;
}

export const createEnhancedSettingsMenu = (config: EnhancedSettingsMenuConfig): MenuProps['items'] => {
  const {
    settings,
    enablePerformanceMode,
    availablePresets,
    onSettingsChange,
    onPerformanceModeToggle,
    onLayoutPresetApply,
    onHideToolbar,
    onResetLayout,
    onToggleAllPanels
  } = config;

  return [
    // 基本设置组
    {
      key: 'pin',
      label: settings.isPinned ? '取消固定' : '固定位置',
      icon: settings.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
      onClick: () => onSettingsChange({ isPinned: !settings.isPinned })
    },
    {
      key: 'collapse',
      label: settings.isCollapsed ? '展开工具栏' : '收起工具栏',
      icon: settings.isCollapsed ? <ExpandOutlined /> : <CompressOutlined />,
      onClick: () => onSettingsChange({ isCollapsed: !settings.isCollapsed })
    },
    
    // 分割线
    { type: 'divider' as const },
    
    // 布局操作组
    {
      key: 'layout-actions',
      label: '布局操作',
      icon: <LayoutOutlined />,
      children: [
        {
          key: 'reset-layout',
          label: '重置布局',
          icon: <ReloadOutlined />,
          onClick: onResetLayout
        },
        {
          key: 'show-all',
          label: '显示所有面板',
          icon: <AppstoreOutlined />,
          onClick: () => onToggleAllPanels(true)
        },
        {
          key: 'hide-all',
          label: '隐藏所有面板',
          icon: <EyeInvisibleOutlined />,
          onClick: () => onToggleAllPanels(false)
        }
      ]
    },
    
    // 布局预设组
    {
      key: 'layout-presets',
      label: '布局预设',
      icon: <AppstoreOutlined />,
      children: availablePresets.map(preset => ({
        key: `preset-${preset}`,
        label: preset,
        onClick: () => onLayoutPresetApply(preset)
      }))
    },
    
    // 分割线
    { type: 'divider' as const },
    
    // 性能设置
    {
      key: 'performance',
      label: enablePerformanceMode ? '禁用性能模式' : '启用性能模式',
      icon: <ThunderboltOutlined />,
      onClick: onPerformanceModeToggle
    },
    
    // 分割线
    { type: 'divider' as const },
    
    // 隐藏工具栏
    {
      key: 'hide',
      label: '隐藏工具栏',
      icon: <EyeInvisibleOutlined />,
      onClick: onHideToolbar
    }
  ];
};

/**
 * 创建简化的设置菜单（用于收起状态）
 */
export const createCompactSettingsMenu = (config: Pick<EnhancedSettingsMenuConfig, 'settings' | 'onSettingsChange' | 'onHideToolbar'>): MenuProps['items'] => {
  const { settings, onSettingsChange, onHideToolbar } = config;

  return [
    {
      key: 'pin',
      label: settings.isPinned ? '取消固定' : '固定位置',
      icon: settings.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
      onClick: () => onSettingsChange({ isPinned: !settings.isPinned })
    },
    {
      key: 'expand',
      label: '展开工具栏',
      icon: <ExpandOutlined />,
      onClick: () => onSettingsChange({ isCollapsed: false })
    },
    { type: 'divider' as const },
    {
      key: 'hide',
      label: '隐藏工具栏',
      icon: <EyeInvisibleOutlined />,
      onClick: onHideToolbar
    }
  ];
};