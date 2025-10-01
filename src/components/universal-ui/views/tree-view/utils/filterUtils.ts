/**
 * UIElementTree 过滤工具
 * 处理元素筛选、搜索和标签过滤逻辑
 */

import { UIElement, ElementWithHierarchy, FilterOptions, FILTER_OPTIONS } from '../types';
import { assessElementQuality, calculateBoundsArea } from './elementUtils';

/**
 * 过滤元素
 */
export const filterElements = (
  elements: ElementWithHierarchy[],
  filterOptions: FilterOptions,
  searchTerm: string
): ElementWithHierarchy[] => {
  return elements.filter(element => {
    // 搜索过滤
    if (searchTerm && !matchesSearchTerm(element, searchTerm)) {
      return false;
    }

    // 质量过滤
    if (filterOptions.showHighQualityOnly) {
      const quality = assessElementQuality(element);
      if (quality < 80) {
        return false;
      }
    }

    // 可交互元素过滤
    if (filterOptions.showInteractableOnly) {
      if (!element.is_clickable && !element.is_scrollable && !element.is_focused) {
        return false;
      }
    }

    // 有文本内容过滤
    if (filterOptions.showWithTextOnly) {
      if (!element.text || element.text.trim().length === 0) {
        return false;
      }
    }

    // 有ID过滤
    if (filterOptions.showWithIdOnly) {
      if (!element.resource_id || element.resource_id.trim().length === 0) {
        return false;
      }
    }

    // 尺寸过滤
    if (filterOptions.hideSmallElements) {
      const area = calculateBoundsArea(element.bounds);
      if (area < 100) { // 小于100平方像素
        return false;
      }
    }

    return true;
  });
};

/**
 * 检查元素是否匹配搜索词
 */
const matchesSearchTerm = (element: UIElement, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return true;

  const searchableFields = [
    element.text,
    element.resource_id,
    element.content_desc,
    element.element_type,
    element.class_name,
    element.class_name,
    element.id
  ];

  return searchableFields.some(field => 
    field && field.toString().toLowerCase().includes(term)
  );
};

/**
 * 按质量分组元素
 */
export const groupElementsByQuality = (elements: ElementWithHierarchy[]): {
  high: ElementWithHierarchy[];
  medium: ElementWithHierarchy[];
  low: ElementWithHierarchy[];
} => {
  const groups = { high: [], medium: [], low: [] };

  elements.forEach(element => {
    const quality = assessElementQuality(element);
    if (quality >= 80) {
      groups.high.push(element);
    } else if (quality >= 60) {
      groups.medium.push(element);
    } else {
      groups.low.push(element);
    }
  });

  return groups;
};

/**
 * 按元素类型分组
 */
export const groupElementsByType = (elements: ElementWithHierarchy[]): Record<string, ElementWithHierarchy[]> => {
  const groups: Record<string, ElementWithHierarchy[]> = {};

  elements.forEach(element => {
    const type = element.element_type || 'Unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(element);
  });

  return groups;
};

/**
 * 获取筛选统计信息
 */
export const getFilterStats = (
  originalElements: ElementWithHierarchy[],
  filteredElements: ElementWithHierarchy[]
) => {
  const qualityGroups = groupElementsByQuality(originalElements);
  const typeGroups = groupElementsByType(originalElements);

  return {
    total: originalElements.length,
    filtered: filteredElements.length,
    hidden: originalElements.length - filteredElements.length,
    qualityDistribution: {
      high: qualityGroups.high.length,
      medium: qualityGroups.medium.length,
      low: qualityGroups.low.length,
    },
    typeDistribution: Object.entries(typeGroups).map(([type, elements]) => ({
      type,
      count: elements.length,
    })).sort((a, b) => b.count - a.count),
  };
};

/**
 * 应用快速过滤预设
 */
export const applyQuickFilter = (filterName: keyof typeof FILTER_OPTIONS): FilterOptions => {
  return { ...FILTER_OPTIONS[filterName] };
};

/**
 * 重置过滤器
 */
export const resetFilters = (): FilterOptions => {
  return {
    showHighQualityOnly: false,
    showInteractableOnly: false,
    showWithTextOnly: false,
    showWithIdOnly: false,
    hideSmallElements: false,
  };
};