// src/pages/device-management/DeviceManagementPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Card, Typography, Space, Alert, Button, Row, Col, Statistic, Spin } from 'antd';
import {
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
  BulbOutlined,
  WarningOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { DeviceList } from '../../components/device';
import { useAdb } from '../../application/hooks/useAdb';

const { Title, Paragraph, Text } = Typography;

/**
 * 设备管理页面 - 原生 Ant Design 版本
 * 使用 Ant Design 5 原生组件和暗黑主题，完全移除 Tailwind CSS
 */
export const DeviceManagementPage: React.FC = () => {
  const { 
    devices, 
    isLoading, 
    refreshDevices,
    emergencyRecoverDeviceListening,
    diagnoseCallbackChain 
  } = useAdb();

  const handleRestartDeviceTracking = async () => {
    try {
      console.log('🔄 用户手动重启设备跟踪...');
      await emergencyRecoverDeviceListening();
      await refreshDevices();
    } catch (error) {
      console.error('❌ 重启设备跟踪失败:', error);
    }
  };

  const connectedCount = devices.filter(d => d.isOnline()).length;
  const totalCount = devices.length;
  const offlineCount = totalCount - connectedCount;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <MobileOutlined style={{ marginRight: 12 }} />
              设备管理
            </Title>
            <Text type="secondary">
              管理最多10台设备的连接状态，确保任务正常执行
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => console.log('添加设备')}
              >
                添加设备
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={refreshDevices}
                loading={isLoading}
              >
                刷新设备
              </Button>
              <Button 
                icon={<ToolOutlined />}
                onClick={diagnoseCallbackChain}
                type="default"
                title="诊断设备自动刷新回调链路"
              >
                诊断回调链路
              </Button>
              <Button 
                icon={<WarningOutlined />}
                onClick={handleRestartDeviceTracking}
                type="default"
                title="重启设备跟踪服务"
              >
                重启跟踪
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="在线设备"
                value={connectedCount}
                suffix={`/ 10`}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="离线设备"
                value={offlineCount}
                valueStyle={{ color: offlineCount > 0 ? '#ff4d4f' : '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总设备数"
                value={totalCount}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 状态提示 */}
        {connectedCount === 0 && (
          <Alert
            message="暂无已连接设备"
            description="请先连接设备后再执行任务操作。点击设备卡片中的连接按钮开始连接。"
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        {/* 设备列表 */}
        <Card 
          title={
            <Space>
              <MobileOutlined />
              <span>设备列表</span>
            </Space>
          }
          extra={
            <Text type="secondary">
              共 {totalCount} 台设备
            </Text>
          }
        >
          <Paragraph type="secondary">
            管理所有可用设备的连接状态
          </Paragraph>
          
          <Spin spinning={isLoading}>
            <DeviceList
              devices={devices}
              isLoading={isLoading}
            />
          </Spin>
        </Card>

        {/* 使用说明 */}
        <Alert
          message={
            <Space>
              <BulbOutlined />
              <Text strong>使用说明</Text>
            </Space>
          }
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li style={{ marginBottom: 8 }}>
                系统支持最多10台设备同时连接，确保高效任务执行
              </li>
              <li style={{ marginBottom: 8 }}>
                只有已连接的设备才能参与任务执行
              </li>
              <li style={{ marginBottom: 8 }}>
                任务会根据设备状态智能分配到可用设备
              </li>
              <li>
                请确保设备网络连接稳定，避免任务执行中断
              </li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Space>
    </div>
  );
};

