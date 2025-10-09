/**
 * 候选池管理Hook
 * 
 * 提供候选池管理的React状态管理和业务逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
  WatchTarget, 
  WatchTargetQueryParams, 
  ImportValidationResult,
  Platform,
  TargetType,
  SourceType
} from '../../shared/types/core';
import { CandidatePoolService, CandidatePoolStats } from '../services/CandidatePoolService';

export interface UseCandidatePoolReturn {
  // 数据状态
  targets: WatchTarget[];
  stats: CandidatePoolStats | null;
  loading: boolean;
  error: string | null;
  
  // 分页状态
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // 筛选状态
  filters: WatchTargetQueryParams;
  
  // 基础操作
  refreshTargets: () => Promise<void>;
  addTarget: (target: Omit<WatchTarget, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTarget: (id: string, updates: Partial<WatchTarget>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  batchDeleteTargets: (ids: string[]) => Promise<void>;
  
  // 导入导出
  validateCsvData: (csvData: any[]) => ImportValidationResult;
  importFromCsv: (data: WatchTarget[], options?: { update_existing?: boolean }) => Promise<void>;
  exportToCsv: (filters?: WatchTargetQueryParams) => Promise<void>;
  
  // 搜索和筛选
  searchTargets: (keyword: string) => void;
  setFilters: (filters: Partial<WatchTargetQueryParams>) => void;
  clearFilters: () => void;
  
  // 分页
  changePage: (page: number, pageSize?: number) => void;
  
  // 统计
  refreshStats: () => Promise<void>;
}

export function useCandidatePool(): UseCandidatePoolReturn {
  const [service] = useState(() => new CandidatePoolService());
  
  // 数据状态
  const [targets, setTargets] = useState<WatchTarget[]>([]);
  const [stats, setStats] = useState<CandidatePoolStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  // 筛选状态
  const [filters, setFiltersState] = useState<WatchTargetQueryParams>({});

  /**
   * 加载目标列表
   */
  const loadTargets = useCallback(async (params?: WatchTargetQueryParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        ...filters,
        ...params,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      };
      
      const result = await service.getWatchTargets(queryParams);
      setTargets(result);
      
      // 这里应该从后端获取总数，暂时使用返回数据长度
      setPagination(prev => ({
        ...prev,
        total: result.length
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [service, filters, pagination.current, pagination.pageSize]);

  /**
   * 刷新目标列表
   */
  const refreshTargets = useCallback(async () => {
    await loadTargets();
  }, [loadTargets]);

  /**
   * 添加目标
   */
  const addTarget = useCallback(async (target: Omit<WatchTarget, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await service.addWatchTarget(target);
      message.success('添加成功');
      await refreshTargets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加失败';
      message.error(errorMessage);
      throw err;
    }
  }, [service, refreshTargets]);

  /**
   * 更新目标
   */
  const updateTarget = useCallback(async (id: string, updates: Partial<WatchTarget>) => {
    try {
      await service.updateWatchTarget(id, updates);
      message.success('更新成功');
      await refreshTargets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败';
      message.error(errorMessage);
      throw err;
    }
  }, [service, refreshTargets]);

  /**
   * 删除目标
   */
  const deleteTarget = useCallback(async (id: string) => {
    try {
      await service.deleteWatchTarget(id);
      message.success('删除成功');
      await refreshTargets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      message.error(errorMessage);
      throw err;
    }
  }, [service, refreshTargets]);

  /**
   * 批量删除目标
   */
  const batchDeleteTargets = useCallback(async (ids: string[]) => {
    try {
      const result = await service.batchDeleteWatchTargets(ids);
      message.success(`删除成功 ${result.success} 个，失败 ${result.failed} 个`);
      await refreshTargets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量删除失败';
      message.error(errorMessage);
      throw err;
    }
  }, [service, refreshTargets]);

  /**
   * 验证CSV数据
   */
  const validateCsvData = useCallback((csvData: any[]): ImportValidationResult => {
    return service.validateCsvImport(csvData);
  }, [service]);

  /**
   * 从CSV导入
   */
  const importFromCsv = useCallback(async (
    data: WatchTarget[], 
    options: { update_existing?: boolean } = {}
  ) => {
    try {
      const result = await service.importFromCsv(data, options);
      message.success(
        `导入完成：成功 ${result.imported} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个`
      );
      
      if (result.errors.length > 0) {
        message.warning(`${result.errors.length} 个目标导入失败`);
      }
      
      await refreshTargets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入失败';
      message.error(errorMessage);
      throw err;
    }
  }, [service, refreshTargets]);

  /**
   * 导出为CSV
   */
  const exportToCsv = useCallback(async (exportFilters?: WatchTargetQueryParams) => {
    try {
      const csvContent = await service.exportToCsv(exportFilters);
      
      // 下载CSV文件
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `候选池导出_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('导出成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出失败';
      message.error(errorMessage);
      throw err;
    }
  }, [service]);

  /**
   * 搜索目标
   */
  const searchTargets = useCallback((keyword: string) => {
    setFiltersState(prev => ({
      ...prev,
      keyword: keyword.trim() || undefined
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 设置筛选条件
   */
  const setFilters = useCallback((newFilters: Partial<WatchTargetQueryParams>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 清除筛选条件
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  /**
   * 改变分页
   */
  const changePage = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  }, []);

  /**
   * 刷新统计数据
   */
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await service.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  }, [service]);

  // 初始化和自动刷新
  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // 当筛选条件或分页变化时重新加载
  useEffect(() => {
    loadTargets();
  }, [filters, pagination.current, pagination.pageSize]);

  return {
    // 数据状态
    targets,
    stats,
    loading,
    error,
    
    // 分页状态
    pagination,
    filters,
    
    // 基础操作
    refreshTargets,
    addTarget,
    updateTarget,
    deleteTarget,
    batchDeleteTargets,
    
    // 导入导出
    validateCsvData,
    importFromCsv,
    exportToCsv,
    
    // 搜索和筛选
    searchTargets,
    setFilters,
    clearFilters,
    
    // 分页
    changePage,
    
    // 统计
    refreshStats
  };
}