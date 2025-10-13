// src/modules/universal-ui/ui/components/universal-smart-step-card.tsx
// module: universal-ui | layer: ui | role: component
// summary: 支持智能分析工作流的增强步骤卡片

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Space, 
  Typography, 
  Button, 
  Progress, 
  Alert, 
  Tag, 
  Divider,
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
  EyeOutlined,
  RocketOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { UniversalAnalysisStatusSection } from './universal-analysis-status-section';
import { universalUseStepCardAnalysis } from '../hooks/universal-use-step-card-analysis';
import type { 
  UniversalStepCardAnalysisData,
  UniversalStepCardAnalysisActions,
  AnalysisStepState
} from '../types/universal-analysis-step-card';

const { Text, Title } = Typography;

/**
 * 智能分析步骤状态
 */
export type SmartStepAnalysisState = 
  | 'idle'              // 未开始分析
  | 'analyzing'         // 智能分析中
  | 'analyzed'          // 分析完成
  | 'upgrade_available' // 有更优策略可升级
  | 'failed'           // 分析失败
  | 'expired';         // 分析过期

/**
 * 策略模式
 */
export type StrategyMode = 
  | 'intelligent'      // 智能匹配（推荐）
  | 'smart_variant'    // 智能-单步固定
  | 'static_user';     // 用户自建静态

/**
 * 策略候选项
 */
export interface StrategyCandidate {
  key: string;
  name: string;
  confidence: number;
  description: string;
  variant: 'self_anchor' | 'child_driven' | 'region_scoped' | 'neighbor_relative' | 'index_fallback';
  enabled: boolean;
}

/**
 * 智能步骤卡片属性
 */
export interface UniversalSmartStepCardProps {
  /** 步骤ID */
  stepId: string;
  /** 步骤名称 */
  stepName: string;
  /** 步骤类型 */
  stepType: string;
  /** 当前策略模式 */
  strategyMode: StrategyMode;
  /** 分析状态 */
  analysisState: SmartStepAnalysisState;
  /** 分析进度 0-100 */
  analysisProgress?: number;
  /** 分析作业ID */
  analysisJobId?: string;
  /** 推荐策略 */
  recommendedStrategy?: StrategyCandidate;
  /** 推荐置信度 */
  recommendedConfidence?: number;
  /** 策略候选列表 */
  strategyCandidates?: StrategyCandidate[];
  /** 当前选中的策略 */
  activeStrategy?: StrategyCandidate;
  /** 是否自动跟随智能推荐 */
  autoFollowSmart?: boolean;
  /** 卡片大小 */
  size?: 'small' | 'default';
  /** 自定义类名 */
  className?: string;
  
  // 事件回调
  /** 启动智能分析 */
  onStartAnalysis?: () => void;
  /** 取消分析 */
  onCancelAnalysis?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 应用推荐策略 */
  onApplyRecommended?: () => void;
  /** 切换策略模式 */
  onSwitchMode?: (mode: StrategyMode) => void;
  /** 选择策略候选 */
  onSelectCandidate?: (candidate: StrategyCandidate) => void;
  /** 查看策略详情 */
  onViewStrategyDetails?: () => void;
  /** 一键升级 */
  onQuickUpgrade?: () => void;
}

/**
 * 智能分析步骤卡片组件
 * 支持完整的智能分析工作流状态管理
 */
