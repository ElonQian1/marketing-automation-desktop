import React, { memo, useMemo } from 'react';
import { Button, Tooltip, Space, Dropdown, Typography } from 'antd';
import { 
  DragOutlined, 
  SettingOutlined, 
  ReloadOutlined,
  PushpinFilled,
  PushpinOutlined,
  ExpandOutlined,
  CompressOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { useDraggableOptimized } from '../hooks/useDraggableOptimized';
import { useToolbarManager } from '../hooks/useToolbarManager';
import { useToolbarActions } from './toolbar-actions';
import type { PanelConfig } from '../GridLayoutWrapper';

const { Text } = Typography;

export interface PerformantDraggableToolbarProps {
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
 * 高性能拖拽工具栏组件
 * 使用优化的拖拽Hook和React.memo减少重渲染
 */
export const PerformantDraggableToolbar = memo<PerformantDraggableToolbarProps>(({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  className = '',
  enablePerformanceMode = true,
  storageKey = 'draggable-toolbar'
}) => {
  // 工具栏管理器
  const { settings, updateSettings, isVisible, hideToolbar } = useToolbarManager({ storageKey });
  
  // 优化的拖拽功能
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
    position,
    isDragging,
    dragHandlers,
    style: dragStyle
  } = useDraggableOptimized({
    initialPosition: calculateInitialPosition(),
    bounds: 'window',
    disabled: settings.isPinned,
    storageKey: `${storageKey}-position`,
    enablePerformanceMode
  });

  // 面板操作菜单 - 使用useMemo避免重复创建
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

  // 设置菜单 - 使用useMemo避免重复创建
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
      key: 'performance',
      label: enablePerformanceMode ? '禁用性能模式' : '启用性能模式',
      onClick: () => {
        // 这里可以通过props回调通知父组件切换性能模式
        console.log('Performance mode toggle requested');
      }
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
  ], [settings, updateSettings, enablePerformanceMode]);

  // 如果工具栏被隐藏，不渲染
  if (!isVisible) {
    return null;
  }

  // 工具栏样式 - 完全移除硬编码颜色样式，只保留位置和布局
  const toolbarStyle = useMemo(() => ({
    ...dragStyle,
    padding: settings.isCollapsed ? '4px' : '8px 12px',
    // 移除所有硬编码的颜色样式，改用CSS类控制
    transform: enablePerformanceMode ? 'translateZ(0)' : undefined,
    willChange: isDragging ? 'transform, opacity' : 'auto'
  }), [dragStyle, settings.isCollapsed, isDragging, enablePerformanceMode]);

  return (
    <div
      ref={dragHandlers.ref}
      style={toolbarStyle}
      className={`draggable-toolbar ${className} ${isDragging ? 'dragging' : ''}`}
    >
      <Space size="small" wrap={false}>
        {/* 拖拽手柄 */}
        {!settings.isPinned && (
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

        {/* 主要功能按钮 - 只在未收起时显示 */}
        {!settings.isCollapsed && (
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
      </Space>

      {/* 性能指示器 - 仅在开发模式显示 */}
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
            border: '1px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
          title="性能优化模式已启用"
        />
      )}
    </div>
  );
});

PerformantDraggableToolbar.displayName = 'PerformantDraggableToolbar';