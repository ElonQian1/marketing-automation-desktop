import React from 'react';
import { Form, Input, Select, theme } from 'antd';
import { SmartActionType } from '../../../../../types/smartComponents';
import { SMART_ACTION_CONFIGS } from '../../../helpers/constants';
import type { FormBasicSectionProps } from '../types';

const { Option } = Select;

/**
 * 表单基础信息部分
 * 包含步骤类型、名称、描述等基础字段
 */
export const FormBasicSection: React.FC<FormBasicSectionProps> = ({ form }) => {
  const { token } = theme.useToken();

  return (
    <>
      <Form.Item
        label="步骤类型"
        name="step_type"
        rules={[{ required: true, message: '请选择步骤类型' }]}
      >
        <Select placeholder="选择操作类型" allowClear>
          {Object.entries(SMART_ACTION_CONFIGS).map(([key, config]) => (
            <Option key={key} value={key}>
              {config.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="步骤名称"
        name="name"
        rules={[{ required: true, message: '请输入步骤名称' }]}
      >
        <Input placeholder="输入步骤名称" />
      </Form.Item>

      <Form.Item
        label="步骤描述"
        name="description"
      >
        <Input.TextArea 
          placeholder="输入步骤描述（可选）"
          rows={2}
          style={{ resize: 'none' }}
        />
      </Form.Item>
    </>
  );
};