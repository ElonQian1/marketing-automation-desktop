/**
 * 统一策略选择配置器
 * 合并了新版 MatchingStrategySelector 和旧版 MatchStrategySelector 的所有功能
 * 
 * 功能特性：
 * - 策略选择 (新版 + 旧版)
 * - 字段配置 (旧版)
 * - 字段值配置 (旧版) 
 * - 包含/排除条件 (旧版)
 * - 自动填充 (旧版)
 * - 测试匹配 (旧版)
 * - 评分徽章显示 (新版)
 * - 推荐策略指示 (新版)
 * - 多种显示模式
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Alert,
  Divider 
} from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { 
  UnifiedStrategyConfiguratorProps, 
  MatchStrategy, 
  MatchCriteria,
  DisplayMode,
  StrategyScoreInfo 
} from './types';
import { 
  UNIFIED_STRATEGY_OPTIONS, 
  AVAILABLE_FIELDS, 
  getStrategyOption,
  getRecommendedFields,
  getFieldConfig 
} from './config';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * 内联策略评分徽章组件
 */
const InlineScoreBadge: React.FC<{
  score: number;
  isRecommended?: boolean;
}> = ({ score, isRecommended }) => {
  return (
    <Space size={4}>
      <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
        {score}分
      </Tag>
      {isRecommended && (
        <Tag color="gold" icon={<ThunderboltOutlined />}>
          推荐
        </Tag>
      )}
    </Space>
  );
};

/**
 * 策略按钮组件 (简单模式使用)
 */
