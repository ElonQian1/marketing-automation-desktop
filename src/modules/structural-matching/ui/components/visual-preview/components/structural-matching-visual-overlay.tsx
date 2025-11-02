// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-visual-overlay.tsx
// module: structural-matching | layer: ui | role: 适配器组件
// summary: 结构匹配可视化覆盖层适配器 - 提供旧版接口兼容

import React, { useMemo } from "react";
import { StructuralMatchingFloatingWindow } from "./structural-matching-floating-window";
import type { StepCardData } from "../types";
import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

/**
 * 可视化覆盖层属性接口
 */
export interface StructuralMatchingVisualOverlayProps {
  /** 是否显示悬浮层 */
  visible: boolean;
  /** 选中的元素数据 */
  selectedElement: Record<string, unknown> | null;
  /** 高亮元素ID */
  highlightedElementId?: string | null;
  /** 鼠标位置 */
  mousePosition?: { x: number; y: number };
  /** 显示延迟 */
  delay?: number;
}

/**
 * 将selectedElement转换为StepCardData格式
 */
function convertToStepCardData(
  selectedElement: Record<string, unknown> | null
): StepCardData | undefined {
  if (!selectedElement) return undefined;

  // 处理可能的嵌套结构
  type NestedElement = {
    selectedElement?: Record<string, unknown>;
  };
  const actualElement =
    (selectedElement as NestedElement)?.selectedElement || selectedElement;

  // 定义已知的字段类型
  type KnownElement = {
    id?: string;
    xmlCacheId?: string;
    xpath?: string;
    bounds?: string | { left: number; top: number; right: number; bottom: number };
    text?: string;
    resourceId?: string;
    resource_id?: string;
    className?: string;
    class_name?: string;
    clickable?: boolean;
    contentDesc?: string;
    content_desc?: string;
    description?: string;
    // 可能来自XML风格的连字符字段
    [key: string]: unknown;
  };

  type BoundsObject = {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };

  const element = actualElement as KnownElement;

  // 读取字符串工具，兼容连字符字段
  const pickString = (obj: Record<string, unknown>, key: string) => {
    const v = obj[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  const dashedContentDesc = pickString(actualElement, "content-desc");
  const dashedResourceId = pickString(actualElement, "resource-id");
  const dashedClass = pickString(actualElement, "class");
  // 下划线风格（demo/旧数据常见）
  const snakeResourceId = pickString(actualElement, "resource_id");
  const snakeClassName = pickString(actualElement, "class_name");

  const parseBoundsString = (bounds: string | undefined) => {
    if (!bounds) return undefined;

    const match = bounds.match(
      /\[(\-?\d+)\s*,\s*(\-?\d+)\]\[(\-?\d+)\s*,\s*(\-?\d+)\]/
    );
    if (!match) return undefined;

    const [, left, top, right, bottom] = match.map(Number);
    const width = right - left;
    const height = bottom - top;

    if (
      Number.isNaN(left) ||
      Number.isNaN(top) ||
      Number.isNaN(width) ||
      Number.isNaN(height)
    ) {
      return undefined;
    }

    return {
      x: left,
      y: top,
      width,
      height,
    };
  };

  // 处理bounds字段 - 确保转换为字符串格式
  let boundsString: string | undefined;
  if (typeof element.bounds === "string") {
    boundsString = element.bounds;
  } else if (element.bounds && typeof element.bounds === "object") {
    const boundsObj = element.bounds as BoundsObject;
    boundsString = `[${boundsObj.left},${boundsObj.top}][${boundsObj.right},${boundsObj.bottom}]`;
  }

  const resolvedPosition = (() => {
    if (element.bounds && typeof element.bounds === "object") {
      const boundsObj = element.bounds as BoundsObject;
      return {
        x: boundsObj.left,
        y: boundsObj.top,
        width: boundsObj.right - boundsObj.left,
        height: boundsObj.bottom - boundsObj.top,
      };
    }
    return parseBoundsString(boundsString);
  })();

  // 创建兼容的original_element
  // 生成稳定的唯一ID：优先使用已有id/resourceId/xpath；否则基于位置和类型生成确定性ID
  const deterministicId =
    element.id ||
    element.resourceId ||
    element.xpath ||
    (resolvedPosition
      ? `cls_${(element.className || 'unknown').replace(/[^a-zA-Z0-9_.$]/g, '_')}` +
        `_${resolvedPosition.x}_${resolvedPosition.y}_${resolvedPosition.width}_${resolvedPosition.height}`
      : `cls_${(element.className || 'unknown').replace(/[^a-zA-Z0-9_.$]/g, '_')}_unknown_bounds`);

  const compatibleElement: VisualUIElement = {
    id: deterministicId,
    text: element.text || "",
    description:
      element.description || element.contentDesc || element.content_desc || dashedContentDesc || "",
    type: element.className || snakeClassName || dashedClass || "",
    category: "unknown", // 默认分类
    position: resolvedPosition || { x: 0, y: 0, width: 0, height: 0 },
    // 不要默认标记为可点击，缺省即为不可点击
    clickable: element.clickable === true,
    importance: "medium" as const,
    userFriendlyName: element.text || element.id || "",
    resourceId: element.resourceId || snakeResourceId || dashedResourceId,
    className: element.className || snakeClassName || dashedClass,
    contentDesc: element.contentDesc || element.content_desc || dashedContentDesc,
    bounds: boundsString, // 使用转换后的字符串格式
  };

  // 开发期调试：观察字段解析来源
  if (process.env.NODE_ENV === "development") {
    // 仅输出关键信息，避免刷屏
    console.log("🧩 [StructuralMatching] 字段解析:", {
      id: compatibleElement.id,
      text: compatibleElement.text || "(空)",
      contentDesc:
        compatibleElement.contentDesc !== undefined
          ? compatibleElement.contentDesc || "(空)"
          : "(未定义)",
      resourceId: compatibleElement.resourceId || "(空)",
      className: compatibleElement.className || "(空)",
      source: {
        contentDesc: element.contentDesc
          ? "contentDesc"
          : element.content_desc
          ? "content_desc"
          : dashedContentDesc
          ? "content-desc"
          : "none",
        resourceId: element.resourceId
          ? "resourceId"
          : snakeResourceId
          ? "resource_id"
          : dashedResourceId
          ? "resource-id"
          : "none",
        className: element.className
          ? "className"
          : snakeClassName
          ? "class_name"
          : dashedClass
          ? "class"
          : "none",
      },
    });
  }

  // 验证XPath有效性 - 只有真正的XPath才应该被使用
  const validXPath = (() => {
    const xpathCandidate = element.xpath;
    if (!xpathCandidate || typeof xpathCandidate !== 'string') {
      return undefined;
    }
    
    // 检查是否是有效的XPath格式（应该以 / 或 // 开头）
    if (xpathCandidate.startsWith('/')) {
      return xpathCandidate;
    }
    
    // 如果看起来像element_id格式，不应该作为XPath使用
    if (/^element_?\d+$/.test(xpathCandidate)) {
      console.warn('🚫 [StructuralMatching] 检测到类似元素ID的XPath，跳过:', xpathCandidate);
      return undefined;
    }
    
    console.warn('🚫 [StructuralMatching] 无效的XPath格式，跳过:', xpathCandidate);
    return undefined;
  })();

  // 转换为StepCardData格式
  const stepCardData: StepCardData = {
    original_element: compatibleElement,
    xmlCacheId: element.xmlCacheId,
    elementContext: {
      xpath: validXPath, // 只使用验证过的有效XPath
      bounds: boundsString,
      text: element.text,
      resourceId: element.resourceId || snakeResourceId || dashedResourceId,
      className: element.className || snakeClassName || dashedClass,
    },
  };

  return stepCardData;
}

/**
 * 结构匹配可视化覆盖层适配器
 * 将外部接口转换为内部模块化组件格式
 */
export const StructuralMatchingVisualOverlay: React.FC<
  StructuralMatchingVisualOverlayProps
> = ({
  visible,
  selectedElement,
  highlightedElementId,
  mousePosition,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay = 0, // 保持接口兼容，但实际不使用
}) => {
  // 转换数据格式
  const stepCardData = useMemo(
    () => convertToStepCardData(selectedElement),
    [selectedElement]
  );

  // 计算初始位置
  const initialPosition = useMemo(() => {
    if (mousePosition) {
      return {
        x: Math.max(50, mousePosition.x - 300), // 窗口宽度的一半
        y: Math.max(50, mousePosition.y + 20), // 鼠标下方一点
      };
    }
    return { x: 100, y: 100 };
  }, [mousePosition]);

  if (process.env.NODE_ENV === "development") {
    console.log("🔄 [StructuralMatching] 可视化覆盖层适配器转换数据:", {
      visible,
      hasSelectedElement: !!selectedElement,
      stepCardData,
      highlightedElementId,
      initialPosition,
    });
  }

  return (
    <StructuralMatchingFloatingWindow
      visible={visible}
      stepCardData={stepCardData}
      highlightedElementId={highlightedElementId}
      initialPosition={initialPosition}
    />
  );
};
