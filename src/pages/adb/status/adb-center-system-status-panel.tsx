// src/pages/adb/status/adb-center-system-status-panel.tsx
// module: adb-center | layer: ui | role: system-status-panel
// summary: ADB中心系统状态面板，展示ADB服务状态、设备状态、健康检查结果和实时日志

import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Space,
  Typography,
  Button,
  Tooltip,
  Progress,
  Statistic,
  Divider,
  Badge,
  Collapse,
  List,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DesktopOutlined,
  MobileOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAdbStore } from '../../../application/store/adbStore';
import { useAdb } from '../../../application/hooks/useAdb';
import { DiagnosticStatus } from '../../../domain/adb';

const { Text, Title } = Typography;
const { Panel } = Collapse;

/**
 * 状态徽章组件
 */
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'processing';
  text: string;
  description?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, description }) => {
  const iconMap = {
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    warning: <WarningOutlined style={{ color: '#faad14' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    processing: <SyncOutlined spin style={{ color: '#1890ff' }} />,
  };

  const colorMap = {
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    processing: '#1890ff',
  };

  return (
    <Tooltip title={description}>
      <Tag
        icon={iconMap[status]}
        color={colorMap[status]}
        style={{
          padding: '4px 12px',
          fontSize: '13px',
          borderRadius: '4px',
        }}
      >
        {text}
      </Tag>
    </Tooltip>
  );
};

/**
 * 状态卡片组件
 */
interface StatusCardProps {
  title: string;
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error' | 'processing';
  statusText: string;
  description: string;
  extra?: React.ReactNode;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  icon,
  status,
  statusText,
  description,
  extra,
}) => {
  const bgColorMap = {
    success: 'rgba(82, 196, 26, 0.1)',
    warning: 'rgba(250, 173, 20, 0.1)',
    error: 'rgba(255, 77, 79, 0.1)',
    processing: 'rgba(24, 144, 255, 0.1)',
  };

  const borderColorMap = {
    success: 'rgba(82, 196, 26, 0.3)',
    warning: 'rgba(250, 173, 20, 0.3)',
    error: 'rgba(255, 77, 79, 0.3)',
    processing: 'rgba(24, 144, 255, 0.3)',
  };

  return (
    <Card
      size="small"
      style={{
        background: bgColorMap[status],
        borderColor: borderColorMap[status],
        borderRadius: '8px',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <Text strong>{title}</Text>
        </Space>
        <StatusBadge status={status} text={statusText} description={description} />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {description}
        </Text>
        {extra}
      </Space>
    </Card>
  );
};

/**
 * 实时日志条目组件
 */
interface LogEntryProps {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source?: string;
}

const LogEntry: React.FC<LogEntryProps> = ({ timestamp, level, message: msg, source }) => {
  const levelConfig = {
    info: { color: '#1890ff', icon: <InfoCircleOutlined /> },
    warn: { color: '#faad14', icon: <WarningOutlined /> },
    error: { color: '#ff4d4f', icon: <CloseCircleOutlined /> },
    success: { color: '#52c41a', icon: <CheckCircleOutlined /> },
  };

  const config = levelConfig[level];

  return (
    <div
      style={{
        padding: '8px 12px',
        borderLeft: `3px solid ${config.color}`,
        marginBottom: '4px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '0 4px 4px 0',
      }}
    >
      <Space size="small">
        <Text type="secondary" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
          {timestamp.toLocaleTimeString()}
        </Text>
        <span style={{ color: config.color }}>{config.icon}</span>
        {source && (
          <Tag color="blue" style={{ fontSize: '10px', padding: '0 4px' }}>
            {source}
          </Tag>
        )}
        <Text style={{ fontSize: '12px' }}>{msg}</Text>
      </Space>
    </div>
  );
};

/**
 * ADB 中心系统状态面板
 */
export const AdbCenterSystemStatusPanel: React.FC = () => {
  const { devices, isLoading, triggerHealthCheck } = useAdb();
  const diagnosticResults = useAdbStore((s) => s.diagnosticResults);
  const diagnosticSummary = useAdbStore((s) => s.diagnosticSummary);
  const lastError = useAdbStore((s) => s.lastError);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [realtimeLogs, setRealtimeLogs] = useState<LogEntryProps[]>([]);

  // 计算各项状态
  const onlineDevices = devices.filter((d) => d.isOnline());
  const offlineDevices = devices.filter((d) => !d.isOnline());

  // ADB 服务状态
  const adbServerStatus = React.useMemo(() => {
    const serverResult = diagnosticResults.find((r) => r.id === 'adb-server');
    if (!serverResult) return { status: 'processing' as const, text: '检测中...' };
    if (serverResult.status === DiagnosticStatus.SUCCESS) {
      return { status: 'success' as const, text: '运行正常' };
    } else if (serverResult.status === DiagnosticStatus.WARNING) {
      return { status: 'warning' as const, text: '需要注意' };
    } else {
      return { status: 'error' as const, text: '异常' };
    }
  }, [diagnosticResults]);

  // 设备连接状态
  const deviceConnectionStatus = React.useMemo(() => {
    if (isLoading) return { status: 'processing' as const, text: '扫描中...' };
    if (onlineDevices.length > 0) {
      return { status: 'success' as const, text: `${onlineDevices.length} 台在线` };
    } else if (devices.length > 0) {
      return { status: 'warning' as const, text: `${devices.length} 台离线` };
    }
    return { status: 'warning' as const, text: '无设备' };
  }, [isLoading, devices, onlineDevices]);

  // 健康检查状态
  const healthStatus = React.useMemo(() => {
    if (!diagnosticSummary) return { status: 'processing' as const, text: '未检查' };
    if (diagnosticSummary.hasErrors()) {
      return { status: 'error' as const, text: `${diagnosticSummary.errorCount} 个错误` };
    } else if (diagnosticSummary.hasWarnings()) {
      return { status: 'warning' as const, text: `${diagnosticSummary.warningCount} 个警告` };
    }
    return { status: 'success' as const, text: '健康' };
  }, [diagnosticSummary]);

  // 添加日志条目
  const addLog = useCallback(
    (level: LogEntryProps['level'], msg: string, source?: string) => {
      setRealtimeLogs((prev) => [
        { timestamp: new Date(), level, message: msg, source },
        ...prev.slice(0, 49), // 保留最近 50 条
      ]);
    },
    []
  );

  // 监听诊断结果变化
  useEffect(() => {
    if (diagnosticResults.length > 0) {
      const latest = diagnosticResults[diagnosticResults.length - 1];
      const level =
        latest.status === DiagnosticStatus.SUCCESS
          ? 'success'
          : latest.status === DiagnosticStatus.WARNING
          ? 'warn'
          : 'error';
      addLog(level, latest.message, latest.name);
    }
  }, [diagnosticResults, addLog]);

  // 监听设备变化
  useEffect(() => {
    if (devices.length > 0) {
      addLog('info', `设备列表更新: ${devices.length} 台设备`, '设备监控');
    }
  }, [devices.length, addLog]);

  // 监听错误
  useEffect(() => {
    if (lastError) {
      addLog('error', lastError.message, '系统错误');
    }
  }, [lastError, addLog]);

  // 手动刷新健康检查
  const handleRefresh = async () => {
    setIsRefreshing(true);
    addLog('info', '手动触发健康检查...', '用户操作');
    try {
      await triggerHealthCheck();
      setLastCheckTime(new Date());
      addLog('success', '健康检查完成', '健康服务');
      message.success('健康检查完成');
    } catch (err) {
      addLog('error', `健康检查失败: ${err}`, '健康服务');
      message.error('健康检查失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 清空日志
  const handleClearLogs = () => {
    setRealtimeLogs([]);
    message.info('实时日志已清空');
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* 顶部操作栏 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              <ThunderboltOutlined /> 系统状态监控
            </Title>
            {lastCheckTime && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ClockCircleOutlined /> 上次检查: {lastCheckTime.toLocaleTimeString()}
              </Text>
            )}
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<ReloadOutlined spin={isRefreshing} />}
            loading={isRefreshing}
            onClick={handleRefresh}
          >
            刷新状态
          </Button>
        </Col>
      </Row>

      {/* 状态卡片网格 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <StatusCard
            title="ADB 服务"
            icon={<ApiOutlined style={{ color: '#1890ff' }} />}
            status={adbServerStatus.status}
            statusText={adbServerStatus.text}
            description={
              adbServerStatus.status === 'success'
                ? 'ADB 服务器运行正常，可以进行设备操作'
                : adbServerStatus.status === 'error'
                ? 'ADB 服务器异常，请检查安装或重启服务'
                : '正在检测 ADB 服务器状态...'
            }
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <StatusCard
            title="设备连接"
            icon={<MobileOutlined style={{ color: '#52c41a' }} />}
            status={deviceConnectionStatus.status}
            statusText={deviceConnectionStatus.text}
            description={
              onlineDevices.length > 0
                ? `在线: ${onlineDevices.map((d) => d.id).join(', ')}`
                : '请连接 Android 设备并启用 USB 调试'
            }
            extra={
              <Space size="small">
                {onlineDevices.map((d) => (
                  <Badge
                    key={d.id}
                    status="success"
                    text={<Text style={{ fontSize: '11px' }}>{d.id.slice(0, 8)}</Text>}
                  />
                ))}
                {offlineDevices.map((d) => (
                  <Badge
                    key={d.id}
                    status="default"
                    text={<Text type="secondary" style={{ fontSize: '11px' }}>{d.id.slice(0, 8)}</Text>}
                  />
                ))}
              </Space>
            }
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <StatusCard
            title="健康检查"
            icon={<DesktopOutlined style={{ color: '#722ed1' }} />}
            status={healthStatus.status}
            statusText={healthStatus.text}
            description={
              diagnosticSummary
                ? `总检查: ${diagnosticSummary.totalChecks}, 成功: ${diagnosticSummary.successCount}, 警告: ${diagnosticSummary.warningCount}, 错误: ${diagnosticSummary.errorCount}`
                : '点击刷新按钮执行健康检查'
            }
            extra={
              diagnosticSummary && (
                <Progress
                  percent={diagnosticSummary.getHealthPercentage()}
                  size="small"
                  status={
                    diagnosticSummary.hasErrors()
                      ? 'exception'
                      : diagnosticSummary.hasWarnings()
                      ? 'normal'
                      : 'success'
                  }
                  showInfo={false}
                />
              )
            }
          />
        </Col>
      </Row>

      {/* 统计信息 */}
      <Divider style={{ margin: '16px 0' }} />
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="在线设备"
            value={onlineDevices.length}
            suffix="台"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="离线设备"
            value={offlineDevices.length}
            suffix="台"
            valueStyle={{ color: offlineDevices.length > 0 ? '#faad14' : '#8c8c8c' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="诊断项"
            value={diagnosticResults.length}
            suffix="项"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="健康度"
            value={diagnosticSummary?.getHealthPercentage() ?? 0}
            suffix="%"
            valueStyle={{
              color: diagnosticSummary?.hasErrors()
                ? '#ff4d4f'
                : diagnosticSummary?.hasWarnings()
                ? '#faad14'
                : '#52c41a',
            }}
          />
        </Col>
      </Row>

      {/* 实时日志面板 */}
      <Divider style={{ margin: '16px 0' }} />
      <Collapse defaultActiveKey={['logs']}>
        <Panel
          header={
            <Space>
              <ClockCircleOutlined />
              <Text strong>实时系统日志</Text>
              <Badge count={realtimeLogs.length} style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          key="logs"
          extra={
            <Button size="small" onClick={handleClearLogs}>
              清空
            </Button>
          }
        >
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '4px',
              padding: '8px',
            }}
          >
            {realtimeLogs.length > 0 ? (
              realtimeLogs.map((log, index) => (
                <LogEntry key={index} {...log} />
              ))
            ) : (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                暂无日志，系统事件将在此显示
              </Text>
            )}
          </div>
        </Panel>
      </Collapse>

      {/* 诊断详情 */}
      {diagnosticResults.length > 0 && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Collapse>
            <Panel
              header={
                <Space>
                  <InfoCircleOutlined />
                  <Text strong>诊断详情</Text>
                </Space>
              }
              key="diagnostics"
            >
              <List
                size="small"
                dataSource={diagnosticResults}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        item.status === DiagnosticStatus.SUCCESS ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        ) : item.status === DiagnosticStatus.WARNING ? (
                          <WarningOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                        )
                      }
                      title={item.name}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text style={{ fontSize: '12px' }}>{item.message}</Text>
                          {item.suggestion && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              💡 {item.suggestion}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Panel>
          </Collapse>
        </>
      )}
    </div>
  );
};

export default AdbCenterSystemStatusPanel;
