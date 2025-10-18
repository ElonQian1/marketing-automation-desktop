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
export { StepCardSystem } from "./components/step-card-system/StepCardSystem";
export * from "./types/unified-step-card-types";
export * from "./hooks/use-step-card-actions";
export * from "./styles/step-card-theme";

// === 改进的包装器（渐进式迁移） ===
export {
  ImprovedSmartStepWrapper,
  SmartStepCardWrapperV2,
} from "./components/improved-smart-step-wrapper";

// === 演示页面 ===
export { StepCardSystemDemo } from "./pages/step-card-system-demo";

// === 智能分析工作流导出 ===
export * from "./types/intelligent-analysis-types";
export * from "./utils/selection-hash";
export * from "./hooks/use-intelligent-analysis-workflow";
export * from "./hooks/use-intelligent-analysis-real";
export * from "./hooks/use-analysis-auto-fill.tsx"; // ✅ 新增: 真实Tauri命令Hook (包含JSX)
// ✅ 智能分析控制器(业务逻辑层)
export * from "./components/intelligent-analysis-controller";
export { FallbackStrategyGenerator } from "./domain/fallback-strategy-generator";
export * from "./services/mock-analysis-backend";

// === 步骤卡片适配器导出 ===
export * from "./adapters/step-card-adapter";

// === 页面组件导出 ===
export { default as IntelligentAnalysisDemo } from "./pages/intelligent-analysis-demo";
export { default as SmokeTesterPage } from "./pages/smoke-test";
export { default as SmokeTestCompletePage } from "./pages/smoke-test-complete";
export { default as UnifiedStepCardDemo } from "./pages/unified-step-card-demo";
export { UniversalAnalysisComponentsDemo } from "./pages/universal-analysis-components-demo";

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

// === 🆕 智能分析UI组件导出（新增缺失功能） ===
export {
  UniversalFallbackBadge,
  UniversalRecommendedBadge,
  UniversalStrategyCandidatesSection,
  UniversalStrategyModeSelector,
  UniversalPublishReadinessModal,
  UniversalAnalysisStatusSection,
} from "./ui/components";
export type {
  UniversalFallbackBadgeProps,
  UniversalRecommendedBadgeProps,
  UniversalStrategyCandidatesSectionProps,
  UniversalStrategyModeSelectorProps,
  UniversalPublishReadinessModalProps,
} from "./ui/components";
export { UniversalEnhancedStepCardIntegration } from "./ui/components/universal-enhanced-step-card-integration";

// ✅ 智能分析气泡UI组件（UI展示层）
export { IntelligentAnalysisPopoverUI } from "./ui/components/intelligent-analysis-popover-ui";
export type { IntelligentAnalysisPopoverUIProps } from "./ui/components/intelligent-analysis-popover-ui";

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
