// src/modules/universal-ui/utils/selection-hash.ts
// module: universal-ui | layer: utils | role: utility
// summary: 计算元素选择哈希，确保前后端一致性

import type { ElementSelectionContext, SelectionHash } from '../types/intelligent-analysis-types';

/**
 * 标准化属性值
 */
function normalizeAttributeValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // 多空格变单空格
}

/**
 * 计算文本哈希（避免长文本）
 */
function calculateTextHash(text: string): string {
  if (!text || text.length <= 50) {
    return text;
  }
  
  // 简单哈希算法，与后端Rust实现保持一致
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * 标准化关键属性
 */
function normalizeKeyAttributes(attributes?: Record<string, string>): Record<string, string> {
  if (!attributes) {
    return {};
  }
  
  const normalized: Record<string, string> = {};
  
  // 按键名排序，确保一致性
  const sortedKeys = Object.keys(attributes).sort();
  
  for (const key of sortedKeys) {
    const value = attributes[key];
    if (value && value.trim()) {
      normalized[key] = normalizeAttributeValue(value);
    }
  }
  
  return normalized;
}

/**
 * 计算元素选择哈希
 * 与后端Rust实现保持一致
 */
export function calculateSelectionHash(context: ElementSelectionContext): SelectionHash {
  const components: string[] = [];
  
  // 1. 快照ID
  components.push(`snapshot:${context.snapshotId}`);
  
  // 2. 元素路径（核心标识）
  components.push(`path:${context.elementPath}`);
  
  // 3. 元素类型
  if (context.elementType) {
    components.push(`type:${context.elementType}`);
  }
  
  // 4. 文本内容（哈希化）
  if (context.elementText) {
    const textHash = calculateTextHash(context.elementText);
    components.push(`text:${textHash}`);
  }
  
  // 5. 边界框
  if (context.elementBounds) {
    components.push(`bounds:${context.elementBounds}`);
  }
  
  // 6. 关键属性（标准化并排序）
  const normalizedAttrs = normalizeKeyAttributes(context.keyAttributes);
  const attrEntries = Object.entries(normalizedAttrs);
  if (attrEntries.length > 0) {
    const attrString = attrEntries
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    components.push(`attrs:${attrString}`);
  }
  
  // 7. 容器信息（如果存在）
  if (context.containerInfo) {
    const { containerType, containerPath, itemIndex } = context.containerInfo;
    components.push(`container:${containerType}:${containerPath}`);
    if (typeof itemIndex === 'number') {
      components.push(`index:${itemIndex}`);
    }
  }
  
  // 组合所有组件
  const combined = components.join('|');
  
  // 计算最终哈希
  return calculateTextHash(combined);
}

/**
 * 验证选择哈希是否匹配
 */
export function validateSelectionHash(
  context: ElementSelectionContext, 
  expectedHash: SelectionHash
): boolean {
  const calculatedHash = calculateSelectionHash(context);
  return calculatedHash === expectedHash;
}

/**
 * 创建选择哈希调试信息
 */
export function debugSelectionHash(context: ElementSelectionContext): {
  hash: SelectionHash;
  components: Record<string, string>;
} {
  const components: Record<string, string> = {};
  
  components.snapshot = context.snapshotId;
  components.path = context.elementPath;
  
  if (context.elementType) {
    components.type = context.elementType;
  }
  
  if (context.elementText) {
    components.text = calculateTextHash(context.elementText);
  }
  
  if (context.elementBounds) {
    components.bounds = context.elementBounds;
  }
  
  if (context.keyAttributes) {
    const normalized = normalizeKeyAttributes(context.keyAttributes);
    if (Object.keys(normalized).length > 0) {
      components.attributes = JSON.stringify(normalized);
    }
  }
  
  if (context.containerInfo) {
    components.container = `${context.containerInfo.containerType}:${context.containerInfo.containerPath}`;
    if (typeof context.containerInfo.itemIndex === 'number') {
      components.containerIndex = context.containerInfo.itemIndex.toString();
    }
  }
  
  return {
    hash: calculateSelectionHash(context),
    components
  };
}

/**
 * 简化版本：从 UIElement 生成选择哈希（向后兼容）
 * 用于在没有完整上下文时快速生成哈希
 */
export function generateSelectionHash(element: {
  resource_id?: string;
  text?: string;
  class_name?: string;
  content_desc?: string;
  bounds?: { left: number; top: number; right: number; bottom: number };
}): string {
  const keyAttrs = [
    element.resource_id,
    element.text,
    element.class_name,
    element.content_desc,
    element.bounds ? `${element.bounds.left}-${element.bounds.top}` : undefined
  ].filter(Boolean).join('|');
  
  // 使用相同的哈希算法保持一致性
  return calculateTextHash(keyAttrs).slice(0, 12);
}