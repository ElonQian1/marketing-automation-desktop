// src/components/DraggableStepCard.tsx
// module: ui | layer: ui | role: 现代化可拖拽步骤卡片组件
// summary: 重新设计的步骤卡片，解决白底白字问题，提供更好的视觉层次和交互体验

/**
 * 🎨 全新现代化的可拖拽步骤卡片组件
 * 
 * ✨ 设计改进：
 * - 🔧 完全解决白底白字问题，统一深色主题适配
 * - 📐 清晰的视觉层次和信息分组
 * - 🎯 改进的交互反馈和动画效果
 * - 🚀 现代化的状态指示系统
 * - 💫 品牌化的渐变效果和阴影
 * 
 * 🎯 核心特性：
 * - 智能状态指示和进度反馈
 * - 优化的操作按钮和拖拽体验
 * - 响应式布局和自适应高度
 * - 完整的深色主题适配
 * 
 * 🔄 保持向后兼容：
 * - 保持相同的 Props 接口
 * - 保持相同的回调方法
 * - 保持相同的导出类型
 */

import React from "react";
import { CSS } from '@dnd-kit/utilities';
import { SmartActionType } from "../types/smartComponents";

// 设备简化接口
export interface DeviceInfo {
  id: string;
  name: string;
  status: string;
}

// 步骤参数的通用接口
export interface StepParameters {
  // 基础参数
  element_selector?: string;
  bounds?: string;
  text?: string;
  timeout?: number;
  retry_count?: number;
  
  // 循环参数
  loop_count?: number;
  is_infinite_loop?: boolean;
  
  // 智能匹配参数
  matching?: {
    strategy?: 'standard' | 'absolute' | 'strict' | 'relaxed' | 'positionless';
    threshold?: number;
    use_bounds?: boolean;
    use_text?: boolean;
    use_class?: boolean;
    fields?: string[];
    values?: Record<string, string>;
  };
  
  // 循环主题和卡片主题
  loopTheme?: string;
  cardTheme?: string;
  cardSurface?: string;
  
  // XML快照相关
  xmlSnapshot?: {
    xmlContent?: string;
    xmlCacheId?: string;
    [key: string]: unknown;
  };
  xmlContent?: string;
  xmlCacheId?: string;
  
  // 元素相关字段
  class_name?: string;
  resource_id?: string;
  content_desc?: string;
  
  // 其他动态参数
  [key: string]: unknown;
}

export interface SmartScriptStep {
  id: string;
  name: string;
  step_type: SmartActionType | string;
  description: string;
  parameters: StepParameters;
  enabled: boolean;
  
  // 循环相关字段
  parent_loop_id?: string;
  parentLoopId?: string;
  loop_config?: {
    loopId: string;
    iterations: number;
    condition?: string;
    enabled: boolean;
    name: string;
    description?: string;
  };
}

export interface DraggableStepCardProps {
  /** 步骤数据 */
  step: SmartScriptStep;
  /** 步骤索引 */
  index: number;
  /** 当前设备ID */
  currentDeviceId?: string;
  /** 设备列表 */
  devices: DeviceInfo[];
  /** 是否正在拖拽 */
  isDragging?: boolean;
}

// 样式系统
const modernStepCardStyles = {
  // 基础卡片样式
  card: {
    position: 'relative' as const,
    background: 'var(--bg-elevated, #1E293B)',
    color: 'var(--text-1, #F8FAFC)',
    border: '1px solid var(--border-primary, #334155)',
    borderRadius: 'var(--radius, 12px)',
    padding: '16px',
    minHeight: '80px',
    transition: 'all var(--duration-normal, 180ms) var(--ease-out)',
    cursor: 'grab' as const,
    boxShadow: 'var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.12))',
  },
  
  dragging: {
    cursor: 'grabbing' as const,
    opacity: 0.8,
    boxShadow: 'var(--shadow-brand-lg, 0 8px 40px rgba(110, 139, 255, 0.25))',
    transform: 'rotate(1deg)'
  },
  
  disabled: {
    opacity: 0.6,
    background: 'var(--bg-secondary, #334155)',
  }
};

const DraggableStepCardInner: React.FC<
  DraggableStepCardProps & {
    onEdit: (step: SmartScriptStep) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
    onBatchMatch?: (id: string) => void;
    onUpdateStepParameters?: (id: string, nextParams: StepParameters) => void;
    onUpdateStepMeta?: (
      id: string,
      meta: { name?: string; description?: string }
    ) => void;
    StepTestButton?: React.ComponentType<{
      step: SmartScriptStep;
      deviceId?: string;
      disabled?: boolean;
    }>;
    ENABLE_BATCH_MATCH?: boolean;
    onEditStepParams?: (step: SmartScriptStep) => void;
    onOpenPageAnalyzer?: () => void;
    // 拖拽相关
    transform?: any;
    transition?: any;
    style?: React.CSSProperties;
  }
