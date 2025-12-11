// src/pages/device-management/components/DevicePageHeader.tsx
// module: ui | layer: ui | role: component
// summary: 设备管理页面头部组件，包含设备选择和 Agent 安装功能

import React, { useState } from 'react';
import { Row, Col, Typography, Space, Button, theme, message, Tooltip, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
  AndroidOutlined,
  DownOutlined
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';

const { Title, Text } = Typography;

interface DeviceInfo {
  serial: string;
  model?: string;
}

interface DevicePageHeaderProps {
  refreshDevices: () => void;
  isLoading: boolean;
  /** 在线设备列表，用于选择安装目标 */
  onlineDevices?: DeviceInfo[];
}

/**
 * 设备管理页面头部组件
 * 使用原生 Ant Design 组件的商业化页面标题
 */
export const DevicePageHeader: React.FC<DevicePageHeaderProps> = ({
  refreshDevices,
  isLoading,
  onlineDevices = []
}) => {
  const { token } = theme.useToken();
  const [installingAgent, setInstallingAgent] = useState(false);

  // 安装 Agent APK 到指定设备
  const handleInstallAgent = async (deviceSerial: string) => {
    setInstallingAgent(true);
    try {
      // 先获取内置 APK 路径
      const apkPath = await invoke<string>('plugin:adb|get_bundled_agent_apk');
      // 然后安装到设备 (Tauri 自动将 snake_case 转为 camelCase)
      const result = await invoke<string>('plugin:adb|adb_install_apk', { 
        deviceId: deviceSerial, 
        apkPath: apkPath 
      });
      message.success(`Agent 已成功安装到设备 ${deviceSerial}！`);
      console.log('安装结果:', result);
    } catch (error) {
      console.error('安装 Agent 失败:', error);
      message.error(`安装失败: ${error}`);
    } finally {
      setInstallingAgent(false);
    }
  };

  // 构建设备选择菜单
  const deviceMenuItems: MenuProps['items'] = onlineDevices.map((device) => ({
    key: device.serial,
    label: device.model ? `${device.model} (${device.serial})` : device.serial,
    onClick: () => handleInstallAgent(device.serial),
  }));

  // 渲染安装按钮
  const renderInstallButton = () => {
    if (onlineDevices.length === 0) {
      // 没有在线设备
      return (
        <Tooltip title="请先连接设备">
          <Button
            type="default"
            icon={<AndroidOutlined />}
            disabled
            size="middle"
          >
            安装 Agent
          </Button>
        </Tooltip>
      );
    }

    if (onlineDevices.length === 1) {
      // 只有一个设备，直接安装
      const device = onlineDevices[0];
      return (
        <Tooltip title={`安装到 ${device.model || device.serial}`}>
          <Button
            type="default"
            icon={<AndroidOutlined />}
            onClick={() => handleInstallAgent(device.serial)}
            loading={installingAgent}
            size="middle"
          >
            安装 Agent
          </Button>
        </Tooltip>
      );
    }

    // 多个设备，显示下拉菜单
    return (
      <Dropdown menu={{ items: deviceMenuItems }} placement="bottomRight">
        <Button
          type="default"
          icon={<AndroidOutlined />}
          loading={installingAgent}
          size="middle"
        >
          安装 Agent <DownOutlined />
        </Button>
      </Dropdown>
    );
  };

  return (
    <Row justify="space-between" align="middle">
      <Col>
        <Space 
          direction="vertical" 
          size={token.sizeXS}
        >
          <Space align="center">
            <MobileOutlined 
              style={{ 
                fontSize: token.fontSizeHeading2,
                color: token.colorPrimary 
              }} 
            />
            <Title 
              level={2} 
              style={{ 
                margin: 0,
                color: token.colorText,
                fontWeight: token.fontWeightStrong
              }}
            >
              设备管理中心
            </Title>
          </Space>
          <Text 
            type="secondary"
            style={{ fontSize: token.fontSize }}
          >
            统一管理最多 10 台设备的连接状态，确保任务高效执行
          </Text>
        </Space>
      </Col>
      <Col>
        <Space size={token.sizeMS}>
          {renderInstallButton()}
          <Button 
            type="default"
            icon={<ReloadOutlined />}
            onClick={refreshDevices}
            loading={isLoading}
            size="middle"
          >
            刷新设备
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => console.log('添加设备')}
            size="middle"
          >
            添加设备
          </Button>
        </Space>
      </Col>
    </Row>
  );
};