// src/modules/structural-matching/ui/hooks/use-structural-matching-data.ts
// module: structural-matching | layer: ui | role: 数据统一Hook
// summary: 结构匹配统一数据访问Hook

import { useState, useEffect, useCallback } from 'react';
import { StructuralMatchingDataProvider, type UnifiedElementData } from '../../domain/services/structural-matching-data-provider';

/**
 * Hook配置接口
 */
export interface UseStructuralMatchingDataConfig {
  // 自动获取数据
  autoFetch?: boolean;
  
  // 数据源配置
  enableValidation?: boolean;
  enableEnhancement?: boolean;
  enableCaching?: boolean;
  
  // 错误处理
  onError?: (error: Error) => void;
  onSuccess?: (data: UnifiedElementData) => void;
}

/**
 * Hook返回接口
 */
export interface UseStructuralMatchingDataResult {
  // 数据状态
  data: UnifiedElementData | null;
  loading: boolean;
  error: Error | null;
  
  // 操作方法
  fetchData: (
    elementId: string,
    xmlCacheId?: string,
    fallbackSources?: {
      stepCard?: Record<string, unknown>;
      selectionContext?: Record<string, unknown>;
    }
  ) => Promise<void>;
  
  refresh: () => Promise<void>;
  clearData: () => void;
  
  // 调试信息
  debugInfo: ReturnType<typeof StructuralMatchingDataProvider.prototype.getDebugInfo> | null;
  getDebugInfo: () => void;
}

/**
 * 结构匹配统一数据Hook
 * 
 * 使用示例：
 * ```tsx
 * const { data, loading, error, fetchData } = useStructuralMatchingData({
 *   autoFetch: true,
 *   onError: (error) => console.error('数据获取失败:', error)
 * });
 * 
 * // 获取数据
 * await fetchData('element_12', 'cache_id', { stepCard: cardData });
 * ```
 */
export const useStructuralMatchingData = (
  config: UseStructuralMatchingDataConfig = {}
): UseStructuralMatchingDataResult => {
  const [data, setData] = useState<UnifiedElementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<ReturnType<typeof StructuralMatchingDataProvider.prototype.getDebugInfo> | null>(null);
  
  // 存储最后的获取参数，用于refresh
  const [lastFetchParams, setLastFetchParams] = useState<{
    elementId: string;
    xmlCacheId?: string;
    fallbackSources?: {
      stepCard?: Record<string, unknown>;
      selectionContext?: Record<string, unknown>;
    };
  } | null>(null);

  // 创建数据提供者实例
  const dataProvider = StructuralMatchingDataProvider.getInstance({
    enableValidation: config.enableValidation,
    enableEnhancement: config.enableEnhancement,
    caching: { 
      enabled: config.enableCaching !== false,
      ttl: 30000,
    },
  });

  /**
   * 获取数据
   */
  const fetchData = useCallback(async (
    elementId: string,
    xmlCacheId?: string,
    fallbackSources?: {
      stepCard?: Record<string, unknown>;
      selectionContext?: Record<string, unknown>;
    }
  ) => {
    console.log('🔍 [useStructuralMatchingData] 开始获取数据:', { elementId, xmlCacheId });
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataProvider.getUnifiedElementData(
        elementId,
        xmlCacheId,
        fallbackSources
      );
      
      if (result) {
        setData(result);
        setLastFetchParams({ elementId, xmlCacheId, fallbackSources });
        
        console.log('✅ [useStructuralMatchingData] 数据获取成功:', result);
        config.onSuccess?.(result);
      } else {
        const error = new Error(`无法获取元素数据: ${elementId}`);
        setError(error);
        config.onError?.(error);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      config.onError?.(error);
      console.error('❌ [useStructuralMatchingData] 数据获取失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, config]);

  /**
   * 刷新数据
   */
  const refresh = useCallback(async () => {
    if (lastFetchParams) {
      await fetchData(
        lastFetchParams.elementId,
        lastFetchParams.xmlCacheId,
        lastFetchParams.fallbackSources
      );
    }
  }, [fetchData, lastFetchParams]);

  /**
   * 清理数据
   */
  const clearData = useCallback(() => {
    setData(null);
    setError(null);
    setLastFetchParams(null);
    console.log('🧹 [useStructuralMatchingData] 数据已清理');
  }, []);

  /**
   * 获取调试信息
   */
  const getDebugInfo = useCallback(() => {
    const info = dataProvider.getDebugInfo();
    setDebugInfo(info);
    console.log('🔍 [useStructuralMatchingData] 调试信息:', info);
  }, [dataProvider]);

  // 清理过期缓存（定期执行）
  useEffect(() => {
    const cleanup = setInterval(() => {
      dataProvider.cleanupCache();
    }, 60000); // 每分钟清理一次

    return () => clearInterval(cleanup);
  }, [dataProvider]);

  return {
    data,
    loading,
    error,
    fetchData,
    refresh,
    clearData,
    debugInfo,
    getDebugInfo,
  };
};

/**
 * 简化版Hook - 直接传入参数获取数据
 */
export const useStructuralMatchingElement = (
  elementId?: string,
  xmlCacheId?: string,
  fallbackSources?: {
    stepCard?: Record<string, unknown>;
    selectionContext?: Record<string, unknown>;
  },
  config: UseStructuralMatchingDataConfig = {}
): UseStructuralMatchingDataResult => {
  const hookResult = useStructuralMatchingData(config);

  // 当参数变化时自动获取数据
  useEffect(() => {
    if (elementId && config.autoFetch !== false) {
      hookResult.fetchData(elementId, xmlCacheId, fallbackSources);
    }
  }, [elementId, xmlCacheId, fallbackSources, config.autoFetch]);

  return hookResult;
};

export default useStructuralMatchingData;