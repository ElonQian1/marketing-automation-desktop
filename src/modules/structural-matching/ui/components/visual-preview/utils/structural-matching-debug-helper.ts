// src/modules/structural-matching/ui/components/visual-preview/utils/structural-matching-debug-helper.ts
// module: structural-matching | layer: ui | role: 工具函数
// summary: 结构匹配裁剪调试工具

import type { ElementTreeData, CropConfig } from "../types";
import { calculatePreciseCrop, type PreciseCropResult } from "../core/structural-matching-crop-calculator";

/**
 * 调试信息接口
 */
export interface CropDebugInfo {
  /** 原始数据 */
  original: {
    rootElement: string;
    childCount: number;
    totalBounds: { x: number; y: number; width: number; height: number };
  };
  /** 裁剪结果 */
  crop: PreciseCropResult;
  /** 优化建议 */
  suggestions: string[];
  /** 统计对比 */
  comparison: {
    originalArea: number;
    croppedArea: number;
    reductionRatio: number;
  };
}

/**
 * 生成裁剪调试信息
 */
export function generateCropDebugInfo(elementTreeData: ElementTreeData): CropDebugInfo {
  const { rootElement, childElements, bounds } = elementTreeData;
  
  // 计算精确裁剪
  const cropResult = calculatePreciseCrop(elementTreeData, {
    padding: 30,
    minSize: { width: 300, height: 200 },
    maxSize: { width: 800, height: 600 },
  });

  // 生成优化建议
  const suggestions: string[] = [];
  
  if (cropResult.stats.cropEfficiency < 0.8) {
    suggestions.push("裁剪效率较低，建议调整padding或包含更多相关元素");
  }
  
  if (cropResult.cropArea.width > 600 || cropResult.cropArea.height > 400) {
    suggestions.push("裁剪区域较大，考虑进一步优化显示范围");
  }
  
  if (cropResult.stats.visibleElements < cropResult.stats.totalElements * 0.7) {
    suggestions.push("部分元素被裁剪掉，建议扩大显示区域");
  }

  // 计算统计对比
  const originalArea = bounds.width * bounds.height;
  const croppedArea = cropResult.cropArea.width * cropResult.cropArea.height;
  const reductionRatio = originalArea > 0 ? (originalArea - croppedArea) / originalArea : 0;

  return {
    original: {
      rootElement: rootElement.id,
      childCount: childElements.length,
      totalBounds: bounds,
    },
    crop: cropResult,
    suggestions,
    comparison: {
      originalArea,
      croppedArea,
      reductionRatio,
    },
  };
}

/**
 * 在控制台输出裁剪调试信息
 */
export function logCropDebugInfo(debugInfo: CropDebugInfo): void {
  console.group("🎯 [StructuralMatching] 精确裁剪调试信息");
  
  console.log("📊 原始数据:", debugInfo.original);
  console.log("✂️ 裁剪结果:", debugInfo.crop);
  console.log("📈 统计对比:", debugInfo.comparison);
  
  if (debugInfo.suggestions.length > 0) {
    console.log("💡 优化建议:", debugInfo.suggestions);
  }
  
  console.groupEnd();
}

/**
 * 验证裁剪配置的有效性
 */
export function validateCropConfig(cropConfig: CropConfig): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (cropConfig.cropArea.width <= 0 || cropConfig.cropArea.height <= 0) {
    issues.push("裁剪区域尺寸无效");
  }
  
  if (cropConfig.cropArea.x < 0 || cropConfig.cropArea.y < 0) {
    issues.push("裁剪区域位置包含负坐标");
  }
  
  if (cropConfig.scale <= 0) {
    issues.push("缩放比例无效");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * 创建调试用的可视化数据
 */
export function createDebugVisualization(
  elementTreeData: ElementTreeData,
  cropConfig: CropConfig
): {
  /** 裁剪前的元素边界（用于对比） */
  originalElements: Array<{
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
    color: string;
  }>;
  /** 裁剪后的元素边界 */
  croppedElements: Array<{
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
    color: string;
  }>;
  /** 裁剪区域边界 */
  cropBoundary: { x: number; y: number; width: number; height: number };
} {
  const { rootElement, childElements } = elementTreeData;
  const { cropArea } = cropConfig;
  
  // 生成颜色
  const generateColor = (index: number, isTarget: boolean): string => {
    if (isTarget) return "#722ed1"; // 紫色 - 目标元素
    const colors = ["#52c41a", "#1890ff", "#fa8c16", "#eb2f96", "#13c2c2"];
    return colors[index % colors.length];
  };
  
  const allElements = [rootElement, ...childElements];
  
  // 原始元素边界
  const originalElements = allElements.map((element, index) => {
    let bounds: { x: number; y: number; width: number; height: number };
    
    if (element.position) {
      bounds = element.position;
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
      id: element.id,
      bounds,
      color: generateColor(index, element.id === rootElement.id),
    };
  });
  
  // 裁剪后的元素边界（相对坐标）
  const croppedElements = originalElements.map(element => ({
    ...element,
    bounds: {
      x: element.bounds.x - cropArea.x,
      y: element.bounds.y - cropArea.y,
      width: element.bounds.width,
      height: element.bounds.height,
    },
  })).filter(element => {
    // 只包含在裁剪区域内可见的元素
    return element.bounds.x + element.bounds.width > 0 &&
           element.bounds.y + element.bounds.height > 0 &&
           element.bounds.x < cropArea.width &&
           element.bounds.y < cropArea.height;
  });
  
  return {
    originalElements,
    croppedElements,
    cropBoundary: cropArea,
  };
}
