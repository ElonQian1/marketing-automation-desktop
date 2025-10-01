import React, { useState } from 'react';
import { Card, Typography, Space, Button, Badge, Tabs } from 'antd';
import { 
  SearchOutlined, 
  UserOutlined, 
  BarChartOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  BellOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAdb } from '../../application/hooks/useAdb';

// 导入子模块组件
import { IndustryMonitoringModule } from './modules/IndustryMonitoringModule';
// import { AccountMonitoringModule } from './modules/AccountMonitoringModule';
import { TaskManagementCenter } from './modules/TaskManagementCenter';
import { DailyReportModule } from './modules/DailyReportModule';
// import { MonitoringDashboard } from './modules/MonitoringDashboard';

const { Title, Text } = Typography;

/**
 * 精准获客主页面
 * 集成社交媒体监控和客户线索获取的综合平台
 * 
 * 功能模块：
 * 1. 行业监控 - 按关键词搜索和评论区分析
 * 2. 账号/视频监控 - 指定目标的持续监控
 * 3. 任务管理中心 - 关注和回复任务的统一管理
 * 4. 数据分析与日报 - 统计分析和报告生成
 */
export const PreciseAcquisitionPage: React.FC = () => {
  // 使用统一的ADB接口 - 遵循DDD架构约束
  const { 
    devices, 
    onlineDevices,
    refreshDevices,
    selectedDevice
  } = useAdb();

  // 菜单项配置 - 改用 Tabs 格式
  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <BarChartOutlined />
          监控总览
        </span>
      ),
      children: (
        <Card>
          <Typography.Title level={3}>📊 监控总览</Typography.Title>
          <Typography.Text type="secondary">精准获客系统整体数据概览和实时状态</Typography.Text>
          <div className="mt-8">
            <Typography.Text>
              🚧 开发模式：监控总览模块正在开发中...
            </Typography.Text>
          </div>
        </Card>
      )
    },
    {
      key: 'industry',
      label: (
        <span>
          <SearchOutlined />
          行业监控
        </span>
      ),
      children: <IndustryMonitoringModule 
        onlineDevices={onlineDevices}
        selectedDevice={selectedDevice}
        refreshDevices={refreshDevices}
      />
    },
    {
      key: 'account',
      label: (
        <span>
          <UserOutlined />
          账号监控
        </span>
      ),
      children: (
        <Card>
          <Typography.Title level={3}>👤 账号监控</Typography.Title>
          <Typography.Text type="secondary">监控指定账号或视频的评论区，获取潜在客户线索</Typography.Text>
          <div className="mt-8">
            <Typography.Text>
              🚧 开发模式：账号监控模块正在开发中...
            </Typography.Text>
          </div>
        </Card>
      )
    },
    {
      key: 'tasks',
      label: (
        <span>
          <ThunderboltOutlined />
          任务中心
        </span>
      ),
      children: <TaskManagementCenter 
        onlineDevices={onlineDevices}
        selectedDevice={selectedDevice}
        refreshDevices={refreshDevices}
      />
    },
    {
      key: 'reports',
      label: (
        <span>
          <FileTextOutlined />
          数据报告
        </span>
      ),
      children: <DailyReportModule 
        onlineDevices={onlineDevices}
        selectedDevice={selectedDevice}
        refreshDevices={refreshDevices}
      />
    },
    {
      key: 'settings',
      label: (
        <span>
          <SettingOutlined />
          系统设置
        </span>
      ),
      children: (
        <Card>
          <Typography.Title level={3}>系统设置</Typography.Title>
          <Typography.Text type="secondary">监控参数配置和通知设置（开发中...）</Typography.Text>
        </Card>
      )
    }
  ];

  // 设备状态检查 - 开发模式下不阻止页面显示
  const showDeviceWarning = onlineDevices.length === 0;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="space-y-6">
      {/* 页面标题和状态 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <div>
              <Title level={2} className="m-0">精准获客系统</Title>
              <Text type="secondary">智能社交媒体监控和客户线索获取平台</Text>
            </div>
          </div>
          
          {/* 设备状态指示 */}
          <div className={`px-4 py-2 rounded-lg ${showDeviceWarning ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            {showDeviceWarning ? (
              <div className="flex items-center space-x-2">
                <Badge status="warning" />
                <Text type="warning" className="text-sm">
                  暂无设备连接
                </Text>
                {!isDevelopment && (
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={refreshDevices}
                    className="p-0 h-auto text-xs"
                  >
                    刷新设备
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Badge status="success" />
                <Text type="success" className="text-sm">
                  已连接 {onlineDevices.length} 台设备
                </Text>
              </div>
            )}
          </div>
        </div>
        
        {/* 开发模式提示 */}
        {isDevelopment && showDeviceWarning && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Text className="text-sm text-blue-700">
              🚧 开发模式：无设备连接时功能仍可正常使用和测试
            </Text>
          </div>
        )}
      </Card>

      {/* 设备状态警告横幅 - 仅在生产环境且无设备时显示 */}
      {showDeviceWarning && !isDevelopment && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellOutlined style={{ fontSize: '20px', color: '#faad14' }} />
              <div>
                <Text strong>设备未连接</Text>
                <div className="text-sm text-gray-600 mt-1">
                  部分功能需要连接设备才能使用。请先到设备管理页面连接设备。
                </div>
              </div>
            </div>
            <Button type="primary" onClick={refreshDevices}>
              刷新设备
            </Button>
          </div>
        </Card>
      )}
      
      {/* 功能模块选项卡 */}
      <Card>
        <Tabs 
          defaultActiveKey="dashboard"
          items={tabItems}
          type="card"
          className="w-full"
        />
      </Card>
    </div>
  );
};

