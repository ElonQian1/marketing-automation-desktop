// src/components/strategy-selector/CompactStrategyMenu.tsx
// module: ui | layer: ui | role: 紧凑策略选择菜单
// summary: 替代大块策略选择器的紧凑下拉菜单，集成到步骤卡片标题栏

import React, { useState } from "react";
import { Dropdown, Button, Tooltip, Badge, Tag, message, Collapse } from "antd";
import { invoke } from '@tauri-apps/api/core';
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
import { useAdb } from "../../application/hooks/useAdb";
import { isValidScore, toPercentInt01 } from "../../utils/score-utils";
import type { SelectionMode } from '../../types/smartSelection';
import type { ActionKind } from '../../types/smartScript';
import { ExcludeRuleEditor, type ExcludeRule } from '../smart-selection/ExcludeRuleEditor';
import { ExplanationGenerator } from '../smart-selection/ExplanationGenerator';
import { useElementSelectionStore } from '../../stores/ui-element-selection-store';

const { Panel } = Collapse;

// 批量配置接口
interface BatchConfig {
  interval_ms: number;
  max_count?: number;
  jitter_ms?: number;
  continue_on_error: boolean;
  show_progress: boolean;
}

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
  // 🔇 日志优化：移除组件挂载日志（过于频繁）
  // console.log("🚀 [CompactStrategyMenu] 组件已挂载", { stepId });
  const [showExpandedView, setShowExpandedView] = useState(false);
  
  // 🎯 新增：智能选择状态管理
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('first');
  const [operationType, setOperationType] = useState<ActionKind>('tap');
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    interval_ms: 2000,
    max_count: 10,
    jitter_ms: 500,
    continue_on_error: true,
    show_progress: true,
  });
  
  // 🎯 获取用户实际选择的UI元素
  const { context: selectionContext } = useElementSelectionStore();

  // 🎯 新增：执行状态管理和ADB设备管理
  const [executing, setExecuting] = useState(false);
  const { selectedDevice } = useAdb();

  // 🔧 高级规则面板状态
  const [advancedRulesExpanded, setAdvancedRulesExpanded] = useState(false);

  // 🔧 规则转换辅助函数
  const parseExcludeTextToRules = (excludeText: string | string[] | undefined): ExcludeRule[] => {
    if (!excludeText) return [];
    const textArray = Array.isArray(excludeText) ? excludeText : [excludeText];
    
    return textArray.map((text, index) => {
      const parts = text.split(':');
      if (parts.length === 3) {
        return {
          id: `rule-${index}`,
          attr: parts[0] as 'text' | 'content-desc' | 'resource-id' | 'class',
          op: parts[1] as 'equals' | 'contains' | 'regex',
          value: parts[2],
          enabled: true
        };
      }
      return {
        id: `rule-${index}`,
        attr: 'text',
        op: 'contains',
        value: text,
        enabled: true
      };
    });
  };

  const formatRulesToExcludeText = (rules: ExcludeRule[]): string[] => {
    return rules
      .filter(r => r.enabled !== false)
      .map(r => `${r.attr}:${r.op}:${r.value}`);
  };

  // 🔧 临时智能选择配置（TODO: 从 selector 或 card 中获取）
  const smartSelectionConfig = {
    mode: selectionMode,
    excludeText: [] as string[],
    autoExcludeEnabled: true,
    dedupeTolerance: 20,
    enableLightValidation: true
  };

  // 获取置信度和策略数据 - 🔧 修复：通过stepId查找卡片
  const cardId = useStepCardStore((state) => stepId ? state.byStepId[stepId] : undefined);
  const card = useStepCardStore((state) => cardId ? state.cards[cardId] : undefined);
  const recommendedKey = card?.strategy?.primary;
  
  // 🔧 获取评分存储（候选项维度修复）
  const stepScoreStore = useStepScoreStore();
  const globalScore = stepId ? stepScoreStore.getGlobalScore(stepId) : undefined;

  // 🔍 调试输出置信度和推荐数据（已禁用：频繁渲染导致刷屏）
  // React.useEffect(() => {
  //   if (stepId) {
  //     console.log("🎯 [CompactStrategyMenu] 数据检查:", {
  //       stepId,
  //       cardId,
  //       hasCard: !!card,
  //       globalScore,
  //       recommendedKey,
  //       cardStatus: card?.status,
  //       strategy: card?.strategy ? "exists" : "null",
  //       mappingResult: cardId ? 'found' : 'not_found',
  //       version: "v20251020-candidates-fix",
  //       byStepIdLookup: '✅ 使用byStepId映射查找'
  //     });
  //   }
  // }, [stepId, cardId, card, globalScore, recommendedKey]);

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

  // 🔇 日志优化：完全移除频繁的状态变化日志
  // React.useEffect(() => {
  //   const debugInfo = { disabled, analysisStatus: selector.analysis.status, ... };
  //   console.log("🔍 [CompactStrategyMenu] 状态变化:", debugInfo);
  // }, [disabled, selector.analysis.status, selector.activeStrategy]);

  // 🎯 新增：选择模式相关函数
  const getSelectionModeLabel = () => {
    switch (selectionMode) {
      case 'first': return '🎯 第一个';
      case 'last': return '🎯 最后一个';
      case 'match-original': return '🔍 精确匹配';
      case 'random': return '🎲 随机选择';
      case 'all': return '📋 批量全部';
      default: return '🎯 第一个';
    }
  };

  // ✅ 自动保存智能选择配置到Store
  const autoSaveConfig = async (mode: string) => {
    console.log('🔍 [CompactStrategyMenu] autoSaveConfig 调用:', {
      stepId,
      mode,
      hasStepId: !!stepId,
      batchConfig
    });

    if (!stepId) {
      console.warn('⚠️ [CompactStrategyMenu] 无stepId，跳过保存');
      return;
    }

    try {
      const batchConfigToSave = mode === 'all' ? batchConfig : null;
      
      console.log('📤 [CompactStrategyMenu] 准备调用后端保存:', {
        stepId,
        selectionMode: mode,
        batchConfig: batchConfigToSave
      });

      // ✅ 用 stepId 保存配置
      await invoke('save_smart_selection_config', {
        stepId: stepId,
        selectionMode: mode,
        batchConfig: batchConfigToSave
      });

      console.log('✅ [CompactStrategyMenu] 自动保存配置成功:', {
        stepId,
        mode,
        batchConfig: batchConfigToSave
      });

      // 🆕 同时用 selectorId 保存一份（兜底，支持跨步骤复用）
      const state = useStepCardStore.getState();
      const canonicalId = state.aliasToCanonical[stepId];
      const card = canonicalId ? state.cards[canonicalId] : undefined;
      
      console.log('🔍 [CompactStrategyMenu] 查找elementUid详情:', {
        stepId,
        canonicalId,
        hasCard: !!card,
        cardKeys: card ? Object.keys(card) : [],
        elementUid: card?.elementUid,
        // 显示 aliasToCanonical 的所有key
        aliasKeys: Object.keys(state.aliasToCanonical).slice(0, 5)
      });
      
      if (card?.elementUid) {
        const selectorId = card.elementUid;  // 已经是完整的 elementUid
        console.log('🔄 [CompactStrategyMenu] 同时用selectorId保存兜底配置:', { selectorId });
        
        await invoke('save_smart_selection_config', {
          stepId: selectorId,  // 复用相同接口，但用 selectorId 作为key
          selectionMode: mode,
          batchConfig: batchConfigToSave
        });
        
        console.log('✅ [CompactStrategyMenu] selectorId配置保存成功');
      } else {
        console.log('⚠️ [CompactStrategyMenu] 未找到卡片或elementUid，跳过selectorId保存', {
          hasCanonicalId: !!canonicalId,
          hasCard: !!card,
          hasElementUid: !!card?.elementUid
        });
      }

      // ✅ 用户可见的保存成功提示
      message.success(`已保存智能选择配置: ${mode}`);
    } catch (error) {
      console.error('❌ [CompactStrategyMenu] 保存配置失败:', error);
      message.error(`保存配置失败: ${error}`);
    }
  };

  const handleSelectionModeClick = async ({ key }: { key: string }) => {
    console.log('🎯 选择模式菜单项被点击:', key);
    
    // 🎯 关键修复：将选择模式保存到 localStorage，供 StepExecutionGateway 使用
    localStorage.setItem('userSelectionMode', key);
    console.log('🎯 [CompactStrategyMenu] 已保存选择模式到 localStorage:', key);
    
    switch (key) {
      case 'first':
        setSelectionMode('first');
        console.log('选择第一个模式');
        await autoSaveConfig('first');
        break;
      case 'last':
        setSelectionMode('last');
        console.log('选择最后一个模式');
        await autoSaveConfig('last');
        break;
      case 'match-original':
        setSelectionMode('match-original');
        console.log('选择精确匹配模式');
        await autoSaveConfig('match-original');
        break;
      case 'random':
        setSelectionMode('random');
        console.log('选择随机模式');
        await autoSaveConfig('random');
        break;
      case 'all':
        setSelectionMode('all');
        console.log('选择批量模式', { batchConfig });
        // 🔧 批量模式下确保配置有效
        const newBatchConfig = !batchConfig || batchConfig.interval_ms <= 0 ? {
          interval_ms: 2000,
          max_count: 10,
          jitter_ms: 500,
          continue_on_error: true,
          show_progress: true,
        } : batchConfig;
        
        if (!batchConfig || batchConfig.interval_ms <= 0) {
          setBatchConfig(newBatchConfig);
        }
        
        await autoSaveConfig('all');
        break;
      default:
        console.warn('未知的选择模式:', key);
    }
  };

  const getSelectionModeMenu = () => ({
    onClick: handleSelectionModeClick,
    items: [
      {
        key: 'first',
        label: '🎯 第一个',
      },
      {
        key: 'last', 
        label: '🎯 最后一个',
      },
      {
        key: 'match-original',
        label: '🔍 精确匹配', 
      },
      {
        key: 'random',
        label: '🎲 随机选择',
      },
      {
        key: 'all',
        label: '📋 批量全部',
      }
    ]
  });

  // 👆 操作类型相关函数
  const getOperationTypeLabel = () => {
    switch (operationType) {
      case 'tap': return '👆 点击';
      case 'long_press': return '⏸️ 长按';
      case 'double_tap': return '👆👆 双击';
      case 'swipe': return '👉 滑动';
      case 'input': return '⌨️ 输入';
      case 'wait': return '⏳ 等待';
      default: return '👆 点击';
    }
  };

  const handleOperationTypeClick = ({ key }: { key: string }) => {
    console.log('👆 操作类型菜单项被点击:', key);
    switch (key) {
      case 'tap':
        setOperationType('tap');
        break;
      case 'long_press':
        setOperationType('long_press');
        break;
      case 'double_tap':
        setOperationType('double_tap');
        break;
      case 'swipe':
        setOperationType('swipe');
        break;
      case 'input':
        setOperationType('input');
        break;
      case 'wait':
        setOperationType('wait');
        break;
      default:
        console.warn('未知的操作类型:', key);
    }
  };

  const getOperationTypeMenu = () => ({
    onClick: handleOperationTypeClick,
    items: [
      {
        key: 'tap',
        label: '👆 点击',
      },
      {
        key: 'long_press',
        label: '⏸️ 长按',
      },
      {
        key: 'double_tap',
        label: '👆👆 双击',
      },
      {
        key: 'swipe',
        label: '👉 滑动',
      },
      {
        key: 'input',
        label: '⌨️ 输入',
      },
      {
        key: 'wait',
        label: '⏳ 等待',
      }
    ]
  });

  // 🚀 生成智能选择协议
  const createSmartSelectionProtocol = () => {
    // ✅ 修复：使用用户实际选择的元素信息，避免硬编码回退值
    const selectedElement = selectionContext.selectedElement;
    
    // 优先使用有效的文本，避免空值导致硬编码回退
    let elementText = '';
    if (selectedElement?.text?.trim()) {
      elementText = selectedElement.text.trim();
    } else if (selectedElement?.content_desc?.trim()) {
      elementText = selectedElement.content_desc.trim();
    } else if (selectedElement?.resource_id?.trim()) {
      elementText = selectedElement.resource_id.trim();
    } else {
      elementText = '未知元素'; // 避免使用"智能操作 1"这样的误导性文本
    }
    
    const resourceId = selectedElement?.resource_id;
    
    console.log('🎯 [createSmartSelectionProtocol] 使用实际选择的元素:', {
      elementText,
      resourceId,
      hasValidText: !!selectedElement?.text?.trim(),
      hasValidDesc: !!selectedElement?.content_desc?.trim(),
      hasValidResourceId: !!selectedElement?.resource_id?.trim(),
      selectedElement: selectedElement ? {
        id: selectedElement.id,
        text: selectedElement.text,
        content_desc: selectedElement.content_desc,
        resource_id: selectedElement.resource_id,
        bounds: selectedElement.bounds
      } : null
    });

    return {
      anchor: {
        fingerprint: {
          text_content: elementText,
          resource_id: resourceId,
        },
      },
      selection: {
        mode: selectionMode,
        batch_config: selectionMode === 'all' ? {
          interval_ms: batchConfig.interval_ms,
          max_count: batchConfig.max_count,
          jitter_ms: batchConfig.jitter_ms,
          continue_on_error: batchConfig.continue_on_error,
          show_progress: batchConfig.show_progress,
        } : undefined,
      },
    };
  };

  // 🎯 执行智能选择（调试用）
  const executeSmartSelection = async () => {
    // 防重复点击
    if (executing) return;

    // 设备ID验证
    const deviceId = selectedDevice?.id;
    if (!deviceId) {
      message.warning('请先连接并选择ADB设备');
      return;
    }

    setExecuting(true);
    
    try {
      const { SmartSelectionService } = await import('../../services/smartSelectionService');
      const protocol = createSmartSelectionProtocol();
      
      console.log('🚀 [CompactStrategyMenu] 执行智能选择', {
        deviceId,
        stepId,
        selectionMode,
        batchConfig: selectionMode === 'all' ? batchConfig : null,
        protocol
      });

      // ✅ 恢复实际执行调用
      const result = await SmartSelectionService.executeSmartSelection(deviceId, protocol);
      
      // ✅ 用户可见的成功反馈
      const selectedCount = result.matched_elements?.selected_count || 1;
      message.success(
        `测试执行完成！${selectionMode === 'all' ? '批量' : '单次'}选择成功 - 操作了 ${selectedCount} 个元素`
      );
      
      console.log('✅ 智能选择执行成功:', result);
      
    } catch (error) {
      console.error('❌ 执行智能选择失败:', error);
      
      // ✅ 用户可见的错误反馈
      message.error(`测试执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
    } finally {
      setExecuting(false);
    }
  };

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
        menu={getSelectionModeMenu()}
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
          {getSelectionModeLabel()}
          <span style={{ color: "rgb(16, 185, 129)", fontSize: "12px", marginLeft: "4px" }}>✅</span>
          <span style={{ marginLeft: "4px" }}>▾</span>
        </Button>
      </Dropdown>

      {/* 第三个：操作方式按钮 */}
      <Dropdown
        menu={getOperationTypeMenu()}
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
          {getOperationTypeLabel()}
          <span style={{ color: "rgb(16, 185, 129)", fontSize: "12px", marginLeft: "4px" }}>✅</span>
          <span style={{ marginLeft: "4px" }}>▾</span>
        </Button>
      </Dropdown>

      {/* 🎯 批量配置面板 */}
      {selectionMode === 'all' && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "12px",
          background: "rgba(110, 139, 255, 0.05)",
          border: "1px solid rgba(110, 139, 255, 0.2)",
          borderRadius: "6px",
          width: "100%",
          marginTop: "8px"
        }}>
          <div style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#F8FAFC",
            marginBottom: "4px"
          }}>
            📋 批量执行配置
          </div>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* 间隔时间 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>间隔:</span>
              <input
                type="number"
                value={batchConfig.interval_ms}
                onChange={(e) => setBatchConfig({
                  ...batchConfig,
                  interval_ms: Math.max(1000, parseInt(e.target.value) || 2000)
                })}
                style={{
                  width: "60px",
                  height: "24px",
                  fontSize: "11px",
                  padding: "2px 4px",
                  border: "1px solid rgba(110, 139, 255, 0.3)",
                  borderRadius: "3px",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "#F8FAFC"
                }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>ms</span>
            </div>

            {/* 最大数量 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>最大:</span>
              <input
                type="number"
                value={batchConfig.max_count || 10}
                onChange={(e) => setBatchConfig({
                  ...batchConfig,
                  max_count: Math.max(1, parseInt(e.target.value) || 10)
                })}
                style={{
                  width: "50px",
                  height: "24px",
                  fontSize: "11px",
                  padding: "2px 4px",
                  border: "1px solid rgba(110, 139, 255, 0.3)",
                  borderRadius: "3px",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "#F8FAFC"
                }}
              />
            </div>

            {/* 错误处理 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={batchConfig.continue_on_error}
                onChange={(e) => setBatchConfig({
                  ...batchConfig,
                  continue_on_error: e.target.checked
                })}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>遇错继续</span>
            </div>

            {/* 显示进度 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={batchConfig.show_progress}
                onChange={(e) => setBatchConfig({
                  ...batchConfig,
                  show_progress: e.target.checked
                })}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>显示进度</span>
            </div>
          </div>
          
          {/* 测试按钮 */}
          <div style={{ marginTop: "8px", display: "flex", justifyContent: "center" }}>
            <Button
              size="small"
              type="primary"
              loading={executing}
              disabled={!selectedDevice || executing}
              onClick={executeSmartSelection}
              style={{
                fontSize: "11px",
                height: "28px",
                background: executing ? "#94A3B8" : (!selectedDevice ? "#6B7280" : "rgba(16, 185, 129, 0.8)"),
                borderColor: executing ? "#94A3B8" : (!selectedDevice ? "#6B7280" : "rgba(16, 185, 129, 0.9)")
              }}
            >
              {executing ? "🔄 执行中..." : (!selectedDevice ? "⚠️ 需要ADB设备" : "🧪 测试批量执行")}
            </Button>
          </div>

          {/* 🔧 高级排除规则（紧凑版） */}
          <div style={{ 
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(110, 139, 255, 0.2)"
          }}>
            <Collapse 
              activeKey={advancedRulesExpanded ? ['advanced-rules'] : []}
              onChange={(keys) => {
                setAdvancedRulesExpanded(keys.includes('advanced-rules'));
                console.log('🔧 高级规则面板状态:', keys.includes('advanced-rules') ? '展开' : '折叠');
              }}
              size="small"
              style={{ 
                background: "transparent",
                border: "1px solid rgba(110, 139, 255, 0.3)",
                borderRadius: "4px"
              }}
            >
              <Panel 
                header={
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                    🔧 高级排除规则 <span style={{ fontSize: "10px", opacity: 0.7 }}>(可选)</span>
                  </div>
                }
                key="advanced-rules"
              >
                <div style={{ padding: "8px 0" }}>
                  {/* 规则编辑器 */}
                  <ExcludeRuleEditor
                    rules={parseExcludeTextToRules(smartSelectionConfig.excludeText)}
                    onChange={(rules) => {
                      const excludeText = formatRulesToExcludeText(rules);
                      // TODO: 更新到状态管理
                      smartSelectionConfig.excludeText = excludeText;
                      console.log('规则更新:', excludeText);
                    }}
                    onTest={async (rule) => {
                      // TODO: 调用 Tauri 后端测试
                      message.info(`测试规则: ${rule.attr} ${rule.op} ${rule.value}`);
                      return 0;
                    }}
                    compact={true}
                  />

                  {/* 紧凑说明 */}
                  <div style={{ marginTop: "8px" }}>
                    <ExplanationGenerator
                      config={{
                        mode: smartSelectionConfig.mode as 'auto' | 'first' | 'last' | 'all' | 'manual',
                        autoExcludeEnabled: smartSelectionConfig.autoExcludeEnabled,
                        excludeRules: parseExcludeTextToRules(smartSelectionConfig.excludeText),
                        dedupeTolerance: smartSelectionConfig.dedupeTolerance,
                        enableLightValidation: smartSelectionConfig.enableLightValidation
                      }}
                      compact={true}
                    />
                  </div>
                </div>
              </Panel>
            </Collapse>
          </div>
        </div>
      )}

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
