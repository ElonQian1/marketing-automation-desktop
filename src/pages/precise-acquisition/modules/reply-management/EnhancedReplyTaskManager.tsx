// src/pages/precise-acquisition/modules/reply-management/EnhancedReplyTaskManager.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 增强版回复任务管理组件
 * 显示待回复的评论列表，支持视频超链接、更好的定位功能，优化回复流程
 */

import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Avatar,
  Badge,
  Drawer,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  List,
  Divider,
  Image,
  Rate
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  MessageOutlined,
  SendOutlined,
  EyeOutlined,
  LinkOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  PlayCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../domain/adb/entities/Device';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export interface EnhancedCommentData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    followers?: number;
    verified?: boolean;
  };
  video: {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    views: number;
    likes: number;
    comments: number;
  };
  publishTime: string;
  likes: number;
  replies: number;
  status: 'pending' | 'replied' | 'skipped' | 'failed';
  priority: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative';
  replyHistory?: Array<{
    content: string;
    deviceId: string;
    timestamp: string;
    success: boolean;
  }>;
  tags?: string[];
}

export interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  usageCount: number;
}

interface EnhancedReplyTaskManagerProps {
  comments: EnhancedCommentData[];
  onlineDevices: Device[];
  onCommentUpdate: (commentId: string, status: EnhancedCommentData['status']) => void;
  onRefresh: () => void;
}

