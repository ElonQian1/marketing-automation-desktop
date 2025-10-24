// src/components/smart-selection/SmartSelectionConfig.tsx
// module: smart-selection | layer: ui | role: 智能选择配置组件
// summary: 可视化的智能选择策略配置界面

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Slider,
  Switch,
  InputNumber,
  Button,
  Space,
  Tooltip,
  Alert,
  Tag,
  Collapse,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  InfoCircleOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { 
  SmartSelectionProtocol,
  SelectionMode,
  ExecutionStrategy,
} from '../../types/smartSelection';

const { Option } = Select;
const { Panel } = Collapse;

interface SmartSelectionConfigProps {
  value?: Partial<SmartSelectionProtocol>;
  onChange?: (config: Partial<SmartSelectionProtocol>) => void;
  onTest?: (config: SmartSelectionProtocol) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

const SELECTION_MODE_OPTIONS = [
  {
    value: 'match-original' as SelectionMode,
    label: '精确匹配原按钮',
    description: '基于元素指纹精确匹配当初选择的按钮',
    icon: '🎯',
    difficulty: 'high',
    reliability: 'high',
  },
  {
    value: 'first' as SelectionMode,
    label: '选择第一个',
    description: '选择同类元素中的第一个',
    icon: '1️⃣',
    difficulty: 'low',
    reliability: 'medium',
  },
  {
    value: 'last' as SelectionMode,
    label: '选择最后一个',
    description: '选择同类元素中的最后一个',
    icon: '🔚',
    difficulty: 'low',
    reliability: 'medium',
  },
  {
    value: 'random' as SelectionMode,
    label: '随机选择',
    description: '从同类元素中随机选择一个',
    icon: '🎲',
    difficulty: 'low',
    reliability: 'low',
  },
  {
    value: 'all' as SelectionMode,
    label: '批量操作',
    description: '选择所有同类元素并逐一执行',
    icon: '🔄',
    difficulty: 'high',
    reliability: 'medium',
  },
];

const EXECUTION_STRATEGY_OPTIONS = [
  {
    value: 'conservative' as ExecutionStrategy,
    label: '保守策略',
    description: '优先稳定性，使用更严格的匹配条件',
    color: 'blue',
  },
  {
    value: 'balanced' as ExecutionStrategy,
    label: '平衡策略',
    description: '平衡速度和稳定性，推荐的默认选择',
    color: 'green',
  },
  {
    value: 'aggressive' as ExecutionStrategy,
    label: '激进策略',
    description: '优先速度，使用更宽松的匹配条件',
    color: 'orange',
  },
];

export const SmartSelectionConfig: React.FC<SmartSelectionConfigProps> = ({
  value = {},
  onChange,
  onTest,
  disabled = false,
  showPreview = true,
}) => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<Partial<SmartSelectionProtocol>>(value);
  const [previewMode, setPreviewMode] = useState<SelectionMode>('match-original');

  useEffect(() => {
    setConfig(value);
    form.setFieldsValue({
      selectionMode: value.selection?.mode || 'match-original',
      batchInterval: value.selection?.batch_config?.interval_ms || 2000,
      batchContinueOnError: value.selection?.batch_config?.continue_on_error ?? true,
      batchShowProgress: value.selection?.batch_config?.show_progress ?? true,
      randomSeed: value.selection?.random_seed,
      executionStrategy: 'balanced',
      enableSmartSelection: true,
      minConfidence: 0.7,
      positionTolerance: 50,
    });
  }, [value, form]);

  const handleConfigChange = (changedFields: any, allFields: any) => {
    const newConfig: Partial<SmartSelectionProtocol> = {
      ...config,
      selection: {
        mode: allFields.selectionMode,
        order: 'visual-yx',
        random_seed: allFields.randomSeed,
        batch_config: allFields.selectionMode === 'all' ? {
          interval_ms: allFields.batchInterval,
          continue_on_error: allFields.batchContinueOnError,
          show_progress: allFields.batchShowProgress,
          jitter_ms: Math.floor(allFields.batchInterval * 0.1), // 10% 抖动
        } : undefined,
        filters: {
          min_confidence: allFields.minConfidence,
          position_tolerance: allFields.positionTolerance,
        },
      },
    };

    setConfig(newConfig);
    onChange?.(newConfig);
  };

  const handleTest = () => {
    if (onTest && config.selection) {
      onTest(config as SmartSelectionProtocol);
    }
  };

  const getSelectionModeInfo = (mode: SelectionMode) => {
    return SELECTION_MODE_OPTIONS.find(opt => opt.value === mode);
  };

