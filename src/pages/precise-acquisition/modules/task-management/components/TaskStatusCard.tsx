/**
 * 任务状态卡片组件（临时）
 */
import React from 'react';
import { Card, Statistic } from 'antd';

export interface TaskItem {
  id: string;
  title: string;
  status: string;
  type: string;
  priority: string;
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