import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Select, 
  Checkbox, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Tooltip,
  Form,
  Row,
  Col,
  Alert 
} from 'antd';
import { 
  ThunderboltOutlined, 
  SearchOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import type { 
  MatchStrategy, 
  MatchCriteria, 
  UIElement 
} from '../types';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * 匹配策略选择器组件Props
 */
export interface MatchStrategySelectorProps {
  /** 当前匹配条件 */
  matchCriteria: MatchCriteria | null;
  /** 参考元素（用于自动填充字段值） */
  referenceElement?: UIElement | null;
  /** 匹配条件变化回调 */
  onChange: (criteria: MatchCriteria) => void;
  /** 测试匹配回调 */
  onTestMatch?: (criteria: MatchCriteria) => void;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 可用的匹配字段
 */
const AVAILABLE_FIELDS = [
  { key: 'text', label: '文本内容', type: 'text' },
  { key: 'resourceId', label: '资源ID', type: 'text' },
  { key: 'contentDesc', label: '内容描述', type: 'text' },
  { key: 'className', label: '类名', type: 'text' },
  { key: 'type', label: '元素类型', type: 'text' },
  { key: 'package', label: '包名', type: 'text' },
  { key: 'bounds', label: '位置边界', type: 'bounds' },
  { key: 'index', label: '索引', type: 'number' },
];

/**
 * 匹配策略选项
 */
const STRATEGY_OPTIONS = [
  {
    value: 'xpath-direct' as const,
    label: 'XPath直接索引',
    description: '最快匹配速度，直接通过路径定位元素',
    icon: <ThunderboltOutlined />,
    color: 'gold',
  },
  {
    value: 'standard' as const,
    label: '标准匹配',
    description: '跨设备稳定，仅使用语义字段，忽略位置差异',
    icon: <CheckCircleOutlined />,
    color: 'green',
  },
  {
    value: 'strict' as const,
    label: '严格匹配',
    description: '精确匹配所有选中字段',
    icon: <ThunderboltOutlined />,
    color: 'blue',
  },
  {
    value: 'relaxed' as const,
    label: '宽松匹配',
    description: '部分字段匹配即可',
    icon: <SearchOutlined />,
    color: 'orange',
  },
  {
    value: 'positionless' as const,
    label: '无位置匹配',
    description: '忽略所有位置相关字段',
    icon: <SettingOutlined />,
    color: 'purple',
  },
  {
    value: 'absolute' as const,
    label: '绝对匹配',
    description: '包含位置信息的精确匹配',
    icon: <ExclamationCircleOutlined />,
    color: 'red',
  },
  {
    value: 'custom' as const,
    label: '自定义策略',
    description: '完全自定义字段和条件',
    icon: <SettingOutlined />,
    color: 'default',
  },
];

/**
 * 页面分析器 - 匹配策略选择器组件
 * 提供匹配策略选择、字段配置、条件设置功能
 * 文件大小: ~280行
 */
export const MatchStrategySelector: React.FC<MatchStrategySelectorProps> = ({
  matchCriteria,
  referenceElement,
  onChange,
  onTestMatch,
  compact = false,
  className,
}) => {
  const [form] = Form.useForm();
  const [selectedFields, setSelectedFields] = useState<string[]>(
    matchCriteria?.fields || []
  );

  // 从参考元素自动填充字段值
  const autoFillFromReference = useCallback(() => {
    if (!referenceElement) return;

    const values: Record<string, string> = {};
    const availableFields: string[] = [];

    AVAILABLE_FIELDS.forEach(field => {
      const value = (referenceElement as any)[field.key];
      if (value !== null && value !== undefined && value !== '') {
        if (field.type === 'bounds') {
          values[field.key] = `[${value.left},${value.top},${value.right},${value.bottom}]`;
        } else {
          values[field.key] = String(value);
        }
        availableFields.push(field.key);
      }
    });

    setSelectedFields(availableFields);
    form.setFieldsValue({
      fields: availableFields,
      ...Object.fromEntries(
        availableFields.map(field => [`value_${field}`, values[field]])
      ),
    });

    // 自动选择合适的策略
    const hasPosition = availableFields.includes('bounds');
    const hasResourceId = availableFields.includes('resourceId');
    const strategy: MatchStrategy = hasResourceId ? 'standard' : hasPosition ? 'absolute' : 'strict';

    form.setFieldValue('strategy', strategy);
  }, [referenceElement, form]);

  // 处理策略变化
  const handleStrategyChange = (strategy: MatchStrategy) => {
    form.setFieldValue('strategy', strategy);
    
    // 根据策略自动调整字段选择
    let recommendedFields: string[] = [];
    
    switch (strategy) {
      case 'standard':
        recommendedFields = ['resourceId', 'text', 'contentDesc', 'type'];
        break;
      case 'strict':
        recommendedFields = ['resourceId', 'text', 'contentDesc', 'className', 'type'];
        break;
      case 'relaxed':
        recommendedFields = ['text', 'resourceId'];
        break;
      case 'positionless':
        recommendedFields = ['resourceId', 'text', 'contentDesc', 'type', 'package'];
        break;
      case 'absolute':
        recommendedFields = ['resourceId', 'text', 'bounds', 'index'];
        break;
      case 'custom':
        // 保持当前选择
        recommendedFields = selectedFields;
        break;
    }

    // 过滤掉没有值的字段
    if (referenceElement) {
      recommendedFields = recommendedFields.filter(field => {
        const value = (referenceElement as any)[field];
        return value !== null && value !== undefined && value !== '';
      });
    }

    setSelectedFields(recommendedFields);
    form.setFieldValue('fields', recommendedFields);
  };

  // 处理字段选择变化
  const handleFieldsChange = (fields: string[]) => {
    setSelectedFields(fields);
  };

  // 提交匹配条件
  const handleSubmit = (values: any) => {
    const { strategy, fields } = values;
    const fieldValues: Record<string, string> = {};
    const includes: Record<string, string[]> = {};
    const excludes: Record<string, string[]> = {};

    fields.forEach((field: string) => {
      const value = values[`value_${field}`];
      const includeValue = values[`include_${field}`];
      const excludeValue = values[`exclude_${field}`];

      if (value) {
        fieldValues[field] = value;
      }
      if (includeValue) {
        includes[field] = includeValue.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (excludeValue) {
        excludes[field] = excludeValue.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    });

    const criteria: MatchCriteria = {
      strategy,
      fields,
      values: fieldValues,
      includes: Object.keys(includes).length > 0 ? includes : undefined,
      excludes: Object.keys(excludes).length > 0 ? excludes : undefined,
    };

    onChange(criteria);
  };

  // 测试匹配
  const handleTestMatch = () => {
    form.validateFields().then(values => {
      const criteria: MatchCriteria = {
        strategy: values.strategy,
        fields: values.fields,
        values: Object.fromEntries(
          values.fields.map((field: string) => [field, values[`value_${field}`] || ''])
        ),
      };
      onTestMatch?.(criteria);
    });
  };

  const currentStrategy = STRATEGY_OPTIONS.find(opt => opt.value === form.getFieldValue('strategy'));

  return (
    <Card 
      className={className}
      size="small"
      title={
        <Space>
          <Text strong>匹配策略</Text>
          {currentStrategy && (
            <Tag color={currentStrategy.color} icon={currentStrategy.icon}>
              {currentStrategy.label}
            </Tag>
          )}
        </Space>
      }
      extra={
        referenceElement && (
          <Tooltip title="从选中元素自动填充">
            <Button
              type="text"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={autoFillFromReference}
            >
              自动填充
            </Button>
          </Tooltip>
        )
      }
    >
      <Form
        form={form}
        layout="vertical"
        size={compact ? 'small' : 'middle'}
        initialValues={{
          strategy: matchCriteria?.strategy || 'standard',
          fields: matchCriteria?.fields || [],
        }}
        onFinish={handleSubmit}
      >
        {/* 策略选择 */}
        <Form.Item 
          name="strategy" 
          label="匹配策略"
          tooltip="选择适合的匹配策略，影响匹配精确度和跨设备兼容性"
        >
          <Select 
            placeholder="选择匹配策略"
            onChange={handleStrategyChange}
          >
            {STRATEGY_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <Space>
                  {option.icon}
                  <div>
                    <div>{option.label}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {option.description}
                    </Text>
                  </div>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 字段选择 */}
        <Form.Item 
          name="fields" 
          label="匹配字段"
          tooltip="选择用于匹配的元素字段"
        >
          <Checkbox.Group 
            options={AVAILABLE_FIELDS.map(field => ({
              label: field.label,
              value: field.key,
            }))}
            onChange={handleFieldsChange}
          />
        </Form.Item>

        {/* 字段值配置 */}
        {selectedFields.length > 0 && (
          <div>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>字段值配置</Text>
            {selectedFields.map(field => {
              const fieldConfig = AVAILABLE_FIELDS.find(f => f.key === field);
              return (
                <Row key={field} gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={6}>
                    <Text style={{ lineHeight: '32px' }}>{fieldConfig?.label}</Text>
                  </Col>
                  <Col span={18}>
                    <Form.Item 
                      name={`value_${field}`}
                      style={{ marginBottom: 0 }}
                    >
                      <Input 
                        placeholder={`输入${fieldConfig?.label}值`}
                        size="small"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              );
            })}
          </div>
        )}

        {/* 操作按钮 */}
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" size="small">
            应用策略
          </Button>
          {onTestMatch && (
            <Button size="small" onClick={handleTestMatch}>
              测试匹配
            </Button>
          )}
        </Space>
      </Form>

      {/* 策略说明 */}
      {currentStrategy && (
        <Alert
          type="info"
          message={currentStrategy.description}
          showIcon
          style={{ marginTop: 12, fontSize: '12px' }}
        />
      )}
    </Card>
  );
};