// src/components/universal-ui/utils/bounds.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * @deprecated 请使用 src/shared/bounds/BoundsCalculator.ts 中的统一实现
 * 此文件仅为向后兼容性保留
 */
import { BoundsCalculator } from '../../../shared';

export interface BoundsRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * @deprecated 请使用 BoundsCalculator.parseBounds()
 */
export function parseBoundsString(input?: string | null): BoundsRect | undefined {
  return BoundsCalculator.parseBounds(input) || undefined;
}

/**
 * @deprecated 请使用 BoundsCalculator.parseBounds()
 */
export function parseBounds(input?: string | null): BoundsRect | undefined {
  return BoundsCalculator.parseBounds(input) || undefined;
}

/**
 * @deprecated 请使用 BoundsCalculator.rectToBoundsString()
 */
export function rectToBoundsString(rect: BoundsRect): string {
  return BoundsCalculator.rectToBoundsString(rect);
}
