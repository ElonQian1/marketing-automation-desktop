// src/modules/universal-ui/hooks/useStepStrategy.ts
// module: universal-ui | layer: hooks | role: hook
// summary: 步骤策略管理Hook，封装inspectorStore的读写操作供UI使用

import { useCallback, useEffect, useMemo } from 'react';
import { 
  useInspectorStore, 
  useCurrentStrategy, 
  useStrategyActions,
  type StrategyMode 
} from '../stores/inspectorStore';
import type { 
  ElementDescriptor, 
  ManualStrategy, 
  SmartStrategy, 
  UnifiedStrategy,
  SmartMatchVariant 
} from '../domain/public/selector/StrategyContracts';

/**
 * 步骤策略状态接口
 */
export interface StepStrategyState {
  /** 当前选中的元素 */
  element: ElementDescriptor | null;
  /** 策略模式 */
  mode: StrategyMode;
  /** 当前策略 */
  current: ManualStrategy | SmartStrategy | null;
  /** 是否正在生成策略 */
  isGenerating: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否已初始化 */
  initialized: boolean;
  /** 统一策略格式 */
  unified: UnifiedStrategy | null;
}

/**
 * 步骤策略操作接口
 */
export interface StepStrategyActions {
  /** 设置元素并生成策略 */
  setElement: (element: ElementDescriptor) => Promise<void>;
  /** 切换到手动模式 */
  switchToManual: () => void;
  /** 切换到智能模式 */
  switchToSmart: () => Promise<void>;
  /** 返回启用智能策略 */
  returnToSmart: () => Promise<void>;
  /** 刷新智能策略 */
  refreshSmart: () => Promise<void>;
  /** 采用智能策略为手动策略 */
  adoptAsManual: () => void;
  /** 更新手动策略 */
  updateManualStrategy: (strategy: ManualStrategy) => void;
  /** 清除当前状态 */
  clear: () => void;
}

/**
 * 策略详细信息接口
 */
