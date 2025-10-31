// src/modules/structural-matching/ui/pages/field-strategy-demo.tsx
// module: structural-matching | layer: ui | role: 字段策略演示页面
// summary: 展示如何为每个字段独立选择匹配策略的完整示例

import React, { useState } from 'react';
import { 
  Card, 
  Space, 
  Typography, 
  Button, 
  Select, 
  Alert, 
  Descriptions, 
  Tag,
  Row,
  Col,
  Divider,
  message
} from 'antd';
import { 
  SettingOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

import { FieldStrategyPanel } from '../components/field-strategy-selector';
import { useFieldStrategyConfig } from '../../hooks/use-field-strategy-config';
import { FieldType } from '../../domain/constants/field-types';
import { MatchStrategy, MATCH_STRATEGY_DISPLAY_NAMES } from '../../domain/constants/match-strategies';
import { SCENARIO_PRESETS } from '../../domain/constants/field-strategy-presets';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * 字段策略演示页面
 */
export const FieldStrategyDemo: React.FC = () => {
  const {
    fieldStrategies,
    updateFieldStrategy,
    applyScenarioPreset,
    resetToRecommended,
    toHierarchicalConfig,
    getConfigSummary,
    validateConfig,
    availableScenarios
  } = useFieldStrategyConfig();

  const [selectedScenario, setSelectedScenario] = useState<string>('');
  
  const summary = getConfigSummary();
  const validation = validateConfig();

  const handleScenarioApply = () => {
    if (selectedScenario) {
      const success = applyScenarioPreset(selectedScenario);
      if (success) {
        message.success(`已应用"${selectedScenario}"场景预设`);
        setSelectedScenario('');
      } else {
        message.error('应用场景预设失败');
      }
    }
  };

  const handleReset = () => {
    resetToRecommended();
    message.info('已重置为推荐配置');
  };

  const handleExport = () => {
    const config = toHierarchicalConfig();
    console.log('导出的配置:', JSON.stringify(config, null, 2));
    message.success('配置已导出到控制台');
  };

  return (
    <div className="light-theme-force" style={{ padding: 24, minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 页面标题 */}
        <div>
          <Title level={2}>
            <SettingOutlined /> 字段匹配策略配置
          </Title>
          <Paragraph>
            为每个字段独立选择最适合的匹配策略。系统支持6种细粒度匹配算法，
            包括<Tag color="blue">都非空即可</Tag>、
            <Tag color="green">保持空/非空一致</Tag>、
            <Tag color="orange">值相似匹配</Tag>等高级策略。
          </Paragraph>
        </div>

        {/* 快速操作区 */}
        <Card title="快速配置" size="small">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Space>
                <Text strong>场景预设：</Text>
                <Select
                  placeholder="选择预设场景"
                  style={{ width: 200 }}
                  value={selectedScenario}
                  onChange={setSelectedScenario}
                >
                  {availableScenarios.map(scenario => (
                    <Option key={scenario.name} value={scenario.name}>
                      {scenario.name}
                    </Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  onClick={handleScenarioApply}
                  disabled={!selectedScenario}
                >
                  应用预设
                </Button>
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置为推荐
                </Button>
                <Button type="dashed" onClick={handleExport}>
                  导出配置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 配置验证状态 */}
        {!validation.isValid && (
          <Alert
            type="warning"
            icon={<ExclamationCircleOutlined />}
            message="配置建议"
            description={
              <ul>
                {validation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            }
            showIcon
            closable
          />
        )}

        {/* 主要配置面板 */}
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <FieldStrategyPanel
              fieldConfigs={Object.fromEntries(
                Object.entries(fieldStrategies).map(([field, strategy]) => [
                  field,
                  { strategy }
                ])
              )}
              onFieldStrategyChange={updateFieldStrategy}
            />
          </Col>

          {/* 侧边栏：配置摘要和实时反馈 */}
          <Col span={8}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              
              {/* 配置摘要 */}
              <Card title="配置摘要" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="总字段数">
                    {summary.totalFields}
                  </Descriptions.Item>
                  <Descriptions.Item label="启用字段">
                    <Text type={summary.enabledFields >= 3 ? 'success' : 'warning'}>
                      {summary.enabledFields}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="禁用字段">
                    {summary.totalFields - summary.enabledFields}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />
                
                <div>
                  <Text strong>策略分布：</Text>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(summary.strategyCounts).map(([strategy, count]) => (
                      <Tag key={strategy} style={{ margin: '2px' }}>
                        {MATCH_STRATEGY_DISPLAY_NAMES[strategy as MatchStrategy]}: {count}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 当前选中场景的说明 */}
              {selectedScenario && (
                <Card title="场景说明" size="small">
                  {(() => {
                    const scenario = availableScenarios.find(s => s.name === selectedScenario);
                    return scenario ? (
                      <Space direction="vertical">
                        <Text>{scenario.description}</Text>
                        <Text type="secondary">{scenario.useCase}</Text>
                      </Space>
                    ) : null;
                  })()}
                </Card>
              )}

              {/* 实时效果预览 */}
              <Card title="效果预览" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    type={validation.isValid ? 'success' : 'warning'}
                    icon={validation.isValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                    message={validation.isValid ? '配置合理' : '配置需要调整'}
                    description={
                      validation.isValid 
                        ? '当前配置能够提供良好的匹配效果'
                        : '建议参考上方的配置建议进行调整'
                    }
                    showIcon
                  />
                  
                  <div>
                    <Text strong>核心策略应用示例：</Text>
                    <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                      <li>
                        <Text code>Content-Desc</Text>: {MATCH_STRATEGY_DISPLAY_NAMES[fieldStrategies[FieldType.CONTENT_DESC]]}
                        {fieldStrategies[FieldType.CONTENT_DESC] === MatchStrategy.BOTH_NON_EMPTY && (
                          <Text type="success"> ✨ 都非空即可</Text>
                        )}
                      </li>
                      <li>
                        <Text code>Text</Text>: {MATCH_STRATEGY_DISPLAY_NAMES[fieldStrategies[FieldType.TEXT]]}
                        {fieldStrategies[FieldType.TEXT] === MatchStrategy.CONSISTENT_EMPTINESS && (
                          <Text type="success"> ✨ 保持一致性</Text>
                        )}
                      </li>
                    </ul>
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>

        {/* 使用说明 */}
        <Card title="💡 使用指南" size="small">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div>
                <Text strong>🎯 "都非空即可"策略</Text>
                <Paragraph type="secondary">
                  适用于笔记标题、用户昵称等动态内容。
                  只要两个字段都有值就认为匹配，不关心具体内容。
                </Paragraph>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>🔄 "保持一致性"策略</Text>
                <Paragraph type="secondary">
                  适用于可选的Text字段。
                  原来空的匹配空的，原来有值的匹配有值的，保持UI状态一致。
                </Paragraph>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text strong>📊 "值相似匹配"策略</Text>
                <Paragraph type="secondary">
                  适用于可能有拼写变化的内容。
                  允许值有一定差异，基于相似度算法评分。
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default FieldStrategyDemo;