const StrategyButtonGroup: React.FC<{
  value: MatchStrategy;
  onChange: (strategy: MatchStrategy) => void;
  strategyScores?: Record<string, StrategyScoreInfo>;
  showScores?: boolean;
  recommendedStrategy?: MatchStrategy;
}> = ({ value, onChange, strategyScores = {}, showScores = false, recommendedStrategy }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-neutral-500">匹配策略：</span>
      {UNIFIED_STRATEGY_OPTIONS.map((option) => {
        const scoreInfo = strategyScores[option.value];
        const isRecommended = recommendedStrategy === option.value || scoreInfo?.isRecommended;
        const isSelected = value === option.value;
        
        return (
          <div key={option.value} className="relative">
            <button
              className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${
                isSelected 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : isRecommended 
                    ? 'border-blue-400 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              } ${isRecommended ? 'ring-1 ring-blue-300 ring-opacity-50' : ''}`}
              title={`${option.description}${scoreInfo ? ` (评分: ${Math.round(scoreInfo.score * 100)}%)` : ''}${isRecommended ? ' [推荐]' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <span>{option.label}</span>
              
              {/* 推荐指示器 */}
              {isRecommended && !isSelected && (
                <span className="text-blue-500 text-[10px]">★</span>
              )}
              
              {/* 评分徽章 */}
              {showScores && scoreInfo && (
                <InlineScoreBadge
                  score={scoreInfo.score}
                  isRecommended={isRecommended}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 统一策略选择配置器主组件
 */
export const UnifiedStrategyConfigurator: React.FC<UnifiedStrategyConfiguratorProps> = ({
  matchCriteria,
  onChange,
  mode = 'full',
  className,
  showCard = true,
  showFieldConfig = true,
  showValueConfig = true,
  showIncludeExclude = true,
  showAutoFill = true,
  showTestButton = true,
  showDescription = true,
  strategyScores = {},
  showScores = false,
  recommendedStrategy,
  referenceElement,
  onTestMatch,
  onStrategyChange,
  onAutoFill
}) => {
  const [form] = Form.useForm();
  const [selectedFields, setSelectedFields] = useState<string[]>(
    matchCriteria?.fields || []
  );

  // 根据mode确定显示的功能
  const isSimpleMode = mode === 'simple' || mode === 'minimal';
  const isCompactMode = mode === 'compact';
  const shouldShowFieldConfig = showFieldConfig && !isSimpleMode;
  const shouldShowValueConfig = showValueConfig && !isSimpleMode;

  // 同步外部数据到表单
  useEffect(() => {
    if (matchCriteria) {
      const values = {
        strategy: matchCriteria.strategy,
        fields: matchCriteria.fields,
        ...Object.fromEntries(
          Object.entries(matchCriteria.values || {}).map(([field, value]) => [`value_${field}`, value])
        )
      };
      
      // 设置includes和excludes
      if (matchCriteria.includes) {
        Object.entries(matchCriteria.includes).forEach(([field, includeList]) => {
          values[`include_${field}`] = includeList.join(', ');
        });
      }
      if (matchCriteria.excludes) {
        Object.entries(matchCriteria.excludes).forEach(([field, excludeList]) => {
          values[`exclude_${field}`] = excludeList.join(', ');
        });
      }

      form.setFieldsValue(values);
      setSelectedFields(matchCriteria.fields);
    }
  }, [matchCriteria, form]);

  // 从参考元素自动填充字段值
  const autoFillFromReference = useCallback(() => {
    if (!referenceElement) return;

    const values: Record<string, string> = {};
    const availableFields: string[] = [];

    AVAILABLE_FIELDS.forEach(field => {
      const value = (referenceElement as any)[field.name];
      if (value !== null && value !== undefined && value !== '') {
        if (field.name === 'bounds' && typeof value === 'object') {
          values[field.name] = `[${value.left},${value.top},${value.right},${value.bottom}]`;
        } else {
          values[field.name] = String(value);
        }
        availableFields.push(field.name);
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
    onAutoFill?.();
  }, [referenceElement, form, onAutoFill]);

  // 处理策略变化
  const handleStrategyChange = (strategy: MatchStrategy) => {
    form.setFieldValue('strategy', strategy);
    onStrategyChange?.(strategy);
    
    // 根据策略自动调整字段选择
    const recommendedFields = getRecommendedFields(strategy);
    
    // 过滤掉没有值的字段
    let finalFields = recommendedFields;
    if (referenceElement) {
      finalFields = recommendedFields.filter(field => {
        const value = (referenceElement as any)[field];
        return value !== null && value !== undefined && value !== '';
      });
    }

    if (strategy !== 'custom') {
      setSelectedFields(finalFields);
      form.setFieldValue('fields', finalFields);
    }
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

  // 简单模式：只显示策略按钮
  if (isSimpleMode) {
    const currentStrategy = matchCriteria?.strategy || 'standard';
    return (
      <div className={className}>
        <StrategyButtonGroup
          value={currentStrategy}
          onChange={(strategy) => {
            const newCriteria: MatchCriteria = {
              strategy,
              fields: matchCriteria?.fields || [],
              values: matchCriteria?.values || {}
            };
            onChange(newCriteria);
            onStrategyChange?.(strategy);
          }}
          strategyScores={strategyScores}
          showScores={showScores}
          recommendedStrategy={recommendedStrategy}
        />
      </div>
    );
  }

  const currentStrategy = getStrategyOption(form.getFieldValue('strategy') || matchCriteria?.strategy || 'standard');

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      size={isCompactMode ? 'small' : 'middle'}
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
          {UNIFIED_STRATEGY_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              <Space>
                {option.icon}
                <div>
                  <div>{option.label}</div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {option.description}
                  </Text>
                </div>
                {/* 推荐标记 */}
                {recommendedStrategy === option.value && (
                  <Tag color="blue">推荐</Tag>
                )}
                {/* 评分徽章 */}
                {showScores && strategyScores[option.value] && (
                  <InlineScoreBadge 
                    score={strategyScores[option.value].score}
                    isRecommended={strategyScores[option.value].isRecommended}
                  />
                )}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* 字段选择 */}
      {shouldShowFieldConfig && (
        <Form.Item 
          name="fields" 
          label="匹配字段"
          tooltip="选择用于匹配的元素字段"
        >
          <Checkbox.Group 
            options={AVAILABLE_FIELDS.map(field => ({
              label: field.label,
              value: field.name,
            }))}
            onChange={handleFieldsChange}
          />
        </Form.Item>
      )}

      {/* 字段值配置 */}
      {shouldShowValueConfig && selectedFields.length > 0 && (
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>字段值配置</Text>
          {selectedFields.map(field => {
            const fieldConfig = getFieldConfig(field);
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
                      placeholder={`输入${fieldConfig?.label || field}值`}
                      size="small"
                    />
                  </Form.Item>
                </Col>
              </Row>
            );
          })}
        </div>
      )}

      {/* 包含/排除条件 */}
      {showIncludeExclude && selectedFields.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '16px 0 8px 0' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>高级条件</Text>
          </Divider>
          {selectedFields.map(field => {
            const fieldConfig = getFieldConfig(field);
            return (
              <div key={`conditions_${field}`}>
                <Text strong style={{ fontSize: '12px' }}>{fieldConfig?.label}条件</Text>
                <Row gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Form.Item 
                      name={`include_${field}`}
                      style={{ marginBottom: 0 }}
                    >
                      <Input 
                        placeholder="包含词语 (逗号分隔)"
                        size="small"
                        prefix="包含:"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name={`exclude_${field}`}
                      style={{ marginBottom: 0 }}
                    >
                      <Input 
                        placeholder="排除词语 (逗号分隔)"
                        size="small"
                        prefix="排除:"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            );
          })}
        </>
      )}

      {/* 操作按钮 */}
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" htmlType="submit" size="small">
          应用策略
        </Button>
        {showTestButton && onTestMatch && (
          <Button size="small" onClick={handleTestMatch}>
            测试匹配
          </Button>
        )}
        {showAutoFill && referenceElement && (
          <Tooltip title="从选中元素自动填充">
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={autoFillFromReference}
            >
              自动填充
            </Button>
          </Tooltip>
        )}
      </Space>
    </Form>
  );

  // 策略说明
  const strategyDescription = showDescription && currentStrategy && (
    <Alert
      type="info"
      message={currentStrategy.description}
      showIcon
      style={{ marginTop: 12, fontSize: '12px' }}
    />
  );

  // 是否显示Card容器
  if (showCard) {
    return (
      <Card 
        className={className}
        size="small"
        title={
          <Space>
            <Text strong>匹配策略配置</Text>
            {currentStrategy && (
              <Tag color={currentStrategy.color} icon={currentStrategy.icon}>
                {currentStrategy.label}
              </Tag>
            )}
          </Space>
        }
      >
        {formContent}
        {strategyDescription}
      </Card>
    );
  }

  return (
    <div className={className}>
      {formContent}
      {strategyDescription}
    </div>
  );
};

export default UnifiedStrategyConfigurator;