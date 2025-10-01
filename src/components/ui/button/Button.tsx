
/**
 * Button 组件 - 基于 Radix UI Slot 的现代化按钮
 * 
 * 特性：
 * - 基于设计令牌的品牌化样式
 * - 支持多种变体：primary, secondary, ghost, outline
 * - 支持多种尺寸：sm, md, lg
 * - 完整的 A11y 支持和键盘导航
 * - 统一的动效和悬停效果
 * - 支持 asChild 模式用于链接等场景
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn, focusRing, modernTransition } from "../utils";
import { motionPresets } from "../motion";

/**
 * 按钮样式变体配置
 */
const buttonVariants = cva(
  // 基础样式 - 所有按钮共享
  [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap",
  "rounded-[var(--radius-sm)] text-sm font-medium",
  "ring-offset-[var(--bg-base)] transition-colors",
    focusRing,
    modernTransition,
    "disabled:pointer-events-none disabled:opacity-50",
    // 确保按钮有合适的最小尺寸用于触摸
    "min-h-[2.5rem]"
  ],
  {
    variants: {
      variant: {
        // 主要按钮 - 品牌渐变 + 商业化发光
        default: [
          "bg-gradient-to-br from-brand-500 to-brand-600 text-white",
          "shadow-[var(--shadow-brand)]",
          "hover:shadow-[var(--shadow-brand-glow)] hover:from-brand-400 hover:to-brand-500",
          "active:bg-brand-700 active:shadow-[var(--shadow-brand)]",
        ],
        
        // 危险操作按钮
        destructive: [
          "bg-error text-white shadow-sm",
          "hover:opacity-90 active:opacity-80",
        ],
        
        // 轮廓按钮 - 适用于次要操作
        outline: [
          "border border-border-primary bg-transparent text-text-primary shadow-sm",
          "hover:bg-background-secondary hover:text-text-primary",
        ],
        
        // 次级按钮 - 较低的视觉重量
        secondary: [
          "bg-background-secondary text-text-primary shadow-sm",
          "hover:bg-background-tertiary",
        ],
        
        // 幽灵按钮 - 最低的视觉重量
        ghost: [
          "text-text-secondary",
          "hover:bg-background-secondary hover:text-text-primary",
        ],
        
        // 链接样式按钮
        link: [
          "text-brand underline-offset-4",
          "hover:underline",
        ],
      },
      
      size: {
        // 小尺寸 - 用于密集界面
        sm: "h-control-sm px-3 text-xs",
        
        // 默认尺寸 - 最常用
        default: "h-control px-4 py-2",
        
        // 大尺寸 - 用于重要操作
        lg: "h-control-lg px-8 text-base",
        
        // 图标按钮 - 正方形
        icon: "h-control w-control p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
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
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    type: buttonType = "button",
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    // 如果是 asChild，使用 Slot，否则使用 motion.button
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          data-disabled={isDisabled || undefined}
          aria-disabled={isDisabled || undefined}
          aria-busy={loading || undefined}
          {...props}
        >
          <motion.span
            variants={motionPresets.variants.hover}
            initial="rest"
            whileHover={isDisabled ? "rest" : "hover"}
            whileTap={isDisabled ? "rest" : "tap"}
            transition={motionPresets.transitions.hover}
          >
            {loading && <LoadingSpinner className="h-4 w-4" />}
            {!loading && leftIcon && leftIcon}
            {loading && loadingText ? loadingText : children}
            {!loading && rightIcon && rightIcon}
          </motion.span>
        </Slot>
      );
    }
    
    const motionProps = props as unknown as HTMLMotionProps<"button">;

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading || undefined}
        variants={motionPresets.variants.hover}
        initial="rest"
        whileHover={isDisabled ? "rest" : "hover"}
        whileTap={isDisabled ? "rest" : "tap"}
        transition={motionPresets.transitions.hover}
        type={buttonType}
        {...motionProps}
      >
        {loading && (
          <LoadingSpinner className="h-4 w-4" />
        )}
        {!loading && leftIcon && leftIcon}
        {loading && loadingText ? loadingText : children}
        {!loading && rightIcon && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

/**
 * 加载动画组件 - 简单的旋转动画
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