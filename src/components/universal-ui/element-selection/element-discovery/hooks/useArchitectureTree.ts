// src/components/universal-ui/element-selection/element-discovery/hooks/useArchitectureTree.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useMemo, useState, useCallback } from 'react';
import type { UIElement } from '../../../../../api/universal-ui';
import { HierarchyBuilder } from '../services/hierarchyBuilder';
import { PureXmlStructureAnalyzer } from '../services/PureXmlStructureAnalyzer'; // 🆕 新增纯XML分析器
import { LocalArchitectureAnalyzer } from '../services/LocalArchitectureAnalyzer'; // 🆕 新增局部架构分析器
import type { HierarchyNode } from '../../../../../types/hierarchy';
import { ElementAnalyzer } from '../services/elementAnalyzer';

/**
 * 架构树相关状态和操作的 Hook
 * 专注于层级树的构建、管理和节点操作
 * 🆕 已集成纯XML结构分析器用于元素发现模式
 * 🆕 新增交互式节点支持
 */
export const useArchitectureTree = (
  targetElement: UIElement, 
  allElements: UIElement[],
  xmlContent?: string, // 🆕 新增XML内容参数
  interactiveMode: boolean = false // 🆕 新增交互模式开关
) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 🆕 交互式回调函数状态
  const [interactiveCallbacks, setInteractiveCallbacksState] = useState<{
    onSwitchToElement?: (element: UIElement) => void;
    onViewDetails?: (element: UIElement) => void;
    onHighlightElement?: (element: UIElement) => void;
    onCopyElementInfo?: (element: UIElement) => void;
    onShowBounds?: (element: UIElement) => void;
  }>({});

  // 构建层级树（使用 useMemo 缓存）
  const hierarchyTree = useMemo(() => {
    console.log('🔄 useArchitectureTree: 重新构建层级树');
    
    // 🆕 如果有XML内容，优先使用局部架构分析器（专为元素发现设计）
    if (xmlContent) {
      console.log('🎯 使用局部架构分析器构建目标元素周围的层级树');
      const localResult = LocalArchitectureAnalyzer.buildLocalArchitecture(xmlContent, allElements, targetElement);
      
      // 转换为HierarchyNode数组格式
      const hierarchyNodes: HierarchyNode[] = localResult.localRoot ? [localResult.localRoot] : [];
      
      console.log('✅ 局部架构分析完成:', {
        totalNodes: localResult.stats.totalNodes,
        targetDepth: localResult.stats.targetDepth,
        siblingCount: localResult.stats.siblingCount,
        childrenCount: localResult.stats.childrenCount,
        maxDepth: localResult.maxDepth
      });
      
      return hierarchyNodes;
    } else {
      // 🔄 回退到传统分析器（可视化模式）
      console.log('🔄 回退到传统边界检查分析器');
      return HierarchyBuilder.buildHierarchyTree(allElements, targetElement);
    }
  }, [allElements, targetElement, xmlContent]);

  // 转换为 Tree 组件数据格式
  const treeData = useMemo(() => {
    if (interactiveMode) {
      // 🆕 使用交互式节点数据格式
      return HierarchyBuilder.convertToInteractiveTreeData(
        hierarchyTree, 
        targetElement.id,
        interactiveCallbacks
      );
    } else {
      // 传统的字符串标题格式
      return HierarchyBuilder.convertToTreeData(hierarchyTree);
    }
  }, [hierarchyTree, interactiveMode, targetElement.id, interactiveCallbacks]);

  // 获取默认展开的键
  const defaultExpandedKeys = useMemo(() => {
    return HierarchyBuilder.getDefaultExpandedKeys(hierarchyTree, targetElement.id);
  }, [hierarchyTree, targetElement.id]);

  // 获取树统计信息
  const treeStatistics = useMemo(() => {
    return HierarchyBuilder.getTreeStatistics(hierarchyTree);
  }, [hierarchyTree]);

  // 验证树结构
  const treeValidation = useMemo(() => {
    return HierarchyBuilder.validateTree(hierarchyTree);
  }, [hierarchyTree]);

  // 处理节点选择
  const handleNodeSelect = useCallback((selectedKeys: string[]) => {
    if (selectedKeys.length > 0) {
      setSelectedNode(selectedKeys[0]);
      console.log('🎯 useArchitectureTree: 选中节点:', selectedKeys[0]);
    }
  }, []);

  // 处理节点展开/收起
  const handleNodeExpand = useCallback((expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys);
    console.log('🌳 useArchitectureTree: 展开节点:', expandedKeys.length);
  }, []);

  // 查找节点
  const findNode = useCallback((nodeId: string): HierarchyNode | null => {
    return HierarchyBuilder.findNode(hierarchyTree, nodeId);
  }, [hierarchyTree]);

  // 查找最近的可点击祖先
  const findNearestClickableAncestor = useCallback((nodeId: string): UIElement | null => {
    for (const rootNode of hierarchyTree) {
      const result = ElementAnalyzer.findNearestClickableAncestor(rootNode, nodeId);
      if (result) {
        return result;
      }
    }
    return null;
  }, [hierarchyTree]);

  // 获取选中节点的信息
  const selectedNodeInfo = useMemo(() => {
    if (!selectedNode) return null;
    
    const node = findNode(selectedNode);
    if (!node) return null;
    
    const report = ElementAnalyzer.generateElementReport(node.element);
    
    return {
      node,
      element: node.element,
      report,
      nearestClickable: findNearestClickableAncestor(selectedNode)
    };
  }, [selectedNode, findNode, findNearestClickableAncestor]);

  // 重置选择状态
  const resetSelection = useCallback(() => {
    setSelectedNode(null);
    setExpandedKeys(defaultExpandedKeys);
  }, [defaultExpandedKeys]);

  // 展开到目标元素
  const expandToTarget = useCallback(() => {
    setExpandedKeys(defaultExpandedKeys);
    setSelectedNode(targetElement.id);
  }, [defaultExpandedKeys, targetElement.id]);

  // 展开所有节点
  const expandAll = useCallback(() => {
    const allKeys: string[] = [];
    
    const collectKeys = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        allKeys.push(node.id);
        collectKeys(node.children);
      });
    };
    
    collectKeys(hierarchyTree);
    setExpandedKeys(allKeys);
  }, [hierarchyTree]);

  // 收起所有节点
  const collapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  // 获取节点路径（从根到指定节点）
  const getNodePath = useCallback((nodeId: string): HierarchyNode[] => {
    const path: HierarchyNode[] = [];
    
    const findPath = (nodes: HierarchyNode[]): boolean => {
      for (const node of nodes) {
        path.push(node);
        
        if (node.id === nodeId) {
          return true;
        }
        
        if (findPath(node.children)) {
          return true;
        }
        
        path.pop();
      }
      return false;
    };
    
    findPath(hierarchyTree);
    return path;
  }, [hierarchyTree]);

  // 🆕 设置交互式回调函数
  const setInteractiveCallbacks = useCallback((callbacks: typeof interactiveCallbacks) => {
    setInteractiveCallbacksState(callbacks);
  }, []);

  return {
    // 核心数据
    hierarchyTree,
    treeData,
    
    // 选择状态
    selectedNode,
    selectedNodeInfo,
    expandedKeys,
    
    // 事件处理
    handleNodeSelect,
    handleNodeExpand,
    
    // 工具方法
    findNode,
    findNearestClickableAncestor,
    getNodePath,
    
    // 操作方法
    resetSelection,
    expandToTarget,
    expandAll,
    collapseAll,
    
    // 🆕 交互式功能
    setInteractiveCallbacks,
    interactiveMode,
    
    // 统计和验证
    treeStatistics,
    treeValidation,
    defaultExpandedKeys,
    
    // 状态标志
    isTreeValid: treeValidation.isValid,
    hasSelection: selectedNode !== null,
    isEmpty: hierarchyTree.length === 0
  };
};