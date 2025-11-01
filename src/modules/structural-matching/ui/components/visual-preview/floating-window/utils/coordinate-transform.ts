// src/modules/structural-matching/ui/components/visual-preview/floating-window/utils/coordinate-transform.ts
// module: structural-matching | layer: ui | role: utils
// summary: 坐标变换工具函数

import { ElementTreeData, CropConfig } from "../types";

/**
 * 计算精确的图片裁剪配置
 */
export function calculateCropConfig(
  elementTreeData: ElementTreeData,
  padding: number = 20
): CropConfig {
  const { bounds } = elementTreeData;
  
  return {
    cropArea: {
      x: Math.max(0, bounds.x - padding),
      y: Math.max(0, bounds.y - padding),
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    },
    scale: 1,
    offset: { x: 0, y: 0 },
  };
}

/**
 * 将绝对坐标转换为相对于裁剪区域的坐标
 */
export function absoluteToRelativeCoords(
  absoluteX: number,
  absoluteY: number,
  cropConfig: CropConfig
): { x: number; y: number } {
  return {
    x: absoluteX - cropConfig.cropArea.x,
    y: absoluteY - cropConfig.cropArea.y,
  };
}

/**
 * 将相对坐标转换为绝对坐标
 */
export function relativeToAbsoluteCoords(
  relativeX: number,
  relativeY: number,
  cropConfig: CropConfig
): { x: number; y: number } {
  return {
    x: relativeX + cropConfig.cropArea.x,
    y: relativeY + cropConfig.cropArea.y,
  };
}

/**
 * 计算元素在显示区域中的可见性
 */
export function calculateElementVisibility(
  elementBounds: { x: number; y: number; width: number; height: number },
  viewportBounds: { x: number; y: number; width: number; height: number }
): {
  isVisible: boolean;
  visibleArea: number; // 0-1, 表示可见面积占比
  clippedBounds?: { x: number; y: number; width: number; height: number };
} {
  const elementRight = elementBounds.x + elementBounds.width;
  const elementBottom = elementBounds.y + elementBounds.height;
  const viewportRight = viewportBounds.x + viewportBounds.width;
  const viewportBottom = viewportBounds.y + viewportBounds.height;

  // 检查是否有交集
  const hasIntersection = !(
    elementRight <= viewportBounds.x ||
    elementBounds.x >= viewportRight ||
    elementBottom <= viewportBounds.y ||
    elementBounds.y >= viewportBottom
  );

  if (!hasIntersection) {
    return { isVisible: false, visibleArea: 0 };
  }

  // 计算交集区域
  const intersectionLeft = Math.max(elementBounds.x, viewportBounds.x);
  const intersectionTop = Math.max(elementBounds.y, viewportBounds.y);
  const intersectionRight = Math.min(elementRight, viewportRight);
  const intersectionBottom = Math.min(elementBottom, viewportBottom);

  const intersectionWidth = intersectionRight - intersectionLeft;
  const intersectionHeight = intersectionBottom - intersectionTop;
  const intersectionArea = intersectionWidth * intersectionHeight;

  const elementArea = elementBounds.width * elementBounds.height;
  const visibleArea = elementArea > 0 ? intersectionArea / elementArea : 0;

  return {
    isVisible: true,
    visibleArea,
    clippedBounds: {
      x: intersectionLeft,
      y: intersectionTop,
      width: intersectionWidth,
      height: intersectionHeight,
    },
  };
}

/**
 * 计算两个元素边界框的重叠面积
 */
export function calculateOverlapArea(
  bounds1: { x: number; y: number; width: number; height: number },
  bounds2: { x: number; y: number; width: number; height: number }
): number {
  const left = Math.max(bounds1.x, bounds2.x);
  const top = Math.max(bounds1.y, bounds2.y);
  const right = Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width);
  const bottom = Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height);

  if (left >= right || top >= bottom) {
    return 0;
  }

  return (right - left) * (bottom - top);
}

/**
 * 计算边界框的中心点
 */
export function calculateCenter(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number } {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * 计算两点之间的距离
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}