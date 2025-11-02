// src/modules/structural-matching/ui/components/visual-preview/core/structural-matching-crop-calculator.ts
// module: structural-matching | layer: ui | role: 核心算法
// summary: 结构匹配精确裁剪计算工具

import type { ElementTreeData, CropConfig } from "../types";

export interface PreciseCropResult {
  /** 精确裁剪区域 */
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 相关元素在裁剪区域内的相对坐标 */
  relativeElements: Array<{
    elementId: string;
    bounds: { x: number; y: number; width: number; height: number };
    isTarget: boolean;
  }>;
  /** 裁剪统计信息 */
  stats: {
    totalElements: number;
    visibleElements: number;
    cropEfficiency: number;
  };
}

/**
 * 计算智能裁剪配置，自动优化显示效果
 */
export function calculateSmartCrop(
  elementTreeData: ElementTreeData,
  screenSize?: { width: number; height: number }
): CropConfig {
  const defaultScreenSize = { width: 1080, height: 1920 };
  const actualScreenSize = screenSize || defaultScreenSize;

  // 使用精确裁剪算法
  const preciseCrop = calculatePreciseCrop(elementTreeData, {
    padding: 30,
    minSize: { width: 300, height: 200 },
    maxSize: { 
      width: actualScreenSize.width * 0.8, 
      height: actualScreenSize.height * 0.6 
    },
    includeSiblings: true,
  });

  return {
    cropArea: preciseCrop.cropArea,
    scale: 1,
    offset: { x: 0, y: 0 },
  };
}

/**
 * 根据目标元素ID计算智能裁剪（以该元素为"预览根"）
 */
export function calculateSmartCropForElement(
  elementTreeData: ElementTreeData,
  targetElementId: string,
  screenSize?: { width: number; height: number }
): CropConfig {
  const defaultScreenSize = { width: 1080, height: 1920 };
  const actualScreenSize = screenSize || defaultScreenSize;

  const { rootElement, childElements } = elementTreeData;
  const target =
    rootElement.id === targetElementId
      ? rootElement
      : childElements.find((e) => e.id === targetElementId);

  if (!target || !target.position) {
    return calculateSmartCrop(elementTreeData, actualScreenSize);
  }

  const padding = 24;
  const cropArea = {
    x: Math.max(0, target.position.x - padding),
    y: Math.max(0, target.position.y - padding),
    width: target.position.width + padding * 2,
    height: target.position.height + padding * 2,
  };

  const minSize = { width: 240, height: 180 };
  const maxSize = {
    width: Math.floor(actualScreenSize.width * 0.9),
    height: Math.floor(actualScreenSize.height * 0.7),
  };

  let w = cropArea.width;
  let h = cropArea.height;
  let x = cropArea.x;
  let y = cropArea.y;

  if (w < minSize.width) {
    const d = minSize.width - w;
    x = Math.max(0, x - d / 2);
    w = minSize.width;
  }
  if (h < minSize.height) {
    const d = minSize.height - h;
    y = Math.max(0, y - d / 2);
    h = minSize.height;
  }
  if (w > maxSize.width) {
    const d = w - maxSize.width;
    x = x + d / 2;
    w = maxSize.width;
  }
  if (h > maxSize.height) {
    const d = h - maxSize.height;
    y = y + d / 2;
    h = maxSize.height;
  }

  return {
    cropArea: { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) },
    scale: 1,
    offset: { x: 0, y: 0 },
  };
}

/**
 * 计算精确的背景图片裁剪配置
 */
