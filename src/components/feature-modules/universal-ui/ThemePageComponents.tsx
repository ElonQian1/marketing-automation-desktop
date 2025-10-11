// src/components/feature-modules/universal-ui/ThemePageComponents.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 特定页面的主题适配组件
 * 为主要功能页面提供定制化的主题组件
 */

import React from 'react';
import { Card, Table, Space, Button, Tag, Avatar, Badge, Tooltip, Progress } from 'antd';
import { 
  PhoneOutlined, 
  UserOutlined, 
  SettingOutlined,
  AndroidOutlined,
  WifiOutlined,
  UsbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useThemeManager } from '../theme-system';
import { ThemeAwareStatCard, ThemeAwareFeatureCard } from './ThemeEnhanced';

/**
 * ADB 设备卡片 - 主题适配版本
 */
export interface ThemeAwareDeviceCardProps {
  device: {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'unauthorized' | 'unknown';
    model?: string;
    androidVersion?: string;
    brand?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    connectionType?: 'usb' | 'wifi' | 'tcp';
  };
  onConnect?: (deviceId: string) => void;
  onDisconnect?: (deviceId: string) => void;
  onRefresh?: (deviceId: string) => void;
  actions?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export const ThemeAwareDeviceCard: React.FC<ThemeAwareDeviceCardProps> = ({
  device,
  onConnect,
  onDisconnect,
  onRefresh,
  actions,
  selected = false,
  onClick,
}) => {
  const themeManager = useThemeManager();
  const isDark = themeManager.mode === 'dark';

  const getStatusIcon = () => {
    switch (device.status) {
      case 'online': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'offline': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'unauthorized': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default: return <SyncOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusText = () => {
    switch (device.status) {
      case 'online': return '在线';
      case 'offline': return '离线';
      case 'unauthorized': return '未授权';
      default: return '未知';
    }
  };

  const getStatusColor = () => {
    switch (device.status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'unauthorized': return 'warning';
      default: return 'default';
    }
  };

  const getConnectionIcon = () => {
    switch (device.connectionType) {
      case 'usb': return <UsbOutlined />;
      case 'wifi': return <WifiOutlined />;
      case 'tcp': return <WifiOutlined />;
      default: return <AndroidOutlined />;
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: selected ? 'var(--colorPrimary)' : 'var(--colorBorderSecondary)',
    borderWidth: selected ? '2px' : '1px',
    borderRadius: '8px',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: selected 
      ? isDark 
        ? '0 4px 16px rgba(22, 119, 255, 0.2)' 
        : '0 4px 16px rgba(24, 144, 255, 0.2)'
      : isDark 
        ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
        : '0 2px 8px rgba(0, 0, 0, 0.06)',
    cursor: onClick ? 'pointer' : 'default',
  };

  const deviceActions = [
    ...(actions ? [actions] : []),
    <Space key="device-actions">
      {device.status === 'offline' && onConnect && (
        <Button size="small" type="primary" onClick={() => onConnect(device.id)}>
          连接
        </Button>
      )}
      {device.status === 'online' && onDisconnect && (
        <Button size="small" onClick={() => onDisconnect(device.id)}>
          断开
        </Button>
      )}
      {onRefresh && (
        <Button size="small" icon={<SyncOutlined />} onClick={() => onRefresh(device.id)} />
      )}
    </Space>,
  ];

  return (
    <Card
      style={cardStyle}
      className="theme-aware-device-card"
      actions={deviceActions}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick && !selected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--colorPrimary)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !selected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--colorBorderSecondary)';
        }
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 设备基本信息 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Avatar 
              icon={<AndroidOutlined />} 
              style={{ 
                backgroundColor: isDark ? '#1677ff' : '#1890ff',
              }}
            />
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                color: 'var(--colorText)',
                fontSize: '14px',
              }}>
                {device.name || device.id}
              </div>
              <div style={{ 
                color: 'var(--colorTextSecondary)', 
                fontSize: '12px',
              }}>
                {device.model && `${device.brand} ${device.model}`}
              </div>
            </div>
          </Space>
          <Space>
            <Tag color={getStatusColor()} icon={getStatusIcon()}>
              {getStatusText()}
            </Tag>
          </Space>
        </div>

