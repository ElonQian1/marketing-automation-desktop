
/**
 * Tooltip 组件 - 基于 Radix UI 的工具提示
 * 
 * 特性：
 * - 智能定位和碰撞检测
 * - 完整的 A11y 支持
 * - 可定制的延迟和动画
 * - 基于设计令牌的统一样式
 * - 支持富文本内容
 */

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../utils";

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
 * Tooltip 内容组件
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // 基础样式
      "z-tooltip overflow-hidden rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-white",
      // 动画效果
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      // 位置动画
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      // 阴影
      "shadow-lg",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

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
  /** 触发方式 */
  trigger?: "hover" | "focus" | "click";
  /** 位置 */
  side?: "top" | "right" | "bottom" | "left";
  /** 对齐方式 */
  align?: "start" | "center" | "end";
  /** 是否禁用 */
  disabled?: boolean;
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  children,
  delayDuration = 200,
  trigger = "hover",
  side = "top",
  align = "center",
  disabled = false,
}) => {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </Tooltip>
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
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  iconSize = "md",
  className,
}) => {
  const iconSizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5",
  }[iconSize];

  return (
    <SimpleTooltip content={content}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full text-text-muted",
          "hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
          "transition-colors",
          iconSizeClass,
          className
        )}
        aria-label="更多信息"
      >
        <svg
          className="h-full w-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
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
  SimpleTooltip,
  InfoTooltip,
  useTooltip,
};