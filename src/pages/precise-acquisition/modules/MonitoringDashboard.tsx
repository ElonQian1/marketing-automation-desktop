import React from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Space, Button, Empty } from 'antd';
import { 
  BarChartOutlined, 
  UserOutlined, 
  MessageOutlined, 
  HeartOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface MonitoringDashboardProps {
  onlineDevices: any[];
  selectedDevice: any;
  refreshDevices: () => void;
}

/**
 * 监控总览仪表板
 * 显示精准获客系统的总体数据和状态
 */
export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  // 模拟数据 - 在实际应用中这些数据来自后端
  const mockData = {
    todayLeads: 23,
    totalLeads: 1247,
    todayInteractions: 156,
    successRate: 68.5,
    activeMonitors: 8,
    lastUpdate: '刚刚'
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={3}>
          <BarChartOutlined className="mr-2" />
          监控总览
        </Title>
        <Text type="secondary">
          精准获客系统整体数据概览和实时状态
        </Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增线索"
              value={mockData.todayLeads}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计线索"
              value={mockData.totalLeads}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日互动次数"
              value={mockData.todayInteractions}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="转化成功率"
              value={mockData.successRate}
              suffix="%"
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统状态 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="系统状态">
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between items-center">
                <Text>活动监控任务</Text>
                <Text strong>{mockData.activeMonitors} 个</Text>
              </div>
              <Progress percent={85} status="active" />
              
              <div className="flex justify-between items-center">
                <Text>设备连接状态</Text>
                <Text strong className={onlineDevices.length > 0 ? 'text-green-600' : 'text-yellow-600'}>
                  {onlineDevices.length > 0 ? `${onlineDevices.length} 台在线` : '未连接'}
                </Text>
              </div>
              <Progress 
                percent={onlineDevices.length > 0 ? 100 : 0} 
                status={onlineDevices.length > 0 ? "success" : "exception"}
              />
              
              <div className="flex justify-between items-center mt-4">
                <Text type="secondary">
                  <ClockCircleOutlined className="mr-1" />
                  最后更新: {mockData.lastUpdate}
                </Text>
                <Button size="small" onClick={refreshDevices}>
                  刷新状态
                </Button>
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="快速操作">
            {process.env.NODE_ENV === 'development' ? (
              <Space direction="vertical" className="w-full">
                <Button type="primary" block>
                  🚧 开始行业监控 (开发模式)
                </Button>
                <Button block>
                  🚧 添加账号监控 (开发模式)
                </Button>
                <Button block>
                  🚧 查看任务报告 (开发模式)
                </Button>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <Text className="text-sm text-blue-700">
                    💡 开发提示：所有功能在开发模式下都可以正常测试，无需真实设备连接
                  </Text>
                </div>
              </Space>
            ) : (
              onlineDevices.length > 0 ? (
                <Space direction="vertical" className="w-full">
                  <Button type="primary" block>
                    开始行业监控
                  </Button>
                  <Button block>
                    添加账号监控
                  </Button>
                  <Button block>
                    查看任务报告
                  </Button>
                </Space>
              ) : (
                <Empty 
                  description="请先连接设备"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={refreshDevices}>
                    刷新设备列表
                  </Button>
                </Empty>
              )
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};