// src/modules/contact-import/ui/hooks/useWorkbenchData.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

/**
 * 联系人导入工作台数据管理Hook
 * Employee D架构 - 单一职责：工作台数据状态管理
 * 
 * 职责：
 * - 号码池数据获取和分页
 * - 统计数据管理  
 * - 选择状态管理
 * - 设备分配状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import { listContactNumbers, ContactNumberDto } from '../services/contactNumberService';
import { getContactNumberStats, ContactNumberStatsDto } from '../services/stats/contactStatsService';

export interface UseWorkbenchDataReturn {
  // 数据状态
  loading: boolean;
  items: ContactNumberDto[];
  selectedRowKeys: React.Key[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  stats: ContactNumberStatsDto | null;
  
  // 设备分配相关
  assignment: Record<string, { industry?: string; idStart?: number; idEnd?: number }>;
  onlyUnconsumed: boolean;
  
  // 操作方法
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setAssignment: (assignment: Record<string, { industry?: string; idStart?: number; idEnd?: number }>) => void;
  setOnlyUnconsumed: (only: boolean) => void;
  
  // 数据加载
  loadList: () => Promise<void>;
  loadStats: () => Promise<void>;
}

export const useWorkbenchData = (): UseWorkbenchDataReturn => {
  // 核心数据状态
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ContactNumberDto[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 设备分配相关
  const [assignment, setAssignment] = useState<Record<string, { industry?: string; idStart?: number; idEnd?: number }>>({});
  const [onlyUnconsumed, setOnlyUnconsumed] = useState<boolean>(true);
  
  // 统计数据
  const [stats, setStats] = useState<ContactNumberStatsDto | null>(null);

  // 加载号码列表
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listContactNumbers({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: search.trim() || undefined,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('加载号码列表失败:', error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getContactNumberStats();
      setStats(statsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      setStats(null);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    // 数据状态
    loading,
    items,
    selectedRowKeys,
    total,
    page,
    pageSize,
    search,
    stats,
    
    // 设备分配相关
    assignment,
    onlyUnconsumed,
    
    // 操作方法
    setSearch,
    setPage,
    setPageSize,
    setSelectedRowKeys,
    setAssignment,
    setOnlyUnconsumed,
    
    // 数据加载
    loadList,
    loadStats,
  };
};