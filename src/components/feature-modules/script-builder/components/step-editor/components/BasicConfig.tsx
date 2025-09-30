/**
 * 步骤基础配置组件 - 原生 Ant Design 风格
 * 从 StepEditor.tsx 中提取的基础配置逻辑
 */

import React from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  theme,
  Switch,
} from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { StepType } from '../../../types';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export interface BasicConfigProps {
  stepType: StepType;
  onTypeChange: (type: StepType) => void;
  form: any;
  loading?: boolean;
}

const STEP_TYPE_OPTIONS = [
  { value: 'tap', label: '点击操作', description: '点击UI元素或坐标位置' },
  { value: 'input', label: '输入文本', description: '在输入框中输入文本' },
  { value: 'swipe', label: '滑动操作', description: '执行滑动手势' },
  { value: 'wait', label: '等待延时', description: '等待指定时间' },
  { value: 'loop', label: '循环执行', description: '重复执行子步骤' },
  { value: 'conditional', label: '条件判断', description: '根据条件执行不同分支' },
  { value: 'screenshot', label: '截屏保存', description: '截取当前屏幕' },
  { value: 'back', label: '返回操作', description: '模拟返回键' },
  { value: 'home', label: '主页操作', description: '返回桌面' },
  { value: 'app_switch', label: '应用切换', description: '切换到指定应用' },
] as const;

export const BasicConfig: React.FC<BasicConfigProps> = ({
  stepType,
  onTypeChange,
  form,
  loading = false
}) => {
  const { token } = theme.useToken();

  const currentTypeOption = STEP_TYPE_OPTIONS.find(opt => opt.value === stepType);

  return (
    <Card 
      title={
        <Space>
          <SettingOutlined />
          <span>基础配置</span>
        </Space>
      } 
      size="small"
      style={{ marginBottom: token.marginMD }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 步骤类型选择 */}
        <Form.Item
          name="type"
          label="步骤类型"
          required
          rules={[{ required: true, message: '请选择步骤类型' }]}
        >
          <Select 
            onChange={onTypeChange}
            placeholder="选择步骤类型"
            disabled={loading}
            size="middle"
          >
            {STEP_TYPE_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <div>
                  <Text strong style={{ fontSize: token.fontSize }}>
                    {option.label}
                  </Text>
                  <br />
                  <Text 
                    type="secondary" 
                    style={{ fontSize: token.fontSizeSM }}
                  >
                    {option.description}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 当前选择的类型信息 */}
        {currentTypeOption && (
          <div 
            style={{ 
              padding: token.paddingXS,
              backgroundColor: token.colorBgLayout,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorder}`,
            }}
          >
            <Space>
              <InfoCircleOutlined style={{ color: token.colorInfo }} />
              <div>
                <Text strong style={{ fontSize: token.fontSizeSM }}>
                  {currentTypeOption.label}
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ fontSize: token.fontSizeSM }}
                >
                  {currentTypeOption.description}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* 步骤名称 */}
        <Form.Item
          name="name"
          label="步骤名称"
          rules={[
            { required: true, message: '请输入步骤名称' },
            { max: 50, message: '步骤名称不能超过50个字符' }
          ]}
        >
          <Input 
            placeholder="输入步骤名称"
            disabled={loading}
            showCount
            maxLength={50}
          />
        </Form.Item>

        {/* 步骤描述 */}
        <Form.Item
          name="description"
          label="步骤描述"
          rules={[
            { max: 200, message: '描述不能超过200个字符' }
          ]}
        >
          <TextArea
            placeholder="描述步骤的详细功能（可选）"
            disabled={loading}
            showCount
            maxLength={200}
            rows={3}
            style={{ resize: 'none' }}
          />
        </Form.Item>

        {/* 启用状态 */}
        <Form.Item
          name="enabled"
          label="启用状态"
          valuePropName="checked"
          extra="禁用的步骤在执行时会被跳过"
        >
          <Switch 
            disabled={loading}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </Form.Item>
      </Space>
    </Card>
  );
};