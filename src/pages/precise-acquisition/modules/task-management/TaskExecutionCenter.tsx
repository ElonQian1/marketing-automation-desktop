/**
 * 任务执行中心组件
 * 统一管理所有关注和回复任务的执行
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Badge,
  Progress,
  Tooltip,
  Popconfirm
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  UserAddOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../domain/adb/entities/Device';
import { monitoringService } from '../../services/monitoringService';
import type { ReplyTask, CommentData } from '../../services/monitoringService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TaskExecutionCenterProps {
  onlineDevices: Device[];
  onRefresh: () => void;
}

// 任务类型定义
interface TaskExecutionItem {
  id: string;
  type: 'follow' | 'reply';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  targetId: string;
  targetName: string;
  content?: string; // 回复内容
  assignedDevice?: string;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  error?: string;
  
  // 关联数据
  comment?: CommentData;
  videoUrl?: string;
  videoTitle?: string;
}

export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({
  onlineDevices,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [tasks, setTasks] = useState<TaskExecutionItem[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskExecutionItem | null>(null);
  const [form] = Form.useForm();

  // 加载任务数据
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取回复任务
      const replyTasks = await monitoringService.getReplyTasks();
      
      // 模拟一些关注任务
      const mockFollowTasks: TaskExecutionItem[] = [
        {
          id: 'follow_1',
          type: 'follow',
          status: 'pending',
          priority: 'high',
          targetId: 'user_001',
          targetName: '产品经理小王',
          assignedDevice: onlineDevices[0]?.id,
          createdAt: new Date().toISOString(),
          videoUrl: 'https://example.com/video/1',
          videoTitle: '如何提升产品转化率'
        },
        {
          id: 'follow_2',
          type: 'follow',
          status: 'completed',
          priority: 'medium',
          targetId: 'user_002',
          targetName: '营销总监李总',
          assignedDevice: onlineDevices[0]?.id,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 1800000).toISOString(),
          videoUrl: 'https://example.com/video/2',
          videoTitle: 'B2B营销策略分享'
        }
      ];

      // 转换回复任务格式
      const replyTaskItems: TaskExecutionItem[] = replyTasks.map(task => ({
        id: task.id,
        type: 'reply',
        status: task.status === 'pending' ? 'pending' : 
               task.status === 'completed' ? 'completed' : 'failed',
        priority: 'medium',
        targetId: task.comment.authorId,
        targetName: task.comment.authorName,
        content: task.replyContent,
        assignedDevice: task.assignedDevice,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        error: task.error,
        comment: task.comment,
        videoUrl: task.comment.videoUrl,
        videoTitle: task.comment.videoTitle
      }));

      setTasks([...mockFollowTasks, ...replyTaskItems]);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  }, [onlineDevices]);

  // 执行单个任务
  const executeTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'executing' } : t
    ));

    try {
      // 模拟执行延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功执行
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'completed',
          completedAt: new Date().toISOString()
        } : t
      ));
      
      message.success(`${task.type === 'follow' ? '关注' : '回复'}任务执行成功`);
      
    } catch (error) {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'failed',
          error: '执行失败'
        } : t
      ));
      message.error('任务执行失败');
    }
  }, [tasks]);

  // 批量执行任务
  const executeBatchTasks = useCallback(async () => {
    if (selectedTasks.length === 0) {
      message.warning('请选择要执行的任务');
      return;
    }

    setLoading(true);
    try {
      for (const taskId of selectedTasks) {
        await executeTask(taskId as string);
        // 添加间隔避免过快执行
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setSelectedTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTasks, executeTask]);

  // 删除任务
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      message.success('任务删除成功');
    } catch (error) {
      message.error('删除任务失败');
    }
  }, []);

  // 编辑任务
  const handleEditTask = useCallback((task: TaskExecutionItem) => {
    setEditingTask(task);
    form.setFieldsValue({
      content: task.content,
      assignedDevice: task.assignedDevice,
      priority: task.priority
    });
    setEditModalVisible(true);
  }, [form]);

  // 保存编辑
  const handleSaveEdit = useCallback(async (values: any) => {
    if (!editingTask) return;

    try {
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id ? {
          ...t,
          content: values.content,
          assignedDevice: values.assignedDevice,
          priority: values.priority
        } : t
      ));
      
      setEditModalVisible(false);
      setEditingTask(null);
      message.success('任务更新成功');
    } catch (error) {
      message.error('更新任务失败');
    }
  }, [editingTask]);

  // 获取设备名称
  const getDeviceName = (deviceId?: string): string => {
    if (!deviceId) return '未分配';
    const device = onlineDevices.find(d => d.id === deviceId);
    return device ? (device.name || device.id) : deviceId;
  };

  // 渲染状态标签
  const renderStatusTag = (status: TaskExecutionItem['status']) => {
    const statusConfig = {
      pending: { color: 'blue', icon: <ClockCircleOutlined />, text: '待执行' },
      executing: { color: 'orange', icon: <PlayCircleOutlined />, text: '执行中' },
      completed: { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' },
      failed: { color: 'red', icon: <ExclamationCircleOutlined />, text: '失败' }
    };
    
    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 渲染优先级标签
  const renderPriorityTag = (priority: TaskExecutionItem['priority']) => {
    const priorityConfig = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'blue', text: '低' }
    };
    
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns: ColumnsType<TaskExecutionItem> = [
    {
      title: '任务信息',
      key: 'taskInfo',
      width: 250,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {record.type === 'follow' ? 
              <UserAddOutlined className="text-blue-500" /> : 
              <MessageOutlined className="text-green-500" />
            }
            <Text strong>
              {record.type === 'follow' ? '关注' : '回复'}: {record.targetName}
            </Text>
          </div>
          <div className="flex items-center space-x-2">
            {renderStatusTag(record.status)}
            {renderPriorityTag(record.priority)}
          </div>
          {record.videoTitle && (
            <Tooltip title={record.videoTitle}>
              <Text type="secondary" className="text-xs block truncate">
                视频: {record.videoTitle}
              </Text>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '内容',
      key: 'content',
      ellipsis: true,
      render: (_, record) => {
        if (record.type === 'follow') {
          return <Text type="secondary">关注用户</Text>;
        }
        return (
          <Tooltip title={record.content}>
            <Text className="text-sm">{record.content}</Text>
          </Tooltip>
        );
      }
    },
    {
      title: '分配设备',
      dataIndex: 'assignedDevice',
      key: 'assignedDevice',
      width: 120,
      render: (deviceId) => getDeviceName(deviceId)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => executeTask(record.id)}
              disabled={!record.assignedDevice || onlineDevices.length === 0}
            >
              执行
            </Button>
          )}
          
          {record.type === 'reply' && record.status === 'pending' && (
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleEditTask(record)}
            >
              编辑
            </Button>
          )}
          
          {record.videoUrl && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(record.videoUrl, '_blank')}
            >
              查看
            </Button>
          )}
          
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，确认删除此任务？"
            onConfirm={() => deleteTask(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 筛选任务
  const getFilteredTasks = (status?: string) => {
    if (!status || status === 'all') return tasks;
    return tasks.filter(task => task.status === status);
  };

  // 统计数据
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    executing: tasks.filter(t => t.status === 'executing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'pending',
      label: (
        <span className="flex items-center space-x-1">
          <ClockCircleOutlined />
          <span>待执行</span>
          <Badge count={stats.pending} showZero />
        </span>
      )
    },
    {
      key: 'executing',
      label: (
        <span className="flex items-center space-x-1">
          <PlayCircleOutlined />
          <span>执行中</span>
          <Badge count={stats.executing} showZero />
        </span>
      )
    },
    {
      key: 'completed',
      label: (
        <span className="flex items-center space-x-1">
          <CheckCircleOutlined />
          <span>已完成</span>
          <Badge count={stats.completed} showZero />
        </span>
      )
    },
    {
      key: 'failed',
      label: (
        <span className="flex items-center space-x-1">
          <ExclamationCircleOutlined />
          <span>失败</span>
          <Badge count={stats.failed} showZero />
        </span>
      )
    },
    {
      key: 'all',
      label: (
        <span className="flex items-center space-x-1">
          <ThunderboltOutlined />
          <span>全部</span>
          <Badge count={stats.total} showZero />
        </span>
      )
    }
  ];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ThunderboltOutlined className="text-orange-500" />
            <Title level={4} className="m-0">任务执行中心</Title>
          </div>
          
          <Space>
            {selectedTasks.length > 0 && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={executeBatchTasks}
                loading={loading}
              >
                批量执行 ({selectedTasks.length})
              </Button>
            )}
            <Button
              icon={<ThunderboltOutlined />}
              onClick={loadTasks}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 进度统计 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">待执行</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <div className="text-xl font-bold text-orange-600">{stats.executing}</div>
            <div className="text-sm text-gray-600">执行中</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">已完成</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">失败</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-600">总计</div>
          </div>
        </div>

        {/* 任务列表 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="mb-4"
        />

        <Table
          columns={columns}
          dataSource={getFilteredTasks(activeTab)}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys: selectedTasks,
            onChange: setSelectedTasks,
            getCheckboxProps: (record) => ({
              disabled: record.status === 'executing' || record.status === 'completed'
            })
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      {/* 编辑任务弹框 */}
      <Modal
        title="编辑回复任务"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
        >
          <Form.Item
            name="content"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入回复内容"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="assignedDevice"
            label="执行设备"
            rules={[{ required: true, message: '请选择执行设备' }]}
          >
            <Select placeholder="选择执行设备">
              {onlineDevices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name || device.id} ({device.model})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};