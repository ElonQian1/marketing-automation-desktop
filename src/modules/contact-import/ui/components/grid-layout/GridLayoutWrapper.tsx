// src/modules/contact-import/ui/components/grid-layout/GridLayoutWrapper.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import GridLayout, { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { Button } from 'antd';
import { EyeInvisibleOutlined } from '@ant-design/icons';
import { ResizablePanel } from './ResizablePanel';
import { ScrollableContainer } from './components/ScrollableContainer';
import { DraggableHeaderPanel } from './components/DraggableHeaderPanel';
import { SmartLayoutToolbarOptimized } from './components/SmartLayoutToolbarOptimized';
import { EnhancedDraggableToolbar } from './components/EnhancedDraggableToolbar';
import { useViewportHeight } from './hooks/useViewportHeight';
import { useLayoutVersions } from './hooks/useLayoutVersions';
import { useLayoutPerformance } from './hooks/useLayoutPerformance';
import { createDragBehaviorOptimizer, DRAG_CONFIGS } from './hooks/performance/DragBehaviorOptimizer';
import { useGridLayoutSelector } from '../../../../../components/adapters/grid-layout/GridLayoutSelectorAdapter';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridItem {
  i: string; // 唯一标识
  x: number;
  y: number;
  w: number; // 宽度（网格单位）
  h: number; // 高度（网格单位）
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  static?: boolean; // 是否固定不可移动
}

export interface PanelConfig extends GridItem {
  title: string;
  visible: boolean;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface GridLayoutWrapperProps {
  panels: PanelConfig[];
  onLayoutChange?: (layout: Layout[]) => void;
  onPanelVisibilityChange?: (panelId: string, visible: boolean) => void;
  className?: string;
  margin?: [number, number];
  containerPadding?: [number, number];
  rowHeight?: number;
  cols?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  breakpoints?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  
  // 版本管理
  enableVersionManagement?: boolean;
  storageKey?: string;
  
  // 性能优化
  enablePerformanceMode?: boolean;
  enableVirtualization?: boolean;
  
  // 工具栏
  showToolbar?: boolean;
  toolbarPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const GridLayoutWrapper: React.FC<GridLayoutWrapperProps> = ({
  panels,
  onLayoutChange,
  onPanelVisibilityChange,
  className = '',
  margin = [16, 16],
  containerPadding = [16, 16],
  rowHeight = 60,
  cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  
  // 新增功能配置
  enableVersionManagement = true,
  storageKey = 'grid-layout-wrapper',
  enablePerformanceMode = true,
  enableVirtualization = false,
  showToolbar = true,
  toolbarPosition = 'top-right'
}) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [compactType, setCompactType] = useState<'vertical' | 'horizontal' | null>('vertical');
  
  // Employee D适配器：网格布局选择器适配器
  const gridLayoutSelector = useGridLayoutSelector();
  
  // 版本管理
  const versionManager = useLayoutVersions({
    storageKey: `${storageKey}-versions`
  });
  
  // 性能监控
  const performance = useLayoutPerformance({
    enableVirtualization,
    lazyLoadThreshold: 10,
    debounceMs: 150
  });
  
  // 动态高度计算 - Employee D适配器：零覆盖原则
  const { availableHeight } = useViewportHeight({
    excludeSelectors: gridLayoutSelector.viewportExcludeSelectors,
    minHeight: 400,
    padding: 24
  });
  
  // 拖拽行为优化器
  const dragOptimizer = useMemo(() => 
    createDragBehaviorOptimizer(DRAG_CONFIGS.PANEL_HEADER), 
    []
  );
  
  // 注入拖拽优化样式
  useEffect(() => {
    dragOptimizer.injectStyles();
    return () => dragOptimizer.removeStyles();
  }, [dragOptimizer]);

  // 生成布局配置
  const layouts = useMemo(() => {
    const visiblePanels = panels.filter(panel => panel.visible);
    const layout = visiblePanels.map(panel => ({
      i: panel.i,
      x: panel.x,
      y: panel.y,
      w: panel.w,
      h: panel.h,
      minW: panel.minW,
      maxW: panel.maxW,
      minH: panel.minH,
      maxH: panel.maxH,
      isDraggable: panel.isDraggable !== false,
      isResizable: panel.isResizable !== false,
      static: panel.static || false,
    }));

    return {
      lg: layout,
      md: layout.map(item => ({ ...item, w: Math.min(item.w, cols.md) })),
      sm: layout.map(item => ({ ...item, w: Math.min(item.w, cols.sm) })),
      xs: layout.map(item => ({ ...item, w: Math.min(item.w, cols.xs) })),
      xxs: layout.map(item => ({ ...item, w: cols.xxs })),
    };
  }, [panels, cols]);

  // 处理布局变化
  const handleLayoutChange = useCallback((layout: Layout[], layouts: any) => {
    const startTime = performance.startPerformanceTimer();
    
    // 缓存布局
    if (performance.performanceMode) {
      performance.cacheLayout(`${currentBreakpoint}_${Date.now()}`, layout);
    }
    
    // 监控性能
    performance.endPerformanceTimer(
      startTime, 
      panels.length, 
      panels.filter(p => p.visible).length
    );
    
    onLayoutChange?.(layout);
  }, [onLayoutChange, performance, currentBreakpoint, panels]);

  // 处理断点变化
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, []);
  
