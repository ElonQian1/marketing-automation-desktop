// src/utils/elementFingerprint.ts
// module: shared | layer: utils | role: 元素指纹生成和匹配系统
// summary: 实现ElementFingerprint的生成、匹配和相似度计算算法

import type { ElementFingerprint } from '../types/smartSelection';

/**
 * XML元素信息接口
 */
export interface XmlElementInfo {
  bounds: { left: number; top: number; right: number; bottom: number };
  text?: string;
  className?: string;
  resourceId?: string;
  contentDesc?: string;
  clickable?: boolean;
  enabled?: boolean;
  selected?: boolean;
  packageName?: string;
  parent?: XmlElementInfo;
  children?: XmlElementInfo[];
  attributes?: Record<string, string>;
}

/**
 * 屏幕尺寸信息
 */
export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * 指纹生成配置
 */
export interface FingerprintConfig {
  includeTextHash: boolean;         // 是否包含文本哈希
  includePosition: boolean;         // 是否包含位置信息
  includeStructure: boolean;        // 是否包含结构信息
  includeAttributes: boolean;       // 是否包含属性信息
  normalizePosition: boolean;       // 是否标准化位置（0-1比例）
  contextDepth: number;             // 上下文深度（父子元素层数）
}

/**
 * 默认指纹配置
 */
export const DEFAULT_FINGERPRINT_CONFIG: FingerprintConfig = {
  includeTextHash: true,
  includePosition: true,
  includeStructure: true,
  includeAttributes: true,
  normalizePosition: true,
  contextDepth: 2,
};

/**
 * 指纹匹配结果
 */
export interface FingerprintMatchResult {
  similarity: number;               // 整体相似度 (0-1)
  confidence: number;               // 匹配置信度 (0-1)
  details: {
    textMatch: number;              // 文本匹配度
    positionMatch: number;          // 位置匹配度
    structureMatch: number;         // 结构匹配度
    attributeMatch: number;         // 属性匹配度
  };
  explanation: string[];            // 匹配解释
}

/**
 * 生成元素指纹
 */
export function generateElementFingerprint(
  element: XmlElementInfo,
  screenSize: ScreenSize,
  config: FingerprintConfig = DEFAULT_FINGERPRINT_CONFIG
): ElementFingerprint {
  const fingerprint: ElementFingerprint = {};
  
  // 文本特征
  if (config.includeTextHash && element.text) {
    fingerprint.text_content = element.text;
    fingerprint.text_hash = generateTextHash(element.text);
  }
  
  // 结构特征
  if (config.includeStructure) {
    fingerprint.class_chain = buildClassChain(element, config.contextDepth);
    fingerprint.resource_id = element.resourceId;
    fingerprint.resource_id_suffix = extractResourceIdSuffix(element.resourceId);
    
    if (element.parent) {
      fingerprint.parent_class = element.parent.className;
      fingerprint.sibling_count = element.parent.children?.length || 0;
    }
    
    fingerprint.child_count = element.children?.length || 0;
    fingerprint.depth_level = calculateDepthLevel(element);
    fingerprint.relative_index = calculateRelativeIndex(element);
  }
  
  // 位置特征
  if (config.includePosition) {
    if (config.normalizePosition) {
      fingerprint.bounds_signature = normalizePosition(element.bounds, screenSize);
    }
  }
  
  // 属性特征
  if (config.includeAttributes) {
    fingerprint.clickable = element.clickable;
    fingerprint.enabled = element.enabled;
    fingerprint.selected = element.selected;
    fingerprint.content_desc = element.contentDesc;
    fingerprint.package_name = element.packageName;
  }
  
  return fingerprint;
}

/**
 * 匹配元素指纹
 */
