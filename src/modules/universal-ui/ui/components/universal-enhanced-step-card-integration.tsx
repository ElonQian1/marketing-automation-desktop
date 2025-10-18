// src/modules/universal-ui/ui/components/universal-enhanced-step-card-integration.tsx
// module: universal-ui | layer: ui | role: example
// summary: 展示如何在StepCard中集成所有新组件的示例

import React, { useState } from 'react';
import { Card, Space, Divider, Collapse } from 'antd';
import { ANALYSIS_STATES } from '../../../../shared/constants/events';
import { 
  UniversalFallbackBadge,
  UniversalStrategyCandidatesSection,
  UniversalStrategyModeSelector,
  UniversalAnalysisStatusSection
} from './index';
import type { IntelligentStepCard, StrategyMode } from '../../types/intelligent-analysis-types';

const { Panel } = Collapse;

export interface UniversalEnhancedStepCardIntegrationProps {
  /** 步骤卡片数据 */
  stepCard: IntelligentStepCard;
  /** 应用策略回调 */
  onApplyStrategy: (strategyKey: string) => void;
  /** 模式切换回调 */
  onModeChange: (mode: StrategyMode) => void;
  /** 取消分析回调 */
  onCancelAnalysis: () => void;
  /** 重试分析回调 */
  onRetryAnalysis: () => Promise<void>;
  /** 一键升级回调 */
  onQuickUpgrade: () => Promise<void>;
}

/**
 * 增强步骤卡片集成示例
 * 
 * 🎯 此组件展示如何将所有新组件集成到步骤卡片中：
 * 1. ✅ 顶部状态条 - UniversalAnalysisStatusSection
 * 2. ✅ "暂用兜底"徽标 - UniversalFallbackBadge
 * 3. ✅ 策略模式切换 - UniversalStrategyModeSelector
 * 4. ✅ 候选策略展示 - UniversalStrategyCandidatesSection
 * 
 * 这是一个完整的实现参考，可以直接应用到 StepCardSystem.tsx 中
 */
