/**
 * 监控数据管理Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '../../analytics-reporting/AnalyticsService';
import type { ReportMetrics } from '../../analytics-reporting/types';

interface UseMonitoringDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMonitoringDataReturn {
  metrics: ReportMetrics | null;
  loading: boolean;
  error: Error | null;
  lastUpdate: string;
  refreshMetrics: () => Promise<void>;
}

export const useMonitoringData = (
  options: UseMonitoringDataOptions = {}
): UseMonitoringDataReturn => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('—');

  const analytics = new AnalyticsService();

  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      
      const data = await analytics.getReportMetrics({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        period: 'daily'
      });
      
      setMetrics(data);
      setLastUpdate('刚刚');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取监控数据失败'));
      console.error('Failed to load monitoring metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  // 初始化加载
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdate,
    refreshMetrics
  };
};