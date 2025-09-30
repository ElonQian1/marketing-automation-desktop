import React, { useState, useCallback } from 'react';
import { 
  Button, Space, Dropdown, Menu, Tooltip, Popover, Switch, 
  Typography, Badge, Tag, Divider
} from 'antd';
import {
  LayoutOutlined, EyeOutlined, SettingOutlined, ReloadOutlined,
  SaveOutlined, HistoryOutlined, ThunderboltOutlined, 
  DragOutlined, PushpinOutlined, ExpandOutlined, CompressOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { LayoutVersionManager } from './LayoutVersionManager';
import { useLayoutVersions } from '../hooks/useLayoutVersions';
import { useDraggable } from '../hooks/useDraggable';

const { Text } = Typography;

export interface FloatingLayoutToolbarProps {
  panels: any[];
  onPanelVisibilityChange?: (panelId: string, visible: boolean) => void;
  onLayoutReset?: () => void;
  onVersionSwitch?: (version: any) => void;
  compactType?: 'vertical' | 'horizontal' | null;
  onCompactTypeChange?: (type: 'vertical' | 'horizontal' | null) => void;
  
  // 浮动工具栏特有属性
  initialPosition?: { x: number; y: number };
  collapsible?: boolean;
  showTitle?: boolean;
  storageKey?: string;
  onClose?: () => void;
}

export const FloatingLayoutToolbar: React.FC<FloatingLayoutToolbarProps> = ({
  panels,
  onPanelVisibilityChange,
  onLayoutReset,
  onVersionSwitch,
  compactType,
  onCompactTypeChange,
  
  initialPosition = { x: window.innerWidth - 200, y: 20 },
  collapsible = true,
  showTitle = true,
  storageKey = 'floating-layout-toolbar',
  onClose
}) => {
  const [versionManagerVisible, setVersionManagerVisible] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const { 
    versions, 
    currentVersion, 
    hasVersions 
  } = useLayoutVersions();

  // 拖拽功能
  const draggable = useDraggable({
    initialPosition,
    bounds: 'window',
    disabled: isPinned,
    storageKey: `${storageKey}-position`
  });

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

  // 工具栏操作按钮
  const renderToolbarActions = () => (
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
            {!isCollapsed && '版本'}
            {currentVersion && (
              <Badge 
                count={versions.length} 
                size="small" 
                style={{ marginLeft: isCollapsed ? -4 : 4 }}
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
          {!isCollapsed && '保存'}
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
            {!isCollapsed && '面板'}
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
          <Button 
            icon={<LayoutOutlined />} 
            size="small" 
            type={compactType ? 'primary' : 'text'}
          >
            {!isCollapsed && '布局'}
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
          {!isCollapsed && '性能'}
        </Button>
      </Popover>

      {/* 重置布局 */}
      <Tooltip title="重置布局">
        <Button 
          icon={<ReloadOutlined />} 
          size="small" 
          type="text"
          onClick={onLayoutReset}
        >
          {!isCollapsed && '重置'}
        </Button>
      </Tooltip>
    </Space>
  );

  // 控制按钮
  const renderControlButtons = () => (
    <Space size={2}>
      {/* 固定/取消固定 */}
      <Tooltip title={isPinned ? '取消固定' : '固定位置'}>
        <Button
          icon={<PushpinOutlined />}
          size="small"
          type="text"
          style={{ 
            color: isPinned ? '#1890ff' : undefined,
            transform: isPinned ? 'rotate(45deg)' : 'none'
          }}
          onClick={() => setIsPinned(!isPinned)}
        />
      </Tooltip>

      {/* 折叠/展开 */}
      {collapsible && (
        <Tooltip title={isCollapsed ? '展开' : '折叠'}>
          <Button
            icon={isCollapsed ? <ExpandOutlined /> : <CompressOutlined />}
            size="small"
            type="text"
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </Tooltip>
      )}

      {/* 关闭 */}
      {onClose && (
        <Tooltip title="关闭工具栏">
          <Button
            icon={<CloseOutlined />}
            size="small"
            type="text"
            onClick={onClose}
          />
        </Tooltip>
      )}
    </Space>
  );

  return (
    <>
      <div
        ref={draggable.dragHandlers.ref}
        className="floating-layout-toolbar draggable-toolbar"
        style={{
          ...draggable.style,
          // 移除硬编码背景，使用CSS类控制
          padding: isCollapsed ? '4px 8px' : '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #f0f0f0',
          transition: 'all 0.3s ease',
          opacity: draggable.isDragging ? 0.8 : 1,
          maxWidth: isCollapsed ? '200px' : '400px',
          minWidth: isCollapsed ? '120px' : '300px'
        }}
      >
        {/* 工具栏标题和拖拽手柄 */}
        {(showTitle || !isCollapsed) && (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: isCollapsed ? 0 : 8,
              cursor: isPinned ? 'default' : 'grab'
            }}
            onMouseDown={draggable.dragHandlers.onMouseDown}
          >
            {showTitle && !isCollapsed && (
              <Space>
                <DragOutlined style={{ color: '#999' }} />
                <Text strong style={{ fontSize: '12px' }}>布局工具</Text>
              </Space>
            )}
            {isCollapsed && (
              <DragOutlined 
                style={{ color: '#999', cursor: isPinned ? 'default' : 'grab' }} 
              />
            )}
            {renderControlButtons()}
          </div>
        )}

        {/* 工具栏主要操作 */}
        {!isCollapsed && (
          <>
            {showTitle && <Divider style={{ margin: '8px 0' }} />}
            {renderToolbarActions()}
          </>
        )}

        {/* 折叠状态下的快捷操作 */}
        {isCollapsed && (
          <div style={{ marginTop: 4 }}>
            <Space size={2}>
              <Button 
                icon={<SaveOutlined />} 
                size="small" 
                type="text"
                onClick={() => setVersionManagerVisible(true)}
              />
              <Dropdown overlay={visibilityMenu} trigger={['click']}>
                <Button icon={<EyeOutlined />} size="small" type="text" />
              </Dropdown>
              <Button 
                icon={<ReloadOutlined />} 
                size="small" 
                type="text"
                onClick={onLayoutReset}
              />
            </Space>
          </div>
        )}
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