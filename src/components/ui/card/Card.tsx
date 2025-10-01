
/**
 * Card 组件 - 现代化卡片容器
 *        // 高程卡片 - 现代大阴影
        elevated: "shadow-[var(--shadow-lg)]",
 * 特性：        // 渐变卡片 - 品牌色背景和阴影
        gradient: "shadow-[var(--shadow-brand-lg)] border-transparent gradient-brand text-white", * - 基于设计令牌的统一样式
 * - 支持多种变体和尺寸
 * - 可选的悬停效果和阴影
 * - 灵活的内容区域组合
 * - 完整的语义化 HTML 结构
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, modernTransition } from "../utils";

/**
 * 卡片容器样式变体
 */
const cardVariants = cva(
  [
    "rounded-lg bg-background-elevated text-text-primary",
    "border border-border-primary",
    modernTransition,
  ],
  {
    variants: {
      variant: {
        // 默认卡片 - 现代分层阴影
        default: "shadow-[var(--shadow)]",
        
        // 突出卡片 - 更强的阴影
        elevated: "shadow-[var(--shadow-lg)]",
        
        // 扁平卡片 - 仅边框无阴影
        flat: "shadow-none",
        
        // 幽灵卡片 - 无边框无阴影
        ghost: "border-transparent shadow-none",
        
        // 渐变卡片 - 品牌渐变背景
        gradient: "shadow-[var(--shadow-brand-lg)] border-transparent bg-gradient-to-br from-[var(--brand)] to-[var(--brand-700)] text-[var(--text-contrast)]",
        
        // 玻璃态卡片 - 现代玻璃效果
        glass: "border border-white/20 shadow-[var(--shadow-glass)] backdrop-blur-[var(--backdrop-blur)] bg-[var(--bg-glass-elevated)]",
      },
      
      size: {
        sm: "p-3",
        default: "p-4", 
        lg: "p-6",
        xl: "p-8",
      },
      
      hoverable: {
        true: "cursor-pointer hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 hover:scale-[var(--motion-scale-hover)] transition-all duration-[var(--duration-normal)] ease-[var(--motion-smooth)]",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hoverable: false,
    },
  }
);

/**
 * 卡片头部样式
 */
const cardHeaderVariants = cva([
  "flex flex-col space-y-1.5 pb-4",
]);

/**
 * 卡片标题样式
 */
const cardTitleVariants = cva([
  "text-lg font-semibold leading-none tracking-tight",
  "text-text-primary",
]);

/**
 * 卡片描述样式
 */
const cardDescriptionVariants = cva([
  "text-sm text-text-muted",
]);

/**
 * 卡片内容样式
 */
const cardContentVariants = cva([
  "text-text-secondary",
]);

/**
 * 卡片底部样式
 */
const cardFooterVariants = cva([
  "flex items-center pt-4",
]);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** 是否可交互（影响悬停效果） */
  interactive?: boolean;
}

/**
 * 主卡片组件
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hoverable, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ 
          variant, 
          size, 
          hoverable: interactive ? true : hoverable 
        }), 
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/**
 * 卡片头部组件
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardHeaderVariants(), className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * 卡片标题组件
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(cardTitleVariants(), className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

/**
 * 卡片描述组件
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(cardDescriptionVariants(), className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * 卡片内容组件
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(cardContentVariants(), className)} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

/**
 * 卡片底部组件
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardFooterVariants(), className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};