> = ({
  step,
  index,
  isDragging = false,
  onEdit,
  onDelete,
  onToggle,
  onUpdateStepParameters,
  onUpdateStepMeta,
  StepTestButton,
  onEditStepParams,
  onOpenPageAnalyzer,
  devices,
  currentDeviceId,
  transform,
  transition,
  style
}) => {
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style
  };

  // 获取状态配置
  const getStatusConfig = (enabled: boolean) => {
    if (enabled) {
      return {
        color: 'var(--success, #10B981)',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: '✓',
        text: '已启用'
      };
    } else {
      return {
        color: 'var(--text-3, #CBD5E1)',
        bgColor: 'var(--bg-secondary, #334155)',
        icon: '○',
        text: '已禁用'
      };
    }
  };

  const statusConfig = getStatusConfig(step.enabled);
  
  // 获取当前设备信息
  const currentDevice = devices.find(d => d.id === currentDeviceId);

  const handleEdit = () => {
    if (onOpenPageAnalyzer) {
      onOpenPageAnalyzer();
    } else if (onEditStepParams) {
      onEditStepParams(step);
    } else {
      onEdit(step);
    }
  };

  // 组合样式
  const cardStyle = {
    ...modernStepCardStyles.card,
    ...dragStyle,
    ...(isDragging ? modernStepCardStyles.dragging : {}),
    ...(!step.enabled ? modernStepCardStyles.disabled : {})
  };

  return (
    <div
      className="modern-draggable-step-card light-theme-force"
      style={cardStyle}
      onMouseEnter={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          card.style.borderColor = 'var(--brand-400, #7A9BFF)';
          card.style.boxShadow = 'var(--shadow-interactive-hover, 0 0 16px rgba(110, 139, 255, 0.3))';
          card.style.transform = CSS.Transform.toString(transform) + ' translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          card.style.borderColor = 'var(--border-primary, #334155)';
          card.style.boxShadow = 'var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.12))';
          card.style.transform = CSS.Transform.toString(transform);
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
          background: 'var(--text-3, #CBD5E1)',
          borderRadius: '2px',
          opacity: 0.5,
          cursor: 'grab',
          transition: 'all var(--duration-fast, 120ms)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.background = 'var(--brand-400, #7A9BFF)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.5';
          e.currentTarget.style.background = 'var(--text-3, #CBD5E1)';
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
                ? 'var(--brand-gradient-primary, linear-gradient(135deg, #6E8BFF 0%, #8B5CF6 100%))' 
                : 'var(--bg-secondary, #334155)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step.enabled ? '#fff' : 'var(--text-3, #CBD5E1)',
              fontSize: '13px',
              fontWeight: '600',
              flexShrink: 0,
              boxShadow: step.enabled ? '0 2px 8px rgba(110, 139, 255, 0.3)' : 'none'
            }}>
              {index + 1}
            </div>

            {/* 标题 */}
            <h4 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '500',
              color: 'var(--text-1, #F8FAFC)',
              flex: 1,
              lineHeight: '1.4'
            }}>
              {step.description || step.name || `步骤 ${index + 1}`}
            </h4>
          </div>

          {/* 操作按钮组 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            
            {/* 测试按钮 */}
            {StepTestButton && (
              <StepTestButton 
                step={step} 
                deviceId={currentDeviceId}
                disabled={!step.enabled}
              />
            )}
            
            {/* 编辑按钮 */}
            <button
              type="button"
              onClick={handleEdit}
              title="编辑步骤"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-2, #E2E8F0)',
                fontSize: '14px',
                transition: 'all var(--duration-fast, 120ms)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary, #334155)';
                e.currentTarget.style.color = 'var(--text-1, #F8FAFC)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-2, #E2E8F0)';
              }}
            >
              ✏️
            </button>

            {/* 启用/禁用切换 */}
            <button
              type="button"
              onClick={() => onToggle(step.id)}
              title={step.enabled ? "禁用步骤" : "启用步骤"}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: step.enabled 
                  ? 'var(--success, #10B981)' 
                  : 'var(--text-3, #CBD5E1)',
                fontSize: '14px',
                transition: 'all var(--duration-fast, 120ms)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary, #334155)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {step.enabled ? '✅' : '⭕'}
            </button>

            {/* 删除按钮 */}
            <button
              type="button"
              onClick={() => onDelete(step.id)}
              title="删除步骤"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-3, #CBD5E1)',
                fontSize: '14px',
                transition: 'all var(--duration-fast, 120ms)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = 'var(--error, #EF4444)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-3, #CBD5E1)';
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 状态条 */}
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

        {/* 步骤详情 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-3, #CBD5E1)'
        }}>
          <span>类型: {step.step_type}</span>
          
          {step.parameters?.element_selector && (
            <span>
              选择器: {step.parameters.element_selector.length > 30 
                ? step.parameters.element_selector.substring(0, 30) + '...' 
                : step.parameters.element_selector}
            </span>
          )}
          
          {currentDevice && (
            <span>设备: {currentDevice.name}</span>
          )}
        </div>

        {/* 循环信息 */}
        {step.loop_config && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--info, #3B82F6)'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              🔄 循环配置:
            </div>
            <div style={{ opacity: 0.9 }}>
              • 循环次数: {step.loop_config.iterations}
              {step.loop_config.condition && (
                <div>• 条件: {step.loop_config.condition}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DraggableStepCard = React.memo(DraggableStepCardInner);

export default DraggableStepCard;