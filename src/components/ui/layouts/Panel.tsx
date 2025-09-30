/**
 * 面板组件
 * 提供统一的内容面板布局
 * 文件大小控制：< 200行
 */

import React from 'react';
import { Card, CardProps } from 'antd';
import classNames from 'classnames';

export interface PanelProps extends Omit<CardProps, 'size' | 'variant'> {
  /** 面板标题 */
  title?: React.ReactNode;
  /** 面板操作区域 */
  extra?: React.ReactNode;
  /** 面板大小 */
  size?: 'small' | 'medium' | 'large';
  /** 面板变体 */
  variant?: 'default' | 'outlined' | 'filled' | 'elevated';
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 是否显示阴影 */
  shadow?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 面板组件
 * 提供统一的内容面板布局和样式
 */
export const Panel: React.FC<PanelProps> = ({
  title,
  extra,
  size = 'medium',
  variant = 'default',
  hoverable = false,
  shadow = true,
  className,
  children,
  ...props
}) => {
  // 构建CSS类名
  const panelClasses = classNames(
    'ui-panel',
    `ui-panel--${size}`,
    `ui-panel--${variant}`,
    {
      'ui-panel--hoverable': hoverable,
      'ui-panel--shadow': shadow,
    },
    className
  );

  // 根据变体设置Card属性
  const cardProps: Partial<CardProps> = {
    bordered: variant === 'outlined',
    ...props,
  };

  return (
    <Card
      title={title}
      extra={extra}
      className={panelClasses}
      {...cardProps}
    >
      {children}
    </Card>
  );
};

export default Panel;