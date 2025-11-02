// src/modules/structural-matching/ui/components/visual-preview/core/structural-matching-xml-hierarchy-parser.ts
// module: structural-matching | layer: ui | role: XML层级解析核心逻辑
// summary: 负责XML DOM解析和严格层级筛选，只保留父-当前-子三层结构

import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";
import { parseXML } from "../../../../../../components/universal-ui/xml-parser";
import {
  debugXmlAttributeExtraction,
  debugVisualUIElements,
  debugAttributeMapping,
  adaptBackendElementToVisualUI,
  type BackendElementData,
} from "../utils";

export interface StructuralMatchingHierarchyResult {
  rootElement: VisualUIElement;
  childElements: VisualUIElement[];
  allElements: VisualUIElement[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface StructuralMatchingXmlParseOptions {
  xmlContent: string;
  rootElement: VisualUIElement;
  enforceStrictHierarchy?: boolean;
}

/**
 * 解析XML并执行严格层级筛选的核心函数
 */
export async function parseXmlWithStrictHierarchy(
  options: StructuralMatchingXmlParseOptions
): Promise<StructuralMatchingHierarchyResult> {
  const { xmlContent, rootElement: originalRootElement, enforceStrictHierarchy = true } = options;
  
  console.log("🔍 [StructuralMatching] 开始XML层级解析");
  console.log("🔍 [StructuralMatching] 传入的根元素数据:", originalRootElement);

  // 🔧 转换后端格式到前端格式
  let adaptedRootElement: VisualUIElement;
  if ('element_type' in originalRootElement || 'class_name' in originalRootElement || 'content_desc' in originalRootElement) {
    console.log("🔄 [StructuralMatching] 检测到后端格式，执行数据适配...");
    adaptedRootElement = adaptBackendElementToVisualUI(originalRootElement as unknown as BackendElementData);
  } else {
    adaptedRootElement = originalRootElement;
  }

  // 🔧 调试：检查XML原始内容和属性提取过程
  debugXmlAttributeExtraction(xmlContent, adaptedRootElement.bounds);

  // 解析XML获取所有元素
  const parseResult = await parseXML(xmlContent);
  let allElements = parseResult.elements;
  console.log("✅ [StructuralMatching] XML解析完成，元素数量:", allElements.length);

  // 🔧 检测并应用数据格式转换 (针对所有元素)
  const hasBackendFormat = allElements.some(element => {
    const elementObj = element as unknown as Record<string, unknown>;
    return 'element_type' in elementObj || 
           'content_desc' in elementObj || 
           'class_name' in elementObj;
  });
  
  if (hasBackendFormat) {
    console.log("🔧 [StructuralMatching] 检测到后端格式数据，开始转换所有元素...");
    allElements = allElements.map(element => 
      adaptBackendElementToVisualUI(element as unknown as BackendElementData)
    );
    console.log("✅ [StructuralMatching] 所有元素格式转换完成");
  }

  // 🔧 调试：检查解析后的元素属性情况
  debugVisualUIElements(allElements, "解析后的所有元素");
  debugAttributeMapping(xmlContent, allElements);

  // 解析根元素bounds
  const bounds = parseRootElementBounds(adaptedRootElement);
  const rootBoundsStr = `[${bounds.x},${bounds.y}][${bounds.x + bounds.width},${bounds.y + bounds.height}]`;

  console.log("📐 [StructuralMatching] 根元素边界:", bounds);

  // 在XML中找到匹配的根元素并补齐属性
  const enrichedRootElement = enrichRootElementFromXml(
    adaptedRootElement,
    allElements,
    rootBoundsStr,
    originalRootElement
  );

  // 执行严格层级筛选或回退到重叠检测
  let childElements: VisualUIElement[];
  
  if (enforceStrictHierarchy) {
    childElements = performStrictHierarchyFiltering(
      xmlContent,
      allElements,
      rootBoundsStr
    );
  } else {
    childElements = performOverlapBasedFiltering(
      allElements,
      bounds,
      adaptedRootElement.id
    );
  }

  console.log("✅ [StructuralMatching] 筛选出相关子元素数量:", childElements.length);
  debugVisualUIElements(childElements, "筛选后的子元素");

  return {
    rootElement: enrichedRootElement,
    childElements,
    allElements,
    bounds,
  };
}

/**
 * 解析根元素的bounds信息
 */
function parseRootElementBounds(rootElement: VisualUIElement) {
  const bounds = rootElement.bounds || rootElement.position;
  if (!bounds) {
    throw new Error("根元素缺少bounds信息");
  }

  let left: number, top: number, right: number, bottom: number;

  if (typeof bounds === "string") {
    // 字符串格式: "[546,225][1067,1083]"
    const matches = bounds.match(/\d+/g)?.map(Number) || [];
    [left, top, right, bottom] = matches;
  } else if (typeof bounds === "object" && bounds !== null) {
    // 检查是否是position格式 {x, y, width, height}
    if ('x' in bounds && 'y' in bounds && 'width' in bounds && 'height' in bounds) {
      const pos = bounds as { x: number; y: number; width: number; height: number };
      left = pos.x;
      top = pos.y;
      right = pos.x + pos.width;
      bottom = pos.y + pos.height;
    } else {
      // bounds格式: {left: 546, top: 225, right: 1067, bottom: 1083}
      const boundsObj = bounds as {
        left: number;
        top: number;
        right: number;
        bottom: number;
      };
      left = boundsObj.left;
      top = boundsObj.top;
      right = boundsObj.right;
      bottom = boundsObj.bottom;
    }
  } else {
    throw new Error("bounds格式不正确");
  }

  if (
    left === undefined ||
    top === undefined ||
    right === undefined ||
    bottom === undefined
  ) {
    throw new Error("无法解析根元素bounds信息");
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * 从XML中找到匹配的根元素并补齐属性
 */
function enrichRootElementFromXml(
  adaptedRootElement: VisualUIElement,
  allElements: VisualUIElement[],
  rootBoundsStr: string,
  originalRootElement: VisualUIElement
): VisualUIElement {
  // 试图在解析出来的 XML 元素中找到与根元素对应的节点
  const candidateElements = allElements.filter(
    (el) => el.bounds === rootBoundsStr
  );
  
  let matchedRootFromXml: VisualUIElement | undefined;
  if (candidateElements.length > 0) {
    // 🎯 [FIX] 优先选择有内容的元素（text 或 contentDesc 不为空）
    matchedRootFromXml = candidateElements.find(
      (el) => (el.text && el.text.trim().length > 0) || 
              (el.contentDesc && el.contentDesc.trim().length > 0)
    ) || candidateElements[0]; // 如果都没内容，选择第一个
    
    console.log("🎯 [StructuralMatching] 边界匹配结果:", {
      rootBoundsStr,
      candidateCount: candidateElements.length,
      selectedElement: {
        id: matchedRootFromXml.id,
        text: matchedRootFromXml.text || "(空)",
        contentDesc: matchedRootFromXml.contentDesc || "(空)",
        hasContent: !!(matchedRootFromXml.text || matchedRootFromXml.contentDesc)
      },
      allCandidates: candidateElements.map(el => ({
        id: el.id,
        text: el.text || "(空)",
        contentDesc: el.contentDesc || "(空)"
      }))
    });
  }

  // 如找到匹配的 XML 元素，则用其原始属性补齐 rootElement
  let enrichedRootElement: VisualUIElement = originalRootElement;
  if (matchedRootFromXml) {
    enrichedRootElement = {
      ...matchedRootFromXml,
      position: originalRootElement.position || matchedRootFromXml.position,
    };
    console.log("✅ [StructuralMatching] 根元素属性已从 XML 补齐:", {
      rootId: enrichedRootElement.id,
      text: enrichedRootElement.text || "(空)",
      contentDesc: enrichedRootElement.contentDesc || "(空)",
      resourceId: enrichedRootElement.resourceId || "(空)",
      className: enrichedRootElement.className || "(空)",
      bounds: enrichedRootElement.bounds || rootBoundsStr,
    });
  } else {
    console.warn(
      "⚠️ [StructuralMatching] 未在 XML 中找到与根元素 bounds 匹配的节点，原始属性可能为空",
      { rootBounds: rootBoundsStr }
    );
  }

  return enrichedRootElement;
}

/**
 * 执行严格的层级筛选：只保留父元素(-1级) + 当前元素(0级) + 直接子元素(+1级)
 */
function performStrictHierarchyFiltering(
  xmlContent: string,
  allElements: VisualUIElement[],
  currentElementBounds: string
): VisualUIElement[] {
  console.log("🎯 [StructuralMatching] 执行严格层级筛选 - 收集当前元素及所有子孙元素");

  // 1. 解析XML DOM结构以获取真正的层级关系
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const allXmlNodes = Array.from(xmlDoc.querySelectorAll('*'));
  
  // 2. 找到所有与当前选中元素bounds相同的XML节点（处理重叠节点）
  const matchingXmlNodes: Element[] = [];
  
  for (const node of allXmlNodes) {
    const bounds = node.getAttribute('bounds');
    if (bounds === currentElementBounds) {
      matchingXmlNodes.push(node);
    }
  }
  
  if (matchingXmlNodes.length === 0) {
    console.warn("⚠️ [StructuralMatching] 未在XML中找到当前元素对应的节点，回退到空数组");
    return [];
  }
  
  console.log(`🔍 [StructuralMatching] 找到 ${matchingXmlNodes.length} 个bounds相同的XML节点`);
  
  // 3. 递归收集所有子孙元素的bounds
  const relevantBounds = new Set<string>();
  
  // 3a. 添加当前元素
  relevantBounds.add(currentElementBounds);
  
  // 3b. 递归函数：收集所有子孙元素
  const collectDescendantBounds = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      const childBounds = child.getAttribute('bounds');
      if (childBounds) {
        relevantBounds.add(childBounds);
        // 递归收集子孙元素
        collectDescendantBounds(child);
      }
    }
  };
  
  // 3c. 对所有匹配节点收集子孙元素
  for (const node of matchingXmlNodes) {
    collectDescendantBounds(node);
  }
  
  console.log(`✅ [StructuralMatching] 收集到的元素总数（含当前）: ${relevantBounds.size}`);
  
  // 4. 基于bounds筛选出相关的VisualUIElement
  const relevantElements = allElements.filter((element: VisualUIElement) => {
    return relevantBounds.has(element.bounds || "");
  });
  
  console.log("🎯 [StructuralMatching] 严格层级筛选结果:", {
    总元素数: allElements.length,
    收集的bounds数: relevantBounds.size,
    筛选后元素数: relevantElements.length,
    层级结构: '当前元素(0级) + 所有子孙元素(+1级, +2级, ...)'
  });

  // 🎯 返回当前元素 + 所有子孙元素
  return relevantElements;
}

/**
 * 基于重叠检测的筛选（回退方案）
 */
function performOverlapBasedFiltering(
  allElements: VisualUIElement[],
  rootBounds: { x: number; y: number; width: number; height: number },
  rootElementId: string
): VisualUIElement[] {
  console.log("⚠️ [StructuralMatching] 使用重叠检测筛选（回退方案）");

  return allElements.filter((element: VisualUIElement) => {
    if (!element.position) return false;

    const elementBounds = element.position;

    // 检查元素是否与根元素有重叠
    const hasOverlap = !(
      elementBounds.x + elementBounds.width <= rootBounds.x ||
      elementBounds.x >= rootBounds.x + rootBounds.width ||
      elementBounds.y + elementBounds.height <= rootBounds.y ||
      elementBounds.y >= rootBounds.y + rootBounds.height
    );

    // 排除根元素本身
    const isNotRoot = element.id !== rootElementId;

    return hasOverlap && isNotRoot;
  });
}

/**
 * 重新计算修正后的层级关系
 */
export function recalculateHierarchyAfterCorrection(
  xmlContent: string,
  allElements: VisualUIElement[],
  correctedBounds: { x: number; y: number; width: number; height: number },
  correctedElementId: string
): VisualUIElement[] {
  const correctedBoundsStr = `[${correctedBounds.x},${correctedBounds.y}][${correctedBounds.x + correctedBounds.width},${correctedBounds.y + correctedBounds.height}]`;
  
  console.log("🔧 [StructuralMatching] 重新计算修正后的层级关系");
  
  try {
    return performStrictHierarchyFiltering(
      xmlContent,
      allElements,
      correctedBoundsStr
    );
  } catch (error) {
    console.warn("⚠️ [StructuralMatching] 修正后层级计算失败，使用重叠检测:", error);
    return performOverlapBasedFiltering(allElements, correctedBounds, correctedElementId);
  }
}