
// 文件路径：src/components/ui/tooltip/Tooltip.tsx

/**
 * Tooltip 组件 - 基于 Radix UI 的品牌化工具提示
 *
 * 特性：
 * - 统一动效：使用 motionPresets 的 slide 变体，入场 200ms、离场 140ms
 * - 设计令牌：背景、文本、阴影、圆角均来源于 tokens，支持暗色/紧凑模式
 * - 完整 A11y：焦点环、隐藏文案、可控 open 状态
 * - 组合能力：提供 SimpleTooltip、InfoTooltip 与 useTooltip，覆盖常规与程序化场景
 */

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, type Variants } from "framer-motion";

import { cn, focusRing, fastTransition } from "../utils";
import { motionPresets } from "../motion";

type TooltipContentBaseProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
>;

interface TooltipContentProps extends TooltipContentBaseProps {
  /** 是否渲染箭头 */
  withArrow?: boolean;
}

type TooltipSide = NonNullable<TooltipContentProps["side"]>;

const slideVariantMap: Record<TooltipSide, Variants> = {
  top: motionPresets.variants.slide.fromBottom,
  bottom: motionPresets.variants.slide.fromTop,
  left: motionPresets.variants.slide.fromRight,
  right: motionPresets.variants.slide.fromLeft,
};

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn(
      "fill-[color:var(--bg-elevated)]",
      "drop-shadow-[0px_4px_10px_rgba(15,23,42,0.18)]",
      className
    )}
    {...props}
  />
));
TooltipArrow.displayName = "TooltipArrow";

/**
 * Tooltip Provider - 需要在应用根部使用
 */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip 根组件
 */
const Tooltip = TooltipPrimitive.Root;

/**
 * Tooltip 触发器
 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Tooltip 内容组件，集成品牌样式与统一动效
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    {
      className,
      side = "top",
      align = "center",
      sideOffset = 8,
      collisionPadding = 12,
      withArrow = true,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedSide: TooltipSide = side ?? "top";
    const variants = slideVariantMap[resolvedSide];

    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          asChild
          {...props}
        >
          <motion.div
            className={cn(
              "z-tooltip max-w-xs rounded-[var(--radius-sm)] border border-border-primary",
              "bg-background-elevated/95 px-3 py-2 text-xs font-medium leading-relaxed text-text-inverse",
              "shadow-[var(--shadow-lg)] backdrop-blur-[var(--backdrop-blur-sm,8px)]",
              fastTransition,
              className
            )}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
          >
            {children}
            {withArrow ? <TooltipArrow /> : null}
          </motion.div>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

/**
 * 简化的 Tooltip 组合组件
 *
 * @example
 * ```tsx
 * <SimpleTooltip content="这是一个提示">
 *   <Button>悬停我</Button>
 * </SimpleTooltip>
 * ```
 */
interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** 延迟时间（毫秒） */
  delayDuration?: number;
  /** 位置 */
  side?: TooltipSide;
  /** 对齐方式 */
  align?: NonNullable<TooltipContentProps["align"]>;
  /** 距离触发器的偏移量 */
  sideOffset?: number;
  /** 是否显示箭头 */
  withArrow?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 内容额外类名 */
  contentClassName?: string;
  /** 预留：兼容旧 trigger 配置 */
  trigger?: "hover" | "focus" | "click";
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  children,
  delayDuration = 150,
  side = "top",
  align = "center",
  sideOffset = 8,
  withArrow = true,
  disabled = false,
  contentClassName,
}) => {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={75}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          withArrow={withArrow}
          className={contentClassName}
        >
          {typeof content === "string" ? (
            <span className="whitespace-pre-line">{content}</span>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * 信息 Tooltip - 带有问号图标的信息提示
 */
interface InfoTooltipProps {
  content: React.ReactNode;
  /** 图标大小 */
  iconSize?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
  delayDuration?: number;
}

const iconSizeClassMap: Record<NonNullable<InfoTooltipProps["iconSize"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  iconSize = "md",
  className,
  ariaLabel = "更多信息",
  delayDuration,
}) => {
  return (
    <SimpleTooltip content={content} delayDuration={delayDuration}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-transparent",
          "text-text-secondary hover:text-text-primary",
          focusRing,
          fastTransition,
          iconSizeClassMap[iconSize],
          className
        )}
        aria-label={ariaLabel}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
    </SimpleTooltip>
  );
};

/**
 * Tooltip 组合 Hook - 用于程序化控制
 */
const useTooltip = () => {
  const [open, setOpen] = React.useState(false);

  return {
    open,
    setOpen,
    onOpenChange: setOpen,
  };
};

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
  SimpleTooltip,
  InfoTooltip,
  useTooltip,
};