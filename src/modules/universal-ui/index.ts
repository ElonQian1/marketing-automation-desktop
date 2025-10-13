// src/modules/universal-ui/index.ts
// module: universal-ui | layer: public | role: barrel
// summary: 只导出 public 契约 / 用例 / 必要 hooks（不导出内部实现）

// === 公共契约导出 ===
export * from './domain/public/selector/StrategyContracts';

// === 用例导出 ===
export { GenerateSmartStrategyUseCase } from './application/usecases/GenerateSmartStrategyUseCase';

// === 适配器工具导出（用于外部集成） ===
export { LegacyManualAdapter } from './application/compat/LegacyManualAdapter';

// === Hooks 导出 ===
export { 
  useStepStrategy,
  useStrategyDisplay,
  useStrategySwitch
} from './hooks/useStepStrategy';

// === Store 导出（仅导出Hook，不直接导出Store） ===
export { 
  useInspectorStore,
  useCurrentStrategy,
  useStrategyActions,
  setSmartStrategyUseCase
} from './stores/inspectorStore';

// === UI 组件导出 ===
export { StepCard } from './ui/StepCard';
export { AnalysisStepCard } from './ui/AnalysisStepCard';
export { EnhancedStepCard } from './ui/components/EnhancedStepCard';
export { SmartVariantBadge, SimpleVariantBadge } from './ui/partials/SmartVariantBadge';

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

export type {
  StepStrategyState,
  StepStrategyActions,
  StrategyDetails
} from './hooks/useStepStrategy';