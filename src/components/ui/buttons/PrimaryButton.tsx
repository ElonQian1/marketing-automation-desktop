/**
 * 主要操作按钮组件
 * 基于设计令牌系统的现代化按钮实现
 * 文件大小控制：< 200行
 */

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';

// 导入设计系统样式
import '../../universal-ui/styles/universal-ui-integration.css';

export interface PrimaryButtonProps extends Omit<AntButtonProps, 'type' | 'variant' | 'size'> {
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 加载状态 */
  loading?: boolean;
  /** 是否为全宽按钮 */
  fullWidth?: boolean;
  /** 按钮变体 */
  variant?: 'solid' | 'gradient' | 'elevated';
  /** 自定义类名 */
  className?: string;
  /** 点击事件 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * 主要操作按钮组件
 * 用于最重要的操作，如提交、确认、开始等
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  size = 'medium',
  loading = false,
  fullWidth = false,
  variant = 'solid',
  className,
  children,
  disabled,
  onClick,
  ...props
}) => {
  // 尺寸映射
  const sizeMap = {
    small: 'small' as const,
    medium: 'middle' as const,
    large: 'large' as const,
  };

  // 构建CSS类名
  const buttonClasses = classNames(
    'primary-button',
    {
      'primary-button--full-width': fullWidth,
      'primary-button--gradient': variant === 'gradient',
      'primary-button--elevated': variant === 'elevated',
      'primary-button--loading': loading,
    },
    className
  );

  // 加载图标
  const loadingIcon = loading ? <LoadingOutlined /> : null;

  return (
    <AntButton
      type="primary"
      size={sizeMap[size]}
      loading={loading}
      disabled={disabled || loading}
      icon={loadingIcon}
      className={buttonClasses}
      onClick={onClick}
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

// 组件样式定义
const buttonStyles = `
.primary-button {
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-brand-sm);
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-brand-md);
}

.primary-button--gradient {
  background: linear-gradient(135deg, var(--brand), var(--brand-700));
  border: none;
}

.primary-button--elevated {
  box-shadow: var(--shadow-brand-lg);
}

.primary-button--loading {
  pointer-events: none;
}

.primary-button--full-width {
  width: 100%;
}

@media (max-width: 768px) {
  .primary-button {
    min-height: 44px;
  }
}
`;

// 导出样式（如果需要）
export const PrimaryButtonStyles = buttonStyles;

export default PrimaryButton;