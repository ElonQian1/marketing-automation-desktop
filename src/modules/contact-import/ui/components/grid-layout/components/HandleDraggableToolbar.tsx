import React, { memo, useMemo } from 'react';
import { Button, Tooltip, Space, Dropdown, Typography } from 'antd';
import { 
  DragOutlined, 
  SettingOutlined, 
  CompressOutlined, 
  ExpandOutlined,
  PushpinOutlined,
  PushpinFilled,
  EyeInvisibleOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useHandleDrag } from '../hooks/useHandleDrag';
import { useToolbarManager } from '../hooks/useToolbarManager';
import type { PanelConfig } from '../GridLayoutWrapper';

const { Text } = Typography;

export interface HandleDraggableToolbarProps {
  panels: PanelConfig[];
  onPanelVisibilityChange: (panelId: string, visible: boolean) => void;
  onLayoutReset: () => void;
  onVersionSwitch?: (version: string) => void;
  className?: string;
  enablePerformanceMode?: boolean;
  storageKey?: string;
}

/**
 * 手柄专用拖拽工具栏
 * 只有拖拽手柄可以拖拽，按钮区域完全不受影响
 */
export const HandleDraggableToolbar = memo<HandleDraggableToolbarProps>(({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  className = '',
  enablePerformanceMode = true,
  storageKey = 'handle-draggable-toolbar'
}) => {
  // 工具栏管理器
  const { settings, updateSettings, isVisible, hideToolbar } = useToolbarManager({ storageKey });
  
  // 手柄专用拖拽功能
  const {
    position,
    isDragging,
    isThresholdReached,
    containerHandlers,
    style: dragStyle,
    eventSeparation
  } = useHandleDrag({
    initialPosition: { x: 20, y: 20 },
    bounds: 'window',
    disabled: settings.isPinned,
    storageKey: `${storageKey}-position`,
    enablePerformanceMode,
    dragThresholdConfig: { threshold: 5, timeThreshold: 100 }
  });

  // 面板操作菜单
  const panelMenuItems = useMemo(() => 
    panels.map(panel => ({
      key: panel.i,
      label: (
        <Space>
          <span style={{ color: panel.visible ? '#1890ff' : '#999' }}>
            {panel.title}
          </span>
          {panel.visible && <Text type="success">显示</Text>}
        </Space>
      ),
      onClick: () => onPanelVisibilityChange(panel.i, !panel.visible)
    })), 
    [panels, onPanelVisibilityChange]
  );

  // 设置菜单
  const settingsMenuItems = useMemo(() => [
    {
      key: 'pin',
      label: settings.isPinned ? '取消固定' : '固定位置',
      icon: settings.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
      onClick: () => updateSettings({ isPinned: !settings.isPinned })
    },
    {
      key: 'collapse',
      label: settings.isCollapsed ? '展开工具栏' : '收起工具栏',
      icon: settings.isCollapsed ? <ExpandOutlined /> : <CompressOutlined />,
      onClick: () => updateSettings({ isCollapsed: !settings.isCollapsed })
    },
    {
      type: 'divider' as const
    },
    {
      key: 'hide',
      label: '隐藏工具栏',
      icon: <EyeInvisibleOutlined />,
      onClick: () => hideToolbar()
    }
  ], [settings, updateSettings, hideToolbar]);

  // 如果工具栏被隐藏，不渲染
  if (!isVisible) {
    return null;
  }

  // 工具栏样式 - 移除硬编码颜色，使用CSS类
  const toolbarStyle = useMemo(() => ({
    ...dragStyle,
    // 移除硬编码背景和边框，改用CSS类控制
    borderRadius: '8px',
    padding: settings.isCollapsed ? '6px' : '8px 12px',
    // 保留动态阴影效果
    boxShadow: isDragging && isThresholdReached
      ? '0 8px 16px rgba(0, 0, 0, 0.15)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(8px)',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    opacity: isDragging && isThresholdReached ? 0.9 : 1,
    cursor: 'default', // 重要：容器本身不显示拖拽光标
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }), [dragStyle, settings.isCollapsed, isDragging, isThresholdReached]);

  return (
    <div
      ref={containerHandlers.ref}
      style={toolbarStyle}
      className={`header-only-drag-toolbar ${className} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={containerHandlers.onMouseDown}
    >
      {/* 拖拽手柄 - 只有这个区域可以拖拽 */}
      {!settings.isPinned && (
        <div
          className="toolbar-drag-handle" // 关键：拖拽手柄类名
          style={{
            cursor: 'grab',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'rgba(0, 0, 0, 0.05)';
          }}
        >
          <Tooltip title="拖拽移动工具栏">
            <MenuOutlined style={{ color: '#666', fontSize: '14px' }} />
          </Tooltip>
        </div>
      )}

      {/* 功能按钮区域 - 明确标记为无拖拽区域 */}
      <div className="toolbar-no-drag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* 主要功能按钮 - 只在未收起时显示 */}
        {!settings.isCollapsed && (
          <>
            {/* 面板控制 */}
            <Dropdown
              menu={{ items: panelMenuItems }}
              trigger={['click']}
              placement="bottomLeft"
            >
              <Button size="small" type="text">
                面板控制
              </Button>
            </Dropdown>

            {/* 重置布局 */}
            <Tooltip title="重置布局">
              <Button
                size="small"
                type="text"
                onClick={onLayoutReset}
              >
                重置
              </Button>
            </Tooltip>
          </>
        )}

        {/* 设置菜单 */}
        <Dropdown
          menu={{ items: settingsMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Tooltip title="设置">
            <Button
              size="small"
              type="text"
              icon={<SettingOutlined />}
            />
          </Tooltip>
        </Dropdown>
      </div>

      {/* 拖拽状态指示器 */}
      {isDragging && isThresholdReached && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#52c41a',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            animation: 'pulse 1.5s infinite'
          }}
          title="正在拖拽中"
        />
      )}

      {/* 性能模式指示器 - 仅在开发模式显示 */}
      {process.env.NODE_ENV === 'development' && enablePerformanceMode && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#1890ff',
            border: '1px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          title="高性能模式已启用"
        />
      )}

      {/* CSS动画定义 */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .handle-draggable-toolbar .toolbar-drag-handle:active {
          cursor: grabbing !important;
        }
        
        .handle-draggable-toolbar .toolbar-no-drag * {
          cursor: default !important;
        }
        
        .handle-draggable-toolbar .toolbar-no-drag button {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
});

HandleDraggableToolbar.displayName = 'HandleDraggableToolbar';