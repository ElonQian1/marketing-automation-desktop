// src/debug/confidence-debug.tsx
// module: debug | layer: ui | role: confidence-debugging-tool
// summary: 置信度系统调试面板，提供实时监控和测试工具

import React, { useEffect, useState } from "react";
import { Button, Card, Typography } from "antd";
import { useStepCardStore } from "../store/stepcards";
import { ConfidenceTag } from "../components/confidence-tag";
import type { SingleStepScore } from "../modules/universal-ui/types/intelligent-analysis-types";

const { Title, Paragraph } = Typography;

interface DebugInfo {
  totalCards: number;
  cardsWithConfidence: number;
  confidenceData: Array<{
    cardId: string;
    confidence?: number;
    confidencePercent: string;
    source?: string;
    status: string;
  }>;
}

export function ConfidenceDebugPanel() {
  const { setSingleStepConfidence, create, getAllCards } = useStepCardStore();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    totalCards: 0,
    cardsWithConfidence: 0,
    confidenceData: [],
  });

  const allCards = getAllCards();

  // 创建测试卡片
  const createTestCard = () => {
    const testCardId = `debug_card_${Date.now()}`;
    create({
      elementUid: "test_element_123",
      elementContext: { xpath: "/test/path" },
    });

    console.log("🧪 [DebugPanel] 创建测试卡片", { testCardId });
    return testCardId;
  };

  // 设置测试置信度
  const setTestConfidence = (cardId: string, confidence: number) => {
    const score: SingleStepScore = {
      confidence,
      source: "auto_chain",
      evidence: {
        locator: 0.9,
        visibility: 0.85,
        uniqueness: 0.88,
        proximity: 0.82,
      },
      at: new Date().toISOString(),
    };

    setSingleStepConfidence(cardId, score);
    console.log("🧪 [DebugPanel] 设置测试置信度", {
      cardId: cardId.slice(-8),
      score,
    });
  };

  // 刷新调试信息
  const refreshDebugInfo = () => {
    const info = {
      totalCards: allCards.length,
      cardsWithConfidence: allCards.filter((c) => c.meta?.singleStepScore)
        .length,
      confidenceData: allCards
        .filter((c) => c.meta?.singleStepScore)
        .map((c) => ({
          cardId: c.id.slice(-8),
          confidence: c.meta?.singleStepScore?.confidence,
          confidencePercent: c.meta?.singleStepScore
            ? `${Math.round(c.meta.singleStepScore.confidence * 100)}%`
            : "N/A",
          source: c.meta?.singleStepScore?.source,
          status: c.status,
        })),
    };

    setDebugInfo(info);
    console.log("🔍 [DebugPanel] 调试信息", info);
  };

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(refreshDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [allCards.length]);

  return (
    <Card title="🔬 置信度系统调试面板" style={{ margin: 16 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Button
          onClick={() => {
            const cardId = createTestCard();
            setTimeout(() => setTestConfidence(cardId, 0.881), 100);
          }}
        >
          创建测试卡片 (88.1% 置信度)
        </Button>

        <Button
          onClick={() => {
            const cardId = createTestCard();
            setTimeout(() => setTestConfidence(cardId, 0.65), 100);
          }}
        >
          创建测试卡片 (65% 置信度)
        </Button>

        <Button onClick={refreshDebugInfo}>刷新调试信息</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Title level={5}>调试信息</Title>
        <Paragraph>
          总卡片数: {debugInfo.totalCards || 0} | 有置信度的卡片:{" "}
          {debugInfo.cardsWithConfidence || 0}
        </Paragraph>

        {debugInfo.confidenceData?.map((card, index: number) => (
          <div
            key={index}
            style={{
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 4,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>卡片 {card.cardId}</span>
            <ConfidenceTag value={card.confidence} size="small" />
            <span>状态: {card.status}</span>
            <span>来源: {card.source}</span>
          </div>
        ))}
      </div>

      <div>
        <Title level={5}>置信度标签测试</Title>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <ConfidenceTag value={0.88} size="small" />
          <ConfidenceTag value={0.65} size="default" />
          <ConfidenceTag value={0.45} size="large" />
          <ConfidenceTag value={0.88} compact />
          <ConfidenceTag
            value={0.88}
            evidence={{ locator: 0.9, visibility: 0.85 }}
            size="small"
          />
        </div>
      </div>
    </Card>
  );
}
