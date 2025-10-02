import React, { ReactNode } from 'react';
import { Button, Space, Dropdown, Menu, Tooltip } from 'antd';
import { LayoutOutlined, EyeOutlined, EyeInvisibleOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useResizableLayout, PanelConfig } from './useResizableLayout';
import { ResizableDraggablePanel } from './ResizableDraggablePanel';

interface PanelContent {
  id: string;
  content: ReactNode;
}

interface LayoutManagerProps {
  defaultPanels: PanelConfig[];
  panelContents: PanelContent[];
  className?: string;
  style?: React.CSSProperties;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  defaultPanels,
  panelContents,
  className = '',
  style = {},
}) => {
  const layout = useResizableLayout({
    defaultPanels,
    storageKey: 'contact-import-layout-v1',
  });

  // 面板可见性切换菜单
  const visibilityMenu = (
    <Menu>
      {Object.values(layout.panels).map(panel => (
        <Menu.Item
          key={panel.id}
          icon={panel.isVisible !== false ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={() => layout.togglePanelVisibility(panel.id)}
        >
          {panel.title}
        </Menu.Item>
      ))}
    </Menu>
  );

  // 布局控制工具栏
  const layoutToolbar = (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9999,
        background: 'var(--bg-light-base, #ffffff)',
        color: 'var(--text-inverse, #1e293b)',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
      className="light-theme-force"
    >
      <Space>
        <Tooltip title="显示/隐藏面板">
          <Dropdown overlay={visibilityMenu} trigger={['click']}>
            <Button icon={<EyeOutlined />} size="small">
              面板
            </Button>
          </Dropdown>
        </Tooltip>
        
        <Tooltip title="重置布局">
          <Button 
            icon={<ReloadOutlined />} 
            size="small" 
            onClick={layout.resetLayout}
          >
            重置
          </Button>
        </Tooltip>
        
        <Tooltip title="保存布局">
          <Button 
            icon={<LayoutOutlined />} 
            size="small" 
            type="primary"
            onClick={layout.saveLayout}
          >
            保存
          </Button>
        </Tooltip>
      </Space>
    </div>
  );

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-base)',
    ...style,
  };

  return (
    <div className={`layout-manager ${className}`} style={containerStyle}>
      {/* 布局工具栏 */}
      {layoutToolbar}

      {/* 渲染所有面板 */}
      {panelContents.map(({ id, content }) => {
        const panelConfig = layout.getPanel(id);
        if (!panelConfig) return null;

        return (
          <ResizableDraggablePanel
            key={id}
            config={panelConfig}
            onUpdate={(updates) => layout.updatePanel(id, updates)}
            onFocus={() => layout.setActivePanel(id)}
          >
            {content}
          </ResizableDraggablePanel>
        );
      })}

      {/* 背景网格（可选，帮助用户对齐） */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
    </div>
  );
};