// src/components/SmartVcfImporterNative.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Typography, Space, Button, Row, Col, Alert } from 'antd';
import { MobileOutlined, SyncOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 智能VCF导入器 - 原生 Ant Design 版本
 * 使用原生 Ant Design 5 组件，移除所有 Tailwind CSS 类名
 */
export const SmartVcfImporterNative: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 页面标题 */}
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, color: '#1677ff' }}>
                <RobotOutlined style={{ marginRight: 12 }} />
                智能VCF联系人导入器
              </Title>
            </Col>
            <Col>
              <Button 
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => console.log('刷新设备')}
              >
                刷新设备
              </Button>
            </Col>
          </Row>

          {/* 设备管理区域 */}
          <Card 
            title={
              <Space>
                <MobileOutlined />
                <Text>设备管理</Text>
              </Space>
            }
            style={{ backgroundColor: '#f0f9ff' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  选择设备:
                </Text>
                <Alert
                  message="设备选择功能"
                  description="请选择要操作的设备"
                  type="info"
                  showIcon
                />
              </Col>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  设备状态:
                </Text>
                <Alert
                  message="设备状态监控"
                  description="实时显示设备连接状态"
                  type="info"
                  showIcon
                />
              </Col>
            </Row>
          </Card>

          {/* 导入功能区域 */}
          <Card 
            title="导入功能"
            style={{ backgroundColor: '#f6ffed' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>智能导入模式</Text>
                    <Text type="secondary">
                      自动识别当前页面，智能执行导入操作
                    </Text>
                    <Button type="primary" block>
                      开始智能导入
                    </Button>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>完整导入模式</Text>
                    <Text type="secondary">
                      包含文件传输和页面操作的完整流程
                    </Text>
                    <Button type="primary" block>
                      开始完整导入
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 操作日志区域 */}
          <Card title="操作日志">
            <Alert
              message="日志功能"
              description="这里将显示导入过程中的详细日志信息"
              type="info"
              showIcon
            />
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default SmartVcfImporterNative;