// src/modules/structural-matching/ui/components/visual-preview/floating-window/test/test-runner.tsx
// module: structural-matching | layer: ui | role: 测试运行器
// summary: element_43案例测试运行器组件

import React, { useState } from "react";
import { Button, Card, Typography, Space, Divider } from "antd";
import { element43TestSuite } from "./element-43-case-test";

const { Title, Text, Paragraph } = Typography;

export const Element43TestRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    console.clear();

    try {
      const results = element43TestSuite.runFullTest();
      setTestResults(results);
    } catch (error) {
      console.error("Test failed:", error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>Element_43 视口对齐修复测试</Title>

      <Card title="测试场景" style={{ marginBottom: "16px" }}>
        <Paragraph>
          <Text strong>问题</Text>:
          悬浮视口没有对准所点选元素结构树的位置，只有4分之一在视口
        </Paragraph>
        <Paragraph>
          <Text strong>案例</Text>: 小红书左下角笔记卡片 "小何老师" (element_43)
        </Paragraph>
        <Paragraph>
          <Text strong>根因</Text>: 使用外层不可点击容器
          bounds=[13,1158][534,2023] 而非真正可点击的子元素
        </Paragraph>
      </Card>

      <Card title="测试数据" style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <Text strong>用户点击元素:</Text>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "8px",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(
                element43TestSuite.mockData.userClickedElement,
                null,
                2
              )}
            </pre>
          </div>
          <div>
            <Text strong>实际可点击子元素:</Text>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "8px",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(
                element43TestSuite.mockData.actualClickableChild,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </Card>

      <Space style={{ marginBottom: "16px" }}>
        <Button
          type="primary"
          onClick={runTest}
          loading={isRunning}
          size="large"
        >
          运行 Element_43 测试
        </Button>
        <Button onClick={() => console.clear()}>清空控制台</Button>
      </Space>

      {testResults && (
        <Card title="测试结果" style={{ marginTop: "16px" }}>
          {testResults.error ? (
            <Text type="danger">测试失败: {testResults.error}</Text>
          ) : (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <Text strong>边界校正: </Text>
                <Text
                  type={
                    testResults.boundsCorrection?.needsCorrection !== false
                      ? "success"
                      : "danger"
                  }
                >
                  {testResults.boundsCorrection?.needsCorrection !== false
                    ? "✅ 通过"
                    : "❌ 失败"}
                </Text>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <Text strong>视口对齐: </Text>
                <Text
                  type={testResults.viewportAlignment ? "success" : "danger"}
                >
                  {testResults.viewportAlignment ? "✅ 通过" : "❌ 失败"}
                </Text>
              </div>

              <Divider />

              <div>
                <Text strong>详细结果 (查看控制台获取完整输出):</Text>
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "12px",
                    fontSize: "12px",
                    maxHeight: "300px",
                    overflow: "auto",
                    marginTop: "8px",
                  }}
                >
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card title="预期修复效果" style={{ marginTop: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <Text strong type="danger">
              修复前 (问题):
            </Text>
            <ul>
              <li>使用外层不可点击容器 (clickable=false)</li>
              <li>视口显示整个父容器</li>
              <li>目标元素只占视口的1/4</li>
              <li>错误提取文本 "147" (来自右上角)</li>
            </ul>
          </div>
          <div>
            <Text strong type="success">
              修复后 (期望):
            </Text>
            <ul>
              <li>自动检测并使用可点击子元素</li>
              <li>视口精确对齐到目标元素</li>
              <li>完整显示 "小何老师" 卡片结构树</li>
              <li>正确提取文本 "小何老师" 或 "55"</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Element43TestRunner;
