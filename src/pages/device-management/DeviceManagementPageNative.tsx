import React from 'react';
import { Card, Typography, Space, Alert, Button, Row, Col, Statistic, List } from 'antd';
import {
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
  BulbOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { DeviceList } from '../../components/device';
import { PageWrapper } from '../../components/layout';
import { useAdb } from '../../application/hooks/useAdb';

const { Title, Paragraph, Text } = Typography;

/**
 * 设备管理页面 - 原生 Ant Design 版本
 * 允许员工管理设备的连接状态，使用原生 Ant Design 5 组件和主题
 */
export const DeviceManagementPageNative: React.FC = () => {
  const { devices, isLoading, refreshDevices } = useAdb();
  // 使用原生 AntD 样式，不做额外主题样式覆盖

  const connectedCount = devices.filter(d => d.isOnline()).length;

  return (
    <PageWrapper
      title="设备管理"
      subtitle="管理最多10台设备的连接状态，确保任务正常执行"
  icon={<MobileOutlined />}
      onRefresh={refreshDevices}
      actions={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="small"
        >
          添加设备
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 设备统计卡片 */}
        <Card>
          <Row align="middle" justify="space-between">
            <Col>
              <Space align="center">
                <MobileOutlined />
                <div>
                  <Text strong>设备连接状态</Text>
                  <div>
                    <Text type="secondary">实时监控设备状态</Text>
                  </div>
                </div>
              </Space>
            </Col>
            <Col style={{ textAlign: 'right' }}>
              <Text style={{ display: 'block' }}>已连接设备</Text>
              <Statistic value={`${connectedCount}/10`} />
            </Col>
          </Row>
        </Card>

        {/* 设备状态提示 */}
        {connectedCount === 0 && (
          <Alert
            message="暂无已连接设备"
            description={
              '请先连接设备后再执行任务操作。点击设备卡片中的“连接”按钮开始连接。'
            }
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
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={refreshDevices}
              loading={isLoading}
            >
              刷新
            </Button>
          }
          style={{ width: '100%' }}
        >
          <Paragraph type="secondary">
            管理所有可用设备的连接状态
          </Paragraph>
          
          <DeviceList
            devices={devices}
            isLoading={isLoading}
          />
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
            <List
              size="small"
              dataSource={[
                '系统支持最多10台设备同时连接，确保高效任务执行',
                '只有已连接的设备才能参与任务执行',
                '任务会根据设备状态智能分配到可用设备',
                '设备断线时系统会自动重连，无需手动干预'
              ]}
              renderItem={(item, index) => (
                <List.Item>
                  <Text type="secondary">
                    <span style={{ marginRight: 8 }}>•</span>
                    {item}
                  </Text>
                </List.Item>
              )}
            />
          }
          type="info"
          showIcon
        />
      </Space>
    </PageWrapper>
  );
};

export default DeviceManagementPageNative;