export const UniversalSmartStepCard: React.FC<UniversalSmartStepCardProps> = ({
  stepId,
  stepName,
  stepType,
  strategyMode,
  analysisState,
  analysisProgress = 0,
  analysisJobId,
  recommendedStrategy,
  recommendedConfidence,
  strategyCandidates = [],
  activeStrategy,
  autoFollowSmart = true,
  size = 'default',
  className = '',
  onStartAnalysis,
  onCancelAnalysis,
  onRetryAnalysis,
  onApplyRecommended,
  onSwitchMode,
  onSelectCandidate,
  onViewStrategyDetails,
  onQuickUpgrade
}) => {
  const [showCandidates, setShowCandidates] = useState(false);
  
  // 状态分析Hook
  const { analysis, actions } = universalUseStepCardAnalysis();

  /**
   * 获取分析状态显示信息
   */
  const getAnalysisStatusInfo = useCallback(() => {
    switch (analysisState) {
      case 'analyzing':
        return {
          type: 'info' as const,
          message: '智能分析进行中...',
          description: `分析进度 ${analysisProgress}% | 预计还需 ${Math.max(1, Math.ceil((100 - analysisProgress) / 30))}s`,
          icon: <LoadingOutlined />,
          showProgress: true
        };
      case 'analyzed':
        return {
          type: 'success' as const,
          message: '智能分析完成',
          description: `发现 ${strategyCandidates.length} 个策略候选`,
          icon: <CheckCircleOutlined />,
          showProgress: false
        };
      case 'upgrade_available':
        return {
          type: 'warning' as const,
          message: `发现更优策略：${recommendedStrategy?.name}`,
          description: `置信度 ${recommendedConfidence}% | 建议升级`,
          icon: <RocketOutlined />,
          showProgress: false
        };
      case 'failed':
        return {
          type: 'error' as const,
          message: '智能分析失败',
          description: '分析超时或上下文不足',
          icon: <ExclamationCircleOutlined />,
          showProgress: false
        };
      case 'expired':
        return {
          type: 'warning' as const,
          message: '分析可能过期',
          description: '快照或环境可能已变化',
          icon: <ExclamationCircleOutlined />,
          showProgress: false
        };
      default:
        return null;
    }
  }, [analysisState, analysisProgress, strategyCandidates.length, recommendedStrategy, recommendedConfidence]);

  /**
   * 获取策略模式显示文本
   */
  const getStrategyModeText = (mode: StrategyMode) => {
    switch (mode) {
      case 'intelligent': return '智能匹配（推荐）';
      case 'smart_variant': return '智能-单步固定';
      case 'static_user': return '用户自建静态';
      default: return mode;
    }
  };

  /**
   * 获取策略变体显示文本
   */
  const getVariantText = (variant: StrategyCandidate['variant']) => {
    switch (variant) {
      case 'self_anchor': return '自我锚点';
      case 'child_driven': return '子树锚点';
      case 'region_scoped': return '区域限定';
      case 'neighbor_relative': return '邻居相对';
      case 'index_fallback': return '索引回退';
      default: return variant;
    }
  };

  const statusInfo = getAnalysisStatusInfo();

  return (
    <Card 
      className={`light-theme-force universal-smart-step-card ${className}`}
      size={size}
      title={
        <Space>
          <Text strong>{stepName}</Text>
          <Tag color="blue">{stepType}</Tag>
        </Space>
      }
      extra={
        <Space>
          {analysisState === 'analyzing' && (
            <Button 
              size="small" 
              type="text" 
              icon={<LoadingOutlined />}
              onClick={onCancelAnalysis}
            >
              取消分析
            </Button>
          )}
          <Button 
            size="small" 
            type="text" 
            icon={<SettingOutlined />}
            onClick={onViewStrategyDetails}
          >
            详情
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* 分析状态区域 */}
        {statusInfo && (
          <Alert
            type={statusInfo.type}
            message={statusInfo.message}
            description={statusInfo.description}
            icon={statusInfo.icon}
            showIcon
            action={(() => {
              switch (analysisState) {
                case 'analyzing':
                  return null; // 分析中不显示操作按钮
                case 'upgrade_available':
                  return (
                    <Button size="small" type="primary" onClick={onQuickUpgrade}>
                      一键升级
                    </Button>
                  );
                case 'failed':
                case 'expired':
                  return (
                    <Button size="small" icon={<ReloadOutlined />} onClick={onRetryAnalysis}>
                      重新分析
                    </Button>
                  );
                default:
                  return null;
              }
            })()}
          />
        )}

        {/* 分析进度条 */}
        {statusInfo?.showProgress && (
          <Progress 
            percent={analysisProgress} 
            size="small"
            status={analysisState === 'analyzing' ? 'active' : 'normal'}
          />
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* 策略选择区域 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            <ThunderboltOutlined /> 策略模式
          </Text>
          
          {/* 智能匹配模式 */}
          <div style={{ 
            background: strategyMode === 'intelligent' ? 'var(--primary-1, #e6f7ff)' : 'transparent',
            border: `1px solid ${strategyMode === 'intelligent' ? 'var(--primary-color, #1890ff)' : 'var(--border-2, #e2e8f0)'}`,
            borderRadius: 6,
            padding: 12,
            marginBottom: 12
          }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <strong>● 智能匹配（推荐）</strong>
                  {recommendedStrategy && (
                    <Tag color="green">
                      推荐：{getVariantText(recommendedStrategy.variant)}（{recommendedConfidence}%）
                    </Tag>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button 
                    size="small" 
                    type="link" 
                    onClick={() => setShowCandidates(!showCandidates)}
                  >
                    查看候选链
                  </Button>
                  {recommendedStrategy && (
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={onApplyRecommended}
                    >
                      使用推荐
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </div>

          {/* 候选策略列表 */}
          {showCandidates && strategyCandidates.length > 0 && (
            <div style={{ 
              background: 'var(--bg-2, #f8fafc)',
              border: '1px solid var(--border-2, #e2e8f0)',
              borderRadius: 6,
              padding: 12
            }}>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                策略候选（智能-单步固定）
              </Text>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
                提示：单步固定不回退，失败会直接报错
              </Text>
              <Space direction="vertical" style={{ width: '100%' }}>
                {strategyCandidates.map((candidate, index) => (
                  <div 
                    key={candidate.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: candidate.key === activeStrategy?.key ? 'var(--primary-1, #e6f7ff)' : 'white',
                      border: `1px solid ${candidate.key === activeStrategy?.key ? 'var(--primary-color, #1890ff)' : 'var(--border-3, #f0f0f0)'}`,
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => onSelectCandidate?.(candidate)}
                  >
                    <Space>
                      <Text>Step{index + 1}</Text>
                      <Text>{getVariantText(candidate.variant)}</Text>
                      <Tag color={candidate.confidence >= 80 ? 'green' : candidate.confidence >= 60 ? 'orange' : 'red'}>
                        {candidate.confidence}分
                      </Tag>
                    </Space>
                    {candidate.key === activeStrategy?.key && (
                      <CheckCircleOutlined style={{ color: 'var(--primary-color, #1890ff)' }} />
                    )}
                  </div>
                ))}
              </Space>
            </div>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 操作按钮区域 */}
        <Row justify="space-between">
          <Col>
            <Space>
              {analysisState === 'idle' && (
                <Button 
                  type="primary" 
                  icon={<ThunderboltOutlined />}
                  onClick={onStartAnalysis}
                >
                  开始智能分析
                </Button>
              )}
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={onViewStrategyDetails}
              >
                查看详情
              </Button>
            </Space>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>
              作业ID: {analysisJobId || '未开始'}
            </Text>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default UniversalSmartStepCard;