export function matchElementFingerprint(
  targetFingerprint: ElementFingerprint,
  candidateElement: XmlElementInfo,
  screenSize: ScreenSize,
  config: FingerprintConfig = DEFAULT_FINGERPRINT_CONFIG
): FingerprintMatchResult {
  const candidateFingerprint = generateElementFingerprint(candidateElement, screenSize, config);
  
  // 计算各维度匹配度
  const textMatch = calculateTextMatch(targetFingerprint, candidateFingerprint);
  const positionMatch = calculatePositionMatch(targetFingerprint, candidateFingerprint);
  const structureMatch = calculateStructureMatch(targetFingerprint, candidateFingerprint);
  const attributeMatch = calculateAttributeMatch(targetFingerprint, candidateFingerprint);
  
  // 计算加权相似度
  const weights = {
    text: 0.3,
    position: 0.25,
    structure: 0.3,
    attribute: 0.15,
  };
  
  const similarity = (
    textMatch * weights.text +
    positionMatch * weights.position +
    structureMatch * weights.structure +
    attributeMatch * weights.attribute
  );
  
  // 计算置信度（基于关键特征的强匹配）
  const confidence = calculateConfidence(targetFingerprint, candidateFingerprint, {
    textMatch,
    positionMatch,
    structureMatch,
    attributeMatch,
  });
  
  // 生成解释
  const explanation = generateMatchExplanation(
    { textMatch, positionMatch, structureMatch, attributeMatch },
    similarity,
    confidence
  );
  
  return {
    similarity,
    confidence,
    details: {
      textMatch,
      positionMatch,
      structureMatch,
      attributeMatch,
    },
    explanation,
  };
}

/**
 * 生成文本哈希
 */
function generateTextHash(text: string): string {
  // 简单的字符串哈希算法
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(36);
}

/**
 * 构建类名链
 */
function buildClassChain(element: XmlElementInfo, depth: number): string[] {
  const chain: string[] = [];
  let current: XmlElementInfo | undefined = element;
  
  for (let i = 0; i < depth && current; i++) {
    if (current.className) {
      chain.unshift(current.className);
    }
    current = current.parent;
  }
  
  return chain;
}

/**
 * 提取资源ID后缀
 */
function extractResourceIdSuffix(resourceId?: string): string | undefined {
  if (!resourceId) return undefined;
  const lastSlash = resourceId.lastIndexOf('/');
  return lastSlash !== -1 ? resourceId.substring(lastSlash + 1) : resourceId;
}

/**
 * 计算元素深度
 */
function calculateDepthLevel(element: XmlElementInfo): number {
  let depth = 0;
  let current = element.parent;
  
  while (current) {
    depth++;
    current = current.parent;
  }
  
  return depth;
}

/**
 * 计算相对索引
 */
function calculateRelativeIndex(element: XmlElementInfo): number {
  if (!element.parent || !element.parent.children) {
    return 0;
  }
  
  return element.parent.children.findIndex(child => child === element);
}

/**
 * 标准化位置
 */
function normalizePosition(
  bounds: { left: number; top: number; right: number; bottom: number },
  screenSize: ScreenSize
) {
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  
  return {
    x: centerX / screenSize.width,
    y: centerY / screenSize.height,
    width: width / screenSize.width,
    height: height / screenSize.height,
  };
}

/**
 * 计算文本匹配度
 */
function calculateTextMatch(
  target: ElementFingerprint,
  candidate: ElementFingerprint
): number {
  // 精确文本匹配
  if (target.text_content && candidate.text_content) {
    if (target.text_content === candidate.text_content) {
      return 1.0;
    }
    
    // 文本相似度（简单的编辑距离）
    const similarity = calculateStringSimilarity(target.text_content, candidate.text_content);
    if (similarity > 0.8) {
      return similarity;
    }
  }
  
  // 文本哈希匹配
  if (target.text_hash && candidate.text_hash) {
    return target.text_hash === candidate.text_hash ? 1.0 : 0.0;
  }
  
  // 无文本信息
  if (!target.text_content && !candidate.text_content) {
    return 1.0; // 都没有文本，认为匹配
  }
  
  return 0.0;
}

/**
 * 计算位置匹配度
 */
