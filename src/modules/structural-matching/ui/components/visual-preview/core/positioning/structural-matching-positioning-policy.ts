// src/modules/structural-matching/ui/components/visual-preview/core/positioning/structural-matching-positioning-policy.ts
// module: structural-matching | layer: ui | role: 定位策略
// summary: 根据定位模式计算浮窗在屏幕上的最终位置，包含右侧优先与锚点智能布局

import type { StructuralMatchingPositioningOptions } from "./structural-matching-positioning-types";

export function calculateWindowPositionWithPolicy(
  anchorBounds: { x: number; y: number; width: number; height: number },
  windowSize: { width: number; height: number },
  screenSize: { width: number; height: number },
  options?: StructuralMatchingPositioningOptions
): { x: number; y: number } {
  const mode = options?.mode ?? "auto";
  const margin = Math.max(0, options?.margin ?? 24);

  // 固定模式
  if (mode === "fixed" && options?.fixedPosition) {
    return clampToViewport(options.fixedPosition, windowSize, screenSize, margin);
  }

  if (mode === "right-edge") {
    const x = screenSize.width - windowSize.width - margin;
    // 纵向尽量对齐锚点中心
    const preferredY = anchorBounds.y + anchorBounds.height / 2 - windowSize.height / 2;
    return clampToViewport({ x, y: preferredY }, windowSize, screenSize, margin);
  }

  // 锚点右侧优先
  if (mode === "anchor-right") {
    const rightX = anchorBounds.x + anchorBounds.width + margin;
    if (rightX + windowSize.width <= screenSize.width - margin) {
      const y = anchorBounds.y;
      return clampToViewport({ x: rightX, y }, windowSize, screenSize, margin);
    }
    // 右侧放不下，退化到 auto
  }

  // auto：根据左右可用空间选择
  const spaceRight = screenSize.width - (anchorBounds.x + anchorBounds.width) - margin;
  const spaceLeft = anchorBounds.x - margin;
  if (spaceRight >= windowSize.width) {
    // 放右边
    const x = anchorBounds.x + anchorBounds.width + margin;
    const y = anchorBounds.y;
    return clampToViewport({ x, y }, windowSize, screenSize, margin);
  }
  if (spaceLeft >= windowSize.width) {
    // 放左边
    const x = anchorBounds.x - windowSize.width - margin;
    const y = anchorBounds.y;
    return clampToViewport({ x, y }, windowSize, screenSize, margin);
  }

  // 两侧都放不下：靠右边缘吸附
  const x = screenSize.width - windowSize.width - margin;
  const y = anchorBounds.y + anchorBounds.height / 2 - windowSize.height / 2;
  return clampToViewport({ x, y }, windowSize, screenSize, margin);
}

function clampToViewport(
  pos: { x: number; y: number },
  windowSize: { width: number; height: number },
  screenSize: { width: number; height: number },
  margin: number
) {
  let { x, y } = pos;
  // 水平
  if (x + windowSize.width > screenSize.width - margin) {
    x = screenSize.width - windowSize.width - margin;
  }
  if (x < margin) x = margin;
  // 垂直
  if (y + windowSize.height > screenSize.height - margin) {
    y = screenSize.height - windowSize.height - margin;
  }
  if (y < margin) y = margin;
  return { x: Math.round(x), y: Math.round(y) };
}
