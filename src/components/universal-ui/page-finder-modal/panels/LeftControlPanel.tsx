// src/components/universal-ui/page-finder-modal/panels/LeftControlPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Button, Card, Col, Divider, Row, Space, Spin, Typography } from 'antd';
import { DeviceSelector, AnalysisPanel } from "..";
import type { ViewMode } from "../types";
import { CacheHistoryPanel } from "../../views/cache-view";

const { Text } = Typography;

export interface LeftControlPanelProps {
  // 设备区
  devices: any[];
  selectedDevice: any;
  onDeviceSelect: (d: any) => void;
  onRefreshDevices: () => Promise<void> | void;
  onCaptureCurrentPage: () => Promise<void> | void;
  loading: boolean;

  // 视图选择 (现在已移到右上角浮动控制器，这些 props 保留用于传递)
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  elementCount: number;

  // 过滤设置
  onOpenFilterSettings: () => void;
  onResetFilters: () => void;

  // 分析面板
  elements: any[];
  xmlContent: string;
  deviceInfo: any;
  onRefresh: () => Promise<void> | void;
  onExport: () => void;

  // 缓存历史
  onCachedPageSelected: (page: any) => void;
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  onRefreshDevices,
  onCaptureCurrentPage,
  loading,
  viewMode,
  onViewModeChange,
  elementCount,
  onOpenFilterSettings,
  onResetFilters,
  elements,
  xmlContent,
  deviceInfo,
  onRefresh,
  onExport,
  onCachedPageSelected,
}) => {
  const wrapAsync = (fn: () => void | Promise<void>) => async () => {
    await Promise.resolve(fn());
  };

  return (
    <Space direction="vertical" size="middle">
      {/* 设备选择器 */}
      <DeviceSelector
        devices={devices}
        selectedDevice={selectedDevice}
        onDeviceSelect={onDeviceSelect}
        onRefreshDevices={wrapAsync(onRefreshDevices)}
        onCaptureCurrentPage={wrapAsync(onCaptureCurrentPage)}
        loading={loading}
      />

      {/* 视图模式选择器已移至右上角浮动位置 - 见 MainViewContainer */}

      {/* 过滤设置 */}
      <Space>
        <Button onClick={onOpenFilterSettings}>过滤设置</Button>
        <Button onClick={onResetFilters}>重置规则</Button>
      </Space>

      {/* 分析面板 */}
      <AnalysisPanel
        elements={elements}
        loading={loading}
        xmlContent={xmlContent}
        deviceInfo={deviceInfo}
        onRefresh={onRefresh}
        onExport={onExport}
      />

      {/* 缓存历史面板 */}
      <CacheHistoryPanel onPageSelected={onCachedPageSelected} />
    </Space>
  );
};

export default LeftControlPanel;
