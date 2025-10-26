// src/modules/universal-ui/ui/components/universal-smart-step-DEMO-ONLY.tsx
// module: universal-ui | layer: ui | role: integration-component
// summary: 智能步骤卡片系统集成组件，管理从元素选择到步骤创建的完整流程

import React, { useState, useCallback } from "react";
import { Card, Space, Button, Typography, message } from "antd";
import { PlayCircleOutlined, PlusOutlined } from "@ant-design/icons";

import { UnifiedStepCard as IntelligentStepCard } from "../../components/unified-step-card";
import {
  IntelligentAnalysisPopoverUI,
  type PopoverState,
} from "./intelligent-analysis-popover-ui";
import { useIntelligentAnalysisWorkflow } from "../../hooks/use-intelligent-analysis-workflow";
import type { 
  ElementSelectionContext,
  IntelligentStepCard as StepCardAnalysisState
} from "../../types/intelligent-analysis-types";
import type { IntelligentStepCard as IntelligentStepCardData } from "../../types/intelligent-analysis-types";
import { calculateSelectionHash } from "../../utils/selection-hash";

const { Text } = Typography;

/**
 * 智能步骤系统集成属性
 */
export interface UniversalSmartStepIntegrationProps {
  /** 组件标题 */
  title?: string;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 最大步骤卡片数量 */
  maxSteps?: number;

  // 事件回调
  /** 步骤卡片变更 */
  onStepsChange?: (steps: StepCardAnalysisState[]) => void;
  /** 执行工作流 */
  onExecuteWorkflow?: (steps: StepCardAnalysisState[]) => void;
}

/**
 * 🧪 仅用于演示和测试的模拟元素上下文生成器
 * 
 * ⚠️ 重要提醒：
 * - 此函数生成的是假数据，仅用于组件演示！
 * - 真实的元素选择流程在：ElementSelectionPopover → convertElementToContext()
 * - 生产环境中步骤卡片应通过真实XML元素选择创建
 * 
 * 🎯 如果您看到步骤卡片内容不正确，请检查是否误用了此模拟函数！
 */
const createMockElementContext_FOR_DEMO_ONLY = (index: number): ElementSelectionContext => ({
  snapshotId: `snapshot_${Date.now()}_${index}`,
  elementPath: `//*[@id="contact-list"]/div[${index}]/div[2]/span`,
  elementType: "text",
  elementText: `联系人姓名 ${index}`,
  elementBounds: `120,${45 + index * 20},200,${65 + index * 20}`,
});

/**
 * 将SmartStepCard转换为IntelligentStepCard格式
 */
const adaptStepCardToIntelligent = (
  smartCard: StepCardAnalysisState
): IntelligentStepCardData => {
  return {
    stepId: smartCard.stepId,
    stepName: smartCard.stepName,
    stepType: smartCard.stepType,
    elementContext: smartCard.elementContext || createMockElementContext_FOR_DEMO_ONLY(1),
    selectionHash: calculateSelectionHash(
      smartCard.elementContext || createMockElementContext_FOR_DEMO_ONLY(1)
    ),
    analysisState: smartCard.analysisState as
      | "idle"
      | "analyzing"
      | "analysis_completed"
      | "analysis_failed",
    analysisJobId: smartCard.analysisJobId,
    analysisProgress: smartCard.analysisProgress,
    strategyMode: smartCard.strategyMode as
      | "intelligent"
      | "smart_variant"
      | "static_user",
    smartCandidates: [],
    staticCandidates: [],
    activeStrategy: smartCard.activeStrategy
      ? {
          ...smartCard.activeStrategy,
          isRecommended: false,
        }
      : {
          key: "fallback",
          name: "默认策略",
          confidence: 0.5,
          description: "基于元素路径的兜底策略",
          variant: "index_fallback",
          enabled: true,
          isRecommended: false,
        },
    recommendedStrategy: smartCard.recommendedStrategy
      ? {
          ...smartCard.recommendedStrategy,
          isRecommended: true,
        }
      : undefined,
    fallbackStrategy: {
      key: "fallback",
      name: "默认策略",
      confidence: 0.5,
      description: "基于元素路径的兜底策略",
      variant: "index_fallback",
      enabled: true,
      isRecommended: false,
    },
    autoFollowSmart: smartCard.autoFollowSmart,
    lockContainer: false,
    smartThreshold: 0.82,
    createdAt: smartCard.createdAt || Date.now(),
    analyzedAt: smartCard.analyzedAt,
    updatedAt: Date.now(),
  };
};

