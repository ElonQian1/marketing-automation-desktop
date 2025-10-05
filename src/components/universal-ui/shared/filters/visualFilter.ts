import type { VisualFilterConfig, VisualUIElement } from "../../types";
import type { UIElement } from "../../../../api/universalUIAPI";
import { isClickableFromUI, isClickableFromVisual } from "./clickableHeuristics";

// 判断是否通过类名包含/排除规则
const classMatchOk = (className: string, cfg: VisualFilterConfig) => {
  if (cfg.includeClasses.length > 0 && !cfg.includeClasses.some(k => className.includes(k))) return false;
  if (cfg.excludeClasses.length > 0 && cfg.excludeClasses.some(k => className.includes(k))) return false;
  return true;
};

// UIElement 过滤
export function filterUIElementsByConfig(elements: UIElement[], cfg?: VisualFilterConfig): UIElement[] {
  if (!cfg) return elements;
  return elements.filter(el => {
    // 尺寸
    const w = (el.bounds?.right ?? 0) - (el.bounds?.left ?? 0);
    const h = (el.bounds?.bottom ?? 0) - (el.bounds?.top ?? 0);
    if (w < cfg.minWidth || h < cfg.minHeight) return false;
    // 文本/描述
    if (cfg.requireTextOrDesc) {
      const hasText = !!(el.text && el.text.trim());
      const hasDesc = !!(el.content_desc && el.content_desc.trim());
      if (!hasText && !hasDesc) return false;
    }
    // 类名规则
    const className = el.class_name || '';
    if (!classMatchOk(className, cfg)) return false;
    // 可点击
    if (cfg.onlyClickable && !isClickableFromUI(el, cfg)) return false;
    return true;
  });
}

// VisualUIElement 过滤
export function filterVisualElementsByConfig(elements: VisualUIElement[], cfg?: VisualFilterConfig): VisualUIElement[] {
  if (!cfg) return elements;
  return elements.filter(el => {
    // 尺寸
    const w = el.position?.width ?? 0;
    const h = el.position?.height ?? 0;
    if (w < cfg.minWidth || h < cfg.minHeight) return false;
    // 文本/描述
    if (cfg.requireTextOrDesc) {
      const hasText = !!(el.text && el.text.trim());
      const hasDesc = !!(el.description && el.description.trim());
      if (!hasText && !hasDesc) return false;
    }
    // 类名规则
    const className = (el.element_type || el.type || el.description || '').toString();
    if (!classMatchOk(className, cfg)) return false;
    // 可点击
    if (cfg.onlyClickable && !isClickableFromVisual(el, cfg)) return false;
    return true;
  });
}
