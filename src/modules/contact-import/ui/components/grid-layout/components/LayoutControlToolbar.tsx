import React, { useState } from 'react';
import { 
  Button, Space, Dropdown, Menu, Tooltip, Popover, Switch, 
  Typography, Badge, Tag 
} from 'antd';
import {
  LayoutOutlined, EyeOutlined, SettingOutlined, ReloadOutlined,
  SaveOutlined, HistoryOutlined, ThunderboltOutlined, SkinOutlined
} from '@ant-design/icons';
import { LayoutVersionManager } from './LayoutVersionManager';
import { useLayoutVersions } from '../hooks/useLayoutVersions';

const { Text } = Typography;

export interface LayoutControlToolbarProps {
  panels: any[];
  onPanelVisibilityChange?: (panelId: string, visible: boolean) => void;
  onLayoutReset?: () => void;
  onVersionSwitch?: (version: any) => void;
  compactType?: 'vertical' | 'horizontal' | null;
  onCompactTypeChange?: (type: 'vertical' | 'horizontal' | null) => void;
  className?: string;
}

export const LayoutControlToolbar: React.FC<LayoutControlToolbarProps> = ({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  compactType,
  onCompactTypeChange,
  className = ''
}) => {
  const [versionManagerVisible, setVersionManagerVisible] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  
  const { 
    versions, 
    currentVersion, 
    hasVersions 
  } = useLayoutVersions();

  // 面板可见性菜单
  const visibilityMenu = (
    <Menu>
      {panels.map(panel => (
        <Menu.Item key={panel.i}>
          <Space>
            <Switch
              size="small"
              checked={panel.visible}
              onChange={(checked) => onPanelVisibilityChange?.(panel.i, checked)}
            />
            <span>{panel.title}</span>
          </Space>
        </Menu.Item>
      ))}
    </Menu>
  );

  // 布局类型菜单
  const layoutTypeMenu = (
    <Menu
      selectedKeys={[compactType || 'none']}
      onClick={({ key }) => {
        const type = key === 'none' ? null : key as 'vertical' | 'horizontal';
        onCompactTypeChange?.(type);
      }}
    >
      <Menu.Item key="vertical">垂直紧凑</Menu.Item>
      <Menu.Item key="horizontal">水平紧凑</Menu.Item>
      <Menu.Item key="none">自由布局</Menu.Item>
    </Menu>
  );

  // 版本快速切换菜单
  const versionQuickMenu = (
    <Menu>
      {versions.slice(0, 5).map(version => (
        <Menu.Item 
          key={version.id}
          onClick={() => onVersionSwitch?.(version)}
        >
          <Space>
            <Text>{version.name}</Text>
            {currentVersion?.id === version.id && <Badge status="processing" />}
            {version.isDefault && <Tag color="gold" style={{ fontSize: '10px' }}>默认</Tag>}
          </Space>
        </Menu.Item>
      ))}
      {versions.length > 5 && <Menu.Divider />}
      <Menu.Item key="manage" onClick={() => setVersionManagerVisible(true)}>
        <Text type="secondary">管理全部版本...</Text>
      </Menu.Item>
    </Menu>
  );

  // 性能优化设置
  const performancePopover = (
    <div style={{ width: 280 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>性能优化</Text>
        </div>
        
        <div>
          <Space>
            <Switch 
              checked={performanceMode}
              onChange={setPerformanceMode}
            />
            <Text>高性能模式</Text>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              启用虚拟化渲染，减少内存占用
            </Text>
          </div>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            当前面板数量: {panels.length} | 
            可见面板: {panels.filter(p => p.visible).length}
          </Text>
        </div>
      </Space>
    </div>
  );

  return (
    <>
      <div className={`layout-control-toolbar ${className}`} style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        background: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #f0f0f0',
      }}>
        <Space size="small">
          {/* 版本管理 */}
          <Tooltip title="布局版本">
            <Dropdown 
              overlay={versionQuickMenu} 
              trigger={['click']} 
              placement="bottomRight"
              disabled={!hasVersions}
            >
              <Button 
                icon={<HistoryOutlined />} 
                size="small" 
                type="text"
              >
                版本
                {currentVersion && (
                  <Badge 
                    count={versions.length} 
                    size="small" 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </Button>
            </Dropdown>
          </Tooltip>

          {/* 保存当前布局 */}
          <Tooltip title="保存当前布局">
            <Button 
              icon={<SaveOutlined />} 
              size="small" 
              type="text"
              onClick={() => setVersionManagerVisible(true)}
            >
              保存
            </Button>
          </Tooltip>

          {/* 面板可见性 */}
          <Tooltip title="显示/隐藏面板">
            <Dropdown 
              overlay={visibilityMenu} 
              trigger={['click']} 
              placement="bottomRight"
            >
              <Button icon={<EyeOutlined />} size="small" type="text">
                面板
              </Button>
            </Dropdown>
          </Tooltip>

          {/* 布局类型 */}
          <Tooltip title="布局模式">
            <Dropdown 
              overlay={layoutTypeMenu} 
              trigger={['click']} 
              placement="bottomRight"
            >
              <Button icon={<LayoutOutlined />} size="small" type="text">
                布局
              </Button>
            </Dropdown>
          </Tooltip>

          {/* 性能设置 */}
          <Popover 
            content={performancePopover}
            title="性能设置"
            trigger="click"
            placement="bottomRight"
          >
            <Button 
              icon={<ThunderboltOutlined />} 
              size="small" 
              type="text"
              style={{ color: performanceMode ? '#52c41a' : undefined }}
            >
              性能
            </Button>
          </Popover>

          {/* 重置布局 */}
          <Tooltip title="重置布局">
            <Button 
              icon={<ReloadOutlined />} 
              size="small" 
              type="text"
              onClick={onLayoutReset}
            />
          </Tooltip>

          {/* 更多设置 */}
          <Tooltip title="更多设置">
            <Button 
              icon={<SettingOutlined />} 
              size="small" 
              type="text"
              onClick={() => setVersionManagerVisible(true)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 版本管理器 */}
      <LayoutVersionManager
        visible={versionManagerVisible}
        onClose={() => setVersionManagerVisible(false)}
        currentPanels={panels}
        onVersionSwitch={onVersionSwitch}
      />
    </>
  );
};