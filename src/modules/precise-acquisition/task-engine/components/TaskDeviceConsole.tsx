// src/modules/precise-acquisition/task-engine/components/TaskDeviceConsole.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 任务设备管理控制台组件
 * 
 * 展示任务分配、设备状态和执行监控
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Select, Tooltip, Progress, Space, Alert } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, AndroidOutlined, DesktopOutlined } from '@ant-design/icons';
import { useAdb } from '../../../../application/hooks/useAdb';
import { EnhancedTaskExecutorService, DeviceSelectionStrategy } from '../services/prospecting-enhanced-executor-service';
import { Task, TaskStatus } from '../../shared/types/core';
import type { Device } from '../../../../domain/adb/entities/Device';

const { Option } = Select;

interface TaskDeviceConsoleProps {
  tasks: Task[];
  onTaskExecute: (taskId: string, deviceId?: string) => void;
  onTaskStop: (taskId: string) => void;
}

/**
 * 任务设备控制台
 */
export const TaskDeviceConsole: React.FC<TaskDeviceConsoleProps> = ({
  tasks,
  onTaskExecute,
  onTaskStop
}) => {
  const { devices, selectedDevice, refreshDevices } = useAdb();
  const [executorService] = useState(() => new EnhancedTaskExecutorService());
  const [deviceStats, setDeviceStats] = useState(new Map());
  const [selectionStrategy, setSelectionStrategy] = useState<DeviceSelectionStrategy>({
    strategy: 'least_busy'
  });

  // 更新设备统计
  useEffect(() => {
    const stats = executorService.getDeviceTaskStats();
    setDeviceStats(stats);
  }, [executorService, tasks]);

  // 清理离线设备队列
  useEffect(() => {
    const onlineDeviceIds = devices.filter(d => d.isOnline()).map(d => d.id);
    const cleanedCount = executorService.cleanupOfflineDevices(onlineDeviceIds);
    
    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个离线设备的任务`);
    }
  }, [devices, executorService]);

  /**
   * 设备状态列
   */
  const deviceColumns = [
    {
      title: '设备',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, device: Device) => (
        <Space>
          {device.isEmulator() ? <DesktopOutlined /> : <AndroidOutlined />}
          <span>{device.getDisplayName()}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, device: Device) => {
        const isOnline = device.isOnline();
        return (
          <Tag color={isOnline ? 'green' : 'red'}>
            {isOnline ? '在线' : '离线'}
          </Tag>
        );
      }
    },
    {
      title: '队列长度',
      key: 'queueLength',
      render: (_: any, device: Device) => {
        const stats = deviceStats.get(device.id) || { queueLength: 0, isBusy: false };
        return (
          <Space>
            <span>{stats.queueLength}</span>
            {stats.isBusy && <Tag color="orange">忙碌</Tag>}
          </Space>
        );
      }
    },
    {
      title: '类型',
      key: 'type',
      render: (_: any, device: Device) => (
        <Tag color={device.isEmulator() ? 'blue' : 'green'}>
          {device.isEmulator() ? '模拟器' : '真机'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, device: Device) => (
        <Space>
          <Tooltip title="强制刷新设备">
            <Button 
              size="small" 
              onClick={() => refreshDevices()}
              disabled={!device.isOnline()}
            >
              刷新
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  /**
   * 任务列
   */
  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <code>{id.slice(0, 8)}...</code>
      )
    },
    {
      title: '类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type: string) => (
        <Tag color={type === 'reply' ? 'blue' : 'green'}>
          {type === 'reply' ? '回复' : '关注'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => {
        const colorMap = {
          [TaskStatus.NEW]: 'default',
          [TaskStatus.READY]: 'blue', 
          [TaskStatus.EXECUTING]: 'orange',
          [TaskStatus.DONE]: 'green',
          [TaskStatus.FAILED]: 'red'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: '分配设备',
      key: 'assignedDevice',
      render: (_: any, task: Task) => {
        // 这里可以显示任务分配的设备信息
        return <span>-</span>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, task: Task) => (
        <Space>
          {task.status === TaskStatus.NEW || task.status === TaskStatus.READY ? (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleTaskExecute(task)}
              disabled={devices.filter(d => d.isOnline()).length === 0}
            >
              执行
            </Button>
          ) : task.status === TaskStatus.EXECUTING ? (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => onTaskStop(task.id)}
            >
              停止
            </Button>
          ) : null}
        </Space>
      )
    }
  ];

  /**
   * 执行任务
   */
  const handleTaskExecute = async (task: Task) => {
    const onlineDevices = devices.filter(d => d.isOnline());
    
    if (onlineDevices.length === 0) {
      alert('没有在线设备可用');
      return;
    }

    // 分配任务到设备
    const assignment = await executorService.assignTaskToDevice(task, onlineDevices, selectionStrategy);
    
    if (assignment.assigned_device) {
      console.log(`任务 ${task.id} 分配给设备 ${assignment.assigned_device.id}: ${assignment.assignment_reason}`);
      onTaskExecute(task.id, assignment.assigned_device.id);
    } else {
      console.warn(`任务 ${task.id} 分配失败: ${assignment.assignment_reason}`);
    }
  };

  /**
   * 渲染分配策略选择器
   */
  const renderStrategySelector = () => (
    <Card size="small" title="分配策略" style={{ marginBottom: 16 }}>
      <Space>
        <span>设备选择策略:</span>
        <Select
          value={selectionStrategy.strategy}
          onChange={(value) => setSelectionStrategy({ ...selectionStrategy, strategy: value })}
          style={{ width: 150 }}
        >
          <Option value="least_busy">负载均衡</Option>
          <Option value="round_robin">轮询分配</Option>
          <Option value="by_region">按地域</Option>
          <Option value="manual_select">手动选择</Option>
        </Select>
        {selectionStrategy.strategy === 'by_region' && (
          <Select
            placeholder="选择地域"
            style={{ width: 120 }}
            onChange={(value) => setSelectionStrategy({ 
              ...selectionStrategy, 
              region_preference: value 
            })}
          >
            <Option value="beijing">北京</Option>
            <Option value="shanghai">上海</Option>
            <Option value="guangzhou">广州</Option>
            <Option value="shenzhen">深圳</Option>
          </Select>
        )}
      </Space>
    </Card>
  );

  /**
   * 渲染总体统计
   */
  const renderOverallStats = () => {
    const onlineDevices = devices.filter(d => d.isOnline());
    const totalTasks = tasks.length;
    const runningTasks = tasks.filter(t => t.status === TaskStatus.EXECUTING).length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    
    return (
      <Card size="small" title="执行概况" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <span>在线设备: </span>
            <Tag color="green">{onlineDevices.length}</Tag>
            <span>/ {devices.length}</span>
          </div>
          <div>
            <span>任务进度: </span>
            <Progress 
              percent={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
              size="small"
              format={() => `${completedTasks}/${totalTasks}`}
            />
          </div>
          <div>
            <span>正在执行: </span>
            <Tag color="orange">{runningTasks}</Tag>
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: 16 }}>
      {devices.length === 0 && (
        <Alert
          message="没有发现设备"
          description="请确保已连接Android设备并启用了USB调试"
          type="warning"
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={refreshDevices}>
              刷新设备
            </Button>
          }
        />
      )}
      
      {renderOverallStats()}
      {renderStrategySelector()}
      
      <Card title="设备状态" style={{ marginBottom: 16 }}>
        <Table
          dataSource={devices}
          columns={deviceColumns}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      <Card title="任务队列">
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TaskDeviceConsole;