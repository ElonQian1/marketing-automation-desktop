/**
 * 增强的输入框组件
 * 基于Ant Design Input的增强版本
 * 文件大小控制：< 200行
 */

import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import classNames from 'classnames';

export interface InputProps extends Omit<AntInputProps, 'size'> {
  /** 输入框尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 输入框变体 */
  variant?: 'outlined' | 'filled' | 'borderless';
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 增强的输入框组件
 * 提供统一的输入框样式和行为
 */
export const Input: React.FC<InputProps> = ({
  size = 'medium',
  variant = 'outlined',
  fullWidth = false,
  className,
  ...props
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 'small' as const,
    medium: 'middle' as const,
    large: 'large' as const,
  };

  // 变体映射
  const variantMap = {
    outlined: undefined,
    filled: 'filled',
    borderless: 'borderless',
  };

  // 构建CSS类名
  const inputClasses = classNames(
    'enhanced-input',
    `enhanced-input--${variant}`,
    `enhanced-input--${size}`,
    // 品牌化样式：聚焦发光效果和渐变边框
    'transition-all duration-200 ease-out',
    'border border-border/60',
    'focus-within:border-brand-500',
    'focus-within:shadow-[var(--shadow-brand-glow)]',
    'hover:border-border',
    'hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
    {
      'enhanced-input--full-width': fullWidth,
    },
    className
  );

  return (
    <AntInput
      size={sizeMap[size]}
      variant={variantMap[variant] as any}
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

// 文本域
interface TextAreaProps {
  rows?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  size?: 'small' | 'medium' | 'large';
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
  size = 'medium',
  className,
  ...props
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 'small' as const,
    medium: 'middle' as const,
    large: 'large' as const,
  };

  const inputClasses = classNames(
    'enhanced-textarea',
    // 品牌化样式：与Input保持一致的现代化效果
    'transition-all duration-200 ease-out',
    'border border-border/60',
    'focus-within:border-brand-500',
    'focus-within:shadow-[var(--shadow-brand-glow)]',
    'hover:border-border',
    'hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
    className
  );

  return (
    <AntInput.TextArea
      rows={rows}
      autoSize={autoSize}
      size={sizeMap[size]}
      className={inputClasses}
      {...props}
    />
  );
};

export default Input;