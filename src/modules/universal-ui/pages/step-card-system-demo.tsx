// src/modules/universal-ui/pages/step-card-system-demo.tsx
// module: universal-ui | layer: pages | role: demo
// summary: StepCardSystem 统一系统演示页面，展示所有功能和使用方式

import React, { useState, useCallback } from "react";
import {
  Card,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Switch,
  Select,
  message,
} from "antd";

import { StepCardSystem } from "../components/step-card-system/StepCardSystem";
import type {
  UnifiedStepCardData,
  StepCardCallbacks,
} from "../types/unified-step-card-types";

const { Title, Paragraph, Text } = Typography;

/**
 * StepCardSystem 统一演示页面
 */
export const StepCardSystemDemo: React.FC = () => {
  const [enableIntelligent, setEnableIntelligent] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string>("default");

  // 创建统一的回调函数
  const createCallbacks = useCallback(
    (): StepCardCallbacks => ({
      onEdit: (stepId: string) => {
        message.info(`编辑步骤: ${stepId}`);
      },
      onDelete: (stepId: string) => {
        message.warning(`删除步骤: ${stepId}`);
      },
      onTest: (stepId: string) => {
        message.info(`测试步骤: ${stepId}`);
      },
      onCopy: (stepId: string) => {
        message.success(`复制步骤: ${stepId}`);
      },
      onToggle: (stepId: string, enabled: boolean) => {
        message.info(`${enabled ? "启用" : "禁用"}步骤: ${stepId}`);
      },
      onViewDetails: (stepId: string) => {
        message.info(`查看详情: ${stepId}`);
      },
      onStartAnalysis: (stepId: string) => {
        message.info(`开始分析: ${stepId}`);
      },
      onUpgradeStrategy: (stepId: string) => {
        message.success(`升级策略: ${stepId}`);
      },
      onRetryAnalysis: (stepId: string) => {
        message.info(`重试分析: ${stepId}`);
      },
      onCancelAnalysis: (stepId: string) => {
        message.warning(`取消分析: ${stepId}`);
      },
      onSwitchStrategy: (stepId: string, strategyKey: string) => {
        message.info(`切换策略: ${stepId} -> ${strategyKey}`);
      },
    }),
    []
  );

  // 模拟数据
  const mockUnifiedStep: UnifiedStepCardData = {
    id: "1",
    name: "点击登录按钮",
    stepType: "click",
    description: "这是一个点击登录按钮的示例步骤",
    enabled: true,
    order: 1,
    parameters: {
      element_selector: "//android.widget.Button[@text='登录']",
      action_data: { text: "Hello World" },
    },

    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <Title level={1}>📋 StepCardSystem 统一演示</Title>
      <Paragraph>
        演示新的统一步骤卡片系统，展示如何统一不同格式的步骤数据并提供一致的用户体验。
      </Paragraph>

      <Alert
        message="🎯 重构成果"
        description="所有步骤卡片现在都使用统一的 StepCardSystem，消除了重复代码，提供了一致的交互体验。"
        type="success"
        style={{ marginBottom: 24 }}
        showIcon
      />

      {/* 控制面板 */}
      <Card title="⚙️ 演示控制" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <Text>智能分析模式:</Text>
              <Switch
                checked={enableIntelligent}
                onChange={setEnableIntelligent}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Text>主题:</Text>
              <Select
                value={selectedTheme}
                onChange={setSelectedTheme}
                style={{ width: 120 }}
              >
                <Select.Option value="default">默认主题</Select.Option>
                <Select.Option value="compact">紧凑主题</Select.Option>
                <Select.Option value="modern">现代主题</Select.Option>
                <Select.Option value="dark">深色主题</Select.Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 演示内容 */}
      <Card title="📦 StepCardSystem - 统一步骤卡片系统">
        <Paragraph>
          直接使用 UnifiedStepCardData 格式的步骤，展示统一系统的完整功能。
        </Paragraph>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <StepCardSystem
            stepData={mockUnifiedStep}
            callbacks={createCallbacks()}
            systemMode={enableIntelligent ? "full" : "interaction-only"}
          />
        </Space>
      </Card>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Text type="secondary">
          ✨ 重构完成！现在所有步骤卡片都使用统一的系统，提供一致的体验。
        </Text>
      </div>
    </div>
  );
};

export default StepCardSystemDemo;
