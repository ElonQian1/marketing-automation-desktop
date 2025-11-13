// src/components/strategy-selector/CompactStrategyMenu.tsx
// module: ui | layer: ui | role: 紧凑策略选择菜单
// summary: 替代大块策略选择器的紧凑下拉菜单，集成到步骤卡片标题栏

import React, { useState, useCallback } from "react";
import { Dropdown, Button, Tooltip, message, Collapse } from "antd";
import { UNIFIED_STEP_SEQUENCE } from '../../config/step-sequence';
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
import { useAnalysisStateStore } from "../../stores/analysis-state-store";
import { useIntelligentAnalysis } from "../../hooks/useIntelligentAnalysis";  // 🆕 智能分析Hook
import { useAdb } from "../../application/hooks/useAdb";
import type { SelectionMode } from '../../types/smartSelection';
import type { ActionKind } from '../../types/smartScript';
import { ExcludeRuleEditor, type ExcludeRule } from '../smart-selection/ExcludeRuleEditor';
import { ExplanationGenerator } from '../smart-selection/ExplanationGenerator';
import { useElementSelectionStore } from '../../stores/ui-element-selection-store';
import { RandomConfigPanel } from './panels/RandomConfigPanel';
import { MatchOriginalConfigPanel } from './panels/MatchOriginalConfigPanel';
import { convertSelectionModeToBackend } from './utils/selection-mode-converter';
import { saveSelectionConfigWithFeedback } from './utils/selection-config-saver';
import { 
  StructuralMatchingModal, 
  type StructuralMatchingHierarchicalConfig,
  useStructuralMatchingData 
} from '../../modules/structural-matching';
import type { 
  BatchConfig, 
  RandomConfig,
  MatchOriginalConfig 
} from './types/selection-config';
import { 
  DEFAULT_BATCH_CONFIG, 
  DEFAULT_RANDOM_CONFIG,
  DEFAULT_MATCH_ORIGINAL_CONFIG 
} from './types/selection-config';
import { buildStrategyMenu, type StrategyMenuConfig } from './menus/strategy-menu-builder';
import { buildSelectionModeMenu, getSelectionModeLabel } from './menus/selection-mode-menu-builder';
import { buildOperationTypeMenu, getOperationTypeLabel } from './menus/operation-type-menu-builder';
import { BatchConfigPanel } from './panels/BatchConfigPanel';

const { Panel } = Collapse;

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

// ✅ 使用统一配置（从 step-sequence.ts 导入）
// 🎯 优先级调整：将结构匹配（卡片子树、叶子上下文）提到前两位
const SMART_STEPS: { step: SmartStep; label: string; candidateKey: string }[] = 
  UNIFIED_STEP_SEQUENCE.map(config => ({
    step: config.stepId as SmartStep,
    label: config.label,
    candidateKey: config.candidateKey,
  }));

interface CompactStrategyMenuProps {
  selector: IStrategySelector;
  events: StrategyEvents;
  disabled?: boolean;
  compact?: boolean;
  stepId?: string; // 新增：用于获取置信度数据
  onUpdateStepParameters?: (stepId: string, params: Record<string, unknown>) => void; // 🔑 新增：步骤参数更新回调
  // 🆕 初始配置（用于从步骤参数恢复状态）
  initialSelectionMode?: SelectionMode;
  initialOperationType?: ActionKind;
  initialBatchConfig?: BatchConfig;
  initialRandomConfig?: RandomConfig;
  initialMatchOriginalConfig?: MatchOriginalConfig;
  // 🔧 新增：额外按钮插槽
  extraButtons?: React.ReactNode;
}

