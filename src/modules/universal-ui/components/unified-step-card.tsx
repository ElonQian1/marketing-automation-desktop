// src/modules/universal-ui/components/unified-step-card.tsx  
// module: universal-ui | layer: components | role: unified-component
// summary: 统一的步骤卡片组件，合并智能分析和通用功能，支持状态驱动渲染

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
  Col,
  Switch
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
 * 统一步骤卡片属性
 * 根据文档要求：补齐状态与字段，不要新起版本组件
 */
export interface UnifiedStepCardProps {
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
  /** 是否可编辑（兼容旧版） */
  editable?: boolean;
  /** 是否显示模式切换开关 */
  showModeSwitch?: boolean;
  
  // 智能分析相关回调
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
  
  // 通用功能回调（兼容旧版）
  /** 策略模式变更 */
  onModeChange?: (mode: 'intelligent' | 'manual') => void;
  /** 手动策略编辑 */
  onManualEdit?: (strategy: string) => void;
}

/**
 * 统一的步骤卡片组件
 * 
 * 🎯 设计理念（来自文档7步骤卡片联动.md）：
 * 1. 🚀 默认值优先：立即可用，分析后台进行
 * 2. 🔄 状态驱动：清晰展示分析进度和结果
 * 3. ⚡ 智能升级：分析完成后提供一键升级选项
 * 4. 🛡️ 防串扰：基于selection_hash确保结果正确关联
 * 5. 📦 不做大改版：在现有组件基础上补齐状态与字段
 */