        {/* 设备详细信息 */}
        <Space direction="vertical" style={{ width: '100%' }}>
          {device.androidVersion && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--colorTextSecondary)' }}>Android版本:</span>
              <span style={{ color: 'var(--colorText)' }}>{device.androidVersion}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--colorTextSecondary)' }}>连接方式:</span>
            <Space>
              {getConnectionIcon()}
              <span style={{ color: 'var(--colorText)' }}>
                {device.connectionType === 'usb' ? 'USB' : 
                 device.connectionType === 'wifi' ? 'WiFi' : 
                 device.connectionType === 'tcp' ? 'TCP' : '未知'}
              </span>
            </Space>
          </div>

          {typeof device.batteryLevel === 'number' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '4px' 
              }}>
                <span style={{ color: 'var(--colorTextSecondary)' }}>电池电量:</span>
                <span style={{ color: 'var(--colorText)' }}>
                  {device.batteryLevel}%
                  {device.isCharging && ' (充电中)'}
                </span>
              </div>
              <Progress 
                percent={device.batteryLevel} 
                showInfo={false}
                strokeColor={
                  device.batteryLevel > 50 ? '#52c41a' :
                  device.batteryLevel > 20 ? '#faad14' : '#ff4d4f'
                }
                trailColor={isDark ? 'rgba(140, 140, 140, 0.2)' : 'rgba(0, 0, 0, 0.06)'}
                size="small"
              />
            </div>
          )}
        </Space>
      </Space>
    </Card>
  );
};

/**
 * 联系人导入会话表格 - 主题适配版本
 */
export interface ImportSession {
  id: string;
  deviceId: string;
  deviceName: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  totalContacts: number;
  importedContacts: number;
  failedContacts: number;
  errorMessage?: string;
  batchId?: string;
  category?: string;
}

export interface ThemeAwareSessionTableProps {
  sessions: ImportSession[];
  loading?: boolean;
  onRetry?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  onViewDetails?: (sessionId: string) => void;
  pagination?: boolean;
}

export const ThemeAwareSessionTable: React.FC<ThemeAwareSessionTableProps> = ({
  sessions,
  loading = false,
  onRetry,
  onCancel,
  onViewDetails,
  pagination = true,
}) => {
  const themeManager2 = useThemeManager();
  const isDark = themeManager2.mode === 'dark';

  const getStatusIcon = (status: ImportSession['status']) => {
    switch (status) {
      case 'running': return <SyncOutlined spin style={{ color: '#1677ff' }} />;
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'cancelled': return <PauseCircleOutlined style={{ color: '#8c8c8c' }} />;
      default: return null;
    }
  };

  const getStatusText = (status: ImportSession['status']) => {
    switch (status) {
      case 'running': return '进行中';
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const getStatusColor = (status: ImportSession['status']) => {
    switch (status) {
      case 'running': return 'processing';
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const columns: ColumnsType<ImportSession> = [
    {
      title: '设备',
      dataIndex: 'deviceName',
      key: 'device',
      render: (text, record) => (
        <Space>
          <Avatar icon={<AndroidOutlined />} size="small" />
          <div>
            <div style={{ color: 'var(--colorText)', fontWeight: 'bold' }}>{text}</div>
            <div style={{ color: 'var(--colorTextSecondary)', fontSize: '12px' }}>
              {record.deviceId}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
        </Space>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const percent = record.totalContacts > 0 
          ? Math.round((record.importedContacts / record.totalContacts) * 100)
          : 0;
        
        return (
          <div style={{ width: '120px' }}>
            <Progress 
              percent={percent} 
              size="small"
              strokeColor={
                record.status === 'success' ? '#52c41a' :
                record.status === 'failed' ? '#ff4d4f' :
                record.status === 'running' ? '#1677ff' : '#8c8c8c'
              }
              trailColor={isDark ? 'rgba(140, 140, 140, 0.2)' : 'rgba(0, 0, 0, 0.06)'}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--colorTextSecondary)',
              marginTop: '4px',
            }}>
              {record.importedContacts}/{record.totalContacts}
            </div>
          </div>
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => (
        <span style={{ color: 'var(--colorText)' }}>
          {new Date(time).toLocaleString()}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? (
        <Tag color="blue">{category}</Tag>
      ) : (
        <span style={{ color: 'var(--colorTextSecondary)' }}>-</span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {onViewDetails && (
            <Button size="small" type="link" onClick={() => onViewDetails(record.id)}>
              详情
            </Button>
          )}
          {record.status === 'failed' && onRetry && (
            <Button size="small" type="primary" onClick={() => onRetry(record.id)}>
              重试
            </Button>
          )}
          {record.status === 'running' && onCancel && (
            <Button size="small" danger onClick={() => onCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tableStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderRadius: '8px',
  };

  return (
    <Table
      columns={columns}
      dataSource={sessions}
      rowKey="id"
      loading={loading}
      pagination={pagination ? {
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      } : false}
      style={tableStyle}
      className="theme-aware-session-table"
      rowClassName={(record) => 
        record.status === 'failed' ? 'failed-row' : ''
      }
    />
  );
};