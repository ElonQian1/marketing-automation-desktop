// src/modules/precise-acquisition/task-engine/components/TaskStatsCards.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 任务统计卡片组件
 * 
 * 显示任务执行统计数据
 */

import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

export interface TaskStatsCardsProps {
  pendingCount: number;
  executingCount: number;
  completedCount: number;
  failedCount: number;
}

export const TaskStatsCards: React.FC<TaskStatsCardsProps> = ({
  pendingCount,
  executingCount,
  completedCount,
  failedCount
}) => {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic 
            title="待处理" 
            value={pendingCount} 
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic 
            title="执行中" 
            value={executingCount} 
            prefix={<PlayCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic 
            title="已完成" 
            value={completedCount} 
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic 
            title="失败" 
            value={failedCount} 
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};