// src/pages/precise-acquisition/modules/task-management/components/TaskExecutionCenter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tabs,
  Table,
  Progress,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Empty,
  Alert
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../../domain/adb/entities/Device';
import { useSemiAutoTasks } from '../semi-auto/useSemiAutoTasks';
import type { SemiAutoTask, SemiAutoTaskCreate } from '../semi-auto/types';
import { SemiAutoExecutionDrawer } from '../semi-auto/SemiAutoExecutionDrawer';

const { Text } = Typography;

interface TaskExecutionCenterProps {
  onlineDevices: Device[];
  onRefresh: () => void;
}

/**
 * 任务执行中心组件
 * 负责任务的创建、执行、监控和管理
 */
export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({
  onlineDevices,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<SemiAutoTask | null>(null);
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    executeTask,
    pauseTask,
    resumeTask,
    deleteTask,
    getStats
  } = useSemiAutoTasks({ devices: onlineDevices });

  const stats = getStats();

  // 刷新任务列表
  const handleRefresh = useCallback(async () => {
    try {
      await loadTasks();
      onRefresh();
      message.success('任务列表已刷新');
    } catch (error) {
      message.error('刷新失败');
    }
  }, [loadTasks, onRefresh]);

  // 执行任务
  const handleExecuteTask = useCallback(async (taskId: string) => {
    try {
      await executeTask(taskId);
      message.success('任务开始执行');
    } catch (error) {
      message.error('执行任务失败');
    }
  }, [executeTask]);

  // 暂停任务
  const handlePauseTask = useCallback(async (taskId: string) => {
    try {
      await pauseTask(taskId);
      message.success('任务已暂停');
    } catch (error) {
      message.error('暂停任务失败');
    }
  }, [pauseTask]);

  // 恢复任务
  const handleResumeTask = useCallback(async (taskId: string) => {
    try {
      await resumeTask(taskId);
      message.success('任务已恢复');
    } catch (error) {
      message.error('恢复任务失败');
    }
  }, [resumeTask]);

  // 删除任务
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      message.success('任务已删除');
    } catch (error) {
      message.error('删除任务失败');
    }
  }, [deleteTask]);

  // 创建任务
  const handleCreateTask = useCallback(async (taskData: SemiAutoTaskCreate, deviceId?: string) => {
    try {
      await createTask(taskData, deviceId);
      message.success('任务创建成功');
      setDrawerVisible(false);
    } catch (error) {
      message.error('创建任务失败');
    }
  }, [createTask]);
  // 编辑任务
  const handleEditTask = useCallback((task: SemiAutoTask) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority
    });
    setEditModalVisible(true);
  }, [form]);

  // 保存编辑
  const handleSaveEdit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      // 这里应该调用更新任务的API
      message.success('任务更新成功');
      setEditModalVisible(false);
      setEditingTask(null);
    } catch (error) {
      message.error('更新任务失败');
    }
  }, [form]);

  // 根据状态过滤任务
  const getFilteredTasks = useCallback((status: string) => {
    if (status === 'all') return tasks;
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // 获取状态标签
  const getStatusTag = (status: SemiAutoTask['status']) => {
    const statusConfig = {
      pending: { color: 'default', text: '待执行', icon: <ClockCircleOutlined /> },
      executing: { color: 'processing', text: '执行中', icon: <PlayCircleOutlined /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '失败', icon: <EditOutlined /> },
      paused: { color: 'warning', text: '已暂停', icon: <PauseCircleOutlined /> }
    };
    
    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取优先级标签
  const getPriorityTag = (priority: SemiAutoTask['priority']) => {
    const priorityConfig = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'blue', text: '低' }
    };
    
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<SemiAutoTask> = [
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: SemiAutoTask) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const typeConfig = {
          follow: { color: 'blue', text: '关注' },
          reply: { color: 'green', text: '回复' },
          comment: { color: 'orange', text: '评论' },
          like: { color: 'red', text: '点赞' }
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SemiAutoTask['status']) => getStatusTag(status)
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: SemiAutoTask['priority']) => getPriorityTag(priority)
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number, record: SemiAutoTask) => (
        <Progress 
          percent={progress} 
          size="small"
          status={record.status === 'failed' ? 'exception' : 'active'}
        />
      )
    },
    {
      title: '设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 100,
      render: (deviceName: string | undefined) => deviceName || '未分配'
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record: SemiAutoTask) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecuteTask(record.id)}
            >
              执行
            </Button>
          )}
          {record.status === 'executing' && (
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handlePauseTask(record.id)}
            >
              暂停
            </Button>
          )}
          {record.status === 'paused' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleResumeTask(record.id)}
            >
              继续
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="task-execution-center">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {error && (
          <Alert
            type="error"
            showIcon
            message="任务数据加载失败"
            description={error}
          />
        )}

                {/* 统计卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总任务数"
                value={stats.total}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="执行中"
                value={stats.executing}
                valueStyle={{ color: '#1890ff' }}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成功率"
                value={stats.successRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 工具栏 */}
        <Card>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setDrawerVisible(true)}
            >
              创建任务
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Card>

        {/* 任务列表 */}
        <Card title="任务列表">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'all',
                label: `全部 (${stats.total})`,
                children: (
                  <Table
                    columns={columns}
                    dataSource={getFilteredTasks('all')}
                    rowKey="id"
                    loading={loading}
                    locale={{
                      emptyText: <Empty description="暂无任务" />
                    }}
                    pagination={{
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 个任务`
                    }}
                  />
                ),
              },
              {
                key: 'pending',
                label: `待执行 (${stats.pending})`,
                children: (
                  <Table
                    columns={columns}
                    dataSource={getFilteredTasks('pending')}
                    rowKey="id"
                    loading={loading}
                    locale={{
                      emptyText: <Empty description="暂无待执行任务" />
                    }}
                  />
                ),
              },
              {
                key: 'executing',
                label: `执行中 (${stats.executing})`,
                children: (
                  <Table
                    columns={columns}
                    dataSource={getFilteredTasks('executing')}
                    rowKey="id"
                    loading={loading}
                    locale={{
                      emptyText: <Empty description="暂无执行中任务" />
                    }}
                  />
                ),
              },
              {
                key: 'completed',
                label: `已完成 (${stats.completed})`,
                children: (
                  <Table
                    columns={columns}
                    dataSource={getFilteredTasks('completed')}
                    rowKey="id"
                    loading={loading}
                    locale={{
                      emptyText: <Empty description="暂无已完成任务" />
                    }}
                  />
                ),
              },
            ]}
          />
        </Card>
      </Space>

      {/* 任务创建抽屉 */}
      <SemiAutoExecutionDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        devices={onlineDevices}
        onExecute={handleCreateTask}
      />

      {/* 编辑任务模态框 */}
      <Modal
        title="编辑任务"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingTask(null);
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="输入任务标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="任务描述"
          >
            <Input.TextArea rows={3} placeholder="输入任务描述" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};