export const UnifiedStepCard: React.FC<UnifiedStepCardProps> = ({
  stepCard,
  stepIndex,
  size = 'default',
  className = '',
  showDebugInfo = false,
  showModeSwitch = false,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy,
  onViewDetails,
  onCancelAnalysis,
  onModeChange
}) => {
  
  /**
   * 获取顶部状态条信息（按文档要求的analysis_state呈现）
   */
  const topStatusBar = useMemo(() => {
    switch (stepCard.analysisState) {
      case 'analyzing':
        return {
          type: 'info' as const,
          message: '智能分析进行中...',
          description: `${stepCard.analysisProgress}%｜预计 2s（**暂用兜底策略**可执行）`,
          icon: <LoadingOutlined />,
          color: 'blue',
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
                          stepCard.strategyMode !== 'intelligent' &&
                          (stepCard.recommendedStrategy.confidence >= 0.82);
        return hasUpgrade ? {
          type: 'warning' as const,
          message: `发现更优策略：${stepCard.recommendedStrategy?.name}`,
          description: `（${Math.round((stepCard.recommendedStrategy?.confidence || 0) * 100)}%）｜**一键升级**`,
          icon: <RocketOutlined />,
          color: 'orange',
          showProgress: false,
          actionButton: (
            <Button 
              size="small" 
              type="primary" 
              icon={<RocketOutlined />}
              onClick={onUpgradeStrategy}
            >
              一键升级
            </Button>
          )
        } : {
          type: 'success' as const,
          message: '智能分析完成',
          description: `已应用最佳策略，共发现 ${stepCard.smartCandidates.length} 个候选`,
          icon: <CheckCircleOutlined />,
          color: 'green',
          showProgress: false,
          actionButton: null
        };
        
      case 'analysis_failed':
        return {
          type: 'error' as const,
          message: '智能分析失败：超时/上下文不足',
          description: '｜**重试分析**',
          icon: <ExclamationCircleOutlined />,
          color: 'red',
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
        
      case 'analysis_stale':
        return {
          type: 'warning' as const,
          message: '分析可能过期（快照/环境变化）',
          description: '｜**重新分析**',
          icon: <ExclamationCircleOutlined />,
          color: 'orange',
          showProgress: false,
          actionButton: (
            <Button 
              size="small" 
              icon={<ReloadOutlined />} 
              onClick={onRetryAnalysis}
            >
              重新分析
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
      case 'intelligent': return '🧠 智能匹配（组合）';
      case 'smart_variant': return '⚡ 智能-单步固定';
      case 'static_user': return '🔧 用户自建静态';
      default: return mode;
    }
  };

  /**
   * 是否显示兜底徽标
   */
  const showFallbackBadge = stepCard.activeStrategy === stepCard.fallbackStrategy;

  return (
    <Card 
      className={`light-theme-force unified-step-card ${className}`}
      size={size}
      title={
        <Space>
          <Text strong>
            {stepIndex ? `步骤 ${stepIndex}` : stepCard.stepName}
          </Text>
          <Tag color="blue">{stepCard.stepType}</Tag>
          {stepCard.activeStrategy && (
            <Tag 
              color={showFallbackBadge ? "orange" : "green"} 
              icon={<ThunderboltOutlined />}
            >
              {stepCard.activeStrategy.name}
              {showFallbackBadge && " (暂用兜底)"}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          {showModeSwitch && (
            <Tooltip title="智能/手动模式切换">
              <Switch
                size="small"
                checked={stepCard.strategyMode === 'intelligent'}
                onChange={(checked) => onModeChange?.(checked ? 'intelligent' : 'manual')}
                checkedChildren="智能"
                unCheckedChildren="手动"
              />
            </Tooltip>
          )}
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
        
        {/* 顶部状态条（按文档要求的analysis_state呈现） */}
        {topStatusBar && (
          <Alert
            type={topStatusBar.type}
            message={topStatusBar.message}
            description={topStatusBar.description}
            icon={topStatusBar.icon}
            showIcon
            action={topStatusBar.actionButton}
            className="mb-3"
          />
        )}

        {/* 分析进度条 */}
        {topStatusBar?.showProgress && (
          <Progress 
            percent={stepCard.analysisProgress} 
            size="small"
            status="active"
            format={() => `${stepCard.analysisProgress}%`}
          />
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* 主体信息区 */}
        <div>
          <Row justify="space-between" align="middle" className="mb-2">
            <Col>
              <Text strong>匹配模式</Text>
            </Col>
            <Col>
              <Tag color={stepCard.strategyMode === 'intelligent' ? 'green' : 'default'}>
                {getStrategyModeText(stepCard.strategyMode)}
              </Tag>
            </Col>
          </Row>

          {/* 当前激活策略 */}
          {stepCard.activeStrategy && (
            <div className="p-3 bg-gray-50 rounded-lg mb-3">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong>{stepCard.activeStrategy.name}</Text>
                    {showFallbackBadge && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>
                        暂用兜底
                      </Tag>
                    )}
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

                {/* 兜底策略提示 */}
                {showFallbackBadge && (
                  <Alert
                    type="info"
                    message="当前使用兜底策略，确保立即可用"
                    description="智能分析完成后可获得更优策略选择"
                    showIcon={false}
                  />
                )}
              </Space>
            </div>
          )}

          {/* 推荐策略显示（智能匹配模式） */}
          {stepCard.strategyMode === 'intelligent' && stepCard.recommendedStrategy && (
            <div className="mb-3">
              <Text strong className="block mb-2">推荐：</Text>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text>{stepCard.recommendedStrategy.name}</Text>
                  </Col>
                  <Col>
                    <Tag color="green">
                      {Math.round(stepCard.recommendedStrategy.confidence * 100)}%
                    </Tag>
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {/* 候选区（分析完成后显示） */}
          {stepCard.analysisState === 'analysis_completed' && stepCard.smartCandidates.length > 0 && (
            <div className="mt-3">
              <Text strong className="block mb-2">可选策略 (Top-3):</Text>
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

          {/* 行为开关 */}
          <div className="mt-3">
            <Row justify="space-between" align="middle">
              <Col>
                <Text>智能跟随</Text>
              </Col>
              <Col>
                <Switch
                  size="small"
                  checked={stepCard.autoFollowSmart}
                  onChange={() => {
                    // TODO: 实现智能跟随开关功能
                  }}
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* 来源信息 */}
        <div className="mt-3 text-xs text-gray-500">
          <Row justify="space-between">
            <Col>元素: {stepCard.elementContext?.elementText || '未知'}</Col>
            <Col>快照: {new Date(stepCard.createdAt).toLocaleTimeString()}</Col>
          </Row>
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
                  analysisState: stepCard.analysisState,
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

export default UnifiedStepCard;