  // 版本切换处理
  const handleVersionSwitch = useCallback((version: any) => {
    if (version && version.panels) {
      // 这里需要通知父组件更新 panels
      // 由于 GridLayoutWrapper 是受控组件，我们只能通过 callback 通知
      onLayoutChange?.(version.panels);
    }
  }, [onLayoutChange]);
  
  // 重置布局
  const handleLayoutReset = useCallback(() => {
    const defaultVersion = versionManager.defaultVersion;
    if (defaultVersion) {
      handleVersionSwitch(defaultVersion);
    }
  }, [versionManager.defaultVersion, handleVersionSwitch]);

  // 获取可见面板
  const visiblePanels = useMemo(() => {
    return panels.filter(panel => panel.visible);
  }, [panels]);

  // 布局控制工具栏
  const renderToolbar = () => {
    if (!showToolbar) return null;
    
    return (
      <EnhancedDraggableToolbar
        panels={panels}
        onPanelVisibilityChange={onPanelVisibilityChange}
        onLayoutReset={handleLayoutReset}
        onLayoutChange={onLayoutChange}
        onVersionSwitch={handleVersionSwitch}
        enablePerformanceMode={enablePerformanceMode}
        storageKey={`${storageKey}-enhanced-toolbar`}
      />
    );
  };

  return (
    <div className={`grid-layout-wrapper ${className}`} style={{ position: 'relative' }}>
      {renderToolbar()}
      
      <ScrollableContainer 
        excludeSelectors={['.layout-control-toolbar']}
        enableVirtualScrolling={performance.performanceMode && enableVirtualization}
      >
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={rowHeight}
          margin={margin}
          containerPadding={containerPadding}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={handleBreakpointChange}
          compactType={compactType}
          preventCollision={false}
          isDraggable={true}
          isResizable
          resizeHandles={['se']}
          useCSSTransforms
          draggableHandle={gridLayoutSelector.draggableHandleSelector}  // Employee D适配器：语义化拖拽句柄
        >
          {visiblePanels.map((panel) => (
            <div key={panel.i} className="grid-item">
              <DraggableHeaderPanel
                title={panel.title}
                headerActions={
                  onPanelVisibilityChange && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeInvisibleOutlined />}
                      onClick={() => onPanelVisibilityChange(panel.i, false)}
                    />
                  )
                }
                className="grid-panel"
                enableAutoScroll
              >
                {panel.content}
              </DraggableHeaderPanel>
            </div>
          ))}
        </ResponsiveGridLayout>
      </ScrollableContainer>
    </div>
  );
};