/**
 * 点击参数配置组件 - 原生 Ant Design 风格
 * 从 StepEditor.tsx 中提取的点击参数配置逻辑
 */

import React from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  theme,
  Button,
  Tooltip,
} from 'antd';
import {
  AimOutlined,
  InfoCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { TapStepParameters } from '../../../types';

const { Text } = Typography;
const { Option } = Select;

export interface TapParametersProps {
  parameters: TapStepParameters;
  onParametersChange: (params: Partial<TapStepParameters>) => void;
  onOpenSelector?: () => void;
  loading?: boolean;
}

const TAP_METHOD_OPTIONS = [
  { value: 'coordinates', label: '坐标点击', description: '使用精确的X,Y坐标' },
  { value: 'element', label: '元素点击', description: '通过UI元素识别点击' },
  { value: 'text', label: '文本点击', description: '根据文本内容点击' },
] as const;

export const TapParameters: React.FC<TapParametersProps> = ({
  parameters,
  onParametersChange,
  onOpenSelector,
  loading = false
}) => {
  const { token } = theme.useToken();

  const handleMethodChange = (method: string) => {
    onParametersChange({ method });
  };

  const handleCoordinateChange = (field: 'x' | 'y', value: number | null) => {
    onParametersChange({
      coordinates: {
        ...parameters.coordinates,
        [field]: value || 0
      }
    });
  };

  const currentMethod = TAP_METHOD_OPTIONS.find(opt => opt.value === parameters.method);

  return (
    <Card 
      title={
        <Space>
          <AimOutlined />
          <span>点击参数</span>
        </Space>
      } 
      size="small"
      style={{ marginBottom: token.marginMD }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 点击方法选择 */}
        <Form.Item
          name={['parameters', 'method']}
          label="点击方法"
          required
          rules={[{ required: true, message: '请选择点击方法' }]}
        >
          <Select 
            onChange={handleMethodChange}
            placeholder="选择点击方法"
            disabled={loading}
          >
            {TAP_METHOD_OPTIONS.map(option => (
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

        {/* 当前方法信息 */}
        {currentMethod && (
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
                  {currentMethod.label}
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ fontSize: token.fontSizeSM }}
                >
                  {currentMethod.description}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* 坐标配置 */}
        {parameters.method === 'coordinates' && (
          <>
            <Text strong style={{ fontSize: token.fontSize }}>
              坐标位置
            </Text>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item 
                  name={['parameters', 'coordinates', 'x']} 
                  label="X坐标"
                  rules={[
                    { required: true, message: '请输入X坐标' },
                    { type: 'number', min: 0, max: 9999, message: '坐标值应在0-9999之间' }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={9999}
                    placeholder="像素位置"
                    onChange={(value) => handleCoordinateChange('x', value)}
                    disabled={loading}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name={['parameters', 'coordinates', 'y']} 
                  label="Y坐标"
                  rules={[
                    { required: true, message: '请输入Y坐标' },
                    { type: 'number', min: 0, max: 9999, message: '坐标值应在0-9999之间' }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={9999}
                    placeholder="像素位置"
                    onChange={(value) => handleCoordinateChange('y', value)}
                    disabled={loading}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            {onOpenSelector && (
              <Form.Item>
                <Tooltip title="打开页面分析器选择元素">
                  <Button 
                    type="dashed" 
                    icon={<EyeOutlined />}
                    onClick={onOpenSelector}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    使用页面分析器选择
                  </Button>
                </Tooltip>
              </Form.Item>
            )}
          </>
        )}

        {/* 元素选择配置 */}
        {parameters.method === 'element' && (
          <>
            <Form.Item
              name={['parameters', 'elementSelector']}
              label="元素选择器"
              rules={[{ required: true, message: '请输入元素选择器' }]}
            >
              <Input.TextArea
                placeholder="输入元素选择器表达式"
                disabled={loading}
                rows={3}
                style={{ resize: 'none' }}
              />
            </Form.Item>
            
            {onOpenSelector && (
              <Form.Item>
                <Tooltip title="打开页面分析器选择元素">
                  <Button 
                    type="dashed" 
                    icon={<EyeOutlined />}
                    onClick={onOpenSelector}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    使用页面分析器选择
                  </Button>
                </Tooltip>
              </Form.Item>
            )}
          </>
        )}

        {/* 文本点击配置 */}
        {parameters.method === 'text' && (
          <Form.Item
            name={['parameters', 'text']}
            label="目标文本"
            rules={[
              { required: true, message: '请输入目标文本' },
              { max: 100, message: '文本长度不能超过100个字符' }
            ]}
          >
            <Input
              placeholder="输入要点击的文本内容"
              disabled={loading}
              showCount
              maxLength={100}
            />
          </Form.Item>
        )}

        {/* 高级选项 */}
        <Form.Item
          name={['parameters', 'duration']}
          label="点击持续时间"
          extra="单位：毫秒，建议50-500ms"
        >
          <InputNumber
            min={10}
            max={5000}
            placeholder="持续时间(ms)"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name={['parameters', 'pressure']}
          label="点击压力"
          extra="取值范围0.0-1.0，默认为1.0"
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            placeholder="压力值"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Space>
    </Card>
  );
};