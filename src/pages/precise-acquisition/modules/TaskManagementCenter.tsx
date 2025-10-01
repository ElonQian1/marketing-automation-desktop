import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Button,
  Badge,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Divider
} from 'antd';
import {
  UserAddOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  LinkOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { Device } from '../../../domain/adb/entities/Device';
import { shouldBypassDeviceCheck, getMockMonitoringData } from '../../../config/developmentMode';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface TaskManagementCenterProps {
  onlineDevices: Device[];
  selectedDevice?: Device | null;
  refreshDevices: () => void;
}

// 任务类型定义
interface TaskItem {
  id: string;
  type: 'follow' | 'reply';
  platform: 'xiaohongshu' | 'douyin';
  targetUser: string;
  targetUserId: string;
  videoTitle?: string;
  videoUrl?: string;
  commentContent?: string;
  replyContent?: string;
  deviceId?: string;
  deviceName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createTime: Date;
  executeTime?: Date;
  completedTime?: Date;
  priority: 'high' | 'medium' | 'low';
  source: string; // 来源：行业监控、账号监控等
}

/**
 * 任务管理中心
 * 统一管理关注和回复任务，支持任务定位、设备选择、任务清除、去重检查等功能
 */
export const TaskManagementCenter: React.FC<TaskManagementCenterProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  // 开发模式检测
  const isDevelopmentBypass = shouldBypassDeviceCheck();
  const mockData = isDevelopmentBypass ? getMockMonitoringData() : null;
  
  const [tasks, setTasks] = useState<TaskItem[]>(mockData?.taskItems?.map(task => ({
    id: task.id,
    type: task.type as 'follow' | 'reply',
    platform: task.platform === '小红书' ? 'xiaohongshu' : 'douyin' as 'xiaohongshu' | 'douyin',
    targetUser: task.target,
    targetUserId: `user_${task.id}`,
    deviceId: 'mock_device_1',
    deviceName: '华为 P40 Pro (模拟)',
    status: task.status === 'running' ? 'processing' : task.status as 'pending' | 'processing' | 'completed' | 'failed',
    createTime: new Date(task.createdAt),
    priority: 'high' as 'high' | 'medium' | 'low',
    source: '行业监控-模拟数据'
  })) || [
    {
      id: '1',
      type: 'follow',
      platform: 'xiaohongshu',
      targetUser: '美妆达人小李',
      targetUserId: 'user123',
      deviceId: 'device1',
      deviceName: '设备-1',
      status: 'pending',
      createTime: new Date(Date.now() - 10 * 60 * 1000),
      priority: 'high',
      source: '行业监控-美妆关键词'
    },
    {
      id: '2',
      type: 'reply',
      platform: 'douyin',
      targetUser: '护肤小专家',
      targetUserId: 'user456',
      videoTitle: '夏季护肤小技巧',
      videoUrl: 'https://douyin.com/video/789',
      commentContent: '这个方法真的有用吗？',
      replyContent: '确实很有效果，我用了一个月皮肤明显改善了！',
      deviceId: 'device2',
      deviceName: '设备-2',
      status: 'pending',
      createTime: new Date(Date.now() - 5 * 60 * 1000),
      priority: 'medium',
      source: '账号监控-护肤达人'
    },
    {
      id: '3',
      type: 'follow',
      platform: 'xiaohongshu',
      targetUser: '时尚博主Amy',
      targetUserId: 'user789',
      status: 'completed',
      createTime: new Date(Date.now() - 60 * 60 * 1000),
      completedTime: new Date(Date.now() - 30 * 60 * 1000),
      priority: 'low',
      source: '行业监控-时尚关键词'
    }
  ]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isExecuteModalVisible, setIsExecuteModalVisible] = useState(false);
  const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskItem | null>(null);
  const [form] = Form.useForm();

  // 执行单个任务
  const handleExecuteTask = useCallback(async (taskId: string) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'processing' as const, 
              executeTime: new Date() 
            }
          : task
      ));

      // 模拟执行过程
      setTimeout(() => {
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'completed' as const, 
                completedTime: new Date() 
              }
            : task
        ));
        message.success('任务执行成功');
      }, 2000);

      message.info('任务开始执行...');
    } catch (error) {
      message.error('任务执行失败');
    }
  }, []);

  // 批量执行任务
  const handleBatchExecute = useCallback(async () => {
    try {
      const selectedTasks = tasks.filter(task => 
        selectedRowKeys.includes(task.id) && task.status === 'pending'
      );

      for (const task of selectedTasks) {
        await handleExecuteTask(task.id);
      }

      setSelectedRowKeys([]);
      message.success(`批量执行 ${selectedTasks.length} 个任务`);
    } catch (error) {
      message.error('批量执行失败');
    }
  }, [selectedRowKeys, tasks, handleExecuteTask]);

  // 删除任务
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      message.success('任务删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  }, []);

  // 批量删除任务
  const handleBatchDelete = useCallback(async () => {
    try {
      setTasks(prev => prev.filter(task => !selectedRowKeys.includes(task.id)));
      setSelectedRowKeys([]);
      message.success('批量删除成功');
    } catch (error) {
      message.error('批量删除失败');
    }
  }, [selectedRowKeys]);

  // 去重检查
  const handleDeduplicationCheck = useCallback(async () => {
    try {
      const userIdMap = new Map();
      const duplicates: string[] = [];

      tasks.forEach(task => {
        const key = `${task.platform}-${task.targetUserId}`;
        if (userIdMap.has(key)) {
          duplicates.push(task.id);
        } else {
          userIdMap.set(key, true);
        }
      });

      if (duplicates.length > 0) {
        setTasks(prev => prev.filter(task => !duplicates.includes(task.id)));
        message.success(`去重完成，移除了 ${duplicates.length} 个重复任务`);
      } else {
        message.info('未发现重复任务');
      }
    } catch (error) {
      message.error('去重检查失败');
    }
  }, [tasks]);

  // 定位到视频和评论
  const handleLocateToVideo = useCallback((task: TaskItem) => {
    if (task.videoUrl) {
      window.open(task.videoUrl, '_blank');
      message.info('已打开原视频页面');
    } else {
      message.warning('该任务没有关联的视频链接');
    }
  }, []);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'orange', text: '待执行', icon: <ClockCircleOutlined /> },
      processing: { color: 'blue', text: '执行中', icon: <PlayCircleOutlined /> },
      completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
      failed: { color: 'red', text: '失败', icon: <ClockCircleOutlined /> }
    };
    const config = statusMap[status as keyof typeof statusMap];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取优先级标签
  const getPriorityTag = (priority: string) => {
    const priorityMap = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'blue', text: '低' }
    };
    const config = priorityMap[priority as keyof typeof priorityMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取平台标签
  const getPlatformTag = (platform: string) => {
    return platform === 'xiaohongshu' 
      ? <Tag color="red">小红书</Tag>
      : <Tag color="black">抖音</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '任务信息',
      key: 'taskInfo',
      render: (record: TaskItem) => (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Avatar 
              size="small" 
              icon={record.type === 'follow' ? <UserAddOutlined /> : <MessageOutlined />}
              style={{ backgroundColor: record.type === 'follow' ? '#1890ff' : '#52c41a' }}
            />
            <Text strong>{record.targetUser}</Text>
            {getPlatformTag(record.platform)}
            {getPriorityTag(record.priority)}
          </div>
          <Text type="secondary" className="text-xs">
            来源: {record.source}
          </Text>
        </div>
      )
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'follow' ? 'blue' : 'green'}>
          {type === 'follow' ? '关注' : '回复'}
        </Tag>
      )
    },
    {
      title: '执行设备',
      key: 'device',
      render: (record: TaskItem) => (
        record.deviceName ? (
          <Text>{record.deviceName}</Text>
        ) : (
          <Text type="secondary">未分配</Text>
        )
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: Date) => (
        <Text style={{ fontSize: '12px' }}>
          {time.toLocaleString()}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: TaskItem) => (
        <Space size="small">
          {record.type === 'reply' && record.videoUrl && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleLocateToVideo(record)}
            >
              定位
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecuteTask(record.id)}
            >
              执行
            </Button>
          )}
          <Popconfirm
            title="确定删除这个任务吗？"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: TaskItem) => ({
      disabled: record.status === 'processing',
      name: record.id,
    }),
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">任务管理中心</Title>
          <Text type="secondary">统一管理关注和回复任务的执行与跟踪</Text>
        </div>
      </div>

      {/* 快速统计 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.length}
              </div>
              <div className="text-gray-500">总任务数</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-gray-500">待执行</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-gray-500">已完成</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {onlineDevices.length}
              </div>
              <div className="text-gray-500">在线设备</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 批量操作工具栏 */}
      {selectedRowKeys.length > 0 && (
        <Card size="small" className="bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <Text>已选择 {selectedRowKeys.length} 个任务</Text>
            <Space>
              <Button
                type="primary"
                onClick={handleBatchExecute}
                disabled={!tasks.some(t => selectedRowKeys.includes(t.id) && t.status === 'pending')}
              >
                批量执行
              </Button>
              <Button onClick={handleDeduplicationCheck}>
                去重检查
              </Button>
              <Button danger onClick={handleBatchDelete}>
                批量删除
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* 任务列表 */}
      <Card title="任务列表">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 个任务`
          }}
          size="small"
        />
      </Card>
    </div>
  );
};