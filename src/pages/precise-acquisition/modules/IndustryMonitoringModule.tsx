import React, { useState, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Modal,
  message,
  Tooltip,
  Badge,
  Drawer,
  List,
  Avatar,
  Switch,
  InputNumber,
  DatePicker,
  TreeSelect
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  EyeOutlined,
  MessageOutlined,
  UserAddOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { Device } from '../../../domain/adb/entities/Device';
import { shouldBypassDeviceCheck, getMockMonitoringData } from '../../../config/developmentMode';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface IndustryMonitoringModuleProps {
  onlineDevices: Device[];
  selectedDevice?: Device | null;
  refreshDevices: () => void;
}

// 监控任务数据类型
interface MonitoringTask {
  id: string;
  name: string;
  keywords: string[];
  platforms: ('xiaohongshu' | 'douyin')[];
  regions: string[];
  deviceIds: string[];
  targetCount: number;
  currentCount: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  createTime: Date;
  lastActive: Date;
  successRate: number;
}

// 评论数据类型
interface CommentData {
  id: string;
  content: string;
  author: string;
  authorId: string;
  platform: 'xiaohongshu' | 'douyin';
  videoTitle: string;
  videoUrl: string;
  region: string;
  timestamp: Date;
  isProcessed: boolean;
  taskId: string;
}

// 地区树形数据
const regionTreeData = [
  {
    title: '华东地区',
    value: 'east',
    children: [
      { title: '上海', value: 'shanghai' },
      { title: '浙江', value: 'zhejiang' },
      { title: '江苏', value: 'jiangsu' },
      { title: '安徽', value: 'anhui' }
    ]
  },
  {
    title: '华南地区',
    value: 'south',
    children: [
      { title: '广东', value: 'guangdong' },
      { title: '广西', value: 'guangxi' },
      { title: '海南', value: 'hainan' }
    ]
  },
  {
    title: '华北地区',
    value: 'north',
    children: [
      { title: '北京', value: 'beijing' },
      { title: '天津', value: 'tianjin' },
      { title: '河北', value: 'hebei' }
    ]
  }
];

/**
 * 行业监控模块
 * 实现关键词搜索、评论区内容抓取、数据筛选和自动化操作
 */
export const IndustryMonitoringModule: React.FC<IndustryMonitoringModuleProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  const [form] = Form.useForm();
  
  // 开发模式检测
  const isDevelopmentBypass = shouldBypassDeviceCheck();
  const hasDevices = onlineDevices.length > 0;
  
  // 初始化模拟数据（仅在开发模式且无真实设备时）
  const mockData = isDevelopmentBypass ? getMockMonitoringData() : null;
  
  const [tasks, setTasks] = useState<MonitoringTask[]>(mockData?.tasks || [
    {
      id: '1',
      name: '美妆护肤监控',
      keywords: ['护肤品', '化妆品', '美妆博主'],
      platforms: ['xiaohongshu', 'douyin'],
      regions: ['shanghai', 'beijing', 'guangdong'],
      deviceIds: ['device1', 'device2'],
      targetCount: 500,
      currentCount: 234,
      status: 'running',
      createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 5 * 60 * 1000),
      successRate: 89.5
    }
  ]);

  const [comments, setComments] = useState<CommentData[]>(mockData?.userComments || [
    {
      id: '1',
      content: '这个护肤品效果真的很好，用了一个月皮肤明显改善了',
      author: '小美爱护肤',
      authorId: 'user123',
      platform: 'xiaohongshu',
      videoTitle: '平价护肤品推荐',
      videoUrl: 'https://xiaohongshu.com/video/123',
      region: 'shanghai',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isProcessed: false,
      taskId: '1'
    }
  ]);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MonitoringTask | null>(null);
  const [loading, setLoading] = useState(false);

  // 创建监控任务
  const handleCreateTask = useCallback(async (values: any) => {
    setLoading(true);
    try {
      const newTask: MonitoringTask = {
        id: Date.now().toString(),
        name: values.name,
        keywords: values.keywords,
        platforms: values.platforms,
        regions: values.regions,
        deviceIds: values.deviceIds,
        targetCount: values.targetCount,
        currentCount: 0,
        status: 'running',
        createTime: new Date(),
        lastActive: new Date(),
        successRate: 0
      };

      setTasks(prev => [...prev, newTask]);
      setIsCreateModalVisible(false);
      form.resetFields();
      message.success('监控任务创建成功！');
    } catch (error) {
      message.error('创建任务失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [form]);

  // 切换任务状态
  const handleToggleTaskStatus = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: task.status === 'running' ? 'paused' : 'running',
            lastActive: new Date()
          }
        : task
    ));
  }, []);

  // 自动关注功能
  const handleAutoFollow = useCallback(async (commentIds: string[]) => {
    try {
      const selectedComments = comments.filter(c => commentIds.includes(c.id));
      
      // TODO: 调用ADB服务执行关注操作
      for (const comment of selectedComments) {
        console.log(`关注用户: ${comment.authorId} 通过设备: ${selectedDevice?.id}`);
        // await adbService.followUser(comment.authorId, selectedDevice?.id);
      }
      
      // 标记为已处理
      setComments(prev => prev.map(c => 
        commentIds.includes(c.id) ? { ...c, isProcessed: true } : c
      ));
      
      message.success(`已关注 ${selectedComments.length} 个用户`);
    } catch (error) {
      message.error('自动关注失败');
    }
  }, [comments, selectedDevice]);

  // 生成回复任务
  const handleGenerateReplyTasks = useCallback(async (commentIds: string[]) => {
    try {
      const selectedComments = comments.filter(c => commentIds.includes(c.id));
      
      // TODO: 生成回复任务到任务中心
      console.log('生成回复任务:', selectedComments);
      
      setComments(prev => prev.map(c => 
        commentIds.includes(c.id) ? { ...c, isProcessed: true } : c
      ));
      
      message.success(`已生成 ${selectedComments.length} 个回复任务`);
    } catch (error) {
      message.error('生成回复任务失败');
    }
  }, [comments]);

  // 去重检查
  const handleDeduplicationCheck = useCallback(async () => {
    try {
      const processedAuthors = new Set();
      const duplicates = comments.filter(comment => {
        if (processedAuthors.has(comment.authorId)) {
          return true;
        }
        processedAuthors.add(comment.authorId);
        return false;
      });
      
      if (duplicates.length > 0) {
        message.warning(`发现 ${duplicates.length} 个重复用户，已标记`);
        
        // 标记重复项
        setComments(prev => prev.map(c => 
          duplicates.some(d => d.id === c.id) 
            ? { ...c, isProcessed: true } 
            : c
        ));
      } else {
        message.success('去重检查完成，未发现重复项');
      }
    } catch (error) {
      message.error('去重检查失败');
    }
  }, [comments]);

  // 批量操作处理
  const handleBatchAction = useCallback(async (action: 'follow' | 'reply' | 'dedup', selectedRowKeys: React.Key[]) => {
    const selectedIds = selectedRowKeys as string[];
    
    switch (action) {
      case 'follow':
        await handleAutoFollow(selectedIds);
        break;
      case 'reply':
        await handleGenerateReplyTasks(selectedIds);
        break;
      case 'dedup':
        await handleDeduplicationCheck();
        break;
    }
  }, [handleAutoFollow, handleGenerateReplyTasks, handleDeduplicationCheck]);

  // 查看任务详情
  const handleViewTaskDetail = useCallback((task: MonitoringTask) => {
    setSelectedTask(task);
    setIsDetailDrawerVisible(true);
  }, []);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      running: { color: 'success', text: '运行中' },
      paused: { color: 'warning', text: '已暂停' },
      completed: { color: 'default', text: '已完成' },
      failed: { color: 'error', text: '失败' }
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取平台标签
  const getPlatformTag = (platform: string) => {
    return platform === 'xiaohongshu' 
      ? <Tag color="red">小红书</Tag>
      : <Tag color="black">抖音</Tag>;
  };

  // 表格列定义
  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: MonitoringTask) => (
        <Space direction="vertical" size="small">
          <Button type="link" onClick={() => handleViewTaskDetail(record)} className="p-0">
            {text}
          </Button>
          <Space size="small">
            {record.platforms.map(platform => getPlatformTag(platform))}
          </Space>
        </Space>
      )
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (keywords: string[]) => (
        <Space size={[0, 4]} wrap>
          {keywords.slice(0, 3).map(keyword => (
            <Tag key={keyword}>{keyword}</Tag>
          ))}
          {keywords.length > 3 && <Tag>+{keywords.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '进度',
      key: 'progress',
      render: (record: MonitoringTask) => (
        <Space direction="vertical" size="small">
          <Text>{record.currentCount}/{record.targetCount}</Text>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(record.currentCount / record.targetCount) * 100}%` }}
            />
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Text type={rate > 80 ? 'success' : rate > 60 ? 'warning' : 'danger'}>
          {rate.toFixed(1)}%
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: MonitoringTask) => (
        <Space>
          <Tooltip title={record.status === 'running' ? '暂停' : '启动'}>
            <Button
              size="small"
              icon={record.status === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleTaskStatus(record.id)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTaskDetail(record)}
            />
          </Tooltip>
          <Tooltip title="设置">
            <Button size="small" icon={<SettingOutlined />} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">行业监控</Title>
          <Text type="secondary">基于关键词的自动化社交媒体监控与用户获取</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshDevices}>
            刷新
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            创建监控任务
          </Button>
        </Space>
      </div>

      {/* 快速统计 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'running').length}
              </div>
              <div className="text-gray-500">运行中任务</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.reduce((sum, t) => sum + t.currentCount, 0)}
              </div>
              <div className="text-gray-500">累计获取用户</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {comments.filter(c => !c.isProcessed).length}
              </div>
              <div className="text-gray-500">待处理评论</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 监控任务列表 */}
      <Card 
        title="监控任务" 
        extra={
          <Space>
            <Button size="small" icon={<FilterOutlined />}>筛选</Button>
            <Button size="small" icon={<DownloadOutlined />}>导出</Button>
          </Space>
        }
      >
        <Table
          columns={taskColumns}
          dataSource={tasks}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* 评论管理区域 */}
      <Card
        title={
          <Space>
            <MessageOutlined />
            <span>评论管理中心</span>
            <Badge count={comments.filter(c => !c.isProcessed).length} />
          </Space>
        }
        extra={
          <Space>
            <Button 
              size="small" 
              icon={<FilterOutlined />}
              onClick={handleDeduplicationCheck}
            >
              去重检查
            </Button>
            <Button size="small" icon={<DownloadOutlined />}>
              导出评论
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys, selectedRows) => {
              console.log('选中的评论:', selectedRowKeys, selectedRows);
            },
            getCheckboxProps: (record: CommentData) => ({
              disabled: record.isProcessed,
              name: record.id,
            }),
          }}
          columns={[
            {
              title: '评论内容',
              dataIndex: 'content',
              key: 'content',
              ellipsis: true,
              render: (text: string, record: CommentData) => (
                <div>
                  <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
                    {text}
                  </Text>
                  <div className="mt-1">
                    <Space size="small">
                      {getPlatformTag(record.platform)}
                      <Tag>{record.region}</Tag>
                      {record.isProcessed && <Tag color="green">已处理</Tag>}
                    </Space>
                  </div>
                </div>
              )
            },
            {
              title: '用户信息',
              key: 'user',
              render: (record: CommentData) => (
                <div>
                  <Text strong>{record.author}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ID: {record.authorId}
                  </Text>
                </div>
              )
            },
            {
              title: '视频信息',
              dataIndex: 'videoTitle',
              key: 'videoTitle',
              ellipsis: true,
              render: (text: string, record: CommentData) => (
                <Button
                  type="link"
                  size="small"
                  onClick={() => window.open(record.videoUrl, '_blank')}
                  style={{ padding: 0, height: 'auto' }}
                >
                  <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 150 }}>
                    {text}
                  </Text>
                </Button>
              )
            },
            {
              title: '发布时间',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (time: Date) => (
                <Text style={{ fontSize: '12px' }}>
                  {time.toLocaleString()}
                </Text>
              )
            },
            {
              title: '操作',
              key: 'actions',
              render: (record: CommentData) => (
                <Space size="small">
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<UserAddOutlined />}
                    disabled={record.isProcessed}
                    onClick={() => handleAutoFollow([record.id])}
                  >
                    关注
                  </Button>
                  <Button
                    size="small"
                    icon={<MessageOutlined />}
                    disabled={record.isProcessed}
                    onClick={() => handleGenerateReplyTasks([record.id])}
                  >
                    回复
                  </Button>
                </Space>
              )
            }
          ]}
          dataSource={comments}
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条评论`
          }}
          size="small"
          scroll={{ x: 800 }}
          footer={(currentPageData) => {
            const selectedRowKeys = currentPageData
              .filter(item => !item.isProcessed)
              .map(item => item.id);
            
            return selectedRowKeys.length > 0 ? (
              <div className="text-center py-2">
                <Space>
                  <Text type="secondary">批量操作:</Text>
                  <Button
                    size="small"
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => handleBatchAction('follow', selectedRowKeys)}
                  >
                    批量关注
                  </Button>
                  <Button
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={() => handleBatchAction('reply', selectedRowKeys)}
                  >
                    批量生成回复任务
                  </Button>
                </Space>
              </div>
            ) : null;
          }}
        />
      </Card>

      {/* 创建任务弹窗 */}
      <Modal
        title="创建行业监控任务"
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            label="任务名称"
            name="name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="如：美妆护肤监控" />
          </Form.Item>

          <Form.Item
            label="监控关键词"
            name="keywords"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Select
              mode="tags"
              placeholder="输入关键词，回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="监控平台"
                name="platforms"
                rules={[{ required: true, message: '请选择平台' }]}
              >
                <Select mode="multiple" placeholder="选择平台">
                  <Option value="xiaohongshu">小红书</Option>
                  <Option value="douyin">抖音</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="目标数量"
                name="targetCount"
                rules={[{ required: true, message: '请输入目标数量' }]}
              >
                <InputNumber 
                  min={1} 
                  max={10000} 
                  placeholder="目标获取用户数"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="地域范围"
            name="regions"
            rules={[{ required: true, message: '请选择地域' }]}
          >
            <TreeSelect
              multiple
              treeData={regionTreeData}
              placeholder="选择监控地域"
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="执行设备"
            name="deviceIds"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select mode="multiple" placeholder="选择执行设备">
              {onlineDevices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.getDisplayName()}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsCreateModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
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
        visible={isDetailDrawerVisible}
        onClose={() => setIsDetailDrawerVisible(false)}
      >
        {selectedTask && (
          <div className="space-y-6">
            <Card title="基本信息" size="small">
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between">
                  <Text>任务名称：</Text>
                  <Text strong>{selectedTask.name}</Text>
                </div>
                <div className="flex justify-between">
                  <Text>创建时间：</Text>
                  <Text>{selectedTask.createTime.toLocaleString()}</Text>
                </div>
                <div className="flex justify-between">
                  <Text>最后活跃：</Text>
                  <Text>{selectedTask.lastActive.toLocaleString()}</Text>
                </div>
                <div className="flex justify-between">
                  <Text>当前状态：</Text>
                  {getStatusTag(selectedTask.status)}
                </div>
              </Space>
            </Card>

            <Card title="执行进度" size="small">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Text>进度：</Text>
                  <Text>{selectedTask.currentCount}/{selectedTask.targetCount}</Text>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${(selectedTask.currentCount / selectedTask.targetCount) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0</span>
                  <span>{selectedTask.targetCount}</span>
                </div>
              </div>
            </Card>

            <Card title="相关评论" size="small">
              <List
                size="small"
                dataSource={comments.filter(c => c.taskId === selectedTask.id)}
                renderItem={(comment) => (
                  <List.Item
                    actions={[
                      <Button size="small" type="link">查看</Button>,
                      <Button size="small" type="link">回复</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar size="small">{comment.author[0]}</Avatar>}
                      title={
                        <Space>
                          {getPlatformTag(comment.platform)}
                          <Text>{comment.author}</Text>
                          <Text type="secondary" className="text-xs">
                            {comment.timestamp.toLocaleTimeString()}
                          </Text>
                        </Space>
                      }
                      description={
                        <div>
                          <Text className="text-sm">{comment.content}</Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            来源：{comment.videoTitle}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};