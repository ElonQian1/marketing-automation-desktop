// src/pages/adb/AdbCenterPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState } from 'react';
import { Card, Tabs, Row, Col, Typography, Alert, Space } from 'antd';
import type { TabsProps } from 'antd';
import { MobileOutlined } from '@ant-design/icons';
import { useAdb } from '../../application/hooks/useAdb';
import RealTimeDeviceMonitorPage from '../device-monitor/RealTimeDeviceMonitorPage';
import EnhancedADBAuthWizard from './auth/EnhancedADBAuthWizard';
import HeaderToolbar from './HeaderToolbar';
import LogConsole from './LogConsole';
import { UiDumpModePanel } from '../../components/device/ui-dump-mode-panel';
import { AdbCenterSystemStatusPanel } from './status/adb-center-system-status-panel';

const { Title, Paragraph } = Typography;

export const AdbCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('monitor');
  const { devices, isLoading, selectedDevice } = useAdb();

  const items: TabsProps['items'] = [
    {
      key: 'monitor',
      label: '实时设备监控',
      children: <RealTimeDeviceMonitorPage />,
    },
    {
      key: 'ui-dump',
      label: 'UI Dump 模式',
      children: <UiDumpModePanel deviceId={selectedDevice || undefined} />,
    },
    {
      key: 'auth',
      label: 'ADB 授权向导',
      children: <EnhancedADBAuthWizard />,
    },
    {
      key: 'logs',
      label: '日志查看',
      children: <LogConsole />,
    },
    {
      key: 'status',
      label: '系统状态',
      children: <AdbCenterSystemStatusPanel />,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title={
            <Space>
              <MobileOutlined />
              <Title level={3}>ADB 中心</Title>
            </Space>
          }
          extra={<HeaderToolbar />}
        >
          <Space direction="vertical">
            <Paragraph>
              统一的 ADB 功能中心：实时设备监控、授权修复、路径检测、日志与系统状态，一处集中管理。
            </Paragraph>
            {devices.length > 0 && (
              <Alert
                type="info"
                message={`当前有 ${devices.filter(d => d.isOnline()).length} 台设备在线`}
                description={`设备总数: ${devices.length}，状态：${isLoading ? '加载中' : '就绪'}`}
                showIcon
              />
            )}
          </Space>
        </Card>
      </Col>

      <Col span={24}>
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" items={items} />
        </Card>
      </Col>
    </Row>
  );
};

export default AdbCenterPage;
