import { useMemo } from 'react';
import type { VisualUIElement } from '../../../types';
import type { VisualFilterConfig } from '../../../types';
import { isClickableFromVisual } from '../../../shared/filters/clickableHeuristics';
import { defaultVisualFilterConfig } from '../../../types';

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
    return elements.filter(element => {
      if (hideCompletely) {
        const isHidden = selectionManager.hiddenElements.some((h: any) => h.id === element.id);
        if (isHidden) return false;
      }
      const kw = searchText.trim().toLowerCase();
      const matchesSearch = kw === '' || element.userFriendlyName.toLowerCase().includes(kw) || element.description.toLowerCase().includes(kw);
      const matchesCategory = selectedCategory === 'all' || element.category === selectedCategory;
      // 基础 clickable 过滤（兼容旧开关）
      const baseClickableOk = !showOnlyClickable || element.clickable;

      // 🆕 高级过滤规则
      // 规范化配置，防止历史缓存含 undefined/null 字段
      const cfg = filterConfig
        ? {
            ...defaultVisualFilterConfig,
            ...filterConfig,
            includeClasses: filterConfig.includeClasses ?? [],
            excludeClasses: filterConfig.excludeClasses ?? [],
          }
        : undefined;
      if (!cfg) return matchesSearch && matchesCategory && baseClickableOk;

      // 尺寸过滤
      const w = element.position?.width ?? 0;
      const h = element.position?.height ?? 0;
      if (w < cfg.minWidth || h < cfg.minHeight) return false;

      // 文本/描述要求
      if (cfg.requireTextOrDesc) {
        const hasText = !!(element.text && element.text.trim());
        const hasDesc = !!(element.description && element.description.trim());
        if (!hasText && !hasDesc) return false;
      }

      // 类名包含/排除（从 description/type 中尽最大努力匹配）
      const nameForClass = (element.element_type || element.type || element.description || '').toString();
      if ((cfg.includeClasses?.length ?? 0) > 0 && !cfg.includeClasses.some(k => nameForClass.includes(k))) return false;
      if ((cfg.excludeClasses?.length ?? 0) > 0 && cfg.excludeClasses.some(k => nameForClass.includes(k))) return false;

      // 可点击规则增强：按钮类 -> 可点击
      const advancedClickableOk = !cfg.onlyClickable || isClickableFromVisual(element, cfg);

      return matchesSearch && matchesCategory && baseClickableOk && advancedClickableOk;
    });
  }, [elements, searchText, selectedCategory, showOnlyClickable, hideCompletely, selectionManager.hiddenElements, filterConfig]);
}
