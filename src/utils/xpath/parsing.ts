/**
 * XPath 解析工具函数
 * 
 * 提供 XPath 表达式的解析和分析功能
 */

import { ParsedXPath } from './types';

/**
 * 解析 XPath 表达式，提取其中的信息
 */
export function parseXPath(xpath: string): ParsedXPath | null {
  if (!xpath || typeof xpath !== 'string') {
    return null;
  }

  const result: ParsedXPath = {
    expression: xpath
  };

  try {
    // 提取标签名
    const tagMatch = xpath.match(/\/\/([a-zA-Z][a-zA-Z0-9_-]*)/);
    if (tagMatch) {
      result.tagName = tagMatch[1];
    }

    // 提取属性 - 使用Array.from避免迭代器兼容性问题
    const attributeMatches = Array.from(xpath.matchAll(/@([a-zA-Z][a-zA-Z0-9_-]*)="([^"]+)"/g));
    const attributes: Record<string, string> = {};
    
    for (const match of attributeMatches) {
      const [, attrName, attrValue] = match;
      attributes[attrName] = attrValue;
    }
    
    if (Object.keys(attributes).length > 0) {
      result.attributes = attributes;
    }

    // 提取文本内容
    const textMatch = xpath.match(/@text="([^"]+)"/);
    if (textMatch) {
      result.text = textMatch[1];
    }

    // 提取索引
    const indexMatch = xpath.match(/\[(\d+)\]$/);
    if (indexMatch) {
      result.index = parseInt(indexMatch[1]) - 1; // 转换为 0 基索引
    }

    return result;
  } catch (error) {
    console.warn('解析 XPath 时出错:', error);
    return result;
  }
}

/**
 * 从 XPath 中提取 resource-id
 */
export function extractResourceId(xpath: string): string | null {
  if (!xpath) {
    return null;
  }

  const match = xpath.match(/@resource-id="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * 从 XPath 中提取文本内容
 */
export function extractText(xpath: string): string | null {
  if (!xpath) {
    return null;
  }

  const match = xpath.match(/@text="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * 从 XPath 中提取 content-desc
 */
export function extractContentDesc(xpath: string): string | null {
  if (!xpath) {
    return null;
  }

  const match = xpath.match(/@content-desc="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * 检查 XPath 是否包含特定属性
 */
export function hasAttribute(xpath: string, attributeName: string): boolean {
  if (!xpath || !attributeName) {
    return false;
  }

  const pattern = new RegExp(`@${attributeName}="`);
  return pattern.test(xpath);
}

/**
 * 获取 XPath 的复杂度评分（越低越简单）
 */
export function getXPathComplexity(xpath: string): number {
  if (!xpath) {
    return 0;
  }

  let complexity = 0;

  // 基础复杂度
  complexity += xpath.length * 0.1;

  // 路径层级复杂度
  const segments = xpath.split('/').filter(s => s.length > 0);
  complexity += segments.length * 2;

  // 谓词复杂度
  const predicates = (xpath.match(/\[/g) || []).length;
  complexity += predicates * 3;

  // 函数调用复杂度
  const functions = (xpath.match(/\w+\(/g) || []).length;
  complexity += functions * 5;

  // 轴操作复杂度
  const axes = (xpath.match(/::/g) || []).length;
  complexity += axes * 4;

  // 逻辑操作符复杂度
  const logicalOps = (xpath.match(/\b(and|or|not)\b/g) || []).length;
  complexity += logicalOps * 3;

  return Math.round(complexity);
}

/**
 * 比较两个 XPath 的相似度（0-1，1 表示完全相同）
 */
export function compareXPathSimilarity(xpath1: string, xpath2: string): number {
  if (!xpath1 || !xpath2) {
    return 0;
  }

  if (xpath1 === xpath2) {
    return 1;
  }

  const parsed1 = parseXPath(xpath1);
  const parsed2 = parseXPath(xpath2);

  if (!parsed1 || !parsed2) {
    return 0;
  }

  let similarity = 0;
  let factors = 0;

  // 比较标签名
  if (parsed1.tagName && parsed2.tagName) {
    factors++;
    if (parsed1.tagName === parsed2.tagName) {
      similarity += 0.3;
    }
  }

  // 比较属性
  if (parsed1.attributes && parsed2.attributes) {
    factors++;
    const attrs1 = Object.keys(parsed1.attributes);
    const attrs2 = Object.keys(parsed2.attributes);
    const commonAttrs = attrs1.filter(attr => 
      attrs2.includes(attr) && 
      parsed1.attributes![attr] === parsed2.attributes![attr]
    );
    similarity += (commonAttrs.length / Math.max(attrs1.length, attrs2.length)) * 0.5;
  }

  // 比较文本
  if (parsed1.text && parsed2.text) {
    factors++;
    if (parsed1.text === parsed2.text) {
      similarity += 0.2;
    }
  }

  return factors > 0 ? similarity / factors : 0;
}