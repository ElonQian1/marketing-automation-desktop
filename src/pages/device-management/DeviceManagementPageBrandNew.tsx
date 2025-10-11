// src/pages/device-management/DeviceManagementPageBrandNew.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

// src/pages/device-management/DeviceManagementPageBrandNew.tsx
// 设备管理页面 - 全新品牌化版本
// 使用 layout + patterns + ui + adapters 组合架构，遵循品牌设计系统

import React from 'react';
import { Row, Col } from 'antd';
import { 
  MobileOutlined, 
  PlusOutlined, 
  ReloadOutlined,
  BulbOutlined,
  WarningOutlined 
} from '@ant-design/icons';

// Layout Layer - 页面布局组件
import { PageShell } from '../../components/layout/PageShell';

// UI Layer - 品牌化轻组件  
import { Button } from '../../components/ui/Button';
import { CardShell } from '../../components/ui/CardShell';
import { TagPill } from '../../components/ui/TagPill';

// Business Layer - 业务逻辑钩子
import { useAdb } from '../../application/hooks/useAdb';

/**
 * 设备管理页面 - 品牌化重构版本
 * 
 * 架构原则：
 * - Layout: PageShell 提供标准页面容器
 * - UI: 品牌化轻组件 (Button, CardShell, TagPill)  
 * - 无样式覆盖或硬编码
 * - 使用 Design Tokens 驱动视觉
 * - 统一 Motion 动效
 */
export const DeviceManagementPageBrandNew: React.FC = () => {
  const { devices, isLoading, refreshDevices } = useAdb();

  // 计算设备统计数据
  const stats = React.useMemo(() => {
    const connectedCount = devices.filter(d => d.isOnline()).length;
    const totalCount = devices.length;
    const offlineCount = totalCount - connectedCount;
    
    return {
      total: totalCount,
      connected: connectedCount,
      offline: offlineCount,
      connectionRate: totalCount > 0 ? Math.round((connectedCount / totalCount) * 100) : 0
    };
  }, [devices]);

  // 页面操作处理函数
  const handleRefresh = React.useCallback(async () => {
    await refreshDevices();
  }, [refreshDevices]);

  const handleAddDevice = React.useCallback(() => {
    console.log('添加设备 - 将打开设备配置对话框');
  }, []);

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* 页面标题区域 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileOutlined className="text-2xl text-blue-500" />
            <div>
              <h1 className="text-2xl font-semibold text-white">设备管理</h1>
              <p className="text-sm text-gray-400">管理最多10台设备的连接状态，确保任务正常执行</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              leftIcon={<PlusOutlined />}
              onClick={handleAddDevice}
            >
              添加设备
            </Button>
            <Button
              variant="secondary"
              leftIcon={<ReloadOutlined />}
              loading={isLoading}
              onClick={handleRefresh}
            >
              刷新列表
            </Button>
          </div>
        </div>

        {/* 统计卡片区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <CardShell variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-blue-500 mb-1">{stats.total}</div>
              <div className="text-sm text-gray-400">总设备数</div>
            </CardShell>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <CardShell variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-green-500 mb-1">{stats.connected}</div>
              <div className="text-sm text-gray-400">在线设备</div>
            </CardShell>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <CardShell variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-orange-500 mb-1">{stats.offline}</div>
              <div className="text-sm text-gray-400">离线设备</div>
            </CardShell>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <CardShell variant="elevated" className="text-center p-4">
              <div className={`text-2xl font-bold mb-1 ${
                stats.connectionRate >= 80 ? 'text-green-500' : 
                stats.connectionRate >= 50 ? 'text-orange-500' : 'text-red-500'
              }`}>
                {stats.connectionRate}%
              </div>
              <div className="text-sm text-gray-400">连接率</div>
            </CardShell>
          </Col>
        </Row>

        {/* 筛选标签栏 */}
        <div className="flex items-center gap-2">
          <TagPill 
            color={stats.connected > 0 ? "green" : "gray"}
            size="sm"
          >
            {stats.connected} 在线
          </TagPill>
          {stats.offline > 0 && (
            <TagPill color="orange" size="sm">
              {stats.offline} 离线
            </TagPill>
          )}
          <TagPill color="blue" size="sm">
            总计 {stats.total}
          </TagPill>
        </div>

        {/* 设备列表区域 */}
        <CardShell variant="elevated" className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MobileOutlined />
                设备列表
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <BulbOutlined className="text-green-500" />
                <span>{stats.connected} 台在线</span>
                <span className="mx-2">|</span>
                <WarningOutlined className="text-orange-500" />
                <span>{stats.offline} 台离线</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${device.isOnline() ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <div>
                        <div className="font-medium text-white">{device.name || device.id}</div>
                        <div className="text-sm text-gray-400">{device.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TagPill 
                        color={device.isOnline() ? "green" : "gray"}
                        size="sm"
                      >
                        {device.isOnline() ? "在线" : "离线"}
                      </TagPill>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {isLoading ? '正在扫描设备...' : '暂无设备连接'}
                </div>
              )}
            </div>
          </div>
        </CardShell>

        {/* 空状态提示 */}
        {devices.length === 0 && !isLoading && (
          <CardShell variant="ghost" className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl opacity-20 text-gray-500">
                <MobileOutlined />
              </div>
              <h3 className="text-lg font-medium text-gray-300">
                暂无设备
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                点击"添加设备"开始配置您的第一台设备。<br />
                支持 Android 设备通过 USB 或 Wi-Fi 连接。
              </p>
              <Button
                variant="primary"
                leftIcon={<PlusOutlined />}
                onClick={handleAddDevice}
                className="mt-4"
              >
                添加第一台设备
              </Button>
            </div>
          </CardShell>
        )}
      </div>
    </PageShell>
  );
};

export default DeviceManagementPageBrandNew;