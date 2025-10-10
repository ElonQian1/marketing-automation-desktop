/**
 * 任务管理模块 - 重构版本
 *
 * 整合了原本分散的任务管理功能：
 * - TaskManagementCenter (主入口)
 * - TaskExecutionCenter (执行中心)
 * - FollowTaskExecutor (关注执行器)
 * - SemiAutoExecutionDrawer (半自动执行)
 */
import React, { useState } from "react";
import { Card, Typography, Tabs, Alert, Space, Button } from "antd";
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  UserAddOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { Device } from "../../../../domain/adb/entities/Device";
import { shouldBypassDeviceCheck } from "../../../../config/developmentMode";

// 导入重构后的子组件
import { TaskExecutionCenter } from "./components/TaskExecutionCenter";
import { FollowTaskExecutor } from "../follow-executor/FollowTaskExecutor";

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
  refreshDevices,
}) => {
  const [activeTab, setActiveTab] = useState("execution");

  // 开发模式检测
  const bypass = shouldBypassDeviceCheck();
  const hasDevices = onlineDevices.length > 0;
  const showDeviceWarning = !bypass && !hasDevices;

  const tabItems = [
    {
      key: "execution",
      label: (
        <span>
          <PlayCircleOutlined />
          任务执行
        </span>
      ),
      children: (
        <TaskExecutionCenter
          onlineDevices={onlineDevices}
          onRefresh={refreshDevices}
        />
      ),
    },
    {
      key: "follow",
      label: (
        <span>
          <UserAddOutlined />
          关注任务
        </span>
      ),
      children: (
        <FollowTaskExecutor
          onlineDevices={onlineDevices}
          followTargets={[]}
          onFollowComplete={(targetId, success) => {
            console.log("关注完成:", targetId, success);
          }}
        />
      ),
    },
    {
      key: "reply",
      label: (
        <span>
          <MessageOutlined />
          回复任务
        </span>
      ),
      children: (
        <div className="p-8 text-center text-gray-500">
          回复任务执行器开发中...
        </div>
      ),
    },
    {
      key: "settings",
      label: (
        <span>
          <SettingOutlined />
          任务配置
        </span>
      ),
      children: (
        <div className="p-8 text-center text-gray-500">
          任务配置面板开发中...
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <Title level={3}>
          <ThunderboltOutlined className="mr-2" />
          任务管理中心
        </Title>
        <Text type="secondary">
          统一管理所有自动化任务的生成、分配、执行和监控
        </Text>
      </div>

      {/* 设备检查警告 */}
      {showDeviceWarning && (
        <Alert
          message="设备未连接"
          description={
            <div>
              当前没有在线设备，任务执行功能将受限。
              <Space className="ml-2">
                <Button size="small" onClick={refreshDevices}>
                  刷新设备
                </Button>
              </Space>
            </div>
          }
          type="warning"
          showIcon
          closable
        />
      )}

      {/* 任务管理标签页 */}
      <Card
        className="light-theme-force"
        style={{ background: "var(--bg-light-base, #ffffff)" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="large"
        />
      </Card>
    </div>
  );
};