function calculatePositionMatch(
  target: ElementFingerprint,
  candidate: ElementFingerprint
): number {
  if (!target.bounds_signature || !candidate.bounds_signature) {
    return 0.5; // 无位置信息，给中等分数
  }
  
  const targetPos = target.bounds_signature;
  const candidatePos = candidate.bounds_signature;
  
  // 计算位置距离
  const xDiff = Math.abs(targetPos.x - candidatePos.x);
  const yDiff = Math.abs(targetPos.y - candidatePos.y);
  const sizeDiff = Math.abs(targetPos.width * targetPos.height - candidatePos.width * candidatePos.height);
  
  // 位置容错范围
  const positionTolerance = 0.05; // 5%的屏幕尺寸
  const sizeTolerance = 0.1; // 10%的面积差异
  
  if (xDiff < positionTolerance && yDiff < positionTolerance && sizeDiff < sizeTolerance) {
    return 1.0 - (xDiff + yDiff + sizeDiff) / 3; // 线性衰减
  }
  
  // 位置差异较大，但仍在合理范围内
  const maxDistance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  return Math.max(0, 1 - maxDistance / 0.5); // 最大50%屏幕距离内有效
}

/**
 * 计算结构匹配度
 */
function calculateStructureMatch(
  target: ElementFingerprint,
  candidate: ElementFingerprint
): number {
  let score = 0;
  let totalWeight = 0;
  
  // 类名链匹配
  if (target.class_chain && candidate.class_chain) {
    const chainSimilarity = calculateArraySimilarity(target.class_chain, candidate.class_chain);
    score += chainSimilarity * 0.4;
    totalWeight += 0.4;
  }
  
  // 资源ID匹配
  if (target.resource_id && candidate.resource_id) {
    const idMatch = target.resource_id === candidate.resource_id ? 1.0 : 0.0;
    score += idMatch * 0.3;
    totalWeight += 0.3;
  } else if (target.resource_id_suffix && candidate.resource_id_suffix) {
    const suffixMatch = target.resource_id_suffix === candidate.resource_id_suffix ? 1.0 : 0.0;
    score += suffixMatch * 0.2;
    totalWeight += 0.2;
  }
  
  // 父元素类名匹配
  if (target.parent_class && candidate.parent_class) {
    const parentMatch = target.parent_class === candidate.parent_class ? 1.0 : 0.0;
    score += parentMatch * 0.15;
    totalWeight += 0.15;
  }
  
  // 相对索引匹配
  if (typeof target.relative_index === 'number' && typeof candidate.relative_index === 'number') {
    const indexMatch = target.relative_index === candidate.relative_index ? 1.0 : 0.8;
    score += indexMatch * 0.15;
    totalWeight += 0.15;
  }
  
  return totalWeight > 0 ? score / totalWeight : 0.5;
}

/**
 * 计算属性匹配度
 */
function calculateAttributeMatch(
  target: ElementFingerprint,
  candidate: ElementFingerprint
): number {
  let matches = 0;
  let total = 0;
  
  const booleanAttributes: (keyof ElementFingerprint)[] = ['clickable', 'enabled', 'selected'];
  
  for (const attr of booleanAttributes) {
    if (target[attr] !== undefined && candidate[attr] !== undefined) {
      if (target[attr] === candidate[attr]) {
        matches++;
      }
      total++;
    }
  }
  
  // 内容描述匹配
  if (target.content_desc && candidate.content_desc) {
    if (target.content_desc === candidate.content_desc) {
      matches++;
    }
    total++;
  }
  
  return total > 0 ? matches / total : 1.0;
}

/**
 * 计算置信度
 */
