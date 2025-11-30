// src/components/universal-ui/data-transform/UIElementToVisualConverter.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UI元素到可视化元素转换器
 * 负责将 UIElement 映射为 VisualUIElement，以便在可视化视图中统一展示
 */

import { UIElement } from "../../../api/universalUIAPI";
import { VisualUIElement } from "../xml-parser/types";

export class UIElementToVisualConverter {
  /**
   * 简单转换（兼容旧接口）
   * @param element UIElement
   * @returns VisualUIElement
   */
  static convertSimple(element: UIElement): VisualUIElement {
    const bounds = element.bounds;
    const position = {
      x: bounds.left,
      y: bounds.top,
      width: Math.max(0, bounds.right - bounds.left),
      height: Math.max(0, bounds.bottom - bounds.top),
    };

    return {
      id: element.id,
      text: element.text || "",
      description: element.content_desc || "",
      type: element.element_type || "Unknown",
      category: this.inferCategory(element),
      position,
      clickable: !!element.is_clickable,
      importance: "medium",
      userFriendlyName: element.text || element.element_type || "元素",
      // 🔧 补充关键属性，确保 convertVisualToUIElement 能还原完整信息
      className: element.class_name,
      resourceId: element.resource_id,
      contentDesc: element.content_desc,
      bounds: `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`,
      indexPath: element.indexPath,
    };
  }

  /**
   * 批量转换
   */
  static convertBatch(elements: UIElement[]): VisualUIElement[] {
    return elements.map((el) => this.convertSimple(el));
  }

  /**
   * 简单的分类推断
   */
  private static inferCategory(element: UIElement): string {
    const type = (element.element_type || "").toLowerCase();
    if (type.includes("text")) return "text";
    if (type.includes("image")) return "image";
    if (type.includes("layout") || type.includes("viewgroup"))
      return "container";
    if (element.is_clickable) return "interactive";
    return "all";
  }
}
