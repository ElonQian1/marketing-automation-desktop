// src/components/strategy-selector/types/selection-config.ts
// module: ui | layer: types | role: 智能选择配置类型定义
// summary: 统一定义各种选择模式的配置接口

/**
 * 批量执行配置
 */
export interface BatchConfig {
  interval_ms: number;
  max_count?: number;
  jitter_ms?: number;
  continue_on_error: boolean;
  show_progress: boolean;
  match_direction?: 'forward' | 'backward';
}

/**
 * 随机选择配置
 */
export interface RandomConfig {
  seed?: number;  // 随机种子（用于复现）
  ensure_stable_sort: boolean;  // 确保排序稳定性
  custom_seed_enabled: boolean;  // 是否启用自定义种子
}

/**
 * 选择模式类型
 */
export type SelectionMode = 
  | 'first' 
  | 'last' 
  | 'all' 
  | 'match-original' 
  | 'random' 
  | 'auto';

/**
 * 模式标签映射
 */
export const MODE_LABELS: Record<SelectionMode, string> = {
  'first': '🎯 第一个',
  'last': '🎯 最后一个',
  'all': '📋 批量全部',
  'match-original': '🎯 精确匹配',
  'random': '🎲 随机选择',
  'auto': '🤖 自动模式',
};

/**
 * 默认批量配置
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  interval_ms: 2000,
  max_count: 10,
  jitter_ms: 500,
  continue_on_error: true,
  show_progress: true,
  match_direction: 'forward',
};

/**
 * 默认随机配置
 */
export const DEFAULT_RANDOM_CONFIG: RandomConfig = {
  seed: undefined,
  ensure_stable_sort: true,
  custom_seed_enabled: false,
};
