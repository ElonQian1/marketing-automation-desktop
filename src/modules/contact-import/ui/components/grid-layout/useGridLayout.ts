import { useState, useCallback, useEffect } from 'react';
import { Layout } from 'react-grid-layout';
import { PanelConfig } from './GridLayoutWrapper';

export interface LayoutConfig {
  panels: PanelConfig[];
  layouts: { [key: string]: Layout[] };
}

export interface UseGridLayoutOptions {
  defaultPanels: Omit<PanelConfig, 'content'>[];
  storageKey?: string;
}

export function useGridLayout({ defaultPanels, storageKey = 'contact-import-grid-layout' }: UseGridLayoutOptions) {
  // 初始化面板配置
  const [panelConfigs, setPanelConfigs] = useState<Omit<PanelConfig, 'content'>[]>(() => {
    // 尝试从 localStorage 恢复
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.panels || defaultPanels;
        }
      } catch (error) {
        console.warn('Failed to load grid layout from localStorage:', error);
      }
    }
    return defaultPanels;
  });

  // 保存配置到 localStorage
  const saveConfig = useCallback(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          panels: panelConfigs,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.warn('Failed to save grid layout to localStorage:', error);
      }
    }
  }, [panelConfigs, storageKey]);

  // 防抖保存
  useEffect(() => {
    const timeoutId = setTimeout(saveConfig, 1000);
    return () => clearTimeout(timeoutId);
  }, [saveConfig]);

  // 更新面板配置
  const updatePanelConfig = useCallback((panelId: string, updates: Partial<Omit<PanelConfig, 'content'>>) => {
    setPanelConfigs(prev => prev.map(panel => 
      panel.i === panelId ? { ...panel, ...updates } : panel
    ));
  }, []);

  // 切换面板可见性
  const togglePanelVisibility = useCallback((panelId: string, visible?: boolean) => {
    setPanelConfigs(prev => prev.map(panel => 
      panel.i === panelId 
        ? { ...panel, visible: visible !== undefined ? visible : !panel.visible }
        : panel
    ));
  }, []);

  // 处理布局变化
  const handleLayoutChange = useCallback((layout: Layout[]) => {
    setPanelConfigs(prev => prev.map(panel => {
      const layoutItem = layout.find(item => item.i === panel.i);
      if (layoutItem) {
        return {
          ...panel,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return panel;
    }));
  }, []);

  // 重置布局
  const resetLayout = useCallback(() => {
    setPanelConfigs([...defaultPanels]);
  }, [defaultPanels]);

  // 获取可见面板
  const getVisiblePanels = useCallback(() => {
    return panelConfigs.filter(panel => panel.visible);
  }, [panelConfigs]);

  return {
    panelConfigs,
    updatePanelConfig,
    togglePanelVisibility,
    handleLayoutChange,
    resetLayout,
    getVisiblePanels,
    saveConfig,
  };
}