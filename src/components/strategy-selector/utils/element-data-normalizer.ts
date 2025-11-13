// src/components/strategy-selector/utils/element-data-normalizer.ts
// module: strategy-selector | layer: utils | role: 元素数据标准化
// summary: 统一转换元素数据为下划线命名格式

/**
 * 数据格式标准化函数 - 统一转换为下划线命名
 * 
 * @param element 原始元素数据（可能是驼峰或下划线命名）
 * @returns 标准化后的元素数据（下划线命名）
 */
export function normalizeElementData(element: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!element) {
    return {
      id: 'fallback_empty',
      resource_id: '',
      content_desc: '',
      text: '',
      class_name: '',
      bounds: '[0,0][0,0]',
      is_clickable: false,
      xpath: '',
      children: []
    };
  }

  // 🔧 统一转换：驼峰 → 下划线
  return {
    id: element.id || element['id'] || '',
    resource_id: element.resource_id || element['resourceId'] || '',
    content_desc: element.content_desc || element['contentDesc'] || '',
    text: element.text || '',
    class_name: element.class_name || element['className'] || '',
    bounds: element.bounds || '[0,0][0,0]',
    is_clickable: element.is_clickable ?? element['isClickable'] ?? false,
    xpath: element.xpath || '',
    children: element.children || []
  };
}
