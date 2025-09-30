/**
 * 页面容器组件
 * 提供统一的页面布局和间距
 * 文件大小控制：< 150行
 */

import React from 'react';
import classNames from 'classnames';

export interface PageContainerProps {
  /** 容器最大宽度 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 内边距大小 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 是否居中对齐 */
  centered?: boolean;
  /** 背景色 */
  background?: 'default' | 'surface' | 'elevated';
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 页面容器组件
 * 提供统一的页面布局和间距
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = 'xl',
  padding = 'lg',
  centered = true,
  background = 'default',
  className,
  children,
}) => {
  // 最大宽度映射
  const maxWidthMap = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  // 内边距映射
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // 背景色映射
  const backgroundMap = {
    default: 'bg-background-canvas',
    surface: 'bg-background-surface', 
    elevated: 'bg-background-elevated',
  };

  // 构建CSS类名
  const containerClasses = classNames(
    'page-container',
    maxWidthMap[maxWidth],
    paddingMap[padding],
    backgroundMap[background],
    {
      'mx-auto': centered,
    },
    'min-h-screen',
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

export default PageContainer;