// src/components/ui/buttons/IconButton.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

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
        solid: "shadow-sm",
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
        className: "bg-[var(--brand)] text-[var(--text-contrast)] hover:bg-[var(--brand-600)] shadow-lg",
      },
      {
        variant: "solid",
        tone: "neutral",
        className: "bg-background-secondary text-text-primary hover:bg-background-tertiary",
      },
      {
        variant: "solid",
        tone: "success",
        className: "bg-[var(--success)] text-[var(--text-contrast)] hover:opacity-90",
      },
      {
        variant: "solid",
        tone: "warning",
        className: "bg-[var(--warning)] text-[var(--text-contrast)] hover:opacity-90",
      },
      {
        variant: "solid",
        tone: "danger",
        className: "bg-[var(--error)] text-[var(--text-contrast)] hover:opacity-90",
      },
      {
        variant: "solid",
        tone: "info",
        className: "bg-[var(--info)] text-[var(--text-contrast)] hover:opacity-90",
      },
      
      // Soft variant colors
      {
        variant: "soft",
        tone: "brand",
        className: "bg-[var(--brand-50)] text-[var(--brand)] hover:bg-[var(--brand-100)]",
      },
      {
        variant: "soft",
        tone: "neutral",
        className: "bg-background-secondary text-text-primary hover:bg-background-tertiary",
      },
      {
        variant: "soft",
        tone: "success",
        className: "bg-[var(--success-50)] text-[var(--success)] hover:bg-[var(--success-100)]",
      },
      {
        variant: "soft",
        tone: "warning",
        className: "bg-[var(--warning-50)] text-[var(--warning)] hover:bg-[var(--warning-100)]",
      },
      {
        variant: "soft",
        tone: "danger",
        className: "bg-[var(--error-50)] text-[var(--error)] hover:bg-[var(--error-100)]",
      },
      {
        variant: "soft",
        tone: "info",
        className: "bg-[var(--info-50)] text-[var(--info)] hover:bg-[var(--info-100)]",
      },
      
      // Outline variant colors
      {
        variant: "outline",
        tone: "brand",
        className: "border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-50)]",
      },
      {
        variant: "outline",
        tone: "neutral",
        className: "border-border-primary text-text-primary hover:bg-background-secondary",
      },
      {
        variant: "outline",
        tone: "success",
        className: "border-[var(--success)] text-[var(--success)] hover:bg-[var(--success-50)]",
      },
      {
        variant: "outline",
        tone: "warning",
        className: "border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning-50)]",
      },
      {
        variant: "outline",
        tone: "danger",
        className: "border-[var(--error)] text-[var(--error)] hover:bg-[var(--error-50)]",
      },
      {
        variant: "outline",
        tone: "info",
        className: "border-[var(--info)] text-[var(--info)] hover:bg-[var(--info-50)]",
      },
      
      // Ghost variant colors
      {
        variant: "ghost",
        tone: "brand",
        className: "text-[var(--brand)] hover:bg-[var(--brand-50)]",
      },
      {
        variant: "ghost",
        tone: "neutral",
        className: "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
      },
      {
        variant: "ghost",
        tone: "success",
        className: "text-[var(--success)] hover:bg-[var(--success-50)]",
      },
      {
        variant: "ghost",
        tone: "warning",
        className: "text-[var(--warning)] hover:bg-[var(--warning-50)]",
      },
      {
        variant: "ghost",
        tone: "danger",
        className: "text-[var(--error)] hover:bg-[var(--error-50)]",
      },
      {
        variant: "ghost",
        tone: "info",
        className: "text-[var(--info)] hover:bg-[var(--info-50)]",
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
      tooltip,
      children,
      disabled,
      type: buttonType = "button",
      ...rest
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(iconButtonVariants({ variant, tone, size, shape }), className)}
        ref={ref}
        type={buttonType}
        disabled={disabled}
        {...rest}
      >
        {children}
      </Comp>
    );
  }
);

IconButton.displayName = "IconButton";

/**
 * 圆形图标按钮
 * 便捷的圆形变体
 */
export const CircularIconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "shape">
>((props, ref) => {
  return <IconButton {...props} ref={ref} shape="circular" />;
});

CircularIconButton.displayName = "CircularIconButton";

/**
 * 方形图标按钮
 * 便捷的方形变体（默认）
 */
export const SquareIconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<IconButtonProps, "shape">
>((props, ref) => {
  return <IconButton {...props} ref={ref} shape="square" />;
});

SquareIconButton.displayName = "SquareIconButton";

export { IconButton, iconButtonVariants };