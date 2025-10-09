/**
 * 回复任务管理组件
 * 显示待回复的评论列表，支持回复操作和任务管理
 */

import React, { useState } from 'react';
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
  Badge
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  MessageOutlined,
  SendOutlined,
  EyeOutlined,
  LinkOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HeartOutlined
} from '@ant-design/icons';
import type { CommentData, ReplyTask } from '../../../services/monitoringService';
import type { Device } from '../../../../domain/adb/entities/Device';
import { monitoringService } from '../../../services/monitoringService';
import { checkDuplication, recordDuplicationAction } from '../../../../../services/duplicationGuard';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ReplyTaskManagerProps {
  comments: CommentData[];
  onlineDevices: Device[];
  onCommentUpdate: (commentId: string, status: CommentData['status']) => void;
  onRefresh: () => void;
}

export const ReplyTaskManager: React.FC<ReplyTaskManagerProps> = ({
  comments,
  onlineDevices,
  onCommentUpdate,
  onRefresh
}) => {
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);
  const [replyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 筛选待处理的评论
  const pendingComments = comments.filter(comment => comment.status === 'pending');

  // 打开回复弹框
  const handleOpenReply = (comment: CommentData) => {
    setSelectedComment(comment);
    setReplyModalVisible(true);
    replyForm.resetFields();
  };

  // 打开视频链接
  const handleOpenVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  // 提交回复
  const handleSubmitReply = async (values: any) => {
    if (!selectedComment) return;

    setLoading(true);
    try {
      // 检查查重
      const dup = await checkDuplication({
        action: 'reply',
        target_id: selectedComment.id,
        device_id: values.deviceId,
      });
      const isDuplicate = dup.result === 'blocked';

      if (isDuplicate) {
        message.warning('检测到重复操作，根据查重规则无法执行此次回复');
        return;
      }

      // 创建回复任务
      await monitoringService.createReplyTask(
        selectedComment.id,
        values.replyContent,
        values.deviceId
      );

      // 模拟执行回复（实际应用中这里会调用真实的设备操作）
      setTimeout(async () => {
        try {
          // 模拟成功回复
          await monitoringService.completeReplyTask(
            `reply_${Date.now()}`,
            true
          );
          // 记录一次成功的回复行为，便于后续查重参考
          await recordDuplicationAction({
            action: 'reply',
            target_id: selectedComment.id,
            device_id: values.deviceId,
          });
          
          onCommentUpdate(selectedComment.id, 'replied');
          message.success('回复成功！');
          onRefresh();
        } catch (error) {
          message.error('回复失败，请重试');
        }
      }, 2000);

      setReplyModalVisible(false);
      message.loading('正在发送回复...', 2);
      
    } catch (error: any) {
      message.error(error.message || '回复失败');
    } finally {
      setLoading(false);
    }
  };

  // 忽略评论
  const handleIgnoreComment = (commentId: string) => {
    onCommentUpdate(commentId, 'ignored');
    message.info('已忽略该评论');
  };

  // 关注用户
  const handleFollowUser = async (comment: CommentData) => {
    if (onlineDevices.length === 0) {
      message.warning('没有可用设备');
      return;
    }

    const deviceId = onlineDevices[0].id;
    
    try {
      // 检查查重
      const dup = await checkDuplication({
        action: 'follow',
        target_id: comment.authorId,
        device_id: deviceId,
      });
      const isDuplicate = dup.result === 'blocked';

      if (isDuplicate) {
        message.warning('检测到重复操作，根据查重规则无法执行关注');
        return;
      }

      // 模拟关注操作
      onCommentUpdate(comment.id, 'followed');
      // 记录一次关注行为
      await recordDuplicationAction({
        action: 'follow',
        target_id: comment.authorId,
        device_id: deviceId,
      });
      message.success(`已关注用户 ${comment.authorName}`);
      
    } catch (error) {
      message.error('关注失败');
    }
  };

  // 获取设备名称
  const getDeviceName = (deviceId: string): string => {
    const device = onlineDevices.find(d => d.id === deviceId);
    return device ? (device.name || device.id) : deviceId;
  };

  // 表格列配置
  const columns: ColumnsType<CommentData> = [
    {
      title: '视频信息',
      key: 'video',
      width: 200,
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleOpenVideo(record.videoUrl)}
              className="p-0 h-auto"
            >
              {record.videoTitle}
            </Button>
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-2">
            <EyeOutlined />
            <span>视频ID: {record.videoId}</span>
          </div>
        </div>
      )
    },
    {
      title: '评论信息',
      key: 'comment',
      width: 300,
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Avatar size="small" icon={<UserOutlined />} />
            <Text strong>{record.authorName}</Text>
            <Text type="secondary" className="text-xs">
              @{record.authorId}
            </Text>
          </div>
          <Paragraph
            className="mb-0 text-sm"
            ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
          >
            {record.content}
          </Paragraph>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <ClockCircleOutlined />
              <span>{new Date(record.publishTime).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <HeartOutlined />
              <span>{record.likes}</span>
            </span>
            {record.region && (
              <Tag>{record.region}</Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => handleOpenReply(record)}
              disabled={onlineDevices.length === 0}
            >
              回复
            </Button>
            <Button
              size="small"
              icon={<UserOutlined />}
              onClick={() => handleFollowUser(record)}
              disabled={onlineDevices.length === 0}
            >
              关注
            </Button>
          </Space>
          <Button
            type="text"
            size="small"
            onClick={() => handleIgnoreComment(record.id)}
            className="text-gray-500"
          >
            忽略
          </Button>
        </Space>
      )
    }
  ];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageOutlined className="text-blue-500" />
            <Title level={4} className="m-0">回复任务清单</Title>
            <Badge count={pendingComments.length} showZero />
          </div>
          <Button onClick={onRefresh} size="small">
            刷新
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={pendingComments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 800 }}
          size="small"
        />

        {pendingComments.length === 0 && (
          <div className="text-center py-8">
            <Text type="secondary">暂无待处理的回复任务</Text>
          </div>
        )}
      </Card>

      {/* 回复弹框 */}
      <Modal
        title="发送回复"
        open={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedComment && (
          <div className="space-y-4">
            {/* 原评论显示 */}
            <Card size="small" className="bg-gray-50">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text strong>{selectedComment.authorName}</Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() => handleOpenVideo(selectedComment.videoUrl)}
                    className="p-0 h-auto"
                  >
                    查看视频
                  </Button>
                </div>
                <Text>{selectedComment.content}</Text>
              </div>
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
                rules={[
                  { required: true, message: '请输入回复内容' },
                  { min: 5, message: '回复内容至少5个字符' },
                  { max: 500, message: '回复内容不能超过500个字符' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="输入回复内容，建议真诚友好，突出产品优势..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                name="deviceId"
                label="回复设备"
                rules={[{ required: true, message: '请选择回复设备' }]}
              >
                <Select placeholder="选择用于回复的设备">
                  {onlineDevices.map(device => (
                    <Option key={device.id} value={device.id}>
                      {getDeviceName(device.id)} ({device.model})
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
    </>
  );
};