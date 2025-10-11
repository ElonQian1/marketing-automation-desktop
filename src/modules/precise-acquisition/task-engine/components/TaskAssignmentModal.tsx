// src/modules/precise-acquisition/task-engine/components/TaskAssignmentModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 任务分配弹窗组件
 * 
 * 提供任务分配到设备的配置界面
 */

import React from 'react';
import { Modal, Form, Select, Row, Col, InputNumber, Space, Badge } from 'antd';
import { TaskType } from '../../shared/types/core';

const { Option } = Select;

export interface TaskAssignmentModalProps {
  visible: boolean;
  loading: boolean;
  availableDevices: Array<{ id: string; name: string; online: boolean }>;
  onOk: (values: any) => Promise<void>;
  onCancel: () => void;
}

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
  visible,
  loading,
  availableDevices,
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
      title="分配任务"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="device_id"
          label="选择设备"
          rules={[{ required: true, message: '请选择设备' }]}
        >
          <Select placeholder="选择要分配任务的设备">
            {availableDevices
              .filter(device => device.online)
              .map(device => (
                <Option key={device.id} value={device.id}>
                  <Space>
                    <Badge status="success" />
                    {device.name}
                  </Space>
                </Option>
              ))
            }
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_tasks"
              label="最大任务数"
              initialValue={10}
            >
              <InputNumber
                min={1}
                max={50}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="task_types"
              label="任务类型"
            >
              <Select
                mode="multiple"
                placeholder="选择任务类型（空为全部）"
              >
                <Option value={TaskType.FOLLOW}>关注</Option>
                <Option value={TaskType.COMMENT}>评论</Option>
                <Option value={TaskType.LIKE}>点赞</Option>
                <Option value={TaskType.SHARE}>分享</Option>
                <Option value={TaskType.VIEW}>观看</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};