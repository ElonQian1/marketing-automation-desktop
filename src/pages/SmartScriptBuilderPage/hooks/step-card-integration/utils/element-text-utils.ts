// src/pages/SmartScriptBuilderPage/hooks/step-card-integration/utils/element-text-utils.ts
// module: pages | layer: hooks | role: utils
// summary: 元素文本提取和处理工具函数

import type { UIElement } from "../../../../../api/universalUIAPI";
import type { ElementEnrichmentData } from "../types";

/**
 * 智能合并子元素文本
 * 处理"知恩"在 childrenTexts 和 parentContentDesc 都出现的情况
 */
export function smartMergeChildTexts(
  childrenTexts: string[],
  parentContentDesc?: string
): string[] {
  if (!parentContentDesc) return childrenTexts;

  // 过滤掉在父元素中已经出现的精确匹配
  const filtered = childrenTexts.filter((text) => {
    // 如果子文本完全包含在父描述中，认为是重复的
    if (parentContentDesc.includes(text)) {
      return false;
    }
    return true;
  });

  // 如果过滤后为空，保留原始的第一个
  if (filtered.length === 0 && childrenTexts.length > 0) {
    return [childrenTexts[0]];
  }

  return filtered;
}

/**
 * 生成步骤卡片标题
 * 按优先级选择最有意义的文本作为标题
 */
export function generateStepTitle(
  element: UIElement,
  context: {
    elementText?: string;
    parentElement?: {
      content_desc?: string;
      text?: string;
    };
    childrenTexts?: string[];
  }
): string {
  // 1. 优先使用元素自身的文本
  if (element.text) return element.text;

  // 2. 优先使用元素自身的 content_desc
  if (element.content_desc) return element.content_desc;

  // 3. 🆕 使用父元素的 content_desc（瀑布流卡片通常在父元素有完整描述）
  if (
    context.parentElement?.content_desc &&
    context.parentElement.content_desc.trim()
  ) {
    // 截取前20个字符作为标题，避免过长
    const desc = context.parentElement.content_desc;
    return desc.length > 20 ? desc.substring(0, 20) + "..." : desc;
  }

  // 4. 使用父元素的文本
  if (context.parentElement?.text && context.parentElement.text.trim()) {
    return context.parentElement.text;
  }

  // 5. 使用 context 中增强后的文本（来自子元素或兄弟元素）
  if (context.elementText && context.elementText.trim()) {
    return context.elementText;
  }

  // 6. 使用子元素文本列表的第一个
  if (context.childrenTexts && context.childrenTexts.length > 0) {
    const firstChildText = context.childrenTexts[0];
    if (firstChildText && firstChildText.trim()) {
      return firstChildText;
    }
  }

  // 7. 使用 resource_id（去掉包名前缀）
  if (element.resource_id && element.resource_id.trim()) {
    const parts = element.resource_id.split("/");
    return parts[parts.length - 1] || element.resource_id;
  }

  // 8. 最后回退到元素ID
  return element.id || "未命名步骤";
}

/**
 * 从 XML 文档中提取元素增强数据
 * @param xmlDoc 解析后的 XML 文档
 * @param boundsString 元素的 bounds 字符串
 * @param initialChildTexts 初始子元素文本（从 child_elements 提取）
 * @param initialChildDescs 初始子元素描述（从 child_elements 提取）
 */
export function extractEnrichmentFromXmlDoc(
  xmlDoc: Document,
  boundsString: string,
  initialChildTexts: string[] = [],
  initialChildDescs: string[] = []
): ElementEnrichmentData | null {
  const result: ElementEnrichmentData = {
    parentContentDesc: "",
    childText: null,
    allChildTexts: [...initialChildTexts],
    allChildContentDescs: [...initialChildDescs],
    siblingTexts: [],
    parentElement: undefined,
  };

  try {
    // 使用 bounds 定位目标元素
    const xpath = `//*[@bounds='${boundsString}']`;
    const iterator = xmlDoc.evaluate(
      xpath,
      xmlDoc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const targetNode = iterator.singleNodeValue as Element;

    if (!targetNode) {
      console.warn(`[extractEnrichmentFromXmlDoc] 未找到 bounds=${boundsString} 的元素`);
      return null;
    }

    // 1. 提取父元素信息 (Bubble Up)
    let current = targetNode.parentNode as Element;
    let upCount = 0;
    while (current && current.nodeType === 1 && upCount < 3) {
      const desc = current.getAttribute("content-desc");
      const text = current.getAttribute("text");
      const resId = current.getAttribute("resource-id");

      if (desc && desc.trim() && !result.parentContentDesc) {
        result.parentContentDesc = desc;
      }
      if (!result.parentElement) {
        result.parentElement = {
          content_desc: desc || "",
          text: text || "",
          resource_id: resId || "",
        };
      }
      if (result.parentContentDesc) break;
      current = current.parentNode as Element;
      upCount++;
    }

    // 2. 提取子元素信息 (Drill Down) - 仅当初始列表为空时
    if (result.allChildTexts.length === 0 && result.allChildContentDescs?.length === 0) {
      const descendants = targetNode.querySelectorAll("*");
      descendants.forEach((node) => {
        const text = node.getAttribute("text");
        const desc = node.getAttribute("content-desc");
        if (text && text.trim().length > 0 && text.trim().length < 50) {
          result.allChildTexts.push(text);
        }
        if (desc && desc.trim().length > 0 && desc.trim().length < 100) {
          result.allChildContentDescs?.push(desc);
        }
      });
    }

    // 3. 提取同层兄弟元素信息 (Sibling)
    const parent = targetNode.parentNode as Element;
    if (parent) {
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === targetNode) continue;
        const text = sibling.getAttribute("text");
        if (
          text &&
          text.trim().length > 0 &&
          text.trim().length < 50 &&
          !/^[\d\s]+$/.test(text)
        ) {
          result.siblingTexts?.push(text);
        }
      }
    }

    result.childText = result.allChildTexts[0] || null;

    return result;
  } catch (error) {
    console.warn("[extractEnrichmentFromXmlDoc] XML 解析失败:", error);
    return null;
  }
}

