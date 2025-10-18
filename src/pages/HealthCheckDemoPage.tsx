// src/pages/HealthCheckDemoPage.tsx
// module: health-check | layer: pages | role: 健康检查系统演示页面
// summary: 展示健康检查系统功能的演示页面

import React from 'react';
import { Card, Row, Col, Space, Typography, Divider } from 'antd';
import { ApiOutlined, InfoCircleOutlined } from '@ant-design/icons';
import HealthCheckSystem from '../components/HealthCheckSystem';

const { Title, Paragraph, Text } = Typography;

const HealthCheckDemoPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <ApiOutlined /> 健康检查系统演示
          </Title>
          <Paragraph>
            这个页面演示了健康检查系统的各种功能和配置选项。
            健康检查系统用于监控后端服务状态，确保系统正常运行。
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {/* 基础健康检查 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ApiOutlined />
                  <Text strong>基础健康检查</Text>
                </Space>
              }
              size="small"
            >
              <Paragraph type="secondary" style={{ fontSize: '13px', marginBottom: '16px' }}>
                启用首屏自动检查，显示详细信息，30秒自动刷新
              </Paragraph>
              <HealthCheckSystem
                autoCheckOnMount={true}
                refreshInterval={30000}
                showDetails={true}
              />
            </Card>
          </Col>

          {/* 简化版健康检查 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ApiOutlined />
                  <Text strong>简化版健康检查</Text>
                </Space>
              }
              size="small"
            >
              <Paragraph type="secondary" style={{ fontSize: '13px', marginBottom: '16px' }}>
                手动检查模式，隐藏详细信息，无自动刷新
              </Paragraph>
              <HealthCheckSystem
                autoCheckOnMount={false}
                refreshInterval={0}
                showDetails={false}
              />
            </Card>
          </Col>

          {/* 快速刷新模式 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ApiOutlined />
                  <Text strong>快速刷新模式</Text>
                </Space>
              }
              size="small"
            >
              <Paragraph type="secondary" style={{ fontSize: '13px', marginBottom: '16px' }}>
                5秒自动刷新，适用于实时监控场景
              </Paragraph>
              <HealthCheckSystem
                autoCheckOnMount={true}
                refreshInterval={5000}
                showDetails={true}
              />
            </Card>
          </Col>

          {/* 功能说明 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  <Text strong>功能特性</Text>
                </Space>
              }
              size="small"
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text>✅ <strong>首屏探活</strong>：页面加载时自动检查后端状态</Text>
                <Text>✅ <strong>手动检查</strong>：点击按钮主动触发健康检查</Text>
                <Text>✅ <strong>自动刷新</strong>：可配置的定时检查机制</Text>
                <Text>✅ <strong>状态展示</strong>：直观的健康状态指示器</Text>
                <Text>✅ <strong>详细信息</strong>：响应时间、端点、版本等详情</Text>
                <Text>✅ <strong>事件系统</strong>：集成自定义事件通知</Text>
                <Text>✅ <strong>错误处理</strong>：优雅的错误状态展示</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 使用说明 */}
        <Card
          title="使用说明"
          style={{ marginTop: '24px' }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <Title level={5}>基本用法</Title>
              <Paragraph>
                <pre style={{ fontSize: '12px', color: '#666' }}>
{`<HealthCheckSystem
  autoCheckOnMount={true}
  refreshInterval={30000}
  showDetails={true}
/>`}
                </pre>
              </Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5}>事件监听</Title>
              <Paragraph>
                <pre style={{ fontSize: '12px', color: '#666' }}>
{`window.addEventListener(
  'health_check_success',
  (event) => {
    console.log('健康检查成功:', event.detail);
  }
);`}
                </pre>
              </Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5}>配置选项</Title>
              <ul style={{ fontSize: '13px', margin: 0 }}>
                <li><code>autoCheckOnMount</code> - 首屏自动检查</li>
                <li><code>refreshInterval</code> - 刷新间隔(毫秒)</li>
                <li><code>showDetails</code> - 是否显示详情</li>
                <li><code>className</code> - 自定义样式</li>
              </ul>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default HealthCheckDemoPage;