/**
 * 主题预设选择器组件
 */

import React, { useState } from "react";
import {
  Card,
  Space,
  Button,
  Select,
  Typography,
  Row,
  Col,
  Tag,
  Tooltip,
  Badge,
  Avatar,
  Alert,
} from "antd";
import {
  BgColorsOutlined,
  SaveOutlined,
  CheckOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useThemeManager } from "../../theme-system";

const { Title, Text } = Typography;
const { Option } = Select;

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  favorite?: boolean;
}

export interface ThemePresetSelectorProps {
  presets: ThemePreset[];
  selectedPreset?: string;
  onPresetSelect: (preset: ThemePreset) => void;
  onPresetSave?: (preset: ThemePreset) => void;
  allowCustom?: boolean;
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({
  presets,
  selectedPreset,
  onPresetSelect,
  onPresetSave,
  allowCustom = true,
}) => {
  const themeManager = useThemeManager();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const defaultPresets: ThemePreset[] = [
    {
      id: "default-dark",
      name: "默认暗黑",
      description: "经典的暗黑主题风格",
      primary: "#1677ff",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
      info: "#13c2c2",
    },
    {
      id: "purple-dark",
      name: "紫色暗黑",
      description: "神秘的紫色主题",
      primary: "#722ed1",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
      info: "#13c2c2",
      favorite: true,
    },
    {
      id: "green-dark",
      name: "绿色暗黑",
      description: "清新的绿色主题",
      primary: "#52c41a",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
      info: "#13c2c2",
    },
    {
      id: "red-dark",
      name: "红色暗黑",
      description: "激情的红色主题",
      primary: "#ff4d4f",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
      info: "#13c2c2",
    },
  ];

  const allPresets = [...defaultPresets, ...presets];

  const handlePresetClick = (preset: ThemePreset) => {
    onPresetSelect(preset);
  };

  const renderPresetCard = (preset: ThemePreset) => {
    const isSelected = selectedPreset === preset.id;

    return (
      <Card
        key={preset.id}
        size="small"
        hoverable
        style={{
          borderColor: isSelected ? preset.primary : undefined,
          backgroundColor: isSelected
            ? "var(--colorBgContainerDisabled)"
            : undefined,
        }}
        title={
          <Space>
            <Avatar size="small" style={{ backgroundColor: preset.primary }}>
              <BgColorsOutlined />
            </Avatar>
            <span>{preset.name}</span>
            {preset.favorite && <StarFilled style={{ color: "#faad14" }} />}
            {isSelected && <CheckOutlined style={{ color: preset.primary }} />}
          </Space>
        }
        extra={
          allowCustom &&
          onPresetSave && (
            <Tooltip title="保存为自定义预设">
              <Button
                type="text"
                size="small"
                icon={<SaveOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onPresetSave(preset);
                }}
              />
            </Tooltip>
          )
        }
        onClick={() => handlePresetClick(preset)}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {preset.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {preset.description}
            </Text>
          )}

          <Space wrap>
            <Tag color={preset.primary}>主色</Tag>
            <Tag color={preset.success}>成功</Tag>
            <Tag color={preset.warning}>警告</Tag>
            <Tag color={preset.error}>错误</Tag>
            <Tag color={preset.info}>信息</Tag>
          </Space>
        </Space>
      </Card>
    );
  };

  return (
    <Card title="主题预设" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {allowCustom && (
          <Alert
            message="主题预设"
            description="选择预设主题或保存自定义配置"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[16, 16]}>
          {allPresets.map((preset) => (
            <Col xs={24} sm={12} md={8} lg={6} key={preset.id}>
              {renderPresetCard(preset)}
            </Col>
          ))}
        </Row>

        {allowCustom && (
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button
                type="dashed"
                icon={<SaveOutlined />}
                onClick={() => setShowSaveDialog(true)}
              >
                保存当前配置
              </Button>
              <Text type="secondary" style={{ fontSize: 12 }}>
                将当前主题配置保存为新的预设
              </Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};
