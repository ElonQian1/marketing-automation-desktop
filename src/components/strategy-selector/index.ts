// src/components/strategy-selector/index.ts
// module: ui | layer: ui | role: 策略选择器模块导出
// summary: 统一导出所有策略选择相关的组件和工具

// 组件
export { default as CompactStrategyMenu } from './CompactStrategyMenu';
export { RandomConfigPanel } from './panels/RandomConfigPanel';
export { MatchOriginalConfigPanel } from './panels/MatchOriginalConfigPanel';

// 类型
export type {
  SelectionMode,
  BatchConfig,
  RandomConfig,
  MatchOriginalConfig,
} from './types/selection-config';

export {
  MODE_LABELS,
  DEFAULT_BATCH_CONFIG,
  DEFAULT_RANDOM_CONFIG,
  DEFAULT_MATCH_ORIGINAL_CONFIG,
} from './types/selection-config';

// 工具函数
export {
  convertSelectionModeToBackend,
  validateConfig,
} from './utils/selection-mode-converter';

export {
  saveSelectionConfigWithFeedback,
  type SaveConfigParams,
} from './utils/selection-config-saver';
