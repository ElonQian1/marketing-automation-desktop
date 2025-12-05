// src/components/universal-ui/xml-parser/XmlParser.ts
// module: ui | layer: ui | role: xml-parser-facade
// summary: XML 解析器门面 - 内部委托给 Rust 后端解析，保持前端接口不变

/**
 * 核心XML解析器
 * 🔧 重构：内部调用 Rust 后端解析器，保持对外接口不变
 * 
 * 架构说明：
 * - 对外暴露同步接口 parseXML()（兼容现有调用方）
 * - 内部缓存后端解析结果
 * - 首次调用时使用简化的前端解析作为同步返回值
 * - 后台异步调用后端获取精确结果
 */

import { invoke } from "@tauri-apps/api/core";
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

// 后端返回的 UIElement 类型（与 Rust 结构匹配）
interface BackendUIElement {
  id: string;
  element_type: string;
  text: string;
  bounds: { left: number; top: number; right: number; bottom: number };
  xpath: string;
  resource_id: string | null;
  package_name: string | null;
  class_name: string | null;
  clickable: boolean;
  scrollable: boolean;
  enabled: boolean;
  focused: boolean;
  checkable: boolean;
  checked: boolean;
  selected: boolean;
  password: boolean;
  content_desc: string;
  indexPath: number[] | null;
  region: string | null;
}

// 解析缓存：避免重复调用后端
const parseCache = new Map<string, XmlParseResult>();

