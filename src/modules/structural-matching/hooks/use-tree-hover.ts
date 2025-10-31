// src/modules/structural-matching/hooks/use-tree-hover.ts
// module: structural-matching | layer: hooks | role: 树节点悬停状态管理
// summary: 管理树节点悬停状态和延迟显示预览的hook

import { useState, useCallback, useRef } from 'react';

export interface TreeHoverConfig {
  /** 悬停延迟时间 (ms) */
  hoverDelay?: number;
  /** 离开延迟时间 (ms) */
  leaveDelay?: number;
}

export interface TreeHoverState {
  /** 当前悬停的节点key */
  hoveredKey: string | null;
  /** 是否显示预览 */
  showPreview: boolean;
  /** 鼠标位置 */
  mousePosition: { x: number; y: number };
  /** 当前元素数据 */
  elementData: any;
}

export interface UseTreeHoverReturn {
  /** 悬停状态 */
  hoverState: TreeHoverState;
  /** 处理节点悬停 */
  handleNodeHover: (nodeKey: string, elementData: any, mouseEvent: React.MouseEvent) => void;
  /** 处理节点离开 */
  handleNodeLeave: () => void;
  /** 清除悬停状态 */
  clearHover: () => void;
  /** 显示预览 (兼容旧API) */
  showPreview: (elementData: any, mouseEvent: React.MouseEvent) => void;
  /** 隐藏预览 (兼容旧API) */
  hidePreview: () => void;
  /** 更新鼠标位置 (兼容旧API) */
  updateMousePosition: (mouseEvent: React.MouseEvent) => void;
}

/**
 * 树节点悬停管理hook
 */
export function useTreeHover(config: TreeHoverConfig = {}): UseTreeHoverReturn {
  const {
    hoverDelay = 300,
    leaveDelay = 150
  } = config;

  const [hoverState, setHoverState] = useState<TreeHoverState>({
    hoveredKey: null,
    showPreview: false,
    mousePosition: { x: 0, y: 0 },
    elementData: null
  });

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  const handleNodeHover = useCallback((nodeKey: string, elementData: any, mouseEvent: React.MouseEvent) => {
    clearTimeouts();

    // 立即更新鼠标位置和节点key
    setHoverState(prev => ({
      ...prev,
      hoveredKey: nodeKey,
      mousePosition: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      elementData
    }));

    // 延迟显示预览
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverState(prev => ({
        ...prev,
        showPreview: true
      }));
    }, hoverDelay);
  }, [hoverDelay, clearTimeouts]);

  const handleNodeLeave = useCallback(() => {
    clearTimeouts();

    // 延迟隐藏预览
    leaveTimeoutRef.current = setTimeout(() => {
      setHoverState({
        hoveredKey: null,
        showPreview: false,
        mousePosition: { x: 0, y: 0 },
        elementData: null
      });
    }, leaveDelay);
  }, [leaveDelay, clearTimeouts]);

  const clearHover = useCallback(() => {
    clearTimeouts();
    setHoverState({
      hoveredKey: null,
      showPreview: false,
      mousePosition: { x: 0, y: 0 },
      elementData: null
    });
  }, [clearTimeouts]);

  // 兼容旧API的函数
  const showPreview = useCallback((elementData: any, mouseEvent: React.MouseEvent) => {
    console.log('🎯 showPreview called with:', { elementData, x: mouseEvent.clientX, y: mouseEvent.clientY });
    handleNodeHover('temp-key', elementData, mouseEvent);
  }, [handleNodeHover]);

  const hidePreview = useCallback(() => {
    console.log('🚫 hidePreview called');
    handleNodeLeave();
  }, [handleNodeLeave]);

  const updateMousePosition = useCallback((mouseEvent: React.MouseEvent) => {
    console.log('📍 updateMousePosition called:', { x: mouseEvent.clientX, y: mouseEvent.clientY });
    setHoverState(prev => ({
      ...prev,
      mousePosition: { x: mouseEvent.clientX, y: mouseEvent.clientY }
    }));
  }, []);

  return {
    hoverState,
    handleNodeHover,
    handleNodeLeave,
    clearHover,
    showPreview,
    hidePreview,
    updateMousePosition
  };
}