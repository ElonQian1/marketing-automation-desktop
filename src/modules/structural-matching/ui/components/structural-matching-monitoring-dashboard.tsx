// src/modules/structural-matching/ui/components/structural-matching-monitoring-dashboard.tsx
// module: structural-matching | layer: ui | role: 监控仪表板
// summary: 实时监控数据可视化仪表板

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Alert, 
  Table, 
  Tag, 
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
  Tooltip,
  Badge,
  List
} from 'antd';
import { 
  HeartOutlined,
  ThunderboltOutlined,
  BugOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { 
  StructuralMatchingMonitoringService,
  type SystemHealth,
  type MonitoringReport,
  type MonitoringAlert
} from '../../domain/services/structural-matching-monitoring-service';
import { useStructuralMatchingEvents } from '../../hooks/use-structural-matching-events';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 仪表板属性
 */
export interface StructuralMatchingMonitoringDashboardProps {
  // 刷新间隔 (毫秒)
  refreshInterval?: number;
  
  // 是否自动刷新
  autoRefresh?: boolean;
  
  // 默认时间范围 (小时)
  defaultTimeRange?: number;
  
  // 是否显示详细信息
  showDetails?: boolean;
  
  // 自定义样式
  className?: string;
  
  // 高度
  height?: number;
}

/**
 * 结构匹配监控仪表板
 */
export const StructuralMatchingMonitoringDashboard: React.FC<StructuralMatchingMonitoringDashboardProps> = ({
  refreshInterval = 30000, // 30秒
  autoRefresh = true,
  defaultTimeRange = 1, // 1小时
  showDetails = true,
  className,
  height = 600
}) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [currentReport, setCurrentReport] = useState<MonitoringReport | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(defaultTimeRange);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const monitoringService = StructuralMatchingMonitoringService.getInstance();
  const { emit } = useStructuralMatchingEvents({ 
    componentId: 'MonitoringDashboard',
    enableDebugLogs: false 
  });

  // 刷新数据
  const refreshData = useCallback(async () => {
    setLoading(true);
    
    try {
      const now = Date.now();
      const timeRange = {
        from: now - selectedTimeRange * 60 * 60 * 1000,
        to: now
      };
      
      // 获取系统健康状态
      const health = monitoringService.getSystemHealth();
      setSystemHealth(health);
      
      // 生成报告
      const report = monitoringService.generateReport(timeRange);
      setCurrentReport(report);
      
      // 获取活跃告警
      const activeAlerts = monitoringService.getActiveAlerts(timeRange);
      setAlerts(activeAlerts);
      
      setLastUpdated(new Date());
      
      // 发射监控事件
      emit('DATA_FETCHED', {
        data: { health, report, alerts: activeAlerts },
        source: 'monitoring_dashboard',
        cacheHit: false,
        fetchTime: Date.now() - now
      });
      
    } catch (error) {
      console.error('❌ [MonitoringDashboard] 数据刷新失败:', error);
      emit('ERROR_OCCURRED', {
        error: {
          code: 'DASHBOARD_REFRESH_FAILED',
          message: error instanceof Error ? error.message : '数据刷新失败',
          severity: 'medium'
        },
        context: {
          component: 'MonitoringDashboard',
          operation: 'refresh_data'
        }
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, monitoringService, emit]);

  // 自动刷新
  useEffect(() => {
    // 立即刷新一次
    refreshData();
    
    if (!autoRefresh) return;
    
    const timer = setInterval(refreshData, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshData, autoRefresh, refreshInterval]);

  // 获取健康状态颜色
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#52c41a';
      case 'degraded': return '#fa8c16';
      case 'critical': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  // 获取健康状态图标
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded': return <WarningOutlined style={{ color: '#fa8c16' }} />;
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 告警表格列定义
  const alertColumns = [
    {
      title: '严重性',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: string) => {
        const color = severity === 'critical' ? 'red' : severity === 'warning' ? 'orange' : 'blue';
        return <Tag color={color}>{severity.toUpperCase()}</Tag>;
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '组件',
      dataIndex: 'component',
      key: 'component',
      width: 120
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: number) => new Date(timestamp).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (record: MonitoringAlert) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => monitoringService.resolveAlert(record.id)}
        >
          解决
        </Button>
      )
    }
  ];

  if (!systemHealth || !currentReport) {
    return (
      <Card className={className} style={{ height }}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <ReloadOutlined spin style={{ fontSize: '24px', marginBottom: '16px' }} />
          <div>加载监控数据...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`structural-matching-monitoring-dashboard ${className || ''}`.trim()}>
      {/* 头部控制栏 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>系统监控仪表板</Title>
              <Badge 
                color={getHealthColor(systemHealth.overall)} 
                text={`系统状态: ${systemHealth.overall}`}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Select 
                value={selectedTimeRange} 
                onChange={setSelectedTimeRange}
                style={{ width: 120 }}
              >
                <Option value={0.25}>15分钟</Option>
                <Option value={1}>1小时</Option>
                <Option value={6}>6小时</Option>
                <Option value={24}>24小时</Option>
              </Select>
              <Tooltip title="刷新数据">
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={refreshData}
                  loading={loading}
                />
              </Tooltip>
              <Tooltip title="导出报告">
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const dataStr = JSON.stringify(currentReport, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                  }}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
        {lastUpdated && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            最后更新: {lastUpdated.toLocaleString()}
          </Text>
        )}
      </Card>

      {/* 系统概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="系统运行时间"
              value={Math.floor(systemHealth.metrics.uptime / 1000 / 60)}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={systemHealth.metrics.averageResponseTime}
              precision={2}
              suffix="ms"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ 
                color: systemHealth.metrics.averageResponseTime > 2000 ? '#ff4d4f' : '#3f8600' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="错误率"
              value={systemHealth.metrics.errorRate}
              precision={2}
              suffix="%"
              prefix={<BugOutlined />}
              valueStyle={{ 
                color: systemHealth.metrics.errorRate > 5 ? '#ff4d4f' : '#3f8600' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="吞吐量"
              value={systemHealth.metrics.throughput}
              precision={1}
              suffix="/min"
              prefix={<HeartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 组件健康状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="组件健康状态" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(systemHealth.components).map(([component, status]) => (
                <div key={component} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{component}</span>
                  <Space>
                    {getHealthIcon(status)}
                    <span style={{ color: getHealthColor(status) }}>{status}</span>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="资源使用情况" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {systemHealth.metrics.memoryUsage && (
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>内存使用: {systemHealth.metrics.memoryUsage.toFixed(1)} MB</span>
                  </div>
                  <Progress 
                    percent={Math.min((systemHealth.metrics.memoryUsage / 100) * 100, 100)} 
                    status={systemHealth.metrics.memoryUsage > 80 ? 'exception' : 'normal'}
                    size="small"
                  />
                </div>
              )}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span>缓存命中率: {(currentReport.resources.cacheHitRate * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  percent={currentReport.resources.cacheHitRate * 100} 
                  status="normal"
                  size="small"
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 性能指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={8}>
          <Card title="数据获取" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="请求数量"
                value={currentReport.performance.dataFetch.count}
                suffix="次"
              />
              <Statistic
                title="成功率"
                value={currentReport.performance.dataFetch.successRate * 100}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: currentReport.performance.dataFetch.successRate > 0.95 ? '#3f8600' : '#ff4d4f' 
                }}
              />
              <Statistic
                title="P95响应时间"
                value={currentReport.performance.dataFetch.p95Time}
                precision={0}
                suffix="ms"
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="数据验证" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="验证次数"
                value={currentReport.performance.validation.count}
                suffix="次"
              />
              <Statistic
                title="平均质量分"
                value={currentReport.performance.validation.averageQuality}
                precision={1}
                suffix="/100"
                valueStyle={{ 
                  color: currentReport.performance.validation.averageQuality > 80 ? '#3f8600' : '#fa8c16' 
                }}
              />
              <Statistic
                title="自动修复率"
                value={currentReport.performance.validation.autoRepairRate * 100}
                precision={1}
                suffix="%"
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="匹配算法" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="匹配次数"
                value={currentReport.performance.matching.count}
                suffix="次"
              />
              <Statistic
                title="平均准确率"
                value={currentReport.performance.matching.averageAccuracy * 100}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: currentReport.performance.matching.averageAccuracy > 0.9 ? '#3f8600' : '#fa8c16' 
                }}
              />
              <Statistic
                title="平均耗时"
                value={currentReport.performance.matching.averageTime}
                precision={0}
                suffix="ms"
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 告警信息 */}
      {alerts.length > 0 && (
        <Card title={`活跃告警 (${alerts.length})`} size="small" style={{ marginBottom: '16px' }}>
          <Table
            columns={alertColumns}
            dataSource={alerts}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      {/* 错误统计 */}
      {showDetails && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="错误统计" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>总错误数:</span>
                  <span>{currentReport.errors.totalCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>恢复成功率:</span>
                  <span style={{ 
                    color: currentReport.errors.recoveryRate > 0.8 ? '#3f8600' : '#ff4d4f' 
                  }}>
                    {(currentReport.errors.recoveryRate * 100).toFixed(1)}%
                  </span>
                </div>
                {Object.entries(currentReport.errors.byCategory).map(([category, count]) => (
                  <div key={category} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{category}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="系统摘要" size="small">
              <List
                size="small"
                dataSource={[
                  { label: '总请求数', value: currentReport.summary.totalRequests },
                  { label: '成功率', value: `${(currentReport.summary.successRate * 100).toFixed(1)}%` },
                  { label: '平均响应时间', value: `${currentReport.summary.averageResponseTime.toFixed(2)}ms` },
                  { label: '总错误数', value: currentReport.summary.totalErrors }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{item.label}:</span>
                      <span>{item.value}</span>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default StructuralMatchingMonitoringDashboard;