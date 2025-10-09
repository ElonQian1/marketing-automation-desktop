/**
 * 任务表格组件
 * 
 * 显示任务列表和操作
 */

import React from 'react';
import { Table, Button, Space, Tag, Tooltip, Typography } from 'antd';

const { Text } = Typography;
import { RedoOutlined, StopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { 
  Task, 
  TaskStatus, 
  TaskType, 
  TaskPriority,
  Platform
} from '../../shared/types/core';
import { PLATFORM_LABELS } from '../../shared/constants';
import { formatDateTime } from '../../shared/utils';

export interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  updating: boolean;
  selectedTasks: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
  onRetryTask: (taskId: string) => void;
  onCancelTask: (taskId: string, reason: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  loading,
  updating,
  selectedTasks,
  onSelectionChange,
  onRetryTask,
  onCancelTask
}) => {
  // 获取状态标签样式
  const getStatusTag = (status: TaskStatus) => {
    const statusConfig = {
      [TaskStatus.NEW]: { color: 'default', text: '新建' },
      [TaskStatus.READY]: { color: 'blue', text: '就绪' },
      [TaskStatus.EXECUTING]: { color: 'processing', text: '执行中' },
      [TaskStatus.DONE]: { color: 'success', text: '完成' },
      [TaskStatus.FAILED]: { color: 'error', text: '失败' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取任务类型标签
  const getTaskTypeTag = (taskType: TaskType) => {
    const typeConfig = {
      [TaskType.FOLLOW]: { color: 'orange', text: '关注' },
      [TaskType.COMMENT]: { color: 'blue', text: '评论' },
      [TaskType.LIKE]: { color: 'red', text: '点赞' },
      [TaskType.SHARE]: { color: 'green', text: '分享' },
      [TaskType.VIEW]: { color: 'purple', text: '观看' },
      [TaskType.REPLY]: { color: 'cyan', text: '回复' }
    };
    
    const config = typeConfig[taskType];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority: TaskPriority) => {
    const priorityConfig = {
      [TaskPriority.LOW]: { color: 'default', text: '低' },
      [TaskPriority.MEDIUM]: { color: 'blue', text: '中' },
      [TaskPriority.HIGH]: { color: 'orange', text: '高' },
      [TaskPriority.URGENT]: { color: 'red', text: '紧急' }
    };
    
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 任务表格列定义
  const taskColumns: ColumnsType<Task> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id.slice(-8)}
        </Text>
      )
    },
    {
      title: '类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 80,
      render: (type: TaskType) => getTaskTypeTag(type)
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.DOUYIN ? 'red' : 'orange'}>
          {PLATFORM_LABELS[platform]}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: TaskStatus) => getStatusTag(status)
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 70,
      render: (priority: TaskPriority) => getPriorityTag(priority)
    },
    {
      title: '分配设备',
      dataIndex: 'assigned_device_id',
      key: 'assigned_device_id',
      width: 120,
      render: (deviceId: string | undefined) => 
        deviceId ? (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {deviceId.slice(-8)}
          </Text>
        ) : <Text type="secondary">未分配</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: Date) => (
        <Text style={{ fontSize: '12px' }}>
          {formatDateTime(date)}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record: Task) => (
        <Space size="small">
          {record.status === TaskStatus.FAILED && (
            <Tooltip title="重试">
              <Button
                type="text"
                size="small"
                icon={<RedoOutlined />}
                onClick={() => onRetryTask(record.id)}
                loading={updating}
              />
            </Tooltip>
          )}
          
          {(record.status === TaskStatus.NEW || record.status === TaskStatus.READY) && (
            <Tooltip title="取消">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                onClick={() => onCancelTask(record.id, '手动取消')}
                loading={updating}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <Table
      rowSelection={{
        selectedRowKeys: selectedTasks,
        onChange: onSelectionChange,
        getCheckboxProps: (record: Task) => ({
          disabled: record.status === TaskStatus.EXECUTING
        })
      }}
      columns={taskColumns}
      dataSource={tasks}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
      }}
    />
  );
};