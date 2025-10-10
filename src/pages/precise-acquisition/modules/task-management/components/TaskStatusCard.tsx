/**
 * 任务状态卡片组件（临时）
 */
import React from 'react';
import { Card, Statistic } from 'antd';

export interface TaskItem {
  id: string;
  title: string;
  name: string; // 兼容旧代码
  status: string;
  type: string;
  priority: string;
  progress: number;
  errorMessage?: string;
  startTime?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  deviceId?: string;
  deviceName?: string;
  targetAccount?: string;
  targetContent?: string;
  content?: string;
  executorMode?: string;
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

interface TaskStatusCardProps {
  title: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}

export const TaskStatusCard: React.FC<TaskStatusCardProps> = ({
  title,
  value,
  color = '#1890ff',
  icon
}) => {
  return (
    <Card size="small">
      <Statistic
        title={title}
        value={value}
        valueStyle={{ color }}
        prefix={icon}
      />
    </Card>
  );
};

export default TaskStatusCard;