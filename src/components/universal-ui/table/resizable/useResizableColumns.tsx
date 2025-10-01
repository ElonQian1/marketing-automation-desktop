import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

export interface ResizableColumnConfig {
  key: string;
  width?: number; // px
  minWidth?: number; // default 60
  maxWidth?: number; // default 600
}

export interface UseResizableColumnsOptions {
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (key: string, width: number) => void;
  /** 是否为受控模式，受控模式下完全依赖外部传入的width */
  controlled?: boolean;
}

export interface ResizableColumnRuntime extends ResizableColumnConfig {
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResize?: (e: PointerEvent) => void;
  onResizeEnd?: (e: PointerEvent) => void;
}

export function useResizableColumns(
  configs: ResizableColumnConfig[],
  options: UseResizableColumnsOptions = {}
) {
  const { minWidth = 60, maxWidth = 600, onWidthChange, controlled = false } = options;

  const activeKeyRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWRef = useRef<number>(0);

  // 内部状态：仅在非受控模式下使用
  const [internalWidthMap, setInternalWidthMap] = useState<Record<string, number>>(() => {
    if (controlled) return {}; // 受控模式下不使用内部状态
    const map: Record<string, number> = {};
    for (const c of configs) {
      if (typeof c.width === 'number') map[c.key] = c.width;
    }
    return map;
  });

  // 受控模式下，从外部configs提取width
  const externalWidthMap = useMemo(() => {
    if (!controlled) return {};
    const map: Record<string, number> = {};
    for (const c of configs) {
      if (typeof c.width === 'number') map[c.key] = c.width;
    }
    return map;
  }, [configs, controlled]);

  // 获取当前使用的widthMap
  const widthMap = controlled ? externalWidthMap : internalWidthMap;

  // 当configs变化时，同步内部状态（仅非受控模式）
  useEffect(() => {
    if (controlled) return;
    
    setInternalWidthMap(prev => {
      const next = { ...prev };
      let changed = false;
      
      for (const c of configs) {
        if (typeof c.width === 'number' && prev[c.key] !== c.width) {
          next[c.key] = c.width;
          changed = true;
        }
      }
      
      return changed ? next : prev;
    });
  }, [configs, controlled]);

  const getBounds = useCallback(
    (key: string, w: number) => {
      const c = configs.find(x => x.key === key);
      const lo = c?.minWidth ?? minWidth;
      const hi = c?.maxWidth ?? maxWidth;
      return Math.max(lo, Math.min(hi, w));
    },
    [configs, minWidth, maxWidth]
  );

  // 先定义全局移动/结束回调，供 onResizeStart 引用，避免 TDZ 报错
  const onPointerMove = useCallback((e: PointerEvent) => {
    const key = activeKeyRef.current;
    if (!key) return;
    const dx = e.clientX - startXRef.current;
    const nextW = getBounds(key, startWRef.current + dx);
    
    if (controlled) {
      // 受控模式：立即通知外部
      onWidthChange?.(key, nextW);
    } else {
      // 非受控模式：更新内部状态
      setInternalWidthMap(prev => ({ ...prev, [key]: nextW }));
    }
  }, [getBounds, controlled, onWidthChange]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    const key = activeKeyRef.current;
    if (!key) return;
    const finalW = widthMap[key] ?? startWRef.current;
    const bounded = getBounds(key, finalW);
    
    if (controlled) {
      // 受控模式：确保最终值也通知外部
      onWidthChange?.(key, bounded);
    } else {
      // 非受控模式：更新内部状态并通知外部
      setInternalWidthMap(prev => ({ ...prev, [key]: bounded }));
      onWidthChange?.(key, bounded);
    }
    
    activeKeyRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
  }, [getBounds, onPointerMove, onWidthChange, widthMap, controlled]);

  const onResizeStart = useCallback((key: string, e: React.PointerEvent<HTMLDivElement>) => {
    activeKeyRef.current = key;
    startXRef.current = e.clientX;
    startWRef.current = widthMap[key] ?? configs.find(c => c.key === key)?.width ?? 120;
    const el = e.target as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    // 阻止页面级拖拽/选择
    e.preventDefault();
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        // 取消并回退到开始宽度
        const keyNow = activeKeyRef.current;
        if (keyNow) {
          setWidthMap(prev => ({ ...prev, [keyNow]: startWRef.current }));
        }
        handlePointerUp(ev as unknown as PointerEvent);
      }
    };
    const handlePointerUp = (ev: PointerEvent) => {
      onPointerUp(ev);
      // 恢复选择
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', handlePointerUp as any);
      window.removeEventListener('keydown', handleKeyDown as any);
    };
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    window.addEventListener('keydown', handleKeyDown);
  }, [widthMap, configs, onPointerMove, onPointerUp]);

  const runtime = useMemo<ResizableColumnRuntime[]>(() => {
    return configs.map(c => ({
      ...c,
      width: widthMap[c.key] ?? c.width,
      onResizeStart: (e) => onResizeStart(c.key, e),
    }));
  }, [configs, widthMap, onResizeStart]);

  return { columns: runtime };
}
