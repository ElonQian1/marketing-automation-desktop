/**
 * 任务引擎管理界面 (重构版)
 * 
 * 提供任务生成、监控、分配和执行管理功能
 * 已拆分为多个子组件，符合开发规范的行数限制
 */

import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Alert,
  Tabs
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  RobotOutlined
} from '@ant-design/icons';

import { useTaskEngine } from '../hooks/useTaskEngine';
import { TaskGenerationConfig, BatchTaskGenerationConfig } from '../services/TaskEngineService';
import { 
  TaskStatus, 
  TaskType, 
  TaskPriority,
  WatchTarget,
  TaskAssignmentStrategy
} from '../../shared/types/core';

// 拆分出的子组件
import { TaskStatsCards } from './TaskStatsCards';
import { TaskTable } from './TaskTable';
import { TaskGenerationModal } from './TaskGenerationModal';
import { TaskAssignmentModal } from './TaskAssignmentModal';

const { TabPane } = Tabs;

export interface TaskEngineManagerProps {
  className?: string;
  targets?: WatchTarget[];
  availableDevices?: Array<{ id: string; name: string; online: boolean }>;
}

export const TaskEngineManager: React.FC<TaskEngineManagerProps> = ({
  className,
  targets = [],
  availableDevices = []
}) => {
  const {
    tasks,
    stats,
    loading,
    generating,
    updating,
    error,
    generateTasks,
    batchGenerateTasks,
    refreshTasks,
    refreshStats,
    assignTasksToDevice,
    cancelTask,
    retryFailedTask,
    getTasksByStatus,
    getPendingTasksCount,
    getExecutingTasksCount,
    getCompletedTasksCount,
    getFailedTasksCount
  } = useTaskEngine();

  // UI状态
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState('all');

  // 任务生成配置
  const [generationConfig] = useState<Partial<TaskGenerationConfig>>({
    max_tasks_per_target: 10,
    task_types: [TaskType.FOLLOW, TaskType.COMMENT],
    priority: TaskPriority.MEDIUM,
    assignment_strategy: TaskAssignmentStrategy.ROUND_ROBIN
  });

  // 处理任务生成
  const handleGenerateTasks = async (values: any) => {
    if (!values.target_ids || values.target_ids.length === 0) {
      Modal.warning({
        title: '请选择目标',
        content: '请至少选择一个目标进行任务生成'
      });
      return;
    }

    const selectedTargets = targets.filter(t => values.target_ids.includes(t.id));
    
    if (selectedTargets.length === 1) {
      // 单个目标生成
      const config: TaskGenerationConfig = {
        target: selectedTargets[0],
        max_tasks_per_target: values.max_tasks_per_target,
        task_types: values.task_types,
        priority: values.priority,
        assignment_strategy: values.assignment_strategy,
        schedule_delay_hours: values.schedule_delay_hours,
        required_device_count: values.required_device_count
      };

      const result = await generateTasks(config);
      
      Modal.success({
        title: '任务生成完成',
        content: `成功生成 ${result.total_count} 个任务`
      });
    } else {
      // 批量生成
      const batchConfig: BatchTaskGenerationConfig = {
        targets: selectedTargets,
        comments_per_target: selectedTargets.map(() => []), // TODO: 从评论采集模块获取
        config: {
          max_tasks_per_target: values.max_tasks_per_target,
          task_types: values.task_types,
          priority: values.priority,
        },
        parallel_processing: true,
        batch_size: values.batch_size || 100,
        distribution_strategy: values.distribution_strategy || 'even'
      };

      const results = await batchGenerateTasks(batchConfig);
      const totalTasks = results.reduce((sum, r) => sum + r.total_count, 0);
      
      Modal.success({
        title: '批量任务生成完成',
        content: `成功为 ${results.length} 个目标生成 ${totalTasks} 个任务`
      });
    }

    setGenerateModalVisible(false);
  };

  // 处理任务分配
  const handleAssignTasks = async (values: any) => {
    const assignedTasks = await assignTasksToDevice(
      values.device_id,
      values.max_tasks,
      values.task_types
    );

    Modal.success({
      title: '任务分配完成',
      content: `成功分配 ${assignedTasks.length} 个任务给设备`
    });

    setAssignModalVisible(false);
  };

  // 根据当前标签页过滤任务
  const getFilteredTasks = () => {
    switch (currentTab) {
      case 'pending':
        return getTasksByStatus(TaskStatus.NEW).concat(getTasksByStatus(TaskStatus.READY));
      case 'executing':
        return getTasksByStatus(TaskStatus.EXECUTING);
      case 'completed':
        return getTasksByStatus(TaskStatus.DONE);
      case 'failed':
        return getTasksByStatus(TaskStatus.FAILED);
      default:
        return tasks;
    }
  };

  return (
    <div className={className}>
      {/* 错误提示 */}
      {error && (
        <Alert
          message="操作失败"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 统计卡片 */}
      <TaskStatsCards
        pendingCount={getPendingTasksCount()}
        executingCount={getExecutingTasksCount()}
        completedCount={getCompletedTasksCount()}
        failedCount={getFailedTasksCount()}
      />

      {/* 主要内容 */}
      <Card
        title="任务管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refreshTasks()}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<RobotOutlined />}
              onClick={() => setAssignModalVisible(true)}
              disabled={getPendingTasksCount() === 0}
            >
              分配任务
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setGenerateModalVisible(true)}
              loading={generating}
              disabled={targets.length === 0}
            >
              生成任务
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={currentTab} onChange={setCurrentTab}>
          <TabPane tab={`全部 (${tasks.length})`} key="all" />
          <TabPane tab={`待处理 (${getPendingTasksCount()})`} key="pending" />
          <TabPane tab={`执行中 (${getExecutingTasksCount()})`} key="executing" />
          <TabPane tab={`已完成 (${getCompletedTasksCount()})`} key="completed" />
          <TabPane tab={`失败 (${getFailedTasksCount()})`} key="failed" />
        </Tabs>

        <TaskTable
          tasks={getFilteredTasks()}
          loading={loading}
          updating={updating}
          selectedTasks={selectedTasks}
          onSelectionChange={(keys) => setSelectedTasks(keys as string[])}
          onRetryTask={retryFailedTask}
          onCancelTask={cancelTask}
        />
      </Card>

      {/* 任务生成弹窗 */}
      <TaskGenerationModal
        visible={generateModalVisible}
        loading={generating}
        targets={targets}
        initialConfig={generationConfig}
        onOk={handleGenerateTasks}
        onCancel={() => setGenerateModalVisible(false)}
      />

      {/* 任务分配弹窗 */}
      <TaskAssignmentModal
        visible={assignModalVisible}
        loading={updating}
        availableDevices={availableDevices}
        onOk={handleAssignTasks}
        onCancel={() => setAssignModalVisible(false)}
      />
    </div>
  );
};