import React from 'react';
import { Button, Space, Tooltip, Dropdown, Menu } from 'antd';
import { SettingOutlined, DragOutlined, PushpinOutlined } from '@ant-design/icons';
import { LayoutControlToolbar } from './LayoutControlToolbar';
import { FloatingLayoutToolbar } from './FloatingLayoutToolbar';
import { useToolbarManager, ToolbarType, ToolbarPosition } from '../hooks/useToolbarManager';

export interface SmartLayoutToolbarProps {
  panels: any[];
  onPanelVisibilityChange?: (panelId: string, visible: boolean) => void;
  onLayoutReset?: () => void;
  onVersionSwitch?: (version: any) => void;
  compactType?: 'vertical' | 'horizontal' | null;
  onCompactTypeChange?: (type: 'vertical' | 'horizontal' | null) => void;
  
  // 智能工具栏配置
  enableSmartMode?: boolean;
  allowUserControl?: boolean;
  storageKey?: string;
}

export const SmartLayoutToolbar: React.FC<SmartLayoutToolbarProps> = ({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  compactType,
  onCompactTypeChange,
  
  enableSmartMode = true,
  allowUserControl = true,
  storageKey = 'smart-layout-toolbar'
}) => {
  const toolbarManager = useToolbarManager({
    storageKey,
    defaultSettings: {
      type: 'floating', // 默认使用浮动模式
      position: 'top-right',
      autoHide: false
    }
  });

  // 工具栏类型切换菜单
  const toolbarTypeMenu = (
    <Menu
      selectedKeys={[toolbarManager.settings.type]}
      onClick={({ key }) => {
        toolbarManager.setToolbarType(key as ToolbarType);
      }}
    >
      <Menu.Item key="floating">
        <Space>
          <DragOutlined />
          浮动工具栏
        </Space>
      </Menu.Item>
      <Menu.Item key="fixed">
        <Space>
          <PushpinOutlined />
          固定工具栏
        </Space>
      </Menu.Item>
      <Menu.Item key="hidden">
        隐藏工具栏
      </Menu.Item>
    </Menu>
  );

  // 位置切换菜单
  const positionMenu = (
    <Menu
      selectedKeys={[toolbarManager.settings.position]}
      onClick={({ key }) => {
        toolbarManager.setToolbarPosition(key as ToolbarPosition);
      }}
    >
      <Menu.SubMenu key="top" title="顶部">
        <Menu.Item key="top-left">左上角</Menu.Item>
        <Menu.Item key="top-right">右上角</Menu.Item>
      </Menu.SubMenu>
      <Menu.SubMenu key="bottom" title="底部">
        <Menu.Item key="bottom-left">左下角</Menu.Item>
        <Menu.Item key="bottom-right">右下角</Menu.Item>
      </Menu.SubMenu>
    </Menu>
  );

  // 渲染工具栏设置按钮
  const renderToolbarSettings = () => {
    if (!allowUserControl) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px',
          padding: '4px',
          backdropFilter: 'blur(4px)'
        }}
      >
        <Space size={2}>
          <Dropdown overlay={toolbarTypeMenu} trigger={['click']}>
            <Tooltip title="工具栏模式">
              <Button 
                icon={<SettingOutlined />} 
                size="small" 
                type="text"
                style={{ fontSize: '12px' }}
              />
            </Tooltip>
          </Dropdown>
          
          {toolbarManager.settings.type !== 'hidden' && (
            <Dropdown overlay={positionMenu} trigger={['click']}>
              <Tooltip title="工具栏位置">
                <Button 
                  icon={toolbarManager.isFloating ? <DragOutlined /> : <PushpinOutlined />}
                  size="small" 
                  type="text"
                  style={{ fontSize: '12px' }}
                />
              </Tooltip>
            </Dropdown>
          )}
        </Space>
      </div>
    );
  };

  // 渲染主工具栏
  const renderMainToolbar = () => {
    if (!toolbarManager.shouldShowToolbar) {
      return null;
    }

    const commonProps = {
      panels,
      onPanelVisibilityChange,
      onLayoutReset,
      onVersionSwitch,
      compactType,
      onCompactTypeChange
    };

    if (toolbarManager.isFloating) {
      return (
        <div {...toolbarManager.mouseHandlers}>
          <FloatingLayoutToolbar
            {...commonProps}
            initialPosition={toolbarManager.getInitialPosition()}
            collapsible={true}
            showTitle={true}
            storageKey={`${storageKey}-floating`}
            onClose={allowUserControl ? () => toolbarManager.setToolbarType('hidden') : undefined}
          />
        </div>
      );
    } else if (toolbarManager.isFixed) {
      return (
        <div 
          style={toolbarManager.getFixedToolbarStyle()}
          {...toolbarManager.mouseHandlers}
        >
          <LayoutControlToolbar
            {...commonProps}
            className={`fixed-toolbar-${toolbarManager.settings.position}`}
          />
        </div>
      );
    }

    return null;
  };

  // 如果工具栏被隐藏，提供一个小的显示按钮
  const renderShowButton = () => {
    if (toolbarManager.shouldShowToolbar || !allowUserControl) {
      return null;
    }

    return (
      <div
        style={{
          position: 'fixed',
          top: 50,
          left: 10,
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '4px',
          padding: '2px',
          backdropFilter: 'blur(4px)'
        }}
      >
        <Tooltip title="显示布局工具栏">
          <Button
            icon={<SettingOutlined />}
            size="small"
            type="text"
            onClick={() => toolbarManager.setToolbarType('floating')}
            style={{ fontSize: '12px', opacity: 0.6 }}
          />
        </Tooltip>
      </div>
    );
  };

  return (
    <>
      {renderToolbarSettings()}
      {renderMainToolbar()}
      {renderShowButton()}
    </>
  );
};