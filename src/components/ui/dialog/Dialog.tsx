
/**
 * Dialog 组件 - 基于 Radix UI 的现代化对话框
 * 
 * 特性：
 * - 完整的 A11y 支持（焦点管理、键盘导航、屏幕阅读器）
 * - 基于设计令牌的统一样式
 * - 支持模态和非模态模式
 * - 可定制的动画和尺寸
 * - 自动焦点管理和ESC键关闭
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, focusRing, modernTransition } from "../utils";
import { X } from "lucide-react";

/**
 * Dialog 组件 - 根组件
 */
const Dialog = DialogPrimitive.Root;

/**
 * Dialog 触发器
 */
const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Dialog Portal - 用于在 body 中渲染
 */
const DialogPortal = DialogPrimitive.Portal;

/**
 * Dialog 关闭组件
 */
const DialogClose = DialogPrimitive.Close;

/**
 * 遮罩层样式变体
 */
const overlayVariants = cva([
  "fixed inset-0 z-modal-backdrop bg-black/60 backdrop-blur-sm",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
]);

/**
 * Dialog 遮罩层
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(overlayVariants(), className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog 内容样式变体
 */
const contentVariants = cva(
  [
    "fixed left-[50%] top-[50%] z-modal translate-x-[-50%] translate-y-[-50%]",
    "grid w-full gap-4 border border-border-primary bg-background-elevated p-6 shadow-xl",
    "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
    "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
    "rounded-lg",
  ],
  {
    variants: {
      size: {
        sm: "max-w-md",
        default: "max-w-lg", 
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]",
      }
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof contentVariants> {
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
}

/**
 * Dialog 内容组件
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(contentVariants({ size }), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close 
          className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
            "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
            "disabled:pointer-events-none data-[state=open]:bg-background-secondary data-[state=open]:text-text-muted",
            "p-1"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Dialog 头部样式
 */
const DialogHeader = ({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * Dialog 底部样式
 */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/**
 * Dialog 标题组件
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Dialog 描述组件
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};