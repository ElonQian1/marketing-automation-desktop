import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { rafThrottle, createBatchUpdater, createEventListenerManager } from './performance/performanceUtils';

export interface UseDraggableOptimizedOptions {
  initialPosition?: { x: number; y: number };
  bounds?: 'window' | 'parent' | { top: number; left: number; right: number; bottom: number };
  disabled?: boolean;
  onDragStart?: (position: { x: number; y: number }) => void;
  onDrag?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  storageKey?: string;
  enablePerformanceMode?: boolean; // 启用性能优化模式
}

export interface DraggableOptimizedState {
  position: { x: number; y: number };
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

/**
 * 高性能拖拽Hook - 使用RAF节流和批量更新优化
 */
export function useDraggableOptimized({
  initialPosition = { x: 20, y: 20 },
  bounds = 'window',
  disabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
  storageKey,
  enablePerformanceMode = true
}: UseDraggableOptimizedOptions = {}) {
  
  // 性能优化工具实例 - 只创建一次
  const performanceTools = useMemo(() => ({
    batchUpdater: createBatchUpdater(),
    eventManager: createEventListenerManager()
  }), []);

  // 从 localStorage 恢复位置
  const getInitialPosition = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { x: parsed.x || initialPosition.x, y: parsed.y || initialPosition.y };
        }
      } catch (error) {
        console.warn('Failed to load draggable position:', error);
      }
    }
    return initialPosition;
  }, [initialPosition, storageKey]);

  const [state, setState] = useState<DraggableOptimizedState>({
    position: getInitialPosition(),
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });

  const elementRef = useRef<HTMLElement>(null);
  const lastPositionRef = useRef(state.position);
  const isDraggingRef = useRef(false);

  // 保存位置到 localStorage - 使用防抖优化
  const savePosition = useMemo(() => {
    if (!storageKey || typeof window === 'undefined') {
      return () => {};
    }

    const save = (position: { x: number; y: number }) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch (error) {
        console.warn('Failed to save draggable position:', error);
      }
    };

    // 防抖保存，避免频繁写入localStorage
    let timeoutId: NodeJS.Timeout | null = null;
    return (position: { x: number; y: number }) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => save(position), 100);
    };
  }, [storageKey]);

  // 计算边界约束 - 缓存结果
  const getBounds = useCallback(() => {
    if (bounds === 'window') {
      return {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
      };
    } else if (bounds === 'parent' && elementRef.current?.parentElement) {
      const parent = elementRef.current.parentElement;
      const rect = parent.getBoundingClientRect();
      return {
        top: 0,
        left: 0,
        right: rect.width,
        bottom: rect.height
      };
    } else if (typeof bounds === 'object') {
      return bounds;
    }
    return null;
  }, [bounds]);

  // 约束位置在边界内
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const boundsRect = getBounds();
    if (!boundsRect || !elementRef.current) return pos;

    const element = elementRef.current;
    const elementRect = element.getBoundingClientRect();
    
    return {
      x: Math.max(
        boundsRect.left,
        Math.min(pos.x, boundsRect.right - elementRect.width)
      ),
      y: Math.max(
        boundsRect.top,
        Math.min(pos.y, boundsRect.bottom - elementRect.height)
      )
    };
  }, [getBounds]);

  // 优化的状态更新函数
  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    lastPositionRef.current = newPosition;
    
    if (enablePerformanceMode) {
      // 使用批量更新器减少重渲染
      performanceTools.batchUpdater.add(() => {
        setState(prev => ({
          ...prev,
          position: newPosition
        }));
      });
    } else {
      setState(prev => ({
        ...prev,
        position: newPosition
      }));
    }
  }, [enablePerformanceMode, performanceTools.batchUpdater]);

  // 优化的鼠标移动处理 - 使用RAF节流
  const handleMouseMoveOptimized = useMemo(() => {
    const handler = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      e.preventDefault();

      const dragOffset = state.dragOffset;
      const newPosition = constrainPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });

      // 只有位置真正改变时才更新
      const lastPos = lastPositionRef.current;
      if (newPosition.x !== lastPos.x || newPosition.y !== lastPos.y) {
        updatePosition(newPosition);
        onDrag?.(newPosition);
      }
    };

    return enablePerformanceMode ? rafThrottle(handler) : handler;
  }, [state.dragOffset, constrainPosition, updatePosition, onDrag, enablePerformanceMode]);

  // 存储节流函数引用以便清理
  const throttledHandlerRef = useRef<typeof handleMouseMoveOptimized | null>(null);
  
  useEffect(() => {
    throttledHandlerRef.current = handleMouseMoveOptimized;
  }, [handleMouseMoveOptimized]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    isDraggingRef.current = true;
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragOffset
    }));

    onDragStart?.(lastPositionRef.current);
  }, [disabled, onDragStart]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setState(prev => ({
      ...prev,
      isDragging: false
    }));

    const finalPosition = lastPositionRef.current;
    savePosition(finalPosition);
    onDragEnd?.(finalPosition);

    // 清理节流函数
    if (enablePerformanceMode && throttledHandlerRef.current && 'cancel' in throttledHandlerRef.current) {
      (throttledHandlerRef.current as any).cancel();
    }
  }, [savePosition, onDragEnd, enablePerformanceMode]);

  // 绑定全局鼠标事件
  useEffect(() => {
    if (state.isDragging) {
      // 使用事件管理器统一管理事件
      performanceTools.eventManager.add(document, 'mousemove', handleMouseMoveOptimized as EventListener);
      performanceTools.eventManager.add(document, 'mouseup', handleMouseUp);
      
      // 设置拖拽状态样式
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        performanceTools.eventManager.removeAll();
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [state.isDragging, handleMouseMoveOptimized, handleMouseUp, performanceTools.eventManager]);

  // 清理函数
  useEffect(() => {
    return () => {
      performanceTools.batchUpdater.cancel();
      performanceTools.eventManager.removeAll();
      if (enablePerformanceMode && throttledHandlerRef.current && 'cancel' in throttledHandlerRef.current) {
        (throttledHandlerRef.current as any).cancel();
      }
    };
  }, [performanceTools, enablePerformanceMode]);

  // 重置位置
  const resetPosition = useCallback(() => {
    const newPosition = constrainPosition(initialPosition);
    updatePosition(newPosition);
    savePosition(newPosition);
  }, [initialPosition, constrainPosition, updatePosition, savePosition]);

  // 设置位置
  const setPosition = useCallback((newPosition: { x: number; y: number }) => {
    const constrainedPosition = constrainPosition(newPosition);
    updatePosition(constrainedPosition);
    savePosition(constrainedPosition);
  }, [constrainPosition, updatePosition, savePosition]);

  return {
    // 状态
    position: state.position,
    isDragging: state.isDragging,
    
    // 事件处理器
    dragHandlers: {
      onMouseDown: handleMouseDown,
      ref: elementRef as React.RefObject<HTMLDivElement>
    },
    
    // 控制方法
    resetPosition,
    setPosition,
    
    // 样式属性
    style: {
      position: 'fixed' as const,
      left: state.position.x,
      top: state.position.y,
      cursor: state.isDragging ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      zIndex: 9999,
      // 启用硬件加速
      transform: enablePerformanceMode ? 'translateZ(0)' : undefined,
      willChange: state.isDragging ? 'transform' : 'auto'
    }
  };
}