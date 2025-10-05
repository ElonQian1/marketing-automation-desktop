import type { VisualFilterConfig, VisualUIElement } from "../../types";
import type { UIElement } from "../../../../api/universalUIAPI";

// 从 UIElement 判断“可点击”：真实 is_clickable 或根据配置的启发式（Button/TextView）
export function isClickableFromUI(el: UIElement, cfg?: VisualFilterConfig): boolean {
  const className = el.class_name || '';
  const heuristics = !!cfg?.treatButtonAsClickable && /Button|TextView/i.test(className);
  return el.is_clickable === true || heuristics;
}

// 从 VisualUIElement 判断“可点击”：真实 clickable 或根据配置的启发式（Button/TextView）
export function isClickableFromVisual(el: VisualUIElement, cfg?: VisualFilterConfig): boolean {
  const className = (el.element_type || el.type || el.description || '').toString();
  const heuristics = !!cfg?.treatButtonAsClickable && /Button|TextView/i.test(className);
  return el.clickable === true || heuristics;
}
