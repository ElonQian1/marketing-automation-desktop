// 文件路径：src/components/ui/card/CardShell.tsx

/**
 * CardShell 组件 - 统一的卡片容器
 *
 * - 使用设计令牌驱动颜色、圆角、阴影
 * - 支持多种视觉变体与尺寸
 * - interactive 模式下接入 Motion 统一动效
 * - 默认提供焦点环，保障键盘可达
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn, focusRing, modernTransition } from "../utils";
import { motionPresets } from "../motion";

const cardShellVariants = cva(
  [
    "relative flex flex-col",
    "rounded-[var(--radius)] border border-border-primary",
    "bg-background-elevated text-text-primary",
    "shadow-sm",
    modernTransition,
  ],
  {
    variants: {
      variant: {
        default: "", // 保持默认阴影
        elevated: "shadow-[var(--shadow)]",
        flat: "shadow-none border-border-secondary bg-background-base",
        ghost: "border-transparent bg-transparent shadow-none",
        soft: "bg-background-secondary border-transparent",
        gradient: "border-transparent text-white bg-[radial-gradient(circle_at_top,var(--brand)_0%,var(--brand-700)_100%)]",
      },
      size: {
        none: "p-0",
        sm: "p-4 gap-3",
        md: "p-6 gap-4",
        lg: "p-8 gap-6",
      },
      interactive: {
        true: cn(
          "cursor-pointer select-none",
          "ring-offset-[var(--bg-base)]",
          focusRing
        ),
        false: "",
      },
      bordered: {
        true: "border-border-primary",
        false: "border-transparent",
      },
    },
    compoundVariants: [
      {
        variant: "ghost",
        bordered: false,
        className: "hover:border-border-primary/60",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
      bordered: true,
    },
  }
);

export interface CardShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardShellVariants> {
  /** 将容器渲染为子元素（例如链接） */
  asChild?: boolean;
}

export const CardShell = React.forwardRef<HTMLDivElement, CardShellProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      bordered,
      asChild = false,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : "div";
    const isInteractive = interactive ?? false;

    if (isInteractive && !asChild) {
  const restMotionProps = props as unknown as HTMLMotionProps<"div">;
      const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if ((event.key === "Enter" || event.key === " ") && onClick) {
          event.preventDefault();
          onClick(
            event as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>
          );
        }
      };

      return (
        <motion.div
          ref={ref}
          className={cn(
            cardShellVariants({ variant, size, interactive: true, bordered }),
            className
          )}
          role={onClick ? "button" : undefined}
          tabIndex={0}
          variants={motionPresets.variants.lift}
          initial="rest"
          whileHover="hover"
          transition={motionPresets.transitions.hover}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          {...restMotionProps}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <Component
        ref={ref}
        className={cn(
          cardShellVariants({ variant, size, interactive: isInteractive, bordered }),
          className
        )}
        onClick={onClick}
        onKeyDown={onKeyDown}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardShell.displayName = "CardShell";

export { cardShellVariants };
