import { useState, useCallback, useEffect } from 'react';

export interface PanelConfig {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  isMinimized?: boolean;
  isVisible?: boolean;
  zIndex?: number;
}

export interface LayoutState {
  panels: Record<string, PanelConfig>;
  activePanel: string | null;
}

interface UseResizableLayoutOptions {
  defaultPanels: PanelConfig[];
  storageKey?: string;
}

export function useResizableLayout(options: UseResizableLayoutOptions) {
  const { defaultPanels, storageKey = 'contact-import-layout' } = options;

  // 初始化状态
  const [layoutState, setLayoutState] = useState<LayoutState>(() => {
    // 尝试从localStorage恢复布局
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            panels: parsed.panels || {},
            activePanel: null,
          };
        }
      } catch (error) {
        console.warn('Failed to load layout from localStorage:', error);
      }
    }

    // 使用默认配置
    const panels = defaultPanels.reduce((acc, panel) => {
      acc[panel.id] = { ...panel };
      return acc;
    }, {} as Record<string, PanelConfig>);

    return {
      panels,
      activePanel: null,
    };
  });

  // 保存到localStorage
  const saveLayout = useCallback(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          panels: layoutState.panels,
        }));
      } catch (error) {
        console.warn('Failed to save layout to localStorage:', error);
      }
    }
  }, [layoutState.panels, storageKey]);

  // 保存布局（防抖）
  useEffect(() => {
    const timeoutId = setTimeout(saveLayout, 500);
    return () => clearTimeout(timeoutId);
  }, [saveLayout]);

  // 更新面板配置
  const updatePanel = useCallback((panelId: string, updates: Partial<PanelConfig>) => {
    setLayoutState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelId]: {
          ...prev.panels[panelId],
          ...updates,
        },
      },
    }));
  }, []);

  // 设置活跃面板
  const setActivePanel = useCallback((panelId: string | null) => {
    setLayoutState(prev => ({
      ...prev,
      activePanel: panelId,
    }));

    // 如果设置了活跃面板，提升其z-index
    if (panelId) {
      const maxZ = Math.max(...Object.values(layoutState.panels).map(p => p.zIndex || 0));
      updatePanel(panelId, { zIndex: maxZ + 1 });
    }
  }, [layoutState.panels, updatePanel]);

  // 切换面板可见性
  const togglePanelVisibility = useCallback((panelId: string) => {
    const panel = layoutState.panels[panelId];
    if (panel) {
      updatePanel(panelId, { isVisible: !panel.isVisible });
    }
  }, [layoutState.panels, updatePanel]);

  // 切换面板最小化状态
  const togglePanelMinimized = useCallback((panelId: string) => {
    const panel = layoutState.panels[panelId];
    if (panel) {
      updatePanel(panelId, { isMinimized: !panel.isMinimized });
    }
  }, [layoutState.panels, updatePanel]);

  // 重置布局
  const resetLayout = useCallback(() => {
    const panels = defaultPanels.reduce((acc, panel) => {
      acc[panel.id] = { ...panel };
      return acc;
    }, {} as Record<string, PanelConfig>);

    setLayoutState({
      panels,
      activePanel: null,
    });
  }, [defaultPanels]);

  // 获取面板配置
  const getPanel = useCallback((panelId: string) => {
    return layoutState.panels[panelId];
  }, [layoutState.panels]);

  // 获取所有可见面板
  const getVisiblePanels = useCallback(() => {
    return Object.values(layoutState.panels).filter(panel => panel.isVisible !== false);
  }, [layoutState.panels]);

  return {
    // 状态
    panels: layoutState.panels,
    activePanel: layoutState.activePanel,
    
    // 操作方法
    updatePanel,
    setActivePanel,
    togglePanelVisibility,
    togglePanelMinimized,
    resetLayout,
    getPanel,
    getVisiblePanels,
    saveLayout,
  };
}