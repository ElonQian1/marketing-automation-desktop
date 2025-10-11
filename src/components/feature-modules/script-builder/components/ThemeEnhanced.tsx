// src/components/feature-modules/script-builder/components/ThemeEnhanced.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 脚本构建器主题适配增强
 * 为智能脚本构建器提供深度主题集成
 */

import React from 'react';
import { Card, Tag, Button, Progress, Typography, Space } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useThemeState } from '../../theme-system';
import type { StepStatus } from '../types';

const { Text } = Typography;

/**
 * 主题感知的步骤状态指示器
 */
interface ThemeAwareStatusIndicatorProps {
  status: StepStatus;
  showText?: boolean;
  size?: 'small' | 'middle' | 'large';
}

export const ThemeAwareStatusIndicator: React.FC<ThemeAwareStatusIndicatorProps> = ({
  status,
  showText = true,
  size = 'middle',
}) => {
  const { isDark } = useThemeState();

  const getStatusConfig = (status: StepStatus) => {
    const configs = {
      pending: {
        icon: <ClockCircleOutlined />,
        color: isDark ? '#8c8c8c' : '#595959',
        bgColor: isDark ? 'rgba(140, 140, 140, 0.1)' : 'rgba(89, 89, 89, 0.06)',
        text: '等待中',
        tagColor: 'default',
      },
      running: {
        icon: <PlayCircleOutlined />,
        color: isDark ? '#1677ff' : '#1890ff',
        bgColor: isDark ? 'rgba(22, 119, 255, 0.1)' : 'rgba(24, 144, 255, 0.06)',
        text: '执行中',
        tagColor: 'processing',
      },
      completed: {
        icon: <CheckCircleOutlined />,
        color: isDark ? '#52c41a' : '#389e0d',
        bgColor: isDark ? 'rgba(82, 196, 26, 0.1)' : 'rgba(56, 158, 13, 0.06)',
        text: '已完成',
        tagColor: 'success',
      },
      failed: {
        icon: <ExclamationCircleOutlined />,
        color: isDark ? '#ff4d4f' : '#cf1322',
        bgColor: isDark ? 'rgba(255, 77, 79, 0.1)' : 'rgba(207, 19, 34, 0.06)',
        text: '失败',
        tagColor: 'error',
      },
      skipped: {
        icon: <PauseCircleOutlined />,
        color: isDark ? '#faad14' : '#d48806',
        bgColor: isDark ? 'rgba(250, 173, 20, 0.1)' : 'rgba(212, 136, 6, 0.06)',
        text: '已跳过',
        tagColor: 'warning',
      },
    };
    return configs[status];
  };

  const config = getStatusConfig(status);

  if (showText) {
    return (
      <Tag
        icon={config.icon}
        color={config.tagColor}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.color,
          color: config.color,
          fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
        }}
      >
        {config.text}
      </Tag>
    );
  }

  return (
    <span style={{ color: config.color, fontSize: size === 'large' ? '18px' : '16px' }}>
      {config.icon}
    </span>
  );
};

/**
 * 主题感知的脚本步骤卡片容器
 */
interface ThemeAwareStepCardProps {
  title: React.ReactNode;
  status?: StepStatus;
  progress?: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ThemeAwareStepCard: React.FC<ThemeAwareStepCardProps> = ({
  title,
  status = 'pending',
  progress,
  children,
  actions,
  extra,
  className,
  onClick,
}) => {
  const { isDark } = useThemeState();

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: 'var(--colorBorderSecondary)',
    borderRadius: '8px',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: onClick ? 'pointer' : 'default',
  };

  const hoverStyle: React.CSSProperties = onClick ? {
    transform: 'translateY(-1px)',
    boxShadow: isDark 
      ? '0 4px 16px rgba(0, 0, 0, 0.3)' 
      : '0 4px 16px rgba(0, 0, 0, 0.08)',
    borderColor: 'var(--colorPrimary)',
  } : {};

