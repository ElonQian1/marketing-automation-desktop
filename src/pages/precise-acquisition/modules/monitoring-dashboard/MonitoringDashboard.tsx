// src/pages/precise-acquisition/modules/monitoring-dashboard/MonitoringDashboard.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 监控总览仪表板 - 重构版本
 * 
 * 模块化组织：
 * - 分离子组件到 components/
 * - 提取业务逻辑到 hooks/
 * - 清晰的职责分离
 */
import React from 'react';
import { Card, Typography, Space, Button, Alert } from 'antd';
import { 
  BarChartOutlined, 
  ReloadOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { DeviceStatusCard, SystemMetrics } from './components';
import { useMonitoringData } from './hooks';

const { Title, Text } = Typography;

interface MonitoringDashboardProps {
  onlineDevices: any[];
  selectedDevice: any;
  refreshDevices: () => void;
}

/**
 * 监控总览仪表板
 * 显示精准获客系统的总体数据和状态
 */
export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  const { 
    metrics, 
    loading, 
    error, 
    lastUpdate, 
    refreshMetrics 
  } = useMonitoringData({ 
    autoRefresh: true, 
    refreshInterval: 30000 
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3}>
            <BarChartOutlined className="mr-2" />
            监控总览
          </Title>
          <Text type="secondary">
            精准获客系统整体数据概览和实时状态
          </Text>
        </div>
        
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshMetrics}
            loading={loading}
          >
            刷新数据
          </Button>
          <div className="flex items-center space-x-1 text-gray-500">
            <ClockCircleOutlined />
            <Text type="secondary" className="text-sm">
              更新于: {lastUpdate}
            </Text>
          </div>
        </Space>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="数据加载失败"
          description={error.message}
          type="error"
          showIcon
          closable
        />
      )}

      {/* 系统核心指标 */}
      <SystemMetrics metrics={metrics} loading={loading} />

      {/* 设备状态和系统状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 设备状态 */}
        <DeviceStatusCard
          onlineDevices={onlineDevices}
          selectedDevice={selectedDevice}
          refreshDevices={refreshDevices}
        />

        {/* 活跃监控器 */}
        <Card>
          <Space direction="vertical" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong>活跃监控器</Text>
              <Text className="text-lg font-bold text-blue-600">8</Text>
            </div>
            <div className="space-y-1">
              <Text type="secondary" className="text-sm">行业监控: 3个</Text>
              <Text type="secondary" className="text-sm">账号监控: 5个</Text>
            </div>
          </Space>
        </Card>

        {/* 系统健康度 */}
        <Card>
          <Space direction="vertical" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong>系统健康度</Text>
              <Text className="text-lg font-bold text-green-600">优秀</Text>
            </div>
            <div className="space-y-1">
              <Text type="secondary" className="text-sm">设备连接: 正常</Text>
              <Text type="secondary" className="text-sm">服务状态: 运行中</Text>
            </div>
          </Space>
        </Card>
      </div>

      {/* 快速操作面板 */}
      <Card title="快速操作" className="light-theme-force">
        <Space wrap>
          <Button type="primary">
            查看任务队列
          </Button>
          <Button>
            导出今日报告
          </Button>
          <Button>
            系统设置
          </Button>
          <Button>
            安全检查
          </Button>
        </Space>
      </Card>
    </div>
  );
};