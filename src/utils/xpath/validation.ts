/**
 * XPath 验证工具函数
 * 
 * 统一所有 XPath 验证逻辑，替代分散在各模块中的验证函数
 */

import { XPathValidationResult } from './types';

/**
 * 验证 XPath 表达式是否有效
 * 统一替代 DefaultMatchingBuilder.ts 和 EnhancedMatchingHelper.ts 中的重复实现
 */
export function isValidXPath(xpath: string | undefined | null): boolean {
  if (!xpath || typeof xpath !== 'string') {
    return false;
  }

  const trimmed = xpath.trim();
  if (trimmed.length === 0) {
    return false;
  }

  // 基本 XPath 语法检查
  try {
    // 检查是否以 / 或 // 开头
    if (!trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return false;
    }

    // 检查括号匹配
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return false;
    }

    // 检查引号匹配
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 详细验证 XPath 表达式
 * 提供详细的验证结果和错误信息
 */
export function validateXPath(xpath: string | undefined | null): XPathValidationResult {
  if (!xpath || typeof xpath !== 'string') {
    return {
      isValid: false,
      error: 'XPath 表达式不能为空',
      suggestions: ['请提供有效的 XPath 表达式']
    };
  }

  const trimmed = xpath.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'XPath 表达式不能为空',
      suggestions: ['请提供有效的 XPath 表达式']
    };
  }

  // 检查 XPath 开头
  if (!trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return {
      isValid: false,
      error: 'XPath 必须以 / 或 // 开头',
      suggestions: [
        `尝试: /${trimmed}`,
        `尝试: //${trimmed}`
      ]
    };
  }

  // 检查括号匹配
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return {
      isValid: false,
      error: '方括号不匹配',
      suggestions: ['检查 [ 和 ] 的数量是否一致']
    };
  }

  // 检查引号匹配
  const singleQuotes = (trimmed.match(/'/g) || []).length;
  const doubleQuotes = (trimmed.match(/"/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    return {
      isValid: false,
      error: '单引号不匹配',
      suggestions: ['检查单引号 \' 是否成对出现']
    };
  }
  if (doubleQuotes % 2 !== 0) {
    return {
      isValid: false,
      error: '双引号不匹配',
      suggestions: ['检查双引号 " 是否成对出现']
    };
  }

  return {
    isValid: true
  };
}

/**
 * 检查 XPath 是否为简单的元素选择器（不包含复杂表达式）
 */
export function isSimpleXPath(xpath: string): boolean {
  if (!isValidXPath(xpath)) {
    return false;
  }

  // 简单 XPath 不应包含这些复杂操作符
  const complexPatterns = [
    /following-sibling::/,
    /preceding-sibling::/,
    /ancestor::/,
    /descendant::/,
    /parent::/,
    /child::/,
    /\|\|/,  // 或操作符
    /and\s/,
    /or\s/,
    /not\(/,
    /text\(\)/,
    /node\(\)/,
    /contains\(/,
    /starts-with\(/,
    /normalize-space\(/
  ];

  return !complexPatterns.some(pattern => pattern.test(xpath));
}