// src/modules/structural-matching/ui/components/visual-preview/utils/structural-matching-subtree-extractor.ts
// module: structural-matching | layer: ui | role: 工具
// summary: 结构匹配子树提取器 - 从XML中按根元素ID提取其子树（拍平列表）

import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";
import { parseBounds } from "../../../../../../components/universal-ui/xml-parser";

/**
 * 从 XML 文本中提取以 rootElementId 为根的子树元素，并返回：
 * - 根元素（包含 position、bounds 等）
 * - 所有后代元素的拍平数组（用于覆盖层渲染）
 * - 根元素的矩形边界
 *
 * 说明：
 * - rootElementId 支持 `element-43` 与 `element_43` 两种格式
 * - 与新版"元素结构树"组件保持一致：按照 XML 节点的真实父子关系递归提取
 */
export function extractSubtreeElementsFromXml(
  xmlContent: string,
  rootElementId: string,
  maxDepth: number = 5
): {
  root: VisualUIElement | null;
  descendants: VisualUIElement[];
  rootBounds: { x: number; y: number; width: number; height: number } | null;
} {
  if (!xmlContent || !rootElementId) {
    return { root: null, descendants: [], rootBounds: null };
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

    // 解析错误处理
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error(
        "❌ [StructuralMatching] XML解析错误:",
        parserError.textContent
      );
      return { root: null, descendants: [], rootBounds: null };
    }

    const allNodes = xmlDoc.querySelectorAll("node");
    const indexMatch = rootElementId.toString().match(/element[-_](\d+)/);
    const rootIndex = indexMatch ? parseInt(indexMatch[1], 10) : -1;

    if (rootIndex < 0 || rootIndex >= allNodes.length) {
      console.warn("⚠️ [StructuralMatching] 根元素索引无效:", {
        rootElementId,
        rootIndex,
        total: allNodes.length,
      });
      return { root: null, descendants: [], rootBounds: null };
    }

    // 定位根节点
    const rootNode = allNodes[rootIndex];

    // 工具：将 XML 节点转换为 VisualUIElement
    const toVisualElement = (node: Element, index: number): VisualUIElement => {
      const boundsStr = node.getAttribute("bounds") || "";
      const position = parseBounds(boundsStr);
      const className = node.getAttribute("class") || "";
      const clickable = node.getAttribute("clickable") === "true";
      const text = node.getAttribute("text") || "";
      const contentDesc = node.getAttribute("content-desc") || "";
      const resourceId = node.getAttribute("resource-id") || "";

      return {
        id: `element-${index}`,
        text,
        description: contentDesc || className.split(".").pop() || "",
        type: className.split(".").pop() || "Unknown",
        category: "uncategorized",
        position,
        clickable,
        importance: "low",
        userFriendlyName: className.split(".").pop() || "Element",
        xmlIndex: index,
        resourceId: resourceId || undefined,
        contentDesc: contentDesc || undefined,
        className: className || undefined,
        bounds: boundsStr || undefined,
        // 其余可选字段保持缺省
      } as VisualUIElement;
    };

    const root = toVisualElement(rootNode, rootIndex);
    const rootBounds = root.position
      ? {
          x: root.position.x,
          y: root.position.y,
          width: root.position.width,
          height: root.position.height,
        }
      : null;

    // 递归收集后代（拍平）
    const descendants: VisualUIElement[] = [];

    const walk = (node: Element, depth: number) => {
      if (depth >= maxDepth) return;
      const children = Array.from(node.children).filter(
        (el) => el.tagName.toLowerCase() === "node"
      ) as Element[];

      for (const child of children) {
        // 找到 child 在 allNodes 中的索引（用于生成与解析器一致的ID）
        const childIndex = Array.from(allNodes).indexOf(child);
        const ve = toVisualElement(child, childIndex);
        descendants.push(ve);
        walk(child, depth + 1);
      }
    };

    walk(rootNode, 0);

    // 调试：统计
    if (process.env.NODE_ENV === "development") {
      console.log("🌿 [StructuralMatching] 子树提取完成:", {
        rootId: root.id,
        rootXmlIndex: rootIndex,
        descendants: descendants.length,
        bySample: descendants
          .slice(0, 5)
          .map((d) => ({ id: d.id, type: d.type, text: d.text })),
        rootBounds,
      });
    }

    return { root, descendants, rootBounds };
  } catch (e) {
    console.error("❌ [StructuralMatching] 子树提取失败:", e);
    return { root: null, descendants: [], rootBounds: null };
  }
}

