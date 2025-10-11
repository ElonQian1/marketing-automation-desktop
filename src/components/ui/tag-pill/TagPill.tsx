// src/components/ui/tag-pill/TagPill.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 文件路径：src/components/ui/tag-pill/TagPill.tsx

/**
 * TagPill 组件 - 药丸标签
 *
 * - 只读设计令牌，支持品牌、语义色变体
 * - 提供多种尺寸与可关闭选项
 * - interactive 模式支持键盘激活与 Motion 悬停
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn, focusRing, fastTransition } from "../utils";
import { motionPresets } from "../motion";

const tagPillVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full border border-border-primary",
    "bg-background-secondary text-text-primary",
    "font-medium",
    fastTransition,
  ],
  {
    variants: {
      variant: {
        neutral: "",
        brand: "bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)] text-[var(--brand)] border-[var(--brand)]/30 shadow-[var(--shadow-sm)]",
        success: "bg-gradient-to-r from-[var(--success-100)] to-[var(--success-50)] text-[var(--success)] border-[var(--success)]/30 shadow-[var(--shadow-success)]",
        warning: "bg-gradient-to-r from-[var(--warning-100)] to-[var(--warning-50)] text-[var(--warning)] border-[var(--warning)]/30 shadow-[var(--shadow-warning)]",
        error: "bg-gradient-to-r from-[var(--error-100)] to-[var(--error-50)] text-[var(--error)] border-[var(--error)]/30 shadow-[var(--shadow-error)]",
        info: "bg-gradient-to-r from-[var(--info-100)] to-[var(--info-50)] text-[var(--info)] border-[var(--info)]/30 shadow-[var(--shadow-sm)]",
        solid: "bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)] text-[var(--text-contrast)] border-[var(--brand)] shadow-[var(--shadow-brand-glow)]",
        outline: "bg-transparent text-text-primary border-border-primary hover:bg-gradient-to-r hover:from-brand-50/30 hover:to-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
      interactive: {
        true: cn(
          "cursor-pointer select-none",
          "ring-offset-[var(--bg-base)]",
          focusRing
        ),
        false: "",
      },
      selected: {
        true: "bg-[var(--brand)] text-[var(--text-contrast)] border-[var(--brand)] shadow-[var(--shadow-sm)]", // 与 solid 保持一致
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        selected: true,
        className: "bg-brand/10 text-brand border-brand/40",
      },
    ],
    defaultVariants: {
      variant: "neutral",
      size: "md",
      interactive: false,
      selected: false,
    },
  }
);

export interface TagPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagPillVariants> {
  /** 渲染为子元素（配合 Link 等使用） */
  asChild?: boolean;
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否禁用交互 */
  disabled?: boolean;
}

export const TagPill = React.forwardRef<HTMLSpanElement, TagPillProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      selected,
      icon,
      closable = false,
      onClose,
      disabled = false,
      asChild = false,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const isInteractive = (interactive ?? false) || !!onClick;
    const Component = asChild ? Slot : "span";

    if (isInteractive && !asChild) {
      const restMotionProps = props as unknown as HTMLMotionProps<"button">;
      const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLSpanElement>);
        if (event.defaultPrevented) {
          return;
        }
        if ((event.key === "Enter" || event.key === " ") && onClick) {
          event.preventDefault();
          onClick(
            event as unknown as React.MouseEvent<HTMLSpanElement, MouseEvent>
          );
        }
      };

      return (
        <motion.button
          ref={ref as unknown as React.Ref<HTMLButtonElement>}
          type="button"
          className={cn(
            tagPillVariants({
              variant,
              size,
              interactive: true,
              selected,
            }),
            disabled && "opacity-50 pointer-events-none",
            className
          )}
          disabled={disabled}
          aria-pressed={selected}
          aria-disabled={disabled || undefined}
          variants={motionPresets.variants.hover}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          transition={motionPresets.transitions.hover}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          {...restMotionProps}
        >
          {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
          <span className="truncate">{children}</span>
          {closable && !disabled ? (
            <button
              type="button"
              className={cn(
                "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                "bg-transparent text-current/80 hover:bg-current/15",
                focusRing
              )}
              aria-label="移除标签"
              onClick={(event) => {
                event.stopPropagation();
                onClose?.();
              }}
            >
              <span className="sr-only">移除</span>
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </motion.button>
      );
    }

    return (
      <Component
        ref={ref}
        className={cn(
          tagPillVariants({
            variant,
            size,
            interactive: isInteractive,
            selected,
          }),
          disabled && "opacity-60",
          className
        )}
        aria-disabled={disabled || undefined}
        {...props}
      >
        {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
        <span className="truncate">{children}</span>
        {closable && !disabled ? (
          <button
            type="button"
            className={cn(
              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
              "bg-transparent text-current/70 hover:bg-current/15",
              focusRing
            )}
            aria-label="移除标签"
            onClick={(event) => {
              event.stopPropagation();
              onClose?.();
            }}
          >
            <span className="sr-only">移除</span>
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </Component>
    );
  }
);

TagPill.displayName = "TagPill";

export { tagPillVariants };
