// src/modules/structural-matching/ui/components/visual-preview/core/structural-matching-bounds-corrector.ts
// module: structural-matching | layer: ui | role: 核心算法
// summary: 结构匹配元素边界修正器

import type { ElementTreeData, StepCardData } from "../types";
import type { VisualUIElement } from "@/components/universal-ui/types";

export interface CorrectedElementBounds {
  /** 修正后的根元素（用户实际点击的元素） */
  correctedRootElement: VisualUIElement;
  /** 修正后的边界信息 */
  correctedBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 是否进行了修正 */
  wasCorrected: boolean;
  /** 修正说明 */
  correctionReason?: string;
}

/**
 * 修正元素边界，确保视口对齐使用正确的元素
 *
 * 问题：结构匹配可能会使用"父一层元素"，导致视口范围过大
 * 解决：基于用户实际点击的元素（stepCardData.original_element）来修正边界
 */
export function correctElementBounds(
  elementTreeData: ElementTreeData,
  stepCardData?: StepCardData
): CorrectedElementBounds {
  console.log("🔧 [ElementBoundsCorrector] ===== 边界修正函数被调用 =====");
  console.log("🔧 [ElementBoundsCorrector] 开始修正元素边界:", {
    currentRootElement: elementTreeData.rootElement.id,
    currentBounds: elementTreeData.bounds,
    hasOriginalElement: !!stepCardData?.original_element,
    stepCardDataKeys: stepCardData ? Object.keys(stepCardData) : "undefined",
  });

  // 如果没有原始元素数据，无法修正
  if (!stepCardData?.original_element) {
    return {
      correctedRootElement: elementTreeData.rootElement,
      correctedBounds: elementTreeData.bounds,
      wasCorrected: false,
    };
  }

  // 🚫 禁用智能边界修正 - 直接返回用户选择的元素
  console.log(
    "🚫 [ElementBoundsCorrector] 智能边界修正已禁用，使用用户点击的元素"
  );

  return {
    correctedRootElement: elementTreeData.rootElement,
    correctedBounds: elementTreeData.bounds,
    wasCorrected: false,
    correctionReason: "智能边界修正已禁用 - 使用用户原始选择",
  };
}

/**
 * 从元素中提取边界信息
 */
function extractBoundsFromElement(element: VisualUIElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  // 优先使用position信息
  if (element.position) {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.position.width,
      height: element.position.height,
    };
  }

  // 回退到bounds字符串
  if (element.bounds && typeof element.bounds === "string") {
    const matches = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (matches) {
      const [, left, top, right, bottom] = matches.map(Number);
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };
    }
  }

  console.warn("⚠️ [ElementBoundsCorrector] 无法提取边界信息，使用默认值");
  return { x: 0, y: 0, width: 100, height: 100 };
}

/**
 * 基于修正后的边界重新筛选子元素
 */
export function recalculateChildElements(
  allElements: VisualUIElement[],
  correctedBounds: { x: number; y: number; width: number; height: number },
  rootElementId: string
): VisualUIElement[] {
  console.log("🔄 [ElementBoundsCorrector] 重新筛选子元素:", {
    总元素数: allElements.length,
    修正后边界: correctedBounds,
    根元素ID: rootElementId,
  });

  const childElements = allElements.filter((element: VisualUIElement) => {
    if (!element.position) return false;

    const elementBounds = element.position;

    // 检查元素是否与修正后的边界有重叠
    const hasOverlap = !(
      elementBounds.x + elementBounds.width <= correctedBounds.x ||
      elementBounds.x >= correctedBounds.x + correctedBounds.width ||
      elementBounds.y + elementBounds.height <= correctedBounds.y ||
      elementBounds.y >= correctedBounds.y + correctedBounds.height
    );

    // 排除根元素本身
    const isNotRoot = element.id !== rootElementId;

    return hasOverlap && isNotRoot;
  });

  console.log("✅ [ElementBoundsCorrector] 重新筛选完成:", {
    原始子元素数: allElements.length,
    修正后子元素数: childElements.length,
  });

  return childElements;
}
