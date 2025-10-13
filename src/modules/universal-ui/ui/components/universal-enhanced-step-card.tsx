// src/modules/universal-ui/ui/components/universal-enhanced-step-card.tsx
// module: universal-ui | layer: ui | role: component  
// summary: 增强版步骤卡片，支持完整的分析状态和三种策略类型

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Radio, 
  Space, 
  Typography, 
  Collapse, 
  Button, 
  Tag, 
  Tooltip,
  Empty,
  Switch,
  Row,
  Col
} from 'antd';
import {
  ThunderboltOutlined,
  EditOutlined,
  UserOutlined,
  TrophyOutlined,
  PlusOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { UniversalAnalysisStatusSection } from './universal-analysis-status-section';
import { useInspectorStore } from '../../stores/inspectorStore';
import type { 
  UniversalStepCardAnalysisData, 
  UniversalStepCardAnalysisActions,
  AnalysisStepState
} from '../types/universal-analysis-step-card';
import type {
  SmartAnalysisStep,
  UserStaticStrategy
} from '../../stores/inspectorStore';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * 增强版步骤卡片属性
 */
export interface UniversalEnhancedStepCardProps {
  /** 卡片标题 */
  title?: string;
  /** 卡片大小 */
  size?: 'small' | 'default';
  /** 自定义样式类名 */
  className?: string;
  /** 额外操作按钮 */
  extra?: React.ReactNode;
  /** 是否显示设置区域 */
  showSettings?: boolean;
}

/**
 * 增强版步骤卡片组件
 * 支持三种策略类型：智能匹配、智能手动选择、用户自建静态
 */
export const UniversalEnhancedStepCard: React.FC<UniversalEnhancedStepCardProps> = ({
  title = "策略配置",
  size = 'default',
  className = '',
  extra,
  showSettings = true
}) => {
  const {
    // 状态
    element,
    analysisState,
    analysisProgress,
    smartSteps,
    recommendedStepKey,
    recommendedConfidence,
    userStrategies,
    activeStrategyType,
    activeStrategyKey,
    isUsingDefaultStrategy,
    autoFollowSmart,
    current,
    error,
    
    // 操作
    cancelAnalysis,
    retryAnalysis,
    applyRecommended,
    selectIntelligentStrategy,
    selectSmartStep,
    selectUserStrategy,
    addUserStrategy,
    toggleAutoFollowSmart
  } = useInspectorStore();

  const [newStrategyModalVisible, setNewStrategyModalVisible] = useState(false);

  // 构建分析数据
  const analysisData: UniversalStepCardAnalysisData = {
    analysisState: analysisState as AnalysisStepState,
    analysisProgress: analysisProgress ? {
      ...analysisProgress,
      stepName: '分析步骤',
      stepDescription: '正在进行智能分析'
    } : undefined,
    recommendedStrategy: smartSteps.find(s => s.key === recommendedStepKey) ? {
      name: smartSteps.find(s => s.key === recommendedStepKey)!.name,
      description: smartSteps.find(s => s.key === recommendedStepKey)!.description,  
      confidence: recommendedConfidence!,
      category: 'self-anchor' as const,
      performance: { speed: 'fast', stability: 'high', crossDevice: 'excellent' },
      pros: ['高准确性'],
      cons: ['可能较慢'],
      scenarios: ['通用场景']
    } : undefined,
    recommendedConfidence
  };

  // 构建操作回调
  const analysisActions: UniversalStepCardAnalysisActions = {
    onCancelAnalysis: cancelAnalysis,
    onRetryAnalysis: retryAnalysis,
    onQuickUpgrade: async () => applyRecommended(),
    onViewAnalysisDetails: () => {
      console.log('查看分析详情');
    }
  };

  // 处理策略选择变化
  const handleStrategyChange = useCallback((value: string) => {
    if (value === 'intelligent') {
      selectIntelligentStrategy();
    } else if (value.startsWith('smart-')) {
      const stepKey = value.replace('smart-', '');
      selectSmartStep(stepKey);
    } else if (value.startsWith('user-')) {
      const strategyKey = value.replace('user-', '');
      selectUserStrategy(strategyKey);
    }
  }, [selectIntelligentStrategy, selectSmartStep, selectUserStrategy]);

  // 获取当前选中的策略值
  const getCurrentStrategyValue = () => {
    if (activeStrategyType === 'intelligent') {
      return 'intelligent';
    } else if (activeStrategyType === 'smart-manual' && activeStrategyKey) {
      return `smart-${activeStrategyKey}`;
    } else if (activeStrategyType === 'user-static' && activeStrategyKey) {
      return `user-${activeStrategyKey}`;
    }
    return '';
  };

  // 如果没有元素，显示空状态
  if (!element) {
    return (
      <Card 
        title={title}
        className={`light-theme-force ${className}`}
        size={size}
        extra={extra}
      >
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请先选择一个元素"
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>{title}</Text>
              {isUsingDefaultStrategy && (
                <Tag color="orange">使用默认策略</Tag>
              )}
              {current && (
                <Tag 
                  color={activeStrategyType === 'intelligent' ? 'blue' : 
                         activeStrategyType === 'smart-manual' ? 'green' : 'purple'}
                  icon={
                    activeStrategyType === 'intelligent' ? <ThunderboltOutlined /> :
                    activeStrategyType === 'smart-manual' ? <TrophyOutlined /> : <UserOutlined />
                  }
                >
                  {activeStrategyType === 'intelligent' ? '智能匹配' :
                   activeStrategyType === 'smart-manual' ? '智能手动' : '用户自建'}
                </Tag>
              )}
            </Space>
          </Col>
          {showSettings && (
            <Col>
              <Tooltip title="自动应用高置信度策略">
                <Switch
                  size="small"
                  checked={autoFollowSmart}
                  onChange={toggleAutoFollowSmart}
                  checkedChildren="智能跟随"
                  unCheckedChildren="手动选择"
                />
              </Tooltip>
            </Col>
          )}
        </Row>
      }
      className={`light-theme-force ${className}`}
      size={size}
      extra={extra}
    >
      {/* 分析状态区域 */}
      <UniversalAnalysisStatusSection 
        analysis={analysisData}
        actions={analysisActions}
        size={size}
      />

      {/* 策略选择区域 */}
      <div style={{ marginBottom: 16 }}>
        <Radio.Group 
          value={getCurrentStrategyValue()}
          onChange={(e) => handleStrategyChange(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 智能匹配策略 */}
            <Radio value="intelligent">
              <Space>
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
                <Text strong>智能匹配 (推荐)</Text>
                {recommendedConfidence && (
                  <Tag color="blue">{recommendedConfidence}% 置信度</Tag> 
                )}
              </Space>
            </Radio>
            
            {activeStrategyType === 'intelligent' && (
              <div style={{ 
                marginLeft: 24, 
                padding: 12, 
                background: 'var(--bg-1, #f8fafc)',
                borderRadius: 6,
                border: '1px solid var(--border-2, #e2e8f0)'
              }}>
                <Text style={{ fontSize: 12, color: 'var(--text-2, #64748b)' }}>
                  包含完整决策链，自动选择最优步骤，支持智能回退
                </Text>
              </div>
            )}

            {/* 智能手动选择 */}
            {smartSteps.length > 0 && (
              <Collapse ghost>
                <Panel 
                  header={
                    <Space>
                      <TrophyOutlined style={{ color: '#52c41a' }} />
                      <Text strong>智能手动选择</Text>
                      <Text style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }}>
                        ({smartSteps.length} 个步骤可选)
                      </Text>
                    </Space>
                  }
                  key="smart-manual"
                >
                  <div style={{ paddingLeft: 24 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {smartSteps.map((step) => (
                        <Radio key={step.key} value={`smart-${step.key}`}>
                          <Space>
                            <Text>{step.name}</Text>
                            <Tag color={step.isRecommended ? 'gold' : 'default'}>
                              {step.score}分
                            </Tag>
                            {step.isRecommended && (
                              <Tag color="gold">推荐</Tag>
                            )}
                          </Space>
                        </Radio>
                      ))}
                    </Space>
                  </div>
                </Panel>
              </Collapse>
            )}

            {/* 用户自建策略 */}
            <Collapse ghost>
              <Panel 
                header={
                  <Space>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    <Text strong>用户自建策略</Text>
                    <Text style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }}>
                      ({userStrategies.length} 个策略)
                    </Text>
                  </Space>
                }
                key="user-static"
                extra={
                  <Button 
                    type="text" 
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewStrategyModalVisible(true);
                    }}
                  >
                    新建
                  </Button>
                }
              >
                <div style={{ paddingLeft: 24 }}>
                  {userStrategies.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {userStrategies.map((strategy) => (
                        <Radio key={strategy.key} value={`user-${strategy.key}`}>
                          <Space>
                            <Text>{strategy.name}</Text>
                            <Tag color="purple">{strategy.selectorType.toUpperCase()}</Tag>
                            {strategy.pinned && (
                              <Tag color="orange">置顶</Tag>
                            )}
                          </Space>
                        </Radio>
                      ))}
                    </Space>
                  ) : (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无自建策略"
                      style={{ margin: '12px 0' }}
                    >
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => setNewStrategyModalVisible(true)}
                      >
                        创建第一个策略
                      </Button>
                    </Empty>
                  )}
                </div>
              </Panel>
            </Collapse>
          </Space>
        </Radio.Group>
      </div>

      {/* 当前策略详情 */}
      {current && (
        <div style={{ 
          marginTop: 16,
          padding: 12,
          background: 'var(--bg-2, #f1f5f9)',
          borderRadius: 6,
          border: '1px solid var(--border-1, #e2e8f0)'
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 13 }}>
                当前策略详情
              </Text>
              <Button 
                type="text" 
                size="small"
                icon={<InfoCircleOutlined />}
              >
                预览
              </Button>
            </div>
            
            <div>
              <Text style={{ fontSize: 12, color: 'var(--text-2, #64748b)' }}>
                {current.kind === 'smart' ? '智能策略' : '手动策略'}
              </Text>
            </div>
            
            {current.kind === 'manual' && current.selector && (
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: 11,
                background: 'var(--bg-3, #ffffff)',
                padding: 8,
                borderRadius: 4,
                border: '1px solid var(--border-2, #e2e8f0)'
              }}>
                {current.selector.xpath && (
                  <div>XPath: {current.selector.xpath}</div>
                )}
                {current.selector.css && (
                  <div>CSS: {current.selector.css}</div>
                )}
              </div>
            )}
          </Space>
        </div>
      )}

      {/* 错误状态显示 */}
      {error && analysisState !== 'failed' && (
        <div style={{ 
          marginTop: 16,
          padding: 8,
          background: 'var(--error-bg, #fff2f0)',
          border: '1px solid var(--error-border, #ffccc7)',
          borderRadius: 4
        }}>
          <Text type="danger" style={{ fontSize: 12 }}>
            {error}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default UniversalEnhancedStepCard;