  const renderSelectionModeCard = (option: typeof SELECTION_MODE_OPTIONS[0]) => (
    <Card
      key={option.value}
      size="small"
      hoverable
      className={`selection-mode-card ${previewMode === option.value ? 'selected' : ''}`}
      onClick={() => {
        setPreviewMode(option.value);
        form.setFieldsValue({ selectionMode: option.value });
        form.submit();
      }}
      style={{
        border: previewMode === option.value ? '2px solid #1890ff' : '1px solid #d9d9d9',
        marginBottom: 8,
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          <span style={{ fontSize: '18px' }}>{option.icon}</span>
          <strong>{option.label}</strong>
          <Tag color={option.difficulty === 'high' ? 'red' : option.difficulty === 'medium' ? 'orange' : 'green'}>
            {option.difficulty === 'high' ? '高级' : option.difficulty === 'medium' ? '中级' : '基础'}
          </Tag>
          <Tag color={option.reliability === 'high' ? 'green' : option.reliability === 'medium' ? 'orange' : 'red'}>
            {option.reliability === 'high' ? '高可靠' : option.reliability === 'medium' ? '中可靠' : '低可靠'}
          </Tag>
        </Space>
        <div style={{ color: '#666', fontSize: '12px' }}>
          {option.description}
        </div>
      </Space>
    </Card>
  );

  return (
    <div className="smart-selection-config">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleConfigChange}
        disabled={disabled}
      >
        <Card title="🎯 智能选择配置" size="small">
          <Alert
            message="智能选择系统将帮助您处理多个相同元素的选择问题"
            description="支持精确匹配、位置选择、随机选择和批量操作四种模式"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label={
              <Space>
                选择模式
                <Tooltip title="决定如何从多个相同元素中选择目标">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            name="selectionMode"
          >
            <div>
              <Row gutter={[8, 8]}>
                {SELECTION_MODE_OPTIONS.map(option => (
                  <Col key={option.value} span={12}>
                    {renderSelectionModeCard(option)}
                  </Col>
                ))}
              </Row>
            </div>
          </Form.Item>

          <Collapse ghost>
            <Panel header="🔧 高级配置" key="advanced">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  label="最低置信度"
                  name="minConfidence"
                  tooltip="匹配结果的最低置信度要求，过低的匹配将被过滤"
                >
                  <Slider
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    marks={{
                      0.1: '10%',
                      0.5: '50%',
                      0.7: '70%',
                      0.9: '90%',
                      1.0: '100%',
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="位置容错范围"
                  name="positionTolerance"
                  tooltip="元素位置的容错范围，单位像素"
                >
                  <InputNumber
                    min={10}
                    max={200}
                    step={10}
                    addonAfter="px"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                {previewMode === 'random' && (
                  <Form.Item
                    label="随机种子"
                    name="randomSeed"
                    tooltip="用于复现随机选择结果的种子值"
                  >
                    <InputNumber
                      placeholder="留空则使用随机种子"
                      min={1}
                      max={999999}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                )}
              </Space>
            </Panel>

            {previewMode === 'all' && (
              <Panel header="🔄 批量操作配置" key="batch">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    label="点击间隔"
                    name="batchInterval"
                    tooltip="批量点击时每次点击的间隔时间"
                  >
                    <Slider
                      min={500}
                      max={10000}
                      step={500}
                      marks={{
                        500: '0.5s',
                        2000: '2s',
                        5000: '5s',
                        10000: '10s',
                      }}
                    />
                  </Form.Item>

                  <Form.Item name="batchContinueOnError" valuePropName="checked">
                    <Switch checkedChildren="遇错继续" unCheckedChildren="遇错停止" />
                    <span style={{ marginLeft: 8 }}>遇到错误时继续执行后续操作</span>
                  </Form.Item>

                  <Form.Item name="batchShowProgress" valuePropName="checked">
                    <Switch checkedChildren="显示进度" unCheckedChildren="隐藏进度" />
                    <span style={{ marginLeft: 8 }}>显示批量操作的执行进度</span>
                  </Form.Item>
                </Space>
              </Panel>
            )}

            <Panel header="⚡ 执行策略" key="execution">
              <Form.Item
                label="执行策略"
                name="executionStrategy"
                tooltip="控制匹配和执行的激进程度"
              >
                <Select>
                  {EXECUTION_STRATEGY_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        <Tag color={option.color}>{option.label}</Tag>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {option.description}
                        </span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Panel>
          </Collapse>

          <Divider />

          {showPreview && (
            <div style={{ marginTop: 16 }}>
              <h4>
                <ExperimentOutlined /> 配置预览
              </h4>
              <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <Space direction="vertical" size="small">
                  <div>
                    <strong>选择模式:</strong> {getSelectionModeInfo(previewMode)?.label}
                  </div>
                  <div>
                    <strong>描述:</strong> {getSelectionModeInfo(previewMode)?.description}
                  </div>
                  {previewMode === 'all' && config.selection?.batch_config && (
                    <div>
                      <strong>批量配置:</strong> 间隔 {config.selection.batch_config.interval_ms}ms，
                      {config.selection.batch_config.continue_on_error ? '遇错继续' : '遇错停止'}
                    </div>
                  )}
                  <div>
                    <strong>置信度要求:</strong> ≥ {((config.selection?.filters?.min_confidence || 0.7) * 100).toFixed(0)}%
                  </div>
                </Space>
              </Card>
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button
                type="default"
                icon={<SafetyCertificateOutlined />}
                onClick={() => form.resetFields()}
              >
                重置默认
              </Button>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleTest}
                disabled={!onTest}
              >
                测试配置
              </Button>
            </Space>
          </div>
        </Card>
      </Form>

      <style jsx>{`
        .smart-selection-config .selection-mode-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .smart-selection-config .selection-mode-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .smart-selection-config .selection-mode-card.selected {
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
        }
      `}</style>
    </div>
  );
};