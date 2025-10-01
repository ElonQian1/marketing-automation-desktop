// 文件路径：src/components/ui/buttons/IconButton.tsx

/**
 * IconButton 组件 - 基于设计令牌的图标按钮
 *
 * 特性：
 * - CVA 变体系统：尺寸、样式、色调、形状统一管理
 * - 设计令牌：完全基于 design tokens，支持主题切换
 * - Motion 预设：集成悬停、按下、禁用态动效
 * - 无障碍支持：焦点环、键盘导航、屏幕阅读器友好
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn, focusRing, fastTransition } from "../utils";
import { motionPresets } from "../motion";

const iconButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-[var(--radius)] font-medium",
    "border border-transparent",
    "transition-all duration-[var(--duration-hover)]",
    "ring-offset-[var(--bg-base)]",
    focusRing,
    fastTransition,
    "disabled:pointer-events-none disabled:opacity-60",
  ],
  {
    variants: {
      variant: {
        solid: "shadow-[var(--shadow-sm)]",
        soft: "",
        outline: "border-border-primary bg-transparent",
        ghost: "bg-transparent",
      },
      tone: {
        brand: "",
        neutral: "",
        success: "",
        warning: "",
        danger: "",
        info: "",
      },
      size: {
        sm: "h-8 w-8 text-sm",
        md: "h-10 w-10 text-base",
        lg: "h-12 w-12 text-lg",
      },
      shape: {
        square: "rounded-[var(--radius)]",
        circular: "rounded-full",
      },
    },
    compoundVariants: [
      // Solid variant colors
      {
        variant: "solid",
        tone: "brand",
        className: "bg-brand text-white hover:bg-brand-600 shadow-[var(--shadow-brand-glow)]",
      },
      {
        variant: "solid",
        tone: "neutral",
        className: "bg-background-secondary text-text-primary hover:bg-background-tertiary",
      },
      {
        variant: "solid",
        tone: "success",
        className: "bg-success text-white hover:opacity-90",
      },
      {
        variant: "solid",
        tone: "warning",
        className: "bg-warning text-white hover:opacity-90",
      },
      {
        variant: "solid",
        tone: "danger",
        className: "bg-error text-white hover:opacity-90",
      },
      {
        variant: "solid",
        tone: "info",
        className: "bg-info text-white hover:opacity-90",
      },
      
      // Soft variant colors
      {
        variant: "soft",
        tone: "brand",
        className: "bg-brand-50 text-brand hover:bg-brand-100",
      },
      {
        variant: "soft",
        tone: "neutral",
        className: "bg-background-secondary text-text-primary hover:bg-background-tertiary",
      },
      {
        variant: "soft",
        tone: "success",
        className: "bg-success-50 text-success hover:bg-success-100",
      },
      {
        variant: "soft",
        tone: "warning",
        className: "bg-warning-50 text-warning hover:bg-warning-100",
      },
      {
        variant: "soft",
        tone: "danger",
        className: "bg-error-50 text-error hover:bg-error-100",
      },
      {
        variant: "soft",
        tone: "info",
        className: "bg-info-50 text-info hover:bg-info-100",
      },
      
      // Outline variant colors
      {
        variant: "outline",
        tone: "brand",
        className: "border-brand text-brand hover:bg-brand-50",
      },
      {
        variant: "outline",
        tone: "neutral",
        className: "border-border-primary text-text-primary hover:bg-background-secondary",
      },
      {
        variant: "outline",
        tone: "success",
        className: "border-success text-success hover:bg-success-50",
      },
      {
        variant: "outline",
        tone: "warning",
        className: "border-warning text-warning hover:bg-warning-50",
      },
      {
        variant: "outline",
        tone: "danger",
        className: "border-error text-error hover:bg-error-50",
      },
      {
        variant: "outline",
        tone: "info",
        className: "border-info text-info hover:bg-info-50",
      },
      
      // Ghost variant colors
      {
        variant: "ghost",
        tone: "brand",
        className: "text-brand hover:bg-brand-50",
      },
      {
        variant: "ghost",
        tone: "neutral",
        className: "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
      },
      {
        variant: "ghost",
        tone: "success",
        className: "text-success hover:bg-success-50",
      },
      {
        variant: "ghost",
        tone: "warning",
        className: "text-warning hover:bg-warning-50",
      },
      {
        variant: "ghost",
        tone: "danger",
        className: "text-error hover:bg-error-50",
      },
      {
        variant: "ghost",
        tone: "info",
        className: "text-info hover:bg-info-50",
      },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
      size: "md",
      shape: "square",
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** 是否作为子组件渲染（用于自定义元素如 Link） */
  asChild?: boolean;
  /** 工具提示文本 */
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      tone,
      size,
      shape,
      asChild = false,
      children,
      disabled,
      type: buttonType = "button",
      ...rest
    },
    ref
  ) => {
  // 映射自定义尺寸到Ant Design尺寸
  const getAntdSize = (): AntButtonProps['size'] => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'middle';
    }
  };

  // 映射自定义变体到Ant Design类型
  const getAntdType = (): AntButtonProps['type'] => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'ghost':
        return 'dashed';
      case 'text':
        return 'text';
      case 'danger':
        return 'primary';
      default:
        return 'default';
    }
  };

  const buttonClassName = cn(
    // 基础样式
    'ui-icon-button',
    
    // 尺寸样式
    size === 'small' && 'ui-icon-button--small',
    size === 'medium' && 'ui-icon-button--medium',
    size === 'large' && 'ui-icon-button--large',
    
    // 变体样式
    variant === 'primary' && 'ui-icon-button--primary',
    variant === 'secondary' && 'ui-icon-button--secondary',
    variant === 'ghost' && 'ui-icon-button--ghost',
    variant === 'text' && 'ui-icon-button--text',
    variant === 'danger' && 'ui-icon-button--danger',
    
    // 形状样式
    circular && 'ui-icon-button--circular',
    square && 'ui-icon-button--square',
    
    className
  );

  const buttonContent = (
    <Button
      {...props}
      size={getAntdSize()}
      type={getAntdType()}
      danger={variant === 'danger'}
      shape={circular ? 'circle' : 'default'}
      className={buttonClassName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: circular ? 0 : '4px',
        ...props.style,
      }}
    >
      {children}
    </Button>
  );

  // 如果有工具提示，包装在Tooltip组件中
  if (tooltip) {
    // 这里可以添加Tooltip组件，暂时返回基础按钮
    return buttonContent;
  }

  return buttonContent;
};

/**
 * 圆形图标按钮
 * IconButton的圆形变体
 */
export const CircularIconButton: React.FC<Omit<IconButtonProps, 'circular' | 'square'>> = (props) => {
  return <IconButton {...props} circular square={false} />;
};

/**
 * 方形图标按钮
 * IconButton的方形变体（默认）
 */
export const SquareIconButton: React.FC<Omit<IconButtonProps, 'circular' | 'square'>> = (props) => {
  return <IconButton {...props} square circular={false} />;
};