// src/pages/statistics/components/TaskProgressPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Progress, Typography, Space, theme, List, Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 任务进度面板组件
 * 使用原生 Ant Design 组件展示任务执行进度
 */
export const TaskProgressPanel: React.FC = () => {
  const { token } = theme.useToken();

  const mockTasks = [
    {
      id: 1,
      name: '小红书关注任务',
      progress: 75,
      status: 'running',
      completed: 150,
      total: 200,
      estimatedTime: '25分钟'
    },
    {
      id: 2,
      name: '用户互动任务',
      progress: 100,
      status: 'completed',
      completed: 80,
      total: 80,
      estimatedTime: '已完成'
    },
    {
      id: 3,
      name: '内容发布任务',
      progress: 45,
      status: 'running',
      completed: 9,
      total: 20,
      estimatedTime: '15分钟'
    },
    {
      id: 4,
      name: '数据收集任务',
      progress: 0,
      status: 'pending',
      completed: 0,
      total: 100,
      estimatedTime: '等待中'
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          icon: <PlayCircleOutlined style={{ color: token.colorPrimary }} />,
          tag: <Tag color="processing">执行中</Tag>,
          progressColor: token.colorPrimary
        };
      case 'completed':
        return {
          icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
          tag: <Tag color="success">已完成</Tag>,
          progressColor: token.colorSuccess
        };
      case 'pending':
        return {
          icon: <ClockCircleOutlined style={{ color: token.colorWarning }} />,
          tag: <Tag color="warning">等待中</Tag>,
          progressColor: token.colorWarning
        };
      default:
        return {
          icon: <ExclamationCircleOutlined style={{ color: token.colorError }} />,
          tag: <Tag color="error">异常</Tag>,
          progressColor: token.colorError
        };
    }
  };

  return (
    <Card
      title={
        <Space align="center">
          <ClockCircleOutlined style={{ color: token.colorPrimary }} />
          <Title level={4} style={{ margin: 0 }}>
            任务执行进度
          </Title>
        </Space>
      }
      style={{ borderRadius: token.borderRadiusLG }}
    >
      <List
        dataSource={mockTasks}
        renderItem={(task) => {
          const statusConfig = getStatusConfig(task.status);
          return (
            <List.Item style={{ padding: `${token.paddingMD}px 0` }}>
              <Space direction="vertical" style={{ width: '100%' }} size={token.sizeXS}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Space align="center">
                    {statusConfig.icon}
                    <Text strong>{task.name}</Text>
                  </Space>
                  <Space align="center">
                    {statusConfig.tag}
                    <Text type="secondary">
                      {task.completed}/{task.total}
                    </Text>
                  </Space>
                </div>
                
                <Progress
                  percent={task.progress}
                  strokeColor={statusConfig.progressColor}
                  size="small"
                  format={(percent) => `${percent}%`}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    预计剩余时间: {task.estimatedTime}
                  </Text>
                  <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                    {task.progress}% 完成
                  </Text>
                </div>
              </Space>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};