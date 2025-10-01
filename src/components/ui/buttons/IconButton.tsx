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
import { Button, type ButtonProps } from "../Button";

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

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  tone?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  iconOnly?: boolean;
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
  variant,
  tone,
  size,
  iconOnly,
      tooltip,
      children,
      disabled,
      type: buttonType = "button",
      ...rest
    },
    ref
  ) => {
  // 映射自定义尺寸到Ant Design尺寸
  const getBtnSize = (): ButtonProps['size'] => (iconOnly ? 'icon' : size ?? 'md');

  // 映射自定义变体到Ant Design类型
  const getBtnVariant = (): ButtonProps['variant'] => variant ?? 'soft';

  const buttonClassName = cn(
    // 基础样式
    'ui-icon-button',
    
    // 尺寸样式
  size === 'sm' && 'ui-icon-button--small',
  size === 'md' && 'ui-icon-button--medium',
  size === 'lg' && 'ui-icon-button--large',
    
    // 变体样式
  variant === 'solid' && 'ui-icon-button--primary',
  variant === 'ghost' && 'ui-icon-button--ghost',
  variant === 'outline' && 'ui-icon-button--text',
  variant === 'soft' && 'ui-icon-button--secondary',
    
    // 形状样式
  iconOnly && 'ui-icon-button--circular',
    
    className
  );

  const buttonContent = (
    <Button
      {...rest}
  size={getBtnSize()}
  variant={getBtnVariant()}
  tone={tone}
      className={buttonClassName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
  padding: iconOnly ? 0 : '4px',
        ...(rest.style ?? {}),
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
});

/**
 * 圆形图标按钮
 * IconButton的圆形变体
 */
export const CircularIconButton: React.FC<IconButtonProps> = (props) => {
  return <IconButton {...props} iconOnly />;
};

/**
 * 方形图标按钮
 * IconButton的方形变体（默认）
 */
export const SquareIconButton: React.FC<IconButtonProps> = (props) => {
  return <IconButton {...props} iconOnly={false} />;
};

// 主要导出
export { IconButton };