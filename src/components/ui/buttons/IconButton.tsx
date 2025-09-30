import React from 'react';
import { Button, type ButtonProps as AntButtonProps } from 'antd';
import { clsx } from 'clsx';

// 工具函数：合并类名
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return clsx(classes.filter(Boolean));
};

/**
 * 图标按钮组件props
 * 基于Ant Design Button，专门用于图标按钮
 */
export interface IconButtonProps extends Omit<AntButtonProps, 'size' | 'type' | 'variant'> {
  /**
   * 按钮尺寸
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * 按钮变体
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'danger';
  
  /**
   * 是否为圆形按钮
   */
  circular?: boolean;
  
  /**
   * 是否为方形按钮（默认）
   */
  square?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 工具提示文本
   */
  tooltip?: string;
}

/**
 * 图标按钮组件
 * 专门用于显示图标的按钮，支持圆形和方形两种形状
 */
export const IconButton: React.FC<IconButtonProps> = ({
  size = 'medium',
  variant = 'secondary',
  circular = false,
  square = true,
  className,
  tooltip,
  children,
  ...props
}) => {
  // 映射自定义尺寸到Ant Design尺寸
  const getAntdSize = (): AntButtonProps['size'] => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'middle';
    }
  };

  // 映射自定义变体到Ant Design类型
  const getAntdType = (): AntButtonProps['type'] => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'ghost':
        return 'dashed';
      case 'text':
        return 'text';
      case 'danger':
        return 'primary';
      default:
        return 'default';
    }
  };

  const buttonClassName = cn(
    // 基础样式
    'ui-icon-button',
    
    // 尺寸样式
    size === 'small' && 'ui-icon-button--small',
    size === 'medium' && 'ui-icon-button--medium',
    size === 'large' && 'ui-icon-button--large',
    
    // 变体样式
    variant === 'primary' && 'ui-icon-button--primary',
    variant === 'secondary' && 'ui-icon-button--secondary',
    variant === 'ghost' && 'ui-icon-button--ghost',
    variant === 'text' && 'ui-icon-button--text',
    variant === 'danger' && 'ui-icon-button--danger',
    
    // 形状样式
    circular && 'ui-icon-button--circular',
    square && 'ui-icon-button--square',
    
    className
  );

  const buttonContent = (
    <Button
      {...props}
      size={getAntdSize()}
      type={getAntdType()}
      danger={variant === 'danger'}
      shape={circular ? 'circle' : 'default'}
      className={buttonClassName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: circular ? 0 : '4px',
        ...props.style,
      }}
    >
      {children}
    </Button>
  );

  // 如果有工具提示，包装在Tooltip组件中
  if (tooltip) {
    // 这里可以添加Tooltip组件，暂时返回基础按钮
    return buttonContent;
  }

  return buttonContent;
};

/**
 * 圆形图标按钮
 * IconButton的圆形变体
 */
export const CircularIconButton: React.FC<Omit<IconButtonProps, 'circular' | 'square'>> = (props) => {
  return <IconButton {...props} circular square={false} />;
};

/**
 * 方形图标按钮
 * IconButton的方形变体（默认）
 */
export const SquareIconButton: React.FC<Omit<IconButtonProps, 'circular' | 'square'>> = (props) => {
  return <IconButton {...props} square circular={false} />;
};