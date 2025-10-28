// src/components/universal-ui/xml-parser/XmlParser.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 核心XML解析器
 * 整合所有XML解析功能的主要入口
 */

import {
  VisualUIElement,
  XmlParseResult,
  ElementCategorizerOptions,
} from "./types";
import { BoundsParser } from "./BoundsParser";
import { ElementCategorizer } from "./ElementCategorizer";
import { AppPageAnalyzer } from "./AppPageAnalyzer";
import { cleanXmlContent } from "./cleanXml";

export class XmlParser {
  /**
   * 解析XML字符串，提取所有UI元素
   * @param xmlString XML字符串内容
   * @param options 解析选项
   * @returns 解析结果
   */
  static parseXML(
    xmlString: string,
    options: ElementCategorizerOptions = {}
  ): XmlParseResult {
    if (!xmlString) {
      return XmlParser.createEmptyResult();
    }

    try {
      const content = cleanXmlContent(xmlString);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");

      // 检查XML是否解析成功
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        console.error("XML解析错误:", parserError.textContent);
        return XmlParser.createEmptyResult();
      }

      const allNodes = xmlDoc.querySelectorAll("node");
      const extractedElements: VisualUIElement[] = [];
      const elementCategories = ElementCategorizer.createDefaultCategories();

      // 🔧 修复：防止父子元素重复热区
      // 策略：当子元素不可点击时，如果父元素可点击，优先选择父元素
      const processedNodes = new Set<Element>();

      allNodes.forEach((node, index) => {
        // 跳过已处理的节点
        if (processedNodes.has(node)) {
          return;
        }

        // 检查是否为不可点击的子元素，且父元素可点击
        const isClickable = node.getAttribute("clickable") === "true";
        const parentNode = node.parentElement;
        const isParentClickable = parentNode?.getAttribute("clickable") === "true";

        // 🎯 关键修复：如果当前元素不可点击，但父元素可点击，跳过子元素
        if (!isClickable && isParentClickable && parentNode?.tagName === "node") {
          console.log(`⏭️ [XmlParser] 跳过不可点击子元素，父元素可点击:`, {
            子元素text: node.getAttribute("text"),
            子元素bounds: node.getAttribute("bounds"),
            父元素contentDesc: parentNode.getAttribute("content-desc"),
            父元素bounds: parentNode.getAttribute("bounds"),
          });
          processedNodes.add(node);
          return;
        }

        const element = XmlParser.parseNodeToElement(node, index, options);
        if (element) {
          extractedElements.push(element);
          processedNodes.add(node);

          // 将元素添加到相应类别
          const category = elementCategories[element.category];
          if (category) {
            category.elements.push(element);
          }
        }
      });

      // 分析应用和页面信息
  const appInfo = AppPageAnalyzer.getSimpleAppAndPageInfo(content);

      // 过滤掉空的类别
      const filteredCategories = Object.values(elementCategories).filter(
        (cat) => cat.elements.length > 0
      );

      return {
        elements: extractedElements,
        categories: filteredCategories,
        appInfo,
      };
    } catch (error) {
      console.error("XML解析失败:", error);
      return XmlParser.createEmptyResult();
    }
  }

  /**
   * 解析单个XML节点为VisualUIElement
   * @param node XML节点
   * @param index 节点索引
   * @param options 解析选项
   * @returns VisualUIElement或null
   */
  private static parseNodeToElement(
    node: Element,
    index: number,
    options: ElementCategorizerOptions
  ): VisualUIElement | null {
    // 获取基本属性
    const bounds = node.getAttribute("bounds") || "";
    const text = node.getAttribute("text") || "";
    const contentDesc = node.getAttribute("content-desc") || "";
    const className = node.getAttribute("class") || "";
    const clickable = node.getAttribute("clickable") === "true";
    const resourceId = node.getAttribute("resource-id") || "";

    // 解析边界信息
    const position = BoundsParser.parseBounds(bounds);

    // 🔍 菜单元素调试：检查是否为菜单元素
    if (text === '菜单' || contentDesc === '菜单' || bounds === '[39,143][102,206]') {
      console.log('🎯 [XmlParser] 菜单元素解析过程:', {
        原始XML属性: { bounds, text, contentDesc, className, clickable, resourceId },
        解析后position: position,
        elementId: `element-${index}`
      });
    }

    // 基本有效性检查
    if (
      !this.isValidElement(
        bounds,
        text,
        contentDesc,
        clickable,
        position,
        options
      )
    ) {
      // 🔍 菜单元素调试：如果菜单元素被过滤
      if (text === '菜单' || contentDesc === '菜单' || bounds === '[39,143][102,206]') {
        console.warn('❌ [XmlParser] 菜单元素未通过有效性检查!', {
          bounds, text, contentDesc, clickable, position, options
        });
      }
      return null;
    }

    // 分析元素属性
    const category = ElementCategorizer.categorizeElement(node);
    const userFriendlyName = ElementCategorizer.getUserFriendlyName(node);
    const importance = ElementCategorizer.getElementImportance(node);

    return {
      id: `element-${index}`,
      text: text,
      description:
        contentDesc || `${userFriendlyName}${clickable ? "（可点击）" : ""}`,
      type: className.split(".").pop() || "Unknown",
      category,
      position,
      clickable,
      importance,
      userFriendlyName,
      // 🔧 新增：保存resource-id等关键属性
      resourceId: resourceId || undefined,
      contentDesc: contentDesc || undefined,
      className: className || undefined,
      bounds: bounds || undefined,
    };
  }

  /**
   * 检查元素是否有效
   * @param bounds 边界字符串
   * @param text 文本内容
   * @param contentDesc 内容描述
   * @param clickable 是否可点击
   * @param position 位置信息
   * @param options 选项
   * @returns 是否有效
   */
  private static isValidElement(
    bounds: string,
    text: string,
    contentDesc: string,
    clickable: boolean,
    position: { width: number; height: number },
    options: ElementCategorizerOptions
  ): boolean {
    // 边界有效性检查
    if (!bounds || bounds === "[0,0][0,0]") {
      return false;
    }

    // 尺寸有效性检查
    if (position.width <= 0 || position.height <= 0) {
      return false;
    }

    // 内容有效性检查
    const hasContent = Boolean(text.trim() || contentDesc.trim());
    const isInteractive = clickable;

    if (options.strictFiltering) {
      // 严格模式：必须有内容或可交互
      return hasContent || isInteractive;
    }

    // 宽松模式：有内容、可点击、或允许非可点击元素
    if (!hasContent && !isInteractive) {
      return options.includeNonClickable === true;
    }

    return true;
  }

  /**
   * 创建空的解析结果
   * @returns 空的解析结果
   */
  private static createEmptyResult(): XmlParseResult {
    return {
      elements: [],
      categories: [],
      appInfo: {
        appName: "未知应用",
        pageName: "未知页面",
      },
    };
  }

  /**
   * 获取XML文档的基本统计信息
   * @param xmlString XML字符串
   * @returns 统计信息
   */
  static getXmlStatistics(xmlString: string): {
    totalNodes: number;
    clickableNodes: number;
    textNodes: number;
    imageNodes: number;
  } {
    if (!xmlString) {
      return { totalNodes: 0, clickableNodes: 0, textNodes: 0, imageNodes: 0 };
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const allNodes = xmlDoc.querySelectorAll("node");

      let clickableNodes = 0;
      let textNodes = 0;
      let imageNodes = 0;

      allNodes.forEach((node) => {
        if (node.getAttribute("clickable") === "true") {
          clickableNodes++;
        }

        const text = node.getAttribute("text") || "";
        if (text.trim()) {
          textNodes++;
        }

        const className = node.getAttribute("class") || "";
        if (className.includes("ImageView")) {
          imageNodes++;
        }
      });

      return {
        totalNodes: allNodes.length,
        clickableNodes,
        textNodes,
        imageNodes,
      };
    } catch (error) {
      console.error("获取XML统计信息失败:", error);
      return { totalNodes: 0, clickableNodes: 0, textNodes: 0, imageNodes: 0 };
    }
  }
}
