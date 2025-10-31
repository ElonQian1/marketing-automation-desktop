// src/modules/structural-matching/ui/components/field-strategy-selector.tsx
// module: structural-matching | layer: ui | role: 字段策略选择器
// summary: 让用户为每个字段独立选择匹配策略的UI组件

import React from 'react';
import { Select, Tooltip, Badge, Space, Typography, Card } from 'antd';
import { InfoCircleOutlined, StarOutlined } from '@ant-design/icons';
import { FieldType } from '../../domain/constants/field-types';
import { MatchStrategy } from '../../domain/constants/match-strategies';
import { 
  createFieldStrategyOptions, 
  FIELD_STRATEGY_PRESETS,
  STRATEGY_SELECTION_GUIDE 
} from '../../domain/constants/field-strategy-presets';

const { Option } = Select;
const { Text, Title } = Typography;

interface FieldStrategySelectorProps {
  /** 字段类型 */
  fieldType: FieldType;
  
  /** 当前选中的策略 */
  value: MatchStrategy;
  
  /** 策略变更回调 */
  onChange: (strategy: MatchStrategy) => void;
  
  /** 是否显示推荐标识 */
  showRecommended?: boolean;
  
  /** 是否显示详细说明 */
  showGuide?: boolean;
  
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 字段策略选择器组件
 * 让用户为每个字段类型选择最适合的匹配策略
 */
export const FieldStrategySelector: React.FC<FieldStrategySelectorProps> = ({
  fieldType,
  value,
  onChange,
  showRecommended = true,
  showGuide = true,
  disabled = false
}) => {
  const strategyOptions = createFieldStrategyOptions(fieldType);
  const currentGuide = STRATEGY_SELECTION_GUIDE[value];
  const preset = FIELD_STRATEGY_PRESETS[fieldType];

  const handleChange = (newStrategy: MatchStrategy) => {
    onChange(newStrategy);
  };

  const renderOption = (option: ReturnType<typeof createFieldStrategyOptions>[0]) => (
    <Option key={option.value} value={option.value}>
      <Space>
        <span>{option.label}</span>
        {option.isRecommended && showRecommended && (
          <Badge 
            count={<StarOutlined style={{ color: '#faad14' }} />} 
            size="small"
          />
        )}
        <Tooltip title={option.description}>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
        </Tooltip>
      </Space>
    </Option>
  );

  return (
    <div className="light-theme-force">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 策略选择器 */}
        <Space align="start" style={{ width: '100%' }}>
          <Select
            value={value}
            onChange={handleChange}
            disabled={disabled}
            style={{ minWidth: 200 }}
            placeholder="选择匹配策略"
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          >
            {strategyOptions.map(renderOption)}
          </Select>
          
          {/* 推荐说明 */}
          <Tooltip title={preset.reason}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>

        {/* 详细指南 */}
        {showGuide && currentGuide && (
          <Card size="small" style={{ marginTop: 8 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>使用指南：</Text>
              <Text>{currentGuide.tips}</Text>
              
              <div>
                <Text type="success">✅ 适用于：</Text>
                <Text>{currentGuide.bestFor.join(', ')}</Text>
              </div>
              
              <div>
                <Text type="warning">⚠️ 避免用于：</Text>
                <Text>{currentGuide.avoid.join(', ')}</Text>
              </div>
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
};

/**
 * 字段策略配置面板
 * 显示所有字段的策略选择器
 */
interface FieldStrategyPanelProps {
  /** 字段配置 */
  fieldConfigs: Partial<Record<FieldType, { strategy: MatchStrategy }>>;
  
  /** 字段策略变更回调 */
  onFieldStrategyChange: (fieldType: FieldType, strategy: MatchStrategy) => void;
  
  /** 显示的字段类型列表 */
  fieldTypes?: FieldType[];
}

export const FieldStrategyPanel: React.FC<FieldStrategyPanelProps> = ({
  fieldConfigs,
  onFieldStrategyChange,
  fieldTypes = Object.values(FieldType)
}) => {
  return (
    <div className="light-theme-force">
      <Card title="字段匹配策略配置" style={{ width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>为每个字段选择最适合的匹配方法：</Title>
            <Text type="secondary">
              每个字段都可以独立配置匹配策略，根据字段特性选择最优的匹配算法
            </Text>
          </div>

          {fieldTypes.map(fieldType => {
            const config = fieldConfigs[fieldType];
            const currentStrategy = config?.strategy || MatchStrategy.CONSISTENT_EMPTINESS;
            const preset = FIELD_STRATEGY_PRESETS[fieldType];

            return (
              <Card key={fieldType} size="small" style={{ backgroundColor: '#fafafa' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {fieldType.replace('_', '-').toUpperCase()}
                    </Title>
                    <Text type="secondary">{preset.useCase}</Text>
                  </div>

                  <FieldStrategySelector
                    fieldType={fieldType}
                    value={currentStrategy}
                    onChange={(strategy) => onFieldStrategyChange(fieldType, strategy)}
                    showRecommended={true}
                    showGuide={true}
                  />
                </Space>
              </Card>
            );
          })}
        </Space>
      </Card>
    </div>
  );
};

export default FieldStrategySelector;