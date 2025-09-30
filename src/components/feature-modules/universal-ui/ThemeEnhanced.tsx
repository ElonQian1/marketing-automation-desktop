/**
 * 通用页面主题增强模块
 * 为各种页面提供统一的主题适配组件
 */

import React from 'react';
import { Card, Badge, Avatar, Statistic, Progress, Typography, Space, Button, Empty } from 'antd';
import { 
  TrophyOutlined, 
  UserOutlined, 
  DashboardOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useThemeState } from '../theme-system';

const { Title, Text, Paragraph } = Typography;

/**
 * 主题感知的统计卡片
 */
interface ThemeAwareStatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: 'up' | 'down' | 'none';
  trendValue?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

export const ThemeAwareStatCard: React.FC<ThemeAwareStatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend = 'none',
  trendValue,
  color = 'primary',
  loading = false,
}) => {
  const { isDark } = useThemeState();

  const getColorValue = (colorType: string) => {
    const colorMap = {
      primary: isDark ? '#1677ff' : '#1890ff',
      success: isDark ? '#52c41a' : '#389e0d',
      warning: isDark ? '#faad14' : '#d48806',
      error: isDark ? '#ff4d4f' : '#cf1322',
    };
    return colorMap[colorType as keyof typeof colorMap] || colorMap.primary;
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: 'var(--colorBorderSecondary)',
    borderRadius: '8px',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'down') return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
    return null;
  };

  return (
    <Card
      style={cardStyle}
      className="theme-aware-stat-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isDark 
          ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardStyle.boxShadow as string;
      }}
    >
      <Statistic
        title={
          <Text style={{ color: 'var(--colorTextSecondary)' }}>
            {title}
          </Text>
        }
        value={value}
        loading={loading}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ 
          color: getColorValue(color),
          fontSize: '2rem',
          fontWeight: 'bold',
        }}
      />
      {trend !== 'none' && trendValue && (
        <div style={{ marginTop: '8px' }}>
          <Space>
            {getTrendIcon()}
            <Text 
              style={{ 
                color: trend === 'up' ? '#52c41a' : '#ff4d4f',
                fontSize: '12px',
              }}
            >
              {trendValue}%
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
};

/**
 * 主题感知的进度卡片
 */
interface ThemeAwareProgressCardProps {
  title: string;
  items: Array<{
    label: string;
    percent: number;
    color?: string;
  }>;
  showPercentText?: boolean;
}

export const ThemeAwareProgressCard: React.FC<ThemeAwareProgressCardProps> = ({
  title,
  items,
  showPercentText = true,
}) => {
  const { isDark } = useThemeState();

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: 'var(--colorBorderSecondary)',
    borderRadius: '8px',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  return (
    <Card
      title={
        <Text style={{ color: 'var(--colorText)', fontWeight: 'bold' }}>
          {title}
        </Text>
      }
      style={cardStyle}
      className="theme-aware-progress-card"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: index < items.length - 1 ? '16px' : '0' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px' 
            }}>
              <Text style={{ color: 'var(--colorText)' }}>{item.label}</Text>
              {showPercentText && (
                <Text style={{ color: 'var(--colorTextSecondary)', fontSize: '12px' }}>
                  {item.percent}%
                </Text>
              )}
            </div>
            <Progress
              percent={item.percent}
              strokeColor={item.color || (isDark ? '#1677ff' : '#1890ff')}
              trailColor={isDark ? 'rgba(140, 140, 140, 0.2)' : 'rgba(0, 0, 0, 0.06)'}
              showInfo={false}
            />
          </div>
        ))}
      </Space>
    </Card>
  );
};

/**
 * 主题感知的用户信息卡片
 */
interface ThemeAwareUserCardProps {
  name: string;
  avatar?: string;
  description?: string;
  stats?: Array<{
    label: string;
    value: number | string;
  }>;
  actions?: React.ReactNode;
}

