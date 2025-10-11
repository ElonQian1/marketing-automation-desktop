// src/modules/precise-acquisition/shared/utils/type-mappings.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

import { ExecutorMode } from '../../../../constants/precise-acquisition-enums';

/**
 * 统一的执行模式类型。
 * - `api`：完全由 API 自动执行
 * - `manual`：完全由人工执行
 * - `mixed`：自动与人工结合（在旧枚举中无直接对应，默认降级为人工）
 */
export type UnifiedExecutorMode = 'api' | 'manual' | 'mixed';

type ExecutorModeInput = UnifiedExecutorMode | ExecutorMode | null | undefined;

/**
 * 将执行模式输入归一化为统一字符串形式。
 * 可接受枚举值、字符串或空值，默认返回 `manual`。
 */
export function normalizeExecutorMode(mode: ExecutorModeInput): UnifiedExecutorMode {
  if (!mode) {
    return 'manual';
  }

  const value = typeof mode === 'string' ? mode.toLowerCase() : mode;

  if (value === ExecutorMode.API || value === 'api') {
    return 'api';
  }

  if (value === 'mixed') {
    return 'mixed';
  }

  return 'manual';
}

/**
 * 将统一的执行模式转换为旧枚举值。
 * `mixed` 会退化为 `ExecutorMode.MANUAL`，确保兼容旧逻辑。
 */
export function toExecutorModeEnum(
  mode: ExecutorModeInput,
  fallback: ExecutorMode = ExecutorMode.MANUAL
): ExecutorMode {
  const normalized = normalizeExecutorMode(mode);

  switch (normalized) {
    case 'api':
      return ExecutorMode.API;
    case 'mixed':
      return ExecutorMode.MANUAL;
    default:
      return fallback;
  }
}

/**
 * 将旧枚举值转换为统一字符串表示。
 */
export function fromExecutorModeEnum(mode: ExecutorMode | null | undefined): UnifiedExecutorMode {
  if (mode === ExecutorMode.API) {
    return 'api';
  }

  if (mode === ExecutorMode.MANUAL) {
    return 'manual';
  }

  return 'manual';
}
