// src/modules/universal-ui/stores/inspectorStore.ts
// module: universal-ui | layer: stores | role: state-management
// summary: 策略检查器状态管理，支持手动/智能策略切换与回退

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  ElementDescriptor, 
  ManualStrategy, 
  SmartStrategy, 
  AnyStrategy,
  UnifiedStrategy 
} from '../domain/public/selector/StrategyContracts';
import { GenerateSmartStrategyUseCase } from '../application/usecases/GenerateSmartStrategyUseCase';
import { LegacyManualAdapter } from '../application/compat/LegacyManualAdapter';

/**
 * 策略模式类型
 */
export type StrategyMode = 'manual' | 'smart';

/**
 * 分析状态枚举
 */
export type AnalysisState = 'idle' | 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * 策略类型枚举
 */
export type StrategyType = 'intelligent' | 'smart-manual' | 'user-static';

/**
 * 分析进度信息
 */
export interface AnalysisProgress {
  currentStep: number;
  totalSteps: number;
  currentStepName: string;
  estimatedTimeLeft?: number;
}

/**
 * 智能分析步骤
 */
export interface SmartAnalysisStep {
  key: string;
  name: string;
  description: string;
  score: number;
  isRecommended: boolean;
  strategy: SmartStrategy;
}

/**
 * 用户自建策略
 */
export interface UserStaticStrategy {
  key: string;
  name: string;
  description: string;
  selectorType: 'xpath' | 'css' | 'hybrid';
  selector: string;
  validation?: {
    expectedText?: string;
    expectedCount?: number;
    mustBeClickable?: boolean;
  };
  createdAt: number;
  pinned?: boolean;
}

/**
 * 策略检查器状态接口
 */
interface InspectorState {
  // === 核心状态 ===
  /** 当前选中的元素 */
  element: ElementDescriptor | null;
  /** 当前策略模式 */
  mode: StrategyMode;
  /** 当前活跃的策略 */
  current: AnyStrategy | null;
  
  // === 新增：分析状态 ===
  /** 分析状态 */
  analysisState: AnalysisState;
  /** 分析进度 */
  analysisProgress: AnalysisProgress | null;
  /** 分析任务ID */
  analysisJobId: string | null;
  /** 智能分析步骤结果 */
  smartSteps: SmartAnalysisStep[];
  /** 推荐的策略键 */
  recommendedStepKey: string | null;
  /** 推荐置信度 */
  recommendedConfidence: number | null;
  /** 用户自建策略列表 */
  userStrategies: UserStaticStrategy[];
  /** 当前激活的策略类型 */
  activeStrategyType: StrategyType;
  /** 当前激活的策略键 */
  activeStrategyKey: string | null;
  /** 是否为默认/临时策略 */
  isUsingDefaultStrategy: boolean;
  /** 是否自动跟随智能推荐 */
  autoFollowSmart: boolean;
  
  // === 快照状态 ===
  /** 最后一次手动策略快照 */
  lastManualSnapshot: ManualStrategy | null;
  /** 最后一次智能策略快照 */
  lastSmartSnapshot: SmartStrategy | null;
  
  // === 加载状态 ===
  /** 是否正在生成智能策略 */
  isGenerating: boolean;
  /** 错误信息 */
  error: string | null;
  
  // === 元数据 ===
  /** 最后更新时间 */
  lastUpdated: number;
  /** 是否已初始化 */
  initialized: boolean;
}

/**
 * 策略检查器操作接口
 */
interface InspectorActions {
  // === 基础操作 ===
  /** 设置选中元素 */
  setElement: (element: ElementDescriptor) => Promise<void>;
  /** 清除当前状态 */
  clear: () => void;
  /** 重置到初始状态 */
  reset: () => void;
  