export interface StrategyDetails {
  /** 策略类型标签 */
  typeLabel: string;
  /** 策略描述 */
  description: string;
  /** 选择器信息 */
  selector: {
    css?: string;
    xpath?: string;
    display: string;
  };
  /** 置信度或评分 */
  confidence?: number;
  /** 变体信息（智能策略专用） */
  variant?: {
    type: SmartMatchVariant;
    label: string;
    params?: Record<string, any>;
  };
  /** 元数据 */
  metadata: {
    provider?: string;
    version?: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

/**
 * 步骤策略管理Hook
 */
export function useStepStrategy() {
  const currentState = useCurrentStrategy();
  const actions = useStrategyActions();
  const store = useInspectorStore();

  // === 状态计算 ===
  const state: StepStrategyState = useMemo(() => ({
    element: currentState.element,
    mode: currentState.mode,
    current: currentState.current,
    isGenerating: currentState.isGenerating,
    error: currentState.error,
    initialized: store.initialized,
    unified: store.getUnifiedStrategy()
  }), [currentState, store.initialized, store.getUnifiedStrategy]);

  // === 操作方法 ===
  const stepActions: StepStrategyActions = useMemo(() => ({
    setElement: actions.setElement,
    
    switchToManual: () => {
      console.log('🔄 Hook: 切换到手动模式');
      actions.toManual();
    },
    
    switchToSmart: async () => {
      console.log('🔄 Hook: 切换到智能模式');
      await actions.toSmart();
    },
    
    returnToSmart: async () => {
      console.log('🔄 Hook: 返回启用智能策略');
      await actions.toSmart();
    },
    
    refreshSmart: actions.refreshSmart,
    adoptAsManual: actions.adoptSmartAsManual,
    
    updateManualStrategy: (strategy: ManualStrategy) => {
      console.log('🔄 Hook: 更新手动策略');
      store.setManual(strategy);
    },
    
    clear: actions.clear
  }), [actions, store.setManual]);

  // === 策略详细信息 ===
  const details: StrategyDetails | null = useMemo(() => {
    if (!state.current) return null;

    if (state.current.kind === 'manual') {
      return getManualStrategyDetails(state.current);
    } else {
      return getSmartStrategyDetails(state.current);
    }
  }, [state.current]);

  // === 便捷判断方法 ===
  const utils = useMemo(() => ({
    /** 是否为手动模式 */
    isManual: state.mode === 'manual',
    /** 是否为智能模式 */
    isSmart: state.mode === 'smart',
    /** 是否有策略 */
    hasStrategy: !!state.current,
    /** 是否为XPath直接策略 */
    isXPathDirect: state.current?.kind === 'manual' && 
                   (state.current as ManualStrategy).type === 'xpath-direct',
    /** 是否可以切换模式 */
    canSwitchMode: !!state.element && !state.isGenerating,
    /** 是否可以刷新 */
    canRefresh: state.mode === 'smart' && !state.isGenerating,
    /** 是否有错误 */
    hasError: !!state.error
  }), [state]);

  // === 效果处理 ===
  useEffect(() => {
    if (state.error) {
      console.warn('⚠️ 策略Hook错误:', state.error);
    }
  }, [state.error]);

  return {
    state,
    actions: stepActions,
    details,
    utils
  };
}

/**
 * 获取手动策略详细信息
 */
function getManualStrategyDetails(strategy: ManualStrategy): StrategyDetails {
  const typeLabels: Record<string, string> = {
    'xpath-direct': 'XPath直接',
    'custom': '自定义',
    'strict': '严格匹配',
    'relaxed': '宽松匹配'
  };

  return {
    typeLabel: typeLabels[strategy.type] || '手动策略',
    description: strategy.notes || '手动配置的匹配策略',
    selector: {
      css: strategy.selector.css,
      xpath: strategy.selector.xpath,
      display: strategy.selector.xpath || strategy.selector.css || '无选择器'
    },
    confidence: 1.0, // 手动策略默认100%置信度
    metadata: {
      version: '1.0.0',
      createdAt: strategy.createdAt,
      updatedAt: strategy.createdAt
    }
  };
}

/**
 * 获取智能策略详细信息
 */
function getSmartStrategyDetails(strategy: SmartStrategy): StrategyDetails {
  const variantLabels: Record<SmartMatchVariant, string> = {
    'self-anchor': '自我锚点',
    'child-anchor': '子节点锚点',
    'parent-clickable': '父可点击',
    'region-scoped': '区域限定',
    'neighbor-relative': '邻居相对',
    'index-fallback': '索引兜底'
  };

  return {
    typeLabel: '智能策略',
    description: strategy.selector.rationale || '智能生成的匹配策略',
    selector: {
      css: strategy.selector.css,
      xpath: strategy.selector.xpath,
      display: strategy.selector.css || strategy.selector.xpath || '无选择器'
    },
    confidence: strategy.confidence || strategy.selector.score,
    variant: {
      type: strategy.selector.variant,
      label: variantLabels[strategy.selector.variant] || strategy.selector.variant,
      params: strategy.selector.params
    },
    metadata: {
      provider: strategy.provider,
      version: strategy.version,
      createdAt: strategy.generatedAt,
      updatedAt: strategy.generatedAt
    }
  };
}

/**
 * 策略信息显示Hook（用于只读显示）
 */
export function useStrategyDisplay() {
  const { state, details, utils } = useStepStrategy();
  
  return {
    hasStrategy: utils.hasStrategy,
    mode: state.mode,
    typeLabel: details?.typeLabel || '无策略',
    description: details?.description || '',
    confidence: details?.confidence,
    variant: details?.variant,
    selector: details?.selector,
    isLoading: state.isGenerating,
    error: state.error
  };
}

/**
 * 策略切换Hook（用于操作按钮）
 */
export function useStrategySwitch() {
  const { state, actions, utils } = useStepStrategy();
  
  const switchToManual = useCallback(() => {
    if (utils.canSwitchMode) {
      actions.switchToManual();
    }
  }, [actions.switchToManual, utils.canSwitchMode]);
  
  const switchToSmart = useCallback(async () => {
    if (utils.canSwitchMode) {
      await actions.switchToSmart();
    }
  }, [actions.switchToSmart, utils.canSwitchMode]);
  
  const returnToSmart = useCallback(async () => {
    if (utils.canSwitchMode) {
      await actions.returnToSmart();
    }
  }, [actions.returnToSmart, utils.canSwitchMode]);
  
  return {
    mode: state.mode,
    canSwitch: utils.canSwitchMode,
    isLoading: state.isGenerating,
    switchToManual,
    switchToSmart,
    returnToSmart,
    refresh: actions.refreshSmart,
    adopt: actions.adoptAsManual
  };
}