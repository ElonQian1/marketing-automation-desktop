// src/components/strategy-selector/StrategySelector.tsx
// module: ui | layer: ui | role: 步骤卡片内嵌策略选择器
// summary: 智能策略选择器，支持自动链、单步、静态策略三种模式

import React, { useState, useEffect } from 'react';
import { 
  StrategySelector as IStrategySelector, 
  StrategyCandidate, 
  StrategyEvents, 
  StrategyType,
  SmartStep 
} from '../../types/strategySelector';

// 设计基准 - 继承步骤卡片的设计系统
const STRATEGY_DESIGN_TOKENS = {
  colors: {
    bg: {
      primary: '#1E293B',
      secondary: '#334155', 
      accent: '#0F172A',
      success: 'rgba(16, 185, 129, 0.1)',
      warning: 'rgba(245, 158, 11, 0.1)',
      error: 'rgba(239, 68, 68, 0.1)',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#E2E8F0',
      muted: '#CBD5E1',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    border: {
      default: '#334155',
      hover: '#7A9BFF',
      active: '#6E8BFF',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
  },
  typography: {
    fontSize: {
      xs: '10px',
      sm: '12px',
      base: '14px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
    }
  },
  animations: {
    duration: '120ms',
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
  }
};

interface StrategyTypeOption {
  type: StrategyType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const STRATEGY_TYPES: StrategyTypeOption[] = [
  {
    type: 'smart-auto',
    label: '智能·自动链',
    icon: '🧠',
    description: 'Step1→Step6 动态决策，自动回退兜底',
    color: '#6E8BFF'
  },
  {
    type: 'smart-single', 
    label: '智能·单步',
    icon: '🎯',
    description: '指定某一步强制使用',
    color: '#10B981'
  },
  {
    type: 'static',
    label: '静态策略',
    icon: '📌',
    description: '用户保存/自建的固定策略',
    color: '#F59E0B'
  }
];

const SMART_STEPS: { step: SmartStep; label: string }[] = [
  { step: 'step1', label: 'Step1 - 基础识别' },
  { step: 'step2', label: 'Step2 - 属性匹配' },
  { step: 'step3', label: 'Step3 - 结构分析' },
  { step: 'step4', label: 'Step4 - 语义理解' },
  { step: 'step5', label: 'Step5 - 上下文推理' },
  { step: 'step6', label: 'Step6 - 全局索引' },
];

interface StrategySelector_Props {
  selector: IStrategySelector;
  events: StrategyEvents;
  compact?: boolean;  // 紧凑模式
  disabled?: boolean; // 禁用状态
}

const StrategySelector: React.FC<StrategySelector_Props> = ({
  selector,
  events,
  compact = false,
  disabled = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);

  // 获取推荐策略
  const recommendedCandidate = selector.recommended ? 
    [...(selector.candidates?.smart ?? []), ...(selector.candidates?.static ?? [])]
      .find(c => c.key === selector.recommended?.key) : null;

  // 处理策略类型切换
  const handleStrategyTypeChange = (type: StrategyType) => {
    events.onStrategyChange({ type });
  };

  // 处理智能单步选择
  const handleSmartStepChange = (stepName: SmartStep) => {
    events.onStrategyChange({ 
      type: 'smart-single', 
      stepName 
    });
  };

  // 处理具体策略选择
  const handleCandidateSelect = (candidate: StrategyCandidate) => {
    events.onStrategyChange({
      type: candidate.type === 'smart' ? 'smart-auto' : 'static',
      key: candidate.key
    });
    setShowCandidates(false);
  };

  // 渲染分析状态
  const renderAnalysisStatus = () => {
    const { analysis } = selector;
    
    if (analysis.status === 'idle') return null;

    return (
      <div 
        style={{
          padding: `${STRATEGY_DESIGN_TOKENS.spacing.sm} ${STRATEGY_DESIGN_TOKENS.spacing.md}`,
          background: analysis.status === 'failed' 
            ? STRATEGY_DESIGN_TOKENS.colors.bg.error
            : STRATEGY_DESIGN_TOKENS.colors.bg.accent,
          borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
          marginBottom: STRATEGY_DESIGN_TOKENS.spacing.sm,
          fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.sm,
        }}
      >
        {analysis.status === 'analyzing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: STRATEGY_DESIGN_TOKENS.spacing.sm }}>
            <span>🔄</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: STRATEGY_DESIGN_TOKENS.colors.text.primary }}>
                智能分析进行中... {analysis.progress}%
              </div>
              {analysis.eta && (
                <div style={{ color: STRATEGY_DESIGN_TOKENS.colors.text.muted, fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs }}>
                  预计还需 {Math.ceil(analysis.eta / 1000)}s
                </div>
              )}
            </div>
            <button
              onClick={() => analysis.jobId && events.onCancelAnalysis(analysis.jobId)}
              style={{
                background: 'transparent',
                border: 'none',
                color: STRATEGY_DESIGN_TOKENS.colors.text.muted,
                cursor: 'pointer',
                padding: STRATEGY_DESIGN_TOKENS.spacing.xs,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {analysis.status === 'completed' && recommendedCandidate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: STRATEGY_DESIGN_TOKENS.spacing.sm }}>
            <span>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: STRATEGY_DESIGN_TOKENS.colors.text.success }}>
                发现更优策略: {recommendedCandidate.name}
              </div>
              <div style={{ color: STRATEGY_DESIGN_TOKENS.colors.text.muted, fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs }}>
                置信度: {Math.round(recommendedCandidate.confidence * 100)}%
              </div>
            </div>
            <button
              onClick={() => events.onApplyRecommendation(recommendedCandidate.key)}
              style={{
                background: STRATEGY_DESIGN_TOKENS.colors.text.success,
                color: STRATEGY_DESIGN_TOKENS.colors.bg.primary,
                border: 'none',
                padding: `${STRATEGY_DESIGN_TOKENS.spacing.xs} ${STRATEGY_DESIGN_TOKENS.spacing.sm}`,
                borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
                fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
                fontWeight: STRATEGY_DESIGN_TOKENS.typography.fontWeight.medium,
                cursor: 'pointer',
              }}
            >
              一键升级
            </button>
          </div>
        )}

        {analysis.status === 'failed' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: STRATEGY_DESIGN_TOKENS.spacing.sm }}>
            <span>❌</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: STRATEGY_DESIGN_TOKENS.colors.text.error }}>
                分析失败: {analysis.error}
              </div>
            </div>
            <button
              onClick={events.onReanalyze}
              style={{
                background: 'transparent',
                border: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.text.error}`,
                color: STRATEGY_DESIGN_TOKENS.colors.text.error,
                padding: `${STRATEGY_DESIGN_TOKENS.spacing.xs} ${STRATEGY_DESIGN_TOKENS.spacing.sm}`,
                borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
                fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        )}
      </div>
    );
  };

  // 渲染策略类型选择器
  const renderStrategyTypeSelector = () => (
    <div style={{ marginBottom: STRATEGY_DESIGN_TOKENS.spacing.sm }}>
      <div style={{ 
        display: 'flex', 
        gap: STRATEGY_DESIGN_TOKENS.spacing.xs,
        flexWrap: 'wrap'
      }}>
        {STRATEGY_TYPES.map(option => (
          <button
            key={option.type}
            onClick={() => handleStrategyTypeChange(option.type)}
            disabled={disabled}
            style={{
              background: selector.activeStrategy.type === option.type 
                ? option.color 
                : 'transparent',
              border: `1px solid ${selector.activeStrategy.type === option.type 
                ? option.color 
                : STRATEGY_DESIGN_TOKENS.colors.border.default}`,
              color: selector.activeStrategy.type === option.type 
                ? STRATEGY_DESIGN_TOKENS.colors.bg.primary
                : STRATEGY_DESIGN_TOKENS.colors.text.secondary,
              padding: `${STRATEGY_DESIGN_TOKENS.spacing.xs} ${STRATEGY_DESIGN_TOKENS.spacing.sm}`,
              borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
              fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
              fontWeight: STRATEGY_DESIGN_TOKENS.typography.fontWeight.medium,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: STRATEGY_DESIGN_TOKENS.spacing.xs,
              transition: `all ${STRATEGY_DESIGN_TOKENS.animations.duration} ${STRATEGY_DESIGN_TOKENS.animations.easing}`,
            }}
          >
            <span>{option.icon}</span>
            <span>{compact ? option.label.split('·')[0] : option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染智能单步选择器
  const renderSmartStepSelector = () => {
    if (selector.activeStrategy.type !== 'smart-single') return null;

    return (
      <div style={{ 
        marginBottom: STRATEGY_DESIGN_TOKENS.spacing.sm,
        padding: STRATEGY_DESIGN_TOKENS.spacing.sm,
        background: STRATEGY_DESIGN_TOKENS.colors.bg.secondary,
        borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
      }}>
        <div style={{ 
          fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
          color: STRATEGY_DESIGN_TOKENS.colors.text.muted,
          marginBottom: STRATEGY_DESIGN_TOKENS.spacing.xs
        }}>
          选择智能步骤:
        </div>
        <div style={{ 
          display: 'flex', 
          gap: STRATEGY_DESIGN_TOKENS.spacing.xs,
          flexWrap: 'wrap'
        }}>
          {SMART_STEPS.map(({ step, label }) => (
            <button
              key={step}
              onClick={() => handleSmartStepChange(step)}
              style={{
                background: selector.activeStrategy.stepName === step 
                  ? STRATEGY_DESIGN_TOKENS.colors.text.success
                  : 'transparent',
                border: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.border.default}`,
                color: selector.activeStrategy.stepName === step 
                  ? STRATEGY_DESIGN_TOKENS.colors.bg.primary
                  : STRATEGY_DESIGN_TOKENS.colors.text.secondary,
                padding: `${STRATEGY_DESIGN_TOKENS.spacing.xs} ${STRATEGY_DESIGN_TOKENS.spacing.sm}`,
                borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
                fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
                cursor: 'pointer',
              }}
            >
              {compact ? step.toUpperCase() : label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: STRATEGY_DESIGN_TOKENS.colors.bg.accent,
      border: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.border.default}`,
      borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.md,
      padding: STRATEGY_DESIGN_TOKENS.spacing.md,
      marginTop: STRATEGY_DESIGN_TOKENS.spacing.sm,
    }}>
      {/* 分析状态 */}
      {renderAnalysisStatus()}

      {/* 策略类型选择 */}
      {renderStrategyTypeSelector()}

      {/* 智能单步选择 */}
      {renderSmartStepSelector()}

      {/* 操作按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: STRATEGY_DESIGN_TOKENS.spacing.xs,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: STRATEGY_DESIGN_TOKENS.spacing.xs }}>
          <button
            onClick={events.onReanalyze}
            disabled={disabled || selector.analysis.status === 'analyzing'}
            style={{
              background: 'transparent',
              border: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.border.default}`,
              color: STRATEGY_DESIGN_TOKENS.colors.text.info,
              padding: `${STRATEGY_DESIGN_TOKENS.spacing.xs} ${STRATEGY_DESIGN_TOKENS.spacing.sm}`,
              borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
              fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            🔄 重新分析
          </button>

          <button
            onClick={() => setShowCandidates(!showCandidates)}
            disabled={disabled}
            style={{
              background: 'transparent',
              border: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.border.default}`,
              color: STRATEGY_DESIGN_TOKENS.colors.text.secondary,
              padding: `${STRATEGY_DESIGN_TOKENS.spacing.xs} ${STRATEGY_DESIGN_TOKENS.spacing.sm}`,
              borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
              fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            📋 查看候选 ({(selector.candidates?.smart?.length ?? 0) + (selector.candidates?.static?.length ?? 0)})
          </button>
        </div>

        <button
          onClick={events.onOpenElementInspector}
          style={{
            background: 'transparent',
            border: 'none',
            color: STRATEGY_DESIGN_TOKENS.colors.text.muted,
            fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
            cursor: 'pointer',
            padding: STRATEGY_DESIGN_TOKENS.spacing.xs,
          }}
        >
          🔍 元素检查器
        </button>
      </div>

      {/* 候选策略列表 */}
      {showCandidates && (
        <div style={{
          marginTop: STRATEGY_DESIGN_TOKENS.spacing.sm,
          maxHeight: '200px',
          overflowY: 'auto',
          border: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.border.default}`,
          borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
          background: STRATEGY_DESIGN_TOKENS.colors.bg.primary,
        }}>
          {[...(selector.candidates?.smart ?? []), ...(selector.candidates?.static ?? [])].map(candidate => (
            <div
              key={candidate.key}
              onClick={() => handleCandidateSelect(candidate)}
              style={{
                padding: STRATEGY_DESIGN_TOKENS.spacing.sm,
                borderBottom: `1px solid ${STRATEGY_DESIGN_TOKENS.colors.border.default}`,
                cursor: 'pointer',
                transition: `background ${STRATEGY_DESIGN_TOKENS.animations.duration}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = STRATEGY_DESIGN_TOKENS.colors.bg.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: STRATEGY_DESIGN_TOKENS.spacing.xs
              }}>
                <span style={{ 
                  color: STRATEGY_DESIGN_TOKENS.colors.text.primary,
                  fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.sm,
                  fontWeight: STRATEGY_DESIGN_TOKENS.typography.fontWeight.medium
                }}>
                  {candidate.name}
                </span>
                <span style={{ 
                  color: candidate.confidence > 0.8 
                    ? STRATEGY_DESIGN_TOKENS.colors.text.success
                    : candidate.confidence > 0.6 
                    ? STRATEGY_DESIGN_TOKENS.colors.text.warning
                    : STRATEGY_DESIGN_TOKENS.colors.text.error,
                  fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
                  fontWeight: STRATEGY_DESIGN_TOKENS.typography.fontWeight.semibold
                }}>
                  {Math.round(candidate.confidence * 100)}%
                </span>
              </div>
              <div style={{ 
                color: STRATEGY_DESIGN_TOKENS.colors.text.muted,
                fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
                marginBottom: STRATEGY_DESIGN_TOKENS.spacing.xs
              }}>
                {candidate.description}
              </div>
              <div style={{ 
                color: STRATEGY_DESIGN_TOKENS.colors.text.muted,
                fontSize: STRATEGY_DESIGN_TOKENS.typography.fontSize.xs,
                fontFamily: 'monospace',
                background: STRATEGY_DESIGN_TOKENS.colors.bg.accent,
                padding: STRATEGY_DESIGN_TOKENS.spacing.xs,
                borderRadius: STRATEGY_DESIGN_TOKENS.borderRadius.sm,
                wordBreak: 'break-all',
              }}>
                {candidate.selector}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategySelector;