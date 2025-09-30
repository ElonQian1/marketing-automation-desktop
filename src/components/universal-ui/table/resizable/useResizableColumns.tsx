import React, { useCallback, useMemo, useRef, useState } from 'react';

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
  const { minWidth = 60, maxWidth = 600, onWidthChange } = options;

  const activeKeyRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWRef = useRef<number>(0);

  const [widthMap, setWidthMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const c of configs) {
      if (typeof c.width === 'number') map[c.key] = c.width;
    }
    return map;
  });

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
    setWidthMap(prev => ({ ...prev, [key]: nextW }));
  }, [getBounds]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    const key = activeKeyRef.current;
    if (!key) return;
    const finalW = widthMap[key] ?? startWRef.current;
    const bounded = getBounds(key, finalW);
    setWidthMap(prev => ({ ...prev, [key]: bounded }));
    onWidthChange?.(key, bounded);
    activeKeyRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
  }, [getBounds, onPointerMove, onWidthChange, widthMap]);

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
