// src/components/precise-acquisition/EnhancedTaskManagementDashboard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 增强的任务管理仪表盘
 * 
 * 结合Task实体状态机和TaskDeviceConsole，提供完整的任务管理界面
 * 包括任务创建、状态监控、执行控制和历史查看
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Select, 
  Input, 
  // DatePicker, // 未使用 
  Statistic, 
  // Progress, // 未使用 
  Drawer,
  Tabs,
  Timeline,
  Badge,
  Tooltip,
  Popconfirm,
  notification
} from 'antd';
import { 
  PlayCircleOutlined,
  PauseCircleOutlined,
  // StopOutlined, // 未使用
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  // EditOutlined, // 未使用
  DeleteOutlined,
  MonitorOutlined,
  // ClockCircleOutlined, // 未使用
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// 类型定义
import { Task } from '../../modules/precise-acquisition/shared/types/core';
import { TaskStatus, TaskType, Platform } from '../../constants/precise-acquisition-enums';
import { TaskDeviceConsole } from '../../modules/precise-acquisition/task-engine/components/TaskDeviceConsole';

// 服务导入
import { TaskEngineService } from '../../modules/precise-acquisition/task-engine';

// 创建服务实例
const taskEngineService = new TaskEngineService();
// import { enhancedTaskExecutorService } from '../../modules/precise-acquisition/task-engine/services/EnhancedTaskExecutorService';

const { TabPane } = Tabs;
const { Option } = Select;
// const { RangePicker } = DatePicker; // 未使用

interface TaskManagementStats {
  total: number;
  new: number;
  ready: number;
  executing: number;
  done: number;
  failed: number;
  success_rate: number;
}

interface TaskCreationFormData {
  task_type: TaskType;
  platform: Platform;
  target_user_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_device_id?: string;
  scheduled_at?: Date;
  metadata?: Record<string, unknown>;
}

export const EnhancedTaskManagementDashboard: React.FC = () => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskManagementStats>({
    total: 0,
    new: 0,
    ready: 0,
    executing: 0,
    done: 0,
    failed: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showDeviceConsole, setShowDeviceConsole] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 表单实例
  const [createForm] = Form.useForm<TaskCreationFormData>();

  // 加载任务数据
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await taskEngineService.getTasks({
        limit: 100,
        include_metadata: true
      });
      setTasks(result.tasks);
      
      // 计算统计数据
      const newStats = result.tasks.reduce((acc, task) => {
        acc.total++;
        acc[task.status as keyof TaskManagementStats]++;
        return acc;
      }, {
        total: 0,
        new: 0,
        ready: 0,
        executing: 0,
        done: 0,
        failed: 0,
        success_rate: 0
      } as TaskManagementStats);
      
      newStats.success_rate = newStats.total > 0 
        ? Math.round((newStats.done / (newStats.done + newStats.failed)) * 100) || 0
        : 0;
      
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      notification.error({
        message: '加载任务失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadTasks();
    
    // 定时刷新
    const interval = setInterval(loadTasks, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, [loadTasks]);

  // 任务状态变更
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskEngineService.updateTaskStatus(taskId, newStatus);
      notification.success({
        message: '任务状态更新成功',
        description: `任务已切换到 ${getStatusText(newStatus)} 状态`
      });
      loadTasks(); // 重新加载数据
    } catch (error) {
      notification.error({
        message: '状态更新失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 创建新任务
  const handleCreateTask = async (values: TaskCreationFormData) => {
    try {
      const result = await taskEngineService.generateTasks({
        target: {
          user_id: values.target_user_id,
          platform: values.platform
        },
        task_types: [values.task_type],
        priority: values.priority,
        assignment_strategy: 'round_robin',
        max_tasks_per_target: 1
      });

      notification.success({
        message: '任务创建成功',
        description: `成功创建 ${result.total_count} 个任务`
      });
      
      setShowCreateModal(false);
      createForm.resetFields();
      loadTasks();
    } catch (error) {
      notification.error({
        message: '任务创建失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 批量操作
  const handleBatchOperation = async (taskIds: string[], operation: 'start' | 'pause' | 'cancel') => {
    try {
      const promises = taskIds.map(id => {
        switch (operation) {
          case 'start':
            return taskEngineService.updateTaskStatus(id, TaskStatus.READY);
          case 'pause':
            return taskEngineService.updateTaskStatus(id, TaskStatus.NEW);
          case 'cancel':
            return taskEngineService.updateTaskStatus(id, TaskStatus.FAILED);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      notification.success({
        message: '批量操作成功',
        description: `成功处理 ${taskIds.length} 个任务`
      });
      loadTasks();
    } catch (error) {
      notification.error({
        message: '批量操作失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 获取状态显示文本
  const getStatusText = (status: TaskStatus): string => {
    const statusMap: Record<TaskStatus, string> = {
      [TaskStatus.NEW]: '新建',
      [TaskStatus.READY]: '就绪',
      [TaskStatus.EXECUTING]: '执行中',
      [TaskStatus.DONE]: '已完成',
      [TaskStatus.FAILED]: '失败'
    };
    return statusMap[status] || status;
  };

  // 获取状态颜色
  const getStatusColor = (status: TaskStatus): string => {
    const colorMap: Record<TaskStatus, string> = {
      [TaskStatus.NEW]: 'default',
      [TaskStatus.READY]: 'blue',
      [TaskStatus.EXECUTING]: 'processing',
      [TaskStatus.DONE]: 'success',
      [TaskStatus.FAILED]: 'error'
    };
    return colorMap[status] || 'default';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string): string => {
    const colorMap: Record<string, string> = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colorMap[priority] || 'default';
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <span className="font-mono text-xs">{id.slice(-8)}</span>
      )
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type: TaskType) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: Platform) => <Tag>{platform}</Tag>
    },
    {
      title: '目标用户',
      dataIndex: 'target_user_id',
      key: 'target_user_id',
      render: (userId: string) => (
        <span className="font-mono text-xs">{userId}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority?.toUpperCase() || 'MEDIUM'}
        </Tag>
      )
    },
    {
      title: '设备',
      dataIndex: 'assigned_device_id',
      key: 'assigned_device_id',
      render: (deviceId: string) => (
        deviceId ? (
          <Tag color="green">{deviceId.slice(-6)}</Tag>
        ) : (
          <Tag color="default">未分配</Tag>
        )
      )
    },
    {
      title: '重试次数',
      dataIndex: 'retry_count',
      key: 'retry_count',
      render: (count: number) => (
        <Badge count={count} showZero color={count > 0 ? 'orange' : 'green'} />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => (
        <span className="text-xs text-gray-500">
          {dayjs(date).format('MM-DD HH:mm')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: Task) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTask(record);
                setShowTaskDetail(true);
              }}
            />
          </Tooltip>
          
          {record.status === TaskStatus.NEW && (
            <Tooltip title="启动任务">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleTaskStatusChange(record.id, TaskStatus.READY)}
              />
            </Tooltip>
          )}
          
          {record.status === TaskStatus.EXECUTING && (
            <Tooltip title="暂停任务">
              <Button
                type="text"
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => handleTaskStatusChange(record.id, TaskStatus.NEW)}
              />
            </Tooltip>
          )}
          
          {(record.status === TaskStatus.FAILED || record.status === TaskStatus.NEW) && (
            <Tooltip title="重新启动">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleTaskStatusChange(record.id, TaskStatus.READY)}
              />
            </Tooltip>
          )}
          
          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => handleTaskStatusChange(record.id, TaskStatus.FAILED)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除任务">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: '24px' }}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">任务管理仪表盘</h2>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              创建任务
            </Button>
            <Button
              icon={<MonitorOutlined />}
              onClick={() => setShowDeviceConsole(true)}
            >
              设备控制台
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTasks}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card size="small">
            <Statistic title="总任务数" value={stats.total} />
          </Card>
          <Card size="small">
            <Statistic title="新建" value={stats.new} valueStyle={{ color: '#666' }} />
          </Card>
          <Card size="small">
            <Statistic title="就绪" value={stats.ready} valueStyle={{ color: '#1890ff' }} />
          </Card>
          <Card size="small">
            <Statistic title="执行中" value={stats.executing} valueStyle={{ color: '#52c41a' }} />
          </Card>
          <Card size="small">
            <Statistic title="已完成" value={stats.done} valueStyle={{ color: '#52c41a' }} />
          </Card>
          <Card size="small">
            <Statistic title="失败" value={stats.failed} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
          <Card size="small">
            <Statistic 
              title="成功率" 
              value={stats.success_rate} 
              suffix="%" 
              valueStyle={{ color: stats.success_rate >= 80 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="任务概览" key="overview">
          <Card>
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="执行历史" key="history">
          <Card>
            <Timeline>
              {tasks
                .filter(task => task.status === TaskStatus.DONE || task.status === TaskStatus.FAILED)
                .slice(0, 10)
                .map(task => (
                  <Timeline.Item
                    key={task.id}
                    color={task.status === TaskStatus.DONE ? 'green' : 'red'}
                    dot={task.status === TaskStatus.DONE ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{task.task_type} - {task.target_user_id}</div>
                        <div className="text-sm text-gray-500">
                          {getStatusText(task.status)} • {dayjs(task.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                      </div>
                      <Tag color={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Tag>
                    </div>
                  </Timeline.Item>
                ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      {/* 创建任务模态框 */}
      <Modal
        title="创建新任务"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            name="task_type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select placeholder="选择任务类型">
              <Option value={TaskType.FOLLOW}>关注</Option>
              <Option value={TaskType.LIKE}>点赞</Option>
              <Option value={TaskType.COMMENT}>评论</Option>
              <Option value={TaskType.REPLY}>回复</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="platform"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="选择平台">
              <Option value={Platform.XIAOHONGSHU}>小红书</Option>
              <Option value={Platform.DOUYIN}>抖音</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target_user_id"
            label="目标用户ID"
            rules={[{ required: true, message: '请输入目标用户ID' }]}
          >
            <Input placeholder="输入目标用户ID" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            initialValue="medium"
          >
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setShowCreateModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建任务
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        placement="right"
        width={600}
        open={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
      >
        {selectedTask && (
          <div className="space-y-4">
            <Card title="基本信息" size="small">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">任务ID</div>
                  <div className="font-mono">{selectedTask.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">任务类型</div>
                  <Tag color="blue">{selectedTask.task_type}</Tag>
                </div>
                <div>
                  <div className="text-sm text-gray-500">平台</div>
                  <Tag>{selectedTask.platform}</Tag>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <Tag color={getStatusColor(selectedTask.status)}>
                    {getStatusText(selectedTask.status)}
                  </Tag>
                </div>
                <div>
                  <div className="text-sm text-gray-500">目标用户</div>
                  <div className="font-mono">{selectedTask.target_user_id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">分配设备</div>
                  {selectedTask.assigned_device_id ? (
                    <Tag color="green">{selectedTask.assigned_device_id}</Tag>
                  ) : (
                    <Tag color="default">未分配</Tag>
                  )}
                </div>
              </div>
            </Card>

            <Card title="执行信息" size="small">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">重试次数</div>
                  <Badge count={selectedTask.retry_count} showZero />
                </div>
                <div>
                  <div className="text-sm text-gray-500">优先级</div>
                  <Tag color={getPriorityColor(selectedTask.priority || 'medium')}>
                    {(selectedTask.priority || 'medium').toUpperCase()}
                  </Tag>
                </div>
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div>{dayjs(selectedTask.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">更新时间</div>
                  <div>{dayjs(selectedTask.updated_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                </div>
              </div>
            </Card>

            {selectedTask.metadata && Object.keys(selectedTask.metadata).length > 0 && (
              <Card title="元数据" size="small">
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                  {JSON.stringify(selectedTask.metadata, null, 2)}
                </pre>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              {selectedTask.status === TaskStatus.NEW && (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    handleTaskStatusChange(selectedTask.id, TaskStatus.READY);
                    setShowTaskDetail(false);
                  }}
                >
                  启动任务
                </Button>
              )}
              {selectedTask.status === TaskStatus.EXECUTING && (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={() => {
                    handleTaskStatusChange(selectedTask.id, TaskStatus.NEW);
                    setShowTaskDetail(false);
                  }}
                >
                  暂停任务
                </Button>
              )}
              {(selectedTask.status === TaskStatus.FAILED || selectedTask.status === TaskStatus.NEW) && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    handleTaskStatusChange(selectedTask.id, TaskStatus.READY);
                    setShowTaskDetail(false);
                  }}
                >
                  重新启动
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* 设备控制台抽屉 */}
      <Drawer
        title="设备控制台"
        placement="bottom"
        height={600}
        open={showDeviceConsole}
        onClose={() => setShowDeviceConsole(false)}
      >
        <TaskDeviceConsole />
      </Drawer>
    </div>
  );
};

export default EnhancedTaskManagementDashboard;