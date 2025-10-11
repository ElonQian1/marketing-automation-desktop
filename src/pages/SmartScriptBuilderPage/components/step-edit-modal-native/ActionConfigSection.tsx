// src/pages/SmartScriptBuilderPage/components/step-edit-modal-native/ActionConfigSection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Card, Button, Typography, Alert, Divider } from "antd";
import { EyeOutlined, SettingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ActionConfigSectionProps {
  stepType: string;
  onShowPageAnalyzer?: () => void;
  onShowNavigationModal?: () => void;
}

/**
 * 操作配置区域 - 原生 Ant Design 版本
 * 移除所有 Tailwind CSS 类名，使用原生样式
 */
export const ActionConfigSection: React.FC<ActionConfigSectionProps> = ({
  stepType,
  onShowPageAnalyzer,
  onShowNavigationModal,
}) => {
  if (stepType === "SMART_NAVIGATION") {
    return (
      <div>
        <Divider orientation="left">智能导航配置</Divider>
        <Alert
          message="智能导航支持自动识别导航栏并点击指定按钮，适用于底部导航栏、顶部导航栏等场景"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Card style={{ marginBottom: 16, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<SettingOutlined />}
            onClick={onShowNavigationModal}
          >
            打开智能导航配置器
          </Button>
          <br />
          <Text
            type="secondary"
            style={{ marginTop: 8, display: "block" }}
          >
            包含向导模式（推荐新手）和专业模式（支持自定义配置）
          </Text>
        </Card>
      </div>
    );
  }

  if (stepType === "SMART_FIND_ELEMENT") {
    return (
      <div>
        <Divider orientation="left">智能元素查找配置</Divider>
        <Alert
          message="智能元素查找通过分析当前页面UI结构，自动识别可操作元素并支持智能去重和分类，提供精确的元素定位能力"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Card style={{ marginBottom: 16, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<EyeOutlined />}
            onClick={onShowPageAnalyzer}
          >
            打开智能页面分析器
          </Button>
          <br />
          <Text
            type="secondary"
            style={{ marginTop: 8, display: "block" }}
          >
            提供可视化页面元素分析、批量选择和智能匹配功能
          </Text>
        </Card>
      </div>
    );
  }

  return null;
};