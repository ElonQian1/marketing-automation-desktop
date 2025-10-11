// src/modules/contact-import/ui/components/grid-layout/components/SmartLayoutToolbarOptimized.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { PerformantDraggableToolbar } from './PerformantDraggableToolbar';
import type { PanelConfig } from '../GridLayoutWrapper';

export interface SmartLayoutToolbarOptimizedProps {
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
 * 优化版本的智能布局工具栏
 * 专注于高性能的拖拽工具栏，去除复杂的模式切换逻辑
 */
export const SmartLayoutToolbarOptimized: React.FC<SmartLayoutToolbarOptimizedProps> = ({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  enableSmartMode = true,
  storageKey = 'smart-layout-toolbar-optimized',
  className = ''
}) => {
  return (
    <PerformantDraggableToolbar
      panels={panels}
      onPanelVisibilityChange={onPanelVisibilityChange}
      onLayoutReset={onLayoutReset}
      onVersionSwitch={onVersionSwitch}
      enablePerformanceMode={enableSmartMode}
      storageKey={storageKey}
      className={`smart-toolbar-optimized ${className}`}
    />
  );
};