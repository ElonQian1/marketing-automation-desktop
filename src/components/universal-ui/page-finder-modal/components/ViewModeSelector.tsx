/**
 * 视图模式切换组件 - 原生 Ant Design 风格
 * 从 UniversalPageFinderModal.tsx 中提取的视图切换逻辑
 */

import React from "react";
import { 
  Card, 
  Radio, 
  Space, 
  Typography, 
  Badge,
  theme 
} from "antd";
import {
  EyeOutlined,
  BranchesOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  MobileOutlined
} from "@ant-design/icons";
import type { ViewMode } from "../types";

const { Text } = Typography;

export interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  elementCount?: number;
  loading?: boolean;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  onViewModeChange,
  elementCount = 0,
  loading = false
}) => {
  const { token } = theme.useToken();

  const viewModeOptions = [
    {
      label: "可视化分析",
      value: "visual" as ViewMode,
      icon: <EyeOutlined />,
      description: "直观的页面可视化分析"
    },
    {
      label: "树形结构",
      value: "tree" as ViewMode,
      icon: <BranchesOutlined />,
      description: "分层展示UI元素结构"
    },
    {
      label: "列表视图",
      value: "list" as ViewMode,
      icon: <UnorderedListOutlined />,
      description: "详细的元素属性列表"
    },
    {
      label: "网格检查器",
      value: "grid" as ViewMode,
      icon: <AppstoreOutlined />,
      description: "表格形式查看元素信息"
    },
    {
      label: "镜像视图",
      value: "mirror" as ViewMode,
      icon: <MobileOutlined />,
      description: "实时设备屏幕镜像"
    }
  ];

  const currentOption = viewModeOptions.find(option => option.value === viewMode);

  return (
    <Card
      title={
        <Space>
          {currentOption?.icon}
          <span>视图模式</span>
          {elementCount > 0 && (
            <Badge 
              count={elementCount} 
              style={{ backgroundColor: token.colorPrimary }}
              title={`共${elementCount}个元素`}
            />
          )}
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 视图模式选择 */}
        <Radio.Group
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value)}
          style={{ width: "100%" }}
          disabled={loading}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {viewModeOptions.map((option) => (
              <Radio 
                key={option.value} 
                value={option.value}
                style={{ 
                  display: "flex", 
                  alignItems: "flex-start",
                  padding: `${token.paddingXS}px 0`,
                  width: "100%"
                }}
              >
                <Space>
                  {option.icon}
                  <div>
                    <Text strong style={{ fontSize: token.fontSizeSM }}>
                      {option.label}
                    </Text>
                    <br />
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: token.fontSizeSM,
                        lineHeight: 1.2 
                      }}
                    >
                      {option.description}
                    </Text>
                  </div>
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {/* 当前模式信息 */}
        {currentOption && (
          <div 
            style={{ 
              padding: token.paddingXS,
              backgroundColor: token.colorBgLayout,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorder}`,
              marginTop: token.marginXS
            }}
          >
            <Space>
              {currentOption.icon}
              <div>
                <Text strong style={{ fontSize: token.fontSizeSM }}>
                  当前模式: {currentOption.label}
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ fontSize: token.fontSizeSM }}
                >
                  {currentOption.description}
                </Text>
              </div>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};