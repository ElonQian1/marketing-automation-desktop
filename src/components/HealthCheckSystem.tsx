// src/components/HealthCheckSystem.tsx
// module: health-check | layer: ui | role: 健康检查系统集成组件
// summary: 集成后端健康检查功能，提供 UI 界面和状态管理

import React, { useState, useCallback, useEffect } from 'react';
import { Card, Space, Typography, Alert, Spin, Descriptions, Badge, Statistic, Row, Col, message } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, ApiOutlined } from '@ant-design/icons';
import { Button } from './ui';
import { backendHealthChecker, getBackendHealthStatus, checkBackendHealth } from '../services/backend-health-check';
import { EVENTS } from '../shared/constants/events';
import { useMessage } from '../hooks/useMessage';

const { Title, Text } = Typography;

interface HealthCheckSystemProps {
  /** 是否在首屏自动执行健康检查 */
  autoCheckOnMount?: boolean;
  /** 健康检查间隔（毫秒），0 表示不自动刷新 */
  refreshInterval?: number;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

interface HealthStatus {
  isHealthy: boolean;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
  message: string;
  timestamp: number;
  details?: {
    responseTime: number;
    endpoint: string;
    version?: string;
  };
}

export const HealthCheckSystem: React.FC<HealthCheckSystemProps> = ({
  autoCheckOnMount = true,
  refreshInterval = 30000, // 30秒自动刷新
  showDetails = true,
  className
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: false,
    status: 'unknown',
    message: '未检查',
    timestamp: 0
  });
  const [isChecking, setIsChecking] = useState(false);


  // 执行健康检查
  const performHealthCheck = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setHealthStatus(prev => ({ ...prev, status: 'checking' }));

    try {
      const result = await checkBackendHealth();
      const status = await getBackendHealthStatus();
      
      setHealthStatus({
        isHealthy: result.healthy,
        status: result.healthy ? 'healthy' : 'unhealthy',
        message: result.message || '',
        timestamp: Date.now(),
        details: {
          responseTime: result.responseTime || 0,
          endpoint: result.endpoint || 'unknown',
          version: result.version || 'unknown'
        }
      });

      // 发送健康检查事件
      if (result.healthy) {
        window.dispatchEvent(new CustomEvent(EVENTS.HEALTH_CHECK_SUCCESS, { 
          detail: { result, timestamp: Date.now() } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent(EVENTS.HEALTH_CHECK_FAILED, { 
          detail: { result, timestamp: Date.now() } 
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '健康检查失败';
      setHealthStatus({
        isHealthy: false,
        status: 'unhealthy',
        message: errorMessage,
        timestamp: Date.now()
      });

      message.error(`健康检查失败: ${errorMessage}`);
      
      window.dispatchEvent(new CustomEvent(EVENTS.HEALTH_CHECK_FAILED, { 
        detail: { error: errorMessage, timestamp: Date.now() } 
      }));
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  // 首屏探活
  useEffect(() => {
    if (autoCheckOnMount) {
      performHealthCheck();
    }
  }, [autoCheckOnMount, performHealthCheck]);

  // 定时刷新
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(performHealthCheck, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, performHealthCheck]);

  // 获取状态徽章配置
  const getStatusBadge = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return { status: 'success' as const, text: '健康', icon: <CheckCircleOutlined /> };
      case 'unhealthy':
        return { status: 'error' as const, text: '异常', icon: <ExclamationCircleOutlined /> };
      case 'checking':
        return { status: 'processing' as const, text: '检查中', icon: <SyncOutlined spin /> };
      default:
        return { status: 'default' as const, text: '未知', icon: <ApiOutlined /> };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <Card 
      className={className}
      title={
        <Space>
          <ApiOutlined />
          <Title level={5} style={{ margin: 0 }}>后端健康状态</Title>
        </Space>
      }
      extra={
        <Space>
          <Badge {...statusBadge} />
          <Button
            size="sm"
            loading={isChecking}
            onClick={performHealthCheck}
          >
            <SyncOutlined /> 手动检查
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 主要状态信息 */}
        <Alert
          type={healthStatus.isHealthy ? 'success' : 'error'}
          message={
            <Space>
              {statusBadge.icon}
              <Text strong>{healthStatus.message}</Text>
            </Space>
          }
          showIcon={false}
        />

        {/* 统计信息 */}
        {healthStatus.timestamp > 0 && (
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="最后检查时间"
                value={new Date(healthStatus.timestamp).toLocaleString()}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            {healthStatus.details?.responseTime && (
              <Col span={12}>
                <Statistic
                  title="响应时间"
                  value={healthStatus.details.responseTime}
                  suffix="ms"
                  valueStyle={{ 
                    fontSize: '14px',
                    color: healthStatus.details.responseTime > 1000 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </Col>
            )}
          </Row>
        )}

        {/* 详细信息 */}
        {showDetails && healthStatus.details && (
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="检查端点">
              {healthStatus.details.endpoint}
            </Descriptions.Item>
            {healthStatus.details.version && (
              <Descriptions.Item label="后端版本">
                {healthStatus.details.version}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="健康状态">
              <Badge {...statusBadge} />
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* 加载状态 */}
        {isChecking && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <Space>
              <Spin size="small" />
              <Text type="secondary">正在检查后端健康状态...</Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default HealthCheckSystem;