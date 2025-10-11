// src/pages/app-launch-test/components/ControlPanelSection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Button, Select, theme } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ControlPanelProps } from '../types/AppLaunchTestTypes';

const { Option } = Select;

/**
 * 控制面板组件 - 设备选择、应用选择、启动控制
 */
export const ControlPanelSection: React.FC<ControlPanelProps> = ({
  devices,
  selectedDevice,
  setSelectedDevice,
  apps,
  selectedApp,
  setSelectedApp,
  isLaunching,
  onLaunchApp,
  onRefreshDevices,
}) => {
  const { token } = theme.useToken();
  
  const selectedAppInfo = apps.find(app => app.package_name === selectedApp);

  return (
    <Card 
      title="控制面板" 
      className="h-fit"
      style={{ backgroundColor: token.colorBgContainer }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.margin }}>
        <div>
          <label 
            style={{ 
              display: 'block', 
              fontSize: token.fontSizeSM, 
              fontWeight: token.fontWeightStrong,
              color: token.colorText,
              marginBottom: token.marginXS 
            }}
          >
            选择设备
          </label>
          <Select
            value={selectedDevice}
            onChange={setSelectedDevice}
            style={{ width: '100%' }}
            placeholder="请选择设备"
          >
            {devices.map(device => (
              <Option key={device.id} value={device.id}>
                {device.name} ({device.id})
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label 
            style={{ 
              display: 'block', 
              fontSize: token.fontSizeSM, 
              fontWeight: token.fontWeightStrong,
              color: token.colorText,
              marginBottom: token.marginXS 
            }}
          >
            选择应用
          </label>
          <Select
            value={selectedApp}
            onChange={setSelectedApp}
            style={{ width: '100%' }}
            placeholder="请选择应用"
            showSearch
            filterOption={(input, option) =>
              option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
          >
            {apps.map(app => (
              <Option key={app.package_name} value={app.package_name}>
                {app.app_name} ({app.package_name})
              </Option>
            ))}
          </Select>
        </div>

        {selectedAppInfo && (
          <div 
            style={{ 
              padding: token.paddingSM, 
              backgroundColor: token.colorFillSecondary, 
              borderRadius: token.borderRadius 
            }}
          >
            <p style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, margin: 0 }}>
              <strong>应用名称:</strong> {selectedAppInfo.app_name}
            </p>
            <p style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, margin: 0 }}>
              <strong>包名:</strong> {selectedAppInfo.package_name}
            </p>
            {selectedAppInfo.version_name && (
              <p style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, margin: 0 }}>
                <strong>版本:</strong> {selectedAppInfo.version_name}
              </p>
            )}
            {selectedAppInfo.main_activity && (
              <p style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, margin: 0 }}>
                <strong>主Activity:</strong> {selectedAppInfo.main_activity}
              </p>
            )}
          </div>
        )}

        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onLaunchApp}
          disabled={!selectedDevice || !selectedApp || isLaunching}
          loading={isLaunching}
          style={{ width: '100%' }}
        >
          {isLaunching ? '启动中...' : '启动应用并检测状态'}
        </Button>

        <Button
          icon={<ReloadOutlined />}
          onClick={onRefreshDevices}
          style={{ width: '100%' }}
        >
          刷新设备列表
        </Button>
      </div>
    </Card>
  );
};