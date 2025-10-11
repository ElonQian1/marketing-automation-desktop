// src/modules/contact-import/ui/components/grid-layout/components/EnhancedDraggableToolbar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { memo, useMemo } from 'react';
import { Button, Tooltip, Space, Dropdown, Typography, message } from 'antd';
import { 
  DragOutlined, 
  SettingOutlined
} from '@ant-design/icons';
import { useDraggableOptimized } from '../hooks/useDraggableOptimized';
import { useToolbarManager } from '../hooks/useToolbarManager';
import { useToolbarActions } from './toolbar-actions';
import type { PanelConfig } from '../GridLayoutWrapper';
import styles from './EnhancedDraggableToolbar.module.css';

const { Text } = Typography;

export interface EnhancedDraggableToolbarProps {
  panels: PanelConfig[];
  onPanelVisibilityChange: (panelId: string, visible: boolean) => void;
  onLayoutReset?: () => void;
  onLayoutChange?: (layout: any[]) => void;
  onVersionSwitch?: (version: string) => void;
  className?: string;
  enablePerformanceMode?: boolean;
  onPerformanceModeChange?: (enabled: boolean) => void;
  onToolbarVisibilityChange?: (visible: boolean) => void;
  storageKey?: string;
}

/**
 * 增强的高性能拖拽工具栏组件
 * 包含完整的布局控制功能和性能优化
 */
export const EnhancedDraggableToolbar = memo<EnhancedDraggableToolbarProps>(({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onLayoutChange,
  onVersionSwitch,
  className = '',
  enablePerformanceMode = true,
  onPerformanceModeChange,
  onToolbarVisibilityChange,
  storageKey = 'enhanced-draggable-toolbar'
}) => {
  // 工具栏管理
  const { 
    isVisible, 
    hideToolbar 
  } = useToolbarManager();

  // 拖拽功能 - 计算右上角位置（布局切换器下方）
  const calculateInitialPosition = () => {
    if (typeof window !== 'undefined') {
      return { 
        x: Math.max(window.innerWidth - 300, 20), // 距离右边300px，最小距离左边20px
        y: 130 // 布局切换器下方50px（80px + 切换器高度）
      };
    }
    return { x: 20, y: 20 }; // 服务端渲染时的回退值
  };

  const {
    style: dragStyle,
    isDragging,
    dragHandlers
  } = useDraggableOptimized({
    initialPosition: calculateInitialPosition(),
    bounds: 'window',
    disabled: false,
    storageKey: `${storageKey}-position`,
    enablePerformanceMode
  });

  // 工具栏操作
  const toolbarActions = useToolbarActions({
    panels,
    onPanelVisibilityChange,
    onLayoutChange: onLayoutChange || (() => {
      message.warning('布局变更功能未配置');
    }),
    enablePerformanceMode,
    onPerformanceModeChange,
    onToolbarVisibilityChange
  });

  // 面板操作菜单
  const panelMenuItems = useMemo(() => 
    panels.map(panel => ({
      key: panel.i,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span style={{ color: panel.visible ? '#1890ff' : '#999' }}>
            {panel.title}
          </span>
          <Text type={panel.visible ? 'success' : 'secondary'} style={{ fontSize: '12px' }}>
            {panel.visible ? '✓ 显示' : '✕ 隐藏'}
          </Text>
        </Space>
      ),
      onClick: () => onPanelVisibilityChange(panel.i, !panel.visible)
    })), 
    [panels, onPanelVisibilityChange]
  );



  // 如果工具栏被隐藏，不渲染
  if (!isVisible) {
    return null;
  }

  // 工具栏样式
  const toolbarStyle = useMemo(() => ({
    ...dragStyle,
    padding: toolbarActions.settings.isCollapsed ? '4px' : '8px 12px',
    transform: enablePerformanceMode ? 'translateZ(0)' : undefined,
    willChange: isDragging ? 'transform, opacity' : 'auto'
  }), [dragStyle, toolbarActions.settings.isCollapsed, isDragging, enablePerformanceMode]);

  return (
    <div
      ref={dragHandlers.ref}
      style={toolbarStyle}
      className={`${styles['enhanced-toolbar']} draggable-toolbar ${className} ${isDragging ? styles.dragging : ''}`}
    >
      <Space size="small" wrap={false}>
        {/* 拖拽手柄 */}
        {!toolbarActions.settings.isPinned && (
          <Tooltip title="拖拽移动工具栏">
            <div
              {...dragHandlers}
              style={{
                cursor: 'grab',
                padding: '2px',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <DragOutlined style={{ color: '#999', fontSize: '12px' }} />
            </div>
          </Tooltip>
        )}

        {/* 主要功能按钮 */}
        {!toolbarActions.settings.isCollapsed && (
          <>
            {/* 面板控制 */}
            <Dropdown
              menu={{ 
                items: panelMenuItems,
                style: { minWidth: '160px' }
              }}
              trigger={['click']}
              placement="bottomLeft"
            >
              <Button size="small" type="text" style={{ 
                fontWeight: panels.some(p => !p.visible) ? 'bold' : 'normal',
                color: panels.some(p => !p.visible) ? '#faad14' : undefined
              }}>
                面板控制 {panels.some(p => !p.visible) && `(${panels.filter(p => !p.visible).length} 隐藏)`}
              </Button>
            </Dropdown>


          </>
        )}

        {/* 设置菜单 */}
        <Dropdown
          menu={{ 
            items: toolbarActions.settings.isCollapsed 
              ? toolbarActions.compactSettingsMenuItems 
              : toolbarActions.enhancedSettingsMenuItems
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Tooltip title="更多设置">
            <Button
              size="small"
              type="text"
              icon={<SettingOutlined />}
            />
          </Tooltip>
        </Dropdown>
      </Space>

      {/* 性能指示器 */}
      {process.env.NODE_ENV === 'development' && enablePerformanceMode && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#52c41a',
            border: '1px solid #f0f0f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          title="性能优化模式已启用"
        />
      )}

      {/* 布局预设指示器 */}
      {toolbarActions.availablePresets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#1890ff',
            border: '1px solid #f0f0f0'
          }}
          title={`${toolbarActions.availablePresets.length} 个布局预设可用`}
        />
      )}
    </div>
  );
});

EnhancedDraggableToolbar.displayName = 'EnhancedDraggableToolbar';

export default EnhancedDraggableToolbar;