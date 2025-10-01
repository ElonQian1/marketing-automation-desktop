// 文件路径：src/components/ui/TagPill.tsx

/**
 * 品牌化标签组件 - 药丸样式标签
 * 
 * 用于状态指示、分类标记、标签展示等场景
 * 
 * 特性：
 * - 现代化药丸设计
 * - 多种颜色和尺寸
 * - 可选的图标和关闭按钮
 * - 完整的可访问性支持
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// 标签变体配置
const tagPillVariants = cva(
  // 基础样式
  [
    'inline-flex items-center gap-1.5',
    'rounded-full font-medium',
    'transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]',
    'border',
  ],
  {
    variants: {
      variant: {
        // 默认标签
        default: [
          'bg-background-secondary text-text-primary',
          'border-border-primary',
          'hover:bg-background-tertiary',
        ],
        
        // 品牌标签
        primary: [
          'bg-brand/10 text-brand',
          'border-brand/20',
          'hover:bg-brand/20 hover:border-brand/30',
        ],
        
        // 成功标签
        success: [
          'bg-success/10 text-success',
          'border-success/20',
          'hover:bg-success/20 hover:border-success/30',
        ],
        
        // 警告标签
        warning: [
          'bg-warning/10 text-warning',
          'border-warning/20',
          'hover:bg-warning/20 hover:border-warning/30',
        ],
        
        // 错误标签
        error: [
          'bg-error/10 text-error',
          'border-error/20',
          'hover:bg-error/20 hover:border-error/30',
        ],
        
        // 信息标签
        info: [
          'bg-info/10 text-info',
          'border-info/20',
          'hover:bg-info/20 hover:border-info/30',
        ],
        
        // 实体标签
        solid: [
          'bg-brand text-white border-brand',
          'hover:bg-brand-600 hover:border-brand-600',
          'shadow-sm',
        ],
        
        // 轮廓标签
        outline: [
          'bg-transparent text-text-primary',
          'border-border-primary',
          'hover:bg-background-elevated hover:border-brand/40',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TagPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagPillVariants> {
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

const TagPill = React.forwardRef<HTMLSpanElement, TagPillProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      closable = false,
      onClose,
      disabled = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    };
    
    const isInteractive = onClick || closable;
    
    return (
      <span
        ref={ref}
        className={cn(
          tagPillVariants({ variant, size }),
          isInteractive && 'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        onClick={disabled ? undefined : onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        onKeyDown={
          isInteractive && !disabled
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as any);
                }
              }
            : undefined
        }
        {...props}
      >
        {/* 左侧图标 */}
        {icon && (
          <span className="inline-flex shrink-0 items-center">
            {icon}
          </span>
        )}
        
        {/* 标签内容 */}
        <span className="truncate">{children}</span>
        
        {/* 关闭按钮 */}
        {closable && !disabled && (
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center justify-center',
              'w-4 h-4 rounded-full',
              'hover:bg-current/20',
              'transition-colors duration-[var(--duration-fast)]',
              'focus:outline-none focus:ring-1 focus:ring-current/50'
            )}
            onClick={handleClose}
            aria-label="删除标签"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  }
);

TagPill.displayName = 'TagPill';

/**
 * 关闭图标组件
 */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export { TagPill, tagPillVariants };