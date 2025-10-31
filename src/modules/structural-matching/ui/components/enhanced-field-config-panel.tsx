// src/modules/structural-matching/ui/components/enhanced-field-config-panel.tsx
// module: structural-matching | layer: ui | role: 增强的字段配置面板
// summary: 让用户手动选择每个字段是否开启匹配以及如何匹配的直观UI

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
  Divider, 
  Button,
  Alert,
  Tooltip,
  Badge,
  Collapse,
  Tag
} from 'antd';
import { 
  SettingOutlined, 
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

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

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
 * 字段描述
 */
const FIELD_DESCRIPTIONS: Record<FieldType, string> = {
  [FieldType.RESOURCE_ID]: '元素的唯一标识符，通常用于精确定位',
  [FieldType.CONTENT_DESC]: '元素的内容描述，如按钮文字、标题等',
  [FieldType.TEXT]: '元素显示的文本内容',
  [FieldType.CLASS_NAME]: '元素的类名，决定控件类型',
  [FieldType.CHILDREN_STRUCTURE]: '子元素的结构和组成',
  [FieldType.BOUNDS]: '元素的位置和尺寸信息',
};

/**
 * 单个字段配置行组件
 */
interface FieldConfigRowProps {
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

const FieldConfigRow: React.FC<FieldConfigRowProps> = ({
  fieldType,
  config,
  onEnabledChange,
  onStrategyChange,
  onWeightChange,
}) => {
  const strategyOptions = createFieldStrategyOptions(fieldType);

  return (
    <Card 
      size="small" 
      className={`field-config-row ${config.enabled ? 'enabled' : 'disabled'}`}
      style={{ 
        marginBottom: 12,
        border: config.enabled ? '1px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: config.enabled ? '#f6ffed' : '#fafafa'
      }}
    >
      <Row align="middle" gutter={[16, 8]}>
        {/* 字段基本信息 */}
        <Col span={8}>
          <Space>
            <span style={{ fontSize: '16px' }}>{FIELD_ICONS[fieldType]}</span>
            <div>
              <Text strong>{FIELD_TYPE_DISPLAY_NAMES[fieldType]}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {FIELD_DESCRIPTIONS[fieldType]}
              </Text>
            </div>
          </Space>
        </Col>

        {/* 启用开关 */}
        <Col span={3}>
          <Space direction="vertical" size="small">
            <Text style={{ fontSize: '12px' }}>启用匹配</Text>
            <Switch
              checked={config.enabled}
              onChange={onEnabledChange}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </Space>
        </Col>

        {/* 策略选择 */}
        <Col span={8}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text style={{ fontSize: '12px' }}>匹配策略</Text>
            <Select
              value={config.strategy}
              onChange={onStrategyChange}
              disabled={!config.enabled}
              style={{ width: '100%' }}
              placeholder="选择匹配策略"
            >
              {strategyOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Space>
                    {option.label}
                    {option.isRecommended && <Tag color="green" size="small">推荐</Tag>}
                  </Space>
                </Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* 权重配置 */}
        <Col span={5}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text style={{ fontSize: '12px' }}>权重 ({config.weight.toFixed(1)})</Text>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={config.weight}
              onChange={onWeightChange}
              disabled={!config.enabled}
              marks={{
                0.1: '低',
                0.5: '中',
                1.0: '高'
              }}
            />
          </Space>
        </Col>
      </Row>

      {/* 策略说明 */}
      {config.enabled && (
        <Row style={{ marginTop: 8 }}>
          <Col span={24}>
            <Alert
              message={MATCH_STRATEGY_DISPLAY_NAMES[config.strategy]}
              description={strategyOptions.find(opt => opt.value === config.strategy)?.description}
              type="info"
              showIcon
              size="small"
            />
          </Col>
        </Row>
      )}
    </Card>
  );
};

/**
 * 增强的字段配置面板主组件
 */
export const EnhancedFieldConfigPanel: React.FC = () => {
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

  // 保存配置（这里可以连接实际的保存逻辑）
  const handleSaveConfig = () => {
    console.log('保存配置:', fieldConfigs);
    // TODO: 实际保存逻辑
  };

  return (
    <div className="enhanced-field-config-panel light-theme-force" style={{ padding: '24px' }}>
      {/* 头部标题和操作 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            <SettingOutlined /> 字段匹配配置
          </Title>
          <Paragraph type="secondary">
            选择每个字段是否参与匹配，以及具体的匹配策略
          </Paragraph>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={resetToRecommended}
            >
              重置推荐
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveConfig}
            >
              保存配置
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 0]}>
        {/* 左侧：配置面板 */}
        <Col span={16}>
          {/* 场景预设选择 */}
          <Card title="快速场景预设" size="small" style={{ marginBottom: 16 }}>
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
            </Space>
            {activePreset && (
              <Alert
                style={{ marginTop: 8 }}
                message={availableScenarios.find(s => s.name === activePreset)?.useCase}
                type="info"
                size="small"
                showIcon
              />
            )}
          </Card>

          {/* 字段配置列表 */}
          <Card title="字段配置" size="small">
            {Object.entries(fieldConfigs).map(([fieldType, config]) => (
              <FieldConfigRow
                key={fieldType}
                fieldType={fieldType as FieldType}
                config={config}
                onEnabledChange={(enabled) => updateFieldEnabled(fieldType as FieldType, enabled)}
                onStrategyChange={(strategy) => updateFieldStrategy(fieldType as FieldType, strategy)}
                onWeightChange={(weight) => updateFieldWeight(fieldType as FieldType, weight)}
              />
            ))}
          </Card>
        </Col>

        {/* 右侧：配置预览和说明 */}
        <Col span={8}>
          {/* 配置摘要 */}
          <Card title="配置摘要" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text>总字段数:</Text>
                <Badge count={summary.totalFields} color="blue" />
              </Row>
              <Row justify="space-between">
                <Text>已启用:</Text>
                <Badge count={summary.enabledFields} color="green" />
              </Row>
              <Row justify="space-between">
                <Text>平均权重:</Text>
                <Text>{summary.averageWeight.toFixed(2)}</Text>
              </Row>
            </Space>

            <Divider />

            <div>
              <Text strong>策略分布:</Text>
              <div style={{ marginTop: 8 }}>
                {Object.entries(summary.strategyCounts).map(([strategy, count]) => (
                  <Tag key={strategy} color="processing" style={{ margin: '2px' }}>
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
                配置验证
              </Space>
            } 
            size="small" 
            style={{ marginBottom: 16 }}
          >
            {validation.isValid ? (
              <Alert message="配置验证通过" type="success" size="small" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {validation.issues.map((issue, index) => (
                  <Alert key={index} message={issue} type="warning" size="small" />
                ))}
              </Space>
            )}

            {validation.suggestions && validation.suggestions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text strong>
                  <BulbOutlined /> 优化建议:
                </Text>
                {validation.suggestions.map((suggestion, index) => (
                  <div key={index} style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      • {suggestion}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 使用说明 */}
          <Collapse size="small">
            <Panel header="使用说明" key="help">
              <Space direction="vertical" size="small">
                <div>
                  <Text strong>字段开关:</Text>
                  <Text> 控制该字段是否参与匹配过程</Text>
                </div>
                <div>
                  <Text strong>匹配策略:</Text>
                  <Text> 决定如何比较该字段的值</Text>
                </div>
                <div>
                  <Text strong>权重设置:</Text>
                  <Text> 影响该字段在整体匹配中的重要性</Text>
                </div>
                <Divider />
                <div>
                  <Text strong>推荐用法:</Text>
                  <ul style={{ marginLeft: 16, fontSize: '12px' }}>
                    <li>关键字段（Resource-ID, Class Name）建议启用</li>
                    <li>动态内容使用"都非空即可"策略</li>
                    <li>位置信息可以禁用以提高适配性</li>
                  </ul>
                </div>
              </Space>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedFieldConfigPanel;