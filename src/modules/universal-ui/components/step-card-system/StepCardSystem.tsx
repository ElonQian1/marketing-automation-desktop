// src/modules/universal-ui/components/step-card-system/StepCardSystem.tsx
// module: universal-ui | layer: components | role: system-main
// summary: 步骤卡片系统主入口组件（完整实现版本）

import React, { useMemo } from 'react';
import type { UnifiedStepCardData, StepCardFeatureConfig, StepCardStyleConfig, StepCardCallbacks } from '../../types/unified-step-card-types';
import { smartAdapt } from '../../types/unified-step-card-types';
import { useStepCardActions, useStepCardDrag, useStepCardIntelligent } from '../../hooks/use-step-card-actions';
import { generateStepCardStyles } from '../../styles/step-card-theme';
import { ANALYSIS_STATES } from '../../../../shared/constants/events';

// 统一的系统属性定义
export interface StepCardSystemProps {
  /** 步骤数据（自动适配各种格式） */
  stepData: unknown;
  /** 步骤索引 */
  stepIndex?: number;
  /** 功能配置 */
  config?: StepCardFeatureConfig;
  /** 样式配置 */
  styleConfig?: StepCardStyleConfig;
  /** 回调函数 */
  callbacks?: StepCardCallbacks;
  /** 拖拽相关 */
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  /** 系统模式 */
  systemMode?: 'minimal' | 'interaction-only' | 'intelligent-only' | 'full';
}

/**
 * 步骤卡片系统主组件 (完整实现版本)
 * 
 * 🎯 核心理念：
 * 这是一个完整的步骤卡片系统，统一管理所有步骤卡片功能
 * 通过配置控制不同的功能层，消除组件间的重复和混乱
 * 
 * ✅ 核心特性：
 * - 自动数据格式适配（支持 SmartScriptStep、IntelligentStepCard 等）
 * - 统一的功能配置（拖拽、智能分析、编辑等）
 * - 统一的样式系统（主题、尺寸、状态）
 * - 统一的回调管理（无重复实现）
 * 
 * @example
 * ```tsx
 * // 基础拖拽卡片（替代 DraggableStepCard）
 * <StepCardSystem
 *   stepData={stepData}
 *   config={{ enableDrag: true, enableEdit: true }}
 *   callbacks={{ onEdit: handleEdit, onDelete: handleDelete }}
 * />
 * 
 * // 智能分析卡片（替代 UnifiedStepCard）
 * <StepCardSystem
 *   stepData={stepData}
 *   config={{ enableIntelligent: true, enableUpgrade: true }}
 *   callbacks={{ onUpgradeStrategy: handleUpgrade }}
 * />
 * 
 * // 完整功能卡片
 * <StepCardSystem
 *   stepData={stepData}
 *   config={{ enableDrag: true, enableIntelligent: true, enableEdit: true }}
 * />
 * ```
 */
