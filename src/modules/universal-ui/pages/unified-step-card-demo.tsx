// src/modules/universal-ui/pages/unified-step-card-demo.tsx
// module: universal-ui | layer: pages | role: demo
// summary: 统一步骤卡片演示页面，展示重构后的所有状态和功能

import React, { useState, useCallback } from "react";
import {
  Card,
  Space,
  Button,
  Typography,
  Alert,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import {
  PlayCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import { UnifiedStepCard } from "../components/unified-step-card";
import type { IntelligentStepCard } from "../types/intelligent-analysis-types";

const { Paragraph, Text } = Typography;

/**
 * 创建模拟步骤卡片数据
 */
const createMockStepCard = (
  state: IntelligentStepCard["analysisState"]
): IntelligentStepCard => {
  const baseCard: IntelligentStepCard = {
    stepId: `step_${Date.now()}`,
    stepName: "点击联系人",
    stepType: "tap",
    elementContext: {
      snapshotId: "snapshot_demo",
      elementPath: '//*[@id="contact-item-1"]',
      elementText: "张三",
      elementType: "text",
      elementBounds: "100,200,200,230",
    },
    selectionHash: "demo_hash_12345",
    analysisState: state,
    analysisJobId: state === "analyzing" ? "job_demo" : undefined,
    analysisProgress: state === "analyzing" ? 65 : 100,
    analysisError: state === "analysis_failed" ? "网络超时" : undefined,
    estimatedTimeLeft: state === "analyzing" ? 2000 : undefined,
    strategyMode:
      state === "analysis_completed" ? "intelligent" : "static_user",
    smartCandidates:
      state === "analysis_completed"
        ? [
            {
              key: "self_anchor",
              name: "Step1 自我锚点",
              confidence: 0.95,
              description: "基于元素自身属性定位",
              variant: "self_anchor",
              enabled: true,
              isRecommended: true,
            },
            {
              key: "child_driven",
              name: "Step2 子树锚点",
              confidence: 0.87,
              description: "基于子元素结构定位",
              variant: "child_driven",
              enabled: true,
              isRecommended: false,
            },
            {
              key: "region_scoped",
              name: "Step3 区域限定",
              confidence: 0.82,
              description: "限定在特定区域内查找",
              variant: "region_scoped",
              enabled: true,
              isRecommended: false,
            },
          ]
        : [],
    staticCandidates: [
      {
        key: "absolute_xpath",
        name: "绝对XPath",
        confidence: 0.6,
        description: "使用完整的XPath路径",
        variant: "index_fallback",
        enabled: true,
        isRecommended: false,
      },
    ],
    activeStrategy: {
      key: state === "analysis_completed" ? "self_anchor" : "absolute_xpath",
      name: state === "analysis_completed" ? "Step1 自我锚点" : "绝对XPath",
      confidence: state === "analysis_completed" ? 0.95 : 0.6,
      description:
        state === "analysis_completed"
          ? "基于元素自身属性定位"
          : "使用完整的XPath路径（兜底策略）",
      variant:
        state === "analysis_completed" ? "self_anchor" : "index_fallback",
      enabled: true,
      isRecommended: state === "analysis_completed",
    },
    recommendedStrategy:
      state === "analysis_completed"
        ? {
            key: "self_anchor",
            name: "Step1 自我锚点",
            confidence: 0.95,
            description: "基于元素自身属性定位",
            variant: "self_anchor",
            enabled: true,
            isRecommended: true,
          }
        : undefined,
    fallbackStrategy: {
      key: "absolute_xpath",
      name: "绝对XPath",
      confidence: 0.6,
      description: "使用完整的XPath路径（兜底策略）",
      variant: "index_fallback",
      enabled: true,
      isRecommended: false,
    },
    autoFollowSmart: true,
    lockContainer: false,
    smartThreshold: 0.82,
    createdAt: Date.now() - 30000,
    analyzedAt: state === "analysis_completed" ? Date.now() - 5000 : undefined,
    updatedAt: Date.now(),
  };

  return baseCard;
};

/**
 * 统一步骤卡片演示页面
 */
export const UnifiedStepCardDemo: React.FC = () => {
  const [demoCards, setDemoCards] = useState<IntelligentStepCard[]>([]);

  /**
   * 创建不同状态的演示卡片
   */
  const createDemoCard = useCallback(
    (state: IntelligentStepCard["analysisState"]) => {
      const newCard = createMockStepCard(state);
      setDemoCards((prev) => [...prev, newCard]);
      message.success(`创建了${state}状态的演示卡片`);
    },
    []
  );

  /**
   * 清空所有卡片
   */
  const clearAllCards = useCallback(() => {
    setDemoCards([]);
    message.info("已清空所有演示卡片");
  }, []);

  /**
   * 处理升级策略
   */
  const handleUpgradeStrategy = useCallback((stepId: string) => {
    setDemoCards((prev) =>
      prev.map((card) =>
        card.stepId === stepId
          ? {
              ...card,
              activeStrategy: card.recommendedStrategy,
              strategyMode: "intelligent" as const,
            }
          : card
      )
    );
    message.success("策略升级成功！");
  }, []);

  /**
   * 处理重试分析
   */
  const handleRetryAnalysis = useCallback((stepId: string) => {
    setDemoCards((prev) =>
      prev.map((card) =>
        card.stepId === stepId
          ? {
              ...card,
              analysisState: "analyzing" as const,
              analysisProgress: 0,
              analysisError: undefined,
            }
          : card
      )
    );
    message.info("开始重试分析...");

    // 模拟分析过程
    setTimeout(() => {
      setDemoCards((prev) =>
        prev.map((card) =>
          card.stepId === stepId && card.analysisState === "analyzing"
            ? createMockStepCard("analysis_completed")
            : card
        )
      );
      message.success("重试分析完成！");
    }, 3000);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-6" title="🔧 统一步骤卡片组件演示" bordered={false}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            type="success"
            message="重构完成！"
            description="成功合并了IntelligentStepCard和StepCard，实现了文档要求的统一步骤卡片组件"
            showIcon
          />

          <Paragraph>
            本页面演示了重构后的统一步骤卡片组件，支持文档要求的所有状态：
            <Text code>pending_analysis</Text>、<Text code>analyzing</Text>、
            <Text code>analysis_completed</Text>、
            <Text code>analysis_failed</Text>、<Text code>analysis_stale</Text>
          </Paragraph>
        </Space>
      </Card>

      {/* 控制面板 */}
      <Card className="mb-6" title="控制面板" bordered={false}>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => createDemoCard("analyzing")}
          >
            创建分析中卡片
          </Button>

          <Button
            icon={<CheckCircleOutlined />}
            onClick={() => createDemoCard("analysis_completed")}
          >
            创建分析完成卡片
          </Button>

          <Button danger onClick={() => createDemoCard("analysis_failed")}>
            创建分析失败卡片
          </Button>

          <Button
            type="dashed"
            onClick={() => createDemoCard("analysis_stale")}
          >
            创建分析过期卡片
          </Button>

          <Divider type="vertical" />

          <Button icon={<ReloadOutlined />} onClick={clearAllCards}>
            清空所有卡片
          </Button>
        </Space>
      </Card>

      {/* 状态对照表 */}
      <Card className="mb-6" title="状态说明" bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" title="分析状态" type="inner">
              <ul className="text-sm">
                <li>
                  <Text code>analyzing</Text> - 蓝色状态条，显示进度
                </li>
                <li>
                  <Text code>analysis_completed</Text> - 绿色/橙色，显示升级选项
                </li>
                <li>
                  <Text code>analysis_failed</Text> - 红色状态条，提供重试
                </li>
                <li>
                  <Text code>analysis_stale</Text> - 灰色/黄色，提示过期
                </li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="策略模式" type="inner">
              <ul className="text-sm">
                <li>
                  <Text code>intelligent</Text> - 🧠 智能匹配（组合）
                </li>
                <li>
                  <Text code>smart_variant</Text> - ⚡ 智能-单步固定
                </li>
                <li>
                  <Text code>static_user</Text> - 🔧 用户自建静态
                </li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 演示卡片展示区域 */}
      <Card title="演示卡片" bordered={false}>
        {demoCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>还没有演示卡片</div>
            <div>点击上方按钮创建不同状态的卡片来查看效果</div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            {demoCards.map((card, index) => (
              <UnifiedStepCard
                key={card.stepId}
                stepCard={card}
                stepIndex={index + 1}
                showDebugInfo={true}
                showModeSwitch={true}
                onUpgradeStrategy={() => handleUpgradeStrategy(card.stepId)}
                onRetryAnalysis={() => handleRetryAnalysis(card.stepId)}
                onSwitchStrategy={(strategyKey) => {
                  const strategy = card.smartCandidates.find(
                    (c) => c.key === strategyKey
                  );
                  if (strategy) {
                    setDemoCards((prev) =>
                      prev.map((c) =>
                        c.stepId === card.stepId
                          ? { ...c, activeStrategy: strategy }
                          : c
                      )
                    );
                    message.success(`切换到策略：${strategy.name}`);
                  }
                }}
                onViewDetails={() => {
                  message.info(`查看步骤详情: ${card.stepName}`);
                }}
                onCancelAnalysis={() => {
                  setDemoCards((prev) =>
                    prev.map((c) =>
                      c.stepId === card.stepId
                        ? {
                            ...c,
                            analysisState: "idle" as const,
                            analysisProgress: 0,
                          }
                        : c
                    )
                  );
                  message.info("已取消分析");
                }}
              />
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
};

export default UnifiedStepCardDemo;
