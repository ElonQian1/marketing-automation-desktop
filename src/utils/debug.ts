// src/utils/debug.ts
// module: shared | layer: utils | role: utility
// summary: 工具函数

/**
 * Development logging helpers
 * - DEV gated (Vite: import.meta.env.DEV)
 * - Local switch via localStorage('debug:visual') === '1' by default
 * - Shallow equality utilities for change-only logging
 */

export function isDevDebugEnabled(flagKey: string = 'debug:visual'): boolean {
  try {
    // Vite provides import.meta.env.DEV
    // Also allow a wildcard switch 'debug:*' === '1'
    // Prefer explicit flagKey
    const dev = (import.meta as any).env?.DEV ?? import.meta.env?.MODE === 'development';
    if (!dev) return false;
    const ls = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    const explicit = ls?.getItem(flagKey) === '1';
    const wildcard = ls?.getItem('debug:*') === '1';
    return !!(explicit || wildcard);
  } catch {
    return false;
  }
}

export function shallowEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!Object.is((a as any)[k], (b as any)[k])) return false;
  }
  return true;
}
