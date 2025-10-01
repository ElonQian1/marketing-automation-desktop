/**
 * 关注任务执行器
 * 专门处理关注任务的独立执行
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Tooltip,
  Badge,
  Progress,
  Avatar
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import {
  UserAddOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../domain/adb/entities/Device';
import { monitoringService } from '../../services/monitoringService';
import type { CommentData } from '../../services/monitoringService';

const { Title, Text } = Typography;
const { Option } = Select;

interface FollowTaskExecutorProps {
  comments: CommentData[];
  onlineDevices: Device[];
  onRefresh: () => void;
}

// 关注任务接口
interface FollowTask {
  id: string;
  targetUserId: string;
  targetUserName: string;
  sourceComment: CommentData;
  assignedDevice?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: string;
  executedAt?: string;
  error?: string;
}

export const FollowTaskExecutor: React.FC<FollowTaskExecutorProps> = ({
  comments,
  onlineDevices,
  onRefresh
}) => {
  const [followTasks, setFollowTasks] = useState<FollowTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Key[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 生成关注任务
  const generateFollowTasks = useCallback(() => {
    const pendingComments = comments.filter(comment => comment.status === 'pending');
    
    const tasks: FollowTask[] = pendingComments.map(comment => ({
      id: `follow_${comment.id}`,
      targetUserId: comment.authorId,
      targetUserName: comment.authorName,
      sourceComment: comment,
      status: 'pending',
      createdAt: new Date().toISOString()
    }));

    setFollowTasks(tasks);
    message.success(`生成了 ${tasks.length} 个关注任务`);
  }, [comments]);

  // 执行单个关注任务
  const executeFollowTask = useCallback(async (taskId: string, deviceId: string) => {
    const task = followTasks.find(t => t.id === taskId);
    if (!task) return;

    // 检查查重
    try {
      const isDuplicate = await monitoringService.checkDuplication(
        'follow',
        task.targetUserId,
        deviceId
      );

      if (isDuplicate) {
        message.warning(`用户 ${task.targetUserName} 在24小时内已被此设备关注过`);
        return;
      }
    } catch (error) {
      console.error('查重检查失败:', error);
    }

    // 更新任务状态为执行中
    setFollowTasks(prev => prev.map(t => 
      t.id === taskId ? { 
        ...t, 
        status: 'executing', 
        assignedDevice: deviceId 
      } : t
    ));

    try {
      // 模拟关注操作延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功
      setFollowTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'completed',
          executedAt: new Date().toISOString()
        } : t
      ));

      // 更新原评论状态
      await monitoringService.updateCommentStatus(
        task.sourceComment.id, 
        'followed',
        deviceId
      );

      message.success(`成功关注用户 ${task.targetUserName}`);
      onRefresh();
      
    } catch (error) {
      setFollowTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'failed',
          error: '关注失败'
        } : t
      ));
      message.error(`关注 ${task.targetUserName} 失败`);
    }
  }, [followTasks, onRefresh]);

  // 批量执行关注任务
  const executeBatchFollow = useCallback(async (values: any) => {
    if (selectedTasks.length === 0) {
      message.warning('请选择要执行的关注任务');
      return;
    }

    setLoading(true);
    setBatchModalVisible(false);

    try {
      for (const taskId of selectedTasks) {
        await executeFollowTask(taskId as string, values.batchDevice);
        // 添加间隔避免过快执行
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setSelectedTasks([]);
      message.success('批量关注任务执行完成');
      
    } catch (error) {
      message.error('批量执行失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTasks, executeFollowTask]);

  // 获取设备名称
  const getDeviceName = (deviceId?: string): string => {
    if (!deviceId) return '未分配';
    const device = onlineDevices.find(d => d.id === deviceId);
    return device ? (device.name || device.id) : deviceId;
  };

  // 渲染状态标签
  const renderStatusTag = (status: FollowTask['status']) => {
    const statusConfig = {
      pending: { color: 'blue', icon: <SettingOutlined />, text: '待执行' },
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

  // 表格列配置
  const columns: ColumnsType<FollowTask> = [
    {
      title: '目标用户',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Avatar size="small" icon={<UserAddOutlined />} />
          <div>
            <Text strong>{record.targetUserName}</Text>
            <div className="text-xs text-gray-500">@{record.targetUserId}</div>
          </div>
        </div>
      )
    },
    {
      title: '来源评论',
      key: 'source',
      ellipsis: true,
      render: (_, record) => (
        <div className="space-y-1">
          <Tooltip title={record.sourceComment.videoTitle}>
            <Text className="text-sm text-blue-600 cursor-pointer">
              {record.sourceComment.videoTitle}
            </Text>
          </Tooltip>
          <div className="text-xs text-gray-500 truncate">
            {record.sourceComment.content}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag
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
            <Select
              placeholder="选择设备"
              style={{ width: 120 }}
              size="small"
              onChange={(deviceId) => executeFollowTask(record.id, deviceId)}
              disabled={onlineDevices.length === 0}
            >
              {onlineDevices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name || device.id}
                </Option>
              ))}
            </Select>
          )}
          
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(record.sourceComment.videoUrl, '_blank')}
          >
            查看视频
          </Button>
        </Space>
      )
    }
  ];

  // 统计数据
  const stats = {
    total: followTasks.length,
    pending: followTasks.filter(t => t.status === 'pending').length,
    executing: followTasks.filter(t => t.status === 'executing').length,
    completed: followTasks.filter(t => t.status === 'completed').length,
    failed: followTasks.filter(t => t.status === 'failed').length
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <UserAddOutlined className="text-blue-500" />
            <Title level={4} className="m-0">关注任务执行器</Title>
            <Badge count={stats.pending} showZero />
          </div>

          <Space>
            <Button
              type="primary"
              onClick={generateFollowTasks}
              disabled={comments.filter(c => c.status === 'pending').length === 0}
            >
              生成关注任务
            </Button>
            
            {selectedTasks.length > 0 && (
              <Button
                type="primary"
                onClick={() => setBatchModalVisible(true)}
                loading={loading}
              >
                批量执行 ({selectedTasks.length})
              </Button>
            )}
          </Space>
        </div>

        {/* 进度统计 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-600">总任务</div>
          </div>
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
        </div>

        {/* 执行进度 */}
        {stats.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Text>执行进度</Text>
              <Text>{Math.round((stats.completed + stats.failed) / stats.total * 100)}%</Text>
            </div>
            <Progress 
              percent={Math.round((stats.completed + stats.failed) / stats.total * 100)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        )}

        {/* 任务列表 */}
        <Table
          columns={columns}
          dataSource={followTasks}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys: selectedTasks,
            onChange: setSelectedTasks,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'pending'
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

        {followTasks.length === 0 && (
          <div className="text-center py-8">
            <Text type="secondary">
              暂无关注任务，请先点击"生成关注任务"按钮
            </Text>
          </div>
        )}
      </Card>

      {/* 批量执行弹框 */}
      <Modal
        title="批量执行关注任务"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={executeBatchFollow}
        >
          <Form.Item
            name="batchDevice"
            label="执行设备"
            rules={[{ required: true, message: '请选择执行设备' }]}
          >
            <Select placeholder="选择用于批量关注的设备">
              {onlineDevices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name || device.id} ({device.model})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="text-center text-sm text-gray-600 mb-4">
            将执行 {selectedTasks.length} 个关注任务
          </div>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setBatchModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              开始执行
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};