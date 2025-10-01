// 文件路径：src/components/layout/PageShell.tsx

/**
 * 页面外壳组件 - 品牌化重构后的统一页面容器
 * 
 * 职责：仅负责编排与栅格，不写任何视觉代码
 * 
 * 特性：
 * - 统一的页面结构和动效
 * - 响应式栅格系统
 * - 可配置的头部和操作区
 * - 无障碍导航支持
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FadeIn, SlideIn } from '@/components/ui/motion/MotionSystem';
import { cn } from '@/utils/cn';

interface PageShellProps {
  /** 页面标题 */
  title?: React.ReactNode;
  /** 页面描述 */
  description?: React.ReactNode;
  /** 面包屑导航 */
  breadcrumb?: React.ReactNode;
  /** 页面操作区 */
  actions?: React.ReactNode;
  /** 页面内容 */
  children: React.ReactNode;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回回调 */
  onBack?: () => void;
  /** 页面类名 */
  className?: string;
  /** 内容区类名 */
  contentClassName?: string;
  /** 是否全宽模式 */
  fullWidth?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
}

const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  breadcrumb,
  actions,
  children,
  showBack = false,
  onBack,
  className,
  contentClassName,
  fullWidth = false,
  compact = false,
}) => {
  return (
    <div className={cn(
      'min-h-full flex flex-col',
      'bg-background-base',
      className
    )}>
      {/* 页面头部 */}
      {(title || description || breadcrumb || actions || showBack) && (
        <FadeIn>
          <header className={cn(
            'border-b border-border-primary bg-background-elevated',
            compact ? 'px-4 py-3' : 'px-6 py-4'
          )}>
            <div className={cn(
              'mx-auto',
              fullWidth ? 'w-full' : 'max-w-7xl'
            )}>
              {/* 面包屑导航 */}
              {breadcrumb && (
                <div className="mb-2">
                  {breadcrumb}
                </div>
              )}
              
              {/* 标题行 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {/* 返回按钮 */}
                    {showBack && (
                      <button
                        type="button"
                        onClick={onBack}
                        className={cn(
                          'inline-flex items-center justify-center',
                          'w-8 h-8 rounded-[var(--radius-sm)]',
                          'text-text-secondary hover:text-text-primary',
                          'hover:bg-background-secondary',
                          'transition-colors duration-[var(--duration-fast)]',
                          'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
                        )}
                        aria-label="返回上一页"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* 标题内容 */}
                    <div className="min-w-0 flex-1">
                      {title && (
                        <h1 className={cn(
                          'font-semibold text-text-primary truncate',
                          compact ? 'text-lg' : 'text-xl'
                        )}>
                          {title}
                        </h1>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-text-secondary">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 操作区域 */}
                {actions && (
                  <SlideIn direction="right" className="flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      {actions}
                    </div>
                  </SlideIn>
                )}
              </div>
            </div>
          </header>
        </FadeIn>
      )}
      
      {/* 页面内容 */}
      <main className="flex-1 min-h-0">
        <SlideIn direction="up">
          <div className={cn(
            'h-full',
            compact ? 'p-4' : 'p-6',
            !fullWidth && 'mx-auto max-w-7xl',
            contentClassName
          )}>
            {children}
          </div>
        </SlideIn>
      </main>
    </div>
  );
};

/**
 * 返回箭头图标
 */
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export { PageShell };
export type { PageShellProps };