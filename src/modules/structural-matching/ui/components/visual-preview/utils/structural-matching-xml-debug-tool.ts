// src/modules/structural-matching/ui/components/visual-preview/utils/structural-matching-xml-debug-tool.ts
// module: structural-matching | layer: ui | role: 调试工具
// summary: XML解析和属性提取调试工具，帮助诊断字段值丢失问题

import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

/**
 * 调试XML解析过程中的属性提取
 * @param xmlContent XML内容
 * @param targetBounds 目标元素的bounds
 */
export function debugXmlAttributeExtraction(xmlContent: string, targetBounds?: string) {
  console.log("🔍 [StructuralMatching] 开始XML属性提取调试");
  
  if (!xmlContent) {
    console.error("❌ XML内容为空");
    return;
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    // 检查XML是否解析成功
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("❌ XML解析错误:", parserError.textContent);
      return;
    }

    const allNodes = xmlDoc.querySelectorAll("node");
    console.log(`✅ XML解析成功，共${allNodes.length}个节点`);

    // 如果指定了目标bounds，重点调试该元素
    if (targetBounds) {
      console.log(`🎯 重点调试bounds为 ${targetBounds} 的元素:`);
      
      allNodes.forEach((node, index) => {
        const bounds = node.getAttribute("bounds") || "";
        
        if (bounds === targetBounds) {
          const text = node.getAttribute("text") || "";
          const contentDesc = node.getAttribute("content-desc") || "";
          const className = node.getAttribute("class") || "";
          const clickable = node.getAttribute("clickable") === "true";
          const resourceId = node.getAttribute("resource-id") || "";
          
          console.log(`📍 找到目标元素 (index=${index}):`, {
            bounds,
            text: text || "(空)",
            contentDesc: contentDesc || "(空)",
            className: className || "(空)",
            clickable,
            resourceId: resourceId || "(空)",
            rawAttributes: {
              text: node.getAttribute("text"),
              "content-desc": node.getAttribute("content-desc"),
              "resource-id": node.getAttribute("resource-id"),
              class: node.getAttribute("class"),
            }
          });
          
          // 检查子元素
          const childNodes = Array.from(node.children).filter(child => child.tagName === "node");
          console.log(`📦 该元素有${childNodes.length}个子元素:`);
          
          childNodes.forEach((child, childIndex) => {
            const childBounds = child.getAttribute("bounds") || "";
            const childText = child.getAttribute("text") || "";
            const childContentDesc = child.getAttribute("content-desc") || "";
            const childResourceId = child.getAttribute("resource-id") || "";
            
            console.log(`  └─ 子元素${childIndex}:`, {
              bounds: childBounds,
              text: childText || "(空)",
              contentDesc: childContentDesc || "(空)",
              resourceId: childResourceId || "(空)",
            });
          });
        }
      });
    }

    // 统计有内容的元素
    let elementsWithText = 0;
    let elementsWithContentDesc = 0;
    let elementsWithResourceId = 0;
    
    allNodes.forEach((node) => {
      const text = node.getAttribute("text");
      const contentDesc = node.getAttribute("content-desc");
      const resourceId = node.getAttribute("resource-id");
      
      if (text && text.trim()) elementsWithText++;
      if (contentDesc && contentDesc.trim()) elementsWithContentDesc++;
      if (resourceId && resourceId.trim()) elementsWithResourceId++;
    });
    
    console.log("📊 XML内容统计:", {
      总节点数: allNodes.length,
      有text的节点: elementsWithText,
      有contentDesc的节点: elementsWithContentDesc,
      有resourceId的节点: elementsWithResourceId,
    });

    // 显示前10个有内容的元素作为样本
    console.log("📋 前10个有内容的元素样本:");
    let sampleCount = 0;
    allNodes.forEach((node, index) => {
      if (sampleCount >= 10) return;
      
      const text = node.getAttribute("text") || "";
      const contentDesc = node.getAttribute("content-desc") || "";
      const bounds = node.getAttribute("bounds") || "";
      
      if (text.trim() || contentDesc.trim()) {
        console.log(`  ${index}: bounds=${bounds}, text="${text}", content-desc="${contentDesc}"`);
        sampleCount++;
      }
    });

  } catch (error) {
    console.error("❌ XML调试失败:", error);
  }
}

