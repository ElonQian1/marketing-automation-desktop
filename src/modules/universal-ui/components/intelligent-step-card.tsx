// src/modules/universal-ui/components/intelligent-step-card.tsx
// module: universal-ui | layer: ui | role: component
// summary: 统一的智能步骤卡片组件，支持完整的分析状态展示和默认值优先处理

import React, { useMemo } from 'react';
import { 
  Card, 
  Space, 
  Typography, 
  Button, 
  Progress, 
  Alert, 
  Tag, 
  Divider,
  Radio,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  ThunderboltOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  EyeOutlined,
  SettingOutlined,
  StopOutlined
} from '@ant-design/icons';

import type { IntelligentStepCard as StepCardData } from '../types/intelligent-analysis-types';

const { Text } = Typography;

/**
 * 智能步骤卡片属性
 */
export interface IntelligentStepCardProps {
  /** 步骤卡片数据 */
  stepCard: StepCardData;
  /** 步骤索引（用于显示） */
  stepIndex?: number;
  /** 卡片尺寸 */
  size?: 'small' | 'default';
  /** 自定义类名 */
  className?: string;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  
  // 事件回调
  /** 升级到推荐策略 */
  onUpgradeStrategy?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 切换策略 */
  onSwitchStrategy?: (strategyKey: string, followSmart: boolean) => void;

  /** 查看详情 */
  onViewDetails?: () => void;
  /** 取消分析 */
  onCancelAnalysis?: () => void;
}

/**
 * 智能步骤卡片组件
 * 
 * 核心特性：
 * 1. 🚀 默认值优先：立即可用，分析后台进行
 * 2. 🔄 状态可视：清晰展示分析进度和结果
 * 3. ⚡ 智能升级：分析完成后提供一键升级选项
 * 4. 🛡️ 防串扰：基于selection_hash确保结果正确关联
 */
