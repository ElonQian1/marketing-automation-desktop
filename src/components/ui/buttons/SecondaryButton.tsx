// src/components/ui/buttons/SecondaryButton.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 次要操作按钮组件
 * 用于次要操作，如取消、重置等
 * 文件大小控制：< 150行
 */

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import classNames from 'classnames';

export interface SecondaryButtonProps extends Omit<AntButtonProps, 'type' | 'variant' | 'size'> {
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否为全宽按钮 */
  fullWidth?: boolean;
  /** 按钮变体 */
  variant?: 'outlined' | 'ghost' | 'text';
  /** 自定义类名 */
  className?: string;
}

/**
 * 次要操作按钮组件
 * 用于次要操作，如取消、重置等
 */
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  size = 'medium',
  fullWidth = false,
  variant = 'outlined',
  className,
  children,
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
    outlined: 'default' as const,
    ghost: 'dashed' as const,
    text: 'text' as const,
  };

  // 构建CSS类名
  const buttonClasses = classNames(
    'secondary-button',
    `secondary-button--${variant}`,
    {
      'secondary-button--full-width': fullWidth,
    },
    className
  );

  return (
    <AntButton
      type={variantMap[variant]}
      size={sizeMap[size]}
      className={buttonClasses}
      {...props}
      style={{
        width: fullWidth ? '100%' : undefined,
        ...props.style,
      }}
    >
      {children}
    </AntButton>
  );
};

export default SecondaryButton;