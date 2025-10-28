// src/components/strategy-selector/utils/selection-mode-converter.ts
// module: ui | layer: utils | role: 选择模式转换器
// summary: 将前端选择模式转换为后端期望的枚举对象格式

import type { 
  SelectionMode, 
  BatchConfig, 
  RandomConfig,
  MatchOriginalConfig 
} from '../types/selection-config';

/**
 * 将前端 SelectionMode 字符串转换为后端期望的枚举对象格式
 * 
 * 后端使用 Rust 的 #[serde(tag = "type")] 枚举，需要 {type: "EnumVariant"} 格式
 */
 
export function convertSelectionModeToBackend(
  mode: SelectionMode,
  batchConfig?: BatchConfig,
  randomConfig?: RandomConfig,
  matchOriginalConfig?: MatchOriginalConfig
): any {
  switch (mode) {
    case 'first':
      return { type: 'First' };

    case 'last':
      return { type: 'Last' };

    case 'all':
      if (!batchConfig) {
        throw new Error('批量模式需要提供 batchConfig');
      }
      return {
        type: 'All',
        batch_config: {
          interval_ms: batchConfig.interval_ms,
          max_per_session: batchConfig.max_count || 10,
          jitter_ms: batchConfig.jitter_ms || 500,
          cooldown_ms: 0,
          continue_on_error: batchConfig.continue_on_error,
          show_progress: batchConfig.show_progress,
          refresh_policy: { type: 'Never' },
          requery_by_fingerprint: false,
        }
      };

    case 'match-original':
      if (!matchOriginalConfig) {
        // 使用默认配置
        return {
          type: 'MatchOriginal',
          min_confidence: 0.85,
          fallback_to_first: true,
          strict_mode: true,
          match_attributes: ['text', 'resource_id', 'content_desc'],
        };
      }
      return {
        type: 'MatchOriginal',
        min_confidence: matchOriginalConfig.min_confidence,
        fallback_to_first: matchOriginalConfig.fallback_to_first,
        strict_mode: matchOriginalConfig.strict_mode,
        match_attributes: matchOriginalConfig.match_attributes,
      };

    case 'random':
      if (!randomConfig) {
        // 使用默认配置
        return {
          type: 'Random',
          seed: Date.now(),
          ensure_stable_sort: true
        };
      }
      return {
        type: 'Random',
        seed: randomConfig.custom_seed_enabled 
          ? (randomConfig.seed || Date.now())
          : Date.now(),
        ensure_stable_sort: randomConfig.ensure_stable_sort
      };

    case 'auto':
    default:
      return {
        type: 'Auto',
        single_min_confidence: 0.6,
        batch_config: null,
        fallback_to_first: true
      };
  }
}

/**
 * 验证配置是否有效
 */
export function validateConfig(
  mode: SelectionMode,
  batchConfig?: BatchConfig,
  randomConfig?: RandomConfig,
  matchOriginalConfig?: MatchOriginalConfig
): { valid: boolean; error?: string } {
  switch (mode) {
    case 'all':
      if (!batchConfig) {
        return { valid: false, error: '批量模式需要配置' };
      }
      if (batchConfig.interval_ms <= 0) {
        return { valid: false, error: '间隔时间必须大于0' };
      }
      break;

    case 'random':
      if (randomConfig?.custom_seed_enabled && !randomConfig.seed) {
        return { valid: false, error: '启用自定义种子时必须设置种子值' };
      }
      break;

    case 'match-original':
      if (matchOriginalConfig) {
        if (matchOriginalConfig.min_confidence < 0.5 || matchOriginalConfig.min_confidence > 1) {
          return { valid: false, error: '置信度必须在50%-100%之间' };
        }
        if (matchOriginalConfig.match_attributes.length === 0) {
          return { valid: false, error: '至少需要选择一个匹配属性' };
        }
      }
      break;
  }

  return { valid: true };
}
