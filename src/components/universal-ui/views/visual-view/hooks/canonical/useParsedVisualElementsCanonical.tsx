// src/components/universal-ui/views/visual-view/hooks/canonical/useParsedVisualElementsCanonical.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// Canonical parser hook for visual-view kept in a dedicated file to avoid accidental duplication
import { useState, useEffect, useCallback, useRef } from "react";
import type { VisualUIElement, VisualElementCategory } from "../../../../types";
import { parseBounds } from "../../utils/elementTransform";
import { categorizeElement, getUserFriendlyName } from "../../utils/categorization";

// 🆕 生成 XML 的唯一标识符（用于检测变化）
function generateXmlIdentifier(xml: string): string {
  if (!xml) return '';
  // 使用长度 + 前 100 字符 + 后 100 字符的哈希
  const prefix = xml.substring(0, 100);
  const suffix = xml.substring(Math.max(0, xml.length - 100));
  return `${xml.length}-${prefix}-${suffix}`;
}

export interface UseParsedVisualElementsResult {
  parsedElements: VisualUIElement[];
  categories: VisualElementCategory[];
  parseXML: (xml: string) => void;
}

export function useParsedVisualElements(
  xmlContent: string | undefined,
  _fallbackElements: VisualUIElement[],
  forceRefreshKey?: number | string  // 🆕 强制刷新的 key，用于绕过 XML 标识符缓存
): UseParsedVisualElementsResult {
  const [parsedElements, setParsedElements] = useState<VisualUIElement[]>([]);
  const [categories, setCategories] = useState<VisualElementCategory[]>([]);
  
  // 🐛 修复：使用 ref 跟踪上一次解析的 XML 标识符
  const lastXmlIdRef = useRef<string>('');
  const parseCountRef = useRef<number>(0);

  const parseXML = useCallback((xmlString: string) => {
    if (!xmlString) {
      // 🐛 修复：清空旧数据
      console.log('⚠️ [useParsedVisualElements] xmlString 为空，清空数据');
      setParsedElements([]);
      setCategories([]);
      return;
    }
    
    parseCountRef.current += 1;
    const parseId = parseCountRef.current;
    console.log(`🔄 [useParsedVisualElements #${parseId}] 开始解析 XML，长度: ${xmlString.length}`);
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const nodes = xmlDoc.querySelectorAll("node");

      const extracted: VisualUIElement[] = [];
      const catMap: Record<string, VisualElementCategory & { elements: VisualUIElement[] }>
        = Object.create(null);

      const ensureCat = (
        key: string,
        base: Omit<VisualElementCategory, "elements">
      ) => {
        if (!catMap[key]) catMap[key] = { ...base, elements: [] } as any;
        return catMap[key];
      };

      nodes.forEach((node, index) => {
        const bounds = node.getAttribute("bounds") || "";
        const text = node.getAttribute("text") || "";
        const contentDesc = node.getAttribute("content-desc") || "";
        const className = node.getAttribute("class") || "";
        const clickable = node.getAttribute("clickable") === "true";

        if (!bounds || bounds === "[0,0][0,0]") return;
        if (!text && !contentDesc && !clickable) return;

        const position = parseBounds(bounds);
        if (position.width <= 0 || position.height <= 0) return;

        const categoryKey = (categorizeElement({
          "content-desc": contentDesc,
          text,
          class: className,
          clickable: clickable ? "true" : "false",
        } as any) as unknown) as string;

        const userFriendlyName = getUserFriendlyName({
          "content-desc": contentDesc,
          text,
          class: className,
          clickable: clickable ? "true" : "false",
        } as any);

        const element: VisualUIElement = {
          id: `element_${index}`,
          text,
          description:
            contentDesc || `${userFriendlyName}${clickable ? "（可点击）" : ""}`,
          type: className.split(".").pop() || "Unknown",
          category: (categoryKey || "others") as any,
          position,
          clickable,
          importance: "low" as any,
          userFriendlyName,
        };
        extracted.push(element);

        const cat = ensureCat(categoryKey || "others", {
          name: "其他元素",
          icon: undefined as any,
          color: "#8c8c8c",
          description: "其他UI元素",
        });
        (cat.elements as VisualUIElement[]).push(element);
      });

      setParsedElements(extracted);
      setCategories(
        Object.values(catMap).filter((c) => (c as any).elements.length > 0) as any
      );
      
      console.log(`✅ [useParsedVisualElements #${parseId}] 解析完成，提取元素: ${extracted.length}`);
    } catch (err) {
       
      console.error(`❌ [useParsedVisualElements #${parseId}] XML解析失败:`, err);
      setParsedElements([]);
      setCategories([]);
    }
  }, []);

  // 🐛 修复：强制重新解析 - 基于 XML 标识符而非字符串相等性
  useEffect(() => {
    // 🔥 修复：处理空值、空字符串、undefined 等情况
    if (!xmlContent || xmlContent.trim() === '') {
      console.log('⚠️ [useParsedVisualElements] xmlContent 为空，清空数据');
      setParsedElements([]);
      setCategories([]);
      lastXmlIdRef.current = '';
      return;
    }
    
    // 🔥 关键修复：生成当前 XML 的唯一标识符
    const currentXmlId = generateXmlIdentifier(xmlContent);
    
    console.log('🔍 [useParsedVisualElements] XML 标识符检查:');
    console.log('  - 当前长度:', xmlContent.length);
    console.log('  - 当前 ID:', currentXmlId.substring(0, 80));
    console.log('  - 上次 ID:', lastXmlIdRef.current.substring(0, 80));
    console.log('  - forceRefreshKey:', forceRefreshKey);
    
    // 🆕 检查是否与上次解析的 XML 不同，或者 forceRefreshKey 变化（强制刷新）
    // forceRefreshKey 变化时，即使 XML 内容相同也需要重新解析
    const shouldRefresh = currentXmlId !== lastXmlIdRef.current || 
                          (forceRefreshKey !== undefined && String(forceRefreshKey) !== lastXmlIdRef.current);
    
    if (shouldRefresh) {
      console.log('🔄 [useParsedVisualElements] 检测到新的 XML 数据或强制刷新，开始解析');
      console.log('  - 原因:', currentXmlId !== lastXmlIdRef.current ? 'XML内容变化' : 'forceRefreshKey 变化');
      lastXmlIdRef.current = forceRefreshKey !== undefined ? String(forceRefreshKey) : currentXmlId;
      parseXML(xmlContent);
    } else {
      console.log('⏭️ [useParsedVisualElements] XML 标识符相同且无强制刷新，跳过重复解析');
    }
  }, [xmlContent, parseXML, forceRefreshKey]);

  return { parsedElements, categories, parseXML };
}