  const titleElement = (
    <Space>
      {title}
      <ThemeAwareStatusIndicator status={status} />
      {extra}
    </Space>
  );

  return (
    <Card
      title={titleElement}
      actions={actions ? [actions] : undefined}
      className={`theme-aware-step-card ${className || ''}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (onClick) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          Object.assign(e.currentTarget.style, cardStyle);
        }
      }}
      onClick={onClick}
    >
      {progress !== undefined && (
        <div style={{ marginBottom: '12px' }}>
          <Progress
            percent={progress}
            strokeColor={isDark ? '#1677ff' : '#1890ff'}
            trailColor={isDark ? 'rgba(140, 140, 140, 0.2)' : 'rgba(0, 0, 0, 0.06)'}
            size="small"
          />
        </div>
      )}
      {children}
    </Card>
  );
};

/**
 * 主题感知的步骤参数显示组件
 */
interface ThemeAwareStepParamsProps {
  params: Record<string, any>;
  maxDisplay?: number;
}

export const ThemeAwareStepParams: React.FC<ThemeAwareStepParamsProps> = ({
  params,
  maxDisplay = 3,
}) => {
  const { isDark } = useThemeState();
  const entries = Object.entries(params).slice(0, maxDisplay);
  const hasMore = Object.keys(params).length > maxDisplay;

  return (
    <Space wrap size="small">
      {entries.map(([key, value]) => (
        <Tag
          key={key}
          style={{
            backgroundColor: isDark 
              ? 'rgba(22, 119, 255, 0.1)' 
              : 'rgba(24, 144, 255, 0.06)',
            borderColor: isDark ? '#1677ff' : '#1890ff',
            color: isDark ? '#69b1ff' : '#1890ff',
            fontSize: '12px',
          }}
        >
          {key}: {String(value).length > 20 ? `${String(value).slice(0, 20)}...` : String(value)}
        </Tag>
      ))}
      {hasMore && (
        <Tag
          style={{
            backgroundColor: isDark 
              ? 'rgba(140, 140, 140, 0.1)' 
              : 'rgba(89, 89, 89, 0.06)',
            borderColor: isDark ? '#8c8c8c' : '#595959',
            color: isDark ? '#bfbfbf' : '#595959',
            fontSize: '12px',
          }}
        >
          +{Object.keys(params).length - maxDisplay} 更多
        </Tag>
      )}
    </Space>
  );
};

/**
 * 主题感知的步骤操作按钮组
 */
interface ThemeAwareStepActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onRun?: () => void;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

export const ThemeAwareStepActions: React.FC<ThemeAwareStepActionsProps> = ({
  onEdit,
  onDelete,
  onCopy,
  onRun,
  disabled = false,
  size = 'small',
}) => {
  const { isDark } = useThemeState();

  const buttonStyle: React.CSSProperties = {
    borderColor: 'var(--colorBorder)',
    color: 'var(--colorText)',
    backgroundColor: 'transparent',
  };

  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#1677ff' : '#1890ff',
    borderColor: isDark ? '#1677ff' : '#1890ff',
    color: '#ffffff',
  };

  return (
    <Space size="small">
      {onRun && (
        <Button
          size={size}
          icon={<PlayCircleOutlined />}
          style={primaryButtonStyle}
          disabled={disabled}
          onClick={onRun}
        >
          运行
        </Button>
      )}
      {onEdit && (
        <Button
          size={size}
          icon={<EditOutlined />}
          style={buttonStyle}
          disabled={disabled}
          onClick={onEdit}
        >
          编辑
        </Button>
      )}
      {onCopy && (
        <Button
          size={size}
          icon={<CopyOutlined />}
          style={buttonStyle}
          disabled={disabled}
          onClick={onCopy}
        >
          复制
        </Button>
      )}
      {onDelete && (
        <Button
          size={size}
          icon={<DeleteOutlined />}
          danger
          style={buttonStyle}
          disabled={disabled}
          onClick={onDelete}
        >
          删除
        </Button>
      )}
    </Space>
  );
};