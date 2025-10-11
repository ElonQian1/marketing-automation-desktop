// src/modules/precise-acquisition/task-engine/components/TaskGenerationModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 任务生成弹窗组件
 * 
 * 提供任务生成配置界面
 */

import React from 'react';
import { Modal, Form, Select, Row, Col, InputNumber, Space, Tag } from 'antd';
import { 
  TaskGenerationConfig,
  BatchTaskGenerationConfig 
} from '../services/TaskEngineService';
import { 
  TaskType, 
  TaskPriority,
  TaskAssignmentStrategy,
  Platform,
  WatchTarget
} from '../../shared/types/core';
import { PLATFORM_LABELS } from '../../shared/constants';

const { Option } = Select;

export interface TaskGenerationModalProps {
  visible: boolean;
  loading: boolean;
  targets: WatchTarget[];
  initialConfig: Partial<TaskGenerationConfig>;
  onOk: (values: any) => Promise<void>;
  onCancel: () => void;
}

export const TaskGenerationModal: React.FC<TaskGenerationModalProps> = ({
  visible,
  loading,
  targets,
  initialConfig,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="生成任务"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialConfig}
      >
        <Form.Item
          name="target_ids"
          label="选择目标"
          rules={[{ required: true, message: '请选择至少一个目标' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择要生成任务的目标"
            showSearch
            optionFilterProp="children"
          >
            {targets.map(target => (
              <Option key={target.id} value={target.id}>
                <Space>
                  <Tag color={target.platform === Platform.DOUYIN ? 'red' : 'orange'}>
                    {PLATFORM_LABELS[target.platform]}
                  </Tag>
                  {target.title || target.platform_id_or_url}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="task_types"
              label="任务类型"
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择要生成的任务类型"
              >
                <Option value={TaskType.FOLLOW}>关注</Option>
                <Option value={TaskType.COMMENT}>评论</Option>
                <Option value={TaskType.LIKE}>点赞</Option>
                <Option value={TaskType.SHARE}>分享</Option>
                <Option value={TaskType.VIEW}>观看</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="选择任务优先级">
                <Option value={TaskPriority.LOW}>低</Option>
                <Option value={TaskPriority.MEDIUM}>中</Option>
                <Option value={TaskPriority.HIGH}>高</Option>
                <Option value={TaskPriority.URGENT}>紧急</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_tasks_per_target"
              label="每个目标最大任务数"
            >
              <InputNumber
                min={1}
                max={100}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="schedule_delay_hours"
              label="延迟执行（小时）"
            >
              <InputNumber
                min={0}
                max={72}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="assignment_strategy"
          label="分配策略"
        >
          <Select placeholder="选择任务分配策略">
            <Option value={TaskAssignmentStrategy.ROUND_ROBIN}>轮询分配</Option>
            <Option value={TaskAssignmentStrategy.LOAD_BALANCED}>负载均衡</Option>
            <Option value={TaskAssignmentStrategy.PRIORITY_FIRST}>优先级优先</Option>
            <Option value={TaskAssignmentStrategy.DEVICE_SPECIFIC}>设备专用</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};