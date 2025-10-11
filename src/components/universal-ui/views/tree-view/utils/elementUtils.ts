// src/components/universal-ui/views/tree-view/utils/elementUtils.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UIElementTree 工具函数
 * 处理元素的层级关系、质量评估和树形结构构建
 */

import { UIElement, ElementWithHierarchy } from '../types';

/**
 * 移除循环引用的函数
 */
export const removeCircularReferences = (elements: ElementWithHierarchy[]): ElementWithHierarchy[] => {
  const result = [...elements];
  const visited = new Set<string>();
  
  // 检测并断开循环引用
  const checkCircular = (elementId: string, path: Set<string>): boolean => {
    if (path.has(elementId)) {
      return true; // 发现循环
    }
    
    if (visited.has(elementId)) {
      return false; // 已经检查过，安全
    }
    
    visited.add(elementId);
    const newPath = new Set(path);
    newPath.add(elementId);
    
    const element = result.find(el => el.id === elementId);
    if (element && element.parentId) {
      return checkCircular(element.parentId, newPath);
    }
    
    return false;
  };
  
  // 移除有循环引用的元素的父子关系
  for (const element of result) {
    if (element.parentId && checkCircular(element.id, new Set())) {
      console.warn('🚨 断开循环引用:', element.id, '-> parent:', element.parentId);
      element.parentId = undefined; // 断开循环引用
    }
  }
  
  return result;
};

/**
 * 元素质量评估算法
 */
export const assessElementQuality = (element: UIElement): number => {
  let score = 50; // 基础分数

  // 文本内容评估
  if (element.text && element.text.trim().length > 0) {
    score += 20;
    // 文本长度合理性
    if (element.text.length > 2 && element.text.length < 100) {
      score += 10;
    }
  }

  // 资源ID评估
  if (element.resource_id && element.resource_id.trim().length > 0) {
    score += 15;
  }

  // 交互性评估
  if (element.is_clickable) {
    score += 10;
  }
  if (element.is_scrollable) {
    score += 5;
  }

  // 内容描述评估
  if (element.content_desc && element.content_desc.trim().length > 0) {
    score += 10;
  }

  // 元素尺寸合理性
  const width = element.bounds.right - element.bounds.left;
  const height = element.bounds.bottom - element.bounds.top;
  if (width > 10 && height > 10 && width < 2000 && height < 2000) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * 获取质量颜色
 */
export const getQualityColor = (score: number): string => {
  if (score >= 80) return '#52c41a'; // 绿色 - 高质量
  if (score >= 60) return '#faad14'; // 橙色 - 中等质量
  if (score >= 40) return '#fa8c16'; // 深橙色 - 低质量
  return '#ff4d4f'; // 红色 - 极低质量
};

/**
 * 检查元素B是否被元素A包含
 */
export const isElementContainedBy = (elementA: UIElement, elementB: UIElement): boolean => {
  try {
    if (!elementA.bounds || !elementB.bounds) {
      return false;
    }

    const isContained = (
      elementA.bounds.left <= elementB.bounds.left &&
      elementA.bounds.top <= elementB.bounds.top &&
      elementA.bounds.right >= elementB.bounds.right &&
      elementA.bounds.bottom >= elementB.bounds.bottom
    );

    // 确保不是同一个元素
    const isIdentical = (
      elementA.bounds.left === elementB.bounds.left &&
      elementA.bounds.top === elementB.bounds.top &&
      elementA.bounds.right === elementB.bounds.right &&
      elementA.bounds.bottom === elementB.bounds.bottom
    );
    
    return isContained && !isIdentical;
  } catch (error) {
    console.warn('🚨 边界检查时出错:', elementA.id, elementB.id, error);
    return false;
  }
};

/**
 * 计算bounds面积
 */
export const calculateBoundsArea = (bounds: UIElement['bounds']): number => {
  try {
    if (!bounds) return 0;
    
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    
    // 验证尺寸有效性
    if (width <= 0 || height <= 0) return 0;
    if (!isFinite(width) || !isFinite(height)) return 0;
    
    return width * height;
  } catch (error) {
    console.warn('🚨 计算面积时出错:', bounds, error);
    return 0;
  }
};

/**
 * 计算元素深度
 */
export const calculateDepth = (element: UIElement, allElements: UIElement[]): number => {
  let depth = 0;
  
  // 通过包含关系计算深度
  for (const other of allElements) {
    if (other.id !== element.id && isElementContainedBy(other, element)) {
      depth++;
    }
  }
  
  return depth;
};

/**
 * 查找父元素
 */
export const findParentElement = (element: UIElement, allElements: UIElement[]): UIElement | null => {
  let bestParent: UIElement | null = null;
  let smallestArea = Infinity;
  
  for (const candidate of allElements) {
    if (candidate.id !== element.id && isElementContainedBy(candidate, element)) {
      const area = calculateBoundsArea(candidate.bounds);
      if (area > 0 && area < smallestArea) {
        bestParent = candidate;
        smallestArea = area;
      }
    }
  }
  
  return bestParent;
};

/**
 * 获取元素中心点
 */
export const getElementCenter = (element: UIElement) => {
  return {
    x: Math.round((element.bounds.left + element.bounds.right) / 2),
    y: Math.round((element.bounds.top + element.bounds.bottom) / 2),
  };
};

/**
 * 获取元素图标
 */
export const getElementIcon = (element: UIElement): string => {
  if (element.is_clickable) return '🔘';
  if (element.is_scrollable) return '📜';
  if (element.text) return '📝';
  if (element.element_type.toLowerCase().includes('image')) return '🖼️';
  return '📦';
};