/**
 * 增强的选择框组件 - 基于 design tokens 的品牌化选择器
 * 
 * 特性：
 * - 统一令牌：完全基于 design tokens，支持主题切换
 * - CVA 变体：规范化的尺寸和样式变体系统
 * - 现代动效：集成 focusRing 与统一过渡效果
 * - 完整 A11y：焦点环、错误状态等无障碍支持
 */

import React from 'react';
import { Select as AntSelect, type SelectProps as AntSelectProps } from 'antd';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, focusRing, fastTransition } from '../utils';

const selectVariants = cva(
  // 基础样式 - 使用 design tokens
  [
    "flex w-full rounded-[var(--radius)] border bg-transparent",
    "text-sm text-[var(--text-primary)]",
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
        sm: "h-[var(--control-h-sm)] text-xs",
        md: "h-[var(--control-h)] text-sm", 
        lg: "h-[var(--control-h-lg)] text-base",
      },
      selectVariant: {
        default: "",
        filled: "bg-[var(--bg-secondary)]",
        borderless: "border-transparent shadow-none",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto"
      },
      error: {
        true: "border-[var(--error)] focus-within:border-[var(--error)] focus-within:shadow-[var(--shadow-error-glow)]",
        false: ""
      }
    },
    defaultVariants: {
      size: "md",
      selectVariant: "default",
      fullWidth: true,
      error: false
    },
  }
);

export interface SelectProps 
  extends Omit<AntSelectProps, 'size' | 'variant'>, 
          VariantProps<typeof selectVariants> {
  /**
   * 选择器变体
   */
  selectVariant?: 'default' | 'filled' | 'borderless';
  
  /**
   * 是否为必填字段
   */
  required?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 多选框组件props
 */
export interface MultiSelectProps extends Omit<SelectProps, 'mode'> {
  /**
   * 最大选择数量
   */
  maxCount?: number;
  
  /**
   * 显示选择计数
   */
  showCount?: boolean;
}

/**
 * 增强的选择框组件
 * 基于Ant Design Select，提供一致的设计系统集成
 */
export const Select: React.FC<SelectProps> = ({
  size = 'md',
  selectVariant = 'default',
  required = false,
  error = false,
  fullWidth = true,
  className,
  ...props
}) => {
  // 映射自定义尺寸到Ant Design尺寸
  const getAntdSize = (): AntSelectProps['size'] => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 'large';
      default:
        return 'middle';
    }
  };

  // 映射自定义变体到Ant Design变体
  const getAntdVariant = (): AntSelectProps['variant'] => {
    switch (selectVariant) {
      case 'filled':
        return 'filled';
      case 'borderless':
        return 'borderless';
      default:
        return 'outlined';
    }
  };

  // 使用CVA生成样式类
  const selectClassName = cn(
    selectVariants({ 
      size: size as 'sm' | 'md' | 'lg', 
      selectVariant: selectVariant as 'default' | 'filled' | 'borderless',
      fullWidth,
      error 
    }),
    className
  );

  return (
    <AntSelect
      {...props}
      size={getAntdSize()}
      variant={getAntdVariant()}
      status={error ? 'error' : props.status}
      className={selectClassName}
      // 品牌化下拉面板样式：使用design tokens
      popupClassName={cn(
        'ui-select-dropdown',
        'bg-[var(--bg-elevated)]/95 backdrop-blur-[var(--backdrop-blur)]',
        'shadow-[var(--shadow-glass)] border border-[var(--border-primary)]/40',
        'rounded-[var(--radius)] overflow-hidden',
        props.popupClassName
      )}
      style={{
        width: fullWidth ? '100%' : props.style?.width,
        ...props.style,
      }}
    />
  );
};

/**
 * 多选框组件
 * 支持多选功能，带有选择计数显示
 */
export const MultiSelect: React.FC<MultiSelectProps> = ({
  maxCount,
  showCount = false,
  placeholder = '请选择（支持多选）',
  ...props
}) => {
  return (
    <Select
      {...props}
      mode="multiple"
      maxCount={maxCount}
      placeholder={placeholder}
      allowClear
    />
  );
};

/**
 * 标签选择组件
 * 支持标签模式选择
 */
export const TagSelect: React.FC<SelectProps> = ({
  placeholder = '请输入或选择标签',
  ...props
}) => {
  return (
    <Select
      {...props}
      mode="tags"
      placeholder={placeholder}
      allowClear
    />
  );
};

// 为兼容性导出Ant Design的选项组件
export const { Option, OptGroup } = AntSelect;