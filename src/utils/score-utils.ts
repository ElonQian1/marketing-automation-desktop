// src/utils/score-utils.ts
// module: utils | layer: utils | role: 置信度分数处理工具
// summary: 统一处理置信度分数的归一化和格式转换

/**
 * 将任意格式的置信度值归一化为0~1的number
 */
export function normalizeTo01(input: unknown): number | undefined {
  if (input == null) return undefined;

  let v = input as number;
  if (typeof input === 'string') {
    // 去掉百分号再转数值
    const n = parseFloat(input.replace('%', '').trim());
    if (!Number.isFinite(n)) return undefined;
    v = n;
  }

  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return undefined;
  }

  // 如果是 0..100 的百分比，转 0..1
  if (v > 1) v = v / 100;
  if (v < 0) v = 0;
  if (v > 1) v = 1;
  return v;
}

/**
 * 将0~1的置信度转换为百分比整数
 */
export function toPercentInt01(v?: number): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  return Math.round(v * 100);
}

/**
 * 严格的number类型检查
 */
export function isValidScore(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}