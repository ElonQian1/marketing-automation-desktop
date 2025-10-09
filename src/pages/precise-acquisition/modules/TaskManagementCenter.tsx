/**
 * 任务管理中心模块
 * 
 * 集成新的任务管理系统，提供统一的任务操作界面
 */

import React from 'react';
import { Card, Typography, Alert } from 'antd';
import { TaskManagementCenter as TaskManagementComponent } from '../../../components/TaskManagementCenter';
import type { Device } from '../../../domain/adb/entities/Device';
import { shouldBypassDeviceCheck } from '../../../config/developmentMode';

const { Title, Text } = Typography;

interface TaskManagementCenterProps {
  onlineDevices: Device[];
  selectedDevice?: Device | null;
  refreshDevices: () => void;
}

/**
 * 任务管理中心
 * 统一管理关注和回复任务，支持任务生成、状态管理、执行监控等功能
 */
export const TaskManagementCenter: React.FC<TaskManagementCenterProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  // 开发模式检测
  const isDevelopmentBypass = shouldBypassDeviceCheck();
  const hasDevices = onlineDevices.length > 0;

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <Title level={3} className="mb-2">任务管理中心</Title>
        <Text type="secondary">
          统一管理关注和回复任务的生成、分配、执行与跟踪
        </Text>
      </div>

      {/* 设备状态提示 */}
      {!hasDevices && !isDevelopmentBypass && (
        <Alert
          message="设备未连接"
          description="任务执行需要连接设备。请先到设备管理页面连接设备。"
          type="warning"
          showIcon
          action={
            <span 
              className="cursor-pointer text-blue-600 hover:text-blue-800"
              onClick={refreshDevices}
            >
              刷新设备
            </span>
          }
        />
      )}

      {/* 开发模式提示 */}
      {isDevelopmentBypass && !hasDevices && (
        <Alert
          message="开发模式"
          description="当前处于开发模式，无设备连接时功能仍可正常使用和测试。"
          type="info"
          showIcon
        />
      )}

      {/* 任务管理主组件 */}
      <Card className="light-theme-force" style={{ background: 'var(--bg-light-base, #ffffff)' }}>
        <TaskManagementComponent />
      </Card>
    </div>
  );
};