/**
 * 提取给定根元素的父元素（-1 层）。若不存在则返回 null。
 * 返回的 VisualUIElement.id 使用 `element-<index>` 规范，便于与解析器一致。
 */
export function extractParentElementFromXml(
  xmlContent: string,
  rootElementId: string
): VisualUIElement | null {
  if (!xmlContent || !rootElementId) return null;
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    const allNodes = xmlDoc.querySelectorAll("node");
    const indexMatch = rootElementId.toString().match(/element[-_](\d+)/);
    const rootIndex = indexMatch ? parseInt(indexMatch[1], 10) : -1;
    if (rootIndex < 0 || rootIndex >= allNodes.length) return null;

    const node = allNodes[rootIndex];
    const parent = node.parentElement as Element | null;
    if (!parent || parent.tagName.toLowerCase() !== "node") return null;

    const parentIndex = Array.from(allNodes).indexOf(parent);
    if (parentIndex < 0) return null;

    const boundsStr = parent.getAttribute("bounds") || "";
    const position = parseBounds(boundsStr);
    const className = parent.getAttribute("class") || "";
    const clickable = parent.getAttribute("clickable") === "true";
    const text = parent.getAttribute("text") || "";
    const contentDesc = parent.getAttribute("content-desc") || "";
    const resourceId = parent.getAttribute("resource-id") || "";

    const ve: VisualUIElement = {
      id: `element-${parentIndex}`,
      text,
      description: contentDesc || className.split(".").pop() || "",
      type: className.split(".").pop() || "Unknown",
      category: "uncategorized",
      position,
      clickable,
      importance: "low",
      userFriendlyName: className.split(".").pop() || "Element",
      xmlIndex: parentIndex,
      resourceId: resourceId || undefined,
      contentDesc: contentDesc || undefined,
      className: className || undefined,
      bounds: boundsStr || undefined,
    } as VisualUIElement;

    return ve;
  } catch (e) {
    console.error("❌ [StructuralMatching] 父元素提取失败:", e);
    return null;
  }
}

/**
 * 提取指定 elementId 的单个元素（不含子孙），用于直接拿到其 bounds/position
 */
export function extractElementByIdFromXml(
  xmlContent: string,
  elementId: string
): VisualUIElement | null {
  if (!xmlContent || !elementId) return null;
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    const allNodes = xmlDoc.querySelectorAll("node");
    const indexMatch = elementId.toString().match(/element[-_](\d+)/);
    const idx = indexMatch ? parseInt(indexMatch[1], 10) : -1;
    if (idx < 0 || idx >= allNodes.length) return null;

    const node = allNodes[idx];
    const boundsStr = node.getAttribute("bounds") || "";
    const position = parseBounds(boundsStr);
    const className = node.getAttribute("class") || "";
    const clickable = node.getAttribute("clickable") === "true";
    const text = node.getAttribute("text") || "";
    const contentDesc = node.getAttribute("content-desc") || "";
    const resourceId = node.getAttribute("resource-id") || "";

    const ve: VisualUIElement = {
      id: `element-${idx}`,
      text,
      description: contentDesc || className.split(".").pop() || "",
      type: className.split(".").pop() || "Unknown",
      category: "uncategorized",
      position,
      clickable,
      importance: "low",
      userFriendlyName: className.split(".").pop() || "Element",
      xmlIndex: idx,
      resourceId: resourceId || undefined,
      contentDesc: contentDesc || undefined,
      className: className || undefined,
      bounds: boundsStr || undefined,
    } as VisualUIElement;

    return ve;
  } catch (e) {
    console.error("❌ [StructuralMatching] 单元素提取失败:", e);
    return null;
  }
}
