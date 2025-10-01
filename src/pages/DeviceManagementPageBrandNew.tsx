// 文件路径：src/pages/DeviceManagementPageBrandNew.tsx

/**
 * 设备管理页面 - 品牌化重构版本
 * 
 * 基于统一架构 (Layout + Patterns + UI + Adapters) 重构的设备管理页面
 * - 使用 PageShell 提供统一布局
 * - 采用品牌化 UI 组件
 * - 集成统一状态管理 (useAdb Hook)
 * - 遵循单文件模块化原则
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MobileOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

// Layout 适配器 - Employee D 合规
import { Row, Col, Space, Divider } from '../components/adapters/layout/LayoutAdapter';

// UI 轻组件 - 品牌化组件库
import { Button, CardShell, TagPill, AlertCard, LoadingSpinner } from '../components/ui';
import { Text, Title } from '../components/ui/typography/TypographyAdapter';

// Layout 组件
import { PageShell } from '../components/layout/PageShell';

// 统一 ADB 接口
import { useAdb } from '../application/hooks/useAdb';

/**
 * 设备状态映射
 */
const getDeviceStatusDisplay = (status: string) => {
  const statusMap = {
    'device': { color: 'green', text: '已连接', icon: CheckCircleOutlined },
    'offline': { color: 'red', text: '离线', icon: ExclamationCircleOutlined },
    'unauthorized': { color: 'orange', text: '未授权', icon: ExclamationCircleOutlined }
  };
  
  return statusMap[status as keyof typeof statusMap] || statusMap.offline;
};

/**
 * 设备卡片组件
 */
interface DeviceCardProps {
  device: any;
  isSelected: boolean;
  onSelect: () => void;
  onRefresh: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ 
  device, 
  isSelected, 
  onSelect, 
  onRefresh 
}) => {
  const statusInfo = getDeviceStatusDisplay(device.status);
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <CardShell
        variant={isSelected ? "default" : "flat"}
        onClick={onSelect}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MobileOutlined className="text-xl text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">
                {device.model || device.id}
              </div>
              <Text type="secondary" className="text-sm">
                ID: {device.id}
              </Text>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TagPill
              variant={statusInfo.color as any}
              icon={<StatusIcon />}
            >
              {statusInfo.text}
            </TagPill>
            
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ReloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
            />
          </div>
        </div>
        
        {device.properties && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <Text type="secondary">Android:</Text>
                <Text className="ml-1">{device.properties.android_version || 'Unknown'}</Text>
              </div>
              <div>
                <Text type="secondary">API:</Text>
                <Text className="ml-1">{device.properties.api_level || 'Unknown'}</Text>
              </div>
            </div>
          </div>
        )}
      </CardShell>
    </motion.div>
  );
};

/**
 * 设备管理页面主组件
 */
const DeviceManagementPageBrandNew: React.FC = () => {
  const { 
    devices, 
    selectedDevice, 
    selectDevice, 
    refreshDevices, 
    isLoading 
  } = useAdb();
  
  const [refreshing, setRefreshing] = useState(false);

  // 页面加载时刷新设备列表
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // 处理设备刷新
  const handleRefreshDevices = async () => {
    setRefreshing(true);
    try {
      await refreshDevices();
    } finally {
      setRefreshing(false);
    }
  };

  // 页面动效配置
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <PageShell
      title="设备管理"
    >
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-1">
                ADB 设备管理
              </Title>
              <Text type="secondary">
                管理和监控连接的 Android 设备，确保 ADB 连接稳定
              </Text>
            </div>
            
            <Space>
              <Button
                leftIcon={<ReloadOutlined />}
                onClick={handleRefreshDevices}
                loading={refreshing}
              >
                刷新设备
              </Button>
              
              <Button
                variant="solid"
                leftIcon={<SettingOutlined />}
              >
                ADB 设置
              </Button>
            </Space>
          </div>
        </div>

        <Divider />

        {/* 设备状态统计 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={8}>
            <CardShell variant="flat">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {devices.length}
                </div>
                <Text type="secondary">总设备数</Text>
              </div>
            </CardShell>
          </Col>
          
          <Col span={8}>
            <CardShell variant="flat">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {devices.filter((d: any) => d.status === 'device').length}
                </div>
                <Text type="secondary">在线设备</Text>
              </div>
            </CardShell>
          </Col>
          
          <Col span={8}>
            <CardShell variant="flat">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {selectedDevice ? 1 : 0}
                </div>
                <Text type="secondary">已选择</Text>
              </div>
            </CardShell>
          </Col>
        </Row>

        {/* 设备列表 */}
        <CardShell>
          <div className="mb-4">
            <Title level={4}>设备列表</Title>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          ) : devices.length === 0 ? (
            <AlertCard
              type="info"
              message="未检测到设备"
              description="请确保设备已连接并开启 USB 调试模式"
              showIcon
            />
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isSelected={selectedDevice?.id === device.id}
                  onSelect={() => selectDevice(device.id)}
                  onRefresh={() => refreshDevices()}
                />
              ))}
            </div>
          )}
        </CardShell>
        
        {/* 选中设备详情 */}
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6"
          >
            <CardShell>
              <Title level={4} className="mb-4">
                设备详情
              </Title>
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Text type="secondary">设备 ID:</Text>
                      <Text copyable>{selectedDevice.id}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">状态:</Text>
                      <TagPill variant={getDeviceStatusDisplay(selectedDevice.status).color as any}>
                        {getDeviceStatusDisplay(selectedDevice.status).text}
                      </TagPill>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">型号:</Text>
                      <Text>{selectedDevice.model || 'Unknown'}</Text>
                    </div>
                  </div>
                </Col>
                
                <Col span={12}>
                  {selectedDevice.properties && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Text type="secondary">Android 版本:</Text>
                        <Text>{selectedDevice.properties.android_version || 'Unknown'}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text type="secondary">API 级别:</Text>
                        <Text>{selectedDevice.properties.api_level || 'Unknown'}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text type="secondary">制造商:</Text>
                        <Text>{selectedDevice.properties.manufacturer || 'Unknown'}</Text>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            </CardShell>
          </motion.div>
        )}
      </motion.div>
    </PageShell>
  );
};

export default DeviceManagementPageBrandNew;