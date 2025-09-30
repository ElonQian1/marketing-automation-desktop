import { useState, useMemo, useCallback } from 'react';
import { COLUMN_CONFIGS, createNumberPoolColumns, NumberPoolColumnConfig } from './NumberPoolTableColumns';
import { createNumberPoolRenderers } from './NumberPoolFieldRenderers';
import { ContactNumberDto } from '../../services/contactNumberService';
import { Device } from '../../../../../domain/adb/entities/Device';
import type { ColumnType } from 'antd/es/table';

export interface UseNumberPoolTableOptions {
  page: number;
  pageSize: number;
  devices?: Device[];
}

export interface NumberPoolTableState {
  visibleColumns: Set<string>;
  availableColumns: NumberPoolColumnConfig[];
  columns: ColumnType<ContactNumberDto>[];
}

export interface NumberPoolTableActions {
  toggleColumn: (columnId: string) => void;
  showColumn: (columnId: string) => void;
  hideColumn: (columnId: string) => void;
  resetColumns: () => void;
  setVisibleColumns: (columnIds: string[]) => void;
}

export function useNumberPoolTable(
  options: UseNumberPoolTableOptions
): NumberPoolTableState & NumberPoolTableActions {
  const { page, pageSize, devices } = options;

  // 默认可见列
  const defaultVisibleColumns = useMemo(() => {
    return new Set(
      COLUMN_CONFIGS
        .filter(config => config.defaultVisible)
        .map(config => config.id)
    );
  }, []);

  const [visibleColumns, setVisibleColumnsState] = useState<Set<string>>(defaultVisibleColumns);

  // 创建渲染器
  const renderers = useMemo(() => {
    return createNumberPoolRenderers(devices);
  }, [devices]);

  // 生成表格列
  const columns = useMemo(() => {
    return createNumberPoolColumns(
      { page, pageSize, visibleColumns, devices },
      renderers
    );
  }, [page, pageSize, visibleColumns, devices, renderers]);

  // 操作方法
  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumnsState(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }, []);

  const showColumn = useCallback((columnId: string) => {
    setVisibleColumnsState(prev => new Set([...prev, columnId]));
  }, []);

  const hideColumn = useCallback((columnId: string) => {
    setVisibleColumnsState(prev => {
      const newSet = new Set(prev);
      newSet.delete(columnId);
      return newSet;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setVisibleColumnsState(defaultVisibleColumns);
  }, [defaultVisibleColumns]);

  const setVisibleColumns = useCallback((columnIds: string[]) => {
    setVisibleColumnsState(new Set(columnIds));
  }, []);

  return {
    // 状态
    visibleColumns,
    availableColumns: COLUMN_CONFIGS,
    columns,
    // 操作
    toggleColumn,
    showColumn,
    hideColumn,
    resetColumns,
    setVisibleColumns,
  };
}

/**
 * 列显示配置组件的Props类型
 */
export interface ColumnConfigPanelProps {
  availableColumns: NumberPoolColumnConfig[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
  onResetColumns: () => void;
}