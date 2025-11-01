// src/modules/structural-matching/ui/components/visual-preview/floating-window/utils/precise-crop-calculator.ts
// module: structural-matching | layer: ui | role: utils
// summary: 精确背景裁剪计算工具

import { ElementTreeData, CropConfig } from "../types";
import type { VisualUIElement } from "../../../../../../components/universal-ui/types";

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
    isTarget: boolean; // 是否为目标元素
  }>;
  /** 裁剪统计信息 */
  stats: {
    totalElements: number;
    visibleElements: number;
    cropEfficiency: number; // 0-1，裁剪效率
  };
}

/**
 * 计算精确的背景图片裁剪配置
 * 只显示元素结构树相关的部分，隐藏其他无关区域
 */
export function calculatePreciseCrop(
  elementTreeData: ElementTreeData,
  options: {
    /** 边距，确保边缘元素完整显示 */
    padding?: number;
    /** 最小裁剪尺寸，避免太小的窗口 */
    minSize?: { width: number; height: number };
    /** 最大裁剪尺寸，避免太大的窗口 */
    maxSize?: { width: number; height: number };
    /** 是否包含兄弟元素 */
    includeSiblings?: boolean;
  } = {}
): PreciseCropResult {
  const {
    padding = 20,
    minSize = { width: 200, height: 150 },
    maxSize = { width: 800, height: 600 },
    includeSiblings = true,
  } = options;

  const { rootElement, childElements, bounds: rootBounds } = elementTreeData;

  console.log("🎯 [PreciseCrop] 开始计算精确裁剪:", {
    rootElement: rootElement.id,
    childElementsCount: childElements.length,
    rootBounds,
    options,
  });

  // 1. 收集所有相关元素的边界
  const allRelevantElements = [rootElement, ...childElements];
  const elementBounds = allRelevantElements.map(element => {
    let bounds: { x: number; y: number; width: number; height: number };
    
    if (element.position) {
      // 使用position信息
      bounds = {
        x: element.position.x,
        y: element.position.y,
        width: element.position.width,
        height: element.position.height,
      };
    } else if (element.bounds && typeof element.bounds === 'string') {
      // 解析bounds字符串
      const matches = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (matches) {
        const [, left, top, right, bottom] = matches.map(Number);
        bounds = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        };
      } else {
        // 默认边界
        bounds = { x: 0, y: 0, width: 100, height: 50 };
      }
    } else {
      // 默认边界
      bounds = { x: 0, y: 0, width: 100, height: 50 };
    }

    return {
      elementId: element.id,
      bounds,
      isTarget: element.id === rootElement.id,
    };
  });

  console.log("📐 [PreciseCrop] 元素边界信息:", elementBounds);

  // 2. 计算包含所有相关元素的最小边界框
  if (elementBounds.length === 0) {
    throw new Error("没有找到任何相关元素");
  }

  let minX = Math.min(...elementBounds.map(e => e.bounds.x));
  let minY = Math.min(...elementBounds.map(e => e.bounds.y));
  let maxX = Math.max(...elementBounds.map(e => e.bounds.x + e.bounds.width));
  let maxY = Math.max(...elementBounds.map(e => e.bounds.y + e.bounds.height));

  // 3. 添加边距
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = maxX + padding;
  maxY = maxY + padding;

  // 4. 应用尺寸限制
  let cropWidth = maxX - minX;
  let cropHeight = maxY - minY;

  // 应用最小尺寸
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

  // 应用最大尺寸
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

  // 5. 计算相对坐标
  const relativeElements = elementBounds.map(element => ({
    ...element,
    bounds: {
      x: element.bounds.x - cropArea.x,
      y: element.bounds.y - cropArea.y,
      width: element.bounds.width,
      height: element.bounds.height,
    },
  }));

  // 6. 计算统计信息
  const totalElements = allRelevantElements.length;
  const visibleElements = relativeElements.filter(e => 
    e.bounds.x >= 0 && 
    e.bounds.y >= 0 && 
    e.bounds.x + e.bounds.width <= cropArea.width && 
    e.bounds.y + e.bounds.height <= cropArea.height
  ).length;

  const cropEfficiency = totalElements > 0 ? visibleElements / totalElements : 0;

  const result: PreciseCropResult = {
    cropArea,
    relativeElements,
    stats: {
      totalElements,
      visibleElements,
      cropEfficiency,
    },
  };

  console.log("✅ [PreciseCrop] 计算完成:", result);

  return result;
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

  // 转换为CropConfig格式
  return {
    cropArea: preciseCrop.cropArea,
    scale: 1,
    offset: { x: 0, y: 0 },
  };
}

/**
 * 检查元素是否在裁剪区域内
 */
export function isElementInCropArea(
  elementBounds: { x: number; y: number; width: number; height: number },
  cropArea: { x: number; y: number; width: number; height: number },
  threshold: number = 0.5 // 重叠阈值
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