import React from 'react';
import { HandleDraggableToolbar } from './HandleDraggableToolbar';
import type { PanelConfig } from '../GridLayoutWrapper';

export interface SmartLayoutToolbarFinalProps {
  panels: PanelConfig[];
  onPanelVisibilityChange: (panelId: string, visible: boolean) => void;
  onLayoutReset: () => void;
  onVersionSwitch?: (version: string) => void;
  compactType?: 'vertical' | 'horizontal' | null;
  onCompactTypeChange?: (compactType: 'vertical' | 'horizontal' | null) => void;
  enableSmartMode?: boolean;
  allowUserControl?: boolean;
  storageKey?: string;
  className?: string;
}

/**
 * 最终版本的智能布局工具栏
 * 解决按钮被拖拽劫持的问题，只有手柄可以拖拽
 */
export const SmartLayoutToolbarFinal: React.FC<SmartLayoutToolbarFinalProps> = ({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  enableSmartMode = true,
  storageKey = 'smart-layout-toolbar-final',
  className = ''
}) => {
  return (
    <HandleDraggableToolbar
      panels={panels}
      onPanelVisibilityChange={onPanelVisibilityChange}
      onLayoutReset={onLayoutReset}
      onVersionSwitch={onVersionSwitch}
      enablePerformanceMode={enableSmartMode}
      storageKey={storageKey}
      className={`smart-toolbar-final ${className}`}
    />
  );
};