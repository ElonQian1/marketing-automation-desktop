// Barrel exports for node-detail submodule
export { MatchPresetsRow } from './MatchPresetsRow';
export { SelectedFieldsPreview } from './SelectedFieldsPreview';
export { SelectedFieldsChips } from './SelectedFieldsChips';
export { SelectedFieldsEditor } from './SelectedFieldsEditor';
export { SelectedFieldsTable } from './SelectedFieldsTable';
export { NegativeConditionsEditor } from './NegativeConditionsEditor';
export { PositiveConditionsEditor } from './PositiveConditionsEditor';

// 🆕 策略评分和推荐组件
export { StrategyScoreCard } from './StrategyScoreCard';
export { StrategyScoreBadge } from './StrategyScoreBadge';
export { StrategyRecommendationPanel } from './StrategyRecommendationPanel';
export { InteractiveScoringPanel } from './InteractiveScoringPanel';

// 🆕 智能策略系统适配器
export { 
  StrategySystemAdapter,
  strategySystemAdapter,
  analyzeElementStrategy,
  batchAnalyzeElementStrategies
} from './StrategySystemAdapter';

// 🆕 交互式评分 Hooks
export { 
  useInteractiveScoring
} from './hooks';

// � 响应式设计模块
export * from './responsive';

// �🆕 演示和测试组件
export { default as ScoringUIDemo } from './ScoringUIDemo';

// 🆕 策略评分类型
export type { DetailedStrategyRecommendation, DetailedStrategyScore } from './StrategyRecommendationPanel';
export type { WeightConfig } from './hooks';

// 🎨 响应式设计类型
export type { 
  Breakpoint, 
  DeviceType, 
  GridColumns, 
  ComponentSizes, 
  FontSizes 
} from './responsive';

// 🆕 增强字段选择器模块
export { 
  AdvancedFieldSelector,
  FieldDescriptionPanel,
  EnhancedFieldSelector,
  FieldHelp,
  ALL_FIELD_GROUPS,
  BASIC_FIELDS_GROUP,
  PARENT_FIELDS_GROUP,
  CHILD_FIELDS_GROUP,
  INTERACTION_FIELDS_GROUP,
  CLICKABLE_ANCESTOR_FIELDS_GROUP,
  getRecommendedGroupsForStrategy,
  getFieldInfo,
  analyzeFieldUsage,
  type FieldInfo,
  type FieldGroup
} from './enhanced-field-selector';

// 🆕 统一回填组件和工具
export { 
  SetAsStepElementButton,
  NodeDetailSetElementButton,
  ScreenPreviewSetElementButton,
  MatchResultSetElementButton,
  createSetAsStepElementButton
} from './SetAsStepElementButton';
export { 
  buildCompleteStepCriteria,
  buildSmartStepCriteria,
  buildMatchResultCriteria,
  validateStepCriteria,
  formatCriteriaForDebug,
  type CompleteStepCriteria,
  type ElementToStepOptions
} from './elementToStepHelper';

export * from './types';
// 公共工具（供其他面板/列表模块化复用）
export { PRESET_FIELDS, inferStrategyFromFields, isSameFieldsAsPreset, toBackendStrategy, buildDefaultValues, normalizeFieldsAndValues, hasPositionConstraint, normalizeExcludes, normalizeIncludes, buildFindSimilarCriteria } from './helpers';
// 标题/描述辅助
export { buildShortDescriptionFromCriteria } from './titleHelpers';

// 元素预设子模块导出
export { ElementPresetsRow } from './element-presets/ElementPresetsRow';
export { ELEMENT_PRESETS } from './element-presets/registry.ts';
export type { ElementPreset, ElementPresetId } from './element-presets/types';
export { StrategyConfigurator } from './StrategyConfigurator';