const CompactStrategyMenu: React.FC<CompactStrategyMenuProps> = ({
  selector,
  events,
  disabled = false,
  compact = true,
  stepId,
  onUpdateStepParameters, // 🔑 接收步骤参数更新回调
  // 🆕 接收初始配置
  initialSelectionMode = 'first',
  initialOperationType = 'tap',
  initialBatchConfig = DEFAULT_BATCH_CONFIG,
  initialRandomConfig = DEFAULT_RANDOM_CONFIG,
  initialMatchOriginalConfig = DEFAULT_MATCH_ORIGINAL_CONFIG,
  // 🔧 接收额外按钮
  extraButtons,
}) => {
  // 🔇 日志优化：移除组件挂载日志（过于频繁）
  // console.log("🚀 [CompactStrategyMenu] 组件已挂载", { stepId });
  const [showExpandedView, setShowExpandedView] = useState(false);
  
  // 🎯 新增：智能选择状态管理（使用初始配置）
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(initialSelectionMode);
  const [operationType, setOperationType] = useState<ActionKind>(initialOperationType);
  const [batchConfig, setBatchConfig] = useState<BatchConfig>(initialBatchConfig);
  
  // 🆕 随机选择配置（使用初始配置）
  const [randomConfig, setRandomConfig] = useState<RandomConfig>(initialRandomConfig);
  
  // 🎯 精准匹配配置（使用初始配置）
  const [matchOriginalConfig, setMatchOriginalConfig] = useState<MatchOriginalConfig>(initialMatchOriginalConfig);
  
  // 🎯 获取用户实际选择的UI元素
  const { context: selectionContext } = useElementSelectionStore();
  const cardStore = useStepCardStore();

  // 🎯 【架构升级】使用统一数据服务替换全局变量
  const { 
    data: unifiedElementData, 
    loading: dataLoading, 
    error: dataError,
    fetchData  // ✅ 修复：获取fetchData函数用于手动触发数据获取
  } = useStructuralMatchingData({
    enableValidation: true,
    enableEnhancement: true,
    onError: (error) => {
      console.error('❌ [CompactStrategyMenu] 数据获取失败:', error);
      message.error('元素数据获取失败，请重试');
    },
    onSuccess: (data) => {
      console.log('✅ [CompactStrategyMenu] 统一数据获取成功:', data);
    }
  });

  // 🎯 新增：执行状态管理和ADB设备管理
  const [executing, setExecuting] = useState(false);
  const { selectedDevice } = useAdb();
  
  // 🆕 智能分析Hook
  const { startAnalysis, isAnalyzing } = useIntelligentAnalysis();

  // 🔧 高级规则面板状态
  const [advancedRulesExpanded, setAdvancedRulesExpanded] = useState(false);

  // 🏗️ 结构匹配模态框状态
  const [structuralMatchingVisible, setStructuralMatchingVisible] = useState(false);
  const [structuralMatchingConfig, setStructuralMatchingConfig] = useState<StructuralMatchingHierarchicalConfig | null>(null);

  // ✅ 【核心修复】数据格式标准化函数 - 统一转换为下划线命名
  const normalizeElementData = useCallback((element: Record<string, unknown> | null | undefined) => {
    if (!element) return null;
    
    return {
      id: element.id,
      resource_id: element.resource_id || element.resourceId || element['resource-id'] || '',
      content_desc: element.content_desc || element.contentDesc || element.contentDescription || element['content-desc'] || '',
      text: element.text || element.elementText || element.textContent || '',
      class_name: element.class_name || element.className || '',
      bounds: element.bounds || '[0,0][0,0]',
      is_clickable: element.is_clickable || element.clickable || false,
      xpath: element.xpath || '',
      xmlCacheId: element.xmlCacheId || '',
      children: element.children || []
    };
  }, []);

  // ✅ 【核心修复】打开结构匹配模态框时触发数据获取
  const handleOpenStructuralMatching = useCallback(async () => {
    console.log('🔍 [CompactStrategyMenu] 打开结构匹配模态框');
    
    // 1. 获取数据源信息
    const card = stepId ? cardStore.cards[stepId] : undefined;
    const elementId = card?.original_element?.id || selectionContext?.selectedElement?.id;
    const xmlCacheId = card?.xmlSnapshot?.xmlCacheId;  // ✅ 修复：从xmlSnapshot中获取
    
    console.log('📊 [CompactStrategyMenu] 数据源信息:', {
      stepId,
      hasCard: !!card,
      elementId,
      xmlCacheId,
      cardElement: card?.original_element,
      selectionElement: selectionContext?.selectedElement
    });
    
    // 2. 触发数据获取
    if (elementId && fetchData) {
      try {
        await fetchData(elementId, xmlCacheId, {
          stepCard: card?.original_element as unknown as Record<string, unknown> | undefined,
          selectionContext: selectionContext?.selectedElement as unknown as Record<string, unknown> | undefined
        });
        console.log('✅ [CompactStrategyMenu] 数据获取完成');
      } catch (error) {
        console.error('❌ [CompactStrategyMenu] 数据获取失败:', error);
      }
    } else {
      console.warn('⚠️ [CompactStrategyMenu] 缺少必要信息，无法获取数据:', {
        elementId,
        hasFetchData: !!fetchData
      });
    }
    
    // 3. 打开模态框
    setStructuralMatchingVisible(true);
  }, [stepId, cardStore, selectionContext, fetchData]);

  // 🔑 新增：更新步骤参数中的决策链配置
  const updateDecisionChainConfig = React.useCallback((
    mode: SelectionMode,
    opType: ActionKind,
    batchCfg?: BatchConfig | null,
    randomCfg?: RandomConfig | null,
    matchCfg?: MatchOriginalConfig | null
  ) => {
    if (!stepId || !onUpdateStepParameters) return;
    
    const decisionChain: Record<string, unknown> = {
      executionChain: 'intelligent_chain',
      selectionMode: mode,
      operationType: opType,
    };
    
    // 根据模式添加相应的配置
    if (mode === 'all' && batchCfg) {
      decisionChain.batchConfig = batchCfg;
    } else if (mode === 'random' && randomCfg) {
      decisionChain.randomConfig = randomCfg;
    } else if (mode === 'match-original' && matchCfg) {
      decisionChain.matchOriginalConfig = matchCfg;
    }
    
    console.log('🔄 [CompactStrategyMenu] 更新决策链配置到步骤参数:', {
      stepId,
      decisionChain
    });
    
    onUpdateStepParameters(stepId, { decisionChain });
  }, [stepId, onUpdateStepParameters]);

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
  
  // ✅ 统一使用 analysis-state-store 获取评分
  const { getStepConfidence, setFinalScores } = useAnalysisStateStore();

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

    const { type, stepName, key } = selector.activeStrategy;
    const icon = STRATEGY_ICONS[type];
    const baseLabel = STRATEGY_LABELS[type];

    if (type === "smart-single" && stepName) {
      const step = SMART_STEPS.find((s) => s.step === stepName);
      return `${icon} ${step?.label || stepName}`;
    }

    // 🏗️ 如果是静态策略且key为structural_matching，显示"结构匹配"
    if (type === "static" && key === "structural_matching") {
      return "🏗️ 结构匹配";
    }

    return `${icon} ${baseLabel}`;
  };

  // 构建策略选择菜单
  const getStrategyMenu = () => {
    const menuConfig: StrategyMenuConfig = {
      selector,
      events,
      stepId,
      cardStore,
      setFinalScores,
      getStepConfidence,
      recommendedKey,
      onUpdateStepParameters,
      handleOpenStructuralMatching,
      dataError,
      dataLoading,
    };

    return buildStrategyMenu(menuConfig);
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

      // 🔑 【关键修复】同步更新步骤的 params.smartSelection
      // 确保测试按钮执行时使用最新的模式配置 + 必要的默认字段
      if (onUpdateStepParameters && stepId) {
        console.log('🔄 [CompactStrategyMenu] 同步更新步骤参数:', {
          stepId,
          mode,
          batchConfigToSave
        });
        
        // 🎯 使用部分更新模式，补充必要的默认字段
        // ⚠️ 关键修复：保存到脚本后重新加载时，这些字段必须存在
        onUpdateStepParameters(stepId, {
          smartSelection: {
            mode: mode,
            batchConfig: batchConfigToSave,
            // 🔥 补充默认字段，防止保存后丢失
            textMatchingMode: 'exact',
            antonymCheckEnabled: false,
            semanticAnalysisEnabled: false,
            minConfidence: 0.8,
          }
        } as Record<string, unknown>); // 类型断言为通用对象
        
        console.log('✅ [CompactStrategyMenu] 步骤参数同步请求已发送（含默认字段）:', {
          stepId,
          mode,
          batchConfig: batchConfigToSave,
          defaults: {
            textMatchingMode: 'exact',
            antonymCheckEnabled: false,
            semanticAnalysisEnabled: false
          }
        });
      } else {
        if (!onUpdateStepParameters) {
          console.warn('⚠️ [CompactStrategyMenu] onUpdateStepParameters 回调不存在，无法同步步骤参数');
        }
        if (!stepId) {
          console.warn('⚠️ [CompactStrategyMenu] stepId 不存在，无法同步步骤参数');
        }
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
    
    if (!stepId) {
      console.warn('⚠️ [CompactStrategyMenu] 无stepId，跳过保存');
      return;
    }

    // 🔥 修复：直接使用最新的模式值保存，避免闭包陷阱
    const saveConfigDirectly = async (mode: SelectionMode, batchCfg: BatchConfig | null) => {
      try {
        console.log('📤 [CompactStrategyMenu] 直接保存配置:', {
          stepId,
          mode,
          batchConfig: batchCfg
        });

        await invoke('save_smart_selection_config', {
          stepId: stepId,
          selectionMode: mode,
          batchConfig: batchCfg
        });

        // 同时用 selectorId 保存一份（兜底）
        const state = useStepCardStore.getState();
        const canonicalId = state.aliasToCanonical[stepId];
        const card = canonicalId ? state.cards[canonicalId] : undefined;
        
        if (card?.elementUid) {
          await invoke('save_smart_selection_config', {
            stepId: card.elementUid,
            selectionMode: mode,
            batchConfig: batchCfg
          });
        }

        message.success(`已切换到: ${getModeLabel(mode)}`);
        console.log('✅ [模式切换] 配置保存成功:', { mode, batchConfig: batchCfg });
      } catch (error) {
        console.error('❌ [模式切换] 保存配置失败:', error);
        message.error(`保存失败: ${error}`);
      }
    };

    const getModeLabel = (mode: SelectionMode) => {
      switch (mode) {
        case 'first': return '🎯 第一个';
        case 'last': return '🎯 最后一个';
        case 'all': return '📋 批量全部';
        case 'match-original': return '🎯 精确匹配';
        case 'random': return '🎲 随机选择';
        default: return mode;
      }
    };
    
    switch (key) {
      case 'first':
        setSelectionMode('first');
        console.log('选择第一个模式');
        await saveConfigDirectly('first', null);
        // ✅ 同时更新步骤参数
        updateDecisionChainConfig('first', operationType, null, null, null);
        break;
      case 'last':
        setSelectionMode('last');
        console.log('选择最后一个模式');
        await saveConfigDirectly('last', null);
        // ✅ 同时更新步骤参数
        updateDecisionChainConfig('last', operationType, null, null, null);
        break;
      case 'match-original':
        setSelectionMode('match-original');
        console.log('选择精确匹配模式', { matchOriginalConfig });
        // 🎯 确保精准匹配配置有效
        const newMatchOriginalConfig: MatchOriginalConfig = !matchOriginalConfig || matchOriginalConfig.min_confidence === undefined ? {
          min_confidence: 0.85,
          fallback_to_first: true,
          strict_mode: true,
          match_attributes: ['text', 'resource_id', 'content_desc'],
        } : matchOriginalConfig;
        
        if (!matchOriginalConfig || matchOriginalConfig.min_confidence === undefined) {
          setMatchOriginalConfig(newMatchOriginalConfig);
        }
        
        // ✅ 使用工具函数保存配置
        await saveSelectionConfigWithFeedback({
          stepId: stepId!,
          selectorId: stepId,
          mode: 'match-original',
          matchOriginalConfig: newMatchOriginalConfig,
          message
        });
        // ✅ 同时更新步骤参数
        updateDecisionChainConfig('match-original', operationType, null, null, newMatchOriginalConfig);
        break;
      case 'random':
        setSelectionMode('random');
        console.log('选择随机模式', { randomConfig });
        // 🎲 确保随机配置有效
        const newRandomConfig: RandomConfig = !randomConfig || randomConfig.seed === undefined ? {
          seed: null,  // null 表示自动生成
          ensure_stable_sort: true,
          custom_seed_enabled: false,  // 默认使用自动种子
        } : randomConfig;
        
        if (!randomConfig || randomConfig.seed === undefined) {
          setRandomConfig(newRandomConfig);
        }
        
        // ✅ 使用工具函数保存配置
        await saveSelectionConfigWithFeedback({
          stepId: stepId!,
          selectorId: stepId,  // 使用 stepId 作为 selectorId（兜底逻辑会自动处理）
          mode: 'random',
          randomConfig: newRandomConfig,
          message
        });
        // ✅ 同时更新步骤参数
        updateDecisionChainConfig('random', operationType, null, newRandomConfig, null);
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
          match_direction: 'forward' as const,  // 🆕 默认正向
        } : batchConfig;
        
        if (!batchConfig || batchConfig.interval_ms <= 0) {
          setBatchConfig(newBatchConfig);
        }
        
        // ✅ 使用计算出的最新配置
        await saveConfigDirectly('all', newBatchConfig);
        // ✅ 同时更新步骤参数
        updateDecisionChainConfig('all', operationType, newBatchConfig, null, null);
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
    const newOperationType = key as ActionKind;
    
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
        return;
    }
    
    // ✅ 同时更新步骤参数
    updateDecisionChainConfig(
      selectionMode, 
      newOperationType,
      selectionMode === 'all' ? batchConfig : null,
      selectionMode === 'random' ? randomConfig : null,
      selectionMode === 'match-original' ? matchOriginalConfig : null
    );
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

    // 🔥 使用统一的类型转换函数
    const convertedMode = convertSelectionModeToBackend(
      selectionMode, 
      batchConfig, 
      randomConfig,
      matchOriginalConfig
    );

    return {
      anchor: {
        fingerprint: {
          text_content: elementText,
          resource_id: resourceId,
        },
      },
      selection: {
        mode: convertedMode,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
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

      {/* 🔧 额外按钮插槽（放在策略按钮组内部） */}
      {extraButtons}

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
                onChange={(e) => {
                  const newInterval = Math.max(1000, parseInt(e.target.value) || 2000);
                  setBatchConfig({
                    ...batchConfig,
                    interval_ms: newInterval
                  });
                }}
                onBlur={async () => {
                  // 🔥 修复：失去焦点时保存配置
                  if (selectionMode === 'all') {
                    console.log('🔧 [间隔修改] 保存配置:', batchConfig);
                    await autoSaveConfig('all');
                  }
                }}
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
                onChange={(e) => {
                  const newMaxCount = Math.max(1, parseInt(e.target.value) || 10);
                  setBatchConfig({
                    ...batchConfig,
                    max_count: newMaxCount
                  });
                }}
                onBlur={async () => {
                  // 🔥 修复：失去焦点时保存配置
                  if (selectionMode === 'all') {
                    console.log('🔧 [数量修改] 保存配置:', batchConfig);
                    await autoSaveConfig('all');
                  }
                }}
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
                onChange={async (e) => {
                  setBatchConfig({
                    ...batchConfig,
                    continue_on_error: e.target.checked
                  });
                  // 🔥 修复：立即保存配置
                  if (selectionMode === 'all') {
                    console.log('🔧 [遇错继续修改] 保存配置');
                    await autoSaveConfig('all');
                  }
                }}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>遇错继续</span>
            </div>

            {/* 显示进度 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={batchConfig.show_progress}
                onChange={async (e) => {
                  setBatchConfig({
                    ...batchConfig,
                    show_progress: e.target.checked
                  });
                  // 🔥 修复：立即保存配置
                  if (selectionMode === 'all') {
                    console.log('🔧 [显示进度修改] 保存配置');
                    await autoSaveConfig('all');
                  }
                }}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>显示进度</span>
            </div>

            {/* 🆕 匹配方向 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>方向:</span>
              <select
                value={batchConfig.match_direction || 'forward'}
                onChange={async (e) => {
                  const newDirection = e.target.value as 'forward' | 'backward';
                  const newBatchConfig = {
                    ...batchConfig,
                    match_direction: newDirection
                  };
                  setBatchConfig(newBatchConfig);
                  
                  // 🔥 立即保存配置（使用新配置）
                  if (selectionMode === 'all' && stepId) {
                    console.log('🔧 [匹配方向修改] 保存配置:', newDirection);
                    try {
                      await invoke('save_smart_selection_config', {
                        stepId: stepId,
                        selectionMode: 'all',
                        batchConfig: newBatchConfig  // ✅ 使用最新配置
                      });
                      message.success(`匹配方向已更新为: ${newDirection === 'forward' ? '正向↓' : '反向↑'}`);
                      console.log('✅ [匹配方向] 配置保存成功:', newBatchConfig);
                    } catch (error) {
                      console.error('❌ [匹配方向] 保存失败:', error);
                      message.error(`保存失败: ${error}`);
                    }
                  }
                }}
                style={{
                  height: "24px",
                  fontSize: "11px",
                  padding: "0 4px",
                  border: "1px solid rgba(110, 139, 255, 0.3)",
                  borderRadius: "3px",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "#F8FAFC",
                  cursor: "pointer"
                }}
              >
                <option value="forward">↓ 正向</option>
                <option value="backward">↑ 反向</option>
              </select>
              <Tooltip title="正向:从上到下执行 | 反向:从下到上执行" placement="top">
                <span style={{ fontSize: "11px", color: "#6E8BFF", cursor: "help" }}>?</span>
              </Tooltip>
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

      {/* 🎲 随机配置面板 */}
      {selectionMode === 'random' && (
        <RandomConfigPanel
          config={randomConfig}
          onChange={(newConfig) => {
            setRandomConfig(newConfig);
            // 🔥 实时保存配置
            if (stepId) {
              saveSelectionConfigWithFeedback({
                stepId,
                selectorId: stepId,  // 使用 stepId 作为 selectorId（兜底逻辑会自动处理）
                mode: 'random',
                randomConfig: newConfig,
                message
              }).catch(console.error);
            }
          }}
        />
      )}

      {/* 🎯 精准匹配配置面板 */}
      {selectionMode === 'match-original' && (
        <MatchOriginalConfigPanel
          config={matchOriginalConfig}
          onChange={(newConfig) => {
            setMatchOriginalConfig(newConfig);
            // 🔥 实时保存配置
            if (stepId) {
              saveSelectionConfigWithFeedback({
                stepId,
                selectorId: stepId,
                mode: 'match-original',
                matchOriginalConfig: newConfig,
                message
              }).catch(console.error);
            }
          }}
        />
      )}

      {/* 工具按钮组 */}
      <div style={{ display: "flex", gap: "2px" }}>
        <Tooltip title="重新分析">
          <Button
            size="small"
            type="text"
            icon={<RefreshCcwIcon size={12} />}
            onClick={async () => {
              console.log("🔄 [CompactStrategyMenu] 重新分析按钮点击:", {
                disabled,
                stepId,
                analysisStatus: selector.analysis.status,
                activeStrategy: selector.activeStrategy,
                hasSelector: !!selector,
                timestamp: new Date().toISOString(),
              });

              // 🆕 调用智能分析API
              if (!stepId) {
                message.warning('请先创建步骤卡片');
                return;
              }

              const card = cardStore.cards[stepId];
              if (!card || !card.elementContext) {
                message.warning('步骤卡片数据不完整');
                return;
              }

              try {
                // 构建分析配置
                const analysisConfig = {
                  element_context: {
                    snapshot_id: card.xmlSnapshot?.xmlCacheId || '',
                    element_path: card.elementContext.xpath || '',
                    element_text: card.elementContext.text,
                    element_bounds: card.elementContext.bounds,
                    element_type: card.elementContext.className,
                    key_attributes: {
                      resource_id: card.elementContext.resourceId || '',
                      class_name: card.elementContext.className || ''
                    }
                  },
                  step_id: stepId,
                  lock_container: false,
                  enable_smart_candidates: true,
                  enable_static_candidates: true
                };

                console.log('🚀 [重新分析] 启动智能分析:', analysisConfig);
                await startAnalysis(analysisConfig);
              } catch (error) {
                console.error('❌ [重新分析] 失败:', error);
                message.error(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
              }

              // 同时触发原有的重新分析逻辑（向后兼容）
              events.onReanalyze();
            }}
            disabled={disabled || isAnalyzing}
            loading={isAnalyzing}
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

      {/* 🏗️ 结构匹配模态框 */}
      <StructuralMatchingModal
        visible={structuralMatchingVisible}
        selectedElement={(() => {
          console.log('🔍 [CompactStrategyMenu] 准备模态框数据:');
          console.log('  stepId:', stepId);
          console.log('  unifiedElementData:', unifiedElementData);
          console.log('  dataLoading:', dataLoading);
          console.log('  dataError:', dataError);
          
          // ✅ 【核心修复】优先使用统一数据服务的结果
          if (unifiedElementData?.element) {
            console.log('✅ 使用统一数据服务的元素');
            return unifiedElementData.element as unknown as Record<string, unknown>;
          }
          
          // Fallback 1: 从步骤卡片获取并标准化
          const cardId = stepId ? cardStore.byStepId[stepId] : undefined;
          const card = cardId ? cardStore.cards[cardId] : undefined;
          console.log('🔍 Fallback 1 检查:', {
            stepId,
            cardId,
            hasCard: !!card,
            hasOriginalElement: !!card?.original_element,
            cardKeys: card ? Object.keys(card) : [],
            originalElementKeys: card?.original_element ? Object.keys(card.original_element) : []
          });
          if (card?.original_element) {
            console.log('⚠️ Fallback 1: 使用步骤卡片数据', card.original_element);
            return normalizeElementData(card.original_element);
          }
          
          // Fallback 2: 从选择上下文获取并标准化
          console.log('🔍 Fallback 2 检查:', {
            hasSelectionContext: !!selectionContext,
            hasSelectedElement: !!selectionContext?.selectedElement,
            selectedElement: selectionContext?.selectedElement
          });
          if (selectionContext?.selectedElement) {
            console.log('⚠️ Fallback 2: 使用选择上下文数据');
            return normalizeElementData(selectionContext.selectedElement as unknown as Record<string, unknown>);
          }
          
          // Fallback 3: 空数据（标准格式）
          console.warn('⚠️ Fallback 3: 使用空数据 - 所有数据源都为空！');
          console.warn('  这通常意味着：1) stepId为空 2) card.original_element不存在 3) selectionContext为空');
          return {
            id: 'fallback_empty',
            resource_id: '',
            content_desc: '',
            text: '',
            class_name: '',
            bounds: '[0,0][0,0]',
            is_clickable: false,
            xpath: '',
            children: []
          };
        })()}
        initialConfig={structuralMatchingConfig}
        onClose={() => setStructuralMatchingVisible(false)}
        onConfirm={(config, structuralSignatures) => {
          console.log('✅ [CompactStrategyMenu] 保存结构匹配配置', config);
          console.log('🏗️ [CompactStrategyMenu] 收到的 structural_signatures:', structuralSignatures);
          
          // 保存到本地状态
          setStructuralMatchingConfig(config);
          
          // 🏗️ 【核心修复】直接使用模态框生成的 structural_signatures
          if (onUpdateStepParameters && stepId && structuralSignatures) {
            onUpdateStepParameters(stepId, {
              structural_signatures: structuralSignatures,
              // 标记匹配策略为结构匹配，供执行网关进行模式分流
              matchingStrategy: 'structural',
              // 保留原始配置用于UI显示
              _structural_matching_ui_config: config
            } as Record<string, unknown>);
            
            console.log('✅ [CompactStrategyMenu] structural_signatures 已同步到步骤参数');
          } else {
            if (!onUpdateStepParameters) {
              console.warn('⚠️ [CompactStrategyMenu] onUpdateStepParameters 回调不存在');
            }
            if (!stepId) {
              console.warn('⚠️ [CompactStrategyMenu] stepId 不存在');
            }
            if (!structuralSignatures) {
              console.warn('⚠️ [CompactStrategyMenu] structuralSignatures 为空，未能生成骨架数据');
            }
          }
          
          // 🔥 CRITICAL: 保存到后端Store（测试按钮需要从Store读取）
          if (stepId && structuralSignatures) {
            saveSelectionConfigWithFeedback({
              stepId,
              selectorId: stepId,
              mode: selectionMode,
              batchConfig: batchConfig,
              structuralSignatures: structuralSignatures,  // 🔥 传递结构签名
              message
            }).catch((error) => {
              console.error('❌ [CompactStrategyMenu] 保存结构签名到Store失败:', error);
            });
          }
          
          setStructuralMatchingVisible(false);
          message.success('结构匹配配置已保存');
        }}
      />
    </div>
  );
};

export default CompactStrategyMenu;
