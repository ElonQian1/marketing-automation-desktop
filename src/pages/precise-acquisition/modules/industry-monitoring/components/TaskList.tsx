// src/pages/precise-acquisition/modules/industry-monitoring/components/TaskList.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 任务列表组件
 * 显示和管理所有监控任务
 */

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Tooltip,
  Badge,
  Dropdown,
  Progress
} from 'antd';
import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { MonitoringTask } from '../../../shared/types/monitoringTypes';
import type { Device } from '../../../../../domain/adb/entities/Device';

const { Title, Text } = Typography;

interface TaskListProps {
  tasks: MonitoringTask[];
  onlineDevices: Device[];
  onEditTask: (task: MonitoringTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string, status: 'active' | 'paused') => void;
  onViewTaskDetails: (task: MonitoringTask) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onlineDevices,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  onViewTaskDetails
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  // 获取设备名称
  const getDeviceName = (deviceId: string): string => {
    const device = onlineDevices.find(d => d.id === deviceId);
    return device ? (device.name || device.id) : deviceId;
  };

  // 状态标签渲染
  const renderStatusTag = (status: MonitoringTask['status']) => {
    const statusConfig = {
      active: { color: 'green', text: '运行中' },
      paused: { color: 'orange', text: '已暂停' },
      completed: { color: 'blue', text: '已完成' },
      error: { color: 'red', text: '错误' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 类型标签渲染
  const renderTypeTag = (type: MonitoringTask['type']) => {
    const typeConfig = {
      industry: { color: 'blue', text: '行业监控' },
      account: { color: 'purple', text: '账号监控' },
      video: { color: 'cyan', text: '视频监控' }
    };
    
    const config = typeConfig[type];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns: ColumnsType<MonitoringTask> = [
    {
      title: '任务信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {renderTypeTag(record.type)}
            {renderStatusTag(record.status)}
          </div>
          <div className="text-sm">
            {record.type === 'industry' && (
              <Text type="secondary">
                关键词: {record.keywords?.join(', ') || '无'}
              </Text>
            )}
            {record.type === 'account' && (
              <Text type="secondary">
                账号: {record.targetAccount}
              </Text>
            )}
            {record.type === 'video' && (
              <Text type="secondary">
                视频: {record.targetVideo}
              </Text>
            )}
          </div>
          <div className="text-xs text-gray-500">
            创建时间: {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      title: '筛选条件',
      key: 'filters',
      width: 200,
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          {record.filters.commentTimeRange && (
            <div>时间: {record.filters.commentTimeRange}天内</div>
          )}
          {record.filters.region && record.filters.region.length > 0 && (
            <div>地域: {record.filters.region.length}个地区</div>
          )}
          {record.filters.minLikes && (
            <div>最小点赞: {record.filters.minLikes}</div>
          )}
        </div>
      )
    },
    {
      title: '执行设备',
      key: 'devices',
      width: 150,
      render: (_, record) => (
        <div className="space-y-1">
          {record.assignedDevices.map(deviceId => (
            <Tag key={deviceId}>
              {getDeviceName(deviceId)}
            </Tag>
          ))}
          {record.assignedDevices.length === 0 && (
            <Text type="secondary">未分配</Text>
          )}
        </div>
      )
    },
    {
      title: '执行统计',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <Badge color="blue" />
            <span>关注: {record.stats.followCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge color="green" />
            <span>回复: {record.stats.replyCount}</span>
          </div>
          {record.stats.lastExecuted && (
            <div className="text-xs text-gray-500">
              最后执行: {new Date(record.stats.lastExecuted).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => onViewTaskDetails(record)
          },
          {
            key: 'edit',
            label: '编辑任务',
            icon: <EditOutlined />,
            onClick: () => onEditTask(record)
          },
          {
            key: 'toggle',
            label: record.status === 'active' ? '暂停任务' : '启动任务',
            icon: record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />,
            onClick: () => onToggleTaskStatus(
              record.id, 
              record.status === 'active' ? 'paused' : 'active'
            )
          },
          {
            key: 'delete',
            label: '删除任务',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              // 这里会通过 Popconfirm 处理
            }
          }
        ];

        return (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => onToggleTaskStatus(
                record.id, 
                record.status === 'active' ? 'paused' : 'active'
              )}
              className={record.status === 'active' ? 'text-orange-500' : 'text-green-500'}
            />
            
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewTaskDetails(record)}
            />

            <Dropdown
              menu={{
                items: menuItems.filter(item => item.key !== 'delete').map(item => ({
                  ...item,
                  onClick: item.onClick
                }))
              }}
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>

            <ConfirmPopover
              mode="default"
              title="确认删除"
              description="删除任务将同时清理相关的评论数据和回复任务，此操作不可恢复。"
              onConfirm={() => onDeleteTask(record.id)}
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                className="text-red-500"
              />
            </ConfirmPopover>
          </Space>
        );
      }
    }
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChartOutlined className="text-blue-500" />
          <Title level={4} className="m-0">监控任务列表</Title>
          <Badge count={tasks.length} showZero color="blue" />
        </div>
        
        {selectedRowKeys.length > 0 && (
          <div className="flex items-center space-x-2">
            <Text type="secondary">已选择 {selectedRowKeys.length} 个任务</Text>
            <Button size="small">批量操作</Button>
          </div>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: Key[]) => setSelectedRowKeys(keys),
          preserveSelectedRowKeys: true
        }}
        scroll={{ x: 1000 }}
        size="small"
      />

      {tasks.length === 0 && (
        <div className="text-center py-8">
          <Text type="secondary">暂无监控任务，请创建第一个任务开始使用</Text>
        </div>
      )}
    </Card>
  );
};