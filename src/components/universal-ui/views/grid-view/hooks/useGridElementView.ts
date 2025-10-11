// src/components/universal-ui/views/grid-view/hooks/useGridElementView.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * GridElementView 主状态管理 Hook
 * 负责统筹各子 Hook 和主要状态
 */

import { useState, useEffect, useRef } from 'react';
import type { VisualUIElement } from '../../../types';
import { UiNode, AdvancedFilter, SearchOptions } from '../types';
import type { NodeLocator } from '../../../../../domain/inspector/entities/NodeLocator';
import { loadPrefs, savePrefs } from '../prefs';
import { getSearchHistory, getFavoriteSearches, getXPathHistory, getFavoriteXPaths } from '../history';
import { loadLatestMatching } from '../matchingCache';
import { useXmlParsing } from './useXmlParsing';
import { useSearchAndMatch } from './useSearchAndMatch';
import { useXPathNavigator } from './useXPathNavigator';
import { useMatchingSelection } from './useMatchingSelection';
import { usePanelSync } from './usePanelSync';
import { useResizableSplit } from './useResizableSplit';
import { useGridHotkeys } from '../useGridHotkeys';

export interface UseGridElementViewProps {
  xmlContent?: string;
  elements?: VisualUIElement[];
  onElementSelect?: (element: VisualUIElement) => void;
  selectedElementId?: string;
  locator?: NodeLocator;
  locatorResolve?: (root: UiNode | null, locator: NodeLocator) => UiNode | null;
  onApplyCriteria?: (criteria: {
    strategy: string;
    fields: string[];
    values: Record<string, string>;
    includes?: Record<string, string[]>;
    excludes?: Record<string, string[]>;
    matchMode?: Record<string, "equals" | "contains" | "regex">;
    regexIncludes?: Record<string, string[]>;
    regexExcludes?: Record<string, string[]>;
    preview?: {
      xpath?: string;
      bounds?: string | { left: number; top: number; right: number; bottom: number };
    };
  }) => void;
  onLatestMatchingChange?: (m: { strategy: string; fields: string[] }) => void;
  initialMatching?: {
    strategy: string;
    fields: string[];
    values: Record<string, string>;
    includes?: Record<string, string[]>;
    excludes?: Record<string, string[]>;
  };
}

