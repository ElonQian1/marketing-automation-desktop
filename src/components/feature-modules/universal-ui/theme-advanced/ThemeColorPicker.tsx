/**
 * 主题颜色选择器组件
 */

import React from "react";
import { Card, ColorPicker, Space, Typography } from "antd";
import type { Color } from "antd/es/color-picker";
import { useThemeManager } from "../../theme-system";

const { Text } = Typography;

export interface ThemeColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  showPresets?: boolean;
  disabled?: boolean;
}

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  label,
  value,
  onChange,
  presets = [
    "#1677ff",
    "#52c41a",
    "#faad14",
    "#ff4d4f",
    "#722ed1",
    "#13c2c2",
    "#eb2f96",
    "#f5222d",
    "#fa541c",
    "#fa8c16",
    "#a0d911",
    "#52c41a",
    "#1890ff",
    "#2f54eb",
    "#722ed1",
  ],
  showPresets = true,
  disabled = false,
}) => {
  const themeManager = useThemeManager();

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--colorBgContainer)",
    borderColor: "var(--colorBorderSecondary)",
    borderRadius: "8px",
    padding: "16px",
  };

  return (
    <Card style={cardStyle} size="small">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text style={{ color: "var(--colorText)", fontWeight: "bold" }}>
          {label}
        </Text>

        <ColorPicker
          value={value}
          onChange={(color: Color) => onChange(color.toHexString())}
          disabled={disabled}
          showText
          size="large"
          format="hex"
          presets={
            showPresets
              ? [
                  {
                    label: "推荐颜色",
                    colors: presets,
                  },
                ]
              : undefined
          }
        />

        {showPresets && (
          <div style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: "var(--colorTextSecondary)" }}>
              点击预设颜色快速应用
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};
