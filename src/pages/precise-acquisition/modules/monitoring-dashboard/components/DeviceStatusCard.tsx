// src/pages/precise-acquisition/modules/monitoring-dashboard/components/DeviceStatusCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 设备状态卡片组件
 */
import React from 'react';
import { Card, Typography, Space, Button, Badge } from 'antd';
import { 
  MobileOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface DeviceStatusCardProps {
  onlineDevices: any[];
  selectedDevice: any;
  refreshDevices: () => void;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  const deviceCount = onlineDevices.length;
  const hasDevices = deviceCount > 0;

  return (
    <Card>
      <Space direction="vertical" className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MobileOutlined className="text-lg" />
            <Text strong>设备状态</Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            size="small" 
            onClick={refreshDevices}
          >
            刷新
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text>在线设备</Text>
            <Badge 
              status={hasDevices ? "success" : "warning"} 
              text={`${deviceCount} 台`}
            />
          </div>

          {selectedDevice && (
            <div className="flex items-center justify-between">
              <Text type="secondary">当前设备</Text>
              <div className="flex items-center space-x-1">
                <CheckCircleOutlined className="text-green-500" />
                <Text className="text-sm">{selectedDevice.name || selectedDevice.id}</Text>
              </div>
            </div>
          )}

          {!hasDevices && (
            <div className="flex items-center space-x-1 text-orange-500">
              <ExclamationCircleOutlined />
              <Text type="warning" className="text-sm">
                请连接ADB设备后使用
              </Text>
            </div>
          )}
        </div>
      </Space>
    </Card>
  );
};