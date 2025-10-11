// src/components/universal-ui/element-selection/element-discovery/hooks/useElementVisualization.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useMemo, useState, useCallback } from 'react';
import type { UIElement } from '../../../../../api/universal-ui';
import { BoundaryDetector } from '../utils/boundaryDetector';
import { ElementAnalyzer } from '../services/elementAnalyzer';

/**
 * 元素可视化相关状态和操作的 Hook
 * 专注于元素的可视化分析、边界检测和空间关系计算
 */
export const useElementVisualization = (targetElement: UIElement, allElements: UIElement[]) => {
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);
  const [visualizationMode, setVisualizationMode] = useState<'normal' | 'boundaries' | 'overlaps' | 'relationships'>('normal');

  // 计算目标元素的可视化边界
  const targetBounds = useMemo(() => {
    return BoundaryDetector.normalizeBounds(targetElement.bounds);
  }, [targetElement]);

  // 分析所有元素的可视化特征
  const elementsAnalysis = useMemo(() => {
    return allElements.map(element => {
      const analysis = ElementAnalyzer.analyzeElementFeatures(element);
      const bounds = BoundaryDetector.normalizeBounds(element.bounds);
      
      return {
        id: element.id,
        element,
        analysis,
        bounds,
        area: analysis.area,
        isOverlapping: targetBounds && bounds ? BoundaryDetector.hasOverlap(element, targetElement) : false,
        distance: targetBounds && bounds ? BoundaryDetector.calculateDistance(element, targetElement) : Infinity,
        relativePosition: targetBounds && bounds ? BoundaryDetector.analyzeRelativePosition(element, targetElement) : null
      };
    });
  }, [allElements, targetElement, targetBounds]);

  // 查找重叠的元素
  const overlappingElements = useMemo(() => {
    return elementsAnalysis
      .filter(item => item.isOverlapping && item.id !== targetElement.id)
      .sort((a, b) => a.area - b.area); // 按面积排序，小的在前
  }, [elementsAnalysis, targetElement.id]);

  // 查找包含关系
  const containmentRelations = useMemo(() => {
    const relations: {
      parent: UIElement;
      children: UIElement[];
    }[] = [];
    
    const processedParents = new Set<string>();
    
    allElements.forEach(potentialParent => {
      if (processedParents.has(potentialParent.id)) return;
      
      const children = allElements.filter(child => 
        child.id !== potentialParent.id && 
        BoundaryDetector.isElementContainedIn(child, potentialParent)
      );
      
      if (children.length > 0) {
        relations.push({
          parent: potentialParent,
          children
        });
        processedParents.add(potentialParent.id);
      }
    });
    
    return relations;
  }, [allElements]);

  // 按距离排序的邻近元素
  const nearbyElements = useMemo(() => {
    return elementsAnalysis
      .filter(item => item.id !== targetElement.id && item.distance < Infinity)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // 只取最近的10个元素
  }, [elementsAnalysis, targetElement.id]);

  // 按方向分组的元素
  const elementsByDirection = useMemo(() => {
    const groups: Record<string, UIElement[]> = {
      left: [],
      right: [],
      above: [],
      below: [],
      inside: [],
      overlapping: []
    };
    
    elementsAnalysis.forEach(item => {
      if (item.id === targetElement.id) return;
      
      const direction = item.relativePosition?.direction || 'unknown';
      if (groups[direction]) {
        groups[direction].push(item.element);
      }
    });
    
    return groups;
  }, [elementsAnalysis, targetElement.id]);

  // 计算整体可视化边界
  const overallBounds = useMemo(() => {
    return BoundaryDetector.calculateVisualBounds(allElements);
  }, [allElements]);

  // 高亮指定元素
  const highlightElements = useCallback((elementIds: string[]) => {
    setHighlightedElements(elementIds);
  }, []);

  // 高亮重叠元素
  const highlightOverlappingElements = useCallback(() => {
    const ids = overlappingElements.map(item => item.id);
    setHighlightedElements(ids);
  }, [overlappingElements]);

  // 高亮邻近元素
  const highlightNearbyElements = useCallback((count = 5) => {
    const ids = nearbyElements.slice(0, count).map(item => item.id);
    setHighlightedElements(ids);
  }, [nearbyElements]);

  // 高亮指定方向的元素
  const highlightElementsByDirection = useCallback((direction: keyof typeof elementsByDirection) => {
    const elements = elementsByDirection[direction];
    if (elements) {
      const ids = elements.map(el => el.id);
      setHighlightedElements(ids);
    }
  }, [elementsByDirection]);

  // 清除高亮
  const clearHighlight = useCallback(() => {
    setHighlightedElements([]);
  }, []);

  // 查找相似元素
  const findSimilarElements = useCallback((threshold = 0.7) => {
    const similar = allElements.filter(element => {
      if (element.id === targetElement.id) return false;
      const similarity = ElementAnalyzer.calculateSimilarity(targetElement, element);
      return similarity >= threshold;
    });
    
    return similar.sort((a, b) => {
      const similarityA = ElementAnalyzer.calculateSimilarity(targetElement, a);
      const similarityB = ElementAnalyzer.calculateSimilarity(targetElement, b);
      return similarityB - similarityA;
    });
  }, [allElements, targetElement]);

  // 高亮相似元素
  const highlightSimilarElements = useCallback((threshold = 0.7) => {
    const similar = findSimilarElements(threshold);
    const ids = similar.map(el => el.id);
    setHighlightedElements(ids);
  }, [findSimilarElements]);

  // 获取可视化统计信息
  const visualizationStats = useMemo(() => {
    return {
      totalElements: allElements.length,
      overlappingCount: overlappingElements.length,
      containmentRelations: containmentRelations.length,
      hiddenElements: elementsAnalysis.filter(item => item.analysis.isHidden).length,
      clickableElements: elementsAnalysis.filter(item => item.analysis.isClickable).length,
      textElements: elementsAnalysis.filter(item => item.analysis.hasText).length,
      averageDistance: nearbyElements.length > 0 
        ? nearbyElements.reduce((sum, item) => sum + item.distance, 0) / nearbyElements.length 
        : 0,
      overallBounds
    };
  }, [allElements.length, overlappingElements.length, containmentRelations.length, 
      elementsAnalysis, nearbyElements, overallBounds]);

  // 检测潜在的布局问题
  const layoutIssues = useMemo(() => {
    const issues: string[] = [];
    
    // 检查重叠过多
    if (overlappingElements.length > 5) {
      issues.push(`检测到 ${overlappingElements.length} 个重叠元素，可能存在布局问题`);
    }
    
    // 检查零边界元素过多
    const zeroBoundsCount = elementsAnalysis.filter(item => 
      item.bounds && BoundaryDetector.isZeroBounds(item.bounds)
    ).length;
    
    if (zeroBoundsCount > allElements.length * 0.3) {
      issues.push(`${zeroBoundsCount} 个元素具有零边界，可能是隐藏或未渲染的元素`);
    }
    
    // 检查孤立的可点击元素
    const isolatedClickable = elementsAnalysis.filter(item => 
      item.analysis.isClickable && item.distance > 200
    ).length;
    
    if (isolatedClickable > 0) {
      issues.push(`${isolatedClickable} 个可点击元素距离目标元素较远`);
    }
    
    return issues;
  }, [overlappingElements.length, elementsAnalysis, allElements.length]);

  return {
    // 核心数据
    targetBounds,
    elementsAnalysis,
    overallBounds,
    
    // 分析结果
    overlappingElements,
    containmentRelations,
    nearbyElements,
    elementsByDirection,
    
    // 可视化状态
    highlightedElements,
    visualizationMode,
    
    // 操作方法
    highlightElements,
    highlightOverlappingElements,
    highlightNearbyElements,
    highlightElementsByDirection,
    highlightSimilarElements,
    clearHighlight,
    setVisualizationMode,
    
    // 分析工具
    findSimilarElements,
    
    // 统计信息
    visualizationStats,
    layoutIssues,
    
    // 状态标志
    hasOverlaps: overlappingElements.length > 0,
    hasContainment: containmentRelations.length > 0,
    hasHighlight: highlightedElements.length > 0,
    hasLayoutIssues: layoutIssues.length > 0
  };
};