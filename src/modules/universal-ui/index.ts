// src/modules/universal-ui/index.ts
// module: universal-ui | layer: public | role: barrel
// summary: 只导出 public 契约 / 用例 / 必要 hooks（不导出内部实现）

// === 公共契约导出 ===
export * from "./domain/public/selector/StrategyContracts";

// === 用例导出 ===
export { GenerateSmartStrategyUseCase } from "./application/usecases/GenerateSmartStrategyUseCase";

// === 适配器工具导出（用于外部集成） ===
export { LegacyManualAdapter } from "./application/compat/LegacyManualAdapter";

// === Hooks 导出 ===
export {
  useStepStrategy,
  useStrategyDisplay,
  useStrategySwitch,
} from "./hooks/useStepStrategy";

// === 🎯 统一步骤卡片系统（推荐使用） ===
// 暂时注释掉，等待完整实现
// export { StepCardSystem } from "./components/step-card-system";
// export * from "./components/step-card-system/types/step-card-system-types";

// === 智能分析工作流导出 ===
export * from "./types/intelligent-analysis-types";
export * from "./utils/selection-hash";
export * from "./hooks/use-intelligent-analysis-workflow";
// ❌ 不再导出内部组件，引导使用 StepCardSystem
// export { UnifiedStepCard as IntelligentStepCardComponent } from "./components/unified-step-card";
// export { UnifiedStepCard as IntelligentStepCard } from "./components/unified-step-card";
export * from "./components/enhanced-element-selection-popover";
export { FallbackStrategyGenerator } from "./domain/fallback-strategy-generator";
export * from "./services/mock-analysis-backend";

// === 步骤卡片适配器导出 ===
export * from "./adapters/step-card-adapter";

// === 页面组件导出 ===
export { default as IntelligentAnalysisDemo } from "./pages/intelligent-analysis-demo";
export { default as SmokeTesterPage } from "./pages/smoke-test";
export { default as SmokeTestCompletePage } from "./pages/smoke-test-complete";
export { default as UnifiedStepCardDemo } from "./pages/unified-step-card-demo";

// === Store 导出（仅导出Hook，不直接导出Store） ===
export {
  useInspectorStore,
  useCurrentStrategy,
  useStrategyActions,
  setSmartStrategyUseCase,
} from "./stores/inspectorStore";

// === UI 组件导出 ===
// ❌ 不再导出内部实现组件，统一使用 StepCardSystem
// export { UnifiedStepCard as StepCard } from "./components/unified-step-card";
export { StepCard as LegacyStepCard } from "./ui/StepCard"; // 保持向后兼容（特殊用途）
// Components
export { UniversalAnalysisStatusSection } from "./ui/components/universal-analysis-status-section";
export { UniversalEnhancedElementPopover } from "./ui/components/universal-enhanced-element-popover";
export {
  SmartVariantBadge,
  SimpleVariantBadge,
} from "./ui/partials/SmartVariantBadge";

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
  StrategyMetadata,
} from "./domain/public/selector/StrategyContracts";

export type { StrategyProvider } from "./application/ports/StrategyProvider";

export type { StrategyMode } from "./stores/inspectorStore";

export type {
  StepStrategyState,
  StepStrategyActions,
  StrategyDetails,
} from "./hooks/useStepStrategy";
