import type { UIElement } from "../types";

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

export const isUnknownLabel = (label: string): boolean => {
  const hasUnknownWord = label.includes("未知") || label.includes("未命名");
  const isGeneric = /^元素\s+\d+$/i.test(label.trim());
  return hasUnknownWord || isGeneric;
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
  const enriched = elements.map((el, i) => ({ el, i }));
  return enriched
    .sort((a, b) => {
      // 1) 语义分组（可点击/有文本/有ID）
      if (prioritizeSemantic) {
        const sa = semanticScore(a.el);
        const sb = semanticScore(b.el);
        if (sa !== sb) return sb - sa; // 高分在前
      }

      // 2) 未知/未命名/占位 放后
      const aLabel = getDisplayText(a.el, a.i);
      const bLabel = getDisplayText(b.el, b.i);
      const aUnknown = isUnknownLabel(aLabel);
      const bUnknown = isUnknownLabel(bLabel);
      if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;

      // 3) 稳定：按原始顺序
      return a.i - b.i;
    })
    .map((x) => x.el);
};
