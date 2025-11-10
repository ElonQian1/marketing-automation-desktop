// src/pages/structure-recommend-demo.tsx
// module: pages | layer: pages | role: 结构匹配智能推荐演示页面
// summary: 演示智能推荐功能的完整集成，展示"点选→推荐→确定→落地"的完整流程

import React, { useState } from "react";
import { Card, Button, Space, Typography, Alert, Divider, Input, Form, message } from "antd";
import { RobotOutlined, SettingOutlined, PlayCircleOutlined } from "@ant-design/icons";
import StructureRecommendModal from "../components/modals/StructureRecommendModal";
import { useStructureRecommend } from "../hooks/useStructureRecommend";

const { Title, Text, Paragraph } = Typography;

interface StepCardPatch {
  strategy: { selected: string };
  plan: any;
  config: any;
  intent: any;
}

const StructureRecommendDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [stepCard, setStepCard] = useState<StepCardPatch | null>(null);
  const [mockSelection, setMockSelection] = useState({
    clicked: 42,
    container: 10,
    cardRoot: 25,
    clickableParent: 35,
  });

  const {
    recommendation,
    loading,
    error,
    fetchRecommendation,
    clear
  } = useStructureRecommend({
    onSuccess: (rec) => {
      message.success(`智能推荐完成：${rec.recommended}`);
    },
    onError: (err) => {
      message.error(`推荐失败：${err.message}`);
    }
  });

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    clear();
  };

  const handleConfirmRecommendation = (patch: StepCardPatch) => {
    setStepCard(patch);
    message.success("推荐配置已应用到StepCard！");
    
    console.log("✅ [演示页面] StepCard更新:", patch);
  };

  const handleQuickTest = async () => {
    await fetchRecommendation({
      clicked_node: mockSelection.clicked,
      container_node: mockSelection.container,
      card_root_node: mockSelection.cardRoot,
      clickable_parent_node: mockSelection.clickableParent,
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={2}>
        <RobotOutlined style={{ color: "#1890ff" }} />
        <span style={{ marginLeft: 8 }}>结构匹配智能推荐演示</span>
      </Title>
      
      <Paragraph>
        此页面演示三路评分器自动选型系统的完整功能。点击"打开智能推荐"体验 
        <Text code>"点选 → 推荐 → 确定 → 落地"</Text> 的零配置流程。
      </Paragraph>

      <Divider />

      {/* 模拟节点选择 */}
      <Card title="📍 模拟节点选择" style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="点击节点">
            <Input 
              type="number" 
              value={mockSelection.clicked}
              onChange={(e) => setMockSelection(prev => ({ 
                ...prev, 
                clicked: parseInt(e.target.value) || 0 
              }))}
              style={{ width: 100 }}
            />
          </Form.Item>
          <Form.Item label="容器节点">
            <Input 
              type="number" 
              value={mockSelection.container}
              onChange={(e) => setMockSelection(prev => ({ 
                ...prev, 
                container: parseInt(e.target.value) || 0 
              }))}
              style={{ width: 100 }}
            />
          </Form.Item>
          <Form.Item label="卡片根">
            <Input 
              type="number" 
              value={mockSelection.cardRoot}
              onChange={(e) => setMockSelection(prev => ({ 
                ...prev, 
                cardRoot: parseInt(e.target.value) || 0 
              }))}
              style={{ width: 100 }}
            />
          </Form.Item>
          <Form.Item label="可点父">
            <Input 
              type="number" 
              value={mockSelection.clickableParent}
              onChange={(e) => setMockSelection(prev => ({ 
                ...prev, 
                clickableParent: parseInt(e.target.value) || 0 
              }))}
              style={{ width: 100 }}
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Card title="🎯 智能推荐操作" style={{ marginBottom: 16 }}>
        <Space size="large">
          <Button 
            type="primary" 
            icon={<RobotOutlined />}
            onClick={handleOpenModal}
          >
            打开智能推荐模态框
          </Button>
          
          <Button 
            icon={<PlayCircleOutlined />}
            loading={loading}
            onClick={handleQuickTest}
          >
            快速测试推荐API
          </Button>
        </Space>
      </Card>

      {/* 推荐结果展示 */}
      {recommendation && (
        <Card title="📊 推荐结果" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Alert
              type="success"
              message={`系统推荐：${recommendation.recommended}`}
              description={`置信度级别：${recommendation.confidence_level}`}
            />
            
            <div>
              <Text strong>三路评分详情：</Text>
              <ul>
                {recommendation.outcomes.map(outcome => (
                  <li key={outcome.mode}>
                    <Text>{outcome.mode}：</Text>
                    <Text type={outcome.passed_gate ? "success" : "warning"}>
                      {Math.round(outcome.conf * 100)}%
                    </Text>
                    <Text type="secondary"> - {outcome.explain}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </Space>
        </Card>
      )}

      {error && (
        <Alert 
          type="error" 
          message="推荐失败" 
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* StepCard状态展示 */}
      <Card title="📝 StepCard配置状态" style={{ marginBottom: 16 }}>
        {stepCard ? (
          <div>
            <Alert 
              type="info" 
              message="配置已更新" 
              description="推荐配置已成功应用到StepCard"
              style={{ marginBottom: 12 }}
            />
            <pre style={{ 
              background: "#f5f5f5", 
              padding: 12, 
              borderRadius: 6,
              fontSize: 12,
              overflow: "auto"
            }}>
              {JSON.stringify(stepCard, null, 2)}
            </pre>
          </div>
        ) : (
          <Text type="secondary">尚未应用推荐配置</Text>
        )}
      </Card>

      {/* 功能说明 */}
      <Card title="📖 功能说明">
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>🧠 三路评分器：</Text>
            <ul>
              <li><Text code>CardSubtree</Text> - 基于卡片整体结构特征</li>
              <li><Text code>LeafContext</Text> - 基于元素上下文位置关系</li>
              <li><Text code>TextExact</Text> - 基于稳定文本内容精确匹配</li>
            </ul>
          </div>
          
          <div>
            <Text strong>🎯 自动选型：</Text>
            <ul>
              <li>统一闸门机制（最低置信度70%）</li>
              <li>智能择优算法（分差不足时偏向叶子上下文）</li>
              <li>兜底策略（Leaf → Card → Text）</li>
            </ul>
          </div>

          <div>
            <Text strong>✅ 用户体验：</Text>
            <ul>
              <li>打开模态框即有智能推荐</li>
              <li>可预览试算高亮匹配目标</li>
              <li>一键确定自动回填StepCard</li>
            </ul>
          </div>
        </Space>
      </Card>

      {/* 智能推荐模态框 */}
      <StructureRecommendModal
        visible={modalVisible}
        onClose={handleCloseModal}
        selection={mockSelection}
        onConfirm={handleConfirmRecommendation}
      />
    </div>
  );
};

export default StructureRecommendDemo;