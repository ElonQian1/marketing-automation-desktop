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
  element: null,
  mode: 'smart',
  current: null,
  lastManualSnapshot: null,
  lastSmartSnapshot: null,
  isGenerating: false,
  error: null,
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
      
      set({ 
        element, 
        error: null, 
        lastUpdated: Date.now(),
        initialized: true
      });

      const state = get();
      
      // 如果有XPath，自动创建手动策略作为默认
      if (element.xpath) {
        const defaultManual = LegacyManualAdapter.createXPathDirectStrategy(
          element.xpath,
          `XPath直接 - ${element.nodeId}`
        );
        
        set({ 
          mode: 'manual',
          current: defaultManual,
          lastManualSnapshot: defaultManual
        });
        
        console.log('✅ 自动创建XPath直接策略');
      } else {
        // 没有XPath，尝试生成智能策略
        await get().toSmart();
      }
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