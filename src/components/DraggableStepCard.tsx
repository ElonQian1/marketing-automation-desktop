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

import React, { useState, useMemo, useEffect } from "react";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown, Button } from "antd";
import { SmartActionType } from "../types/smartComponents";
import { isBackendHealthy } from "../services/backend-health-check";
import styles from "./DraggableStepCard.module.css";
// import StrategySelector from './strategy-selector/StrategySelector'; // 暂时不用，保留备用
import CompactStrategyMenu from "./strategy-selector/CompactStrategyMenu";
import { TextMatchingInlineControl } from "./text-matching";
import { ActionParamsPanel } from "./action-system/ActionParamsPanel";
import type { ActionType, ActionParams } from "../types/action-types";
// 🎯 执行流控制功能导入
import { ExecutionFailureStrategy } from '../modules/execution-flow-control/domain/failure-handling-strategy';

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
    strategy?: "standard" | "absolute" | "strict" | "relaxed" | "positionless";
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

  // XML快照相关 - 只保留索引字段，实际内容通过缓存获取
  xmlSnapshot?: {
    xmlHash?: string;
    xmlCacheId?: string;
    timestamp?: number;
    [key: string]: unknown;
  };
  // 保持向后兼容，但建议使用 xmlSnapshot.xmlCacheId
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strategySelector?: any;
  enableStrategySelector?: boolean; // 是否启用策略选择器
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
  /** 参数更新回调 */
  onParametersChange?: (stepId: string, params: ActionParams) => void;
  /** 步骤参数更新回调 */
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, unknown>) => void;
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
      primary: "#1E293B", // 主背景（深蓝灰）
      secondary: "#334155", // 次要背景（中灰蓝）
      disabled: "#475569", // 禁用背景（浅灰蓝）
      hover: "#2D3748", // 悬停背景
    },
    // 文字色
    text: {
      primary: "#F8FAFC", // 主文字（纯白）
      secondary: "#E2E8F0", // 次要文字（浅灰）
      muted: "#CBD5E1", // 弱化文字（灰）
      inverse: "#1E293B", // 反色文字（深色）
    },
    // 边框色
    border: {
      default: "#334155", // 默认边框
      hover: "#7A9BFF", // 悬停边框（品牌蓝）
      focus: "#6E8BFF", // 焦点边框
    },
    // 状态色
    status: {
      success: "#10B981", // 成功（绿）
      warning: "#F59E0B", // 警告（橙）
      error: "#EF4444", // 错误（红）
      info: "#3B82F6", // 信息（蓝）
    },
    // 功能色
    functional: {
      brand: "#6E8BFF", // 品牌色
      accent: "#8B5CF6", // 强调色
    },
  },

  // 📏 间距系统
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
  },

  // 📐 圆角系统
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },

  // 🔤 字体系统
  typography: {
    fontSize: {
      xs: "10px",
      sm: "12px",
      md: "13px",
      base: "14px",
      lg: "16px",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  // 🌊 阴影系统
  shadows: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.12)",
    md: "0 2px 8px rgba(0, 0, 0, 0.15)",
    lg: "0 8px 32px rgba(0, 0, 0, 0.2)",
    brand: "0 0 16px rgba(110, 139, 255, 0.3)",
    hover: "0 4px 20px rgba(110, 139, 255, 0.15)",
  },

  // ⚡ 动画系统
  animations: {
    duration: {
      fast: "120ms",
      normal: "180ms",
      slow: "300ms",
    },
    easing: {
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // 📱 响应式断点
  breakpoints: {
    mobile: "480px", // 手机
    tablet: "768px", // 平板
    desktop: "1024px", // 桌面
  },

  // 📐 响应式间距
  responsiveSpacing: {
    mobile: {
      cardPadding: "10px",
      buttonGap: "6px",
    },
    tablet: {
      cardPadding: "12px",
      buttonGap: "4px",
    },
    desktop: {
      cardPadding: "16px",
      buttonGap: "4px",
    },
  },
};

const modernStepCardStyles = {
  // 基础卡片样式
  card: {
    position: "relative" as const,
    background: STEP_CARD_DESIGN_TOKENS.colors.bg.primary,
    color: STEP_CARD_DESIGN_TOKENS.colors.text.primary,
    border: `1px solid ${STEP_CARD_DESIGN_TOKENS.colors.border.default}`,
    borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.lg,
    padding: STEP_CARD_DESIGN_TOKENS.spacing.lg,
    minHeight: "80px",
    fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
    fontWeight: STEP_CARD_DESIGN_TOKENS.typography.fontWeight.normal,
    lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.normal,
    transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.normal} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
    cursor: "grab" as const,
    boxShadow: STEP_CARD_DESIGN_TOKENS.shadows.sm,
  },

  dragging: {
    cursor: "grabbing" as const,
    opacity: 0.8,
    boxShadow: STEP_CARD_DESIGN_TOKENS.shadows.brand,
    transform: "rotate(1deg)",
  },

  disabled: {
    opacity: 0.6,
    background: STEP_CARD_DESIGN_TOKENS.colors.bg.disabled,
    color: STEP_CARD_DESIGN_TOKENS.colors.text.muted,
  },
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
    onStrategyChange?: (
      stepId: string,
      selection: {
        type: "smart-auto" | "smart-single" | "static";
        key?: string;
        stepName?: string;
      }
    ) => void;
    onReanalyze?: (stepId: string) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSaveAsStatic?: (stepId: string, candidate: any) => void;
    onOpenElementInspector?: (stepId: string) => void;
    onCancelAnalysis?: (stepId: string, jobId: string) => void;
    onApplyRecommendation?: (stepId: string, key: string) => void;
    // 🔄 智能分析功能
    isAnalyzing?: boolean;
    // 拖拽相关
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  devices,
  currentDeviceId,
  onParametersChange,
  onUpdateStepParameters,
  transform,
  transition,
  style,
}) => {
  // Hook for reanalysis functionality - we'll need to get steps context from parent
  // For now, we'll use the original callback approach
  // TODO: Integrate with steps context from parent component

  // 🎛️ 参数面板状态管理
  const [showParams, setShowParams] = useState(false);
  
  // 🔑 实时参数状态 - 确保测试按钮使用最新参数
  const [currentParameters, setCurrentParameters] = useState(step.parameters || {});

  // 🔄 同步step.parameters变化到本地状态
  useEffect(() => {
    setCurrentParameters(step.parameters || {});
  }, [step.parameters]);

  // 🔄 合并后的step对象 - 确保测试按钮获得最新参数
  const currentStep = useMemo(() => ({
    ...step,
    parameters: currentParameters
  }), [step, currentParameters]);

  // 🔄 将步骤类型转换为ActionType
  const actionType = useMemo(() => {
    const typeMapping: Record<string, ActionType['type']> = {
      'tap': 'click',
      'click': 'click',
      'input': 'input', 
      'swipe_up': 'swipe_up',
      'swipe_down': 'swipe_down',
      'swipe_left': 'swipe_left', 
      'swipe_right': 'swipe_right',
      'long_press': 'long_press',
      'scroll': 'scroll',
      'wait': 'wait',
      'smart_scroll': 'swipe_down' // 智能滚动映射为下滑
    };

    const mappedType = typeMapping[step.step_type];
    if (mappedType) {
      return {
        type: mappedType,
        params: step.parameters as ActionParams // � 关键修复：使用实际参数，确保参数配置面板能获取到当前值
      };
    }
    return null;
  }, [step.step_type, step.parameters]); // 🔑 添加step.parameters依赖，确保参数变化时重新计算

  // 🎛️ 参数更新处理函数 
  const handleParametersChange = (params: ActionParams) => {
    // � 关键修复：立即更新本地参数状态，确保测试按钮使用最新参数
    setCurrentParameters(params as Record<string, unknown>);
    
    // �🔄 同时调用两个回调确保参数更新生效
    if (onParametersChange) {
      onParametersChange(step.id, params);
    }
    
    // 🔑 关键：更新step的实际parameters
    if (onUpdateStepParameters) {
      onUpdateStepParameters(step.id, params as Record<string, unknown>);
    }
  };

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  };

  // 获取状态配置
  const getStatusConfig = (enabled: boolean) => {
    if (enabled) {
      return {
        color: "var(--success, #10B981)",
        bgColor: "rgba(16, 185, 129, 0.1)",
        icon: "✓",
        text: "已启用",
      };
    } else {
      return {
        color: "var(--text-3, #CBD5E1)",
        bgColor: "var(--bg-secondary, #334155)",
        icon: "○",
        text: "已禁用",
      };
    }
  };

  const statusConfig = getStatusConfig(step.enabled);

  // 获取当前设备信息
  const currentDevice = devices.find((d) => d.id === currentDeviceId);

  // 🔄 检测是否为循环步骤
  const isLoopStep = step.step_type === 'loop_start' || step.step_type === 'loop_end';
  const isLoopStart = step.step_type === 'loop_start';
  const isLoopEnd = step.step_type === 'loop_end';

  const handleEdit = () => {
    if (onOpenPageAnalyzer) {
      onOpenPageAnalyzer();
    } else if (onEditStepParams) {
      onEditStepParams(step);
    } else {
      onEdit(step);
    }
  };

  // 🎨 循环步骤的独立样式基准线 - 统一蓝色配对
  const getLoopStepStyle = (): React.CSSProperties => {
    if (isLoopStart) {
      return {
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', // 浅蓝渐变
        border: '2px solid #0ea5e9', // 蓝色边框
        color: '#0c4a6e', // 深蓝文字
        boxShadow: '0 4px 16px rgba(14, 165, 233, 0.15)',
      };
    }
    if (isLoopEnd) {
      return {
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', // 相同浅蓝渐变
        border: '2px solid #0ea5e9', // 相同蓝色边框
        color: '#0c4a6e', // 相同深蓝文字
        boxShadow: '0 4px 16px rgba(14, 165, 233, 0.15)',
      };
    }
    return {};
  };

  // 组合样式 - 循环步骤使用独立样式，普通步骤使用原有样式
  const cardStyle: React.CSSProperties = {
    ...modernStepCardStyles.card,
    ...dragStyle,
    ...(isDragging ? modernStepCardStyles.dragging : {}),
    ...(!step.enabled ? modernStepCardStyles.disabled : {}),
    // 根据步骤类型应用不同样式
    ...(isLoopStep ? getLoopStepStyle() : {
      // 普通步骤：使用深色主题
      background: STEP_CARD_DESIGN_TOKENS.colors.bg.primary,
      color: STEP_CARD_DESIGN_TOKENS.colors.text.primary,
      border: `1px solid ${STEP_CARD_DESIGN_TOKENS.colors.border.default}`,
    }),
  };

  return (
    <div
      className={`modern-draggable-step-card ${styles.darkThemeCard} ${isLoopStep ? 'loop-step-card' : ''}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          if (isLoopStep) {
            // 循环步骤悬停效果 - 统一蓝色
            if (isLoopStart) {
              card.style.borderColor = '#0284c7';
              card.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.25)';
            } else if (isLoopEnd) {
              card.style.borderColor = '#0284c7'; // 相同的蓝色悬停
              card.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.25)'; // 相同的蓝色阴影
            }
          } else {
            // 普通步骤悬停效果
            card.style.borderColor = STEP_CARD_DESIGN_TOKENS.colors.border.hover;
            card.style.boxShadow = STEP_CARD_DESIGN_TOKENS.shadows.brand;
          }
          card.style.transform =
            CSS.Transform.toString(transform) + " translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          const card = e.currentTarget;
          if (isLoopStep) {
            // 恢复循环步骤原始样式 - 统一蓝色
            if (isLoopStart) {
              card.style.borderColor = '#0ea5e9';
              card.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.15)';
            } else if (isLoopEnd) {
              card.style.borderColor = '#0ea5e9'; // 相同的蓝色边框
              card.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.15)'; // 相同的蓝色阴影
            }
          } else {
            // 恢复普通步骤原始样式
            card.style.borderColor =
              STEP_CARD_DESIGN_TOKENS.colors.border.default;
            card.style.boxShadow = STEP_CARD_DESIGN_TOKENS.shadows.sm;
          }
          card.style.transform = CSS.Transform.toString(transform);
        }
      }}
    >
      {/* 拖拽指示器 */}
      <div
        style={{
          position: "absolute",
          left: "6px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "4px",
          height: "20px",
          background: "var(--text-3, #CBD5E1)",
          borderRadius: "2px",
          opacity: 0.5,
          cursor: "grab",
          transition: "all var(--duration-fast, 120ms)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.8";
          e.currentTarget.style.background = "var(--brand-400, #7A9BFF)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.5";
          e.currentTarget.style.background = "var(--text-3, #CBD5E1)";
        }}
      />

      {/* 卡片内容 */}
      <div
        style={{
          marginLeft: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* 头部：步骤编号 + 标题 + 操作 */}
        <div
          className="step-header"
          style={{
            display: "flex",
            alignItems: "flex-start", // 顶部对齐，而非居中
            justifyContent: "space-between",
            gap: STEP_CARD_DESIGN_TOKENS.spacing.sm,
            flexWrap: "wrap", // 允许换行
            minWidth: 0, // 防止溢出
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: STEP_CARD_DESIGN_TOKENS.spacing.md,
              flex: "1 1 0%", // 更灵活的flex设置
              minWidth: 0, // 允许收缩
            }}
          >
            {/* 步骤编号 */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isLoopStep
                  ? (isLoopStart 
                      ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" // 蓝色渐变
                      : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)") // 绿色渐变
                  : (step.enabled
                      ? "var(--brand-gradient-primary, linear-gradient(135deg, #6E8BFF 0%, #8B5CF6 100%))"
                      : "var(--bg-secondary, #334155)"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isLoopStep ? "#fff" : (step.enabled ? "#fff" : "var(--text-3, #CBD5E1)"),
                fontSize: isLoopStep ? "12px" : "13px",
                fontWeight: "600",
                flexShrink: 0,
                boxShadow: isLoopStep
                  ? (isLoopStart 
                      ? "0 2px 8px rgba(14, 165, 233, 0.3)"
                      : "0 2px 8px rgba(34, 197, 94, 0.3)")
                  : (step.enabled
                      ? "0 2px 8px rgba(110, 139, 255, 0.3)"
                      : "none"),
              }}
            >
              {isLoopStep ? (isLoopStart ? "🔄" : "✓") : (index + 1)}
            </div>

            {/* 标题 */}
            <h4
              style={{
                margin: 0,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.lg,
                fontWeight:
                  STEP_CARD_DESIGN_TOKENS.typography.fontWeight.medium,
                color: isLoopStep 
                  ? (isLoopStart ? '#0c4a6e' : '#14532d')  // 循环步骤使用对应颜色
                  : STEP_CARD_DESIGN_TOKENS.colors.text.primary,
                flex: "1 1 0%",
                lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.tight,
                minWidth: 0, // 允许文字收缩
                wordBreak: "break-word", // 长文字可以换行
                overflowWrap: "break-word", // 兼容性更好的换行
              }}
            >
              {isLoopStep 
                ? (isLoopStart ? "🔄 循环开始" : "✅ 循环结束")
                : (step.description || step.name || `步骤 ${index + 1}`)}
            </h4>
          </div>

          {/* 操作按钮组 */}
          <div
            className="button-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: STEP_CARD_DESIGN_TOKENS.spacing.xs,
              flexWrap: "wrap", // 允许换行
              justifyContent: "flex-end", // 右对齐
              minWidth: 0, // 允许收缩
              // 当空间不足时自动换行
              flexShrink: 1,
              // 设置最大宽度，超过时换行
              maxWidth: "100%",
            }}
          >
            {/* 🧠 策略选择器 */}
            {step.enableStrategySelector &&
              step.strategySelector &&
              (() => {
                // 🔇 日志优化：移除频繁的渲染日志
                // console.log("🎯 [DraggableStepCard] 渲染 CompactStrategyMenu", { stepId: step.id });
                
                // 🆕 从步骤参数中读取决策链配置
                const decisionChain = step.parameters?.decisionChain as {
                  executionChain?: string;
                  selectionMode?: import('../types/smartSelection').SelectionMode;
                  operationType?: import('../types/smartScript').ActionKind;
                  batchConfig?: unknown;
                  randomConfig?: unknown;
                  matchOriginalConfig?: unknown;
                } | undefined;
                  
                  return (
                    <CompactStrategyMenu
                      data-menu-version="v20251020-fix"
                      selector={(() => {
                        // ✅ 适配器：将简化的 strategySelector 转换为完整的 StrategySelector 接口
                        const result = step.strategySelector.analysis.result as
                          | {
                              smartCandidates?: Array<{
                                key: string;
                                name: string;
                                confidence: number;
                                selector: string;
                                stepName?: string;
                              }>;
                              staticCandidates?: Array<{
                                key: string;
                                name: string;
                                selector: string;
                              }>;
                              recommendedKey?: string;
                            }
                          | undefined;

                      // 转换候选策略为完整的 StrategyCandidate 类型
                      const smartCandidates = (
                        result?.smartCandidates || []
                      ).map((c) => ({
                        key: c.key,
                        type: "smart" as const,
                        name: c.name,
                        confidence: c.confidence || 0.5,
                        selector: c.selector,
                        stepName: c.stepName as
                          | "step1"
                          | "step2"
                          | "step3"
                          | "step4"
                          | "step5"
                          | "step6"
                          | undefined,
                      }));

                      const staticCandidates = (
                        result?.staticCandidates || []
                      ).map((c) => ({
                        key: c.key,
                        type: "static" as const,
                        name: c.name,
                        confidence: 1.0,
                        selector: c.selector,
                      }));

                      return {
                        activeStrategy: step.strategySelector.selectedStrategy
                          ? {
                              type: step.strategySelector.selectedStrategy as
                                | "smart-auto"
                                | "smart-single"
                                | "static",
                              stepName: step.strategySelector.selectedStep as
                                | "step1"
                                | "step2"
                                | "step3"
                                | "step4"
                                | "step5"
                                | "step6"
                                | undefined,
                            }
                          : undefined,
                        analysis: step.strategySelector.analysis,
                        candidates: {
                          smart: smartCandidates,
                          static: staticCandidates,
                        },
                        recommended: result?.recommendedKey
                          ? {
                              key: result.recommendedKey,
                              confidence: 0.85,
                              autoApplied: false,
                            }
                          : undefined,
                        config: {
                          autoFollowSmart: false,
                          confidenceThreshold: 0.82,
                          enableFallback: true,
                        },
                      };
                    })()}
                    events={{
                      onStrategyChange: (selection) =>
                        onStrategyChange?.(step.id, selection),
                      onReanalyze: () => onReanalyze?.(step.id),
                      onSaveAsStatic: (candidate) =>
                        onSaveAsStatic?.(step.id, candidate),
                      onOpenElementInspector: () =>
                        onOpenElementInspector?.(step.id),
                      onCancelAnalysis: (jobId) =>
                        onCancelAnalysis?.(step.id, jobId),
                      onApplyRecommendation: (key) =>
                        onApplyRecommendation?.(step.id, key),
                    }}
                    disabled={!isBackendHealthy()}
                    compact={true}
                    stepId={step.id}
                    // 🆕 传递初始配置（从步骤参数恢复）
                    initialSelectionMode={decisionChain?.selectionMode || 'first'}
                    initialOperationType={decisionChain?.operationType || 'tap'}
                    initialBatchConfig={decisionChain?.batchConfig as import('../components/strategy-selector/types/selection-config').BatchConfig | undefined}
                    initialRandomConfig={decisionChain?.randomConfig as import('../components/strategy-selector/types/selection-config').RandomConfig | undefined}
                    initialMatchOriginalConfig={decisionChain?.matchOriginalConfig as import('../components/strategy-selector/types/selection-config').MatchOriginalConfig | undefined}
                    onUpdateStepParameters={(stepId, partialParams) => {
                      // 🔑 深度合并参数，支持部分更新
                      if (onUpdateStepParameters) {
                        const currentParams = step.parameters || {};
                        const currentSmartSelection = (currentParams.smartSelection as Record<string, unknown>) || {};
                        const partialSmartSelection = (partialParams.smartSelection as Record<string, unknown>) || {};
                        
                        const mergedParams = {
                          ...currentParams,
                          ...partialParams,
                          // 特殊处理 smartSelection：深度合并
                          smartSelection: {
                            ...currentSmartSelection,
                            ...partialSmartSelection,
                          }
                        };
                        console.log('🔄 [DraggableStepCard] 深度合并参数后更新:', {
                          stepId,
                          currentParams,
                          partialParams,
                          mergedParams
                        });
                        onUpdateStepParameters(stepId, mergedParams);
                      }
                    }}
                    extraButtons={(() => {
                      // 🔧 修复失败处理按钮逻辑 - 直接从step.parameters中读取失败配置
                      const currentFailureHandling = step.parameters?.failureHandling as {
                        strategy?: 'STOP_SCRIPT' | 'CONTINUE_NEXT' | 'JUMP_TO_STEP' | 'RETRY_CURRENT' | 'SKIP_CURRENT';
                        jumpTarget?: string;
                        retryCount?: number;
                        retryDelay?: number;
                        enabled?: boolean;
                      } | undefined;

                      // 🔄 转换为ExecutionFailureStrategy格式进行显示
                      const getCurrentStrategy = (): ExecutionFailureStrategy => {
                        if (!currentFailureHandling?.enabled || !currentFailureHandling?.strategy) {
                          return ExecutionFailureStrategy.STOP_SCRIPT; // 默认策略
                        }
                        
                        switch (currentFailureHandling.strategy) {
                          case 'STOP_SCRIPT':
                            return ExecutionFailureStrategy.STOP_SCRIPT;
                          case 'CONTINUE_NEXT':
                            return ExecutionFailureStrategy.CONTINUE_NEXT;
                          case 'RETRY_CURRENT':
                            return ExecutionFailureStrategy.RETRY_CURRENT;
                          case 'JUMP_TO_STEP':
                            return ExecutionFailureStrategy.JUMP_TO_STEP;
                          case 'SKIP_CURRENT':
                            return ExecutionFailureStrategy.SKIP_CURRENT;
                          default:
                            return ExecutionFailureStrategy.STOP_SCRIPT;
                        }
                      };

                      // 📝 更新失败配置的处理函数
                      const handleFailureConfigUpdate = (strategy: 'STOP_SCRIPT' | 'CONTINUE_NEXT' | 'JUMP_TO_STEP' | 'RETRY_CURRENT' | 'SKIP_CURRENT') => {
                        console.log('🔄 [DraggableStepCard] 更新失败处理策略:', { stepId: step.id, strategy });
                        
                        const newFailureHandling = {
                          strategy,
                          enabled: true,
                          ...(strategy === 'JUMP_TO_STEP' && { jumpTarget: 'step-1' }),
                          ...(strategy === 'RETRY_CURRENT' && { retryCount: 3, retryDelay: 1000 })
                        };

                        const updatedParameters = {
                          ...step.parameters,
                          failureHandling: newFailureHandling
                        };

                        console.log('📝 [DraggableStepCard] 保存新的参数:', { 
                          stepId: step.id, 
                          oldParams: step.parameters,
                          newParams: updatedParameters 
                        });

                        onUpdateStepParameters?.(step.id, updatedParameters);
                      };

                      const getFailureStrategyText = (strategy: ExecutionFailureStrategy) => {
                        switch (strategy) {
                          case ExecutionFailureStrategy.STOP_SCRIPT:
                            return '失败时🛑 终止';
                          case ExecutionFailureStrategy.CONTINUE_NEXT:
                            return '失败时⏭️ 继续下一步';
                          case ExecutionFailureStrategy.RETRY_CURRENT:
                            return '失败时🔄 重试';
                          case ExecutionFailureStrategy.JUMP_TO_STEP:
                            return '失败时🎯 跳转';
                          case ExecutionFailureStrategy.SKIP_CURRENT:
                            return '失败时⏸️ 跳过';
                          default:
                            return '失败时🛑 终止';
                        }
                      };

                      const currentStrategy = getCurrentStrategy();

                      const failureStrategyMenuItems = [
                        {
                          key: 'STOP_SCRIPT',
                          label: '🛑 终止整个脚本',
                          onClick: () => handleFailureConfigUpdate('STOP_SCRIPT')
                        },
                        {
                          key: 'CONTINUE_NEXT', 
                          label: '⏭️ 继续下一步',
                          onClick: () => handleFailureConfigUpdate('CONTINUE_NEXT')
                        },
                        {
                          key: 'RETRY_CURRENT',
                          label: '🔄 重试当前步骤',
                          onClick: () => handleFailureConfigUpdate('RETRY_CURRENT')
                        },
                        {
                          key: 'JUMP_TO_STEP',
                          label: '🎯 跳转到指定步骤',
                          onClick: () => handleFailureConfigUpdate('JUMP_TO_STEP')
                        },
                        {
                          key: 'SKIP_CURRENT',
                          label: '⏸️ 跳过当前步骤',
                          onClick: () => handleFailureConfigUpdate('SKIP_CURRENT')
                        }
                      ];

                      return (
                        <Dropdown
                          menu={{ items: failureStrategyMenuItems }}
                          trigger={['click']}
                          placement="bottomLeft"
                        >
                          <Button
                            size="small"
                            type="default"
                            title="配置失败处理策略"
                            style={{
                              background: "rgba(110, 139, 255, 0.1)",
                              border: "1px solid rgba(110, 139, 255, 0.3)",
                              color: "#F8FAFC",
                              fontSize: "12px",
                            }}
                          >
                            {getFailureStrategyText(currentStrategy)}
                            <span style={{ marginLeft: "4px" }}>▾</span>
                          </Button>
                        </Dropdown>
                      );
                    })()}
                  />
                );
              })()}

            {/* 🧠 XML快照信息胶囊 */}
            {step.parameters?.xmlSnapshot && (
              <button
                type="button"
                title={`原始XML快照 ${new Date(
                  (step.parameters.xmlSnapshot.timestamp as number) || 0
                ).toLocaleString()}`}
                onClick={() => {
                  // TODO: 实现重新加载原始XML功能
                  console.log("重新加载原始XML:", step.parameters?.xmlSnapshot);
                }}
                style={{
                  border: `1px solid ${STEP_CARD_DESIGN_TOKENS.colors.border.default}`,
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "#3B82F6",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                XML{" "}
                {(
                  step.parameters.xmlSnapshot as { xmlHash?: string }
                )?.xmlHash?.slice(7, 14) || "cache"}{" "}
                •
                {new Date(
                  (step.parameters.xmlSnapshot as { timestamp?: number })
                    ?.timestamp || 0
                )
                  .toLocaleTimeString()
                  .slice(0, 5)}
              </button>
            )}

            {/* 测试按钮 */}
            {StepTestButton && (
              <StepTestButton
                step={currentStep}
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
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                color: STEP_CARD_DESIGN_TOKENS.colors.text.secondary,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  STEP_CARD_DESIGN_TOKENS.colors.bg.secondary;
                e.currentTarget.style.color =
                  STEP_CARD_DESIGN_TOKENS.colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color =
                  STEP_CARD_DESIGN_TOKENS.colors.text.secondary;
              }}
            >
              ✏️
            </button>

            {/* 🎛️ 参数设置按钮 */}
            {actionType && (
              <button
                type="button"
                onClick={() => setShowParams(!showParams)}
                title={showParams ? "隐藏参数面板" : "显示参数面板"}
                style={{
                  border: "none",
                  background: showParams ? "rgba(59, 130, 246, 0.2)" : "transparent",
                  cursor: "pointer",
                  padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                  borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                  color: showParams 
                    ? STEP_CARD_DESIGN_TOKENS.colors.status.info
                    : STEP_CARD_DESIGN_TOKENS.colors.text.secondary,
                  fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                  transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  if (!showParams) {
                    e.currentTarget.style.background =
                      STEP_CARD_DESIGN_TOKENS.colors.bg.secondary;
                    e.currentTarget.style.color =
                      STEP_CARD_DESIGN_TOKENS.colors.text.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showParams) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color =
                      STEP_CARD_DESIGN_TOKENS.colors.text.secondary;
                  }
                }}
              >
                ⚙️
              </button>
            )}

            {/* 启用/禁用切换 */}
            <button
              type="button"
              onClick={() => onToggle(step.id)}
              title={step.enabled ? "禁用步骤" : "启用步骤"}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                color: step.enabled
                  ? STEP_CARD_DESIGN_TOKENS.colors.status.success
                  : STEP_CARD_DESIGN_TOKENS.colors.text.muted,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  STEP_CARD_DESIGN_TOKENS.colors.bg.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {step.enabled ? "✅" : "⭕"}
            </button>

            {/* 删除按钮 */}
            <button
              type="button"
              onClick={() => onDelete(step.id)}
              title="删除步骤"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: STEP_CARD_DESIGN_TOKENS.spacing.sm,
                borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
                color: STEP_CARD_DESIGN_TOKENS.colors.text.muted,
                fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.base,
                transition: `all ${STEP_CARD_DESIGN_TOKENS.animations.duration.fast} ${STEP_CARD_DESIGN_TOKENS.animations.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.color =
                  STEP_CARD_DESIGN_TOKENS.colors.status.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color =
                  STEP_CARD_DESIGN_TOKENS.colors.text.muted;
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 状态条 - 循环步骤简化显示 */}
        <div
          className="status-indicator"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: isLoopStep ? "6px 10px" : "8px 12px", // 循环步骤稍微小一点
            background: isLoopStep 
              ? (isLoopStart ? "rgba(14, 165, 233, 0.1)" : "rgba(34, 197, 94, 0.1)")
              : statusConfig.bgColor,
            borderRadius: "6px",
            fontSize: isLoopStep ? "11px" : "12px",
          }}
        >
          <span
            style={{
              color: isLoopStep 
                ? (isLoopStart ? "#0ea5e9" : "#22c55e")
                : statusConfig.color,
              fontSize: "12px",
            }}
          >
            {isLoopStep 
              ? (isLoopStart ? "🔄" : "🏁")
              : statusConfig.icon}
          </span>
          <span
            style={{
              color: isLoopStep 
                ? "#0ea5e9" // 统一使用蓝色
                : statusConfig.color,
              fontWeight: "500",
            }}
          >
            {isLoopStep 
              ? (isLoopStart ? "循环开始" : "循环结束")
              : statusConfig.text}
          </span>
        </div>

        {/* 文本匹配控制 - 仅在非循环步骤中显示 */}
        {!isLoopStep && (
          <TextMatchingInlineControl
            compact
            style={{
              marginTop: "8px",
              padding: "6px 8px",
              background: "rgba(59, 130, 246, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(59, 130, 246, 0.1)"
            }}
          />
        )}

        {/* 步骤详情 - 循环步骤简化显示 */}
        {!isLoopStep && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: STEP_CARD_DESIGN_TOKENS.spacing.md,
              fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.md,
              color: STEP_CARD_DESIGN_TOKENS.colors.text.muted,
              lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.normal,
            }}
          >
            <span>类型: {step.step_type}</span>

            {step.parameters?.element_selector && (
              <span>
                选择器:{" "}
                {step.parameters.element_selector.length > 30
                  ? step.parameters.element_selector.substring(0, 30) + "..."
                  : step.parameters.element_selector}
              </span>
            )}

            {currentDevice && <span>设备: {currentDevice.name}</span>}
          </div>
        )}

        {/* 循环步骤的简化信息 - 统一蓝色配对样式 */}
        {isLoopStep && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: STEP_CARD_DESIGN_TOKENS.spacing.sm,
              fontSize: "11px",
              color: "#0c4a6e", // 统一使用深蓝色
              lineHeight: 1.3,
              fontWeight: "500",
              background: "rgba(14, 165, 233, 0.1)", // 统一使用蓝色背景
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(14, 165, 233, 0.2)", // 统一使用蓝色边框
            }}
          >
            <span>
              {isLoopStart 
                ? `🔄 循环类型: ${step.parameters?.loop_type || 'for'} 次数: ${step.parameters?.iterations || '3'} ✓ 已启用`
                : `🏁 循环结束 类型: ${step.parameters?.loop_type || 'for'} ✓ 已启用`}
            </span>
          </div>
        )}

        {/* 循环信息 */}
        {step.loop_config && (
          <div
            style={{
              padding: `${STEP_CARD_DESIGN_TOKENS.spacing.sm} ${STEP_CARD_DESIGN_TOKENS.spacing.md}`,
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.sm,
              fontSize: STEP_CARD_DESIGN_TOKENS.typography.fontSize.sm,
              color: STEP_CARD_DESIGN_TOKENS.colors.status.info,
              lineHeight: STEP_CARD_DESIGN_TOKENS.typography.lineHeight.normal,
            }}
          >
            <div style={{ fontWeight: "500", marginBottom: "4px" }}>
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

        {/* 🎛️ 参数配置面板 */}
        {showParams && actionType && (
          <div
            style={{
              marginTop: STEP_CARD_DESIGN_TOKENS.spacing.md,
              padding: STEP_CARD_DESIGN_TOKENS.spacing.md,
              background: "rgba(30, 41, 59, 0.8)",
              borderRadius: STEP_CARD_DESIGN_TOKENS.borderRadius.md,
              border: "1px solid rgba(59, 130, 246, 0.2)",
              pointerEvents: 'auto',
              cursor: 'default'
            }}
          >
            <div 
              className="dark-theme-params-panel"
              style={{ 
                color: 'var(--text-1, #F8FAFC)',
                pointerEvents: 'auto',
                cursor: 'default'
              }}
            >
              <ActionParamsPanel
                action={actionType}
                initialParams={step.parameters as ActionParams}
                onChange={handleParametersChange}
                size="small"
                title="操作参数配置"
              />
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
