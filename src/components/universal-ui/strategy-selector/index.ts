/**
 * 统一策略选择器模块导出
 */

export { UnifiedStrategyConfigurator } from './UnifiedStrategyConfigurator';

export type {
  UnifiedStrategyConfiguratorProps,
  MatchStrategy,
  MatchCriteria,
  UIElement,
  StrategyScoreInfo,
  StrategyOption,
  FieldConfig,
  DisplayMode
} from './types';

export {
  UNIFIED_STRATEGY_OPTIONS,
  AVAILABLE_FIELDS,
  STRATEGY_RECOMMENDED_FIELDS,
  getStrategyOption,
  getStrategyOptionsByCategory,
  getFieldConfig,
  getRecommendedFields
} from './config';

// 默认导出主组件
export { UnifiedStrategyConfigurator as default } from './UnifiedStrategyConfigurator';