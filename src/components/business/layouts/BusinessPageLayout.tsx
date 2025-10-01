import React from 'react';
import { Space, theme } from 'antd';
import type { SizeType } from 'antd/es/config-provider/SizeContext';

export interface BusinessPageLayoutProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 间距大小 */
  spacing?: SizeType;
  /** 最小高度 */
  minHeight?: string;
  /** 背景色 */
  background?: string;
  /** 内边距 */
  padding?: string | number;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 商业化页面布局组件
 * 提供统一的页面布局结构
 */
export const BusinessPageLayout: React.FC<BusinessPageLayoutProps> = ({
  children,
  spacing = 'large',
  minHeight = '100vh',
  background,
  padding,
  style
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: padding ?? token.paddingLG,
        minHeight,
        background: background ?? token.colorBgLayout,
        ...style
      }}
    >
      <Space
        direction="vertical"
        size={spacing === 'large' ? token.sizeLG : spacing}
        style={{ width: '100%' }}
      >
        {children}
      </Space>
    </div>
  );
};