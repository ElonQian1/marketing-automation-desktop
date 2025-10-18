// src/components/step-cards/ModernStepCard.tsx
// module: step-cards | layer: ui | role: 现代化步骤卡片组件
// summary: 重新设计的步骤卡片，提供更好的视觉层次和交互体验

import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import type { ExtendedSmartScriptStep } from '../../types/loopScript';

interface ModernStepCardProps {
  step: ExtendedSmartScriptStep;
  index: number;
  onEdit?: (step: ExtendedSmartScriptStep) => void;
  onToggle?: (step: ExtendedSmartScriptStep) => void;
  onDelete?: (step: ExtendedSmartScriptStep) => void;
  isDragging?: boolean;
  transform?: any;
  transition?: any;
  style?: React.CSSProperties;
}

export const ModernStepCard: React.FC<ModernStepCardProps> = ({
  step,
  index,
  onEdit,
  onToggle,
  onDelete,
  isDragging = false,
  transform,
  transition,
  style
}) => {
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    ...style
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'var(--success)',
          bgColor: 'var(--success-bg)',
          icon: '✓',
          text: '已完成'
        };
      case 'running':
        return {
          color: 'var(--info)',
          bgColor: 'var(--info-bg)',
          icon: '▶',
          text: '执行中'
        };
      case 'error':
        return {
          color: 'var(--error)',
          bgColor: 'var(--error-bg)',
          icon: '✗',
          text: '失败'
        };
      case 'ready':
        return {
          color: 'var(--brand-400)',
          bgColor: 'rgba(110, 139, 255, 0.1)',
          icon: '◉',
          text: '智能分析就绪'
        };
      default:
        return {
          color: 'var(--text-3)',
          bgColor: 'var(--bg-secondary)',
          icon: '○',
          text: '待执行'
        };
    }
  };

  const statusConfig = getStatusConfig(step.analysisStatus || 'idle');

  return (
    <div
      className="modern-step-card"
      style={{
        ...dragStyle,
        // 基础样式
        position: 'relative',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        minHeight: '80px',
        cursor: isDragging ? 'grabbing' : 'grab',
        
        // 阴影和动效
        boxShadow: isDragging 
          ? 'var(--shadow-brand-lg)' 
          : 'var(--shadow-sm)',
        transition: 'all var(--duration-normal) var(--ease-out)',
        
        // hover 效果
        ...((!isDragging) && {
          ':hover': {
            borderColor: 'var(--brand-400)',
            boxShadow: 'var(--shadow-interactive-hover)',
            transform: 'translateY(-1px)'
          }
        })
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          card.style.borderColor = 'var(--brand-400)';
          card.style.boxShadow = 'var(--shadow-interactive-hover)';
          card.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          card.style.borderColor = 'var(--border-primary)';
          card.style.boxShadow = 'var(--shadow-sm)';
          card.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* 拖拽指示器 */}
      <div
        style={{
          position: 'absolute',
          left: '6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '20px',
          background: 'var(--text-3)',
          borderRadius: '2px',
          opacity: 0.5,
          cursor: 'grab'
        }}
      />

      {/* 卡片内容 */}
      <div style={{
        marginLeft: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        
        {/* 头部：步骤编号 + 标题 + 操作 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1
          }}>
            {/* 步骤编号 */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step.enabled 
                ? 'var(--brand-gradient-primary)' 
                : 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step.enabled ? '#fff' : 'var(--text-3)',
              fontSize: '13px',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {index + 1}
            </div>

            {/* 标题 */}
            <h4 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '500',
              color: 'var(--text-1)',
              flex: 1,
              lineHeight: '1.4'
            }}>
              {step.description || `步骤 ${index + 1}`}
            </h4>
          </div>

          {/* 操作按钮组 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => onEdit?.(step)}
              title="编辑步骤"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-2)',
                fontSize: '14px',
                transition: 'all var(--duration-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.color = 'var(--text-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-2)';
              }}
            >
              ✏️
            </button>

            <button
              type="button"
              onClick={() => onToggle?.(step)}
              title={step.enabled ? "禁用步骤" : "启用步骤"}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: step.enabled ? 'var(--success)' : 'var(--text-3)',
                fontSize: '14px',
                transition: 'all var(--duration-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {step.enabled ? '✅' : '⭕'}
            </button>

            <button
              type="button"
              onClick={() => onDelete?.(step)}
              title="删除步骤"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-3)',
                fontSize: '14px',
                transition: 'all var(--duration-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = 'var(--error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-3)';
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 状态条 */}
        {step.analysisStatus && step.analysisStatus !== 'idle' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: statusConfig.bgColor,
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <span style={{ 
              color: statusConfig.color,
              fontSize: '10px'
            }}>
              {statusConfig.icon}
            </span>
            <span style={{ 
              color: statusConfig.color,
              fontWeight: '500'
            }}>
              {statusConfig.text}
            </span>
          </div>
        )}

        {/* 步骤详情 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-3)'
        }}>
          <span>类型: {step.type}</span>
          {step.selector && (
            <span>选择器: {step.selector.length > 30 
              ? step.selector.substring(0, 30) + '...' 
              : step.selector}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};