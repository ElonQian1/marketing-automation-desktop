// 文件路径：src/components/ui/CardShell.tsx

/**
 * 品牌化卡片容器 - 现代化商业设计
 * 
 * 这是项目核心的容器组件，提供统一的卡片样式
 * 
 * 特性：
 * - 基于 Design Tokens 的一致样式
 * - 支持多种尺寸和状态
 * - 可选的悬停效果和阴影
 * - 完整的可访问性支持
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// 卡片变体配置
const cardVariants = cva(
  // 基础样式 - 使用 tokens
  [
    'rounded-[var(--radius)] border border-border-primary',
    'bg-background-elevated text-text-primary',
    'shadow-[var(--shadow-sm)]',
    'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
  ],
  {
    variants: {
      variant: {
        // 默认卡片
        default: [
          'hover:shadow-[var(--shadow)]',
          'hover:border-brand/20',
        ],
        
        // 突出卡片
        elevated: [
          'shadow-[var(--shadow)]',
          'hover:shadow-[var(--shadow-lg)]',
          'hover:translate-y-[-2px]',
        ],
        
        // 平面卡片
        flat: [
          'shadow-none border-0',
          'bg-background-secondary',
        ],
        
        // 交互卡片
        interactive: [
          'cursor-pointer select-none',
          'hover:shadow-[var(--shadow)]',
          'hover:border-brand/40',
          'hover:bg-background-base',
          'active:scale-[0.99]',
        ],
        
        // 幽灵卡片
        ghost: [
          'border-transparent bg-transparent shadow-none',
          'hover:bg-background-elevated',
          'hover:border-border-primary',
        ],
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CardShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** 是否作为子元素渲染 */
  asChild?: boolean;
}

const CardShell = React.forwardRef<HTMLDivElement, CardShellProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div';
    
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

CardShell.displayName = 'CardShell';

/**
 * 卡片头部组件
 */
interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 标题 */
  title?: React.ReactNode;
  /** 描述 */
  description?: React.ReactNode;
  /** 额外内容 */
  extra?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, extra, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 pb-4',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            {title && (
              <h3 className="font-semibold text-text-primary leading-none tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {extra && (
            <div className="flex items-center space-x-2">
              {extra}
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * 卡片内容组件
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-text-primary', className)} {...props} />
));

CardContent.displayName = 'CardContent';

/**
 * 卡片底部组件
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center pt-4 border-t border-border-primary',
      className
    )}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { CardShell, CardHeader, CardContent, CardFooter, cardVariants };