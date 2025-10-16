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
import styles from './DraggableStepCard.module.css';
// import StrategySelector from './strategy-selector/StrategySelector'; // 暂时不用，保留备用
import CompactStrategyMenu from './strategy-selector/CompactStrategyMenu';
import { StrategySelector as IStrategySelector, StrategyEvents } from '../types/strategySelector';

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
  
  // 🧠 策略选择器相关字段
  strategySelector?: IStrategySelector;
  enableStrategySelector?: boolean;  // 是否启用策略选择器
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
/**
 * 🎨 DraggableStepCard 独立设计系统基准
 * 完全自包含，不依赖任何全局样式变量
 */
const STEP_CARD_DESIGN_TOKENS = {
  // 🎨 颜色系统
  colors: {
    // 背景色
    bg: {
      primary: '#1E293B',      // 主背景（深蓝灰）
      secondary: '#334155',    // 次要背景（中灰蓝）
      disabled: '#475569',     // 禁用背景（浅灰蓝）
      hover: '#2D3748',        // 悬停背景
    },
    // 文字色
    text: {
      primary: '#F8FAFC',      // 主文字（纯白）
      secondary: '#E2E8F0',    // 次要文字（浅灰）
      muted: '#CBD5E1',        // 弱化文字（灰）
      inverse: '#1E293B',      // 反色文字（深色）
    },
    // 边框色
    border: {
      default: '#334155',      // 默认边框
      hover: '#7A9BFF',        // 悬停边框（品牌蓝）
      focus: '#6E8BFF',        // 焦点边框
    },
    // 状态色
    status: {
      success: '#10B981',      // 成功（绿）
      warning: '#F59E0B',      // 警告（橙）
      error: '#EF4444',        // 错误（红）
      info: '#3B82F6',         // 信息（蓝）
    },
    // 功能色
    functional: {
      brand: '#6E8BFF',        // 品牌色
      accent: '#8B5CF6',       // 强调色
    }
  },
  
  // 📏 间距系统
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  
  // 📐 圆角系统
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  
  // 🔤 字体系统
  typography: {
    fontSize: {
      xs: '10px',
      sm: '12px',
      md: '13px',
      base: '14px',
      lg: '16px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },
  
  // 🌊 阴影系统
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 2px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.2)',
    brand: '0 0 16px rgba(110, 139, 255, 0.3)',
    hover: '0 4px 20px rgba(110, 139, 255, 0.15)',
  },
  
  // ⚡ 动画系统
  animations: {
    duration: {
      fast: '120ms',
      normal: '180ms',
      slow: '300ms',
    },
    easing: {
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },
  
  // 📱 响应式断点
  breakpoints: {
    mobile: '480px',    // 手机
    tablet: '768px',    // 平板
    desktop: '1024px',  // 桌面
  },
  
  // 📐 响应式间距
  responsiveSpacing: {
    mobile: {
      cardPadding: '10px',
      buttonGap: '6px',
    },
    tablet: {
      cardPadding: '12px', 
      buttonGap: '4px',
    },
    desktop: {
      cardPadding: '16px',
      buttonGap: '4px',
    }
  }
};

const modernStepCardStyles = {
  // 基础卡片样式
  card: {
    position: 'relative' as const,
    background: STEP_CARD_DESIGN_TOKENS.colors.bg.primary,
    color: STEP_CARD_DESIGN_TOKENS.colors.text.primary,
    border: `1px solid ${STEP_CARD_DESIGN_TOKENS.colors.border.default}`,
    borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.lg,
    padding: STEP_CARD_DESIGN_TOKENS.spacing.lg,
    minHeight: '80px',
    fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
    fontWeight: STEP_CARD_DESIGN_TOKENS.typography.fontWeight.normal,
    lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.normal,
    transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.normal} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
    cursor: 'grab' as const,
    boxShadow: STEP_CARD_DESIGN_TOKENS.shadows.sm,
  },
  
  dragging: {
    cursor: 'grabbing' as const,
    opacity: 0.8,
    boxShadow: STEP_CARD_DESIGN_TOKENS.shadows.brand,
    transform: 'rotate(1deg)'
  },
  
  disabled: {
    opacity: 0.6,
    background: STEP_CARD_DESIGN_TOKENS.colors.bg.disabled,
    color: STEP_CARD_DESIGN_TOKENS.colors.text.muted,
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
    // 🧠 策略选择器回调
    onStrategyChange?: (stepId: string, selection: { type: 'smart-auto' | 'smart-single' | 'static'; key?: string; stepName?: string }) => void;
    onReanalyze?: (stepId: string) => Promise<void>;
    onSaveAsStatic?: (stepId: string, candidate: any) => void;
    onOpenElementInspector?: (stepId: string) => void;
    onCancelAnalysis?: (stepId: string, jobId: string) => void;
    onApplyRecommendation?: (stepId: string, key: string) => void;
    // 🔄 智能分析功能
    isAnalyzing?: boolean;
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
  // 策略选择器回调
  onStrategyChange,
  onReanalyze,
  onSaveAsStatic,
  onOpenElementInspector,
  onCancelAnalysis,
  onApplyRecommendation,
  // 🔄 智能分析功能
  isAnalyzing,
  devices,
  currentDeviceId,
  transform,
  transition,
  style
}) => {
  // Hook for reanalysis functionality - we'll need to get steps context from parent
  // For now, we'll use the original callback approach
  // TODO: Integrate with steps context from parent component
  
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

  // 组合样式 - 使用独立设计基准
  const cardStyle: React.CSSProperties = {
    ...modernStepCardStyles.card,
    ...dragStyle,
    ...(isDragging ? modernStepCardStyles.dragging : {}),
    ...(!step.enabled ? modernStepCardStyles.disabled : {}),
    // 强制确保使用我们的设计基准颜色
    background: STEP_CARD_DESIGN_TOKENS.colors.bg.primary,
    color: STEP_CARD_DESIGN_TOKENS.colors.text.primary,
    border: `1px solid ${STEP_CARD_DESIGN_TOKENS.colors.border.default}`,
  };

  return (
    <div
      className={`modern-draggable-step-card ${styles.darkThemeCard}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          card.style.borderColor = STEP_CARD_DESIGN_TOKENS.colors.border.hover;
          card.style.boxShadow = STEP_CARD_DESIGN_TOKENS.shadows.brand;
          card.style.transform = CSS.Transform.toString(transform) + ' translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          card.style.borderColor = STEP_CARD_DESIGN_TOKENS.colors.border.default;
          card.style.boxShadow = STEP_CARD_DESIGN_TOKENS.shadows.sm;
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
        <div 
          className="step-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',  // 顶部对齐，而非居中
            justifyContent: 'space-between',
            gap: STEP_CARD_DESIGN_TOKENS.spacing.sm,
            flexWrap: 'wrap',  // 允许换行
            minWidth: 0,  // 防止溢出
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: STEP_CARD_DESIGN_TOKENS.spacing.md,
            flex: '1 1 0%',  // 更灵活的flex设置
            minWidth: 0,  // 允许收缩
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
              fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.lg,
              fontWeight: STEP_CARD_DESIGN_TOKENS.typography.fontWeight.medium,
              color: STEP_CARD_DESIGN_TOKENS.colors.text.primary,
              flex: '1 1 0%',
              lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.tight,
              minWidth: 0,  // 允许文字收缩
              wordBreak: 'break-word',  // 长文字可以换行
              overflowWrap: 'break-word',  // 兼容性更好的换行
            }}>
              {step.description || step.name || `步骤 ${index + 1}`}
            </h4>
          </div>

          {/* 操作按钮组 */}
          <div 
            className="button-group"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: STEP_CARD_DESIGN_TOKENS.spacing.xs,
              flexWrap: 'wrap',  // 允许换行
              justifyContent: 'flex-end',  // 右对齐
              minWidth: 0,  // 允许收缩
              // 当空间不足时自动换行
              flexShrink: 1,
              // 设置最大宽度，超过时换行
              maxWidth: '100%',
            }}>
            
            {/* 🧠 紧凑策略菜单 */}
            {step.enableStrategySelector && step.strategySelector && (
              <CompactStrategyMenu
                selector={step.strategySelector}
                events={{
                  onStrategyChange: (selection) => onStrategyChange?.(step.id, selection),
                  onReanalyze: () => onReanalyze?.(step.id),
                  onSaveAsStatic: (candidate) => onSaveAsStatic?.(step.id, candidate),
                  onOpenElementInspector: () => onOpenElementInspector?.(step.id),
                  onCancelAnalysis: (jobId) => onCancelAnalysis?.(step.id, jobId),
                  onApplyRecommendation: (key) => onApplyRecommendation?.(step.id, key),
                }}
                disabled={!step.enabled}
                compact={true}
              />
            )}

            {/* 🧠 XML快照信息胶囊 */}
            {step.parameters?.xmlSnapshot && (
              <button
                type="button"
                title={`原始XML快照 ${new Date((step.parameters.xmlSnapshot.timestamp as number) || 0).toLocaleString()}`}
                onClick={() => {
                  // TODO: 实现重新加载原始XML功能
                  console.log('重新加载原始XML:', step.parameters?.xmlSnapshot);
                }}
                style={{
                  border: `1px solid ${STEP_CARD_DESIGN_TOKENS.colors.border.default}`,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                XML {(step.parameters.xmlSnapshot as { xmlHash?: string })?.xmlHash?.slice(7, 14) || 'cache'} • 
                {new Date((step.parameters.xmlSnapshot as { timestamp?: number })?.timestamp || 0).toLocaleTimeString().slice(0, 5)}
              </button>
            )}

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
                padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                color: STEP_CARD_DESIGN_TOKENS.colors.text.secondary,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = STEP_CARD_DESIGN_TOKENS.colors.bg.secondary;
                e.currentTarget.style.color = STEP_CARD_DESIGN_TOKENS.colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = STEP_CARD_DESIGN_TOKENS.colors.text.secondary;
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
                padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                color: step.enabled 
                  ? STEP_CARD_DESIGN_TOKENS.colors.status.success
                  : STEP_CARD_DESIGN_TOKENS.colors.text.muted,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = STEP_CARD_DESIGN_TOKENS.colors.bg.secondary;
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
                padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                color: STEP_CARD_DESIGN_TOKENS.colors.text.muted,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = STEP_CARD_DESIGN_TOKENS.colors.status.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = STEP_CARD_DESIGN_TOKENS.colors.text.muted;
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 状态条 */}
        <div 
          className="status-indicator"
          style={{
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
          gap: STEP_CARD_DESIGN_TOKENS.spacing.md,
          fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.md,
          color: STEP_CARD_DESIGN_TOKENS.colors.text.muted,
          lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.normal,
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
            padding: `${STEP_CARD_DESIGN_TOKENS.spacing.sm} ${STEP_CARD_DESIGN_TOKENS.spacing.md}`,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
            fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.sm,
            color: STEP_CARD_DESIGN_TOKENS.colors.status.info,
            lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.normal,
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

        {/* 🧠 策略选择器 - 已移至标题栏紧凑模式 */}
        {/* 保留原始策略选择器组件以备需要详细视图时使用 */}
      </div>
    </div>
  );
};

export const DraggableStepCard = React.memo(DraggableStepCardInner);

export default DraggableStepCard;