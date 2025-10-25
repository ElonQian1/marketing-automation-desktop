// src/api/core/tauriInvoke.ts
// module: api | layer: core | role: tauri-invoke-utils
// summary: Tauri调用核心工具，提供参数转换和类型安全封装

import { invoke } from "@tauri-apps/api/core";

/**
 * 递归将对象的 key 从 camelCase 转为 snake_case。
 * - 仅转换普通对象与数组的键；保留字符串/数字/布尔/空等原值。
 * - 不会转换对象的值内容（例如字符串中的命名）。
 */
export function toSnakeCaseDeep<T = unknown>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((v) => toSnakeCaseDeep(v)) as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      // 标准 camelCase -> snake_case 转换：
      // 1) 在小写/数字与大写之间加下划线
      // 2) 将连字符/空白替换为下划线
      // 3) 整体转小写
      const snake = k
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[-\s]+/g, "_")
        .toLowerCase();
      out[snake] = toSnakeCaseDeep(v);
    }
    return out as T;
  }
  return input;
}

/**
 * 兼容性 invoke：
 * - 优先使用 snake_case 参数调用；
 * - 失败且错误信息提示缺少 camelCase key 时，回退 camelCase；
 * - 也支持强制策略（forceCamel / forceSnake）。
 */
export async function invokeCompat<T = unknown>(
  command: string,
  params?: Record<string, unknown>,
  opts?: { forceCamel?: boolean; forceSnake?: boolean }
): Promise<T> {
  const { forceCamel, forceSnake } = opts || {};
  const snakeParams = toSnakeCaseDeep(params || {});
  const camelParams = params || {};

  // 强制策略：
  if (forceSnake) {
    // 仅发送 snake_case 形参，避免未知参数导致的 invalid args
    return invoke<T>(command, snakeParams);
  }
  if (forceCamel) {
    // 仅发送 camelCase 形参，避免未知参数导致的 invalid args
    return invoke<T>(command, camelParams);
  }

  // 默认策略：先 snake，再 camel 回退
  try {
    return await invoke<T>(command, snakeParams);
  } catch (e1) {
    const msg = String(e1 ?? "");
    // 若错误提示缺少 camelCase key，尝试 camel 形参
    // 例如：missing required key deviceId / xmlContent
    const keys = Object.keys(camelParams);
    const missingCamel = keys.some(
      (k) =>
        msg.includes(`missing required key ${k}`) ||
        msg.includes(`invalid args \`${k}\``)
    );
    if (missingCamel) {
      console.warn(`[invokeCompat] snake_case 调用失败，尝试 camelCase…`, msg);
      try {
        return await invoke<T>(command, camelParams);
      } catch (e2) {
        console.error(`[invokeCompat] camelCase 调用也失败:`, String(e2));
        throw e2; // 抛出第二次调用的错误
      }
    }
    // 即便不匹配上述模式，也做一次回退尝试，增强鲁棒性
    console.warn(
      `[invokeCompat] snake_case 调用失败，保守回退 camelCase…`,
      msg
    );
    try {
      return await invoke<T>(command, camelParams);
    } catch (e2) {
      console.error(`[invokeCompat] 保守回退也失败:`, String(e2));
      throw e2; // 抛出第二次调用的错误
    }
  }
}

export default invokeCompat;
