// src/modules/structural-matching/ui/components/visual-preview/utils/structural-matching-attribute-normalizer.ts
// module: structural-matching | layer: ui | role: utils
// summary: 提供对元素 text/content-desc/resource-id/class 等字段的回退归一计算

import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

/**
 * 归一后的可显示属性
 */
export interface StructuralMatchingNormalizedAttributes {
  text?: string;
  contentDesc?: string;
  resourceId?: string;
  className?: string;
}

/**
 * 从 VisualUIElement 计算回退后的显示属性
 * 规则：
 * - text: 优先 element.text，其次 element.description（若明显是由 content-desc 衍生），再其次为 class 尾串
 * - contentDesc: 优先 element.contentDesc；若空，尝试从 description 猜测（当 description 与 class 尾串不同且非空）
 * - resourceId: 直接使用 element.resourceId
 * - className: 直接使用 element.className 或 type
 */
export function normalizeAttributes(
  el?: VisualUIElement | null
): StructuralMatchingNormalizedAttributes {
  if (!el) return {};

  const classTail = (el.className || el.type || "")
    .toString()
    .split(".")
    .pop() || "";

  const norm: StructuralMatchingNormalizedAttributes = {};

  // text
  if (el.text && el.text.trim()) {
    norm.text = el.text.trim();
  } else if (el.description && el.description.trim()) {
    // 当 text 为空且 description 存在时，使用 description 作为显示文本
    norm.text = el.description.trim();
  } else if (classTail) {
    norm.text = classTail;
  }

  // contentDesc
  if (el.contentDesc && el.contentDesc.trim()) {
    norm.contentDesc = el.contentDesc.trim();
  } else if (
    el.description &&
    el.description.trim() &&
    (!classTail || el.description.trim() !== classTail)
  ) {
    // 当 description 明显不是 class 尾串时，可将其作为 content-desc 的展示回退
    norm.contentDesc = el.description.trim();
  }

  // resourceId
  if (el.resourceId && el.resourceId.trim()) {
    norm.resourceId = el.resourceId.trim();
  }

  // className
  if (el.className && el.className.trim()) {
    norm.className = el.className.trim();
  } else if (classTail) {
    norm.className = classTail;
  }

  return norm;
}