export const EnhancedReplyTaskManager: React.FC<EnhancedReplyTaskManagerProps> = ({
  comments,
  onlineDevices,
  onCommentUpdate,
  onRefresh
}) => {
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<EnhancedCommentData | null>(null);
  const [replyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [replyTemplates, setReplyTemplates] = useState<ReplyTemplate[]>([]);

  // 模拟回复模板数据
  useEffect(() => {
    setReplyTemplates([
      {
        id: 'template_1',
        name: '感谢回复',
        content: '谢谢您的分享！这个内容很有帮助。如果您对我们的产品有兴趣，欢迎了解更多。',
        category: '感谢类',
        usageCount: 25
      },
      {
        id: 'template_2',
        name: '产品介绍',
        content: '您好！看到您对这个领域很感兴趣，我们有相关的解决方案，欢迎私信了解详情。',
        category: '产品类',
        usageCount: 18
      },
      {
        id: 'template_3',
        name: '专业建议',
        content: '您提到的问题确实很重要，根据我们的经验，建议可以从这几个方面考虑...',
        category: '建议类',
        usageCount: 12
      }
    ]);
  }, []);

  // 筛选评论
  const filteredComments = comments.filter(comment => {
    if (filterStatus === 'all') return true;
    return comment.status === filterStatus;
  });

  // 统计数据
  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    replied: comments.filter(c => c.status === 'replied').length,
    high_priority: comments.filter(c => c.priority === 'high').length
  };

  // 表格列定义
  const columns: ColumnsType<EnhancedCommentData> = [
    {
      title: '评论信息',
      key: 'comment',
      width: 300,
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Avatar 
              src={record.author.avatar} 
              icon={<UserOutlined />} 
              size="small"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <Text strong className="text-sm">{record.author.name}</Text>
                {record.author.verified && (
                  <Badge status="success" />
                )}
                <Text type="secondary" className="text-xs">
                  {record.author.followers ? `${record.author.followers}粉丝` : ''}
                </Text>
              </div>
              <Paragraph 
                className="text-xs mb-1" 
                ellipsis={{ rows: 2, expandable: false }}
              >
                {record.content}
              </Paragraph>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span><HeartOutlined /> {record.likes}</span>
                <span><CommentOutlined /> {record.replies}</span>
                <span><ClockCircleOutlined /> {new Date(record.publishTime).toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.tags.map(tag => (
                <Tag key={tag} className="text-xs" color="blue">{tag}</Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: '视频信息',
      key: 'video',
      width: 250,
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {record.video.thumbnail && (
              <Image
                src={record.video.thumbnail}
                width={40}
                height={30}
                className="rounded object-cover"
                preview={false}
              />
            )}
            <div className="flex-1 min-w-0">
              <Paragraph 
                className="text-sm font-medium mb-1" 
                ellipsis={{ rows: 2 }}
              >
                {record.video.title}
              </Paragraph>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span><EyeOutlined /> {record.video.views.toLocaleString()}</span>
                <span><HeartOutlined /> {record.video.likes.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => window.open(record.video.url, '_blank')}
            className="p-0 text-xs"
          >
            打开视频
          </Button>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status, record) => {
        const statusMap = {
          pending: { color: 'processing', text: '待回复' },
          replied: { color: 'success', text: '已回复' },
          skipped: { color: 'default', text: '已跳过' },
          failed: { color: 'error', text: '失败' }
        };
        const config = statusMap[status];
        
        return (
          <div className="space-y-1">
            <Tag color={config.color}>{config.text}</Tag>
            <div className="flex items-center space-x-1">
              <Tag 
                className="text-xs" 
                color={record.priority === 'high' ? 'red' : record.priority === 'medium' ? 'orange' : 'blue'}
              >
                {record.priority === 'high' ? '高' : record.priority === 'medium' ? '中' : '低'}
              </Tag>
              <Tag 
                className="text-xs" 
                color={record.sentiment === 'positive' ? 'green' : record.sentiment === 'negative' ? 'red' : 'default'}
              >
                {record.sentiment === 'positive' ? '正面' : record.sentiment === 'negative' ? '负面' : '中性'}
              </Tag>
            </div>
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button
            type="primary"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => handleOpenReply(record)}
            disabled={record.status === 'replied'}
          >
            回复
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              onClick={() => handleSkipComment(record.id)}
            >
              跳过
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 打开回复弹框
  const handleOpenReply = (comment: EnhancedCommentData) => {
    setSelectedComment(comment);
    setReplyModalVisible(true);
    replyForm.resetFields();
  };

  // 查看详情
  const handleViewDetail = (comment: EnhancedCommentData) => {
    setSelectedComment(comment);
    setDetailDrawerVisible(true);
  };

  // 跳过评论
  const handleSkipComment = (commentId: string) => {
    onCommentUpdate(commentId, 'skipped');
    message.info('已跳过该评论');
  };

  // 应用回复模板
  const handleApplyTemplate = (template: ReplyTemplate) => {
    replyForm.setFieldValue('replyContent', template.content);
  };

  // 提交回复
  const handleSubmitReply = async (values: any) => {
    if (!selectedComment) return;

    setLoading(true);
    try {
      // 模拟回复操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCommentUpdate(selectedComment.id, 'replied');
      setReplyModalVisible(false);
      message.success('回复成功！');
      
      // 更新模板使用次数
      if (values.templateId) {
        setReplyTemplates(prev => prev.map(template => 
          template.id === values.templateId 
            ? { ...template, usageCount: template.usageCount + 1 }
            : template
        ));
      }
    } catch (error) {
      message.error('回复失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 导出任务清单
  const handleExportTasks = () => {
    const csvContent = comments.map(comment => 
      `${comment.video.title},${comment.author.name},${comment.content},${comment.status},${comment.publishTime}`
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `回复任务清单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总评论数"
              value={stats.total}
              prefix={<MessageOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待回复"
              value={stats.pending}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已回复"
              value={stats.replied}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="高优先级"
              value={stats.high_priority}
              valueStyle={{ color: '#cf1322' }}
              prefix={<EditOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 任务列表 */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageOutlined className="text-blue-500" />
              <span>回复任务清单</span>
              <Badge count={stats.pending} />
            </div>
            <Space>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all">全部</Option>
                <Option value="pending">待回复</Option>
                <Option value="replied">已回复</Option>
                <Option value="skipped">已跳过</Option>
                <Option value="failed">失败</Option>
              </Select>
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={onRefresh}
              >
                刷新
              </Button>
              <Button 
                size="small" 
                icon={<ExportOutlined />}
                onClick={handleExportTasks}
              >
                导出
              </Button>
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredComments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条评论`
          }}
          size="small"
        />
      </Card>

      {/* 回复模态框 */}
      <Modal
        title="回复评论"
        open={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedComment && (
          <div className="space-y-4">
            {/* 评论信息 */}
            <Card size="small" title="原评论">
              <div className="flex items-start space-x-3">
                <Avatar src={selectedComment.author.avatar} icon={<UserOutlined />} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Text strong>{selectedComment.author.name}</Text>
                    <Text type="secondary" className="text-sm">
                      {new Date(selectedComment.publishTime).toLocaleString()}
                    </Text>
                  </div>
                  <Paragraph>{selectedComment.content}</Paragraph>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => window.open(selectedComment.video.url, '_blank')}
                  >
                    观看视频: {selectedComment.video.title}
                  </Button>
                </div>
              </div>
            </Card>

            {/* 回复模板 */}
            <Card size="small" title="快速模板">
              <List
                size="small"
                dataSource={replyTemplates}
                renderItem={template => (
                  <List.Item
                    actions={[
                      <Button 
                        size="small"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        使用
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center space-x-2">
                          <span>{template.name}</span>
                          <Tag className="text-xs">{template.category}</Tag>
                          <Text type="secondary" className="text-xs">
                            使用 {template.usageCount} 次
                          </Text>
                        </div>
                      }
                      description={
                        <Text className="text-sm" ellipsis>
                          {template.content}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* 回复表单 */}
            <Form
              form={replyForm}
              layout="vertical"
              onFinish={handleSubmitReply}
            >
              <Form.Item
                name="replyContent"
                label="回复内容"
                rules={[{ required: true, message: '请输入回复内容' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="输入回复内容..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                name="deviceId"
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

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setReplyModalVisible(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                >
                  发送回复
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="评论详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={600}
      >
        {selectedComment && (
          <div className="space-y-4">
            <Card title="评论信息">
              <Paragraph>{selectedComment.content}</Paragraph>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Statistic title="点赞数" value={selectedComment.likes} />
                <Statistic title="回复数" value={selectedComment.replies} />
              </div>
            </Card>

            <Card title="作者信息">
              <div className="flex items-center space-x-3">
                <Avatar size={64} src={selectedComment.author.avatar} icon={<UserOutlined />} />
                <div>
                  <Title level={5}>{selectedComment.author.name}</Title>
                  <Text type="secondary">粉丝: {selectedComment.author.followers || 0}</Text>
                </div>
              </div>
            </Card>

            <Card title="视频信息">
              <div className="space-y-2">
                <Title level={5}>{selectedComment.video.title}</Title>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="播放量" value={selectedComment.video.views} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="点赞数" value={selectedComment.video.likes} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="评论数" value={selectedComment.video.comments} />
                  </Col>
                </Row>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => window.open(selectedComment.video.url, '_blank')}
                >
                  观看视频
                </Button>
              </div>
            </Card>

            {selectedComment.replyHistory && selectedComment.replyHistory.length > 0 && (
              <Card title="回复历史">
                <List
                  dataSource={selectedComment.replyHistory}
                  renderItem={reply => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div className="flex items-center space-x-2">
                            <Text>{reply.content}</Text>
                            <Tag color={reply.success ? 'green' : 'red'}>
                              {reply.success ? '成功' : '失败'}
                            </Tag>
                          </div>
                        }
                        description={
                          <Text type="secondary">
                            设备: {reply.deviceId} | 时间: {new Date(reply.timestamp).toLocaleString()}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};