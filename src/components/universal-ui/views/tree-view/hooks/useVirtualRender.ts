// src/components/universal-ui/views/tree-view/hooks/useVirtualRender.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UIElementTree 虚拟渲染 Hook
 * 处理大量元素的高性能渲染优化
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ElementWithHierarchy } from '../types';

interface VirtualRenderOptions {
  containerHeight: number;
  itemHeight: number;
  overscan: number; // 预渲染的额外项目数量
}

export const useVirtualRender = (
  elements: ElementWithHierarchy[],
  options: VirtualRenderOptions
) => {
  const { containerHeight, itemHeight, overscan = 5 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 计算可见项目范围
  const visibleRange = useMemo(() => {
    const totalItems = elements.length;
    if (totalItems === 0) {
      return { start: 0, end: 0, visibleCount: 0 };
    }

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(totalItems, startIndex + visibleCount + overscan);

    return { start, end, visibleCount };
  }, [elements.length, containerHeight, itemHeight, overscan, scrollTop]);

  // 可见元素列表
  const visibleElements = useMemo(() => {
    return elements.slice(visibleRange.start, visibleRange.end);
  }, [elements, visibleRange.start, visibleRange.end]);

  // 滚动处理
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // 滚动到指定元素
  const scrollToElement = useCallback((elementId: string) => {
    const index = elements.findIndex(el => el.id === elementId);
    if (index === -1) return;

    const targetScrollTop = index * itemHeight;
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [elements, itemHeight]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, []);

  // 总高度（用于滚动条）
  const totalHeight = elements.length * itemHeight;

  // 偏移量（用于定位可见项目）
  const offsetY = visibleRange.start * itemHeight;

  // 性能统计
  const renderStats = useMemo(() => {
    return {
      totalElements: elements.length,
      visibleElements: visibleElements.length,
      renderRatio: elements.length > 0 ? (visibleElements.length / elements.length) * 100 : 0,
      scrollPercentage: totalHeight > 0 ? (scrollTop / (totalHeight - containerHeight)) * 100 : 0,
    };
  }, [elements.length, visibleElements.length, scrollTop, totalHeight, containerHeight]);

  return {
    // 渲染数据
    visibleElements,
    visibleRange,
    
    // 样式属性
    totalHeight,
    offsetY,
    
    // 事件处理
    handleScroll,
    scrollElementRef,
    
    // 操作方法
    scrollToElement,
    scrollToTop,
    
    // 统计信息
    renderStats,
  };
};