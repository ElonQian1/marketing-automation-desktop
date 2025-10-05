import type { UIElement } from "../types";
import { sortByScoreThenUnknownLastStable } from "../../shared/utils/sorting";

// 统一生成用于展示的名称
export const getDisplayText = (el: UIElement, idx?: number): string => {
  return (
    el.text ||
    el.content_desc ||
    el.resource_id ||
    el.class_name ||
    (typeof idx === "number" ? `元素 ${idx + 1}` : "未命名元素")
  );
};

// 语义评分：可点击 > 有文本 > 有ID > 其他（用于分组排序）
export const semanticScore = (el: UIElement): number => {
  let score = 0;
  if (el.is_clickable || el.class_name?.includes("Button")) score += 3;
  if (el.text && el.text.trim()) score += 2;
  if (el.resource_id) score += 1;
  return score; // 0..6
};

export interface SortOptions {
  prioritizeSemantic?: boolean; // 默认 true
}

export const sortElements = (
  elements: UIElement[],
  options: SortOptions = {}
): UIElement[] => {
  const { prioritizeSemantic = true } = options;
  return sortByScoreThenUnknownLastStable(
    elements,
    (el) => semanticScore(el),
    (el, i) => getDisplayText(el, i),
    prioritizeSemantic
  );
};
