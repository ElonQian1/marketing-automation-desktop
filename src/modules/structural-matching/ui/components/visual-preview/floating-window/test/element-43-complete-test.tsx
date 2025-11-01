// src/modules/structural-matching/ui/components/visual-preview/floating-window/test/element-43-complete-test.tsx
// module: structural-matching | layer: ui | role: test-component
// summary: Element_43案例完整测试组件

import React, { useState, useEffect } from "react";
import { Button, Card, Typography, Space, Alert, Divider } from "antd";
import {
  element43TestCase,
  testElementBoundsCorrection,
} from "./element-43-case-test";
import { FloatingVisualWindow } from "../components/floating-visual-window";

const { Title, Text, Paragraph } = Typography;

export const Element43CompleteTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);
  const [mockStepCardData, setMockStepCardData] = useState<any>(null);

  // 运行边界校正测试
  const runBoundsTest = () => {
    console.log("🚀 开始Element_43边界校正测试...");
    const result = testElementBoundsCorrection();
    setTestResult(result);
    console.log("✅ 测试完成:", result);
  };

  // 创建模拟的StepCardData用于悬浮窗测试
  useEffect(() => {
    // 基于element_43案例创建模拟数据
    const mockData = {
      stepId: "test-element-43",
      stepType: "click",
      targetElementId: "element_43",
      targetBounds: "[13,1158][534,2023]", // 用户实际点击的边界
      targetText: "小何老师",
      targetDescription: "笔记 深圳也太牛了，取消了！ 来自小何老师 55赞",
      screenshotPath: "/mock/element_43_screenshot.png",
      xmlPath: "/mock/ui_dump_e0d909c3_20251030_122312.xml",
      deviceInfo: {
        width: 1080,
        height: 2340,
        density: 3.0,
      },
    };
    setMockStepCardData(mockData);
  }, []);

  // 启动悬浮窗测试
  const testFloatingWindow = () => {
    if (mockStepCardData) {
      setShowFloatingWindow(true);
    }
  };

  return (
    <div
      className="light-theme-force"
      style={{ padding: 24, background: "var(--bg-light-base, #ffffff)" }}
    >
      <Title level={2}>🧪 Element_43 视口对齐修复 - 完整测试</Title>

      <Alert
        message="测试目标"
        description="验证悬浮视口是否能正确对齐到用户点击的'小何老师'卡片，而不是只显示父容器的1/4"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 案例说明 */}
        <Card title="📍 Element_43 案例说明" size="small">
          <Paragraph>
            <strong>问题场景：</strong> 用户点击左下角"小何老师"笔记卡片
          </Paragraph>
          <Paragraph>
            • <strong>用户点击</strong>: bounds=[13,1158][534,2023],
            clickable=false (外层容器)
            <br />• <strong>实际目标</strong>: bounds=[13,1158][534,2023],
            clickable=true (可点击元素)
            <br />• <strong>错误提取</strong>: "147" 来自右上角不相关卡片
            <br />• <strong>正确提取</strong>: "小何老师" 或 "55" 来自目标区域
          </Paragraph>
        </Card>

        {/* 边界校正测试 */}
        <Card title="🔧 边界校正逻辑测试" size="small">
          <Space>
            <Button type="primary" onClick={runBoundsTest}>
              运行边界校正测试
            </Button>
            {testResult && (
              <Text type={testResult.success ? "success" : "danger"}>
                {testResult.success ? "✅ 测试通过" : "❌ 测试失败"}
              </Text>
            )}
          </Space>

          {testResult && (
            <div style={{ marginTop: 16 }}>
              <Divider orientation="left" orientationMargin="0">
                测试结果详情
              </Divider>
              <pre
                style={{
                  background: "#f5f5f5",
                  padding: 12,
                  borderRadius: 4,
                  fontSize: 12,
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* 悬浮窗实际测试 */}
        <Card title="🎯 悬浮窗实际测试" size="small">
          <Space>
            <Button
              type="primary"
              onClick={testFloatingWindow}
              disabled={!mockStepCardData}
            >
              启动悬浮窗测试
            </Button>
            {showFloatingWindow && (
              <Button onClick={() => setShowFloatingWindow(false)}>
                关闭悬浮窗
              </Button>
            )}
          </Space>

          <Paragraph style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
            点击"启动悬浮窗测试"将打开悬浮窗，验证：
            <br />
            1. 是否检测到需要边界校正 (clickable=false 问题)
            <br />
            2. 视口是否精确对齐到"小何老师"卡片区域
            <br />
            3. 窗口大小是否合适 (应该约 561x905)
            <br />
            4. 是否完整显示元素结构树
          </Paragraph>
        </Card>

        {/* 预期效果对比 */}
        <Card title="📊 预期修复效果对比" size="small">
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Title level={5} type="danger">
                ❌ 修复前
              </Title>
              <ul style={{ fontSize: 12, color: "#666" }}>
                <li>视口显示整个父容器</li>
                <li>目标卡片只占视口1/4</li>
                <li>错误提取"147"文本</li>
                <li>无检测机制</li>
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <Title level={5} type="success">
                ✅ 修复后
              </Title>
              <ul style={{ fontSize: 12, color: "#666" }}>
                <li>视口精确对齐目标元素</li>
                <li>完整显示"小何老师"卡片</li>
                <li>正确提取目标区域文本</li>
                <li>自动检测并校正边界</li>
              </ul>
            </div>
          </div>
        </Card>
      </Space>

      {/* 悬浮窗组件 */}
      {showFloatingWindow && mockStepCardData && (
        <FloatingVisualWindow
          visible={true}
          stepCardData={mockStepCardData}
          highlightedElementId="element_43"
          initialPosition={{ x: 200, y: 100 }}
          onClose={() => setShowFloatingWindow(false)}
        />
      )}
    </div>
  );
};

export default Element43CompleteTest;
