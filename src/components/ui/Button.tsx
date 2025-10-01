// 文件路径：src/components/ui/Button.tsx

/**
 * 品牌化按钮组件 - 基于 Radix UI + Design Tokens
 * 
 * 这是项目的核心轻组件，提供一致的品牌化按钮样式
 * 
 * 特性：
 * - 基于 Radix UI Slot，支持多态性
 * - 使用 Design Tokens 确保品牌一致性
 * - 支持多种尺寸、颜色和状态
 * - 完整的 A11y 支持和键盘导航
 * - 统一的 Motion 动效
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// 按钮变体配置 - 基于 tokens
const buttonVariants = cva(
  // 基础样式 - 使用 tokens
  [
    // 布局与交互
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-[var(--radius)] text-sm font-medium',
    'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
    
    // 焦点与可访问性
    'ring-offset-[var(--bg-base)] focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
    
    // 禁用状态
    'disabled:pointer-events-none disabled:opacity-50',
    
    // 悬停效果
    'hover:shadow-[var(--shadow-sm)]',
    
    // 活动状态
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        // 主要按钮 - 品牌色
        primary: [
          'bg-brand text-white',
          'hover:bg-brand-600 hover:shadow-lg',
          'active:bg-brand-700',
        ],
        
        // 次要按钮 - 透明背景
        secondary: [
          'border border-border-primary bg-transparent',
          'text-text-primary hover:bg-background-elevated',
          'hover:text-brand hover:border-brand',
        ],
        
        // 幽灵按钮 - 完全透明
        ghost: [
          'text-text-primary hover:bg-background-elevated',
          'hover:text-brand',
        ],
        
        // 链接按钮
        link: [
          'text-brand underline-offset-4',
          'hover:underline hover:text-brand-600',
        ],
        
        // 危险按钮
        destructive: [
          'bg-error text-white',
          'hover:bg-red-600 hover:shadow-lg',
          'active:bg-red-700',
        ],
        
        // 成功按钮
        success: [
          'bg-success text-white',
          'hover:bg-green-600 hover:shadow-lg',
          'active:bg-green-700',
        ],
      },
      size: {
        sm: 'h-[var(--control-h-sm)] px-3 text-xs',
        default: 'h-[var(--control-h)] px-4 py-2',
        lg: 'h-[var(--control-h-lg)] px-8',
        icon: 'h-[var(--control-h)] w-[var(--control-h)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 是否作为子元素渲染（多态性） */
  asChild?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 加载文本 */
  loadingText?: string;
  /** 图标（左侧） */
  leftIcon?: React.ReactNode;
  /** 图标（右侧） */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
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
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // 处理加载状态
    const isDisabled = disabled || loading;
    const content = loading && loadingText ? loadingText : children;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* 左侧图标 */}
        {leftIcon && !loading && (
          <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        
        {/* 加载指示器 */}
        {loading && (
          <span className="inline-flex shrink-0">
            <LoadingSpinner size={size === 'sm' ? 'sm' : 'default'} />
          </span>
        )}
        
        {/* 按钮内容 */}
        {content && <span>{content}</span>}
        
        {/* 右侧图标 */}
        {rightIcon && !loading && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

/**
 * 加载指示器组件
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'default' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <svg
      className={cn(
        'animate-spin text-current',
        sizeClasses[size]
      )}
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
};

export { Button, buttonVariants };