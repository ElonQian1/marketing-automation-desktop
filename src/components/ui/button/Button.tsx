
/**
 * Button 组件 - 基于设计令牌与 motionPresets 的品牌化按钮
 *
 * 特性：
 * - 颜色、阴影、圆角均来源于 tokens，支持主题/密度切换
 * - 提供 solid/soft/outline/ghost/link 样式与 tone 语义扩展
 * - 支持 icon-only、加载态、asChild、prefers-reduced-motion 适配
 * - 统一 hover/tap 动效，保持可访问性
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

import { cn, focusRing, modernTransition } from "../utils";
import { motionPresets } from "../motion";

const MotionSlot = motion(Slot);

type ButtonTone = "brand" | "neutral" | "success" | "warning" | "danger" | "info";
type ButtonStyleVariant = "solid" | "soft" | "outline" | "ghost" | "link";
type LegacyButtonVariant = "default" | "primary" | "secondary" | "destructive";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-sm)] font-medium",
    "transition-[background-color,color,border-color,box-shadow,transform]",
    "ring-offset-[color:var(--bg-base)]",
    focusRing,
    modernTransition,
    "disabled:pointer-events-none disabled:opacity-60",
    "min-h-[var(--control-h-sm)]",
  ],
  {
    variants: {
      variant: {
        solid: "border border-transparent shadow-[var(--shadow-sm)]",
        soft: "border border-transparent",
        outline: "border bg-transparent",
        ghost: "border border-transparent bg-transparent",
        link: "border border-transparent bg-transparent underline-offset-4 font-semibold",
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
        sm: "h-[var(--control-h-sm)] px-3 text-xs",
        md: "h-[var(--control-h)] px-4 text-sm",
        default: "h-[var(--control-h)] px-4 text-sm",
        lg: "h-[var(--control-h-lg)] px-6 text-base",
        icon: "h-[var(--control-h)] w-[var(--control-h)] p-0 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // Solid buttons
      {
        variant: "solid",
        tone: "brand",
        className: cn(
          "bg-[color:var(--brand)] text-[color:var(--text-1)]",
          "hover:bg-[color:var(--brand-600)]",
          "active:bg-[color:var(--brand-700)]",
          "shadow-[var(--shadow)]"
        ),
      },
      {
        variant: "solid",
        tone: "neutral",
        className: cn(
          "bg-[color:var(--bg-secondary)] text-[color:var(--text-1)]",
          "hover:bg-[color:var(--bg-tertiary)]",
          "active:bg-[color:var(--bg-muted)]"
        ),
      },
      {
        variant: "solid",
        tone: "success",
        className: cn(
          "bg-[color:var(--success)] text-[color:var(--bg-light-base)]",
          "hover:brightness-110",
          "active:brightness-95"
        ),
      },
      {
        variant: "solid",
        tone: "warning",
        className: cn(
          "bg-[color:var(--warning)] text-[color:var(--bg-light-base)]",
          "hover:brightness-110",
          "active:brightness-95"
        ),
      },
      {
        variant: "solid",
        tone: "danger",
        className: cn(
          "bg-[color:var(--error)] text-[color:var(--bg-light-base)]",
          "hover:brightness-110",
          "active:brightness-95"
        ),
      },
      {
        variant: "solid",
        tone: "info",
        className: cn(
          "bg-[color:var(--info)] text-[color:var(--bg-light-base)]",
          "hover:brightness-110",
          "active:brightness-95"
        ),
      },

      // Soft buttons
      {
        variant: "soft",
        tone: "brand",
        className: cn(
          "bg-[color:var(--brand-100)] text-[color:var(--brand-700)]",
          "hover:bg-[color:var(--brand-200)]"
        ),
      },
      {
        variant: "soft",
        tone: "neutral",
        className: cn(
          "bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)]",
          "hover:bg-[color:var(--bg-tertiary)]"
        ),
      },
      {
        variant: "soft",
        tone: "success",
        className: cn(
          "bg-[color:var(--success-bg)] text-[color:var(--success)]",
          "hover:bg-[color:var(--success-bg)] hover:brightness-110"
        ),
      },
      {
        variant: "soft",
        tone: "warning",
        className: cn(
          "bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
          "hover:bg-[color:var(--warning-bg)] hover:brightness-110"
        ),
      },
      {
        variant: "soft",
        tone: "danger",
        className: cn(
          "bg-[color:var(--error-bg)] text-[color:var(--error)]",
          "hover:bg-[color:var(--error-bg)] hover:brightness-110"
        ),
      },
      {
        variant: "soft",
        tone: "info",
        className: cn(
          "bg-[color:var(--info-bg)] text-[color:var(--info)]",
          "hover:bg-[color:var(--info-bg)] hover:brightness-110"
        ),
      },

      // Outline buttons
      {
        variant: "outline",
        tone: "brand",
        className: cn(
          "border-[color:var(--brand-400)] text-[color:var(--brand-600)]",
          "hover:bg-[color:var(--brand-50)]"
        ),
      },
      {
        variant: "outline",
        tone: "neutral",
        className: cn(
          "border-[color:var(--border-primary)] text-[color:var(--text-primary)]",
          "hover:bg-[color:var(--bg-secondary)]"
        ),
      },
      {
        variant: "outline",
        tone: "success",
        className: cn(
          "border-[color:var(--success)] text-[color:var(--success)]",
          "hover:bg-[color:var(--success-bg)]"
        ),
      },
      {
        variant: "outline",
        tone: "warning",
        className: cn(
          "border-[color:var(--warning)] text-[color:var(--warning)]",
          "hover:bg-[color:var(--warning-bg)]"
        ),
      },
      {
        variant: "outline",
        tone: "danger",
        className: cn(
          "border-[color:var(--error)] text-[color:var(--error)]",
          "hover:bg-[color:var(--error-bg)]"
        ),
      },
      {
        variant: "outline",
        tone: "info",
        className: cn(
          "border-[color:var(--info)] text-[color:var(--info)]",
          "hover:bg-[color:var(--info-bg)]"
        ),
      },

      // Ghost buttons
      {
        variant: "ghost",
        tone: "brand",
        className: cn(
          "text-[color:var(--brand-500)]",
          "hover:bg-[color:var(--brand-50)]"
        ),
      },
      {
        variant: "ghost",
        tone: "neutral",
        className: cn(
          "text-[color:var(--text-secondary)]",
          "hover:bg-[color:var(--bg-secondary)]"
        ),
      },
      {
        variant: "ghost",
        tone: "success",
        className: cn(
          "text-[color:var(--success)]",
          "hover:bg-[color:var(--success-bg)]"
        ),
      },
      {
        variant: "ghost",
        tone: "warning",
        className: cn(
          "text-[color:var(--warning)]",
          "hover:bg-[color:var(--warning-bg)]"
        ),
      },
      {
        variant: "ghost",
        tone: "danger",
        className: cn(
          "text-[color:var(--error)]",
          "hover:bg-[color:var(--error-bg)]"
        ),
      },
      {
        variant: "ghost",
        tone: "info",
        className: cn(
          "text-[color:var(--info)]",
          "hover:bg-[color:var(--info-bg)]"
        ),
      },

      // Link buttons
      {
        variant: "link",
        tone: "brand",
        className: "text-[color:var(--brand)] hover:text-[color:var(--brand-600)] hover:underline",
      },
      {
        variant: "link",
        tone: "neutral",
        className: "text-[color:var(--text-primary)] hover:text-[color:var(--text-secondary)] hover:underline",
      },
      {
        variant: "link",
        tone: "success",
        className: "text-[color:var(--success)] hover:underline",
      },
      {
        variant: "link",
        tone: "warning",
        className: "text-[color:var(--warning)] hover:underline",
      },
      {
        variant: "link",
        tone: "danger",
        className: "text-[color:var(--error)] hover:underline",
      },
      {
        variant: "link",
        tone: "info",
        className: "text-[color:var(--info)] hover:underline",
      },
    ],
    defaultVariants: {
      variant: "solid",
      tone: "brand",
      size: "md",
      fullWidth: false,
    },
  }
);

const legacyVariantMap: Record<LegacyButtonVariant, { variant: ButtonStyleVariant; tone: ButtonTone }> = {
  default: { variant: "solid", tone: "brand" },
  primary: { variant: "solid", tone: "brand" },
  secondary: { variant: "soft", tone: "neutral" },
  destructive: { variant: "solid", tone: "danger" },
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  /** 样式变体：支持新版 solid/soft/outline/ghost/link 及旧版 default/secondary/destructive */
  variant?: ButtonStyleVariant | LegacyButtonVariant;
  /** 是否作为子组件渲染（用于自定义元素如 Link） */
  asChild?: boolean;
  /** 按钮是否处于加载状态 */
  loading?: boolean;
  /** 加载状态下显示的文本 */
  loadingText?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant: incomingVariant,
      tone,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type: buttonType = "button",
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const isDisabled = disabled || loading;

    const resolvedMapping =
      (incomingVariant && legacyVariantMap[incomingVariant as LegacyButtonVariant]) ||
      null;

    const resolvedVariant: ButtonStyleVariant = resolvedMapping
      ? resolvedMapping.variant
      : ((incomingVariant as ButtonStyleVariant) ?? "solid");

    const resolvedTone: ButtonTone = tone || resolvedMapping?.tone || "brand";
    const resolvedSize = size ?? "md";
    const isIconOnly = resolvedSize === "icon";
    const resolvedFullWidth = fullWidth ?? false;

    const baseClassName = buttonVariants({
      variant: resolvedVariant,
      tone: resolvedTone,
      size: resolvedSize,
      fullWidth: resolvedFullWidth,
    });

    const composedClassName = cn(baseClassName, className);
    const shouldAnimate = !prefersReducedMotion && !isDisabled;

    const content = (
      <>
        {loading ? (
          <LoadingSpinner className="h-4 w-4" />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>
        ) : null}

        {!isIconOnly && (
          <span className="truncate">
            {loading && loadingText ? loadingText : children}
          </span>
        )}

        {!loading && rightIcon ? (
          <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>
        ) : null}
      </>
    );

    const commonProps = {
      className: composedClassName,
      "data-tone": resolvedTone,
      "data-variant": resolvedVariant,
      "data-size": resolvedSize,
      "data-disabled": isDisabled || undefined,
      "aria-disabled": isDisabled || undefined,
      "aria-busy": loading || undefined,
    } as const;

    if (asChild) {
      if (shouldAnimate) {
        return (
          <MotionSlot
            ref={ref as React.Ref<any>}
            {...commonProps}
            variants={motionPresets.variants.hover}
            initial="rest"
            whileHover={"hover"}
            whileTap={"tap"}
            transition={motionPresets.transitions.hover}
            {...(rest as any)}
          >
            {content}
          </MotionSlot>
        );
      }

      return (
        <Slot ref={ref} {...commonProps} {...rest}>
          {content}
        </Slot>
      );
    }

    if (shouldAnimate) {
      const motionProps = rest as unknown as HTMLMotionProps<"button">;

      return (
        <motion.button
          ref={ref}
          type={buttonType}
          disabled={isDisabled}
          {...commonProps}
          variants={motionPresets.variants.hover}
          initial="rest"
          whileHover={"hover"}
          whileTap={"tap"}
          transition={motionPresets.transitions.hover}
          {...motionProps}
        >
          {content}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        type={buttonType}
        disabled={isDisabled}
        {...commonProps}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * 加载动画组件 - 使用当前文本颜色
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export { Button, buttonVariants };
export type { ButtonTone };