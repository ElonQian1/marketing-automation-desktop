// src/pages/statistics/StatisticsPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Alert, Space } from 'antd';
import type { FollowStatistics } from '../../types';

/**
 * 关注统计页面
 * 显示关注数据、费用统计和任务进度
 */
export const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<FollowStatistics>({
    total_follows: 0,
    daily_follows: 0,
    success_rate: 0,
    cost_today: 0,
    cost_total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 模拟获取统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      // 模拟API调用延迟
      setTimeout(() => {
        setStatistics({
          total_follows: 1250,
          daily_follows: 45,
          success_rate: 92.5,
          cost_today: 4.5,
          cost_total: 125.0
        });
        setIsLoading(false);
      }, 1000);
    };

    fetchStatistics();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
  }> = ({ title, value, subtitle }) => (
    <Card>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{title}</Typography.Text>
        <Statistic value={value} />
        {subtitle && (
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        )}
      </Space>
    </Card>
  );

  if (isLoading) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>关注统计</Typography.Title>
        <Alert message="正在加载统计数据..." type="info" showIcon />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 页面标题 */}
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>关注统计</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          查看关注数据、成功率和费用统计
        </Typography.Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总关注人数"
            value={statistics.total_follows.toLocaleString()}
            subtitle="累计关注用户数"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="今日新增关注"
            value={statistics.daily_follows.toLocaleString()}
            subtitle="今日关注数量"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="关注成功率"
            value={`${statistics.success_rate}%`}
            subtitle="成功关注比例"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="今日费用"
            value={`¥${statistics.cost_today.toFixed(2)}`}
            subtitle="今日消费金额"
          />
        </Col>
      </Row>

      {/* 费用详情 */}
      <Card title="费用详情">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row justify="space-between">
            <Col>
              <Typography.Text>总消费金额</Typography.Text>
            </Col>
            <Col>
              <Typography.Text strong>¥{statistics.cost_total.toFixed(2)}</Typography.Text>
            </Col>
          </Row>
          <Row justify="space-between">
            <Col>
              <Typography.Text>平均每次关注成本</Typography.Text>
            </Col>
            <Col>
              <Typography.Text>¥{(statistics.cost_total / statistics.total_follows).toFixed(3)}</Typography.Text>
            </Col>
          </Row>
          <Row justify="space-between">
            <Col>
              <Typography.Text>今日关注成本</Typography.Text>
            </Col>
            <Col>
              <Typography.Text>¥{statistics.cost_today.toFixed(2)}</Typography.Text>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 成功率分析 */}
      <Card title="成功率分析">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text>关注成功率</Typography.Text>
            <Progress percent={Math.round(statistics.success_rate)} />
          </div>
          <Row gutter={16}>
            <Col xs={12}>
              <Card size="small">
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Typography.Text type="secondary">成功关注</Typography.Text>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {Math.round((statistics.total_follows * statistics.success_rate) / 100)}
                  </Typography.Title>
                </Space>
              </Card>
            </Col>
            <Col xs={12}>
              <Card size="small">
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Typography.Text type="secondary">关注失败</Typography.Text>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {statistics.total_follows - Math.round((statistics.total_follows * statistics.success_rate) / 100)}
                  </Typography.Title>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 使用提示 */}
      <Alert
        message="注意事项"
        description={
          <Space direction="vertical" size={4}>
            <Typography.Text>• 费用仅在关注成功后才会扣除</Typography.Text>
            <Typography.Text>• 重复关注同一用户不会重复扣费</Typography.Text>
            <Typography.Text>• 数据每小时自动同步更新</Typography.Text>
            <Typography.Text>• 如有异常请及时联系管理员</Typography.Text>
          </Space>
        }
        type="info"
        showIcon
      />
    </Space>
  );
};

