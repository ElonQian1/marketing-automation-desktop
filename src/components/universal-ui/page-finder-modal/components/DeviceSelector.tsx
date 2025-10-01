/**
 * 设备选择组件 - 原生 Ant Design 风格
 * 从 UniversalPageFinderModal.tsx 中提取的设备选择逻辑
 */

import React from "react";
import { Card, Select, Button, Space, Typography, Tag } from "antd";
import {
  MobileOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

export interface DeviceInfo {
  id: string;
  name: string;
  model?: string;
  androidVersion?: string;
  isOnline: () => boolean;
  status: string;
}

export interface DeviceSelectorProps {
  devices: DeviceInfo[];
  selectedDevice: string;
  loading: boolean;
  onDeviceSelect: (deviceId: string) => void;
  onRefreshDevices: () => Promise<void>;
  onCaptureCurrentPage: () => Promise<void>;
  onCaptureClick?: () => Promise<void>; // 可选的捕获点击回调
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedDevice,
  loading,
  onDeviceSelect,
  onRefreshDevices,
  onCaptureCurrentPage,
  onCaptureClick
}) => {
  const getDeviceStatusTag = (device: DeviceInfo) => {
    const isOnline = device.isOnline();
    return (
      <Tag icon={isOnline ? <CheckCircleOutlined /> : <ExclamationCircleOutlined /> }>
        {isOnline ? "在线" : "离线"}
      </Tag>
    );
  };

  const selectedDeviceInfo = devices.find(d => d.id === selectedDevice);

  return (
    <Card
      title={
        <Space>
          <MobileOutlined />
          <span>设备选择</span>
        </Space>
      }
      size="small"
      extra={
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={onRefreshDevices}
          size="small"
        >
          刷新
        </Button>
      }
    >
      <Space direction="vertical">
        {/* 设备选择下拉框 */}
        <div>
          <Text type="secondary">
            选择设备
          </Text>
          <Select
            value={selectedDevice}
            onChange={onDeviceSelect}
            style={{ width: "100%" }}
            placeholder="请选择设备"
            optionLabelProp="label"
          >
            {devices.map((device) => (
              <Option 
                key={device.id} 
                value={device.id}
                label={
                  <Space>
                    <span>{device.name}</span>
                    {getDeviceStatusTag(device)}
                  </Space>
                }
              >
                <Space direction="vertical" size="small">
                  <Space>
                    <Text strong>{device.name}</Text>
                    {getDeviceStatusTag(device)}
                  </Space>
                  <Text type="secondary">
                    ID: {device.id}
                  </Text>
                  {device.model && (
                    <Text type="secondary">
                      型号: {device.model}
                    </Text>
                  )}
                  {device.androidVersion && (
                    <Text type="secondary">
                      Android: {device.androidVersion}
                    </Text>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        {/* 选中设备信息显示 */}
        {selectedDeviceInfo && (
          <div>
            <Space direction="vertical" size="small">
              <Space>
                <Text strong>
                  当前设备:
                </Text>
                <Text>
                  {selectedDeviceInfo.name}
                </Text>
                {getDeviceStatusTag(selectedDeviceInfo)}
              </Space>
              
              {selectedDeviceInfo.model && (
                <Text type="secondary">
                  型号: {selectedDeviceInfo.model}
                </Text>
              )}
              
              {selectedDeviceInfo.androidVersion && (
                <Text type="secondary">
                  Android: {selectedDeviceInfo.androidVersion}
                </Text>
              )}
            </Space>
          </div>
        )}

        {/* 采集按钮 */}
        <Button
          type="primary"
          icon={<MobileOutlined />}
          onClick={onCaptureCurrentPage}
          disabled={!selectedDevice || !selectedDeviceInfo?.isOnline()}
          loading={loading}
        >
          {loading ? "采集中..." : "采集当前页面"}
        </Button>

        {/* 设备状态提示 */}
        {selectedDevice && selectedDeviceInfo && !selectedDeviceInfo.isOnline() && (
          <Text type="warning">
            <ExclamationCircleOutlined />
            所选设备离线，无法采集页面
          </Text>
        )}
      </Space>
    </Card>
  );
};