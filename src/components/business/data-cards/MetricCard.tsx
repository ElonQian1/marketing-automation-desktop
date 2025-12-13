// src/components/business/data-cards/MetricCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Statistic, Space, Typography, theme } from 'antd';

const { Text } = Typography;

export interface MetricCardProps {
  /** 指标标题 */
  title: string;
  /** 指标值 */
  value: string | number;
  /** 图标 */
  icon?: React.ReactNode;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 精度 */
  precision?: number;
  /** 值的颜色 */
  valueColor?: string;
  /** 副标题/描述 */
  description?: string;
  /** 卡片样式类型 */
  variant?: 'default' | 'gradient' | 'bordered';
  /** 渐变色配置 */
  gradientColors?: [string, string];
  /** 点击事件 */
  onClick?: () => void;
}

/**
 * 商业化指标卡片组件
 * 用于展示关键数据指标，支持多种样式变体
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  prefix,
  suffix,
  precision,
  valueColor,
  description,
  variant = 'default',
  gradientColors,
  onClick
}) => {
  const { token } = theme.useToken();

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: token.borderRadiusLG,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease'
    };

    switch (variant) {
      case 'gradient':
        return {
          ...baseStyle,
          background: gradientColors 
            ? `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`
            : `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover})`,
          border: 'none',
          color: 'white'
        };
      case 'bordered':
        return {
          ...baseStyle,
          border: `2px solid ${token.colorPrimary}`,
          background: token.colorBgContainer
        };
      default:
        return {
          ...baseStyle,
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'gradient') return 'white';
    return valueColor || token.colorText;
  };

  const getSecondaryTextColor = () => {
    if (variant === 'gradient') return 'rgba(255, 255, 255, 0.8)';
    return token.colorTextSecondary;
  };

  return (
    <Card
      style={getCardStyle()}
      styles={{ body: { padding: token.paddingLG } }}
      hoverable={!!onClick}
      onClick={onClick}
    >
      <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
        <Space align="center">
          {icon && (
            <div style={{ 
              fontSize: token.fontSizeHeading3,
              color: variant === 'gradient' ? 'white' : token.colorPrimary,
              lineHeight: 1
            }}>
              {icon}
            </div>
          )}
          <Text style={{ 
            color: getSecondaryTextColor(),
            fontSize: token.fontSize,
            fontWeight: token.fontWeightStrong
          }}>
            {title}
          </Text>
        </Space>
        
        <Statistic
          value={value}
          prefix={prefix}
          suffix={suffix}
          precision={precision}
          valueStyle={{
            color: getTextColor(),
            fontSize: token.fontSizeHeading1,
            fontWeight: token.fontWeightStrong,
            lineHeight: 1.2
          }}
        />
        
        {description && (
          <Text style={{ 
            color: getSecondaryTextColor(),
            fontSize: token.fontSizeSM
          }}>
            {description}
          </Text>
        )}
      </Space>
    </Card>
  );
};