function calculateConfidence(
  target: ElementFingerprint,
  candidate: ElementFingerprint,
  matchDetails: { textMatch: number; positionMatch: number; structureMatch: number; attributeMatch: number }
): number {
  // 关键特征强匹配提升置信度
  let confidence = 0.5; // 基础置信度
  
  // 精确文本匹配 -> 高置信度
  if (matchDetails.textMatch > 0.95) {
    confidence += 0.3;
  }
  
  // 资源ID精确匹配 -> 高置信度
  if (target.resource_id && candidate.resource_id && target.resource_id === candidate.resource_id) {
    confidence += 0.25;
  }
  
  // 位置精确匹配 -> 中等置信度提升
  if (matchDetails.positionMatch > 0.9) {
    confidence += 0.15;
  }
  
  // 结构强匹配 -> 中等置信度提升
  if (matchDetails.structureMatch > 0.8) {
    confidence += 0.1;
  }
  
  return Math.min(1.0, confidence);
}

/**
 * 生成匹配解释
 */
function generateMatchExplanation(
  matchDetails: { textMatch: number; positionMatch: number; structureMatch: number; attributeMatch: number },
  similarity: number,
  confidence: number
): string[] {
  const explanation: string[] = [];
  
  explanation.push(`整体相似度: ${(similarity * 100).toFixed(1)}%`);
  explanation.push(`匹配置信度: ${(confidence * 100).toFixed(1)}%`);
  
  if (matchDetails.textMatch > 0.8) {
    explanation.push(`✓ 文本匹配度高 (${(matchDetails.textMatch * 100).toFixed(1)}%)`);
  } else if (matchDetails.textMatch < 0.3) {
    explanation.push(`⚠ 文本匹配度低 (${(matchDetails.textMatch * 100).toFixed(1)}%)`);
  }
  
  if (matchDetails.positionMatch > 0.8) {
    explanation.push(`✓ 位置匹配度高 (${(matchDetails.positionMatch * 100).toFixed(1)}%)`);
  } else if (matchDetails.positionMatch < 0.3) {
    explanation.push(`⚠ 位置偏差较大 (${(matchDetails.positionMatch * 100).toFixed(1)}%)`);
  }
  
  if (matchDetails.structureMatch > 0.8) {
    explanation.push(`✓ 结构匹配度高 (${(matchDetails.structureMatch * 100).toFixed(1)}%)`);
  }
  
  if (confidence > 0.8) {
    explanation.push('🎯 高置信度匹配，推荐使用');
  } else if (confidence < 0.5) {
    explanation.push('⚠ 低置信度匹配，建议人工确认');
  }
  
  return explanation;
}

/**
 * 计算字符串相似度（简单版本）
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * 计算数组相似度
 */
function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1.0;
  if (arr1.length === 0 || arr2.length === 0) return 0.0;
  
  const intersection = arr1.filter(item => arr2.includes(item));
  const union = [...new Set([...arr1, ...arr2])];
  
  return intersection.length / union.length;
}

/**
 * 计算编辑距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 批量匹配元素指纹
 */
export function batchMatchElementFingerprints(
  targetFingerprint: ElementFingerprint,
  candidates: XmlElementInfo[],
  screenSize: ScreenSize,
  config: FingerprintConfig = DEFAULT_FINGERPRINT_CONFIG
): Array<FingerprintMatchResult & { elementIndex: number }> {
  return candidates
    .map((candidate, index) => ({
      ...matchElementFingerprint(targetFingerprint, candidate, screenSize, config),
      elementIndex: index,
    }))
    .sort((a, b) => b.similarity - a.similarity); // 按相似度降序排列
}

/**
 * 查找最佳匹配
 */
export function findBestMatch(
  targetFingerprint: ElementFingerprint,
  candidates: XmlElementInfo[],
  screenSize: ScreenSize,
  minConfidence: number = 0.7,
  config: FingerprintConfig = DEFAULT_FINGERPRINT_CONFIG
): { match: XmlElementInfo; result: FingerprintMatchResult } | null {
  const results = batchMatchElementFingerprints(targetFingerprint, candidates, screenSize, config);
  
  if (results.length === 0) {
    return null;
  }
  
  const bestResult = results[0];
  if (bestResult.confidence >= minConfidence) {
    return {
      match: candidates[bestResult.elementIndex],
      result: bestResult,
    };
  }
  
  return null;
}