export const StepCardSystem: React.FC<StepCardSystemProps> = ({
  stepData: rawStepData,
  stepIndex,
  config = {},
  styleConfig = {},
  callbacks = {},
  isDragging = false,
  dragHandleProps,
  systemMode = 'full'
}) => {
  // 统一数据格式适配
  const unifiedStepData = useMemo((): UnifiedStepCardData => {
    return smartAdapt(rawStepData);
  }, [rawStepData]);

  // 根据系统模式调整配置
  const finalConfig = useMemo((): StepCardFeatureConfig => {
    const baseConfig = { ...config };
    
    switch (systemMode) {
      case 'minimal':
        return {
          enableEdit: false,
          enableDelete: false,
          enableTest: false,
          enableCopy: false,
          enableDrag: false,
          enableIntelligent: false,
          ...baseConfig
        };
      case 'interaction-only':
        return {
          enableDrag: true,
          enableEdit: true,
          enableDelete: true,
          enableTest: true,
          enableCopy: true,
          enableIntelligent: false,
          ...baseConfig
        };
      case 'intelligent-only':
        return {
          enableDrag: false,
          enableEdit: false,
          enableDelete: false,
          enableTest: false,
          enableCopy: false,
          enableIntelligent: true,
          ...baseConfig
        };
      case 'full':
      default:
        return {
          enableEdit: true,
          enableDelete: true,
          enableTest: true,
          enableCopy: true,
          enableDrag: true,
          enableIntelligent: true,
          ...baseConfig
        };
    }
  }, [config, systemMode]);

  // 提取通用功能
  const actions = useStepCardActions({
    stepData: unifiedStepData,
    callbacks,
    features: {
      enableEdit: finalConfig.enableEdit,
      enableDelete: finalConfig.enableDelete,
      enableTest: finalConfig.enableTest,
      enableCopy: finalConfig.enableCopy,
      enableToggle: finalConfig.enableToggle,
      enableViewDetails: finalConfig.enableViewDetails
    }
  });

  const drag = useStepCardDrag({
    stepData: unifiedStepData,
    stepIndex,
    enableDrag: finalConfig.enableDrag,
    isDragging,
    dragHandleProps,
    callbacks: {
      onDragStart: callbacks.onDragStart,
      onDragEnd: callbacks.onDragEnd
    }
  });

  const intelligent = useStepCardIntelligent({
    stepData: unifiedStepData,
    enableIntelligent: finalConfig.enableIntelligent,
    callbacks: {
      onStartAnalysis: callbacks.onStartAnalysis,
      onCancelAnalysis: callbacks.onCancelAnalysis,
      onRetryAnalysis: callbacks.onRetryAnalysis,
      onUpgradeStrategy: callbacks.onUpgradeStrategy,
      onSwitchStrategy: callbacks.onSwitchStrategy,
      onAnalysisComplete: callbacks.onAnalysisComplete,
      onAnalysisError: callbacks.onAnalysisError
    }
  });

  // 生成统一样式
  const { styles, className } = useMemo(() => {
    return generateStepCardStyles({
      theme: styleConfig.theme || 'default',
      size: styleConfig.size || 'default',
      state: isDragging ? 'active' : unifiedStepData.enabled ? 'idle' : 'disabled',
      isDragging: isDragging,
      dragEffect: styleConfig.dragEffect || 'rotate'
    });
  }, [styleConfig, isDragging, unifiedStepData.enabled]);

  return (
    <div 
      className={`unified-step-card ${className}`}
      style={{
        ...styles.container,
        ...(isDragging ? styles.dragging : {}),
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        padding: '12px',
        background: 'white',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      <StepCardContent
        stepData={unifiedStepData}
        stepIndex={stepIndex}
        config={finalConfig}
        actions={actions}
        drag={drag}
        intelligent={intelligent}
      />
    </div>
  );
};

/**
 * 步骤卡片内容组件
 * 统一渲染所有功能模块
 */
interface StepCardContentProps {
  stepData: UnifiedStepCardData;
  stepIndex?: number;
  config: StepCardFeatureConfig;
  actions: ReturnType<typeof useStepCardActions>;
  drag: ReturnType<typeof useStepCardDrag>;
  intelligent: ReturnType<typeof useStepCardIntelligent>;
}

const StepCardContent: React.FC<StepCardContentProps> = ({
  stepData,
  stepIndex,
  config,
  actions,
  drag,
  intelligent
}) => {
  return (
    <>
      {/* 智能分析状态条（顶部优先显示） */}
      {intelligent.isIntelligentEnabled && intelligent.shouldShowStatusBar && (
        <div className={`unified-step-card__status-bar unified-step-card__status-bar--${
          intelligent.isAnalyzing ? 'analyzing' 
          : stepData.analysisState === ANALYSIS_STATES.COMPLETED ? 'completed'
          : stepData.analysisState === 'analysis_failed' ? 'error'
          : 'default'
        }`} style={{ 
          padding: '8px 12px', 
          background: intelligent.isAnalyzing ? '#e6f7ff' : stepData.analysisState === ANALYSIS_STATES.COMPLETED ? '#fff7e6' : stepData.analysisState === 'analysis_failed' ? '#fff2f0' : '#f5f5f5',
          border: '1px solid',
          borderColor: intelligent.isAnalyzing ? '#91d5ff' : stepData.analysisState === ANALYSIS_STATES.COMPLETED ? '#ffd591' : stepData.analysisState === 'analysis_failed' ? '#ffccc7' : '#d9d9d9',
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{intelligent.analysisStatusText}</span>
            {intelligent.showUpgradeButton && (
              <button 
                type="button"
                onClick={intelligent.handleUpgradeStrategy}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  border: '1px solid #1890ff',
                  background: '#1890ff',
                  color: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                一键升级
              </button>
            )}
          </div>
          
          {/* 进度条 */}
          {intelligent.isAnalyzing && (
            <div style={{ 
              marginTop: '6px',
              height: '4px', 
              background: '#f0f0f0', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: '#1890ff',
                width: `${intelligent.analysisProgress || 0}%`,
                transition: 'width 0.3s ease',
                borderRadius: '2px'
              }} />
            </div>
          )}
        </div>
      )}
      
      {/* 头部区域 */}
      <div className="unified-step-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 拖拽句柄 */}
          {drag.isDragEnabled && (
            <div 
              className="unified-step-card__drag-handle"
              {...drag.dragHandleProps}
              style={{
                cursor: 'grab',
                color: '#666',
                fontSize: '14px',
                padding: '2px'
              }}
            >
              ⋮⋮
            </div>
          )}
          
          {/* 步骤索引 */}
          {stepIndex !== undefined && (
            <span style={{ 
              fontSize: '12px', 
              color: '#666', 
              minWidth: '20px',
              textAlign: 'center',
              background: '#f0f0f0',
              borderRadius: '10px',
              padding: '2px 6px'
            }}>
              {stepIndex + 1}
            </span>
          )}
          
          {/* 步骤标题 */}
          <h4 className="unified-step-card__title" style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 500,
            flex: 1
          }}>
            {stepData.name}
          </h4>
        </div>

        {/* 操作按钮组 */}
        <div className="unified-step-card__actions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {config.enableEdit && (
            <button 
              type="button"
              onClick={actions.handleEdit}
              title="编辑步骤"
              style={{ 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer', 
                padding: '4px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              ✏️
            </button>
          )}
          
          {config.enableTest && (
            <button 
              type="button"
              onClick={actions.handleTest}
              title="测试步骤"
              style={{ 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer', 
                padding: '4px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              ▶️
            </button>
          )}
          
          {config.enableCopy && (
            <button 
              type="button"
              onClick={actions.handleCopy}
              title="复制步骤"
              style={{ 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer', 
                padding: '4px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              📋
            </button>
          )}
          
          {config.enableToggle && (
            <button 
              type="button"
              onClick={actions.handleToggle}
              title={stepData.enabled ? "禁用步骤" : "启用步骤"}
              style={{ 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer', 
                padding: '4px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                opacity: stepData.enabled ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}
            >
              {stepData.enabled ? '✅' : '❌'}
            </button>
          )}
          
          {config.enableDelete && (
            <button 
              type="button"
              onClick={actions.handleDelete}
              title="删除步骤"
              style={{ 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer', 
                padding: '4px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#ff4d4f',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="unified-step-card__content" style={{ marginTop: '8px' }}>
        {/* 步骤描述 */}
        {stepData.description && (
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
            {stepData.description}
          </p>
        )}
        
        {/* 步骤类型和参数 */}
        <div style={{ fontSize: '12px', color: '#888' }}>
          <span>类型：{stepData.stepType}</span>
          {stepData.parameters && Object.keys(stepData.parameters).length > 0 && (
            <span style={{ marginLeft: 16 }}>
              参数：{Object.keys(stepData.parameters).length} 个
            </span>
          )}
        </div>
      </div>

      {/* 策略候选展示区域（仅智能模式且分析完成时显示） */}
      {intelligent.isIntelligentEnabled && 
       stepData.analysisState === ANALYSIS_STATES.COMPLETED && 
       stepData.smartCandidates && stepData.smartCandidates.length > 0 && (
        <div className="unified-step-card__candidates" style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#495057' }}>
            候选策略 ({stepData.smartCandidates.length})
          </div>
          <div style={{ maxHeight: '120px', overflow: 'auto' }}>
            {stepData.smartCandidates.slice(0, 3).map((candidate, index) => (
              <div key={index} style={{
                padding: '4px 8px',
                margin: '2px 0',
                background: candidate.key === stepData.recommendedKey ? '#e7f5e7' : 'white',
                border: '1px solid',
                borderColor: candidate.key === stepData.recommendedKey ? '#52c41a' : '#d9d9d9',
                borderRadius: '4px',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{candidate.description || candidate.strategy || `策略${index + 1}`}</span>
                <span style={{ 
                  color: candidate.score >= 0.8 ? '#52c41a' : candidate.score >= 0.6 ? '#faad14' : '#8c8c8c' 
                }}>
                  {Math.round((candidate.score || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default StepCardSystem;