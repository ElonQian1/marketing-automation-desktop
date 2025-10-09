/**
 * 筛选器工具Hook
 * 
 * 通用的数据筛选逻辑，支持多字段搜索和复杂条件
 */
import { useState, useMemo, useCallback } from 'react';

interface FilterConfig<T> {
  searchFields?: (keyof T)[];
  customFilters?: Record<string, (item: T, value: any) => boolean>;
}

interface UseFilterReturn<T> {
  filteredData: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  clearFilter: (key: string) => void;
}

export function useFilter<T>(
  data: T[],
  config: FilterConfig<T> = {}
): UseFilterReturn<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { searchFields = [], customFilters = {} } = config;

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      // 搜索词筛选
      if (searchTerm) {
        const matchesSearch = searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchTerm);
          }
          return false;
        });

        if (!matchesSearch) return false;
      }

      // 自定义筛选器
      for (const [filterKey, filterValue] of Object.entries(activeFilters)) {
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          continue;
        }

        const customFilter = customFilters[filterKey];
        if (customFilter) {
          if (!customFilter(item, filterValue)) {
            return false;
          }
        } else {
          // 默认相等比较
          const itemValue = (item as any)[filterKey];
          if (itemValue !== filterValue) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, activeFilters, searchFields, customFilters]);

  const setFilter = useCallback((key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchTerm('');
  }, []);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    activeFilters,
    setFilter,
    clearFilters,
    clearFilter
  };
}