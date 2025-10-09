/**
 * 系统指标卡片组件
 */
import React from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  HeartOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ReportMetrics } from '../../analytics-reporting/types';

interface SystemMetricsProps {
  metrics: ReportMetrics | null;
  loading?: boolean;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  const todayLeads = metrics?.effectiveness.conversions.leads ?? 0;
  const totalLeads = (metrics?.effectiveness.conversions.leads ?? 0) * 50; // 粗略累计占位
  const todayInteractions = (metrics?.execution.operations.follows ?? 0) + (metrics?.execution.operations.replies ?? 0);
  const successRate = metrics?.execution.successRate ?? 0;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="今日新增线索"
            value={todayLeads}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="累计线索"
            value={totalLeads}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#1677ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="今日互动"
            value={todayInteractions}
            prefix={<MessageOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="执行成功率"
            value={successRate}
            suffix="%"
            prefix={<HeartOutlined />}
            valueStyle={{ color: successRate >= 80 ? '#3f8600' : '#cf1322' }}
          />
          <Progress 
            percent={successRate} 
            showInfo={false} 
            strokeColor={successRate >= 80 ? '#3f8600' : '#cf1322'}
            className="mt-2"
          />
        </Card>
      </Col>
    </Row>
  );
};