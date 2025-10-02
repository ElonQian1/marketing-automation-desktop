/**
 * 统一的表格列管理Hook - 解决列设置与拖拽宽度冲突
 * 
 * 设计原则：
 * 1. 单一数据源：所有列配置存储在一个状态中
 * 2. 统一接口：列设置和拖拽都通过同一套API更新
 * 3. 可复用性：可在任何页面使用
 * 4. 类型安全：完整的TypeScript支持
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { ColumnType } from 'antd/es/table';

// 防抖工具函数
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

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

  // 防抖保存到localStorage
  const debouncedSave = useRef(
    debounce((data: TableColumnState[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save table columns to localStorage:', error);
      }
    }, 300)
  ).current;

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

  // 拖拽状态管理 - 使用ref避免频繁更新
  const dragStateRef = useRef<{
    activeKey: string | null;
    startX: number;
    startWidth: number;
    originalStates: TableColumnState[];
  }>({
    activeKey: null,
    startX: 0,
    startWidth: 0,
    originalStates: [],
  });

  // 防抖保存到localStorage
  useEffect(() => {
    debouncedSave(columnStates);
  }, [columnStates, debouncedSave]);

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

    // 使用ref存储拖拽状态，避免频繁重新渲染
    dragStateRef.current = {
      activeKey: key,
      startX: e.clientX,
      startWidth: column.width,
      originalStates: [...columnStates],
    };

    // 阻止默认行为
    e.preventDefault();
    document.body.style.userSelect = 'none';

    // 全局鼠标事件 - 使用节流优化性能
    let lastUpdateTime = 0;
    const throttleDelay = 16; // 约60fps

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.activeKey || dragState.activeKey !== key) return;

      const now = Date.now();
      if (now - lastUpdateTime < throttleDelay) return;
      lastUpdateTime = now;

      const deltaX = moveEvent.clientX - dragState.startX;
      const newWidth = Math.max(60, Math.min(600, dragState.startWidth + deltaX));
      
      // 实时更新宽度 - 只更新对应列
      setColumnStates(prev => prev.map(col => 
        col.key === key ? { ...col, width: newWidth } : col
      ));
    };

    const handleMouseUp = () => {
      const dragState = dragStateRef.current;
      const finalColumn = columnStates.find(col => col.key === key);
      
      if (finalColumn && dragState.activeKey) {
        onWidthChange?.(key, finalColumn.width);
      }
      
      // 清理拖拽状态
      dragStateRef.current = {
        activeKey: null,
        startX: 0,
        startWidth: 0,
        originalStates: [],
      };
      
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [columnStates, onWidthChange]);

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