// src/pages/device-monitor/DeviceCard.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Card, Space, Tag, Typography, Checkbox } from 'antd';
import { UsbOutlined, DesktopOutlined } from '@ant-design/icons';
import type { DeviceCardProps } from './types';

const { Text } = Typography;

const statusTag = (status: string) => {
  const map: Record<string, string> = {
    device: '在线',
    online: '在线',
    unauthorized: '未授权',
    offline: '离线',
  };
  const text = map[status] || status;
  return <Tag>{text}</Tag>;
};

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onSelect, selected, selectable, checked, onCheckedChange }) => {
  const icon = device.connection_type === 'emulator' ? <DesktopOutlined /> : <UsbOutlined />;
  return (
    <Card size="small" hoverable onClick={() => onSelect?.(device.id)}>
      <Space direction="vertical">
        <Space align="center">
          {selectable && (
            <Checkbox
              checked={!!checked}
              onChange={(e) => onCheckedChange?.(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {icon}
          <Text strong>{device.id}</Text>
          {statusTag(device.status)}
        </Space>
        <Space size="small">
          <Text type="secondary">连接:</Text>
          <Tag>{device.connection_type}</Tag>
        </Space>
      </Space>
    </Card>
  );
};
