// src/components/ui/feedback/Loading.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Spin, type SpinProps } from 'antd';
import { clsx } from 'clsx';

// 工具函数：合并类名
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return clsx(classes.filter(Boolean));
};

/**
 * 加载组件props
 */
export interface LoadingProps extends Omit<SpinProps, 'size'> {
  /**
   * 加载器尺寸
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * 是否显示文本
   */
  showText?: boolean;
  
  /**
   * 自定义加载文本
   */
  text?: string;
  
  /**
   * 是否居中显示
   */
  centered?: boolean;
  
  /**
   * 是否覆盖整个容器
   */
  overlay?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 加载组件
 * 基于Ant Design Spin组件的增强版本
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  showText = true,
  text = '加载中...',
  centered = false,
  overlay = false,
  className,
  children,
  ...props
}) => {
  // 映射自定义尺寸到Ant Design尺寸
  const getAntdSize = (): SpinProps['size'] => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'default';
    }
  };

  const loadingClassName = cn(
    'ui-loading',
    size === 'small' && 'ui-loading--small',
    size === 'medium' && 'ui-loading--medium',
    size === 'large' && 'ui-loading--large',
    centered && 'ui-loading--centered',
    overlay && 'ui-loading--overlay',
    className
  );

  const spinProps: SpinProps = {
    ...props,
    size: getAntdSize(),
    tip: showText ? text : undefined,
    className: loadingClassName,
  };

  // 如果有children，包装在Spin中作为加载状态
  if (children) {
    return (
      <Spin {...spinProps}>
        {children}
      </Spin>
    );
  }

  // 如果需要居中或覆盖，添加容器
  if (centered || overlay) {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...(overlay && {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-overlay)',
        zIndex: 1000,
      }),
      ...(centered && !overlay && {
        minHeight: '100px',
      }),
    };

    return (
      <div style={containerStyle} className={overlay ? 'ui-loading-overlay' : 'ui-loading-container'}>
        <Spin {...spinProps} />
      </div>
    );
  }

  return <Spin {...spinProps} />;
};

/**
 * 页面加载组件
 * 用于整个页面的加载状态
 */
export const PageLoading: React.FC<{
  text?: string;
  className?: string;
}> = ({ text = '页面加载中...', className }) => {
  return (
    <Loading
      size="large"
      text={text}
      centered
      className={cn('ui-page-loading', className)}
    />
  );
};

/**
 * 内容加载组件
 * 用于包装需要加载状态的内容
 */
export const ContentLoading: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}> = ({ loading, children, text = '加载中...', className }) => {
  return (
    <Loading
      spinning={loading}
      text={text}
      className={className}
    >
      {children}
    </Loading>
  );
};

/**
 * 按钮加载组件
 * 用于按钮的加载状态
 */
export const ButtonLoading: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <Loading
      size="small"
      showText={false}
      className={cn('ui-button-loading', className)}
    />
  );
};