// src/modules/universal-ui/index-core.ts
// module: universal-ui | layer: public | role: core-barrel
// summary: 只导出核心类型和逻辑（不包含JSX组件）

// === 公共契约导出 ===
export * from './domain/public/selector/StrategyContracts';

// === 用例导出 ===
export { GenerateSmartStrategyUseCase } from './application/usecases/GenerateSmartStrategyUseCase';

// === 适配器工具导出（用于外部集成） ===
export { LegacyManualAdapter } from './application/compat/LegacyManualAdapter';

// === Store 导出（仅导出Hook，不直接导出Store） ===
export { 
  useInspectorStore,
  useCurrentStrategy,
  useStrategyActions,
  setSmartStrategyUseCase
} from './stores/inspectorStore';

// === 类型导出（重新导出常用类型） ===
export type {
  ElementDescriptor,
  ManualStrategy,
  SmartStrategy,
  AnyStrategy,
  UnifiedStrategy,
  StrategyKind,
  SmartMatchVariant,
  ManualStrategyType,
  StrategyMetadata
} from './domain/public/selector/StrategyContracts';

export type {
  StrategyProvider
} from './application/ports/StrategyProvider';

export type {
  StrategyMode
} from './stores/inspectorStore';