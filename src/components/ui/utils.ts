
/**
 * 轻组件通用工具函数
 * 
 * 提供 class-variance-authority 和 clsx 的统一封装
 * 确保所有轻组件使用一致的样式合并逻辑
 */

import * as React from "react";
import { type ClassValue, clsx } from "clsx";

/**
 * 合并类名的工具函数
 * 
 * @param classes - 要合并的类名
 * @returns 合并后的类名字符串
 * 
 * @example
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-blue-500", className)
 * ```
 */
export function cn(...classes: ClassValue[]) {
  return clsx(classes);
}

/**
 * 焦点环样式 - 确保所有交互元素的 A11y
 */
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background-base";

/**
 * 现代化动画过渡 - 统一的动效类名
 */
export const modernTransition = "transition-brand";

/**
 * 快速动画过渡 - 用于悬停效果
 */
export const fastTransition = "transition-fast";

/**
 * 常用的 Tailwind 组合类
 */
export const commonStyles = {
  // 品牌色按钮基础样式
  brandButton: cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
    "bg-brand text-white hover:bg-brand-600 active:bg-brand-700",
    focusRing,
    modernTransition,
    "disabled:pointer-events-none disabled:opacity-50"
  ),
  
  // 次级按钮样式
  secondaryButton: cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
    "bg-background-secondary text-text-primary hover:bg-background-tertiary",
    "border border-border-primary",
    focusRing,
    modernTransition,
    "disabled:pointer-events-none disabled:opacity-50"
  ),
  
  // 幽灵按钮样式
  ghostButton: cn(
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
    "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
    focusRing,
    modernTransition,
    "disabled:pointer-events-none disabled:opacity-50"
  ),
  
  // 现代化卡片样式
  modernCard: cn(
    "rounded-lg bg-background-elevated border border-border-primary",
    "shadow-sm p-6",
    modernTransition,
    "hover:shadow-md"
  ),
  
  // 输入框基础样式
  inputBase: cn(
    "flex h-control w-full rounded-lg border border-border-primary bg-background-base px-3 py-2",
    "text-sm text-text-primary placeholder:text-text-muted",
    focusRing,
    modernTransition,
    "disabled:cursor-not-allowed disabled:opacity-50"
  ),
};

/**
 * 尺寸变体映射
 */
export const sizeVariants = {
  sm: "h-control-sm px-3 text-xs",
  md: "h-control px-4 text-sm", 
  lg: "h-control-lg px-6 text-base",
};

/**
 * 颜色变体映射
 */
export const colorVariants = {
  brand: "bg-brand text-white hover:bg-brand-600",
  secondary: "bg-background-secondary text-text-primary hover:bg-background-tertiary border border-border-primary",
  ghost: "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
  success: "bg-success text-white hover:opacity-90",
  warning: "bg-warning text-white hover:opacity-90",
  error: "bg-error text-white hover:opacity-90",
};

/**
 * 检查是否为有效的React元素
 */
export function isValidElement(element: any): element is React.ReactElement {
  return element && typeof element === 'object' && 'type' in element;
}

/**
 * 强制类型的forwardRef包装器 - 简化版本
 */
export const forwardRefWithAs = React.forwardRef;