/**
 * 检测是否为菜单元素
 * 原始版本包含多种检测条件
 */
export function isMenuElementCheck(element: {
  text?: string | null;
  id?: string | null;
  content_desc?: string | null;
}): boolean {
  return (
    element.text === "菜单" ||
    (element.id || "").includes("menu") ||
    element.content_desc === "菜单" ||
    element.id === "element_71"
  );
}

/**
 * 计算 bounds 字符串
 * 包含菜单元素错误 bounds 的检测和修复逻辑
 */
export function computeBoundsString(
  bounds: unknown,
  isMenuElement: boolean = false
): string {
  if (!bounds) return "";

  // 字符串格式处理
  if (typeof bounds === "string") {
    if (isMenuElement && bounds === "[0,1246][1080,2240]") {
      console.error("[computeBoundsString] 菜单元素bounds字符串修复");
      return "[39,143][102,206]";
    }
    return bounds;
  }

  // 对象格式处理
  if (typeof bounds === "object") {
    const b = bounds as Record<string, number>;
    
    // 支持两种格式：{left,top,right,bottom} 和 {x,y,width,height}
    const left = b.left ?? b.x ?? 0;
    const top = b.top ?? b.y ?? 0;
    const right = b.right ?? (b.x !== undefined && b.width !== undefined ? b.x + b.width : 0);
    const bottom = b.bottom ?? (b.y !== undefined && b.height !== undefined ? b.y + b.height : 0);

    // 菜单元素错误 bounds 检测 - 多种模式
    if (isMenuElement) {
      const area = (right - left) * (bottom - top);
      const isWrongBounds =
        // 错误模式1：覆盖屏幕下半部分
        (left === 0 && top === 1246 && right === 1080 && bottom === 2240) ||
        // 错误模式2：任何覆盖大面积的bounds（超过100000像素）
        area > 100000;

      if (isWrongBounds) {
        console.error("[computeBoundsString] 检测到错误的菜单bounds，强制修复");
        return "[39,143][102,206]";
      }
    }

    return `[${left},${top}][${right},${bottom}]`;
  }

  // 其他格式，JSON 序列化
  return JSON.stringify(bounds);
}

/**
 * 生成智能步骤名称
 * 基于元素内容生成更有意义的名称（如"点击"xxx""）
 */
export function generateSmartStepName(
  element: {
    text?: string | null;
    content_desc?: string | null;
    resource_id?: string | null;
    id?: string | null;
    element_type?: string | null;
  },
  context: {
    elementText?: string;
    keyAttributes?: Record<string, string>;
    _enrichment?: {
      allChildTexts?: string[];
      siblingTexts?: string[];
      parentElement?: { content_desc?: string };
    };
  },
  stepNumber: number
): string {
  // 🔥 优先使用 context 中已提取的增强文本
  const enrichedText = context.elementText || "";
  const enrichedContentDesc = context.keyAttributes?.["content-desc"] || "";
  const elementId = element.resource_id || element.id || "";

  // 1. 优先使用已增强的文本
  if (enrichedText && enrichedText.trim()) {
    return `点击"${enrichedText.slice(0, 10)}${enrichedText.length > 10 ? "..." : ""}"`;
  }

  // 2. 使用已增强的 content-desc
  if (enrichedContentDesc && enrichedContentDesc.trim()) {
    const cleanDesc = enrichedContentDesc.replace(/[，。、：；！？]+$/, "");
    return `点击"${cleanDesc.slice(0, 10)}${cleanDesc.length > 10 ? "..." : ""}"`;
  }

  // 3. 如果有资源ID，尝试语义化
  if (elementId.includes("button")) {
    return `点击按钮 ${stepNumber}`;
  } else if (elementId.includes("menu")) {
    return `打开菜单 ${stepNumber}`;
  } else if (elementId.includes("tab")) {
    return `切换标签 ${stepNumber}`;
  } else if (elementId.includes("search")) {
    return `搜索操作 ${stepNumber}`;
  }

  // 4. 基于元素类型（最后回退）
  const actionMap: Record<string, string> = {
    tap: "点击",
    click: "点击",
    button: "点击按钮",
    input: "输入",
    swipe: "滑动",
    scroll: "滚动",
  };

  const actionName = actionMap[element.element_type || "tap"] || "操作";
  console.warn("[generateSmartStepName] 无法找到元素文本，使用通用名称:", element.id);
  return `智能${actionName} ${stepNumber}`;
}

/**
 * 规范化步骤类型
 * 将后端的增强类型映射回标准Tauri命令类型
 */
export function normalizeStepType(elementType: string): string {
  // 移除区域前缀（header_/footer_/content_）
  const withoutRegion = elementType.replace(/^(header|footer|content)_/, "");

  // 映射到标准类型
  const typeMap: Record<string, string> = {
    tap: "smart_find_element",
    button: "smart_find_element",
    click: "smart_find_element",
    other: "smart_find_element",
    text: "smart_find_element",
    image: "smart_find_element",
    input: "input",
    edit_text: "input",
    swipe: "swipe",
    scroll: "swipe",
    long_press: "long_press",
    double_tap: "double_tap",
  };

  return typeMap[withoutRegion.toLowerCase()] || "smart_find_element";
}