/**
 * 智能步骤系统集成组件
 * 演示和测试完整的从元素选择到步骤创建的工作流
 */
export const UniversalSmartStepIntegration: React.FC<
  UniversalSmartStepIntegrationProps
> = ({
  title = "智能步骤系统",
  showDebugInfo = process.env.NODE_ENV === "development",
  maxSteps = 10,
  onStepsChange,
  onExecuteWorkflow,
}) => {
  // 状态管理
  const [showPopover, setShowPopover] = useState(false);
  const [popoverState, setPopoverState] = useState<PopoverState>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentElementContext, setCurrentElementContext] =
    useState<ElementSelectionContext>(createMockElementContext_FOR_DEMO_ONLY(1));

  // 工作流钩子
  const {
    currentJobs,
    stepCards: workflowStepCards,
    startAnalysis,
    createStepCardQuick,
    cancelAnalysis,
    clearAllJobs,
  } = useIntelligentAnalysisWorkflow();
  
  // 兼容性适配：从Map中获取当前作业
  const currentJob = Array.from(currentJobs.values())[0] || null;

  /**
   * 模拟元素选择事件
   */
  const handleSimulateElementSelection = useCallback(() => {
    const newContext: ElementSelectionContext = {
      ...createMockElementContext_FOR_DEMO_ONLY(workflowStepCards.length + 1),
      elementText: `元素 ${workflowStepCards.length + 1}`,
      elementPath: `//*[@id="item-${workflowStepCards.length + 1}"]`,
    };

    setCurrentElementContext(newContext);
    setPopoverState("idle");
    setAnalysisProgress(0);
    setShowPopover(true);

    message.info("已选择新元素，气泡已显示");
  }, [workflowStepCards.length]);

  /**
   * 启动智能分析
   */
  const handleStartAnalysis = useCallback(async () => {
    setPopoverState("analyzing");
    setAnalysisProgress(0);

    try {
      await startAnalysis(currentElementContext);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setPopoverState("analyzed");
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } catch (err) {
      console.error("Failed to start analysis:", err);
      setPopoverState("failed");
      message.error("分析启动失败");
    }
  }, [currentElementContext, startAnalysis]);

  /**
   * 直接确定（创建步骤卡片）
   */
  const handleDirectConfirm = useCallback(async () => {
    try {
      await createStepCardQuick(currentElementContext);

      // 步骤卡片会通过Hook自动更新到workflowStepCards中
      setShowPopover(false);
      setPopoverState("idle");

      message.success("步骤卡片已创建");
    } catch (err) {
      console.error("Failed to create step card:", err);
      message.error("创建步骤卡片失败");
    }
  }, [currentElementContext, createStepCardQuick, onStepsChange]);

  /**
   * 不等分析完成，直接确定
   */
  const handleConfirmWithoutWaiting = useCallback(async () => {
    if (currentJob) {
      cancelAnalysis(currentJob.jobId);
    }

    await handleDirectConfirm();
    message.info("已使用静态策略创建步骤，分析完成后会自动优化");
  }, [currentJob, cancelAnalysis, handleDirectConfirm]);

  /**
   * 取消操作
   */
  const handleCancel = useCallback(() => {
    if (currentJob) {
      cancelAnalysis(currentJob.jobId);
    }

    setShowPopover(false);
    setPopoverState("idle");
    setAnalysisProgress(0);
  }, [currentJob, cancelAnalysis]);

  /**
   * 执行整个工作流
   */
  const handleExecuteWorkflow = useCallback(() => {
    if (workflowStepCards.length === 0) {
      message.warning("没有步骤可执行");
      return;
    }

    onExecuteWorkflow?.(workflowStepCards);
    message.info(`开始执行 ${workflowStepCards.length} 个步骤`);
  }, [workflowStepCards, onExecuteWorkflow]);

  /**
   * 清空所有步骤
   */
  const handleClearAllSteps = useCallback(() => {
    clearAllJobs();
    onStepsChange?.([]);
    message.info("已清空所有步骤");
  }, [clearAllJobs, onStepsChange]);

  return (
    <div className="light-theme-force universal-smart-step-integration">
      <Card title={title}>
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 工具栏 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleSimulateElementSelection}
                disabled={workflowStepCards.length >= maxSteps}
              >
                模拟选择元素
              </Button>

              <Button
                type="default"
                icon={<PlayCircleOutlined />}
                onClick={handleExecuteWorkflow}
                disabled={workflowStepCards.length === 0}
              >
                执行工作流 ({workflowStepCards.length})
              </Button>
            </Space>

            <Space>
              <Button
                size="small"
                onClick={handleClearAllSteps}
                disabled={workflowStepCards.length === 0}
              >
                清空
              </Button>
            </Space>
          </div>

          {/* 步骤卡片列表 */}
          <div style={{ minHeight: 200 }}>
            {workflowStepCards.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "var(--text-3, #94a3b8)",
                  fontSize: 14,
                }}
              >
                <Text type="secondary">
                  暂无步骤，点击"模拟选择元素"开始创建
                </Text>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {workflowStepCards.map((stepCard, index) => (
                  <IntelligentStepCard
                    key={stepCard.stepId}
                    stepCard={adaptStepCardToIntelligent(stepCard)}
                    stepIndex={index + 1}
                    showDebugInfo={false}
                    onUpgradeStrategy={() => {
                      console.log(`升级步骤 ${stepCard.stepId} 的策略`);
                    }}
                    onRetryAnalysis={() => {
                      console.log(`重试分析步骤 ${stepCard.stepId}`);
                    }}
                    onSwitchStrategy={(strategyKey, followSmart) => {
                      console.log(
                        `切换步骤 ${stepCard.stepId} 的策略到 ${strategyKey}，跟随智能推荐: ${followSmart}`
                      );
                    }}
                    onViewDetails={() => {
                      console.log(`查看步骤 ${stepCard.stepId} 的详情`);
                    }}
                    onCancelAnalysis={() => {
                      console.log(`取消步骤 ${stepCard.stepId} 的分析`);
                    }}
                  />
                ))}
              </Space>
            )}
          </div>

          {/* 元素选择气泡 */}
          {showPopover && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
              }}
            >
              <IntelligentAnalysisPopoverUI
                elementContext={currentElementContext}
                state={popoverState}
                analysisProgress={analysisProgress}
                estimatedTimeLeft={
                  popoverState === "analyzing"
                    ? (100 - analysisProgress) * 50
                    : 0
                }
                visible={showPopover}
                onStartAnalysis={handleStartAnalysis}
                onDirectConfirm={handleDirectConfirm}
                onConfirmWithoutWaiting={handleConfirmWithoutWaiting}
                onCancel={handleCancel}
                onHide={() => setShowPopover(false)}
              />
            </div>
          )}

          {/* 调试信息 */}
          {showDebugInfo && (
            <Card size="small" title="调试信息">
              <Space
                direction="vertical"
                style={{ width: "100%", fontSize: 12 }}
              >
                <div>气泡状态: {popoverState}</div>
                <div>分析进度: {analysisProgress}%</div>
                <div>当前任务: {currentJob?.jobId || "无"}</div>
                <div>
                  步骤数量: {workflowStepCards.length}/{maxSteps}
                </div>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default UniversalSmartStepIntegration;
