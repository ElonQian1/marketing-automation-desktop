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
import { CandidatePoolStats } from '../services/CandidatePoolService';
import { PreciseAcquisitionServiceFacade } from '../../../../application/services/PreciseAcquisitionServiceFacade.v2';
import type { WatchTargetRow, WatchTargetPayload } from '../../../../types/precise-acquisition';

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

// 类型适配函数
function convertStatsToLegacy(stats: any): CandidatePoolStats {
  return {
    total_count: stats.targets_count?.total || 0,
    by_platform: {
      [Platform.DOUYIN]: stats.targets_count?.by_platform?.douyin || 0,
      [Platform.XIAOHONGSHU]: stats.targets_count?.by_platform?.xiaohongshu || 0,
      [Platform.OCEANENGINE]: stats.targets_count?.by_platform?.oceanengine || 0,
      [Platform.PUBLIC]: stats.targets_count?.by_platform?.public || 0
    },
    by_type: {
      [TargetType.VIDEO]: stats.targets_count?.by_type?.video || 0,
      [TargetType.ACCOUNT]: stats.targets_count?.by_type?.account || 0
    },
    by_source: {
      [SourceType.MANUAL]: stats.targets_count?.by_source?.manual || 0,
      [SourceType.CSV]: stats.targets_count?.by_source?.csv || 0,
      [SourceType.WHITELIST]: stats.targets_count?.by_source?.whitelist || 0,
      [SourceType.ADS]: stats.targets_count?.by_source?.ads || 0
    },
    recent_added: stats.targets_count?.recent_added || 0
  };
}

function convertRowToTarget(row: WatchTargetRow): WatchTarget {
  return {
    id: row.id.toString(),
    target_type: row.target_type as any, // 类型转换处理枚举差异
    platform: row.platform as any,
    platform_id_or_url: row.id_or_url,
    title: row.title,
    source: (row.source as any) || SourceType.MANUAL,
    industry_tags: row.industry_tags ? row.industry_tags.split(';').map(tag => tag as any) : [],
    region_tag: row.region as any,
    notes: row.notes || '',
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  };
}

function convertTargetToPayload(target: Omit<WatchTarget, 'id' | 'created_at' | 'updated_at'>): WatchTargetPayload {
  return {
    dedup_key: `${target.platform}_${target.platform_id_or_url}`,
    target_type: target.target_type as any,
    platform: target.platform as any,
    id_or_url: target.platform_id_or_url,
    title: target.title,
    source: target.source as any,
    industry_tags: target.industry_tags ? target.industry_tags.join(';') : '',
    region: target.region_tag as any,
    notes: target.notes || ''
  };
}

function convertTargetPayloadToLegacy(payload: WatchTargetPayload): WatchTarget {
  return {
    id: '',
    target_type: payload.target_type as any,
    platform: payload.platform as any,
    platform_id_or_url: payload.id_or_url,
    title: payload.title,
    source: payload.source as any,
    industry_tags: payload.industry_tags ? payload.industry_tags.split(';') as any[] : [],
    region_tag: payload.region as any,
    notes: payload.notes || '',
    created_at: new Date(),
    updated_at: new Date()
  };
}

export function useCandidatePool(): UseCandidatePoolReturn {
  const service = PreciseAcquisitionServiceFacade.getInstance();
  
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
      setTargets(result.map(convertRowToTarget));
      
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
      await service.addWatchTarget(convertTargetToPayload(target));
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
      const payload: Partial<WatchTargetPayload> = {
        title: updates.title,
        industry_tags: updates.industry_tags ? updates.industry_tags.join(';') : undefined,
        region: updates.region_tag as any,
        notes: updates.notes
      };
      
      await service.updateWatchTarget(id, payload);
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
      message.success(`批量删除成功：删除 ${result.deletedCount} 个目标`);
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
    const result = service.validateCsvImport(csvData);
    
    // 适配返回类型
    return {
      valid_rows: result.processedData.map(data => convertTargetPayloadToLegacy(data)),
      invalid_rows: result.errors.map((error, index) => ({
        row_index: index,
        data: csvData[index] || {},
        errors: [error]
      })),
      summary: {
        total: csvData.length,
        valid: result.processedData.length,
        invalid: result.errors.length,
        duplicates: 0
      }
    };
  }, [service]);

  /**
   * 从CSV导入
   */
  const importFromCsv = useCallback(async (
    data: WatchTarget[], 
    options: { update_existing?: boolean } = {}
  ) => {
    try {
      const payloads = data.map(target => convertTargetToPayload(target));
      const result = await service.importFromCsv(payloads, options);
      
      message.success(
        `导入完成：成功 ${result.imported} 个，更新 ${result.updated} 个`
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
      setStats(convertStatsToLegacy(statsData));
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