// src/components/ui/VirtualizedPageList.tsx
// module: ui | layer: component | role: virtualized-list
// summary: 虚拟滚动页面列表组件，优化大量缓存页面渲染性能

import React, { useState, useCallback, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { CachedPageInfo } from '../../services/xml-page-cache-service';
import { xmlCachePerformanceMonitor } from '../../services/xml-cache-performance-monitor';

interface VirtualizedPageListProps {
  pages: CachedPageInfo[];
  onPageSelect: (page: CachedPageInfo) => void;
  itemHeight?: number;
  className?: string;
}

interface VirtualPageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    pages: CachedPageInfo[];
    onPageSelect: (page: CachedPageInfo) => void;
    visibleRange: { start: number; end: number };
  };
}

/**
 * 虚拟化页面项组件
 */
const VirtualPageItem: React.FC<VirtualPageItemProps> = React.memo(({ 
  index, 
  style, 
  data 
}) => {
  const { pages, onPageSelect, visibleRange } = data;
  const page = pages[index];
  
  // 判断是否在可见范围内，决定是否懒加载
  const isVisible = index >= visibleRange.start && index <= visibleRange.end;
  const shouldLazyLoad = Math.abs(index - visibleRange.start) > 5; // 超出5个位置懒加载

  const handleClick = useCallback(() => {
    const startTime = performance.now();
    onPageSelect(page);
    
    // 记录用户交互性能
    const interactionTime = performance.now() - startTime;
    console.log(`📊 [VirtualList] 页面选择交互时间: ${interactionTime.toFixed(2)}ms`);
  }, [page, onPageSelect]);

  if (!page) {
    return (
      <div style={style} className="p-4">
        <div className="animate-pulse bg-gray-200 rounded h-20"></div>
      </div>
    );
  }

  return (
    <div style={style} className="p-2">
      <div 
        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={handleClick}
      >
        <div className="flex items-center space-x-3">
          {/* 缩略图区域 */}
          <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
            {!shouldLazyLoad && page.screenshotPath ? (
              <OptimizedThumbnail 
                imagePath={page.screenshotPath}
                alt={`Page ${page.id}`}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">📱</span>
              </div>
            )}
          </div>

          {/* 页面信息 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              设备: {page.deviceId}
            </div>
            <div className="text-xs text-gray-500">
              {page.timestamp.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {page.xmlPath ? '✅ XML' : '❌ 无XML'} | 
              {page.screenshotPath ? '✅ 截图' : '❌ 无截图'}
            </div>
          </div>

          {/* 性能指标 */}
          <div className="text-xs text-right">
            {!shouldLazyLoad && (
              <LoadingMetrics pageId={page.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualPageItem.displayName = 'VirtualPageItem';

/**
 * 优化的缩略图组件
 */
const OptimizedThumbnail: React.FC<{
  imagePath: string;
  alt: string;
  className: string;
}> = React.memo(({ imagePath, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    xmlCachePerformanceMonitor.recordCacheLoad(Date.now() - 50, 'memory'); // 估算快速加载
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError(true);
    xmlCachePerformanceMonitor.recordCacheLoad(Date.now() - 100, 'miss');
  }, []);

  if (error) {
    return (
      <div className={`${className} bg-red-100 flex items-center justify-center`}>
        <span className="text-red-400 text-xs">❌</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} absolute inset-0 bg-gray-200 animate-pulse`} />
      )}
      <img 
        src={imagePath}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: isLoading ? 0 : 1 }}
      />
    </div>
  );
});

OptimizedThumbnail.displayName = 'OptimizedThumbnail';

/**
 * 加载性能指标显示
 */
const LoadingMetrics: React.FC<{ pageId: string }> = React.memo(({ pageId }) => {
  const performanceSummary = xmlCachePerformanceMonitor.getPerformanceSummary();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="text-xs">
      <div className={getStatusColor(performanceSummary.status)}>
        {performanceSummary.status === 'excellent' && '⚡'}
        {performanceSummary.status === 'good' && '✅'}
        {performanceSummary.status === 'fair' && '⚠️'}
        {performanceSummary.status === 'poor' && '🐌'}
      </div>
    </div>
  );
});

LoadingMetrics.displayName = 'LoadingMetrics';

/**
 * 虚拟化页面列表主组件
 */
export const VirtualizedPageList: React.FC<VirtualizedPageListProps> = ({
  pages,
  onPageSelect,
  itemHeight = 80,
  className = ''
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // 缓存数据对象，避免重复渲染
  const listData = useMemo(() => ({
    pages,
    onPageSelect,
    visibleRange
  }), [pages, onPageSelect, visibleRange]);

  // 动态计算项高度
  const getItemSize = useCallback((index: number) => {
    return itemHeight;
  }, [itemHeight]);

  // 可见范围变化回调
  const handleItemsRendered = useCallback(({
    visibleStartIndex,
    visibleStopIndex
  }: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    setVisibleRange({
      start: Math.max(0, visibleStartIndex - 2), // 预加载前2个
      end: Math.min(pages.length - 1, visibleStopIndex + 2) // 预加载后2个
    });

    // 记录虚拟滚动性能
    console.log(`📋 [VirtualList] 可见范围: ${visibleStartIndex}-${visibleStopIndex}, 总计: ${pages.length}`);
  }, [pages.length]);

  // 性能监控检查
  React.useEffect(() => {
    xmlCachePerformanceMonitor.checkPerformanceAndNotify();
  }, []);

  if (pages.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📱</div>
          <p>暂无缓存页面</p>
          <p className="text-sm mt-1">执行页面分析后将显示历史记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* 性能状态条 */}
      <div className="mb-2 px-2">
        <PerformanceStatusBar />
      </div>

      {/* 虚拟滚动列表 */}
      <List
        height={600}
        itemCount={pages.length}
        itemSize={getItemSize}
        itemData={listData}
        onItemsRendered={handleItemsRendered}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        overscanCount={3} // 预渲染3个项目，提升滚动性能
      >
        {VirtualPageItem}
      </List>

      {/* 列表统计信息 */}
      <div className="mt-2 px-2 text-xs text-gray-500 text-center">
        显示 {Math.min(visibleRange.end - visibleRange.start + 1, pages.length)} / {pages.length} 页面
        （虚拟滚动优化）
      </div>
    </div>
  );
};

/**
 * 性能状态条组件
 */
const PerformanceStatusBar: React.FC = React.memo(() => {
  const [performanceSummary, setPerformanceSummary] = useState(
    xmlCachePerformanceMonitor.getPerformanceSummary()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceSummary(xmlCachePerformanceMonitor.getPerformanceSummary());
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return '⚡';
      case 'good': return '✅';
      case 'fair': return '⚠️';
      case 'poor': return '🐌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`px-3 py-2 rounded-lg border text-sm ${getStatusColor(performanceSummary.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>{getStatusIcon(performanceSummary.status)}</span>
          <span className="font-medium">{performanceSummary.message}</span>
        </div>
        <div className="text-xs opacity-75">
          {performanceSummary.details}
        </div>
      </div>
    </div>
  );
});

PerformanceStatusBar.displayName = 'PerformanceStatusBar';

export default VirtualizedPageList;