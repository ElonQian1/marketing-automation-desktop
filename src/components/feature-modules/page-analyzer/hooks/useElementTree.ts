import { useState, useCallback, useMemo } from 'react';
import type { 
  UIElement, 
  ElementTreeNode 
} from '../types';

/**
 * 元素树状结构管理Hook
 * 负责将平铺的元素列表转换为树状结构，并提供展开/折叠功能
 * 文件大小: ~150行
 */
export const useElementTree = (elements: UIElement[]) => {
  // 展开状态管理
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 构建树状结构
  const treeNodes = useMemo(() => {
    if (!elements.length) return [];

    // 创建元素映射
    const elementMap = new Map<string, UIElement>();
    elements.forEach(element => {
      elementMap.set(element.id, element);
    });

    // 找到根节点（没有父节点的元素）
    const rootElements = elements.filter(element => !element.parentId);

    // 递归构建树
    const buildTree = (element: UIElement, depth: number = 0): ElementTreeNode => {
      const children = element.childrenIds
        .map(childId => elementMap.get(childId))
        .filter((child): child is UIElement => !!child)
        .map(child => buildTree(child, depth + 1));

      return {
        element,
        children,
        expanded: expandedNodes.has(element.id),
        depth,
        visible: true, // 这里可以根据搜索条件等设置可见性
      };
    };

    return rootElements.map(root => buildTree(root));
  }, [elements, expandedNodes]);

  // 展开/折叠节点
  const toggleNodeExpansion = useCallback((nodeId: string) => {
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

  // 展开所有节点
  const expandAll = useCallback(() => {
    const allNodeIds = new Set(elements.map(element => element.id));
    setExpandedNodes(allNodeIds);
  }, [elements]);

  // 折叠所有节点
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // 选择节点
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // 根据路径展开到指定节点
  const expandToNode = useCallback((targetNodeId: string) => {
    const targetElement = elements.find(e => e.id === targetNodeId);
    if (!targetElement) return;

    const pathToRoot: string[] = [];
    let currentElement = targetElement;

    // 向上追溯到根节点
    while (currentElement) {
      pathToRoot.unshift(currentElement.id);
      if (currentElement.parentId) {
        currentElement = elements.find(e => e.id === currentElement.parentId)!;
      } else {
        break;
      }
    }

    // 展开路径上的所有节点
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      pathToRoot.forEach(nodeId => newSet.add(nodeId));
      return newSet;
    });

    // 选择目标节点
    setSelectedNodeId(targetNodeId);
  }, [elements]);

  // 平铺所有可见节点（用于渲染）
  const flattenedNodes = useMemo(() => {
    const flattened: ElementTreeNode[] = [];

    const traverse = (nodes: ElementTreeNode[]) => {
      nodes.forEach(node => {
        if (node.visible) {
          flattened.push(node);
          if (node.expanded && node.children.length > 0) {
            traverse(node.children);
          }
        }
      });
    };

    traverse(treeNodes);
    return flattened;
  }, [treeNodes]);

  // 计算树状结构统计信息
  const treeStatistics = useMemo(() => {
    const countNodes = (nodes: ElementTreeNode[]): number => {
      return nodes.reduce((count, node) => {
        return count + 1 + countNodes(node.children);
      }, 0);
    };

    const countExpandedNodes = (nodes: ElementTreeNode[]): number => {
      return nodes.reduce((count, node) => {
        const current = node.expanded ? 1 : 0;
        return count + current + countExpandedNodes(node.children);
      }, 0);
    };

    const maxDepth = Math.max(0, ...flattenedNodes.map(node => node.depth));

    return {
      totalNodes: countNodes(treeNodes),
      expandedNodes: countExpandedNodes(treeNodes),
      maxDepth,
      rootNodes: treeNodes.length,
      visibleNodes: flattenedNodes.length,
    };
  }, [treeNodes, flattenedNodes]);

  // 搜索并高亮节点
  const searchInTree = useCallback((keyword: string) => {
    if (!keyword.trim()) {
      // 重置所有节点可见性
      return treeNodes;
    }

    const searchLower = keyword.toLowerCase();
    
    // 递归搜索并设置可见性
    const searchNodes = (nodes: ElementTreeNode[]): ElementTreeNode[] => {
      return nodes.map(node => {
        const element = node.element;
        const matchesSearch = 
          element.text.toLowerCase().includes(searchLower) ||
          element.resourceId.toLowerCase().includes(searchLower) ||
          element.contentDesc.toLowerCase().includes(searchLower) ||
          element.className.toLowerCase().includes(searchLower);

        const searchedChildren = searchNodes(node.children);
        const hasMatchingChildren = searchedChildren.some(child => child.visible);

        return {
          ...node,
          children: searchedChildren,
          visible: matchesSearch || hasMatchingChildren,
        };
      });
    };

    return searchNodes(treeNodes);
  }, [treeNodes]);

  return {
    // 数据
    treeNodes,
    flattenedNodes,
    selectedNodeId,
    treeStatistics,
    
    // 操作方法
    toggleNodeExpansion,
    expandAll,
    collapseAll,
    selectNode,
    expandToNode,
    searchInTree,
  };
};