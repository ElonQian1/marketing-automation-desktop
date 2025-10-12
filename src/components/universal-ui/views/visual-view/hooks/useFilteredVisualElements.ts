// src/components/universal-ui/views/visual-view/hooks/useFilteredVisualElements.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useMemo } from 'react';
import type { VisualUIElement } from '../../../types';
import { FilterAdapter, type VisualFilterConfig, defaultVisualFilterConfig } from '../../../../../services/ui-filter-adapter';

interface Params {
  elements: VisualUIElement[];
  searchText: string;
  selectedCategory: string;
  showOnlyClickable: boolean;
  hideCompletely: boolean;
  selectionManager: any;
  filterConfig?: VisualFilterConfig;
}

export function useFilteredVisualElements({ elements, searchText, selectedCategory, showOnlyClickable, hideCompletely, selectionManager, filterConfig }: Params) {
  return useMemo(() => {
    // 首先处理隐藏元素
    let filtered = elements;
    if (hideCompletely) {
      filtered = filtered.filter(element => {
        const isHidden = selectionManager.hiddenElements.some((h: any) => h.id === element.id);
        return !isHidden;
      });
    }

    // 搜索过滤
    const kw = searchText.trim().toLowerCase();
    if (kw) {
      filtered = filtered.filter(element => 
        element.userFriendlyName.toLowerCase().includes(kw) || 
        element.description.toLowerCase().includes(kw)
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(element => element.category === selectedCategory);
    }

    // 基础可点击过滤（兼容旧开关）
    if (showOnlyClickable) {
      filtered = filtered.filter(element => element.clickable);
    }

    // 使用FilterAdapter进行高级过滤
    if (filterConfig) {
      // 转换为新过滤器配置
      const newConfig = FilterAdapter.convertLegacyConfig(filterConfig);
      
      // 应用基于VisualUIElement的过滤逻辑
      filtered = filtered.filter(element => {
        // 尺寸过滤
        const w = element.position?.width ?? 0;
        const h = element.position?.height ?? 0;
        if (w < (filterConfig.minWidth || 0) || h < (filterConfig.minHeight || 0)) {
          return false;
        }

        // 文本/描述要求
        if (filterConfig.requireTextOrDesc) {
          const hasText = !!(element.text && element.text.trim());
          const hasDesc = !!(element.description && element.description.trim());
          if (!hasText && !hasDesc) return false;
        }

        // 类名包含/排除（从 description/type 中匹配）
        const nameForClass = (element.type || element.description || '').toString();
        if (filterConfig.includeClasses?.length && 
            !filterConfig.includeClasses.some(k => nameForClass.includes(k))) {
          return false;
        }
        if (filterConfig.excludeClasses?.length && 
            filterConfig.excludeClasses.some(k => nameForClass.includes(k))) {
          return false;
        }

        // 可点击规则增强
        if (filterConfig.onlyClickable && !element.clickable) {
          return false;
        }

        return true;
      });
    }

    return filtered;
  }, [elements, searchText, selectedCategory, showOnlyClickable, hideCompletely, selectionManager.hiddenElements, filterConfig]);
}
