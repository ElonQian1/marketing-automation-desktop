// 统一的 bounds 工具：对象 <-> 字符串
import { BoundsCalculator } from '../../../../../shared/bounds/BoundsCalculator';

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// 将对象格式的 bounds 转为 UIAutomator 常见的字符串格式: "[l,t][r,b]"
export function stringifyBounds(rect?: RectLike | null): string | undefined {
  if (!rect) return undefined;
  return BoundsCalculator.rectToBoundsString(rect);
}

// 将字符串格式的 bounds 解析为对象
/**
 * @deprecated 使用统一的 BoundsCalculator.parseBounds() 替代
 */
export function parseBounds(str?: string | null): RectLike | undefined {
  return BoundsCalculator.parseBounds(str);
}
