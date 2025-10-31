// src/modules/structural-matching/ui/components/element-structure-tree/use-tree-hover.ts
// module: structural-matching | layer: ui | role: 树节点悬停Hook
// summary: 处理树节点悬停事件和预览显示的Hook

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TreeHoverState {
  visible: boolean;
  mousePosition: { x: number; y: number };
  elementData: any;
}

export interface UseTreeHoverOptions {
  /** 悬停延迟时间（毫秒） */
  hoverDelay?: number;
  /** 离开延迟时间（毫秒） */
  leaveDelay?: number;
}

/**
 * 树节点悬停Hook
 */
export const useTreeHover = (options: UseTreeHoverOptions = {}) => {
  const { hoverDelay = 300, leaveDelay = 100 } = options;
  
  const [hoverState, setHoverState] = useState<TreeHoverState>({
    visible: false,
    mousePosition: { x: 0, y: 0 },
    elementData: null
  });

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 显示预览
  const showPreview = useCallback((mouseX: number, mouseY: number, elementData: any) => {
    // 清除之前的超时
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setHoverState({
        visible: true,
        mousePosition: { x: mouseX, y: mouseY },
        elementData
      });
    }, hoverDelay);
  }, [hoverDelay]);

  // 隐藏预览
  const hidePreview = useCallback(() => {
    // 清除显示的超时
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // 延迟隐藏
    leaveTimeoutRef.current = setTimeout(() => {
      setHoverState(prev => ({ ...prev, visible: false }));
    }, leaveDelay);
  }, [leaveDelay]);

  // 更新鼠标位置
  const updateMousePosition = useCallback((mouseX: number, mouseY: number) => {
    setHoverState(prev => ({
      ...prev,
      mousePosition: { x: mouseX, y: mouseY }
    }));
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    hoverState,
    showPreview,
    hidePreview,
    updateMousePosition,
    cleanup
  };
};