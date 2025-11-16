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
import { buildIndexPath } from "./IndexPathBuilder";

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

      // � Element_43修复：智能过滤重叠容器，保留有价值的元素
      allNodes.forEach((node, index) => {
        const element = XmlParser.parseNodeToElement(node, index, options);
        if (element) {
          extractedElements.push(element);

          // 将元素添加到相应类别
          const category = elementCategories[element.category];
          if (category) {
            category.elements.push(element);
          }
        }
      });

      // 🎯 新增：过滤重叠的冗余容器
      const filteredElements =
        XmlParser.filterOverlappingContainers(extractedElements);

      // 🔍 调试：检查是否解析出"通讯录"元素
      const contactsElements = extractedElements.filter(
        (el) =>
          el.text?.includes("通讯录") ||
          el.contentDesc?.includes("通讯录") ||
          el.description?.includes("通讯录")
      );
      if (contactsElements.length > 0) {
        console.log('✅ [XmlParser] 找到"通讯录"元素:');
        console.table(
          contactsElements.map((el) => ({
            id: el.id,
            text: el.text || "(无)",
            contentDesc: el.contentDesc || "(无)",
            bounds: `[${el.position.x},${el.position.y}][${
              el.position.x + el.position.width
            },${el.position.y + el.position.height}]`,
            clickable: el.clickable ? "✓" : "✗",
          }))
        );
      } else {
        console.warn(
          '⚠️ [XmlParser] 未找到"通讯录"元素，总共解析了',
          extractedElements.length,
          "个元素"
        );
        // 输出所有可点击元素的文本
        const clickableElements = extractedElements.filter(
          (el) => el.clickable
        );
        console.log("📋 [XmlParser] 所有可点击元素（前20个）:");
        console.table(
          clickableElements.slice(0, 20).map((el) => ({
            id: el.id,
            text: el.text || "(无)",
            contentDesc: el.contentDesc || "(无)",
            bounds: `[${el.position.x},${el.position.y}][${
              el.position.x + el.position.width
            },${el.position.y + el.position.height}]`,
            clickable: "✓",
          }))
        );
      } // 分析应用和页面信息
      const appInfo = AppPageAnalyzer.getSimpleAppAndPageInfo(content);

      // 过滤掉空的类别（此变量已移到下方使用过滤后的元素）

      // 🔧 Element_43修复：使用过滤后的元素更新分类
      const updatedCategories = ElementCategorizer.createDefaultCategories();
      filteredElements.forEach((element) => {
        const category = updatedCategories[element.category];
        if (category) {
          category.elements.push(element);
        }
      });

      // 过滤掉空的类别
      const finalFilteredCategories = Object.values(updatedCategories).filter(
        (cat) => cat.elements.length > 0
      );

      console.log(
        `🎯 [XmlParser] Element_43修复完成: ${extractedElements.length} -> ${filteredElements.length} 元素`
      );

      return {
        elements: filteredElements,
        categories: finalFilteredCategories,
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
    if (
      text === "菜单" ||
      contentDesc === "菜单" ||
      bounds === "[39,143][102,206]"
    ) {
      console.log("🎯 [XmlParser] 菜单元素解析过程:", {
        原始XML属性: {
          bounds,
          text,
          contentDesc,
          className,
          clickable,
          resourceId,
        },
        解析后position: position,
        elementId: `element-${index}`,
      });
    }

    // 基本有效性检查
    if (!this.isValidElement(bounds, text, contentDesc, clickable, position)) {
      // 🔍 菜单元素调试：如果菜单元素被过滤
      if (
        text === "菜单" ||
        contentDesc === "菜单" ||
        bounds === "[39,143][102,206]"
      ) {
        console.warn("❌ [XmlParser] 菜单元素未通过有效性检查!", {
          bounds,
          text,
          contentDesc,
          clickable,
          position,
          options,
        });
      }
      return null;
    }

    // 分析元素属性
    const category = ElementCategorizer.categorizeElement(node);
    const userFriendlyName = ElementCategorizer.getUserFriendlyName(node);
    const importance = ElementCategorizer.getElementImportance(node);

    // 🔧 修复：使用原始 XML index 作为 ID，确保前后端一致
    // 注意：不使用过滤后的 index，而是使用 XML 中的原始顺序
    // 这样 element-41 在前端和后端都指向同一个 XML 节点
    const elementId = `element-${index}`;

    // 🎯 新增：构建绝对下标链（用于静态定位）
    const indexPath = buildIndexPath(node);

    return {
      id: elementId,
      text: text,
      description:
        contentDesc || `${userFriendlyName}${clickable ? "（可点击）" : ""}`,
      type: className.split(".").pop() || "Unknown",
      category,
      position,
      clickable,
      importance,
      userFriendlyName,
      // 🔧 新增：保存原始 XML index 和 bounds 用于精确匹配
      xmlIndex: index, // 原始 XML 索引
      indexPath: indexPath, // 🎯 绝对下标链（用于静态定位）
      resourceId: resourceId || undefined,
      contentDesc: contentDesc || undefined,
      className: className || undefined,
      bounds: bounds || undefined,
    };
  }

  /**
   * 🎯 Element_43修复：过滤重叠的冗余容器（改进版）
   * 
   * 🔥 新策略：同时保留有语义信息的外层 + 可点击的内层
   * 
   * 瀑布流卡片典型结构：
   * - 外层 FrameLayout(clickable=false, content-desc="笔记...")  ← 语义层，保留
   * - 内层 FrameLayout(clickable=true, 无content-desc)         ← 交互层，也保留
   * 
   * 旧逻辑问题：只保留外层，导致内层不可见
   * 新逻辑：两层都保留，让用户和可视化系统都能看到
   */
  private static filterOverlappingContainers(
    elements: VisualUIElement[]
  ): VisualUIElement[] {
    const filtered: VisualUIElement[] = [];
    const processedBounds = new Set<string>();

    elements.forEach((element) => {
      if (!element.bounds) {
        filtered.push(element);
        return;
      }

      // 检查是否有相同bounds的其他元素
      const sameBoundsElements = elements.filter(
        (other) => other.bounds === element.bounds && other.id !== element.id
      );

      if (sameBoundsElements.length === 0) {
        // 没有重叠，直接保留
        filtered.push(element);
      } else {
        // 有重叠，应用新的智能保留策略
        if (processedBounds.has(element.bounds)) {
          // 这个bounds已经处理过了，跳过
          return;
        }

        // 🔥 新策略：保留所有有价值的元素（语义层 + 交互层）
        const allSameBounds = [element, ...sameBoundsElements];
        const valuableElements = XmlParser.selectValuableElementsFromOverlapping(allSameBounds);

        // 保留所有有价值的元素
        filtered.push(...valuableElements);
        processedBounds.add(element.bounds);

        console.log(
          `🔧 [XmlParser] 处理重叠bounds ${element.bounds}: 从${allSameBounds.length}个元素中保留了${valuableElements.length}个有价值元素`,
          valuableElements.map(e => `${e.id}(clickable:${e.clickable}, hasContent:${!!(e.text || e.contentDesc)})`)
        );
      }
    });

    console.log(
      `✅ [XmlParser] 重叠过滤完成: ${elements.length} -> ${filtered.length} 元素`
    );
    return filtered;
  }

  /**
   * 🔥 新策略：从重叠元素中选择所有有价值的元素
   * 
   * 瀑布流卡片场景：
   * - 外层 FrameLayout(clickable=false, content-desc="笔记...")  ← 语义层，保留
   * - 内层 FrameLayout(clickable=true, 无content-desc)         ← 交互层，也保留
   * 
   * 价值判定：
   * 1. 有语义信息（text或content-desc）→ 保留
   * 2. 可点击（clickable=true）→ 保留
   * 3. 两者都有 → 都保留
   * 4. 两者都无 → 只保留最内层（xmlIndex最大）
   */
  private static selectValuableElementsFromOverlapping(
    elements: VisualUIElement[]
  ): VisualUIElement[] {
    const valuable: VisualUIElement[] = [];

    // 1️⃣ 保留所有有语义信息的元素
    const semanticElements = elements.filter((e) => e.text || e.contentDesc);
    valuable.push(...semanticElements);

    // 2️⃣ 保留所有可点击的元素（如果还没被包含）
    const clickableElements = elements.filter(
      (e) => e.clickable && !valuable.includes(e)
    );
    valuable.push(...clickableElements);

    // 3️⃣ 如果都没有价值，至少保留最内层的一个
    if (valuable.length === 0) {
      const innermost = elements.reduce((best, current) =>
        (current.xmlIndex || 0) > (best.xmlIndex || 0) ? current : best
      );
      valuable.push(innermost);
    }

    return valuable;
  }

  /**
   * 🎯 从重叠元素中选择最佳元素（旧逻辑，保留以防需要）
   * 优先级：有文本内容/content-desc（语义优先） > 可点击 > XML顺序靠后（更内层）
   * 
   * 🔧 BUG修复: 瀑布流卡片结构为 node[31](有content-desc, 不可点) → node[32](可点, 无content-desc)
   *            之前错误地选择了可点击的node[32]，导致后端收到element_32后无法找到语义信息
   */
  private static selectBestElementFromOverlapping(
    elements: VisualUIElement[]
  ): VisualUIElement {
    // 1️⃣ 最高优先级：有内容的元素（text 或 content-desc）
    const elementsWithContent = elements.filter((e) => e.text || e.contentDesc);
    if (elementsWithContent.length > 0) {
      // 如果有多个，优先选择有content-desc的（语义更丰富）
      const withContentDesc = elementsWithContent.filter((e) => e.contentDesc);
      if (withContentDesc.length > 0) {
        // 多个有content-desc时，选择content-desc最长的（信息最多）
        return withContentDesc.reduce((best, current) =>
          (current.contentDesc?.length || 0) > (best.contentDesc?.length || 0)
            ? current
            : best
        );
      }
      // 只有text没有content-desc，选择text最长的
      return elementsWithContent.reduce((best, current) =>
        (current.text?.length || 0) > (best.text?.length || 0) ? current : best
      );
    }

    // 2️⃣ 次优先级：可点击的元素（但优先级低于有内容的元素）
    const clickableElements = elements.filter((e) => e.clickable);
    if (clickableElements.length === 1) {
      return clickableElements[0];
    }
    if (clickableElements.length > 1) {
      // 多个可点击，选择XML顺序靠后的（更内层）
      return clickableElements.reduce((best, current) =>
        (current.xmlIndex || 0) > (best.xmlIndex || 0) ? current : best
      );
    }

    // 3️⃣ 兜底：都没有内容也不可点击，选择XML顺序靠后的（更内层）
    return elements.reduce((best, current) =>
      (current.xmlIndex || 0) > (best.xmlIndex || 0) ? current : best
    );
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
    position: { width: number; height: number }
  ): boolean {
    // 🔥 基础有效性检查

    // 边界有效性检查
    if (!bounds || bounds === "[0,0][0,0]") {
      return false;
    }

    // 尺寸有效性检查
    if (position.width <= 0 || position.height <= 0) {
      return false;
    }

    // ✅ 通过基础检查的元素都保留，重叠过滤在后续处理
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
