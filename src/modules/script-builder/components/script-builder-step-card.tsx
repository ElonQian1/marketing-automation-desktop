// src/modules/script-builder/components/script-builder-step-card.tsx
// module: script-builder | layer: ui | role: component
// summary: 脚本构建器步骤卡片，基于UnifiedStepCard的包装器

import React from 'react';
import { UnifiedStepCard } from '../../universal-ui/components/unified-step-card';
import { adaptScriptStepToIntelligent } from '../../universal-ui/adapters/step-card-adapter';
import type { SmartScriptStep } from '../../../types/smartScript';

/**
 * 脚本构建器步骤卡片属性
 */
export interface ScriptBuilderStepCardProps {
  /** 脚本步骤数据 */
  step: SmartScriptStep;
  /** 步骤索引 */
  stepIndex: number;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否正在执行 */
  isExecuting?: boolean;
  /** 执行进度 */
  executionProgress?: number;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 自定义类名 */
  className?: string;
  
  // 脚本构建器特有回调
  /** 编辑步骤 */
  onEdit?: (step: SmartScriptStep) => void;
  /** 删除步骤 */
  onDelete?: (stepId: string) => void;
  /** 复制步骤 */
  onDuplicate?: (step: SmartScriptStep) => void;
  /** 切换启用状态 */
  onToggleEnabled?: (stepId: string, enabled: boolean) => void;
  /** 单独运行 */
  onRunSingle?: (step: SmartScriptStep) => void;
  /** 查看详情 */
  onViewDetails?: (step: SmartScriptStep) => void;
  
  // 智能分析回调
  /** 升级策略 */
  onUpgradeStrategy?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 切换策略 */
  onSwitchStrategy?: (strategyKey: string, followSmart: boolean) => void;
}

/**
 * 脚本构建器步骤卡片
 * 
 * 🎯 设计理念：
 * - 基于 UnifiedStepCard 的薄包装器
 * - 处理脚本步骤特有的交互逻辑
 * - 保持与智能分析系统的兼容性
 */
export const ScriptBuilderStepCard: React.FC<ScriptBuilderStepCardProps> = ({
  step,
  stepIndex,
  isSelected = false,
  isExecuting = false,
  executionProgress,
  showDebugInfo = false,
  className = '',
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
  onRunSingle,
  onViewDetails,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy
}) => {
  
  // 转换脚本步骤数据为智能步骤卡片格式
  const intelligentStepCard = React.useMemo(() => {
    return adaptScriptStepToIntelligent(step, stepIndex - 1);
  }, [step, stepIndex]);
  
  // 处理查看详情
  const handleViewDetails = React.useCallback(() => {
    onViewDetails?.(step);
  }, [onViewDetails, step]);
  
  // 组合类名
  const combinedClassName = [
    'script-builder-step-card',
    isSelected ? 'selected' : '',
    isExecuting ? 'executing' : '',
    step.enabled === false ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={combinedClassName}>
      {/* 执行进度条（脚本构建器特有） */}
      {isExecuting && executionProgress !== undefined && (
        <div className="execution-progress-overlay">
          <div 
            className="progress-bar" 
            style={{ width: `${executionProgress}%` }}
          />
        </div>
      )}
      
      <UnifiedStepCard
        stepCard={intelligentStepCard}
        stepIndex={stepIndex}
        showDebugInfo={showDebugInfo}
        className="script-step-unified"
        onUpgradeStrategy={onUpgradeStrategy}
        onRetryAnalysis={onRetryAnalysis}
        onSwitchStrategy={onSwitchStrategy}
        onViewDetails={handleViewDetails}
      />
      
      {/* 脚本构建器特有的操作栏 */}
      {isSelected && (
        <div className="script-step-actions">
          <div className="action-buttons">
            {onEdit && (
              <button 
                className="action-btn edit-btn"
                onClick={() => onEdit(step)}
                title="编辑步骤"
              >
                ✏️
              </button>
            )}
            {onDuplicate && (
              <button 
                className="action-btn duplicate-btn"
                onClick={() => onDuplicate(step)}
                title="复制步骤"
              >
                📋
              </button>
            )}
            {onToggleEnabled && (
              <button 
                className="action-btn toggle-btn"
                onClick={() => onToggleEnabled(step.id, !step.enabled)}
                title={step.enabled ? "禁用步骤" : "启用步骤"}
              >
                {step.enabled ? '🔕' : '🔔'}
              </button>
            )}
            {onRunSingle && (
              <button 
                className="action-btn run-btn"
                onClick={() => onRunSingle(step)}
                title="单独运行"
              >
                ▶️
              </button>
            )}
            {onDelete && (
              <button 
                className="action-btn delete-btn"
                onClick={() => onDelete(step.id)}
                title="删除步骤"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .script-builder-step-card {
          position: relative;
          margin: 8px 0;
          transition: all 0.2s ease;
        }
        
        .script-builder-step-card.selected {
          box-shadow: 0 0 0 2px #1890ff;
          border-radius: 6px;
        }
        
        .script-builder-step-card.executing {
          border-left: 4px solid #52c41a;
        }
        
        .script-builder-step-card.disabled {
          opacity: 0.6;
        }
        
        .execution-progress-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(0,0,0,0.1);
          z-index: 10;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #52c41a, #73d13d);
          transition: width 0.3s ease;
        }
        
        .script-step-actions {
          margin-top: 8px;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .action-btn {
          background: white;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
        }
        
        .delete-btn:hover {
          border-color: #ff4d4f;
          box-shadow: 0 0 0 2px rgba(255,77,79,0.2);
        }
      `}</style>
    </div>
  );
};

export default ScriptBuilderStepCard;