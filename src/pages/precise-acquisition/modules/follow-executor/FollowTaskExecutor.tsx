// src/pages/precise-acquisition/modules/follow-executor/FollowTaskExecutor.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 关注任务执行器
 * 支持自动关注功能和设备分配，包含查重和安全保护机制
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  Tag,
  Progress,
  Tooltip,
  Modal,
  Form,
  Select,
  InputNumber,
  Alert,
  Statistic,
  Row,
  Col,
  Badge,
  message,
  Switch,
  Divider,
  Input
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../domain/adb/entities/Device';
import { checkDuplication } from '../../../../services/automation-duplication-guard';

const { Title, Text } = Typography;
const { Option } = Select;

export interface FollowTarget {
  id: string;
  accountId: string;
  accountName: string;
  accountUrl: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  assignedDevice?: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptTime?: string;
  errorMessage?: string;
  source: string; // 来源：行业监控、账号监控等
}

export interface FollowTask {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  targets: FollowTarget[];
  assignedDevices: string[];
  settings: {
    batchSize: number; // 每批处理数量
    intervalMinutes: number; // 间隔时间（分钟）
    maxDailyFollows: number; // 每日最大关注数
    enableDeduplication: boolean; // 启用查重
    safetyInterval: number; // 安全间隔（秒）
  };
  progress: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface FollowTaskExecutorProps {
  onlineDevices: Device[];
  followTargets: FollowTarget[];
  onFollowComplete: (targetId: string, success: boolean) => void;
}

export const FollowTaskExecutor: React.FC<FollowTaskExecutorProps> = ({
  onlineDevices,
  followTargets,
  onFollowComplete
}) => {
  const [tasks, setTasks] = useState<FollowTask[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowTask | null>(null);
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // 模拟任务数据
  useEffect(() => {
    const mockTask: FollowTask = {
      id: 'task_1',
      name: '行业监控关注任务',
      status: 'idle',
      targets: followTargets.slice(0, 10),
      assignedDevices: onlineDevices.slice(0, 2).map(d => d.id),
      settings: {
        batchSize: 5,
        intervalMinutes: 30,
        maxDailyFollows: 50,
        enableDeduplication: true,
        safetyInterval: 3
      },
      progress: {
        total: followTargets.length,
        completed: 0,
        failed: 0,
        skipped: 0
      },
      createdAt: new Date().toISOString()
    };
    setTasks([mockTask]);
  }, [followTargets, onlineDevices]);

  // 任务表格列定义
  const taskColumns: ColumnsType<FollowTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <Text type="secondary" className="text-xs">
            ID: {record.id}
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => {
        const statusMap = {
          idle: { color: 'default', text: '待开始', icon: <ClockCircleOutlined /> },
          running: { color: 'processing', text: '执行中', icon: <SyncOutlined spin /> },
          paused: { color: 'warning', text: '已暂停', icon: <PauseCircleOutlined /> },
          completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
          error: { color: 'error', text: '出错', icon: <WarningOutlined /> }
        };
        const config = statusMap[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const { total, completed, failed, skipped } = record.progress;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <div className="space-y-1">
            <Progress 
              percent={percent} 
              size="small" 
              status={record.status === 'error' ? 'exception' : 'normal'}
            />
            <div className="text-xs text-gray-500">
              {completed}/{total} 完成, {failed} 失败, {skipped} 跳过
            </div>
          </div>
        );
      }
    },
    {
      title: '分配设备',
      dataIndex: 'assignedDevices',
      render: (devices) => (
        <div className="space-y-1">
          {devices.map((deviceId: string) => {
            const device = onlineDevices.find(d => d.id === deviceId);
            return (
              <Tag key={deviceId} className="text-xs">
                {device?.name || deviceId}
              </Tag>
            );
          })}
        </div>
      )
    },
    {
      title: '设置',
      key: 'settings',
      render: (_, record) => (
        <div className="text-xs space-y-1">
          <div>批量: {record.settings.batchSize}</div>
          <div>间隔: {record.settings.intervalMinutes}分钟</div>
          <div>安全: {record.settings.safetyInterval}秒</div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'idle' || record.status === 'paused' ? (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record.id)}
            >
              开始
            </Button>
          ) : record.status === 'running' ? (
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handlePauseTask(record.id)}
            >
              暂停
            </Button>
          ) : null}
          
          <Button
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleStopTask(record.id)}
            disabled={record.status === 'idle'}
          >
            停止
          </Button>
          
          <Button
            size="small"
            onClick={() => handleEditSettings(record)}
          >
            设置
          </Button>
        </Space>
      )
    }
  ];

  // 关注目标表格列定义
  const targetColumns: ColumnsType<FollowTarget> = [
    {
      title: '账号',
      key: 'account',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.accountName}</div>
          <Text type="secondary" className="text-xs">
            {record.accountId}
          </Text>
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (priority) => {
        const colorMap = {
          high: 'red',
          medium: 'orange',
          low: 'blue'
        };
        const textMap = {
          high: '高',
          medium: '中',
          low: '低'
        };
        return <Tag color={colorMap[priority]}>{textMap[priority]}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'default', text: '等待中' },
          processing: { color: 'processing', text: '处理中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' },
          skipped: { color: 'warning', text: '已跳过' }
        };
        const config = statusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '分配设备',
      dataIndex: 'assignedDevice',
      render: (deviceId) => {
        if (!deviceId) return <Text type="secondary">未分配</Text>;
        const device = onlineDevices.find(d => d.id === deviceId);
        return <Tag>{device?.name || deviceId}</Tag>;
      }
    },
    {
      title: '尝试次数',
      key: 'attempts',
      render: (_, record) => (
        <span>{record.attempts}/{record.maxAttempts}</span>
      )
    },
    {
      title: '来源',
      dataIndex: 'source'
    }
  ];

  // 启动任务（含非阻塞的查重预检）
  const handleStartTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.settings.enableDeduplication) {
        const pendingTargets = task.targets.filter(t => t.status === 'pending');
        const sampleSize = Math.min(task.settings.batchSize || 5, 10);
        const sampleTargets = pendingTargets.slice(0, sampleSize);
        const deviceForCheck = (sampleTargets[0]?.assignedDevice) || task.assignedDevices[0];

        if (deviceForCheck && sampleTargets.length > 0) {
          const results = await Promise.all(
            sampleTargets.map(async (t) => {
              try {
                const res = await checkDuplication({
                  action: 'follow',
                  target_id: t.accountId,
                  device_id: deviceForCheck,
                });
                return { target: t, res };
              } catch (e) {
                return { target: t, res: null as any };
              }
            })
          );

          const duplicates = results.filter(r => r.res && r.res.result === 'blocked');
          if (duplicates.length > 0) {
            const names = duplicates.slice(0, 3).map(d => d.target.accountName || d.target.accountId).join('、');
            const more = duplicates.length > 3 ? ` 等 ${duplicates.length} 个目标` : '';
            message.warning(`查重预检：检测到${duplicates.length}个可能重复的关注目标（如：${names}${more}）。将继续启动任务，重复目标将在执行时跳过。`);
          }
        }
      }
    } catch (err) {
      // 预检不阻断启动，仅记录提示
      console.warn('Dedup preflight failed:', err);
    }

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running', startedAt: new Date().toISOString() }
        : task
    ));
    message.success('任务已启动');
  };

  // 暂停任务
  const handlePauseTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'paused' } : task
    ));
    message.info('任务已暂停');
  };

  // 停止任务
  const handleStopTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'idle' } : task
    ));
    message.info('任务已停止');
  };

  // 编辑设置
  const handleEditSettings = (task: FollowTask) => {
    setSelectedTask(task);
    settingsForm.setFieldsValue(task.settings);
    setSettingsModalVisible(true);
  };

  // 创建新任务
  const handleCreateTask = async (values: any) => {
    const newTask: FollowTask = {
      id: `task_${Date.now()}`,
      name: values.name,
      status: 'idle',
      targets: followTargets.filter(target => 
        values.targetIds?.includes(target.id) || followTargets.length === 0
      ),
      assignedDevices: values.assignedDevices,
      settings: {
        batchSize: values.batchSize,
        intervalMinutes: values.intervalMinutes,
        maxDailyFollows: values.maxDailyFollows,
        enableDeduplication: values.enableDeduplication,
        safetyInterval: values.safetyInterval
      },
      progress: {
        total: followTargets.length,
        completed: 0,
        failed: 0,
        skipped: 0
      },
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    setCreateModalVisible(false);
    form.resetFields();
    message.success('任务创建成功');
  };

  // 保存设置
  const handleSaveSettings = async (values: any) => {
    if (!selectedTask) return;

    setTasks(prev => prev.map(task => 
      task.id === selectedTask.id 
        ? { ...task, settings: values }
        : task
    ));

    setSettingsModalVisible(false);
    setSelectedTask(null);
    message.success('设置已保存');
  };

  const runningTasks = tasks.filter(task => task.status === 'running').length;
  const totalProgress = tasks.reduce((acc, task) => acc + task.progress.completed, 0);

  return (
    <div className="space-y-6">
      {/* 任务概览 */}
      <Card title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserAddOutlined className="text-blue-500" />
            <span>关注任务执行器</span>
          </div>
          <Badge count={runningTasks} status="processing">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建任务
            </Button>
          </Badge>
        </div>
      }>
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Statistic
              title="运行中任务"
              value={runningTasks}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined spin={runningTasks > 0} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总任务数"
              value={tasks.length}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成关注"
              value={totalProgress}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="在线设备"
              value={onlineDevices.length}
              valueStyle={{ color: onlineDevices.length > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>

        <Table
          columns={taskColumns}
          dataSource={tasks}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 安全提示 */}
      <Alert
        message="安全保护机制"
        description={
          <div className="space-y-2">
            <div>• <strong>查重保护：</strong>自动检测并跳过24小时内已关注的账号</div>
            <div>• <strong>频率控制：</strong>设置关注间隔，避免操作过于频繁</div>
            <div>• <strong>设备轮换：</strong>多设备分配，分散操作风险</div>
            <div>• <strong>错误重试：</strong>失败后自动重试，最多3次</div>
          </div>
        }
        type="info"
        icon={<SafetyCertificateOutlined />}
        showIcon
      />

      {/* 创建任务模态框 */}
      <Modal
        title="创建关注任务"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
          initialValues={{
            batchSize: 5,
            intervalMinutes: 30,
            maxDailyFollows: 50,
            enableDeduplication: true,
            safetyInterval: 3
          }}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="输入任务名称" />
          </Form.Item>

          <Form.Item
            name="assignedDevices"
            label="分配设备"
            rules={[{ required: true, message: '请选择执行设备' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择执行设备"
              disabled={onlineDevices.length === 0}
            >
              {onlineDevices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name || device.id} ({device.model})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>执行设置</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="batchSize"
                label="批量大小"
                tooltip="每批次处理的关注数量"
              >
                <InputNumber min={1} max={20} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="intervalMinutes"
                label="间隔时间（分钟）"
                tooltip="每批次之间的等待时间"
              >
                <InputNumber min={1} max={120} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="maxDailyFollows"
                label="每日最大关注数"
                tooltip="单个设备每日最多关注数量"
              >
                <InputNumber min={10} max={200} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="safetyInterval"
                label="安全间隔（秒）"
                tooltip="每次关注操作之间的间隔"
              >
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="enableDeduplication" valuePropName="checked">
            <Switch />
            <span className="ml-2">启用查重保护</span>
            <Tooltip title="自动检测并跳过已关注的账号">
              <InfoCircleOutlined className="ml-1 text-gray-400" />
            </Tooltip>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => {
              setCreateModalVisible(false);
              form.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建任务
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 设置模态框 */}
      <Modal
        title="任务设置"
        open={settingsModalVisible}
        onCancel={() => {
          setSettingsModalVisible(false);
          setSelectedTask(null);
        }}
        footer={null}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleSaveSettings}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="batchSize" label="批量大小">
                <InputNumber min={1} max={20} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="intervalMinutes" label="间隔时间（分钟）">
                <InputNumber min={1} max={120} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="maxDailyFollows" label="每日最大关注数">
                <InputNumber min={10} max={200} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="safetyInterval" label="安全间隔（秒）">
                <InputNumber min={1} max={10} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="enableDeduplication" valuePropName="checked">
            <Switch />
            <span className="ml-2">启用查重保护</span>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => {
              setSettingsModalVisible(false);
              setSelectedTask(null);
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};