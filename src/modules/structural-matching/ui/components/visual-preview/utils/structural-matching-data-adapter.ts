// src/modules/structural-matching/ui/components/visual-preview/utils/structural-matching-data-adapter.ts
// module: structural-matching | layer: ui | role: 数据适配器
// summary: 转换后端格式到前端VisualUIElement格式的适配器

import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

/**
 * 边界对象格式
 */
interface BoundsObject {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * 后端元素数据格式（下划线命名）
 */
export interface BackendElementData {
  id: string;
  element_type?: string;
  text?: string;
  bounds?: string | BoundsObject;
  xpath?: string;
  resource_id?: string;
  class_name?: string;
  is_clickable?: boolean;
  is_scrollable?: boolean;
  is_enabled?: boolean;
  is_focused?: boolean;
  checkable?: boolean;
  checked?: boolean;
  selected?: boolean;
  password?: boolean;
  content_desc?: string;
  xmlCacheId?: string;
  children?: BackendElementData[];
  [key: string]: unknown;
}

/**
 * 转换后端元素数据格式到前端VisualUIElement格式
 * @param backendData 后端数据
 * @returns 前端VisualUIElement格式
 */
export function adaptBackendElementToVisualUI(
  backendData: BackendElementData
): VisualUIElement {
  // 解析bounds - 支持多种格式
  let position = { x: 0, y: 0, width: 0, height: 0 };
  let boundsStr = "";
  
  if (backendData.bounds) {
    if (typeof backendData.bounds === 'string') {
      // 字符串格式: "[13,1158][534,2023]"
      boundsStr = backendData.bounds;
      const matches = backendData.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (matches) {
        const [, left, top, right, bottom] = matches.map(Number);
        position = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        };
      }
    } else if (typeof backendData.bounds === 'object' && backendData.bounds !== null) {
      // 对象格式: {left: 13, top: 1158, right: 534, bottom: 2023}
      const bounds = backendData.bounds as BoundsObject;
      if (bounds.left !== undefined && bounds.top !== undefined) {
        position = {
          x: bounds.left,
          y: bounds.top,
          width: (bounds.right || bounds.left) - bounds.left,
          height: (bounds.bottom || bounds.top) - bounds.top,
        };
        boundsStr = `[${bounds.left},${bounds.top}][${bounds.right || bounds.left},${bounds.bottom || bounds.top}]`;
      }
    }
  }

  // 提取并转换属性
  const adapted: VisualUIElement = {
    id: backendData.id,
    text: backendData.text || "",
    description: backendData.content_desc || 
                 (backendData.class_name?.split('.').pop()) || 
                 "Unknown",
    type: backendData.element_type || 
          (backendData.class_name?.split('.').pop()) || 
          "Unknown",
    category: categorizeElementByType(backendData.element_type || ""),
    position,
    clickable: backendData.is_clickable || false,
    importance: determineImportance(backendData),
    userFriendlyName: generateUserFriendlyName(backendData),
    
    // 原始XML属性
    resourceId: backendData.resource_id,
    contentDesc: backendData.content_desc,
    className: backendData.class_name,
    bounds: boundsStr || undefined,
    xmlIndex: extractXmlIndex(backendData.id),
  };

  console.log(`🔄 [DataAdapter] 转换后端数据:`, {
    原始: {
      id: backendData.id,
      element_type: backendData.element_type,
      text: backendData.text,
      content_desc: backendData.content_desc,
      class_name: backendData.class_name,
      resource_id: backendData.resource_id,
    },
    转换后: {
      id: adapted.id,
      type: adapted.type,
      text: adapted.text,
      contentDesc: adapted.contentDesc,
      className: adapted.className,
      resourceId: adapted.resourceId,
      bounds: adapted.bounds,
    },
  });

  return adapted;
}

/**
 * 根据元素类型分类
 */
function categorizeElementByType(elementType: string): string {
  const type = elementType.toLowerCase();
  
  if (type.includes('button')) return 'buttons';
  if (type.includes('text') || type.includes('edit')) return 'text_inputs';
  if (type.includes('image')) return 'images';
  if (type.includes('list') || type.includes('recycler')) return 'lists';
  if (type.includes('tab')) return 'navigation';
  
  return 'containers';
}

/**
 * 确定元素重要性
 */
function determineImportance(data: BackendElementData): 'high' | 'medium' | 'low' {
  // 可点击的元素更重要
  if (data.is_clickable) return 'high';
  
  // 有文本内容的元素中等重要
  if (data.text || data.content_desc) return 'medium';
  
  return 'low';
}

/**
 * 生成用户友好的名称
 */
function generateUserFriendlyName(data: BackendElementData): string {
  // 优先使用text内容
  if (data.text && data.text.trim()) {
    return data.text.trim();
  }
  
  // 其次使用content-desc
  if (data.content_desc && data.content_desc.trim()) {
    return data.content_desc.trim();
  }
  
  // 最后使用类型名称
  const className = data.class_name || data.element_type || "";
  const simpleName = className.split('.').pop() || "Unknown";
  
  return `${simpleName}${data.is_clickable ? '（可点击）' : ''}`;
}

/**
 * 从元素ID中提取XML索引
 */
function extractXmlIndex(elementId: string): number | undefined {
  const match = elementId.match(/element[_-](\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * 批量转换后端元素数据数组
 */
export function adaptBackendElementsToVisualUI(
  backendElements: BackendElementData[]
): VisualUIElement[] {
  return backendElements.map(adaptBackendElementToVisualUI);
}