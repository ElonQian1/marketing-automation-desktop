// src/modules/universal-ui/ui/components/AnalysisStatusSection.tsx
// module: universal-ui | layer: ui | role: component
// summary: 步骤卡片中的分析状态展示区域

import React from 'react';
import { Space, Button, Progress, Alert, Tag, Typography, Tooltip } from 'antd';
import { 
  ThunderboltOutlined, 
  LoadingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  TrophyOutlined,
  EyeOutlined,
  UpOutlined,
  StopOutlined,
  RedoOutlined
} from '@ant-design/icons';
import type { StepCardAnalysisData, StepCardAnalysisActions } from '../types/AnalysisStepCard';

const { Text } = Typography;

interface AnalysisStatusSectionProps {
  analysis: StepCardAnalysisData;
  actions: StepCardAnalysisActions;
  size?: 'small' | 'default';
}

/**
 * 分析状态展示区域
 * 根据不同的分析状态显示对应的UI和操作按钮
 */
export const AnalysisStatusSection: React.FC<AnalysisStatusSectionProps> = ({
  analysis,
  actions,
  size = 'default'
}) => {
  const { analysisState, analysisProgress, recommendedStrategy, recommendedConfidence } = analysis;
  const buttonSize = size === 'small' ? 'small' : 'middle';

  // 空闲状态 - 不显示任何内容
  if (analysisState === 'idle') {
    return null;
  }

  // 分析中状态
  if (analysisState === 'pending') {
    return (
      <div style={{ 
        background: 'var(--bg-1, #f8fafc)',
        border: '1px solid var(--border-2, #e2e8f0)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16 
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <LoadingOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ fontSize: 13 }}>智能分析进行中</Text>
            </Space>
            <Button 
              size={buttonSize} 
              type="text" 
              icon={<StopOutlined />}
              onClick={actions.onCancelAnalysis}
            >
              停止
            </Button>
          </div>
          
          {analysisProgress && (
            <>
              <Progress 
                percent={Math.round((analysisProgress.currentStep / analysisProgress.totalSteps) * 100)}
                size="small"
                strokeColor="#1890ff"
                showInfo={false}
              />
              <Text style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }}>
                步骤 {analysisProgress.currentStep}/{analysisProgress.totalSteps}
              </Text>
            </>
          )}
        </Space>
      </div>
    );
  }

  // 分析完成状态
  if (analysisState === 'completed' && recommendedStrategy) {
    const isHighConfidence = (recommendedConfidence || 0) >= 82;
    
    return (
      <div style={{ 
        background: isHighConfidence ? 'var(--success-bg, #f6ffed)' : 'var(--warning-bg, #fffbe6)',
        border: `1px solid ${isHighConfidence ? 'var(--success-border, #b7eb8f)' : 'var(--warning-border, #ffe58f)'}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16 
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <TrophyOutlined style={{ color: isHighConfidence ? '#52c41a' : '#faad14' }} />
              <Text strong style={{ fontSize: 13 }}>
                发现{isHighConfidence ? '推荐' : '可选'}策略
              </Text>
              <Tag color={isHighConfidence ? 'success' : 'warning'}>
                {recommendedConfidence}% 置信度
              </Tag>
            </Space>
          </div>
          
          <Text style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }}>
            {recommendedStrategy.name}: {recommendedStrategy.description}
          </Text>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button 
              size={buttonSize}
              type={isHighConfidence ? 'primary' : 'default'}
              icon={<UpOutlined />}
              onClick={actions.onQuickUpgrade}
            >
              {isHighConfidence ? '一键升级' : '应用策略'}
            </Button>
            <Button 
              size={buttonSize}
              icon={<EyeOutlined />}
              onClick={actions.onViewAnalysisDetails}
            >
              查看详情
            </Button>
          </div>
        </Space>
      </div>
    );
  }

  // 分析失败状态
  if (analysisState === 'failed') {
    return (
      <Alert
        type="warning"
        showIcon
        message="智能分析失败"
        description="无法生成智能策略，将使用默认策略"
        style={{ marginBottom: 16 }}
        action={
          <Button 
            size={buttonSize}
            type="text" 
            icon={<RedoOutlined />}
            onClick={actions.onRetryAnalysis}
          >
            重试
          </Button>
        }
      />
    );
  }

  // 分析取消状态
  if (analysisState === 'cancelled') {
    return (
      <Alert
        type="info"
        showIcon
        message="智能分析已取消"
        description="正在使用默认策略"
        style={{ marginBottom: 16 }}
      />
    );
  }

  return null;
};

export default AnalysisStatusSection;