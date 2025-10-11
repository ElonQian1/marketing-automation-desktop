// src/components/universal-ui/views/tree-view/hooks/useTreeState.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UIElementTree 状态管理 Hook
 * 管理树形视图的状态、过滤和选择逻辑
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ElementWithHierarchy, FilterOptions, UITreeNode, FILTER_OPTIONS } from '../types';
import { buildTreeStructure, getTreeStats } from '../utils/treeBuilder';
import { filterElements, getFilterStats, resetFilters } from '../utils/filterUtils';

interface TreeStateProps {
  elements: ElementWithHierarchy[];
  onElementSelect: (elements: ElementWithHierarchy[]) => void;
}

export const useTreeState = (props: TreeStateProps) => {
  const { elements: rawElements, onElementSelect } = props;

  // 基础状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(resetFilters());
  const [selectedElements, setSelectedElements] = useState<ElementWithHierarchy[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 构建树形结构
  const treeElements = useMemo(() => {
    if (!rawElements || rawElements.length === 0) return [];
    
    console.log('🔄 重新构建树形结构...');
    return buildTreeStructure(rawElements);
  }, [rawElements]);

  // 应用过滤器
  const filteredElements = useMemo(() => {
    return filterElements(treeElements, filterOptions, searchTerm);
  }, [treeElements, filterOptions, searchTerm]);

  // 统计信息
  const treeStats = useMemo(() => getTreeStats(treeElements), [treeElements]);
  const filterStats = useMemo(() => 
    getFilterStats(treeElements, filteredElements), 
    [treeElements, filteredElements]
  );

  // 选择元素
  const handleElementSelect = useCallback((element: ElementWithHierarchy) => {
    const isSelected = selectedElements.some(sel => sel.id === element.id);
    
    let newSelection: ElementWithHierarchy[];
    if (isSelected) {
      // 取消选择
      newSelection = selectedElements.filter(sel => sel.id !== element.id);
    } else {
      // 添加选择
      newSelection = [...selectedElements, element];
    }
    
    setSelectedElements(newSelection);
    onElementSelect(newSelection);
  }, [selectedElements, onElementSelect]);

  // 批量选择/取消选择
  const selectAll = useCallback(() => {
    setSelectedElements([...filteredElements]);
    onElementSelect(filteredElements);
  }, [filteredElements, onElementSelect]);

  const clearSelection = useCallback(() => {
    setSelectedElements([]);
    onElementSelect([]);
  }, [onElementSelect]);

  // 节点展开/折叠
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allNodeIds = treeElements.map(el => el.id);
    setExpandedNodes(new Set(allNodeIds));
  }, [treeElements]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // 应用快速过滤
  const applyQuickFilter = useCallback((filterName: keyof typeof FILTER_OPTIONS) => {
    setFilterOptions(FILTER_OPTIONS[filterName]);
  }, []);

  // 重置过滤器
  const resetAllFilters = useCallback(() => {
    setFilterOptions(resetFilters());
    setSearchTerm('');
  }, []);

  // 当原始元素变化时，清除选择和搜索
  useEffect(() => {
    clearSelection();
    setSearchTerm('');
  }, [rawElements, clearSelection]);

  return {
    // 数据
    treeElements,
    filteredElements,
    selectedElements,
    
    // 状态
    searchTerm,
    filterOptions,
    expandedNodes,
    
    // 统计
    treeStats,
    filterStats,
    
    // 操作
    setSearchTerm,
    setFilterOptions,
    handleElementSelect,
    selectAll,
    clearSelection,
    toggleNode,
    expandAll,
    collapseAll,
    applyQuickFilter,
    resetAllFilters,
    
    // 辅助方法
    isSelected: (elementId: string) => selectedElements.some(el => el.id === elementId),
    isExpanded: (nodeId: string) => expandedNodes.has(nodeId),
  };
};