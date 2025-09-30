import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface UseDraggableOptions {
  initialPosition?: { x: number; y: number };
  bounds?: 'window' | 'parent' | { top: number; left: number; right: number; bottom: number };
  disabled?: boolean;
  onDragStart?: (position: { x: number; y: number }) => void;
  onDrag?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  storageKey?: string; // 保存位置到 localStorage
}

export interface DraggableState {
  position: { x: number; y: number };
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

export function useDraggable({
  initialPosition = { x: 20, y: 20 },
  bounds = 'window',
  disabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
  storageKey
}: UseDraggableOptions = {}) {
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

  const [state, setState] = useState<DraggableState>({
    position: getInitialPosition(),
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });

  const elementRef = useRef<HTMLElement>(null);

  // 保存位置到 localStorage
  const savePosition = useCallback((position: { x: number; y: number }) => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch (error) {
        console.warn('Failed to save draggable position:', error);
      }
    }
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

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return; // 只处理左键

    e.preventDefault();
    e.stopPropagation();

    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setState(prev => ({
      ...prev,
      isDragging: true,
      dragOffset
    }));

    onDragStart?.(state.position);
  }, [disabled, onDragStart, state.position]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!state.isDragging) return;

    e.preventDefault();

    const newPosition = constrainPosition({
      x: e.clientX - state.dragOffset.x,
      y: e.clientY - state.dragOffset.y
    });

    setState(prev => ({
      ...prev,
      position: newPosition
    }));

    onDrag?.(newPosition);
  }, [state.isDragging, state.dragOffset, constrainPosition, onDrag]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (!state.isDragging) return;

    setState(prev => ({
      ...prev,
      isDragging: false
    }));

    savePosition(state.position);
    onDragEnd?.(state.position);
  }, [state.isDragging, state.position, savePosition, onDragEnd]);

  // 绑定全局鼠标事件
  useEffect(() => {
    if (state.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [state.isDragging, handleMouseMove, handleMouseUp]);

  // 重置位置
  const resetPosition = useCallback(() => {
    const newPosition = constrainPosition(initialPosition);
    setState(prev => ({
      ...prev,
      position: newPosition
    }));
    savePosition(newPosition);
  }, [initialPosition, constrainPosition, savePosition]);

  // 设置位置
  const setPosition = useCallback((newPosition: { x: number; y: number }) => {
    const constrainedPosition = constrainPosition(newPosition);
    setState(prev => ({
      ...prev,
      position: constrainedPosition
    }));
    savePosition(constrainedPosition);
  }, [constrainPosition, savePosition]);

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
      zIndex: 9999
    }
  };
}