  // === 新增：分析操作 ===
  /** 开始智能分析 */
  startAnalysis: (element: ElementDescriptor) => Promise<void>;
  /** 取消分析 */
  cancelAnalysis: () => void;
  /** 重试分析 */
  retryAnalysis: () => Promise<void>;
  /** 应用推荐策略 */
  applyRecommended: () => void;
  /** 选择智能匹配策略 */
  selectIntelligentStrategy: () => void;
  /** 选择智能手动步骤 */
  selectSmartStep: (stepKey: string) => void;
  /** 选择用户自建策略 */
  selectUserStrategy: (strategyKey: string) => void;
  /** 添加用户自建策略 */
  addUserStrategy: (strategy: UserStaticStrategy) => void;
  /** 删除用户自建策略 */
  removeUserStrategy: (strategyKey: string) => void;
  /** 切换自动跟随智能推荐 */
  toggleAutoFollowSmart: () => void;
  /** 生成默认策略 */
  generateDefaultStrategy: (element: ElementDescriptor) => ManualStrategy;
  
  // === 手动策略操作 ===
  /** 设置手动策略 */
  setManual: (strategy: ManualStrategy) => void;
  /** 切换到手动模式（保存智能快照） */
  toManual: (strategy?: ManualStrategy) => void;
  
  // === 智能策略操作 ===
  /** 切换到智能模式 */
  toSmart: () => Promise<void>;
  /** 刷新智能策略 */
  refreshSmart: () => Promise<void>;
  
  // === 工具方法 ===
  /** 采用当前智能策略为手动策略 */
  adoptSmartAsManual: () => void;
  /** 获取统一策略格式 */
  getUnifiedStrategy: () => UnifiedStrategy | null;
  
  // === 内部辅助方法 ===
  /** 生成智能策略（内部使用） */
  generateSmartStrategy: (element: ElementDescriptor) => Promise<SmartStrategy>;
  /** 转换智能策略为手动策略（内部使用） */
  convertSmartToManual: (smartStrategy: SmartStrategy) => ManualStrategy | null;
}

/**
 * 策略检查器完整状态类型
 */
type InspectorStore = InspectorState & InspectorActions;

/**
 * 初始状态
 */
const initialState: InspectorState = {
  // 核心状态
  element: null,
  mode: 'smart',
  current: null,
  
  // 分析状态
  analysisState: 'idle',
  analysisProgress: null,
  analysisJobId: null,
  smartSteps: [],
  recommendedStepKey: null,
  recommendedConfidence: null,
  userStrategies: [],
  activeStrategyType: 'intelligent',
  activeStrategyKey: null,
  isUsingDefaultStrategy: false,
  autoFollowSmart: true,
  
  // 快照状态
  lastManualSnapshot: null,
  lastSmartSnapshot: null,
  
  // 加载状态
  isGenerating: false,
  error: null,
  
  // 元数据
  lastUpdated: 0,
  initialized: false
};

// TODO: 注入依赖 - 这里应该从外部注入
let smartStrategyUseCase: GenerateSmartStrategyUseCase | null = null;
const legacyManualAdapter = new LegacyManualAdapter();

/**
 * 设置智能策略用例（依赖注入）
 */
export function setSmartStrategyUseCase(useCase: GenerateSmartStrategyUseCase) {
  smartStrategyUseCase = useCase;
}

/**
 * 策略检查器状态管理
 */
