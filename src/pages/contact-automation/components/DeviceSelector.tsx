import React from 'react';
import { Alert, Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import { MobileOutlined, ReloadOutlined } from '@ant-design/icons';

type Device = {
  id: string;
  name?: string;
  status?: string;
};

export interface DeviceSelectorProps {
  devices: Device[];
  loading: boolean;
  error?: Error | null;
  selectedDeviceId?: string;
  onRefresh: () => void;
  onSelect: (id: string) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  loading,
  error,
  selectedDeviceId,
  onRefresh,
  onSelect,
}) => {
  return (
    <Card
      title={
        <Space size={8} align="center">
          <MobileOutlined />
          <Typography.Text strong>设备选择</Typography.Text>
        </Space>
      }
      extra={
        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} type="default">
          刷新
        </Button>
      }
      bordered
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {error && (
          <Alert type="error" showIcon message="设备列表加载失败" description={error.message} />
        )}

        {devices.length === 0 ? (
          <Empty description="暂无已连接设备" />
        ) : (
          <List
            dataSource={devices}
            rowKey={(d) => d.id}
            renderItem={(device) => {
              const isSelected = device.id === selectedDeviceId;
              const status = (device.status || '').toLowerCase();
              return (
                <List.Item
                  actions={[
                    <Button
                      key="select"
                      type={isSelected ? 'primary' : 'default'}
                      onClick={() => onSelect(device.id)}
                      disabled={status !== 'online' && status !== 'device'}
                    >
                      {isSelected ? '已选择' : '选择'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MobileOutlined />}
                    title={
                      <Space size={8} align="center">
                        <Typography.Text>{device.name || device.id}</Typography.Text>
                        <Tag color={isSelected ? 'processing' : 'default'}>
                          {isSelected ? '当前' : '可选'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space size={8}>
                        <Typography.Text type="secondary">{device.id}</Typography.Text>
                        {status && (
                          <Tag color={status === 'online' || status === 'device' ? 'success' : 'default'}>
                            {device.status}
                          </Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Space>
    </Card>
  );
};

export default DeviceSelector;
