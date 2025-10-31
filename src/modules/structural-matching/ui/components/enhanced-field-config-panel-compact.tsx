// src/modules/structural-matching/ui/components/enhanced-field-config-panel-compact.tsx
// module: structural-matching | layer: ui | role: 紧凑版字段配置面板
// summary: 适用于模态框的紧凑版字段配置组件

import React, { useState } from 'react';
import { 
  Card, 
  Switch, 
  Select, 
  Slider, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Button,
  Alert,
  Badge,
  Tag
} from 'antd';
import { 
  InfoCircleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';

import { FieldType, FIELD_TYPE_DISPLAY_NAMES } from '../../domain/constants/field-types';
import { MatchStrategy, MATCH_STRATEGY_DISPLAY_NAMES } from '../../domain/constants/match-strategies';
import { useFieldStrategyConfig, FieldStrategyConfigSet } from '../../hooks/use-field-strategy-config';
import { SCENARIO_PRESETS, createFieldStrategyOptions } from '../../domain/constants/field-strategy-presets';

const { Text } = Typography;
const { Option } = Select;

/**
 * 字段图标映射
 */
const FIELD_ICONS: Record<FieldType, string> = {
  [FieldType.RESOURCE_ID]: '🆔',
  [FieldType.CONTENT_DESC]: '📝',
  [FieldType.TEXT]: '📄',
  [FieldType.CLASS_NAME]: '🏷️',
  [FieldType.CHILDREN_STRUCTURE]: '🌳',
  [FieldType.BOUNDS]: '📏',
};

/**
 * 单个字段配置行组件（紧凑版）
 */
interface CompactFieldConfigRowProps {
  fieldType: FieldType;
  config: {
    enabled: boolean;
    strategy: MatchStrategy;
    weight: number;
  };
  onEnabledChange: (enabled: boolean) => void;
  onStrategyChange: (strategy: MatchStrategy) => void;
  onWeightChange: (weight: number) => void;
}

const CompactFieldConfigRow: React.FC<CompactFieldConfigRowProps> = ({
  fieldType,
  config,
  onEnabledChange,
  onStrategyChange,
  onWeightChange,
}) => {
  const strategyOptions = createFieldStrategyOptions(fieldType);

  return (
    <div 
      className={`compact-field-config-row ${config.enabled ? 'enabled' : 'disabled'}`}
      style={{ 
        padding: '12px',
        marginBottom: 8,
        border: config.enabled ? '1px solid #1890ff' : '1px solid #d9d9d9',
        borderRadius: '6px',
        backgroundColor: config.enabled ? '#f6ffed' : '#fafafa'
      }}
    >
      <Row align="middle" gutter={[12, 4]}>
        {/* 字段信息 */}
        <Col span={6}>
          <Space>
            <span style={{ fontSize: '14px' }}>{FIELD_ICONS[fieldType]}</span>
            <div>
              <Text strong style={{ fontSize: '13px' }}>
                {FIELD_TYPE_DISPLAY_NAMES[fieldType]}
              </Text>
            </div>
          </Space>
        </Col>

        {/* 启用开关 */}
        <Col span={3}>
          <Switch
            size="small"
            checked={config.enabled}
            onChange={onEnabledChange}
          />
        </Col>

        {/* 策略选择 */}
        <Col span={9}>
          <Select
            size="small"
            value={config.strategy}
            onChange={onStrategyChange}
            disabled={!config.enabled}
            style={{ width: '100%' }}
          >
            {strategyOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <Space>
                  <span style={{ fontSize: '12px' }}>{option.label}</span>
                  {option.isRecommended && <Tag color="green">推荐</Tag>}
                </Space>
              </Option>
            ))}
          </Select>
        </Col>

        {/* 权重配置 */}
        <Col span={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={config.weight}
              onChange={onWeightChange}
              disabled={!config.enabled}
              style={{ flex: 1, margin: 0 }}
            />
            <Text style={{ fontSize: '11px', minWidth: '24px' }}>
              {config.weight.toFixed(1)}
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

/**
 * 紧凑版字段配置面板主组件
 */
export const EnhancedFieldConfigPanelCompact: React.FC = () => {
  const {
    fieldConfigs,
    updateFieldEnabled,
    updateFieldStrategy,
    updateFieldWeight,
    applyScenarioPreset,
    resetToRecommended,
    getConfigSummary,
    validateConfig,
    availableScenarios,
  } = useFieldStrategyConfig();

  const [activePreset, setActivePreset] = useState<string>('');

  const summary = getConfigSummary();
  const validation = validateConfig();

  // 应用场景预设
  const handleApplyPreset = (scenarioName: string) => {
    const success = applyScenarioPreset(scenarioName);
    if (success) {
      setActivePreset(scenarioName);
    }
  };

  return (
    <div className="enhanced-field-config-panel-compact light-theme-force">
      <Row gutter={[16, 0]}>
        {/* 左侧：配置面板 */}
        <Col span={16}>
          {/* 场景预设选择 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>
              快速场景预设:
            </Text>
            <Space wrap>
              {availableScenarios.map(scenario => (
                <Button
                  key={scenario.name}
                  type={activePreset === scenario.name ? 'primary' : 'default'}
                  size="small"
                  onClick={() => handleApplyPreset(scenario.name)}
                >
                  {scenario.name}
                </Button>
              ))}
              <Button 
                size="small"
                icon={<ReloadOutlined />}
                onClick={resetToRecommended}
              >
                重置
              </Button>
            </Space>
          </div>

          {/* 字段配置列表 */}
          <div>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>
              字段匹配策略:
            </Text>
            {Object.entries(fieldConfigs).map(([fieldType, config]) => (
              <CompactFieldConfigRow
                key={fieldType}
                fieldType={fieldType as FieldType}
                config={config}
                onEnabledChange={(enabled) => updateFieldEnabled(fieldType as FieldType, enabled)}
                onStrategyChange={(strategy) => updateFieldStrategy(fieldType as FieldType, strategy)}
                onWeightChange={(weight) => updateFieldWeight(fieldType as FieldType, weight)}
              />
            ))}
          </div>
        </Col>

        {/* 右侧：配置摘要 */}
        <Col span={8}>
          {/* 配置摘要 */}
          <Card title="配置摘要" size="small" style={{ marginBottom: 12 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text style={{ fontSize: '12px' }}>启用字段:</Text>
                <Badge count={summary.enabledFields} color="green" />
              </Row>
              <Row justify="space-between">
                <Text style={{ fontSize: '12px' }}>平均权重:</Text>
                <Text style={{ fontSize: '12px' }}>{summary.averageWeight.toFixed(2)}</Text>
              </Row>
            </Space>

            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: '11px' }}>策略分布:</Text>
              <div style={{ marginTop: 4 }}>
                {Object.entries(summary.strategyCounts).map(([strategy, count]) => (
                  <Tag key={strategy} style={{ fontSize: '10px', margin: '1px' }}>
                    {MATCH_STRATEGY_DISPLAY_NAMES[strategy as MatchStrategy]}: {count}
                  </Tag>
                ))}
              </div>
            </div>
          </Card>

          {/* 配置验证 */}
          <Card 
            title={
              <Space>
                {validation.isValid ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                )}
                <span style={{ fontSize: '12px' }}>配置验证</span>
              </Space>
            } 
            size="small"
          >
            {validation.isValid ? (
              <Alert message="配置验证通过" type="success" />
            ) : (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {validation.issues.map((issue, index) => (
                  <Alert key={index} message={issue} type="warning" />
                ))}
              </Space>
            )}

            {validation.suggestions && validation.suggestions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '11px' }}>
                  <BulbOutlined /> 优化建议:
                </Text>
                {validation.suggestions.map((suggestion, index) => (
                  <div key={index} style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      • {suggestion}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedFieldConfigPanelCompact;