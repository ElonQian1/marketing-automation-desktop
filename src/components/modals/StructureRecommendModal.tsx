// src/components/modals/StructureRecommendModal.tsx
// module: components | layer: ui | role: 结构匹配智能推荐模态框
// summary: 集成三路评分器推荐功能，提供"智能默认+一键确定"的用户体验

import React, { useEffect, useState } from "react";
import { Modal, Button, Radio, Collapse, Progress, Alert, Space, Typography, Divider, Tooltip } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, EyeOutlined, RobotOutlined } from "@ant-design/icons";
import { 
  recommendStructureMode, 
  dryRunStructureMatch,
  UiRecommendation, 
  UiOutcome,
  RecommendInput,
  getModeDisplayName,
  getConfidenceStyle,
  formatConfidence,
  generateRecommendationSummary,
  isRecommendationUsable 
} from "../../services/structureRecommend";

const { Text, Title } = Typography;
const { Panel } = Collapse;

export interface StructureRecommendModalProps {
  visible: boolean;
  onClose: () => void;
  selection: {
    clicked: number;
    container: number;
    cardRoot: number;
    clickableParent: number;
  };
  onConfirm: (stepPatch: {
    strategy: { selected: string };
    plan: any;
    config: any;
    intent: any;
  }) => void;
}

const StructureRecommendModal: React.FC<StructureRecommendModalProps> = ({
  visible,
  onClose,
  selection,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<UiRecommendation | null>(null);
  const [selectedMode, setSelectedMode] = useState<UiOutcome["mode"]>("CardSubtree");
  const [dryRunning, setDryRunning] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<number[]>([]);
  const [error, setError] = useState<string>("");

  // 模态框打开时自动获取推荐
  useEffect(() => {
    if (!visible) {
      // 重置状态
      setRecommendation(null);
      setError("");
      setHighlightedNodes([]);
      return;
    }

    const fetchRecommendation = async () => {
      setLoading(true);
      setError("");
      
      try {
        const input: RecommendInput = {
          clicked_node: selection.clicked,
          container_node: selection.container,
          card_root_node: selection.cardRoot,
          clickable_parent_node: selection.clickableParent,
        };

        const result = await recommendStructureMode(input);
        setRecommendation(result);
        setSelectedMode(result.recommended); // 默认选中系统推荐
        
        console.log("🎯 [模态框] 获取推荐成功:", result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "获取推荐失败";
        setError(errorMsg);
        console.error("❌ [模态框] 获取推荐失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [visible, selection]);

  // 试算高亮功能
  const handleDryRun = async () => {
    if (!recommendation) return;

    setDryRunning(true);
    try {
      const input: RecommendInput = {
        clicked_node: selection.clicked,
        container_node: selection.container,
        card_root_node: selection.cardRoot,
        clickable_parent_node: selection.clickableParent,
      };

      const targetNodes = await dryRunStructureMatch(input, selectedMode);
      setHighlightedNodes(targetNodes);
      
      console.log("🧪 [模态框] 试算完成，高亮节点:", targetNodes);
    } catch (err) {
      console.error("❌ [模态框] 试算失败:", err);
    } finally {
      setDryRunning(false);
    }
  };

  // 确认应用推荐
  const handleConfirm = () => {
    if (!recommendation) return;

    // 根据用户选择的模式生成最终配置
    const stepPatch = {
      strategy: { selected: recommendation.step_plan_mode },
      plan: recommendation.plan_suggest,
      config: recommendation.config_suggest,
      intent: recommendation.intent_suggest,
    };

    console.log("✅ [模态框] 应用推荐配置:", {
      selectedMode,
      stepPatch
    });

    onConfirm(stepPatch);
    onClose();
  };

  // 渲染评分条
  const renderOutcomeBar = (outcome: UiOutcome) => {
    const style = getConfidenceStyle(outcome.conf);
    const percentage = Math.round(outcome.conf * 100);
    
    return (
      <div className="outcome-item" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Space>
            <Text strong>{getModeDisplayName(outcome.mode)}</Text>
            {outcome.passed_gate ? (
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            )}
          </Space>
          <Text style={{ color: style.color }}>
            {formatConfidence(outcome.conf)}
          </Text>
        </div>
        
        <Progress
          percent={percentage}
          strokeColor={outcome.passed_gate ? "#52c41a" : "#faad14"}
          showInfo={false}
          size="small"
        />
        
        <Text type="secondary" style={{ fontSize: 12 }}>
          {outcome.explain}
        </Text>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: "#1890ff" }} />
          <span>结构匹配（智能推荐）</span>
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Tooltip key="dry-run" title="预览匹配目标节点">
          <Button 
            icon={<EyeOutlined />}
            loading={dryRunning}
            disabled={!recommendation}
            onClick={handleDryRun}
          >
            试算高亮
          </Button>
        </Tooltip>,
        <Button 
          key="confirm" 
          type="primary" 
          disabled={!recommendation || !isRecommendationUsable(recommendation)}
          onClick={handleConfirm}
        >
          确定应用
        </Button>
      ]}
      width={600}
      className="structure-recommend-modal"
    >
      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Text>🧠 智能分析中，请稍候...</Text>
        </div>
      )}

      {error && (
        <Alert 
          type="error" 
          message="推荐失败"
          description={error}
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && recommendation && (
        <div>
          {/* 推荐摘要 */}
          <Alert
            type="info"
            message="系统推荐"
            description={
              <div>
                <Text strong>
                  {getModeDisplayName(recommendation.recommended)}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({recommendation.confidence_level}置信度)
                </Text>
                <br />
                <Text type="secondary">
                  {generateRecommendationSummary(recommendation)}
                </Text>
              </div>
            }
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 模式选择 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              选择匹配模式：
            </Text>
            <Radio.Group
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value="LeafContext">
                  <Space>
                    叶子上下文
                    {recommendation.recommended === "LeafContext" && (
                      <Text type="success" style={{ fontSize: 12 }}>（推荐）</Text>
                    )}
                  </Space>
                </Radio>
                <Radio value="CardSubtree">
                  <Space>
                    卡片子树
                    {recommendation.recommended === "CardSubtree" && (
                      <Text type="success" style={{ fontSize: 12 }}>（推荐）</Text>
                    )}
                  </Space>
                </Radio>
                <Radio value="TextExact">
                  <Space>
                    文本精确
                    {recommendation.recommended === "TextExact" && (
                      <Text type="success" style={{ fontSize: 12 }}>（推荐）</Text>
                    )}
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* 试算结果显示 */}
          {highlightedNodes.length > 0 && (
            <Alert
              type="success"
              message="试算完成"
              description={`预计匹配 ${highlightedNodes.length} 个目标节点: ${highlightedNodes.join(", ")}`}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 高级详情 */}
          <Collapse ghost>
            <Panel header="🔍 评分详情与解释" key="details">
              <div style={{ padding: "8px 0" }}>
                {recommendation.outcomes.map((outcome) => 
                  renderOutcomeBar(outcome)
                )}
                
                <Divider />
                
                <Text type="secondary">
                  <strong>推荐理由：</strong>{recommendation.recommendation_reason}
                </Text>
              </div>
            </Panel>
          </Collapse>

          {/* 兜底提示 */}
          {!isRecommendationUsable(recommendation) && (
            <Alert
              type="warning"
              message="注意"
              description="所有模式置信度均较低，建议手动调整配置或重新选择元素"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default StructureRecommendModal;