export function calculatePreciseCrop(
  elementTreeData: ElementTreeData,
  options: {
    padding?: number;
    minSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
    includeSiblings?: boolean;
  } = {}
): PreciseCropResult {
  const {
    padding = 20,
    minSize = { width: 200, height: 150 },
    maxSize = { width: 800, height: 600 },
  } = options;

  const { rootElement, childElements } = elementTreeData;
  const allRelevantElements = [rootElement, ...childElements];
  
  const elementBounds = allRelevantElements.map(element => {
    let bounds: { x: number; y: number; width: number; height: number };
    
    if (element.position) {
      bounds = {
        x: element.position.x,
        y: element.position.y,
        width: element.position.width,
        height: element.position.height,
      };
    } else if (element.bounds && typeof element.bounds === 'string') {
      const matches = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (matches) {
        const [, left, top, right, bottom] = matches.map(Number);
        bounds = { x: left, y: top, width: right - left, height: bottom - top };
      } else {
        bounds = { x: 0, y: 0, width: 100, height: 50 };
      }
    } else {
      bounds = { x: 0, y: 0, width: 100, height: 50 };
    }

    return {
      elementId: element.id,
      bounds,
      isTarget: element.id === rootElement.id,
    };
  });

  if (elementBounds.length === 0) {
    throw new Error("没有找到任何相关元素");
  }

  let minX = Math.min(...elementBounds.map(e => e.bounds.x));
  let minY = Math.min(...elementBounds.map(e => e.bounds.y));
  let maxX = Math.max(...elementBounds.map(e => e.bounds.x + e.bounds.width));
  let maxY = Math.max(...elementBounds.map(e => e.bounds.y + e.bounds.height));

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = maxX + padding;
  maxY = maxY + padding;

  let cropWidth = maxX - minX;
  let cropHeight = maxY - minY;

  if (cropWidth < minSize.width) {
    const diff = minSize.width - cropWidth;
    minX = Math.max(0, minX - diff / 2);
    cropWidth = minSize.width;
  }
  if (cropHeight < minSize.height) {
    const diff = minSize.height - cropHeight;
    minY = Math.max(0, minY - diff / 2);
    cropHeight = minSize.height;
  }

  if (cropWidth > maxSize.width) {
    const diff = cropWidth - maxSize.width;
    minX = minX + diff / 2;
    cropWidth = maxSize.width;
  }
  if (cropHeight > maxSize.height) {
    const diff = cropHeight - maxSize.height;
    minY = minY + diff / 2;
    cropHeight = maxSize.height;
  }

  const cropArea = {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };

  const relativeElements = elementBounds.map(element => ({
    ...element,
    bounds: {
      x: element.bounds.x - cropArea.x,
      y: element.bounds.y - cropArea.y,
      width: element.bounds.width,
      height: element.bounds.height,
    },
  }));

  const totalElements = allRelevantElements.length;
  const visibleElements = relativeElements.filter(e => 
    e.bounds.x >= 0 && 
    e.bounds.y >= 0 && 
    e.bounds.x + e.bounds.width <= cropArea.width && 
    e.bounds.y + e.bounds.height <= cropArea.height
  ).length;

  const cropEfficiency = totalElements > 0 ? visibleElements / totalElements : 0;

  return {
    cropArea,
    relativeElements,
    stats: {
      totalElements,
      visibleElements,
      cropEfficiency,
    },
  };
}

/**
 * 检查元素是否在裁剪区域内
 */
export function isElementInCropArea(
  elementBounds: { x: number; y: number; width: number; height: number },
  cropArea: { x: number; y: number; width: number; height: number },
  threshold: number = 0.5
): boolean {
  const overlapArea = calculateOverlapArea(elementBounds, cropArea);
  const elementArea = elementBounds.width * elementBounds.height;
  
  if (elementArea === 0) return false;
  
  const overlapRatio = overlapArea / elementArea;
  return overlapRatio >= threshold;
}

/**
 * 计算两个区域的重叠面积
 */
function calculateOverlapArea(
  area1: { x: number; y: number; width: number; height: number },
  area2: { x: number; y: number; width: number; height: number }
): number {
  const left = Math.max(area1.x, area2.x);
  const top = Math.max(area1.y, area2.y);
  const right = Math.min(area1.x + area1.width, area2.x + area2.width);
  const bottom = Math.min(area1.y + area1.height, area2.y + area2.height);

  if (left >= right || top >= bottom) {
    return 0;
  }

  return (right - left) * (bottom - top);
}