export const ThemeAwareUserCard: React.FC<ThemeAwareUserCardProps> = ({
  name,
  avatar,
  description,
  stats = [],
  actions,
}) => {
  const { isDark } = useThemeState();

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: 'var(--colorBorderSecondary)',
    borderRadius: '8px',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  return (
    <Card style={cardStyle} className="theme-aware-user-card">
      <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
        <Avatar 
          size={64} 
          src={avatar} 
          icon={<UserOutlined />}
          style={{
            backgroundColor: isDark ? '#1677ff' : '#1890ff',
            border: `2px solid var(--colorBorderSecondary)`,
          }}
        />
        <div>
          <Title level={4} style={{ margin: 0, color: 'var(--colorText)' }}>
            {name}
          </Title>
          {description && (
            <Paragraph style={{ margin: '4px 0', color: 'var(--colorTextSecondary)' }}>
              {description}
            </Paragraph>
          )}
        </div>
        
        {stats.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: isDark ? '#1677ff' : '#1890ff' 
                }}>
                  {stat.value}
                </div>
                <Text style={{ color: 'var(--colorTextSecondary)', fontSize: '12px' }}>
                  {stat.label}
                </Text>
              </div>
            ))}
          </div>
        )}
        
        {actions && (
          <div style={{ width: '100%' }}>
            {actions}
          </div>
        )}
      </Space>
    </Card>
  );
};

/**
 * 主题感知的功能卡片
 */
interface ThemeAwareFeatureCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'active' | 'inactive' | 'developing';
  badge?: string | number;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const ThemeAwareFeatureCard: React.FC<ThemeAwareFeatureCardProps> = ({
  title,
  description,
  icon,
  status = 'active',
  badge,
  onClick,
  actions,
}) => {
  const { isDark } = useThemeState();

  const getStatusColor = () => {
    switch (status) {
      case 'active': return isDark ? '#52c41a' : '#389e0d';
      case 'inactive': return isDark ? '#8c8c8c' : '#595959';
      case 'developing': return isDark ? '#faad14' : '#d48806';
      default: return isDark ? '#8c8c8c' : '#595959';
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: 'var(--colorBorderSecondary)',
    borderRadius: '8px',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
    cursor: onClick ? 'pointer' : 'default',
  };

  const cardContent = (
    <Card
      style={cardStyle}
      className="theme-aware-feature-card"
      actions={actions ? [actions] : undefined}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--colorPrimary)';
          e.currentTarget.style.boxShadow = isDark 
            ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
            : '0 4px 16px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--colorBorderSecondary)';
          e.currentTarget.style.boxShadow = cardStyle.boxShadow as string;
        }
      }}
      onClick={onClick}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            {icon && (
              <div style={{ 
                fontSize: '24px', 
                color: getStatusColor(),
              }}>
                {icon}
              </div>
            )}
            <Title level={4} style={{ margin: 0, color: 'var(--colorText)' }}>
              {title}
            </Title>
          </Space>
          {badge && (
            <Badge 
              count={badge} 
              style={{ 
                backgroundColor: getStatusColor(),
                color: '#ffffff',
              }}
            />
          )}
        </div>
        
        {description && (
          <Paragraph style={{ margin: 0, color: 'var(--colorTextSecondary)' }}>
            {description}
          </Paragraph>
        )}
      </Space>
    </Card>
  );

  return cardContent;
};

/**
 * 主题感知的空状态组件
 */
interface ThemeAwareEmptyProps {
  description?: string;
  action?: React.ReactNode;
  image?: React.ReactNode;
}

export const ThemeAwareEmpty: React.FC<ThemeAwareEmptyProps> = ({
  description = '暂无数据',
  action,
  image,
}) => {
  const { isDark } = useThemeState();

  return (
    <div style={{ 
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: 'var(--colorBgContainer)',
      borderRadius: '8px',
      border: '1px solid var(--colorBorderSecondary)',
    }}>
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Text style={{ color: 'var(--colorTextSecondary)' }}>
            {description}
          </Text>
        }
        style={{
          filter: isDark ? 'brightness(0.8)' : 'none',
        }}
      >
        {action}
      </Empty>
    </div>
  );
};