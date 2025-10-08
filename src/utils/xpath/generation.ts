/**
 * XPath 生成工具函数
 * 
 * 统一所有 XPath 生成逻辑，替代分散在各模块中的生成函数
 */

import { XPathGenerationOptions } from './types';

/**
 * 根据元素属性生成 XPath
 * 统一替代 utils.ts、xpath.ts 和各分析器中的 buildXPath 实现
 */
export function buildXPath(
  element: any,
  options: XPathGenerationOptions = {}
): string | null {
  if (!element) {
    return null;
  }

  const {
    useAttributes = true,
    useText = true,
    useIndex = false,
    preferredAttributes = ['resource-id', 'content-desc', 'text', 'class']
  } = options;

  // 获取标签名
  const tagName = element.tagName || element['tag'] || element['node'] || '*';
  
  // 构建 XPath 段
  const segments: string[] = [];

  // 优先使用 resource-id（Android 特有）
  if (useAttributes && element['resource-id']) {
    return `//*[@resource-id="${element['resource-id']}"]`;
  }

  // 使用 content-desc
  if (useAttributes && element['content-desc']) {
    return `//*[@content-desc="${element['content-desc']}"]`;
  }

  // 使用 text 属性
  if (useText && element.text && element.text.trim()) {
    const text = element.text.trim();
    return `//*[@text="${text}"]`;
  }

  // 使用 class 属性
  if (useAttributes && element.class) {
    segments.push(`@class="${element.class}"`);
  }

  // 构建基础 XPath
  let xpath = `//${tagName}`;
  
  if (segments.length > 0) {
    xpath += `[${segments.join(' and ')}]`;
  }

  // 使用索引（作为最后的选择）
  if (useIndex && element.index !== undefined) {
    xpath += `[${element.index + 1}]`;  // XPath 索引从 1 开始
  }

  return xpath;
}

/**
 * 根据元素层次结构生成更精确的 XPath
 */
export function buildHierarchicalXPath(
  element: any,
  parentElements: any[] = [],
  options: XPathGenerationOptions = {}
): string | null {
  if (!element) {
    return null;
  }

  // 如果有明确的 resource-id，直接使用
  if (element['resource-id']) {
    return `//*[@resource-id="${element['resource-id']}"]`;
  }

  const segments: string[] = [];

  // 构建父级路径
  for (const parent of parentElements) {
    if (parent['resource-id']) {
      segments.push(`//*[@resource-id="${parent['resource-id']}"]`);
      break; // 找到有 ID 的父级就停止
    } else if (parent.class) {
      segments.push(`//${parent.tagName || '*'}[@class="${parent.class}"]`);
    } else {
      segments.push(`//${parent.tagName || '*'}`);
    }
  }

  // 构建当前元素路径
  const currentXPath = buildXPath(element, options);
  if (!currentXPath) {
    return null;
  }

  // 如果没有父级路径，直接返回当前元素路径
  if (segments.length === 0) {
    return currentXPath;
  }

  // 组合层次化路径
  return `${segments.join('')}${currentXPath.replace('//', '/')}`;
}

/**
 * 生成多个候选 XPath（按优先级排序）
 */
export function generateCandidateXPaths(element: any): string[] {
  if (!element) {
    return [];
  }

  const candidates: string[] = [];

  // 1. resource-id 优先级最高
  if (element['resource-id']) {
    candidates.push(`//*[@resource-id="${element['resource-id']}"]`);
  }

  // 2. content-desc 次优先级
  if (element['content-desc']) {
    candidates.push(`//*[@content-desc="${element['content-desc']}"]`);
  }

  // 3. text 属性
  if (element.text && element.text.trim()) {
    const text = element.text.trim();
    candidates.push(`//*[@text="${text}"]`);
    candidates.push(`//*[contains(@text, "${text}")]`);
  }

  // 4. class + text 组合
  if (element.class && element.text && element.text.trim()) {
    const text = element.text.trim();
    candidates.push(`//*[@class="${element.class}" and @text="${text}"]`);
  }

  // 5. class 单独使用
  if (element.class) {
    candidates.push(`//*[@class="${element.class}"]`);
  }

  // 6. 标签名 + 索引（最后选择）
  if (element.tagName && element.index !== undefined) {
    candidates.push(`//${element.tagName}[${element.index + 1}]`);
  }

  // 去重并返回 - 使用Array.from避免迭代器兼容性问题
  const uniqueCandidates = Array.from(new Set(candidates));
  return uniqueCandidates;
}

/**
 * 优化现有 XPath 表达式
 */
export function optimizeXPath(xpath: string): string {
  if (!xpath) {
    return xpath;
  }

  let optimized = xpath;

  // 移除不必要的 //*
  optimized = optimized.replace(/\/\/\*\[@/g, '//*[@');

  // 简化常见模式
  optimized = optimized.replace(/\[@resource-id="([^"]+)"\]/g, '[@resource-id="$1"]');

  // 移除重复的谓词
  optimized = optimized.replace(/(\[@[^]]+\])\1+/g, '$1');

  return optimized;
}