export const useInspectorStore = create<InspectorStore>()(
  subscribeWithSelector((set, get) => ({
    // === 状态 ===
    ...initialState,

    // === 基础操作 ===
    setElement: async (element: ElementDescriptor) => {
      console.log('🎯 设置元素:', element.nodeId);
      
      // 1. 立即生成默认策略
      const defaultStrategy = get().generateDefaultStrategy(element);
      
      set({ 
        element, 
        error: null, 
        lastUpdated: Date.now(),
        initialized: true,
        current: defaultStrategy,
        isUsingDefaultStrategy: true,
        activeStrategyType: 'user-static',
        activeStrategyKey: 'default',
        analysisState: 'idle'
      });

      // 2. 启动后台智能分析
      setTimeout(() => {
        get().startAnalysis(element);
      }, 100);
    },

    clear: () => {
      console.log('🧹 清除状态');
      set({
        element: null,
        current: null,
        error: null,
        isGenerating: false,
        lastUpdated: Date.now()
      });
    },

    reset: () => {
      console.log('🔄 重置到初始状态');
      set({
        ...initialState,
        lastUpdated: Date.now()
      });
    },

    // === 手动策略操作 ===
    setManual: (strategy: ManualStrategy) => {
      console.log('✋ 设置手动策略:', strategy.name);
      
      set({
        mode: 'manual',
        current: strategy,
        lastManualSnapshot: strategy,
        error: null,
        lastUpdated: Date.now()
      });
    },

    toManual: (strategy?: ManualStrategy) => {
      const state = get();
      console.log('➡️ 切换到手动模式');
      
      // 保存当前智能策略快照
      if (state.mode === 'smart' && state.current?.kind === 'smart') {
        set({ lastSmartSnapshot: state.current });
      }
      
      let manualStrategy = strategy;
      
      // 如果没有提供策略，尝试使用上次的手动快照
      if (!manualStrategy) {
        manualStrategy = state.lastManualSnapshot;
      }
      
      // 如果还没有，尝试从当前智能策略转换
      if (!manualStrategy && state.current?.kind === 'smart') {
        manualStrategy = get().convertSmartToManual(state.current);
      }
      
      // 最后兜底：从元素创建XPath直接策略
      if (!manualStrategy && state.element?.xpath) {
        manualStrategy = LegacyManualAdapter.createXPathDirectStrategy(
          state.element.xpath,
          `XPath直接 - ${state.element.nodeId}`
        );
      }
      
      if (manualStrategy) {
        get().setManual(manualStrategy);
      } else {
        set({ error: '无法创建手动策略' });
      }
    },

    // === 分析操作 ===
    startAnalysis: async (element: ElementDescriptor) => {
      console.log('🔍 开始智能分析');
      
      const analysisJobId = `analysis_${Date.now()}`;
      
      set({
        analysisState: 'pending',
        analysisJobId,
        analysisProgress: {
          currentStep: 1,
          totalSteps: 6,
          currentStepName: '分析元素属性',
          estimatedTimeLeft: 3
        },
        error: null
      });

      try {
        // 模拟分析过程
        for (let step = 1; step <= 6; step++) {
          if (get().analysisState === 'cancelled') {
            return;
          }

          const stepNames = [
            '分析元素属性',
            '检查自我锚点',
            '分析子树锚点',
            '检查区域限定',
            '分析邻居相对',
            '生成索引兜底'
          ];

          set({
            analysisProgress: {
              currentStep: step,
              totalSteps: 6,
              currentStepName: stepNames[step - 1],
              estimatedTimeLeft: Math.max(0, 6 - step)
            }
          });

          // 模拟处理时间
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 生成分析结果
        const smartSteps: SmartAnalysisStep[] = [
          {
            key: 'self-anchor',
            name: 'Step1: 自我锚点',
            description: '基于元素自身属性定位',
            score: 95,
            isRecommended: true,
            strategy: await get().generateSmartStrategy(element)
          },
          {
            key: 'child-anchor',
            name: 'Step2: 子树锚点',
            description: '基于子元素特征定位',
            score: 87,
            isRecommended: false,
            strategy: await get().generateSmartStrategy(element)
          }
          // ... 其他步骤
        ];

        const recommendedStep = smartSteps.find(s => s.isRecommended);
        
        set({
          analysisState: 'completed',
          analysisProgress: null,
          smartSteps,
          recommendedStepKey: recommendedStep?.key || null,
          recommendedConfidence: recommendedStep?.score || null
        });

        // 如果开启自动跟随且置信度足够高，自动应用推荐策略
        const state = get();
        if (state.autoFollowSmart && (recommendedStep?.score || 0) >= 85) {
          setTimeout(() => get().applyRecommended(), 500);
        }

      } catch (error) {
        console.error('分析失败:', error);
        set({
          analysisState: 'failed',
          analysisProgress: null,
          error: error instanceof Error ? error.message : '分析失败'
        });
      }
    },

    cancelAnalysis: () => {
      console.log('⏹️ 取消分析');
      set({
        analysisState: 'cancelled',
        analysisProgress: null,
        analysisJobId: null
      });
    },

    retryAnalysis: async () => {
      const state = get();
      if (state.element) {
        await get().startAnalysis(state.element);
      }
    },

    applyRecommended: () => {
      const state = get();
      const recommendedStep = state.smartSteps.find(s => s.key === state.recommendedStepKey);
      
      if (recommendedStep) {
        console.log('✅ 应用推荐策略:', recommendedStep.name);
        set({
          current: recommendedStep.strategy,
          activeStrategyType: 'smart-manual',
          activeStrategyKey: recommendedStep.key,
          isUsingDefaultStrategy: false,
          mode: 'smart'
        });
      }
    },

    selectIntelligentStrategy: () => {
      console.log('🧠 选择智能匹配策略');
      set({
        activeStrategyType: 'intelligent',
        activeStrategyKey: 'intelligent',
        isUsingDefaultStrategy: false
      });
    },

    selectSmartStep: (stepKey: string) => {
      const state = get();
      const step = state.smartSteps.find(s => s.key === stepKey);
      
      if (step) {
        console.log('🎯 选择智能步骤:', step.name);
        set({
          current: step.strategy,
          activeStrategyType: 'smart-manual',
          activeStrategyKey: stepKey,
          isUsingDefaultStrategy: false,
          mode: 'smart'
        });
      }
    },

    selectUserStrategy: (strategyKey: string) => {
      const state = get();
      const strategy = state.userStrategies.find(s => s.key === strategyKey);
      
      if (strategy) {
        console.log('👤 选择用户策略:', strategy.name);
        // 转换为ManualStrategy格式
        const manualStrategy: ManualStrategy = {
          kind: 'manual',
          name: strategy.name,
          type: 'xpath-direct',
          selector: {
            xpath: strategy.selectorType === 'xpath' ? strategy.selector : undefined,
            css: strategy.selectorType === 'css' ? strategy.selector : undefined
          },
          notes: strategy.description,
          createdAt: strategy.createdAt
        };
        
        set({
          current: manualStrategy,
          activeStrategyType: 'user-static',
          activeStrategyKey: strategyKey,
          isUsingDefaultStrategy: false,
          mode: 'manual'
        });
      }
    },

    addUserStrategy: (strategy: UserStaticStrategy) => {
      const state = get();
      set({
        userStrategies: [...state.userStrategies, strategy]
      });
    },

    removeUserStrategy: (strategyKey: string) => {
      const state = get();
      set({
        userStrategies: state.userStrategies.filter(s => s.key !== strategyKey)
      });
    },

    toggleAutoFollowSmart: () => {
      const state = get();
      set({
        autoFollowSmart: !state.autoFollowSmart
      });
    },

    generateDefaultStrategy: (element: ElementDescriptor): ManualStrategy => {
      console.log('🛡️ 生成默认策略');
      
      // 优先使用resource-id
      if (element.resourceId) {
        return {
          kind: 'manual',
          name: '默认策略: Resource ID',
          type: 'xpath-direct',
          selector: {
            xpath: `//*[@resource-id="${element.resourceId}"]`
          },
          notes: `基于resource-id生成的默认策略`,
          createdAt: Date.now()
        };
      }
      
      // 其次使用text内容
      if (element.text && element.text.trim()) {
        return {
          kind: 'manual',
          name: '默认策略: 文本内容',
          type: 'xpath-direct',
          selector: {
            xpath: `//*[contains(text(),"${element.text.trim()}")]`
          },
          notes: `基于文本内容生成的默认策略`,
          createdAt: Date.now()
        };
      }
      
      // 最后使用XPath
      if (element.xpath) {
        return {
          kind: 'manual',
          name: '默认策略: XPath',
          type: 'xpath-direct',
          selector: {
            xpath: element.xpath
          },
          notes: `基于XPath生成的默认策略`,
          createdAt: Date.now()
        };
      }
      
      // 兜底策略
      return {
        kind: 'manual',
        name: '默认策略: 通用',
        type: 'xpath-direct',
        selector: {
          xpath: `//*[@bounds="${element.bounds}"]`
        },
        notes: `基于位置信息生成的兜底策略`,
        createdAt: Date.now()
      };
    },

    // === 智能策略操作 ===
    toSmart: async () => {
      const state = get();
      console.log('🧠 切换到智能模式');
      
      if (!state.element) {
        set({ error: '没有选中的元素' });
        return;
      }
      
      // 保存当前手动策略快照
      if (state.mode === 'manual' && state.current?.kind === 'manual') {
        set({ lastManualSnapshot: state.current });
      }
      
      set({ 
        mode: 'smart', 
        isGenerating: true, 
        error: null 
      });
      
      try {
        // 优先使用快照
        if (state.lastSmartSnapshot) {
          console.log('📸 使用智能策略快照');
          set({
            current: state.lastSmartSnapshot,
            isGenerating: false,
            lastUpdated: Date.now()
          });
          return;
        }
        
        // 生成新的智能策略
        const strategy = await get().generateSmartStrategy(state.element);
        set({
          current: strategy,
          lastSmartSnapshot: strategy,
          isGenerating: false,
          lastUpdated: Date.now()
        });
        
      } catch (error) {
        console.error('❌ 生成智能策略失败:', error);
        set({
          error: error instanceof Error ? error.message : '生成智能策略失败',
          isGenerating: false,
          lastUpdated: Date.now()
        });
      }
    },

    refreshSmart: async () => {
      const state = get();
      console.log('🔄 刷新智能策略');
      
      if (!state.element) {
        set({ error: '没有选中的元素' });
        return;
      }
      
      set({ 
        isGenerating: true, 
        error: null 
      });
      
      try {
        const strategy = await get().generateSmartStrategy(state.element);
        set({
          current: strategy,
          lastSmartSnapshot: strategy,
          isGenerating: false,
          lastUpdated: Date.now()
        });
      } catch (error) {
        console.error('❌ 刷新智能策略失败:', error);
        set({
          error: error instanceof Error ? error.message : '刷新智能策略失败',
          isGenerating: false,
          lastUpdated: Date.now()
        });
      }
    },

    // === 工具方法 ===
    adoptSmartAsManual: () => {
      const state = get();
      console.log('📋 采用智能策略为手动策略');
      
      if (state.current?.kind !== 'smart') {
        set({ error: '当前不是智能策略' });
        return;
      }
      
      const manualStrategy = get().convertSmartToManual(state.current);
      if (manualStrategy) {
        get().setManual(manualStrategy);
      } else {
        set({ error: '无法转换智能策略为手动策略' });
      }
    },

    getUnifiedStrategy: (): UnifiedStrategy | null => {
      const state = get();
      
      if (!state.current) {
        return null;
      }
      
      return {
        kind: state.mode,
        strategy: state.current,
        confidence: state.current.kind === 'smart' ? state.current.confidence : 1.0,
        metadata: {
          source: state.current.kind === 'smart' ? 'auto-generated' : 'user-selected',
          generatedAt: state.lastUpdated,
          version: '1.0.0'
        }
      };
    },

    // === 内部辅助方法 ===
    generateSmartStrategy: async (element: ElementDescriptor): Promise<SmartStrategy> => {
      if (!smartStrategyUseCase) {
        throw new Error('智能策略用例未初始化');
      }
      
      return await smartStrategyUseCase.run({ element });
    },

    convertSmartToManual: (smartStrategy: SmartStrategy): ManualStrategy | null => {
      try {
        // 从智能策略创建对应的手动策略
        return {
          kind: 'manual',
          name: `手动版-${smartStrategy.selector.variant}`,
          type: 'custom',
          selector: {
            css: smartStrategy.selector.css,
            xpath: smartStrategy.selector.xpath
          },
          notes: `从智能策略转换: ${smartStrategy.selector.rationale}`,
          createdAt: Date.now()
        };
      } catch (error) {
        console.error('❌ 转换智能策略为手动策略失败:', error);
        return null;
      }
    }
  }))
);

// === 导出便捷钩子 ===

/**
 * 获取当前策略状态的便捷钩子
 */
export const useCurrentStrategy = () => {
  return useInspectorStore(state => ({
    element: state.element,
    mode: state.mode,
    current: state.current,
    isGenerating: state.isGenerating,
    error: state.error
  }));
};

/**
 * 获取策略操作方法的便捷钩子
 */
export const useStrategyActions = () => {
  return useInspectorStore(state => ({
    setElement: state.setElement,
    toManual: state.toManual,
    toSmart: state.toSmart,
    refreshSmart: state.refreshSmart,
    adoptSmartAsManual: state.adoptSmartAsManual,
    clear: state.clear,
    reset: state.reset
  }));
};