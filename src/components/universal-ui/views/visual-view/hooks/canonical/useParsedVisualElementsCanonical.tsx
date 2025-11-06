// src/components/universal-ui/views/visual-view/hooks/canonical/useParsedVisualElementsCanonical.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// Canonical parser hook for visual-view kept in a dedicated file to avoid accidental duplication
import { useState, useEffect, useCallback, useRef } from "react";
import type { VisualUIElement, VisualElementCategory } from "../../../../types";
import { parseBounds } from "../../utils/elementTransform";
import { categorizeElement, getUserFriendlyName } from "../../utils/categorization";
import { parseXML as parseXMLFromXmlParser } from "../../../../xml-parser";

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
    console.log(`🔧 [useParsedVisualElements] 使用修复后的 XmlParser.parseXML (包含策略2)`);
    
    try {
      // ✅ 使用修复后的 XmlParser.parseXML，包含策略2（跳过不可点击的父容器）
      const parseResult = parseXMLFromXmlParser(xmlString);
      
      // 转换为旧格式以兼容现有代码
      const extracted: VisualUIElement[] = parseResult.elements.map((el, index) => ({
        id: el.id || `element_${index}`, // 🔧 修复：使用XML解析器提供的真实ID，确保前后端一致
        text: el.text || "",
        description: el.contentDesc || `${el.text || el.className}${el.clickable ? "（可点击）" : ""}`,
        type: el.className.split(".").pop() || "Unknown",
        category: (categorizeElement({
          "content-desc": el.contentDesc,
          text: el.text,
          class: el.className,
          clickable: el.clickable ? "true" : "false",
        } as any) as unknown) as string,
        position: parseBounds(el.bounds),
        clickable: el.clickable,
        importance: "low" as any,
        userFriendlyName: getUserFriendlyName({
          "content-desc": el.contentDesc,
          text: el.text,
          class: el.className,
          clickable: el.clickable ? "true" : "false",
        } as any),
        // 🔧 新增：保留原始XML属性，确保convertVisualToUIElement能正确访问
        resourceId: el.resourceId,
        contentDesc: el.contentDesc,
        className: el.className,
        bounds: el.bounds,
      }));

      // 构建分类映射
      const catMap: Record<string, VisualElementCategory & { elements: VisualUIElement[] }> = Object.create(null);
      
      extracted.forEach((element) => {
        const categoryKey = element.category || "others";
        if (!catMap[categoryKey]) {
          catMap[categoryKey] = {
            name: "其他元素",
            icon: undefined as any,
            color: "#8c8c8c",
            description: "其他UI元素",
            elements: [],
          } as any;
        }
        (catMap[categoryKey].elements as VisualUIElement[]).push(element);
      });

      setParsedElements(extracted);
      setCategories(
        Object.values(catMap).filter((c) => (c as any).elements.length > 0) as any
      );
      
      console.log(`✅ [useParsedVisualElements #${parseId}] 解析完成，提取元素: ${extracted.length}`);
      console.log(`✅ [已禁用所有过滤] 保留所有有效bounds的元素，包括父容器、子元素、不可点击元素`);
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
