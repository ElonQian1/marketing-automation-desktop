/**
 * XPath 验证相关类型定义
 */

export interface XPathValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export interface XPathGenerationOptions {
  /** 是否使用属性选择器 */
  useAttributes?: boolean;
  /** 是否使用文本内容 */
  useText?: boolean;
  /** 是否使用索引 */
  useIndex?: boolean;
  /** 优先使用的属性列表 */
  preferredAttributes?: string[];
}

export interface ParsedXPath {
  /** 原始 XPath 表达式 */
  expression: string;
  /** 解析出的标签名 */
  tagName?: string;
  /** 解析出的属性 */
  attributes?: Record<string, string>;
  /** 解析出的文本内容 */
  text?: string;
  /** 解析出的索引 */
  index?: number;
}

export interface XPathCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}