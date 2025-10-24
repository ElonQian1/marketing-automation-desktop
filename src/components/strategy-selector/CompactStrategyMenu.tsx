// src/components/strategy-selector/CompactStrategyMenu.tsx
// module: ui | layer: ui | role: 紧凑策略选择菜单
// summary: 替代大块策略选择器的紧凑下拉菜单，集成到步骤卡片标题栏

import React, { useState } from "react";
import { Dropdown, Button, Tooltip, Badge, Tag } from "antd";
import {
  RefreshCcwIcon,
  ClipboardListIcon,
  SearchIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import {
  StrategySelector as IStrategySelector,
  StrategyEvents,
  SmartStep,
} from "../../types/strategySelector";
import { useStepCardStore } from "../../store/stepcards";
import { useStepScoreStore } from "../../stores/step-score-store";
import { useAnalysisState } from "../../stores/analysis-state-store";
import { isValidScore, toPercentInt01 } from "../../utils/score-utils";

/**
 * 根据置信度百分比返回对应的颜色
 */
function getConfidenceColor(percent: number): string {
  if (percent >= 85) return "green";        // 高置信度：绿色
  if (percent >= 70) return "blue";         // 中高置信度：蓝色  
  if (percent >= 55) return "orange";       // 中等置信度：橙色
  if (percent >= 40) return "volcano";      // 中低置信度：火山红
  return "red";                             // 低置信度：红色
}

const STRATEGY_ICONS = {
  "smart-auto": "🧠",
  "smart-single": "🎯",
  static: "📌",
};

const STRATEGY_LABELS = {
  "smart-auto": "智能·自动链",
  "smart-single": "智能·单步",
  static: "静态策略",
};

// 🔧 修复：将后端候选项key映射到UI步骤，支持实际的候选项
const SMART_STEPS: { step: SmartStep; label: string; candidateKey: string }[] = [
  { step: "step1", label: "Step1 - 自锚定策略", candidateKey: "self_anchor" },
  { step: "step2", label: "Step2 - 子元素驱动", candidateKey: "child_driven" },
  { step: "step3", label: "Step3 - 区域约束", candidateKey: "region_scoped" },
  { step: "step4", label: "Step4 - XPath兜底", candidateKey: "xpath_fallback" },
  { step: "step5", label: "Step5 - 索引兜底", candidateKey: "index_fallback" },
  { step: "step6", label: "Step6 - 应急兜底", candidateKey: "emergency_fallback" },
];

interface CompactStrategyMenuProps {
  selector: IStrategySelector;
  events: StrategyEvents;
  disabled?: boolean;
  compact?: boolean;
  stepId?: string; // 新增：用于获取置信度数据
}

const CompactStrategyMenu: React.FC<CompactStrategyMenuProps> = ({
  selector,
  events,
  disabled = false,
  compact = true,
  stepId,
}) => {
  console.log("🚀 [CompactStrategyMenu] 组件已挂载 - v20251020-fix", {
    stepId,
  });
  const [showExpandedView, setShowExpandedView] = useState(false);

  // 获取置信度和策略数据 - 🔧 修复：通过stepId查找卡片
  const cardId = useStepCardStore((state) => stepId ? state.byStepId[stepId] : undefined);
  const card = useStepCardStore((state) => cardId ? state.cards[cardId] : undefined);
  const recommendedKey = card?.strategy?.primary;
  
  // 🔧 获取评分存储（候选项维度修复）
  const stepScoreStore = useStepScoreStore();
  const globalScore = stepId ? stepScoreStore.getGlobalScore(stepId) : undefined;

  // 🔍 调试输出置信度和推荐数据
  React.useEffect(() => {
    if (stepId) {
      console.log("🎯 [CompactStrategyMenu] 数据检查:", {
        stepId,
        cardId,
        hasCard: !!card,
        globalScore,
        recommendedKey,
        cardStatus: card?.status,
        strategy: card?.strategy ? "exists" : "null",
        mappingResult: cardId ? 'found' : 'not_found',
        version: "v20251020-candidates-fix",
        byStepIdLookup: '✅ 使用byStepId映射查找'
      });
    }
  }, [stepId, cardId, card, globalScore, recommendedKey]);

  // 获取当前策略的显示信息
  const getCurrentStrategyLabel = () => {
    if (!selector.activeStrategy) {
      return "🔄 未选择策略";
    }

    const { type, stepName } = selector.activeStrategy;
    const icon = STRATEGY_ICONS[type];
    const baseLabel = STRATEGY_LABELS[type];

    if (type === "smart-single" && stepName) {
      const step = SMART_STEPS.find((s) => s.step === stepName);
      return `${icon} ${step?.label || stepName}`;
    }

    return `${icon} ${baseLabel}`;
  };

  // 构建策略选择菜单
  const getStrategyMenu = () => {
    const items = [
      {
        key: "smart-auto",
        icon: <span>🧠</span>,
        label: "智能·自动链",
        onClick: () => events.onStrategyChange({ type: "smart-auto" }),
      },
      {
        key: "smart-single",
        icon: <span>🎯</span>,
        label: "智能·单步",
        children: SMART_STEPS.map(({ step, label, candidateKey }) => {
          const isRecommended = candidateKey === recommendedKey;

          // 🆕 优先从新的分析状态获取置信度
          const analysisConfidence = useAnalysisState.stepConfidence(candidateKey);
          
          // 🔧 回退到旧的评分存储（向后兼容）
          const candidateScore = stepId ? stepScoreStore.getCandidateScore(stepId, candidateKey) : undefined;
          const globalScore = stepId ? stepScoreStore.getGlobalScore(stepId) : undefined;
          
          // 🎯 置信度优先级：分析状态 > 候选分 > 推荐项的全局分
          const displayScore = analysisConfidence !== null 
            ? analysisConfidence
            : isValidScore(candidateScore)
            ? candidateScore
            : (isRecommended && isValidScore(globalScore) ? globalScore : undefined);

          // 🔍 调试每一行的数据情况
          console.debug('[StrategyRow]', {
            step,
            stepId: stepId?.slice(-8),
            candidateKey,
            isRecommended,
            analysisConfidence,
            candidateScore,
            globalScore,
            displayScore,
            recommendedKey
          });

          // 🎯 只有有效分数才显示百分比标签
          const confidencePercent = toPercentInt01(displayScore);

          return {
            key: `smart-single-${step}`,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>{label}</span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  {isRecommended && <Badge status="processing" text="荐" />}
                  {typeof confidencePercent === 'number' && (
                    <Tag 
                      color={getConfidenceColor(confidencePercent)} 
                      style={{ fontSize: "10px", fontWeight: "bold" }}
                    >
                      {confidencePercent}%
                    </Tag>
                  )}
                </div>
              </div>
            ),
            onClick: () =>
              events.onStrategyChange({ type: "smart-single", stepName: step }),
          };
        }),
      },
      {
        key: "static",
        icon: <span>📌</span>,
        label: "静态策略",
        children:
          (selector.candidates?.static?.length ?? 0) > 0
            ? selector.candidates.static!.map((candidate) => ({
                key: `static-${candidate.key}`,
                label: candidate.name,
                onClick: () =>
                  events.onStrategyChange({
                    type: "static",
                    key: candidate.key,
                  }),
              }))
            : [
                {
                  key: "no-static",
                  label: "暂无静态策略",
                  disabled: true,
                },
              ],
      },
    ];

    return { items };
  };

  // 分析状态指示器
  const getAnalysisStatus = () => {
    const { analysis } = selector;

    if (analysis.status === "analyzing") {
      return (
        <span
          style={{
            color: "#F59E0B",
            fontSize: "12px",
            marginLeft: "4px",
          }}
        >
          🔄 {analysis.progress || 0}%
        </span>
      );
    }

    if (analysis.status === "failed") {
      return (
        <span
          style={{
            color: "#EF4444",
            fontSize: "12px",
            marginLeft: "4px",
          }}
        >
          ❌
        </span>
      );
    }

    if (analysis.status === "completed") {
      return (
        <span
          style={{
            color: "#10B981",
            fontSize: "12px",
            marginLeft: "4px",
          }}
        >
          ✅
        </span>
      );
    }

    return null;
  };

  // 调试：监控状态变化
  React.useEffect(() => {
    const debugInfo = {
      disabled,
      analysisStatus: selector.analysis.status,
      activeStrategy: selector.activeStrategy?.type,
      hasActiveStrategy: !!selector.activeStrategy,
      timestamp: new Date().toISOString(),
      isButtonDisabled: disabled || selector.analysis.status === "analyzing",
    };
    console.log("🔍 [CompactStrategyMenu] 状态变化:", debugInfo);
  }, [disabled, selector.analysis.status, selector.activeStrategy]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexWrap: "wrap",
      }}
    >
      {/* 第一个：执行链选择按钮（原主策略选择） */}
      <Dropdown
        menu={getStrategyMenu()}
        trigger={["click"]}
        disabled={disabled && selector.analysis.status === "analyzing"}
      >
        <Button
          size="small"
          type="default"
          loading={selector.analysis.status === "analyzing"}
          style={{
            background: "rgba(110, 139, 255, 0.1)",
            border: "1px solid rgba(110, 139, 255, 0.3)",
            color: "#F8FAFC",
            fontSize: "12px",
          }}
        >
          {getCurrentStrategyLabel()}
          {getAnalysisStatus()}
          <span style={{ marginLeft: "4px" }}>▾</span>
        </Button>
      </Dropdown>

      {/* 第二个：选择模式按钮 */}
      <Dropdown
        menu={{
          items: [
            {
              key: 'first',
              label: '🎯 第一个',
              onClick: () => console.log('选择第一个模式')
            },
            {
              key: 'last', 
              label: '🎯 最后一个',
              onClick: () => console.log('选择最后一个模式')
            },
            {
              key: 'match-original',
              label: '🔍 精确匹配', 
              onClick: () => console.log('选择精确匹配模式')
            },
            {
              key: 'random',
              label: '🎲 随机选择',
              onClick: () => console.log('选择随机模式')
            },
            {
              key: 'all',
              label: '📋 批量全部',
              onClick: () => console.log('选择批量模式')
            }
          ]
        }}
        trigger={["click"]}
        disabled={disabled}
      >
        <Button
          size="small"
          type="default"
          style={{
            background: "rgba(110, 139, 255, 0.1)",
            border: "1px solid rgba(110, 139, 255, 0.3)",
            color: "#F8FAFC",
            fontSize: "12px",
          }}
        >
          🎯 第一个
          <span style={{ color: "rgb(16, 185, 129)", fontSize: "12px", marginLeft: "4px" }}>✅</span>
          <span style={{ marginLeft: "4px" }}>▾</span>
        </Button>
      </Dropdown>

      {/* 第三个：操作方式按钮 */}
      <Dropdown
        menu={{
          items: [
            {
              key: 'tap',
              label: '👆 点击',
              onClick: () => console.log('选择点击操作')
            },
            {
              key: 'long_press',
              label: '⏸️ 长按',
              onClick: () => console.log('选择长按操作')
            },
            {
              key: 'double_tap',
              label: '👆👆 双击',
              onClick: () => console.log('选择双击操作')
            },
            {
              key: 'swipe',
              label: '👉 滑动',
              onClick: () => console.log('选择滑动操作')
            },
            {
              key: 'input',
              label: '⌨️ 输入',
              onClick: () => console.log('选择输入操作')
            },
            {
              key: 'wait',
              label: '⏳ 等待',
              onClick: () => console.log('选择等待操作')
            }
          ]
        }}
        trigger={["click"]}
        disabled={disabled}
      >
        <Button
          size="small"
          type="default"
          style={{
            background: "rgba(110, 139, 255, 0.1)",
            border: "1px solid rgba(110, 139, 255, 0.3)",
            color: "#F8FAFC",
            fontSize: "12px",
          }}
        >
          👆 点击
          <span style={{ color: "rgb(16, 185, 129)", fontSize: "12px", marginLeft: "4px" }}>✅</span>
          <span style={{ marginLeft: "4px" }}>▾</span>
        </Button>
      </Dropdown>

      {/* 工具按钮组 */}
      <div style={{ display: "flex", gap: "2px" }}>
        <Tooltip title="重新分析">
          <Button
            size="small"
            type="text"
            icon={<RefreshCcwIcon size={12} />}
            onClick={() => {
              console.log("🔄 [CompactStrategyMenu] 重新分析按钮点击:", {
                disabled,
                analysisStatus: selector.analysis.status,
                activeStrategy: selector.activeStrategy,
                hasSelector: !!selector,
                timestamp: new Date().toISOString(),
              });

              // 无论当前状态如何，都触发重新分析（这会重置状态）
              events.onReanalyze();
            }}
            disabled={disabled}
            style={{
              color: "#64748B",
              border: "none",
              padding: "2px 4px",
              minWidth: "24px",
              height: "24px",
            }}
          />
        </Tooltip>

        <Tooltip
          title={`查看候选 (${
            (selector.candidates?.smart?.length ?? 0) +
            (selector.candidates?.static?.length ?? 0)
          })`}
        >
          <Button
            size="small"
            type="text"
            icon={<ClipboardListIcon size={12} />}
            onClick={() => setShowExpandedView(!showExpandedView)}
            disabled={disabled}
            style={{
              color: "#64748B",
              border: "none",
              padding: "2px 4px",
              minWidth: "24px",
              height: "24px",
            }}
          />
        </Tooltip>

        <Tooltip title="元素检查器">
          <Button
            size="small"
            type="text"
            icon={<SearchIcon size={12} />}
            onClick={events.onOpenElementInspector}
            disabled={disabled}
            style={{
              color: "#64748B",
              border: "none",
              padding: "2px 4px",
              minWidth: "24px",
              height: "24px",
            }}
          />
        </Tooltip>
      </div>

      {/* 展开详情按钮 */}
      {compact && (
        <Tooltip title={showExpandedView ? "收起详情" : "展开详情"}>
          <Button
            size="small"
            type="text"
            icon={<MoreHorizontalIcon size={12} />}
            onClick={() => setShowExpandedView(!showExpandedView)}
            style={{
              color: "#64748B",
              border: "none",
              padding: "2px 4px",
              minWidth: "24px",
              height: "24px",
            }}
          />
        </Tooltip>
      )}

      {/* 扩展视图：显示推荐和候选信息 */}
      {showExpandedView && (
        <div
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "8px",
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: "6px",
            border: "1px solid rgba(51, 65, 85, 0.5)",
            fontSize: "12px",
          }}
        >
          {/* 推荐策略 */}
          {selector.recommended && (
            <div
              style={{
                marginBottom: "8px",
                padding: "6px",
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "4px",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <div style={{ color: "#10B981", fontWeight: 500 }}>
                💡 推荐策略 (置信度:{" "}
                {Math.round(selector.recommended.confidence * 100)}%)
              </div>
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  events.onApplyRecommendation(selector.recommended!.key)
                }
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  height: "20px",
                  padding: "0 8px",
                }}
              >
                应用推荐
              </Button>
            </div>
          )}

          {/* 候选策略简要信息 */}
          <div style={{ color: "#CBD5E1" }}>
            智能候选: {selector.candidates?.smart?.length ?? 0} 个 | 静态候选:{" "}
            {selector.candidates?.static?.length ?? 0} 个
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactStrategyMenu;