/**
 * 调试VisualUIElement数组中的属性情况
 * @param elements 解析后的元素数组
 * @param label 调试标签
 */
export function debugVisualUIElements(elements: VisualUIElement[], label: string = "元素") {
  console.log(`🔍 [StructuralMatching] ${label}属性调试 (共${elements.length}个):`);
  
  let elementsWithText = 0;
  let elementsWithContentDesc = 0;
  let elementsWithResourceId = 0;
  
  elements.forEach(el => {
    if (el.text && el.text.trim()) elementsWithText++;
    if (el.contentDesc && el.contentDesc.trim()) elementsWithContentDesc++;
    if (el.resourceId && el.resourceId.trim()) elementsWithResourceId++;
  });
  
  console.log(`📊 ${label}内容统计:`, {
    总元素数: elements.length,
    有text的元素: elementsWithText,
    有contentDesc的元素: elementsWithContentDesc,
    有resourceId的元素: elementsWithResourceId,
  });
  
  // 显示前5个有内容的元素
  console.log(`📋 前5个有内容的${label}样本:`);
  let sampleCount = 0;
  elements.forEach((el, index) => {
    if (sampleCount >= 5) return;
    
    if (el.text?.trim() || el.contentDesc?.trim() || el.resourceId?.trim()) {
      console.log(`  ${el.id} (index=${index}):`, {
        bounds: el.bounds,
        text: el.text || "(空)",
        contentDesc: el.contentDesc || "(空)", 
        resourceId: el.resourceId || "(空)",
        description: el.description || "(空)",
      });
      sampleCount++;
    }
  });
  
  // 如果没有找到有内容的元素，显示前3个元素的详细信息
  if (sampleCount === 0 && elements.length > 0) {
    console.warn(`⚠️ 没有找到有内容的${label}，显示前3个元素的详细信息:`);
    elements.slice(0, 3).forEach((el, index) => {
      console.log(`  ${el.id} (index=${index}):`, {
        bounds: el.bounds,
        text: el.text,
        contentDesc: el.contentDesc,
        resourceId: el.resourceId,
        description: el.description,
        rawData: el,
      });
    });
  }
}

/**
 * 比较原始XML节点和解析后VisualUIElement的属性差异
 */
export function debugAttributeMapping(xmlContent: string, elements: VisualUIElement[]) {
  console.log("🔍 [StructuralMatching] 开始XML属性映射调试");
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const allNodes = xmlDoc.querySelectorAll("node");
    
    console.log(`📊 对比统计: XML节点${allNodes.length}个 vs VisualUIElement${elements.length}个`);
    
    // 对比前5个元素的属性映射
    for (let i = 0; i < Math.min(5, allNodes.length, elements.length); i++) {
      const node = allNodes[i];
      const element = elements[i];
      
      const xmlAttrs = {
        text: node.getAttribute("text"),
        contentDesc: node.getAttribute("content-desc"),
        resourceId: node.getAttribute("resource-id"),
        bounds: node.getAttribute("bounds"),
      };
      
      const elementAttrs = {
        text: element.text,
        contentDesc: element.contentDesc,
        resourceId: element.resourceId,
        bounds: element.bounds,
      };
      
      console.log(`📍 元素${i} (${element.id}) 属性对比:`);
      console.log("  XML原始:", xmlAttrs);
      console.log("  解析后:", elementAttrs);
      
      // 检查是否有属性丢失
      const hasLoss = 
        (xmlAttrs.text && !elementAttrs.text) ||
        (xmlAttrs.contentDesc && !elementAttrs.contentDesc) ||
        (xmlAttrs.resourceId && !elementAttrs.resourceId);
        
      if (hasLoss) {
        console.warn("  ⚠️ 发现属性丢失！");
      } else {
        console.log("  ✅ 属性映射正常");
      }
    }
    
  } catch (error) {
    console.error("❌ 属性映射调试失败:", error);
  }
}