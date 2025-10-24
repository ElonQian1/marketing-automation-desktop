// src/components/contextual-selector/ContextualSelectorConfig.tsx
// module: contextual-selector | layer: ui | role: 多元素智能选择配置界面
// summary: 为用户提供直观的多元素选择策略配置界面

import React, { useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Switch, Button, Space, Tooltip, Alert, Tag } from 'antd';
import { InfoCircleOutlined, BulbOutlined, TargetOutlined } from '@ant-design/icons';
import './ContextualSelectorConfig.css';

const { Option } = Select;
const { TextArea } = Input;

export interface ContextualSelectorConfig {
  target_text: string;
  context_keywords: string[];
  selection_mode: SelectionMode;
  context_search_radius: number;
  min_confidence_threshold: number;
}

export type SelectionMode = 
  | 'BestContextMatch'
  | { IndexBased: number }
  | { PositionBased: 'First' | 'Last' | 'Middle' | 'Random' }
  | 'SmartRecommended';

interface Props {
  value?: ContextualSelectorConfig;
  onChange?: (config: ContextualSelectorConfig) => void;
  onPreview?: (config: ContextualSelectorConfig) => void;
  className?: string;
}

const defaultConfig: ContextualSelectorConfig = {
  target_text: '关注',
  context_keywords: [],
  selection_mode: 'SmartRecommended',
  context_search_radius: 300,
  min_confidence_threshold: 0.6,
};