export class XmlParser {
  /**
   * 解析XML字符串，提取所有UI元素
   * 🔧 重构：优先调用 Rust 后端解析器，确保结果一致性
   * 
   * @param xmlString XML字符串内容
   * @param options 解析选项（保留兼容性）
   * @returns Promise<解析结果>
   */
  static async parseXML(
    xmlString: string,
    options: ElementCategorizerOptions = {}
  ): Promise<XmlParseResult> {
    if (!xmlString) {
      return XmlParser.createEmptyResult();
    }

    // 生成缓存键
    const cacheKey = XmlParser.generateCacheKey(xmlString);
    
    // 检查缓存
    const cached = parseCache.get(cacheKey);
    if (cached) {
      console.log(`✅ [XmlParser] 命中缓存，直接返回 ${cached.elements.length} 个元素`);
      return cached;
    }

    // 🔧 优先使用后端解析（确保一致性）
    try {
      const result = await XmlParser.parseXMLFromBackend(xmlString);
      parseCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('⚠️ [XmlParser] 后端解析失败，降级到前端解析:', err);
      // 降级到前端解析
      const fallbackResult = XmlParser.parseXMLSync(xmlString, options);
      parseCache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * 🔧 同步解析（前端备用实现）
   * 仅在后端不可用时使用
   */
  private static parseXMLSync(
    xmlString: string,
    options: ElementCategorizerOptions = {}
  ): XmlParseResult {
    try {
      const content = cleanXmlContent(xmlString);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");

      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        console.error("XML解析错误:", parserError.textContent);
        return XmlParser.createEmptyResult();
      }

      const allNodes = xmlDoc.querySelectorAll("node");
      const extractedElements: VisualUIElement[] = [];

      allNodes.forEach((node, index) => {
        const element = XmlParser.parseNodeToElement(node, index, options);
        if (element) {
          extractedElements.push(element);
        }
      });

      // 过滤重叠容器
      const filteredElements = XmlParser.filterOverlappingContainers(extractedElements);

      // 分类
      const updatedCategories = ElementCategorizer.createDefaultCategories();
      filteredElements.forEach((element) => {
        const category = updatedCategories[element.category];
        if (category) {
          category.elements.push(element);
        }
      });

      const finalFilteredCategories = Object.values(updatedCategories).filter(
        (cat) => cat.elements.length > 0
      );

      const appInfo = AppPageAnalyzer.getSimpleAppAndPageInfo(content);

      const result: XmlParseResult = {
        elements: filteredElements,
        categories: finalFilteredCategories,
        appInfo,
      };

      // 缓存结果
      const cacheKey = XmlParser.generateCacheKey(xmlString);
      parseCache.set(cacheKey, result);

      console.log(`✅ [XmlParser] 前端同步解析完成: ${filteredElements.length} 个元素`);
      return result;
    } catch (error) {
      console.error("XML解析失败:", error);
      return XmlParser.createEmptyResult();
    }
  }

  /**
   * 🔧 调用后端解析器
   */
  private static async parseXMLFromBackend(
    xmlString: string
  ): Promise<XmlParseResult> {
    console.log('🔄 [XmlParser] 调用后端解析器...');
    
    const backendElements = await invoke<BackendUIElement[]>(
      'plugin:xml_cache|parse_cached_xml_to_elements',
      { xmlContent: xmlString, enableFiltering: false }
    );

    console.log(`✅ [XmlParser] 后端返回 ${backendElements.length} 个元素`);

    // 转换后端格式为前端格式
    const convertedElements = backendElements.map((be, index) => 
      XmlParser.convertBackendElement(be, index)
    );

    // 分类
    const updatedCategories = ElementCategorizer.createDefaultCategories();
    convertedElements.forEach((element) => {
      const category = updatedCategories[element.category];
      if (category) {
        category.elements.push(element);
      }
    });

    const finalFilteredCategories = Object.values(updatedCategories).filter(
      (cat) => cat.elements.length > 0
    );

    const appInfo = AppPageAnalyzer.getSimpleAppAndPageInfo(xmlString);

    const result: XmlParseResult = {
      elements: convertedElements,
      categories: finalFilteredCategories,
      appInfo,
    };

    return result;
  }

  /**
   * 🔧 将后端 UIElement 转换为前端 VisualUIElement
   */
  private static convertBackendElement(
    be: BackendUIElement,
    index: number
  ): VisualUIElement {
    const position = {
      x: be.bounds.left,
      y: be.bounds.top,
      width: be.bounds.right - be.bounds.left,
      height: be.bounds.bottom - be.bounds.top,
    };

    // 生成用户友好名称
    const userFriendlyName = be.content_desc || be.text || 
      (be.class_name?.split('.').pop() || 'Unknown');

    // 生成描述
    const description = be.content_desc || 
      `${userFriendlyName}${be.clickable ? "（可点击）" : ""}`;

    // 元素分类（简化版）
    const category = XmlParser.categorizeBackendElement(be);

    // 重要性判定
    const importance = XmlParser.getBackendElementImportance(be);

    return {
      id: be.id,
      text: be.text,
      description,
      type: be.class_name?.split('.').pop() || 'Unknown',
      category,
      position,
      clickable: be.clickable,
      importance,
      userFriendlyName,
      resourceId: be.resource_id || undefined,
      contentDesc: be.content_desc || undefined,
      className: be.class_name || undefined,
      bounds: `[${be.bounds.left},${be.bounds.top}][${be.bounds.right},${be.bounds.bottom}]`,
      xmlIndex: index,
      indexPath: be.indexPath || undefined,
    };
  }

  /**
   * 🔧 后端元素分类
   */
  private static categorizeBackendElement(be: BackendUIElement): string {
    const className = be.class_name || '';
    const text = be.text || '';
    const contentDesc = be.content_desc || '';

    if (className.includes('Button') || className.includes('ImageButton')) {
      return 'button';
    }
    if (className.includes('EditText')) {
      return 'input';
    }
    if (className.includes('TextView') && (text || contentDesc)) {
      return 'text';
    }
    if (className.includes('ImageView')) {
      return 'image';
    }
    if (className.includes('RecyclerView') || className.includes('ListView')) {
      return 'list';
    }
    if (be.clickable) {
      return 'clickable';
    }
    return 'other';
  }

  /**
   * 🔧 后端元素重要性判定
   */
  private static getBackendElementImportance(
    be: BackendUIElement
  ): 'high' | 'medium' | 'low' {
    if (be.clickable && (be.text || be.content_desc)) {
      return 'high';
    }
    if (be.clickable || be.text || be.content_desc) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 生成缓存键
   */
  private static generateCacheKey(xmlString: string): string {
    // 使用长度 + 首尾字符的简单哈希
    // 🔧 添加版本号以强制刷新缓存 (v3: 修复DrawerLayout子容器被过滤的问题)
    const version = "v3";
    const prefix = xmlString.substring(0, 100);
    const suffix = xmlString.substring(Math.max(0, xmlString.length - 100));
    return `${version}-${xmlString.length}-${prefix.length}-${suffix.length}`;
  }

  /**
   * 清除解析缓存
   */
  static clearCache(): void {
    parseCache.clear();
    console.log('🗑️ [XmlParser] 缓存已清除');
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

    // 1.5️⃣ 保留特殊的布局容器 (DrawerLayout, SlidingPaneLayout)
    // 这些容器虽然不可点击且无文本，但对层级分析至关重要
    const layoutContainers = elements.filter(
      (e) =>
        e.className &&
        (e.className.includes("DrawerLayout") ||
          e.className.includes("SlidingPaneLayout")) &&
        !valuable.includes(e)
    );
    valuable.push(...layoutContainers);

    // 1.6️⃣ 保留 DrawerLayout 的直接子容器 (用于区分主内容和抽屉内容)
    // 即使它们是空的 FrameLayout，也必须保留，否则无法识别抽屉结构
    const drawerChildren = elements.filter(e => {
      if (valuable.includes(e)) return false;
      
      // 检查是否是 DrawerLayout 的直接子元素
      // 逻辑：如果存在一个已保留的 DrawerLayout，且当前元素的 indexPath 是其直接子路径
      return layoutContainers.some(drawer => {
        if (!drawer.indexPath || !e.indexPath) return false;
        // 长度必须恰好 +1
        if (e.indexPath.length !== drawer.indexPath.length + 1) return false;
        // 前缀必须匹配
        for (let i = 0; i < drawer.indexPath.length; i++) {
          if (e.indexPath[i] !== drawer.indexPath[i]) return false;
        }
        return true;
      });
    });
    if (drawerChildren.length > 0) {
      console.log(`🔧 [XmlParser] 保留 DrawerLayout 子容器: ${drawerChildren.length} 个`);
      valuable.push(...drawerChildren);
    }

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
