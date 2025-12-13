// src/pages/contact-automation/ContactAutomationPageNative.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 联系人自动化页面（原生 Ant Design 版本）
 * 导入联系人并自动化社交媒体交互
 */

import React from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Alert,
  Row,
  Col,
  Badge,
  theme,
  Avatar
} from 'antd';
import { 
  RocketOutlined,
  MobileOutlined,
  ReloadOutlined,
  HeartOutlined,
  ContactsOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAdb } from '../../application/hooks/useAdb';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface AutomationCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  color: string;
  emoji: string;
}

/**
 * 联系人自动化页面（原生版）
 */
export const ContactAutomationPageNative: React.FC = () => {
  const { token } = theme.useToken();
  const { 
    devices, 
    selectedDevice, 
    isLoading: devicesLoading, 
    refreshDevices,
    lastError: devicesError 
  } = useAdb();

  const automationCards: AutomationCard[] = [
    {
      id: 'contact-import',
      name: 'Contact Import',
      description: 'Batch import VCF contacts',
      icon: ContactsOutlined,
      color: token.colorPrimary,
      emoji: '📱'
    },
    {
      id: 'auto-follow',
      name: 'Auto Follow',
      description: 'Xiaohongshu batch follow',
      icon: HeartOutlined,
      color: token.colorError,
      emoji: '💖'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: token.paddingLG }}>
        {/* 页面头部 */}
        <Card 
          style={{ 
            marginBottom: token.marginLG,
            background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorSuccess}15 100%)`
          }}
        >
          <Space align="center" size="large">
            <Avatar 
              size={64} 
              icon={<RocketOutlined />}
              style={{ 
                backgroundColor: token.colorPrimary,
                fontSize: 24
              }}
            />
            <div>
              <Title level={1} style={{ margin: 0, marginBottom: token.marginXS }}>
                联系人自动化
              </Title>
              <Paragraph style={{ 
                fontSize: 16, 
                margin: 0, 
                color: token.colorTextSecondary 
              }}>
                导入联系人并自动化社交媒体交互，原生 Ant Design 界面
              </Paragraph>
            </div>
          </Space>
        </Card>

        {/* 设备管理卡片 */}
        <Card 
          title={
            <Space>
              <MobileOutlined style={{ color: token.colorPrimary }} />
              <Title level={3} style={{ margin: 0 }}>设备管理</Title>
            </Space>
          }
          extra={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshDevices}
              loading={devicesLoading}
              type="primary"
            >
              刷新设备
            </Button>
          }
          style={{ marginBottom: token.marginLG }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">选择目标设备进行自动化操作</Text>
            
            {devicesError && (
              <Alert
                message="设备加载错误"
                description={devicesError.message || '未知错误'}
                type="error"
                icon={<ExclamationCircleOutlined />}
                closable
              />
            )}

            {devices && devices.length > 0 ? (
              <Row gutter={[16, 16]}>
                {devices.map((device) => (
                  <Col span={8} key={device.id}>
                    <Card
                      size="small"
                      hoverable
                      style={{
                        borderColor: selectedDevice?.id === device.id 
                          ? token.colorPrimary 
                          : token.colorBorder
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space align="center">
                          <Badge 
                            status={device.status === 'online' ? 'success' : 'error'} 
                          />
                          <Text strong>{device.name}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {device.model || device.product || '未知设备型号'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          设备 ID: {device.id}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert
                message="未检测到设备"
                description="请确保设备已连接并启用 USB 调试"
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>

        {/* 自动化功能卡片 */}
        <Card title={<Title level={3} style={{ margin: 0 }}>自动化功能</Title>}>
          <Row gutter={[24, 24]}>
            {automationCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Col span={12} key={card.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    styles={{ body: { 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      height: 200
                    } }}
                  >
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <div style={{ 
                        fontSize: 48, 
                        lineHeight: 1,
                        marginBottom: token.marginSM 
                      }}>
                        {card.emoji}
                      </div>
                      <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
                        {card.name}
                      </Title>
                      <Text 
                        type="secondary" 
                        style={{ textAlign: 'center', fontSize: 14 }}
                      >
                        {card.description}
                      </Text>
                    </Space>
                    
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<IconComponent />}
                      style={{ 
                        backgroundColor: card.color,
                        borderColor: card.color
                      }}
                      block
                    >
                      启动 {card.name}
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* 系统状态展示 */}
        <Card 
          title={<Title level={3} style={{ margin: 0 }}>系统状态</Title>}
          style={{ marginTop: token.marginLG }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Badge status="success" />
                <Text strong>ADB 连接</Text>
                <Text type="secondary">正常</Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Badge status={devices.length > 0 ? 'success' : 'error'} />
                <Text strong>设备数量</Text>
                <Text type="secondary">{devices.length} 台</Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Badge status={selectedDevice ? 'success' : 'warning'} />
                <Text strong>选中设备</Text>
                <Text type="secondary">
                  {selectedDevice ? selectedDevice.name : '未选择'}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
      </Content>
    </Layout>
  );
};

export default ContactAutomationPageNative;