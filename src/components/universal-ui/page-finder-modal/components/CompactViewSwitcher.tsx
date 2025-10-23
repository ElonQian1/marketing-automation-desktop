// src/components/universal-ui/page-finder-modal/components/CompactViewSwitcher.tsx
// module: ui | layer: ui | role: component
// summary: 紧凑型视图切换器 - 浮动在右上角

/**
 * 紧凑型视图切换器组件
 * 
 * 设计原则：
 * - 使用 Segmented Button 风格，紧凑高效
 * - 浮动在内容区右上角，不占用布局空间
 * - 图标 + Tooltip 组合，信息充分但不冗余
 * - 支持元素计数 Badge
 */

import React from "react";
import { Segmented, Tooltip, Badge, Space, theme } from "antd";
import {
  EyeOutlined,
  BranchesOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  MobileOutlined
} from "@ant-design/icons";
import type { ViewMode } from "../types";

const { useToken } = theme;

export interface CompactViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  elementCount?: number;
  loading?: boolean;
  style?: React.CSSProperties;
}

export const CompactViewSwitcher: React.FC<CompactViewSwitcherProps> = ({
  viewMode,
  onViewModeChange,
  elementCount = 0,
  loading = false,
  style
}) => {
  const { token } = useToken();

  const viewModeOptions = [
    {
      label: "可视化",
      value: "visual" as ViewMode,
      icon: <EyeOutlined />,
      tooltip: "可视化分析 - 直观的页面可视化分析"
    },
    {
      label: "树形",
      value: "tree" as ViewMode,
      icon: <BranchesOutlined />,
      tooltip: "树形结构 - 分层展示UI元素结构"
    },
    {
      label: "列表",
      value: "list" as ViewMode,
      icon: <UnorderedListOutlined />,
      tooltip: "列表视图 - 详细的元素属性列表"
    },
    {
      label: "网格",
      value: "grid" as ViewMode,
      icon: <AppstoreOutlined />,
      tooltip: "网格检查器 - 表格形式查看元素信息"
    },
    {
      label: "镜像",
      value: "mirror" as ViewMode,
      icon: <MobileOutlined />,
      tooltip: "镜像视图 - 实时设备屏幕镜像"
    }
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: token.marginSM,
        right: token.marginSM,
        zIndex: 10,
        backgroundColor: token.colorBgContainer,
        padding: token.paddingXS,
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadow,
        display: "flex",
        alignItems: "center",
        gap: token.marginXS,
        ...style
      }}
    >
      {/* 元素计数 Badge */}
      {elementCount > 0 && (
        <Badge 
          count={elementCount} 
          style={{ 
            backgroundColor: token.colorPrimary,
            fontSize: token.fontSizeSM
          }}
          title={`共${elementCount}个元素`}
        />
      )}

      {/* 分段控制器 */}
      <Segmented
        value={viewMode}
        onChange={(value) => onViewModeChange(value as ViewMode)}
        disabled={loading}
        options={viewModeOptions.map(option => ({
          value: option.value,
          label: (
            <Tooltip title={option.tooltip} placement="bottom">
              <Space size={4}>
                {option.icon}
                <span style={{ fontSize: token.fontSizeSM }}>
                  {option.label}
                </span>
              </Space>
            </Tooltip>
          )
        }))}
        size="small"
      />
    </div>
  );
};
