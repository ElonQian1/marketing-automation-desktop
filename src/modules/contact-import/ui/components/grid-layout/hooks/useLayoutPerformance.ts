// src/modules/contact-import/ui/components/grid-layout/hooks/useLayoutPerformance.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Layout } from 'react-grid-layout';

export interface UseLayoutPerformanceOptions {
  enableVirtualization?: boolean;
  lazyLoadThreshold?: number;
  debounceMs?: number;
  memoryCleanupInterval?: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  panelCount: number;
  visiblePanelCount: number;
  lastUpdateTime: string;
}

export function useLayoutPerformance({
  enableVirtualization = false,
  lazyLoadThreshold = 10,
  debounceMs = 100,
  memoryCleanupInterval = 30000 // 30秒
}: UseLayoutPerformanceOptions = {}) {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    panelCount: 0,
    visiblePanelCount: 0,
    lastUpdateTime: new Date().toISOString()
  });
  const [layoutCache, setLayoutCache] = useState<Map<string, Layout[]>>(new Map());

  // 性能监控
  const startPerformanceTimer = useCallback(() => {
    return performance.now();
  }, []);

  const endPerformanceTimer = useCallback((startTime: number, panelCount: number, visibleCount: number) => {
    const renderTime = performance.now() - startTime;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      panelCount,
      visiblePanelCount: visibleCount,
      lastUpdateTime: new Date().toISOString(),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }));
  }, []);

  // 布局缓存管理
  const cacheLayout = useCallback((key: string, layout: Layout[]) => {
    if (performanceMode) {
      setLayoutCache(prev => {
        const newCache = new Map(prev);
        newCache.set(key, [...layout]);
        
        // 限制缓存大小
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        
        return newCache;
      });
    }
  }, [performanceMode]);

  const getCachedLayout = useCallback((key: string): Layout[] | null => {
    return performanceMode ? layoutCache.get(key) || null : null;
  }, [performanceMode, layoutCache]);

  // 防抖布局更新
  const debouncedLayoutUpdate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (callback: () => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, debounceMs);
    };
  }, [debounceMs]);

  // 虚拟化面板过滤
  const getVisiblePanels = useCallback((
    panels: any[], 
    viewportBounds?: { top: number; bottom: number; left: number; right: number }
  ) => {
    if (!enableVirtualization || !performanceMode || !viewportBounds) {
      return panels;
    }

    // 简单的视口相交检测
    return panels.filter(panel => {
      if (!panel.bounds) return true;
      
      const panelTop = panel.bounds.top;
      const panelBottom = panel.bounds.top + panel.bounds.height;
      const panelLeft = panel.bounds.left;
      const panelRight = panel.bounds.left + panel.bounds.width;
      
      return !(
        panelBottom < viewportBounds.top ||
        panelTop > viewportBounds.bottom ||
        panelRight < viewportBounds.left ||
        panelLeft > viewportBounds.right
      );
    });
  }, [enableVirtualization, performanceMode]);

  // 懒加载检查
  const shouldLazyLoad = useCallback((panelCount: number) => {
    return performanceMode && panelCount > lazyLoadThreshold;
  }, [performanceMode, lazyLoadThreshold]);

  // 内存清理
  useEffect(() => {
    if (!performanceMode) return;

    const cleanupInterval = setInterval(() => {
      // 清理过期的布局缓存
      setLayoutCache(prev => {
        const cutoffTime = Date.now() - memoryCleanupInterval;
        const newCache = new Map();
        
        for (const [key, value] of prev.entries()) {
          // 简单的时间戳检查（这里需要更复杂的实现）
          newCache.set(key, value);
        }
        
        return newCache;
      });

      // 强制垃圾回收（如果可用）
      if ((window as any).gc) {
        (window as any).gc();
      }
    }, memoryCleanupInterval);

    return () => clearInterval(cleanupInterval);
  }, [performanceMode, memoryCleanupInterval]);

  // 性能建议
  const getPerformanceSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (metrics.panelCount > 20) {
      suggestions.push('考虑启用虚拟化渲染以提高性能');
    }
    
    if (metrics.renderTime > 100) {
      suggestions.push('渲染时间较长，建议减少面板数量或启用性能模式');
    }
    
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      suggestions.push('内存使用较高，建议定期清理缓存');
    }
    
    if (metrics.visiblePanelCount / metrics.panelCount < 0.5) {
      suggestions.push('大量面板被隐藏，建议使用懒加载');
    }
    
    return suggestions;
  }, [metrics]);

  // 清理缓存
  const clearCache = useCallback(() => {
    setLayoutCache(new Map());
  }, []);

  // 切换性能模式
  const togglePerformanceMode = useCallback((enabled?: boolean) => {
    const newMode = enabled !== undefined ? enabled : !performanceMode;
    setPerformanceMode(newMode);
    
    if (!newMode) {
      clearCache();
    }
  }, [performanceMode, clearCache]);

  return {
    // 状态
    performanceMode,
    metrics,
    
    // 性能控制
    togglePerformanceMode,
    startPerformanceTimer,
    endPerformanceTimer,
    
    // 缓存管理
    cacheLayout,
    getCachedLayout,
    clearCache,
    
    // 优化功能
    debouncedLayoutUpdate,
    getVisiblePanels,
    shouldLazyLoad,
    
    // 性能分析
    getPerformanceSuggestions,
    
    // 工具函数
    isHighPerformance: performanceMode && enableVirtualization,
    cacheSize: layoutCache.size
  };
}