export const IntelligentStepCard: React.FC<IntelligentStepCardProps> = ({
  stepCard,
  stepIndex,
  size = 'default',
  className = '',
  showDebugInfo = false,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy,
  onViewDetails,
  onCancelAnalysis
}) => {
  
  /**
   * 获取分析状态信息
   */
  const analysisStatusInfo = useMemo(() => {
    switch (stepCard.analysisState) {
      case 'analyzing':
        return {
          type: 'info' as const,
          message: '🧠 智能分析进行中...',
          description: `进度 ${stepCard.analysisProgress}% | 使用默认策略确保立即可用`,
          icon: <LoadingOutlined />,
          showProgress: true,
          actionButton: (
            <Button 
              size="small" 
              type="text" 
              icon={<StopOutlined />}
              onClick={onCancelAnalysis}
            >
              取消分析
            </Button>
          )
        };
        
      case 'analysis_completed':
        const hasUpgrade = stepCard.recommendedStrategy && 
                          stepCard.strategyMode !== 'intelligent';
        return {
          type: hasUpgrade ? 'warning' : 'success',
          message: hasUpgrade 
            ? `💡 发现更优策略：${stepCard.recommendedStrategy?.name}` 
            : '✅ 智能分析完成',
          description: hasUpgrade
            ? `置信度 ${Math.round((stepCard.recommendedStrategy?.confidence || 0) * 100)}% | 建议升级`
            : `已应用最佳策略，共发现 ${stepCard.smartCandidates.length} 个候选`,
          icon: hasUpgrade ? <RocketOutlined /> : <CheckCircleOutlined />,
          showProgress: false,
          actionButton: hasUpgrade ? (
            <Button 
              size="small" 
              type="primary" 
              onClick={onUpgradeStrategy}
            >
              一键升级
            </Button>
          ) : null
        } as const;
        
      case 'analysis_failed':
        return {
          type: 'error' as const,
          message: '❌ 智能分析失败',
          description: '仍可使用默认策略，或重试分析获取更好效果',
          icon: <ExclamationCircleOutlined />,
          showProgress: false,
          actionButton: (
            <Button 
              size="small" 
              icon={<ReloadOutlined />} 
              onClick={onRetryAnalysis}
            >
              重试分析
            </Button>
          )
        };
        
      default:
        return null;
    }
  }, [stepCard, onUpgradeStrategy, onRetryAnalysis, onCancelAnalysis]);

  /**
   * 获取策略模式显示文本
   */
  const getStrategyModeText = (mode: StepCardData['strategyMode']) => {
    switch (mode) {
      case 'intelligent': return '🧠 智能匹配';
      case 'smart_variant': return '⚡ 智能变体';
      case 'static_user': return '🔧 用户静态';
      default: return mode;
    }
  };

  return (
    <Card 
      className={`light-theme-force intelligent-step-card ${className}`}
      size={size}
      title={
        <Space>
          <Text strong>
            {stepIndex ? `步骤 ${stepIndex}` : stepCard.stepName}
          </Text>
          <Tag color="blue">{stepCard.stepType}</Tag>
          {stepCard.activeStrategy && (
            <Tag color="green" icon={<ThunderboltOutlined />}>
              {stepCard.activeStrategy.name}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="查看详情">
            <Button 
              size="small" 
              type="text" 
              icon={<EyeOutlined />}
              onClick={onViewDetails}
            />
          </Tooltip>
          <Tooltip title="设置">
            <Button 
              size="small" 
              type="text" 
              icon={<SettingOutlined />}
              onClick={onViewDetails}
            />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* 分析状态展示区域 */}
        {analysisStatusInfo && (
          <Alert
            type={analysisStatusInfo.type}
            message={analysisStatusInfo.message}
            description={analysisStatusInfo.description}
            icon={analysisStatusInfo.icon}
            showIcon
            action={analysisStatusInfo.actionButton}
            className="mb-3"
          />
        )}

        {/* 分析进度条 */}
        {analysisStatusInfo?.showProgress && (
          <Progress 
            percent={stepCard.analysisProgress} 
            size="small"
            status="active"
            format={() => `${stepCard.analysisProgress}%`}
          />
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* 策略选择区域 */}
        <div>
          <Row justify="space-between" align="middle" className="mb-2">
            <Col>
              <Text strong>策略模式</Text>
            </Col>
            <Col>
              <Tag color={stepCard.strategyMode === 'intelligent' ? 'green' : 'default'}>
                {getStrategyModeText(stepCard.strategyMode)}
              </Tag>
            </Col>
          </Row>

          {/* 当前策略信息 */}
          {stepCard.activeStrategy && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong>{stepCard.activeStrategy.name}</Text>
                  </Col>
                  <Col>
                    <Tag color="blue">
                      置信度: {Math.round(stepCard.activeStrategy.confidence * 100)}%
                    </Tag>
                  </Col>
                </Row>
                
                <Text type="secondary" className="text-sm">
                  {stepCard.activeStrategy.description}
                </Text>

                {/* 如果使用的是fallback策略，显示提示 */}
                {stepCard.activeStrategy === stepCard.fallbackStrategy && (
                  <Alert
                    type="info"
                    message="当前使用默认策略，确保立即可用"
                    description="分析完成后可获得更优策略选择"
                    showIcon={false}
                  />
                )}
              </Space>
            </div>
          )}

          {/* 策略候选选择（分析完成后显示） */}
          {stepCard.analysisState === 'analysis_completed' && stepCard.smartCandidates.length > 0 && (
            <div className="mt-3">
              <Text strong className="block mb-2">可选策略:</Text>
              <Radio.Group 
                value={stepCard.activeStrategy?.key}
                onChange={(e) => onSwitchStrategy?.(e.target.value, true)}
                className="w-full"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {stepCard.smartCandidates.slice(0, 3).map((candidate) => (
                    <Radio 
                      key={candidate.key} 
                      value={candidate.key}
                      className="w-full"
                    >
                      <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                        <Col flex="1">
                          <Space direction="vertical">
                            <Text>{candidate.name}</Text>
                            <Text type="secondary" className="text-xs">
                              {candidate.description}
                            </Text>
                          </Space>
                        </Col>
                        <Col>
                          <Tag color={candidate.confidence > 0.8 ? 'green' : 'blue'}>
                            {Math.round(candidate.confidence * 100)}%
                          </Tag>
                        </Col>
                      </Row>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          )}
        </div>

        {/* 调试信息（开发环境） */}
        {showDebugInfo && (
          <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
            <details>
              <summary>调试信息</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  stepId: stepCard.stepId,
                  selectionHash: stepCard.selectionHash.slice(0, 8) + '...',
                  analysisJobId: stepCard.analysisJobId,
                  strategyMode: stepCard.strategyMode,
                  createdAt: new Date(stepCard.createdAt).toLocaleTimeString(),
                  updatedAt: new Date(stepCard.updatedAt).toLocaleTimeString()
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default IntelligentStepCard;