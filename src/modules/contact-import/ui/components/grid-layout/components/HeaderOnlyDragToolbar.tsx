import React, { memo, useMemo } from 'react';
import { Button, Tooltip, Space, Dropdown, Typography } from 'antd';
import { 
  SettingOutlined, 
  CompressOutlined, 
  ExpandOutlined,
  PushpinOutlined,
  PushpinFilled,
  EyeInvisibleOutlined,
  DragOutlined
} from '@ant-design/icons';
import { useToolbarManager } from '../hooks/useToolbarManager';
import type { PanelConfig } from '../GridLayoutWrapper';

const { Text } = Typography;

export interface HeaderOnlyDragToolbarProps {
  panels: PanelConfig[];
  onPanelVisibilityChange: (panelId: string, visible: boolean) => void;
  onLayoutReset: () => void;
  onVersionSwitch?: (version: string) => void;
  className?: string;
  storageKey?: string;
}

/**
 * 仅标题栏可拖拽的工具栏组件
 * 解决工具栏拖拽导致的UI事件劫持问题
 */
export const HeaderOnlyDragToolbar = memo<HeaderOnlyDragToolbarProps>(({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  className = '',
  storageKey = 'header-only-drag-toolbar'
}) => {
  // 工具栏管理器
  const { settings, updateSettings, isVisible, hideToolbar } = useToolbarManager({ storageKey });

  // 面板操作菜单 - 使用useMemo避免重复创建
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
      type: 'divider' as const
    },
    {
      key: 'hide',
      label: '隐藏工具栏',
      icon: <EyeInvisibleOutlined />,
      onClick: hideToolbar
    }
  ], [settings, updateSettings, hideToolbar]);

  // 如果工具栏被隐藏，不渲染
  if (!isVisible) {
    return null;
  }

  // 工具栏样式 - 只保留位置和布局相关样式，颜色通过CSS类控制
  const toolbarStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: 20,
    right: 20,
    padding: settings.isCollapsed ? '8px' : '12px 16px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    // 确保工具栏不会阻止其他元素的交互
    pointerEvents: 'auto' as const
  }), [settings.isCollapsed]);

  return (
    <div
      className={`header-only-drag-toolbar ${className}`}
      style={toolbarStyle}
    >
      <Space size="small" wrap={false}>
        {/* 拖拽手柄 - 只有未固定时显示 */}
        {!settings.isPinned && (
          <Tooltip title="拖拽移动工具栏">
            <div className="drag-handle" style={{ marginRight: '4px' }}>
              <DragOutlined />
            </div>
          </Tooltip>
        )}

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
          <Tooltip title="工具栏设置">
            <Button
              size="small"
              type="text"
              icon={<SettingOutlined />}
            />
          </Tooltip>
        </Dropdown>
      </Space>
    </div>
  );
});

HeaderOnlyDragToolbar.displayName = 'HeaderOnlyDragToolbar';
