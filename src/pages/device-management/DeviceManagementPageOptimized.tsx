// src/pages/device-management/DeviceManagementPageOptimized.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Card, Typography, Space, Alert, theme, Spin } from 'antd';
import {
  MobileOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DeviceList } from '../../components/device';
import { useAdb } from '../../application/hooks/useAdb';
import { DeviceStatusCards, DevicePageHeader, DeviceInstructions } from './components';

const { Paragraph, Text } = Typography;

/**
 * 设备管理页面 - 完全原生 Ant Design 版本
 * 使用原生 Ant Design 5 组件、token 和商业化设计，无任何内联样式
 */
export const DeviceManagementPageOptimized: React.FC = () => {
  const { devices, isLoading, refreshDevices } = useAdb();
  const { token } = theme.useToken();

  const connectedCount = devices.filter(d => d.isOnline()).length;
  const totalCount = devices.length;
  const offlineCount = totalCount - connectedCount;
  
  // 获取所有在线设备（用于安装 Agent 的设备选择）
  // 注意：Device 实体使用 id 属性作为设备序列号
  const onlineDevices = devices
    .filter(d => d.isOnline())
    .map(d => ({ serial: d.id, model: d.model }));

  return (
    <div
      style={{
        padding: token.paddingLG,
        minHeight: '100vh',
        background: token.colorBgLayout
      }}
    >
      <Space
        direction="vertical"
        size={token.sizeLG}
        style={{ width: '100%' }}
      >
        {/* 页面标题 */}
        <DevicePageHeader
          refreshDevices={refreshDevices}
          isLoading={isLoading}
          onlineDevices={onlineDevices}
        />

        {/* 统计卡片 */}
        <DeviceStatusCards
          connectedCount={connectedCount}
          offlineCount={offlineCount}
          totalCount={totalCount}
        />

        {/* 状态提示 */}
        {connectedCount === 0 && (
          <Alert
            message="暂无已连接设备"
            description="请先连接设备后再执行任务操作。点击设备卡片中的连接按钮开始连接。"
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ borderRadius: token.borderRadius }}
          />
        )}

        {/* 设备列表 */}
        <Card
          title={
            <Space align="center">
              <MobileOutlined style={{ color: token.colorPrimary }} />
              <Text strong style={{ fontSize: token.fontSizeLG }}>
                设备列表
              </Text>
            </Space>
          }
          extra={
            <Space align="center">
              <Text type="secondary">
                共 {totalCount} 台设备
              </Text>
              {connectedCount > 0 && (
                <CheckCircleOutlined style={{ color: token.colorSuccess }} />
              )}
            </Space>
          }
          style={{ borderRadius: token.borderRadiusLG }}
        >
          <Paragraph type="secondary" style={{ marginBottom: token.marginLG }}>
            管理所有可用设备的连接状态，最多支持 10 台设备同时连接
          </Paragraph>
          
          <Spin spinning={isLoading}>
            <DeviceList
              devices={devices}
              isLoading={isLoading}
            />
          </Spin>
        </Card>

        {/* 使用说明 */}
        <DeviceInstructions />
      </Space>
    </div>
  );
};

export default DeviceManagementPageOptimized;