export const useGridElementView = (props: UseGridElementViewProps) => {
  const {
    xmlContent = "",
    locator,
    locatorResolve,
    onLatestMatchingChange,
    initialMatching,
  } = props;

  // ===== 基础状态 =====
  const [selected, setSelected] = useState<UiNode | null>(null);
  const [expandAll, setExpandAll] = useState<boolean>(false);
  const [collapseVersion, setCollapseVersion] = useState<number>(0);
  const [expandDepth, setExpandDepth] = useState<number>(0);
  const [showMatchedOnly, setShowMatchedOnly] = useState<boolean>(false);
  const [autoSelectOnParse, setAutoSelectOnParse] = useState<boolean>(false);

  // ===== 历史记录状态 =====
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favSearch, setFavSearch] = useState<string[]>([]);
  const [xpathHistory, setXpathHistory] = useState<string[]>([]);
  const [favXPath, setFavXPath] = useState<string[]>([]);

  // ===== Refs =====
  const fileRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const xpathRef = useRef<HTMLInputElement | null>(null);

  // ===== Hooks =====
  const { xmlText, setXmlText, root, parse } = useXmlParsing({
    initialXml: xmlContent,
    onAfterParse: (tree) => {
      setExpandAll(false);
      setCollapseVersion((v) => v + 1);
      setExpandDepth(2);
      if (autoSelectOnParse) setTimeout(() => locateFirstMatch(), 0);
      if (tree && locator && locatorResolve) {
        try {
          const n = locatorResolve(tree, locator);
          if (n) {
            setSelected(n);
            panelSync.setHighlightNode(n, {
              refresh: true,
              switchToResults: true,
            });
          }
        } catch {
          /* ignore */
        }
      }
    },
  });

  const panelSync = usePanelSync({
    autoSwitchTab: loadPrefs().autoSwitchTab !== false,
  });

  const {
    filter,
    setFilter,
    advFilter,
    setAdvFilter,
    searchOptions,
    setSearchOptions,
    matches,
    matchIndex,
    setMatchIndex,
    matchedSet,
    selectedAncestors,
    locateFirstMatch,
    goToMatch,
  } = useSearchAndMatch({
    root,
    selected,
    onSelect: (n) => setSelected(n),
    onAutoLocate: (n) => {
      panelSync.setHighlightNode(n, { refresh: true, switchToResults: true });
    },
  });

  const { xPathInput, setXPathInput, xpathTestNodes, locateXPath } =
    useXPathNavigator({
      root,
      onSelect: (n) => setSelected(n),
      onPanelSwitch: (tab) => panelSync.setPanelActivateTab(tab),
      onHighlight: (n) => panelSync.setHighlightNode(n, { refresh: true }),
      triggerPanelRefresh: () => panelSync.triggerPanelRefresh(),
    });

  const { currentStrategy, currentFields, updateStrategy, updateFields } =
    useMatchingSelection({
      onLatestMatchingChange,
      initialMatching: initialMatching
        ? { strategy: initialMatching.strategy, fields: initialMatching.fields }
        : null,
    });

  const { leftWidth, startDrag } = useResizableSplit("grid.leftWidth", 36);

  // ===== 快捷键 =====
  useGridHotkeys({
    focusSearch: () => searchRef.current?.focus(),
    nextMatch: () => goToMatch(1),
    prevMatch: () => goToMatch(-1),
    focusXPath: () => xpathRef.current?.focus(),
  });

  // ===== 初始化效果 =====
  useEffect(() => {
    const p = loadPrefs();
    setAutoSelectOnParse(p.autoSelectOnParse);
    setShowMatchedOnly(p.showMatchedOnly);
    setExpandDepth(p.expandDepth);
    setSearchOptions({
      caseSensitive: (p as any).caseSensitive ?? false,
      useRegex: (p as any).useRegex ?? false,
      fields: p.searchFields,
    });
    setSearchHistory(getSearchHistory());
    setFavSearch(getFavoriteSearches());
    setXpathHistory(getXPathHistory());
    setFavXPath(getFavoriteXPaths());
  }, []);

  useEffect(() => {
    try {
      const cached = loadLatestMatching();
      if (cached) (window as any).__latestMatching__ = cached;
    } catch {
      /* ignore */
    }
  }, []);

  // ===== 持久化首选项 =====
  useEffect(() => {
    savePrefs({
      autoSelectOnParse,
      showMatchedOnly,
      expandDepth,
      caseSensitive: searchOptions.caseSensitive,
      useRegex: searchOptions.useRegex,
      searchFields: {
        id: searchOptions.fields?.id ?? true,
        text: searchOptions.fields?.text ?? true,
        desc: searchOptions.fields?.desc ?? true,
        className: searchOptions.fields?.className ?? true,
        tag: searchOptions.fields?.tag ?? true,
        pkg: searchOptions.fields?.pkg ?? false,
      },
    });
  }, [autoSelectOnParse, showMatchedOnly, expandDepth, searchOptions]);

  return {
    // 状态
    selected,
    setSelected,
    expandAll,
    setExpandAll,
    collapseVersion,
    setCollapseVersion,
    expandDepth,
    setExpandDepth,
    showMatchedOnly,
    setShowMatchedOnly,
    autoSelectOnParse,
    setAutoSelectOnParse,
    searchHistory,
    setSearchHistory,
    favSearch,
    setFavSearch,
    xpathHistory,
    setXpathHistory,
    favXPath,
    setFavXPath,

    // Refs
    fileRef,
    searchRef,
    xpathRef,

    // XML 解析
    xmlText,
    setXmlText,
    root,
    parse,

    // 搜索与匹配
    filter,
    setFilter,
    advFilter,
    setAdvFilter,
    searchOptions,
    setSearchOptions,
    matches,
    matchIndex,
    setMatchIndex,
    matchedSet,
    selectedAncestors,
    locateFirstMatch,
    goToMatch,

    // XPath 导航
    xPathInput,
    setXPathInput,
    xpathTestNodes,
    locateXPath,

    // 匹配选择
    currentStrategy,
    currentFields,
    updateStrategy,
    updateFields,

    // 面板同步
    panelSync,

    // 布局
    leftWidth,
    startDrag,
  };
};