import React from 'react';
import { Select as AntSelect, type SelectProps as AntSelectProps } from 'antd';
import { clsx } from 'clsx';

// 工具函数：合并类名
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return clsx(classes.filter(Boolean));
};

/**
 * 增强的选择框组件props
 * 扩展Ant Design Select的功能，排除冲突的属性
 */
export interface SelectProps extends Omit<AntSelectProps, 'size' | 'variant'> {
  /**
   * 组件尺寸
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * 组件变体
   */
  variant?: 'default' | 'filled' | 'borderless';
  
  /**
   * 是否为必填字段
   */
  required?: boolean;
  
  /**
   * 错误状态
   */
  error?: boolean;
  
  /**
   * 全宽度
   */
  fullWidth?: boolean;
  
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
  size = 'medium',
  variant = 'default',
  required = false,
  error = false,
  fullWidth = false,
  className,
  ...props
}) => {
  // 映射自定义尺寸到Ant Design尺寸
  const getAntdSize = (): AntSelectProps['size'] => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'middle';
    }
  };

  // 映射自定义变体到Ant Design变体
  const getAntdVariant = (): AntSelectProps['variant'] => {
    switch (variant) {
      case 'filled':
        return 'filled';
      case 'borderless':
        return 'borderless';
      default:
        return 'outlined';
    }
  };

  const selectClassName = cn(
    // 基础样式
    'ui-select',
    
    // 品牌化样式：与Input保持一致的现代化效果
    'transition-all duration-200 ease-out',
    'border border-border/60',
    'hover:border-border',
    'hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
    
    // 尺寸样式
    size === 'small' && 'ui-select--small',
    size === 'medium' && 'ui-select--medium',
    size === 'large' && 'ui-select--large',
    
    // 变体样式
    variant === 'default' && 'ui-select--default',
    variant === 'filled' && 'ui-select--filled',
    variant === 'borderless' && 'ui-select--borderless',
    
    // 状态样式
    required && 'ui-select--required',
    error && 'ui-select--error',
    fullWidth && 'ui-select--full-width',
    
    className
  );

  return (
    <AntSelect
      {...props}
      size={getAntdSize()}
      variant={getAntdVariant()}
      status={error ? 'error' : props.status}
      className={selectClassName}
      // 品牌化下拉面板样式：玻璃态效果
      popupClassName={cn(
        'ui-select-dropdown',
        'bg-background/95 backdrop-blur-[var(--backdrop-blur)]',
        'shadow-[var(--shadow-glass)] border border-border/40',
        'rounded-lg overflow-hidden',
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