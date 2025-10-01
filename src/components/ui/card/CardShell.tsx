// 文件路径：src/components/ui/card/CardShell.tsx

/**
 * CardShell 组件 - 统一的语义化卡片容器
 *
 * - 使用设计令牌驱动颜色、圆角、阴影
 * - 支持语义 tone、渐变、软态等视觉变体
 * - interactive 模式接入 motionPresets，覆写 hover/tap 动效
 * - 提供 Header/Title/Description/Content/Footer/Badges 等结构化子组件
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps, Variants } from "framer-motion";

import { cn, focusRing, modernTransition } from "../utils";
import { motionPresets } from "../motion";

const MotionSlot = motion(Slot);

type CardShellTone = "neutral" | "success" | "warning" | "danger" | "info";

interface CardShellContextValue {
  tone: CardShellTone;
  interactive: boolean;
}

const CardShellContext = React.createContext<CardShellContextValue | null>(null);

const toneAccentClassMap: Record<CardShellTone, string> = {
  neutral: "text-text-primary",
  success: "text-[color:var(--success)]",
  warning: "text-[color:var(--warning)]",
  danger: "text-[color:var(--error)]",
  info: "text-[color:var(--info)]",
};

const cardShellInteractiveVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: "var(--shadow-sm)",
    transition: motionPresets.transitions.hover,
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: "var(--shadow)",
    transition: motionPresets.transitions.hover,
  },
  tap: {
    y: -2,
    scale: 0.995,
    transition: motionPresets.transitions.press,
  },
};

const cardShellVariants = cva(
  [
    "relative flex flex-col",
    "rounded-[var(--radius-lg)] border border-border-primary",
    "bg-background-elevated text-text-primary",
    "shadow-sm",
    "transition-[transform,box-shadow]",
    modernTransition,
  ],
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-[var(--shadow)]",
        flat: "shadow-none border-border-secondary bg-background-base",
        ghost: "border-transparent bg-transparent shadow-none",
        soft: "bg-background-secondary border-transparent",
        gradient:
          "border-transparent text-white shadow-[var(--shadow-lg)] bg-[radial-gradient(circle_at_top,var(--brand)_0%,var(--brand-700)_100%)]",
      },
      size: {
        none: "p-0 gap-0",
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
      tone: {
        neutral: "",
        success:
          "border-[color:var(--success)] bg-[color:var(--success-bg)]",
        warning:
          "border-[color:var(--warning)] bg-[color:var(--warning-bg)]",
        danger: "border-[color:var(--error)] bg-[color:var(--error-bg)]",
        info: "border-[color:var(--info)] bg-[color:var(--info-bg)]",
      },
      bleed: {
        none: "",
        x: "px-0",
        y: "py-0",
        all: "p-0 gap-0",
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
      tone: "neutral",
      bleed: "none",
    },
  }
);

export interface CardShellProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof cardShellVariants> {
  /** 将容器渲染为子元素（例如链接） */
  asChild?: boolean;
  /** 语义色彩 tone，用于状态反馈 */
  tone?: CardShellTone;
  /** 内边距裁切控制（覆盖 size 提供的默认 padding） */
  bleed?: "none" | "x" | "y" | "all";
}

export const CardShell = React.forwardRef<HTMLDivElement, CardShellProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      bordered,
      tone,
      bleed,
      asChild = false,
      children,
      onClick,
      onKeyDown,
      role: roleProp,
      tabIndex: tabIndexProp,
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const isInteractive = interactive ?? false;
    const resolvedTone = tone ?? "neutral";

    const containerClassName = cn(
      cardShellVariants({
        variant,
        size,
        interactive: isInteractive,
        bordered,
        tone: resolvedTone,
        bleed,
      }),
      className
    );

    const handleInteractiveKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !isInteractive || !onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(
            event as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>
          );
        }
      },
      [isInteractive, onClick, onKeyDown]
    );

    const resolvedOnKeyDown = isInteractive
      ? handleInteractiveKeyDown
      : onKeyDown;

    const resolvedRole = roleProp ?? (isInteractive && onClick ? "button" : undefined);
    const resolvedTabIndex =
      tabIndexProp ?? (isInteractive ? 0 : undefined);

    const shouldAnimate = isInteractive && !prefersReducedMotion;
  const MotionComponent = asChild ? MotionSlot : motion.div;
  const StaticComponent = asChild ? Slot : "div";

  const motionProps = rest as unknown as HTMLMotionProps<"div">;

    const element = shouldAnimate ? (
      <MotionComponent
        ref={ref}
        data-tone={resolvedTone}
        className={containerClassName}
        role={resolvedRole}
        tabIndex={resolvedTabIndex}
        variants={cardShellInteractiveVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        transition={motionPresets.transitions.hover}
        onClick={onClick}
        onKeyDown={resolvedOnKeyDown}
        {...motionProps}
      >
        {children}
      </MotionComponent>
    ) : (
      <StaticComponent
        ref={ref as React.Ref<any>}
        data-tone={resolvedTone}
        className={containerClassName}
        role={resolvedRole}
        tabIndex={resolvedTabIndex}
        onClick={onClick}
        onKeyDown={resolvedOnKeyDown}
        {...rest}
      >
        {children}
      </StaticComponent>
    );

    return (
      <CardShellContext.Provider
        value={{ tone: resolvedTone, interactive: isInteractive }}
      >
        {element}
      </CardShellContext.Provider>
    );
  }
);

CardShell.displayName = "CardShell";

type CardShellSectionProps = React.HTMLAttributes<HTMLDivElement>;

const CardShellHeader = React.forwardRef<HTMLDivElement, CardShellSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="cardshell-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
);
CardShellHeader.displayName = "CardShellHeader";

const CardShellContent = React.forwardRef<
  HTMLDivElement,
  CardShellSectionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="cardshell-content"
    className={cn("flex flex-col gap-3 text-sm leading-relaxed", className)}
    {...props}
  />
));
CardShellContent.displayName = "CardShellContent";

const CardShellFooter = React.forwardRef<HTMLDivElement, CardShellSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="cardshell-footer"
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
);
CardShellFooter.displayName = "CardShellFooter";

type CardShellTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const CardShellTitle = React.forwardRef<HTMLHeadingElement, CardShellTitleProps>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(CardShellContext);
    const tone = context?.tone ?? "neutral";

    return (
      <h3
        ref={ref}
        data-slot="cardshell-title"
        className={cn(
          "text-lg font-semibold leading-tight tracking-tight",
          toneAccentClassMap[tone],
          className
        )}
        {...props}
      />
    );
  }
);
CardShellTitle.displayName = "CardShellTitle";

type CardShellDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const CardShellDescription = React.forwardRef<
  HTMLParagraphElement,
  CardShellDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="cardshell-description"
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
CardShellDescription.displayName = "CardShellDescription";

type CardShellBadgesProps = React.HTMLAttributes<HTMLDivElement>;

const CardShellBadges = React.forwardRef<HTMLDivElement, CardShellBadgesProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="cardshell-badges"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
);
CardShellBadges.displayName = "CardShellBadges";

export {
  cardShellVariants,
  CardShellHeader,
  CardShellContent,
  CardShellFooter,
  CardShellTitle,
  CardShellDescription,
  CardShellBadges,
};

export type { CardShellTone };
