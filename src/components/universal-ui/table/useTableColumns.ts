/**
 * 统一的表格列管理Hook - 解决列设置与拖拽宽度冲突
 * 
 * 设计原则：
 * 1. 单一数据源：所有列配置存储在一个状态中
 * 2. 统一接口：列设置和拖拽都通过同一套API更新
 * 3. 可复用性：可在任何页面使用
 * 4. 类型安全：完整的TypeScript支持
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { ColumnType } from 'antd/es/table';

export interface TableColumnConfig {
  key: string;
  title: string;
  dataIndex: string;
  defaultVisible?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  fixed?: 'left' | 'right';
  resizable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

export interface TableColumnState {
  key: string;
  title: string;
  dataIndex: string;
  visible: boolean;
  width: number;
  order: number;
}

export interface UseTableColumnsOptions {
  storageKey: string;
  configs: TableColumnConfig[];
  onWidthChange?: (key: string, width: number) => void;
}

export interface UseTableColumnsResult {
  // 状态
  columns: ColumnType<any>[];
  visibleColumns: TableColumnState[];
  allColumns: TableColumnState[];
  
  // 操作方法
  setVisible: (key: string, visible: boolean) => void;
  setWidth: (key: string, width: number) => void;
  setOrder: (keys: string[]) => void;
  reset: () => void;
  
  // 拖拽相关
  getResizableProps: (key: string) => {
    width: number;
    onResizeStart: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
  
  // 统计
  visibleCount: number;
  totalCount: number;
}

export function useTableColumns(options: UseTableColumnsOptions): UseTableColumnsResult {
  const { storageKey, configs, onWidthChange } = options;

  // 加载持久化数据
  const loadStoredState = useCallback((): TableColumnState[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as TableColumnState[];
        const storedMap = new Map(parsed.map(item => [item.key, item]));
        
        // 合并配置，确保新增字段有默认值
        return configs.map((config, index) => {
          const stored = storedMap.get(config.key);
          return {
            key: config.key,
            title: config.title,
            dataIndex: config.dataIndex,
            visible: stored?.visible ?? (config.defaultVisible !== false),
            width: stored?.width ?? config.defaultWidth ?? 120,
            order: stored?.order ?? index,
          };
        });
      }
    } catch (error) {
      console.warn('Failed to load table columns from localStorage:', error);
    }
    
    // 返回默认状态
    return configs.map((config, index) => ({
      key: config.key,
      title: config.title,
      dataIndex: config.dataIndex,
      visible: config.defaultVisible !== false,
      width: config.defaultWidth ?? 120,
      order: index,
    }));
  }, [configs, storageKey]);

  const [columnStates, setColumnStates] = useState<TableColumnState[]>(loadStoredState);

  // 持久化到localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnStates));
    } catch (error) {
      console.warn('Failed to save table columns to localStorage:', error);
    }
  }, [columnStates, storageKey]);

  // 拖拽状态管理
  const [dragState, setDragState] = useState<{
    activeKey: string | null;
    startX: number;
    startWidth: number;
  }>({
    activeKey: null,
    startX: 0,
    startWidth: 0,
  });

  // 获取可见列（按order排序）
  const visibleColumns = useMemo(() => {
    return columnStates
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [columnStates]);

  // 生成最终的Ant Design列配置
  const columns = useMemo((): ColumnType<any>[] => {
    return visibleColumns.map(colState => {
      const config = configs.find(c => c.key === colState.key);
      if (!config) return null;

      return {
        title: colState.title,
        dataIndex: colState.dataIndex,
        key: colState.key,
        width: colState.width,
        fixed: config.fixed,
        render: config.render,
        onHeaderCell: () => ({
          resizableProps: config.resizable !== false ? {
            width: colState.width,
            onResizeStart: (e: React.PointerEvent<HTMLDivElement>) => {
              handleResizeStart(colState.key, e);
            },
          } : undefined,
        }),
      };
    }).filter(Boolean) as ColumnType<any>[];
  }, [visibleColumns, configs]);

  // 拖拽开始
  const handleResizeStart = useCallback((key: string, e: React.PointerEvent<HTMLDivElement>) => {
    const column = columnStates.find(col => col.key === key);
    if (!column) return;

    setDragState({
      activeKey: key,
      startX: e.clientX,
      startWidth: column.width,
    });

    // 阻止默认行为
    e.preventDefault();
    document.body.style.userSelect = 'none';

    // 全局鼠标事件
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (dragState.activeKey !== key) return;

      const deltaX = moveEvent.clientX - dragState.startX;
      const newWidth = Math.max(60, Math.min(600, dragState.startWidth + deltaX));
      
      // 实时更新宽度
      setColumnStates(prev => prev.map(col => 
        col.key === key ? { ...col, width: newWidth } : col
      ));
    };

    const handleMouseUp = () => {
      const finalColumn = columnStates.find(col => col.key === key);
      if (finalColumn) {
        onWidthChange?.(key, finalColumn.width);
      }
      
      setDragState({ activeKey: null, startX: 0, startWidth: 0 });
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [columnStates, dragState, onWidthChange]);

  // API方法
  const setVisible = useCallback((key: string, visible: boolean) => {
    setColumnStates(prev => prev.map(col => 
      col.key === key ? { ...col, visible } : col
    ));
  }, []);

  const setWidth = useCallback((key: string, width: number) => {
    const boundedWidth = Math.max(60, Math.min(600, width));
    setColumnStates(prev => prev.map(col => 
      col.key === key ? { ...col, width: boundedWidth } : col
    ));
    onWidthChange?.(key, boundedWidth);
  }, [onWidthChange]);

  const setOrder = useCallback((keys: string[]) => {
    setColumnStates(prev => {
      const keyOrderMap = new Map(keys.map((key, index) => [key, index]));
      return prev.map(col => ({
        ...col,
        order: keyOrderMap.get(col.key) ?? col.order,
      }));
    });
  }, []);

  const reset = useCallback(() => {
    setColumnStates(configs.map((config, index) => ({
      key: config.key,
      title: config.title,
      dataIndex: config.dataIndex,
      visible: config.defaultVisible !== false,
      width: config.defaultWidth ?? 120,
      order: index,
    })));
  }, [configs]);

  const getResizableProps = useCallback((key: string) => {
    const column = columnStates.find(col => col.key === key);
    return {
      width: column?.width ?? 120,
      onResizeStart: (e: React.PointerEvent<HTMLDivElement>) => handleResizeStart(key, e),
    };
  }, [columnStates, handleResizeStart]);

  return {
    // 状态
    columns,
    visibleColumns,
    allColumns: columnStates,
    
    // 操作方法
    setVisible,
    setWidth,
    setOrder,
    reset,
    
    // 拖拽相关
    getResizableProps,
    
    // 统计
    visibleCount: visibleColumns.length,
    totalCount: configs.length,
  };
}