// src/modules/universal-ui/ui/components/universal-strategy-candidates-section.tsx
// module: universal-ui | layer: ui | role: component
// summary: 智能候选策略展示区，显示 Top-N 候选策略及详情

import React, { useState } from 'react';
import { Space, Card, Button, Tag, Typography, Divider, Collapse, Tooltip, Progress } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  EyeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { StrategyCandidate } from '../../types/intelligent-analysis-types';

const { Text } = Typography;
const { Panel } = Collapse;

export interface UniversalStrategyCandidatesSectionProps {
  /** 智能候选策略列表 */
  smartCandidates: StrategyCandidate[];
  /** 静态候选策略列表 */
  staticCandidates?: StrategyCandidate[];
  /** 当前激活的策略键名 */
  activeStrategyKey: string;
  /** 推荐策略键名 */
  recommendedKey?: string;
  /** 应用策略回调 */
  onApplyStrategy: (strategyKey: string) => void;
  /** 查看策略详情回调 */
  onViewDetails?: (strategy: StrategyCandidate) => void;
  /** 最多显示候选数量（默认3） */
  maxCandidates?: number;
  /** 是否显示静态候选 */
  showStaticCandidates?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 智能候选策略展示区组件
 * 
 * 🎯 功能：
 * - 展示 Top-N 智能候选策略（默认Top-3）
 * - 显示每个候选的分数、命中数、理由、预览
 * - 支持"应用此策略"操作
 * - 支持查看详细信息
 * - 符合文档7要求：候选区（分析完成后显示）
 * 
 * @example
 * ```tsx
 * <UniversalStrategyCandidatesSection
 *   smartCandidates={stepCard.smartCandidates}
 *   activeStrategyKey={stepCard.activeStrategy.key}
 *   recommendedKey={stepCard.recommendedStrategy?.key}
 *   onApplyStrategy={handleApply}
 * />
 * ```
 */
export const UniversalStrategyCandidatesSection: React.FC<UniversalStrategyCandidatesSectionProps> = ({
  smartCandidates,
  staticCandidates = [],
  activeStrategyKey,
  recommendedKey,
  onApplyStrategy,
  onViewDetails,
  maxCandidates = 3,
  showStaticCandidates = false,
  style,
  className = ''
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 如果没有候选策略，不显示
  if (smartCandidates.length === 0 && staticCandidates.length === 0) {
    return null;
  }

  // 获取Top-N候选
  const topSmartCandidates = smartCandidates
    .slice(0, maxCandidates)
    .sort((a, b) => b.confidence - a.confidence);

  /**
   * 渲染单个候选策略卡片
   */
  const renderCandidateCard = (candidate: StrategyCandidate, index: number, type: 'smart' | 'static') => {
    const isActive = candidate.key === activeStrategyKey;
    const isRecommended = candidate.key === recommendedKey;
    const confidence = Math.round(candidate.confidence * 100);

    return (
      <Card
        key={candidate.key}
        size="small"
        className={`light-theme-force ${isActive ? 'candidate-card-active' : ''}`}
        style={{
          marginBottom: 8,
          borderColor: isActive ? 'var(--primary, #1890ff)' : 'var(--border-2, #e2e8f0)',
          backgroundColor: isActive ? 'var(--primary-bg-hover, #e6f7ff)' : 'var(--bg-light-base, #ffffff)',
          boxShadow: isActive ? '0 2px 8px rgba(24, 144, 255, 0.2)' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* 左侧：策略信息 */}
          <Space direction="vertical" size={4} style={{ flex: 1 }}>
            {/* 标题行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* 排名徽章 */}
              {type === 'smart' && index < 3 && (
                <Tag 
                  color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}
                  className="light-theme-force"
                  style={{ fontSize: 11, margin: 0 }}
                >
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} Step{index + 1}
                </Tag>
              )}

              {/* 推荐标识 */}
              {isRecommended && (
                <Tag 
                  icon={<ThunderboltOutlined />} 
                  color="success"
                  className="light-theme-force"
                  style={{ fontSize: 11, margin: 0 }}
                >
                  推荐
                </Tag>
              )}

              {/* 策略名称 */}
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #1e293b)' }}>
                {candidate.name}
              </Text>

              {/* 置信度分数 */}
              <Tag 
                color={confidence >= 82 ? 'success' : confidence >= 65 ? 'warning' : 'default'}
                className="light-theme-force"
                style={{ fontSize: 11, margin: 0 }}
              >
                {confidence}分
              </Tag>
            </div>

            {/* 描述 */}
            <Text 
              type="secondary" 
              style={{ 
                fontSize: 12, 
                display: 'block',
                color: 'var(--text-3, #64748b)'
              }}
            >
              {candidate.description}
            </Text>

            {/* 置信度进度条 */}
            <Progress 
              percent={confidence} 
              size="small" 
              strokeColor={
                confidence >= 82 ? '#52c41a' : 
                confidence >= 65 ? '#faad14' : 
                '#d9d9d9'
              }
              showInfo={false}
              style={{ marginTop: 4 }}
            />
          </Space>

          {/* 右侧：操作按钮 */}
          <Space direction="vertical" size={4}>
            {isActive ? (
              <Tag 
                icon={<CheckCircleOutlined />} 
                color="success"
                className="light-theme-force"
                style={{ margin: 0 }}
              >
                当前策略
              </Tag>
            ) : (
              <Button
                type={isRecommended ? 'primary' : 'default'}
                size="small"
                onClick={() => onApplyStrategy(candidate.key)}
                style={{ minWidth: 80 }}
              >
                应用此策略
              </Button>
            )}

            {onViewDetails && (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(candidate)}
                style={{ padding: '0 4px', fontSize: 12 }}
              >
                详情
              </Button>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div className={`light-theme-force ${className}`} style={style}>
      <Divider orientation="left" style={{ margin: '12px 0' }}>
        <Space size={4}>
          <TrophyOutlined style={{ color: 'var(--primary, #1890ff)' }} />
          <Text strong style={{ fontSize: 13, color: 'var(--text-1, #1e293b)' }}>
            智能候选策略
          </Text>
          <Tooltip title="基于智能分析生成的候选策略，按置信度排序">
            <InfoCircleOutlined style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }} />
          </Tooltip>
        </Space>
      </Divider>

      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* 智能候选列表 */}
        {topSmartCandidates.map((candidate, index) => 
          renderCandidateCard(candidate, index, 'smart')
        )}

        {/* 显示更多按钮 */}
        {smartCandidates.length > maxCandidates && (
          <Collapse 
            ghost 
            activeKey={expandedKeys}
            onChange={(keys) => setExpandedKeys(keys as string[])}
          >
            <Panel 
              header={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  查看更多候选策略 ({smartCandidates.length - maxCandidates} 个)
                </Text>
              } 
              key="more"
              className="light-theme-force"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {smartCandidates.slice(maxCandidates).map((candidate, index) => 
                  renderCandidateCard(candidate, index + maxCandidates, 'smart')
                )}
              </Space>
            </Panel>
          </Collapse>
        )}

        {/* 静态候选列表（可选） */}
        {showStaticCandidates && staticCandidates.length > 0 && (
          <>
            <Divider orientation="left" style={{ margin: '12px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                兜底策略
              </Text>
            </Divider>
            {staticCandidates.map((candidate, index) => 
              renderCandidateCard(candidate, index, 'static')
            )}
          </>
        )}
      </Space>

      {/* 内联样式（用于激活状态） */}
      <style>{`
        .candidate-card-active {
          animation: card-pulse 2s ease-in-out infinite;
        }
        
        @keyframes card-pulse {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
          }
          50% {
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);
          }
        }
      `}</style>
    </div>
  );
};

export default UniversalStrategyCandidatesSection;
