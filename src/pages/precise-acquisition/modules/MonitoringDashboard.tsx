import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Space, Button, Empty } from 'antd';
import { 
  BarChartOutlined, 
  UserOutlined, 
  MessageOutlined, 
  HeartOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { AnalyticsService } from './analytics-reporting/AnalyticsService';
import type { ReportMetrics } from './analytics-reporting/types';

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
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('—');

  const analytics = new AnalyticsService();

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      const data = await analytics.getReportMetrics({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        period: 'daily'
      });
      setMetrics(data);
      setLastUpdate('刚刚');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayLeads = metrics?.effectiveness.conversions.leads ?? 0;
  const totalLeads = (metrics?.effectiveness.conversions.leads ?? 0) * 50; // 粗略累计占位
  const todayInteractions = (metrics?.execution.operations.follows ?? 0) + (metrics?.execution.operations.replies ?? 0);
  const successRate = metrics?.execution.successRate ?? 0;
  const activeMonitors = 8; // 后续可从服务端获取

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
              value={todayLeads}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计线索"
              value={totalLeads}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日互动次数"
              value={todayInteractions}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="转化成功率"
              value={successRate}
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
                <Text strong>{activeMonitors} 个</Text>
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
                  最后更新: {lastUpdate}
                </Text>
                <Space>
                  <Button size="small" loading={loading} onClick={loadMetrics}>
                    刷新数据
                  </Button>
                  <Button size="small" onClick={refreshDevices}>
                    刷新设备
                  </Button>
                </Space>
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