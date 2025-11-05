// src/modules/structural-matching/index.ts
// module: structural-matching | layer: public | role: 模块导出
// summary: 结构匹配模块的公开API

// Domain
export * from './domain/constants/field-types';
export * from './domain/constants/scoring-weights';
export * from './domain/constants/match-strategies';
export * from './domain/constants/field-strategy-presets';
export * from './domain/constants/element-templates';
export * from './domain/models/structural-field-config';
// 避免与应用层同名导出冲突：将分层配置的 updateFieldConfig 以别名导出
export type {
	FieldConfig,
	HierarchicalFieldConfig,
	StructuralMatchingHierarchicalConfig,
} from './domain/models/hierarchical-field-config';
export {
	DEFAULT_FIELD_CONFIG,
	getDefaultFieldConfig,
	createLayerConfig,
	findFieldConfig,
	updateFieldConfig as updateHierarchicalFieldConfig,
} from './domain/models/hierarchical-field-config';

// Application
// 保持应用层的 updateFieldConfig 为默认名称（用于卡片配置场景）
export {
	createStructuralConfigFromElement,
	updateFieldConfig,
	toggleFieldEnabled,
	updateGlobalThreshold,
} from './application/create-structural-config';
export * from './application/test-field-matching';

// Hooks
export * from './hooks/use-structural-matching-modal';
// 🎯 核心协调器
export { StructuralMatchingCoordinator } from './structural-matching-coordinator';

// 🏗️ 核心类型定义
export * from './core/structural-matching-types';

// 🔧 工具模块
export { ContainerAnchorGenerator } from './anchors/structural-matching-container-anchor';
export { AncestorAnalyzer } from './anchors/structural-matching-ancestor-analyzer';
export { SkeletonEnhancer } from './core/structural-matching-skeleton-enhancer';
export { CompletenessScorer } from './scoring/structural-matching-completeness-scorer';

// 🎛️ React Hooks
export { useHierarchicalMatchingModal } from './hooks/use-hierarchical-matching-modal';

// 🧠 智能配置服务
export {
  isFieldMeaningful,
  generateSmartFieldConfig,
  generateElementSmartConfig,
  generateTreeSmartConfig,
  getStructuralMatchingConfigSummary,
  type StructuralMatchingConfigOptions,
  type FieldConfigResult,
  type ElementConfigResult
} from './services/structural-matching-config-service';
export type { UseHierarchicalMatchingModalReturn, ElementTemplate } from './hooks/use-hierarchical-matching-modal';
export * from './hooks/use-structural-preview';
export * from './hooks/use-field-strategy-config';
export * from './hooks/use-tree-hover';

// UI Components
// 导出增强后的结构匹配模态框（原有模态框，已集成快照生成功能）
export { StructuralMatchingModal, type StructuralMatchingModalProps } from './ui/components/structural-matching-modal/structural-matching-modal';
export * from './ui/components/element-structure-tree';
export * from './ui/components/visual-preview';
export * from './ui/components/hover-preview';
export * from './ui/components/scoring-preview';
export * from './ui/components/field-strategy-selector';
export * from './ui/components/enhanced-field-config-panel';
export * from './ui/components/enhanced-field-config-panel-compact';
export * from './ui/pages/structural-matching-demo';
export * from './ui/pages/field-strategy-demo';
export * from './ui/pages/enhanced-field-config-demo';

// Services
export * from './services/structural-matching-service';
export * from './services/structural-snapshot-generator';

// Parameter Inference System
export * from './services/step-card-parameter-inference/types';
export * from './services/step-card-parameter-inference/xml-snapshot-analyzer';
export * from './services/step-card-parameter-inference/step-card-inference-service';
export * from './services/step-card-parameter-inference/runtime-parameter-inference-service';

// Parameter Inference UI
export * from './ui/components/parameter-inference-indicator';
export * from './ui/components/xml-snapshot-viewer';
export * from './ui/hooks/use-parameter-inference-status';
