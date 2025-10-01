/**
 * 增强的输入框组件 - 基于 design tokens 的品牌化输入组件
 * 
 * 特性：
 * - 统一令牌：完全基于 design tokens，支持主题切换
 * - 现代动效：集成 fastTransition 与 focusRing
 * - 尺寸一致：与其他组件保持尺寸变体一致性
 * - 完整 A11y：焦点环、禁用状态等无障碍支持
 */

import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, focusRing, fastTransition } from '../utils';

const inputVariants = cva(
  // 基础样式 - 使用 design tokens
  [
    "flex w-full rounded-[var(--radius)] border bg-transparent px-3 py-2",
    "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
    "shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-hover)]",
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-50",
    // 边框与背景状态
    "border-[var(--border-primary)] hover:border-[var(--border-hover)]",
    "focus-within:border-[var(--brand)] focus-within:shadow-[var(--shadow-brand-glow)]"
  ],
  {
    variants: {
      size: {
        sm: "h-[var(--control-h-sm)] px-2 text-xs",
        md: "h-[var(--control-h)] px-3 text-sm", 
        lg: "h-[var(--control-h-lg)] px-4 text-base",
      },
      inputVariant: {
        default: "",
        filled: "bg-[var(--bg-secondary)]",
        borderless: "border-transparent shadow-none",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto"
      }
    },
    defaultVariants: {
      size: "md",
      inputVariant: "default",
      fullWidth: true
    },
  }
);

export interface InputProps 
  extends Omit<AntInputProps, 'size' | 'variant'>, 
          VariantProps<typeof inputVariants> {
  /** 输入框变体 */
  inputVariant?: 'default' | 'filled' | 'borderless';
  /** 自定义类名 */
  className?: string;
}

/**
 * 增强的输入框组件
 * 提供统一的输入框样式和行为
 */
export const Input: React.FC<InputProps> = ({
  size = 'md',
  inputVariant = 'default',
  fullWidth = true,
  className,
  ...props
}) => {
  // 尺寸映射到Ant Design
  const sizeMap = {
    sm: 'small' as const,
    md: 'middle' as const,
    lg: 'large' as const,
  };

  // 变体映射到Ant Design
  const variantMap = {
    default: undefined,
    filled: 'filled',
    borderless: 'borderless',
  };

  // 使用CVA生成样式类
  const inputClasses = cn(
    inputVariants({ 
      size: size as 'sm' | 'md' | 'lg', 
      inputVariant: inputVariant as 'default' | 'filled' | 'borderless', 
      fullWidth 
    }),
    className
  );

  return (
    <AntInput
      size={sizeMap[size!]}
      variant={variantMap[inputVariant!] as any}
      className={inputClasses}
      {...props}
      style={{
        width: fullWidth ? '100%' : undefined,
        ...props.style,
      }}
    />
  );
};

// 密码输入框
export const PasswordInput: React.FC<InputProps> = (props) => {
  return <Input {...props} type="password" />;
};

// 文本域变体样式
const textAreaVariants = cva(
  // 复用输入框基础样式，但调整高度
  [
    "flex w-full rounded-[var(--radius)] border bg-transparent px-3 py-2",
    "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
    "shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-hover)]",
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-50",
    "border-[var(--border-primary)] hover:border-[var(--border-hover)]",
    "focus-within:border-[var(--brand)] focus-within:shadow-[var(--shadow-brand-glow)]",
    "min-h-[80px] resize-y"  // TextArea特有样式
  ],
  {
    variants: {
      size: {
        sm: "px-2 py-1.5 text-xs",
        md: "px-3 py-2 text-sm", 
        lg: "px-4 py-3 text-base",
      },
      inputVariant: {
        default: "",
        filled: "bg-[var(--bg-secondary)]",
        borderless: "border-transparent shadow-none",
      }
    },
    defaultVariants: {
      size: "md",
      inputVariant: "default"
    },
  }
);

interface TextAreaProps {
  rows?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  size?: 'sm' | 'md' | 'lg';
  inputVariant?: 'default' | 'filled' | 'borderless';
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  rows = 4,
  autoSize = false,
  size = 'md',
  inputVariant = 'default',
  className,
  ...props
}) => {
  // 尺寸映射到Ant Design
  const sizeMap = {
    sm: 'small' as const,
    md: 'middle' as const,
    lg: 'large' as const,
  };

  // 使用CVA生成样式类
  const textAreaClasses = cn(
    textAreaVariants({ 
      size: size as 'sm' | 'md' | 'lg', 
      inputVariant: inputVariant as 'default' | 'filled' | 'borderless'
    }),
    className
  );

  return (
    <AntInput.TextArea
      rows={rows}
      autoSize={autoSize}
      size={sizeMap[size]}
      className={textAreaClasses}
      {...props}
    />
  );
};

export default Input;