const ContextualSelectorConfigComponent: React.FC<Props> = ({
  value = defaultConfig,
  onChange,
  onPreview,
  className = '',
}) => {
  const [form] = Form.useForm();
  const [selectionModeType, setSelectionModeType] = useState<string>(() => {
    if (value.selection_mode === 'BestContextMatch') return 'context';
    if (value.selection_mode === 'SmartRecommended') return 'smart';
    if (typeof value.selection_mode === 'object') {
      if ('IndexBased' in value.selection_mode) return 'index';
      if ('PositionBased' in value.selection_mode) return 'position';
    }
    return 'smart';
  });

  const handleFormChange = () => {
    const formValues = form.getFieldsValue();
    const newConfig: ContextualSelectorConfig = {
      target_text: formValues.target_text || '',
      context_keywords: formValues.context_keywords ? 
        formValues.context_keywords.split('\n').filter((k: string) => k.trim()) : [],
      selection_mode: getSelectionModeFromForm(formValues),
      context_search_radius: formValues.context_search_radius || 300,
      min_confidence_threshold: formValues.min_confidence_threshold || 0.6,
    };
    
    onChange?.(newConfig);
  };

  const getSelectionModeFromForm = (formValues: any): SelectionMode => {
    switch (selectionModeType) {
      case 'context':
        return 'BestContextMatch';
      case 'index':
        return { IndexBased: formValues.index_value || 0 };
      case 'position':
        return { PositionBased: formValues.position_value || 'First' };
      default:
        return 'SmartRecommended';
    }
  };

  const getInitialFormValues = () => {
    const base = {
      target_text: value.target_text,
      context_keywords: value.context_keywords.join('\n'),
      context_search_radius: value.context_search_radius,
      min_confidence_threshold: value.min_confidence_threshold,
    };

    if (typeof value.selection_mode === 'object') {
      if ('IndexBased' in value.selection_mode) {
        return { ...base, index_value: value.selection_mode.IndexBased };
      }
      if ('PositionBased' in value.selection_mode) {
        return { ...base, position_value: value.selection_mode.PositionBased };
      }
    }

    return base;
  };

  const renderSelectionModeConfig = () => {
    switch (selectionModeType) {
      case 'context':
        return (
          <Alert
            message="上下文匹配模式"
            description="系统会分析按钮周围的文本信息，选择最匹配关键词的按钮。推荐用于有明确目标的场景。"
            type="info"
            showIcon
          />
        );
      
      case 'index':
        return (
          <Form.Item
            label="目标索引"
            name="index_value"
            tooltip="指定要点击第几个按钮（从0开始计数）"
          >
            <InputNumber
              min={0}
              max={10}
              placeholder="例如：0表示第1个，1表示第2个"
              onChange={handleFormChange}
            />
          </Form.Item>
        );
      
      case 'position':
        return (
          <Form.Item
            label="位置策略"
            name="position_value"
            tooltip="选择按钮在列表中的相对位置"
          >
            <Select onChange={handleFormChange}>
              <Option value="First">第一个</Option>
              <Option value="Last">最后一个</Option>
              <Option value="Middle">中间的</Option>
              <Option value="Random">随机选择</Option>
            </Select>
          </Form.Item>
        );
      
      default:
        return (
          <Alert
            message="智能推荐模式"
            description="系统综合考虑位置、上下文、稳定性等因素，自动推荐最佳选择。适用于大多数场景。"
            type="success"
            showIcon
          />
        );
    }
  };

  const getScenarioExamples = () => {
    switch (selectionModeType) {
      case 'context':
        return [
          { title: '关注特定用户', desc: '目标文本："关注"，关键词：["张三"]' },
          { title: '点赞特定评论', desc: '目标文本："点赞"，关键词：["很有道理"]' },
        ];
      case 'index':
        return [
          { title: '总是点第一个', desc: '索引：0' },
          { title: '点击第三个按钮', desc: '索引：2' },
        ];
      case 'position':
        return [
          { title: '保守策略', desc: '位置：第一个' },
          { title: '探索策略', desc: '位置：随机选择' },
        ];
      default:
        return [
          { title: '自适应选择', desc: '让系统智能判断最佳选项' },
          { title: '平衡策略', desc: '综合考虑多种因素' },
        ];
    }
  };

  return (
    <div className={`contextual-selector-config ${className}`}>
      <Card title={
        <Space>
          <TargetOutlined />
          多元素智能选择配置
          <Tooltip title="当界面中存在多个相同按钮时，通过上下文分析智能选择目标按钮">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      }>
        <Form
          form={form}
          layout="vertical"
          initialValues={getInitialFormValues()}
          onValuesChange={handleFormChange}
        >
          {/* 目标文本 */}
          <Form.Item
            label="目标按钮文本"
            name="target_text"
            rules={[{ required: true, message: '请输入目标按钮的文本' }]}
            tooltip="要点击的按钮上显示的文字"
          >
            <Input
              placeholder="例如：关注、点赞、收藏、购买"
              prefix={<BulbOutlined />}
            />
          </Form.Item>

          {/* 选择模式 */}
          <Form.Item 
            label="选择策略" 
            tooltip="决定如何从多个相同按钮中选择目标"
          >
            <Select 
              value={selectionModeType} 
              onChange={(value) => {
                setSelectionModeType(value);
                setTimeout(handleFormChange, 0);
              }}
            >
              <Option value="context">🎯 上下文匹配</Option>
              <Option value="smart">🤖 智能推荐</Option>
              <Option value="index">🔢 指定索引</Option>
              <Option value="position">📍 相对位置</Option>
            </Select>
          </Form.Item>

          {/* 选择模式特定配置 */}
          {renderSelectionModeConfig()}

          {/* 上下文关键词（只在上下文模式下显示） */}
          {selectionModeType === 'context' && (
            <Form.Item
              label="上下文关键词"
              name="context_keywords"
              tooltip="系统会查找按钮附近包含这些关键词的文本，一行一个关键词"
            >
              <TextArea
                rows={3}
                placeholder="例如：&#10;张三&#10;李四&#10;可以输入多个关键词"
              />
            </Form.Item>
          )}

          {/* 高级配置 */}
          <Card size="small" title="高级设置" style={{ marginTop: 16 }}>
            <Form.Item
              label="上下文搜索范围"
              name="context_search_radius"
              tooltip="在按钮周围多大像素范围内查找上下文信息"
            >
              <InputNumber
                min={50}
                max={1000}
                step={50}
                addonAfter="像素"
              />
            </Form.Item>

            <Form.Item
              label="最低置信度阈值"
              name="min_confidence_threshold"
              tooltip="低于此置信度的选项会被过滤，范围0.0-1.0"
            >
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                precision={1}
              />
            </Form.Item>
          </Card>

          {/* 使用场景示例 */}
          <Card size="small" title="适用场景" style={{ marginTop: 16 }}>
            {getScenarioExamples().map((example, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Tag color="blue">{example.title}</Tag>
                <span style={{ fontSize: 12, color: '#666' }}>{example.desc}</span>
              </div>
            ))}
          </Card>
        </Form>

        {/* 操作按钮 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button 
              type="primary" 
              onClick={() => onPreview?.(value)}
              disabled={!value.target_text.trim()}
            >
              预览效果
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ContextualSelectorConfigComponent;