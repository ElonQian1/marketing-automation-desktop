// src/modules/contact-import/ui/components/grid-layout/hooks/useHandleDrag.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { rafThrottle, createBatchUpdater, createEventListenerManager } from './performance/performanceUtils';
import { createDragThreshold, DragThresholdConfig } from './performance/DragThreshold';
import { createEventSeparation, EventSeparationConfig, PRESET_CONFIGS } from './performance/EventSeparation';

export interface UseHandleDragOptions {
  initialPosition?: { x: number; y: number };
  bounds?: 'window' | 'parent' | { top: number; left: number; right: number; bottom: number };
  disabled?: boolean;
  onDragStart?: (position: { x: number; y: number }) => void;
  onDrag?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  storageKey?: string;
  enablePerformanceMode?: boolean;
  dragThresholdConfig?: DragThresholdConfig;
  eventSeparationConfig?: EventSeparationConfig;
}

export interface HandleDragState {
  position: { x: number; y: number };
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  isThresholdReached: boolean;
}

/**
 * 手柄专用拖拽Hook
 * 只在指定的拖拽手柄上启用拖拽，其他区域保持正常交互
 */
export function useHandleDrag({
  initialPosition = { x: 20, y: 20 },
  bounds = 'window',
  disabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
  storageKey,
  enablePerformanceMode = true,
  dragThresholdConfig = { threshold: 5, timeThreshold: 100 },
  eventSeparationConfig = PRESET_CONFIGS.toolbar
}: UseHandleDragOptions = {}) {
  
  // 性能优化工具实例
  const performanceTools = useMemo(() => ({
    batchUpdater: createBatchUpdater(),
    eventManager: createEventListenerManager(),
    dragThreshold: createDragThreshold(dragThresholdConfig),
    eventSeparation: createEventSeparation(eventSeparationConfig)
  }), [dragThresholdConfig, eventSeparationConfig]);

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

  const [state, setState] = useState<HandleDragState>({
    position: getInitialPosition(),
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    isThresholdReached: false
  });

  const containerRef = useRef<HTMLElement>(null);
  const lastPositionRef = useRef(state.position);
  const isDraggingRef = useRef(false);

  // 保存位置到 localStorage - 防抖优化
  const savePosition = useMemo(() => {
    if (!storageKey || typeof window === 'undefined') {
      return () => {};
    }

    let timeoutId: NodeJS.Timeout | null = null;
    return (position: { x: number; y: number }) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(position));
        } catch (error) {
          console.warn('Failed to save draggable position:', error);
        }
      }, 100);
    };
  }, [storageKey]);

  // 计算边界约束
  const getBounds = useCallback(() => {
    if (bounds === 'window') {
      return {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
      };
    } else if (bounds === 'parent' && containerRef.current?.parentElement) {
      const parent = containerRef.current.parentElement;
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
    if (!boundsRect || !containerRef.current) return pos;

    const element = containerRef.current;
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

  // 鼠标移动处理 - 带阈值检测
  const handleMouseMoveOptimized = useMemo(() => {
    const handler = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // 检查拖拽阈值
      const thresholdReached = performanceTools.dragThreshold.update(e.clientX, e.clientY);
      
      if (!thresholdReached) {
        // 未达到阈值，不开始真正的拖拽
        return;
      }

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

      // 更新阈值状态
      if (!state.isThresholdReached) {
        setState(prev => ({
          ...prev,
          isThresholdReached: true
        }));
      }
    };

    return enablePerformanceMode ? rafThrottle(handler) : handler;
  }, [state.dragOffset, state.isThresholdReached, constrainPosition, updatePosition, onDrag, enablePerformanceMode, performanceTools.dragThreshold]);

  // 处理鼠标按下 - 只在拖拽手柄上生效
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return;

    // 检查是否在拖拽手柄上
    if (!performanceTools.eventSeparation.shouldEnableDrag(e.nativeEvent)) {
      return; // 不阻止事件，让按钮正常工作
    }

    e.preventDefault();
    e.stopPropagation();

    const element = containerRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // 开始拖拽阈值检测
    performanceTools.dragThreshold.start(e.clientX, e.clientY);

    isDraggingRef.current = true;
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragOffset,
      isThresholdReached: false
    }));

    onDragStart?.(lastPositionRef.current);
  }, [disabled, onDragStart, performanceTools.eventSeparation, performanceTools.dragThreshold]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    const wasThresholdReached = state.isThresholdReached;
    
    isDraggingRef.current = false;
    setState(prev => ({
      ...prev,
      isDragging: false,
      isThresholdReached: false
    }));

    // 重置拖拽阈值
    performanceTools.dragThreshold.reset();

    const finalPosition = lastPositionRef.current;
    
    // 只有真正拖拽过才保存位置
    if (wasThresholdReached) {
      savePosition(finalPosition);
      onDragEnd?.(finalPosition);
    }
  }, [state.isThresholdReached, savePosition, onDragEnd, performanceTools.dragThreshold]);

  // 绑定全局鼠标事件
  useEffect(() => {
    if (state.isDragging) {
      performanceTools.eventManager.add(document, 'mousemove', handleMouseMoveOptimized as EventListener);
      performanceTools.eventManager.add(document, 'mouseup', handleMouseUp);
      
      // 只有达到阈值后才设置拖拽样式
      if (state.isThresholdReached) {
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      return () => {
        performanceTools.eventManager.removeAll();
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [state.isDragging, state.isThresholdReached, handleMouseMoveOptimized, handleMouseUp, performanceTools.eventManager]);

  // 清理函数
  useEffect(() => {
    return () => {
      performanceTools.batchUpdater.cancel();
      performanceTools.eventManager.removeAll();
      performanceTools.dragThreshold.reset();
    };
  }, [performanceTools]);

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
    isThresholdReached: state.isThresholdReached,
    
    // 事件处理器 - 只用于容器
    containerHandlers: {
      onMouseDown: handleMouseDown,
      ref: containerRef as React.RefObject<HTMLDivElement>
    },
    
    // 控制方法
    resetPosition,
    setPosition,
    
    // 工具方法
    eventSeparation: performanceTools.eventSeparation,
    
    // 样式属性
    style: {
      position: 'fixed' as const,
      left: state.position.x,
      top: state.position.y,
      userSelect: 'none' as const,
      zIndex: 9999,
      transform: enablePerformanceMode ? 'translateZ(0)' : undefined,
      willChange: state.isDragging && state.isThresholdReached ? 'transform' : 'auto'
    }
  };
}