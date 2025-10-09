/**
 * 半自动任务执行抽屉组件
 */

import React, { useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Button,
  Space,
  Typography,
  Alert,
  Steps,
  Progress,
  Tag,
  Divider,
  Card,
  Row,
  Col
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../../domain/adb/entities/Device';
import type { SemiAutoTask, SemiAutoTaskCreate } from './types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

interface SemiAutoExecutionDrawerProps {
  visible: boolean;
  onClose: () => void;
  task?: SemiAutoTask | null;
  devices: Device[];
  onExecute: (taskData: SemiAutoTaskCreate, deviceId?: string) => Promise<void>;
  onPause?: (taskId: string) => Promise<void>;
  onResume?: (taskId: string) => Promise<void>;
  onStop?: (taskId: string) => Promise<void>;
}

export const SemiAutoExecutionDrawer: React.FC<SemiAutoExecutionDrawerProps> = ({
  visible,
  onClose,
  task,
  devices,
  onExecute,
  onPause,
  onResume,
  onStop
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isEditing = !!task;
  const isExecuting = task?.status === 'executing';

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const taskData: SemiAutoTaskCreate = {
        type: values.type,
        title: values.title,
        description: values.description,
        targetAccount: values.targetAccount,
        targetContent: values.targetContent,
        priority: values.priority,
        parameters: {
          targetUrl: values.targetUrl,
          replyText: values.replyText,
          commentText: values.commentText,
          followCount: values.followCount,
          delayMin: values.delayMin,
          delayMax: values.delayMax,
          checkDuplication: values.checkDuplication,
          autoSwitch: values.autoSwitch,
        }
      };

      await onExecute(taskData, values.deviceId);
      onClose();
    } catch (error) {
      console.error('提交任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (task && onPause) {
      await onPause(task.id);
    }
  };

  const handleResume = async () => {
    if (task && onResume) {
      await onResume(task.id);
    }
  };

  const handleStop = async () => {
    if (task && onStop) {
      await onStop(task.id);
    }
  };

  const getExecutionSteps = () => {
    if (!isExecuting || !task) return [];
    
    return [
      {
        title: '准备阶段',
        description: '检查设备状态和任务参数',
        status: task.progress > 0 ? 'finish' : 'process'
      },
      {
        title: '执行中',
        description: '正在执行自动化任务',
        status: task.progress > 30 ? 'finish' : task.progress > 0 ? 'process' : 'wait'
      },
      {
        title: '完成',
        description: '任务执行完成',
        status: task.progress === 100 ? 'finish' : 'wait'
      }
    ];
  };

  return (
    <Drawer
      title={isEditing ? `任务执行 - ${task.title}` : '创建新任务'}
      placement="right"
      size="large"
      onClose={onClose}
      open={visible}
      extra={
        isExecuting ? (
          <Space>
            <Button 
              icon={<PauseCircleOutlined />} 
              onClick={handlePause}
              disabled={task?.status === 'paused'}
            >
              暂停
            </Button>
            <Button 
              icon={<PlayCircleOutlined />} 
              onClick={handleResume}
              disabled={task?.status !== 'paused'}
            >
              继续
            </Button>
            <Button 
              icon={<StopOutlined />} 
              onClick={handleStop}
              danger
            >
              停止
            </Button>
          </Space>
        ) : null
      }
    >
      {isExecuting && task && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Title level={5}>执行进度</Title>
            <Progress 
              percent={task.progress} 
              status={task.status === 'failed' ? 'exception' : 'active'}
              showInfo
            />
            <div style={{ marginTop: 16 }}>
              <Steps current={currentStep} size="small">
                {getExecutionSteps().map((step, index) => (
                  <Step key={index} title={step.title} description={step.description} />
                ))}
              </Steps>
            </div>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Tag color={task.status === 'executing' ? 'processing' : 'default'}>
                  {task.status === 'executing' ? '执行中' : '已暂停'}
                </Tag>
              </Col>
              <Col span={6}>
                <Text type="secondary">设备: {task.deviceName || '未分配'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">
                  开始时间: {task.executionTime ? new Date(task.executionTime).toLocaleString() : '未开始'}
                </Text>
              </Col>
            </Row>
          </Card>
          <Divider />
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={task ? {
          type: task.type,
          title: task.title,
          description: task.description,
          targetAccount: task.targetAccount,
          targetContent: task.targetContent,
          priority: task.priority,
          ...task.parameters
        } : {
          type: 'follow',
          priority: 'medium',
          delayMin: 2,
          delayMax: 5,
          checkDuplication: true,
          autoSwitch: false
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="任务类型"
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select>
                <Option value="follow">关注</Option>
                <Option value="reply">回复</Option>
                <Option value="comment">评论</Option>
                <Option value="like">点赞</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

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
          <TextArea rows={3} placeholder="输入任务描述" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="targetAccount"
              label="目标账号"
            >
              <Input placeholder="目标账号ID或用户名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deviceId"
              label="执行设备"
            >
              <Select placeholder="选择执行设备" allowClear>
                {devices.map(device => (
                  <Option key={device.id} value={device.id}>
                    {device.name} ({device.model})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="targetUrl"
          label="目标链接"
        >
          <Input placeholder="目标页面或内容链接" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="delayMin"
              label="最小延迟(秒)"
            >
              <InputNumber min={1} max={60} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="delayMax"
              label="最大延迟(秒)"
            >
              <InputNumber min={1} max={60} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="followCount"
          label="关注数量"
          tooltip="仅在关注任务中生效"
        >
          <InputNumber min={1} max={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="replyText"
          label="回复内容"
          tooltip="仅在回复任务中生效"
        >
          <TextArea rows={3} placeholder="输入回复内容" />
        </Form.Item>

        <Form.Item
          name="commentText"
          label="评论内容"
          tooltip="仅在评论任务中生效"
        >
          <TextArea rows={3} placeholder="输入评论内容" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="checkDuplication"
              label="查重检测"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="autoSwitch"
              label="自动切换设备"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Alert
          message="任务执行提示"
          description="执行任务前请确保目标设备已连接并处于解锁状态。系统将根据设置的延迟参数自动控制执行频率。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleSubmit}
              loading={loading}
            >
              {isEditing ? '更新并执行' : '创建并执行'}
            </Button>
            <Button onClick={onClose}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};