export const UniversalEnhancedStepCardIntegration: React.FC<UniversalEnhancedStepCardIntegrationProps> = ({
  stepCard,
  onApplyStrategy,
  onModeChange,
  onCancelAnalysis,
  onRetryAnalysis,
  onQuickUpgrade
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 判断是否使用兜底策略
  const isFallbackActive = stepCard.activeStrategy?.key === stepCard.fallbackStrategy.key;
  const isAnalyzing = stepCard.analysisState === 'analyzing' || stepCard.analysisState === 'pending_analysis';

  // 映射分析状态
  const mapAnalysisState = (state: typeof stepCard.analysisState): 'idle' | 'pending' | 'completed' | 'failed' | 'cancelled' => {
    switch (state) {
      case 'idle': return 'idle';
      case 'pending_analysis':
      case 'analyzing': return 'pending';
      case ANALYSIS_STATES.COMPLETED: return 'completed';
      case 'analysis_failed': return 'failed';
      default: return 'idle';
    }
  };

  return (
    <Card
      className="light-theme-force universal-enhanced-step-card"
      style={{
        marginBottom: 16,
        borderColor: 'var(--border-2, #e2e8f0)',
        backgroundColor: 'var(--bg-light-base, #ffffff)'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {/* 1. 顶部分析状态条 */}
        <UniversalAnalysisStatusSection
          analysis={{
            analysisState: mapAnalysisState(stepCard.analysisState), // 映射状态类型
            analysisProgress: stepCard.analysisProgress ? {
              currentStep: Math.floor(stepCard.analysisProgress / 16.67),
              totalSteps: 6,
              stepName: `Step${Math.floor(stepCard.analysisProgress / 16.67)}`,
              stepDescription: '智能分析中...'
            } : undefined,
            recommendedStrategy: stepCard.recommendedStrategy ? {
              ...stepCard.recommendedStrategy,
              // 已经是 StrategyCandidate 类型，直接使用
            } : undefined,
            recommendedConfidence: stepCard.recommendedStrategy?.confidence,
            autoFollowSmart: stepCard.autoFollowSmart
          }}
          actions={{
            onCancelAnalysis,
            onRetryAnalysis,
            onQuickUpgrade,
            onViewAnalysisDetails: () => setShowAdvanced(true),
            onApplyRecommended: async () => {
              if (stepCard.recommendedStrategy) {
                onApplyStrategy(stepCard.recommendedStrategy.key);
              }
            }
          }}
          size="default"
        />

        {/* 2. 步骤信息头部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <h4 style={{ margin: 0, color: 'var(--text-1, #1e293b)' }}>
              {stepCard.stepName}
            </h4>
            
            {/* "暂用兜底"徽标 */}
            <UniversalFallbackBadge
              isFallbackActive={isFallbackActive}
              fallbackName={stepCard.fallbackStrategy.name}
              isAnalyzing={isAnalyzing}
              size="default"
            />
          </Space>

          <div style={{ fontSize: 12, color: 'var(--text-3, #64748b)' }}>
            {stepCard.stepType}
          </div>
        </div>

        {/* 当前激活策略信息 */}
        {stepCard.activeStrategy && (
          <div 
            className="light-theme-force"
            style={{ 
              padding: 8, 
              background: 'var(--bg-1, #f8fafc)', 
              borderRadius: 4,
              fontSize: 12
            }}
          >
            <div style={{ color: 'var(--text-3, #64748b)' }}>
              当前策略：
              <span style={{ 
                marginLeft: 4, 
                color: 'var(--text-1, #1e293b)', 
                fontWeight: 500 
              }}>
                {stepCard.activeStrategy.name}
              </span>
              {stepCard.activeStrategy.confidence && (
                <span style={{ marginLeft: 8, color: 'var(--text-3, #64748b)' }}>
                  置信度: {Math.round(stepCard.activeStrategy.confidence * 100)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* 高级选项折叠面板 */}
        <Collapse 
          ghost 
          activeKey={showAdvanced ? ['advanced'] : []}
          onChange={(keys) => setShowAdvanced((keys as string[]).includes('advanced'))}
        >
          <Panel 
            header="高级选项（策略模式与候选列表）" 
            key="advanced"
            className="light-theme-force"
          >
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              {/* 3. 策略模式切换器 */}
              <div>
                <Divider orientation="left" style={{ margin: '0 0 12px 0' }}>
                  策略模式
                </Divider>
                <UniversalStrategyModeSelector
                  currentMode={stepCard.strategyMode}
                  onModeChange={onModeChange}
                  smartCandidates={stepCard.smartCandidates}
                  userStrategies={stepCard.staticCandidates.filter(
                    c => c.variant === 'index_fallback'
                  )}
                  displayMode="detailed"
                />
              </div>

              {/* 4. 候选策略展示区 */}
              {stepCard.analysisState === ANALYSIS_STATES.COMPLETED && stepCard.smartCandidates.length > 0 && (
                <UniversalStrategyCandidatesSection
                  smartCandidates={stepCard.smartCandidates}
                  staticCandidates={stepCard.staticCandidates}
                  activeStrategyKey={stepCard.activeStrategy?.key || ''}
                  recommendedKey={stepCard.recommendedStrategy?.key}
                  onApplyStrategy={onApplyStrategy}
                  onViewDetails={(strategy) => {
                    console.log('查看策略详情:', strategy);
                  }}
                  maxCandidates={3}
                  showStaticCandidates={stepCard.strategyMode === 'static_user'}
                />
              )}
            </Space>
          </Panel>
        </Collapse>

        {/* 元素信息（可选） */}
        {stepCard.elementContext && (
          <div 
            className="light-theme-force"
            style={{ 
              padding: 8, 
              background: 'var(--bg-1, #f8fafc)', 
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--text-3, #64748b)'
            }}
          >
            <div>元素: {stepCard.elementContext.elementText || stepCard.elementContext.elementPath}</div>
            {stepCard.elementContext.snapshotId && (
              <div>快照: {stepCard.elementContext.snapshotId}</div>
            )}
          </div>
        )}
      </Space>

      {/* 样式 */}
      <style>{`
        .universal-enhanced-step-card {
          transition: box-shadow 0.3s ease;
        }
        
        .universal-enhanced-step-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </Card>
  );
};

export default UniversalEnhancedStepCardIntegration;
