// 文件路径：src/components/ui/SmartDialog.tsx

/**
 * 智能对话框组件 - 基于 Radix UI Dialog
 * 
 * 提供现代化的对话框体验，支持多种尺寸和样式
 * 
 * 特性：
 * - 基于 Radix UI 的完整 A11y 支持
 * - 品牌化设计和动效
 * - 响应式布局
 * - 键盘导航和焦点管理
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// 对话框内容变体
const dialogContentVariants = cva(
  [
    // 基础样式
    'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
    'w-full max-w-lg max-h-[85vh] overflow-auto',
    
    // 视觉样式
    'bg-background-elevated border border-border-primary',
    'rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)]',
    
    // 动效
    'duration-[var(--duration-normal)] ease-[var(--ease-out)]',
    
    // 焦点
    'focus:outline-none',
    
    // 层级
    'z-[var(--z-modal)]',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-md',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw] max-h-[90vh]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// 遮罩层变体
const dialogOverlayVariants = cva([
  'fixed inset-0',
  'bg-black/50 backdrop-blur-sm',
  'z-[var(--z-modal-backdrop)]',
  'data-[state=open]:animate-in data-[state=open]:fade-in-0',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
]);

export interface SmartDialogProps extends VariantProps<typeof dialogContentVariants> {
  /** 是否打开 */
  open?: boolean;
  /** 打开状态变更回调 */
  onOpenChange?: (open: boolean) => void;
  /** 对话框标题 */
  title?: React.ReactNode;
  /** 对话框描述 */
  description?: React.ReactNode;
  /** 对话框内容 */
  children: React.ReactNode;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnOverlayClick?: boolean;
  /** ESC 键是否关闭 */
  closeOnEscape?: boolean;
  /** 内容区域自定义类名 */
  contentClassName?: string;
}

const SmartDialog: React.FC<SmartDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  contentClassName,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* 遮罩层 */}
        <Dialog.Overlay
          className={dialogOverlayVariants()}
          onClick={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        />
        
        {/* 对话框内容 */}
        <Dialog.Content
          className={cn(
            dialogContentVariants({ size }),
            contentClassName
          )}
          onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={
            closeOnOverlayClick ? undefined : (e) => e.preventDefault()
          }
        >
          <div className="p-6">
            {/* 头部 */}
            {(title || description || showCloseButton) && (
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold text-text-primary">
                      {title}
                    </Dialog.Title>
                  )}
                  {description && (
                    <Dialog.Description className="mt-2 text-sm text-text-secondary">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
                
                {/* 关闭按钮 */}
                {showCloseButton && (
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center justify-center',
                        'w-8 h-8 rounded-[var(--radius-sm)]',
                        'text-text-tertiary hover:text-text-primary',
                        'hover:bg-background-secondary',
                        'transition-colors duration-[var(--duration-fast)]',
                        'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
                        'ml-4 shrink-0'
                      )}
                      aria-label="关闭对话框"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                )}
              </div>
            )}
            
            {/* 内容区域 */}
            <div className="text-text-primary">
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/**
 * 对话框触发器组件
 */
interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild = false }) => (
  <Dialog.Trigger asChild={asChild}>
    {children}
  </Dialog.Trigger>
);

/**
 * 对话框关闭按钮组件
 */
interface DialogCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogClose: React.FC<DialogCloseProps> = ({ children, asChild = false }) => (
  <Dialog.Close asChild={asChild}>
    {children}
  </Dialog.Close>
);

/**
 * 对话框操作栏组件
 */
interface DialogActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
}

const DialogActions = React.forwardRef<HTMLDivElement, DialogActionsProps>(
  ({ className, align = 'right', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex gap-3 pt-4 mt-6 border-t border-border-primary',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className
      )}
      {...props}
    />
  )
);

DialogActions.displayName = 'DialogActions';

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

export { 
  SmartDialog, 
  DialogTrigger, 
  DialogClose, 
  DialogActions,
  dialogContentVariants,
  dialogOverlayVariants 
};