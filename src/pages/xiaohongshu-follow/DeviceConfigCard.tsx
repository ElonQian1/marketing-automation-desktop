/**
 * 设备配置卡片组件
 * 使用纯原生 Ant Design 组件
 */

import React from 'react';
import { Card, Select, Space, Typography, Alert, Radio } from 'antd';
import { MobileOutlined } from '@ant-design/icons';
import { Device } from '../../domain/adb';
import type { DeviceConfig } from './types';

const { Title, Text } = Typography;
const { Option } = Select;

interface DeviceConfigCardProps {
  devices: Device[];
  config: DeviceConfig;
  onConfigChange: (config: DeviceConfig) => void;
}

export const DeviceConfigCard: React.FC<DeviceConfigCardProps> = ({
  devices,
  config,
  onConfigChange,
}) => {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              backgroundColor: '#1677ff',
              color: 'white',
            }}
          >
            <MobileOutlined />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              设备配置
            </Title>
            <Text type="secondary">选择目标设备和连接方式</Text>
          </div>
        </div>

        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          <div>
            <Text strong>目标设备:</Text>
            <Select
              value={config.selectedDevice}
              onChange={(value) => onConfigChange({ ...config, selectedDevice: value })}
              placeholder="请选择设备"
              style={{ width: '100%' }}
            >
              {devices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name || device.id} - {device.status}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ width: '100%', marginTop: 16 }}>
            <Text strong>连接方式:</Text>
            <Radio.Group
              value={config.connectionType}
              onChange={(e) => onConfigChange({ ...config, connectionType: e.target.value })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Radio.Button value="long" style={{ flex: 1 }}>
                长连接 (推荐)
              </Radio.Button>
              <Radio.Button value="single" style={{ flex: 1 }}>
                单次执行
              </Radio.Button>
            </Radio.Group>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 6,
              backgroundColor: config.connectionType === 'long' ? '#f6ffed' : '#fff7e6',
              border: `1px solid ${config.connectionType === 'long' ? '#b7eb8f' : '#ffd591'}`,
            }}
          >
            {config.connectionType === 'long' ? (
              <div>
                <div style={{ color: '#52c41a', fontWeight: 'bold', marginBottom: 8 }}>
                  长连接模式优势:
                </div>
                <ul style={{ fontSize: 14, color: '#666', listStyle: 'disc', paddingLeft: 16, margin: 0 }}>
                  <li>保持设备连接，减少重连开销</li>
                  <li>更稳定的执行过程</li>
                  <li>实时进度反馈</li>
                  <li>支持暂停和恢复</li>
                </ul>
              </div>
            ) : (
              <div>
                <div style={{ color: '#fa8c16', fontWeight: 'bold', marginBottom: 8 }}>
                  单次执行模式:
                </div>
                <ul style={{ fontSize: 14, color: '#666', listStyle: 'disc', paddingLeft: 16, margin: 0 }}>
                  <li>简单快速，适合测试</li>
                  <li>执行完成后自动断开</li>
                  <li>资源占用更少</li>
                </ul>
              </div>
            )}
          </div>
        </Space>
      </Space>
    </Card>
  );
};