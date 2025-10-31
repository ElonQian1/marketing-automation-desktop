// src/modules/structural-matching/ui/components/visual-preview/use-tree-visual-coordination.ts
// module: structural-matching | layer: hooks | role: 树节点与可视化预览联动管理
// summary: 管理元素结构树与可视化预览面板的hover状态协调

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 树节点与可视化预览联动Hook
 */
export interface UseTreeVisualCoordinationProps {
  /** hover延迟时间（毫秒） */
  hoverDelay?: number;
  /** 是否启用联动 */
  enableCoordination?: boolean;
}

export function useTreeVisualCoordination({
  hoverDelay = 200,
  enableCoordination = true
}: UseTreeVisualCoordinationProps = {}) {
  // 当前高亮的元素ID
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  
  // hover延迟定时器
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 处理树节点hover事件
   */
  const handleTreeNodeHover = useCallback((elementId: string | null) => {
    if (!enableCoordination) return;

    // 清除之前的定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (elementId) {
      // 延迟设置高亮，避免快速移动时的闪烁
      hoverTimeoutRef.current = setTimeout(() => {
        console.log('🎯 [TreeVisualCoordination] 设置高亮元素:', elementId);
        setHighlightedElementId(elementId);
      }, hoverDelay);
    } else {
      // 立即清除高亮
      setHighlightedElementId(null);
    }
  }, [enableCoordination, hoverDelay]);

  /**
   * 处理可视化预览hover事件
   */
  const handleVisualPreviewHover = useCallback((elementId: string | null) => {
    if (!enableCoordination) return;

    // 可视化预览的hover直接设置，不需要延迟
    setHighlightedElementId(elementId);
  }, [enableCoordination]);

  /**
   * 强制设置高亮元素（用于点击等操作）
   */
  const setHighlight = useCallback((elementId: string | null) => {
    // 清除延迟定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    setHighlightedElementId(elementId);
  }, []);

  /**
   * 清除所有高亮状态
   */
  const clearHighlight = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHighlightedElementId(null);
  }, []);

  return {
    // 状态
    highlightedElementId,
    
    // 事件处理器
    handleTreeNodeHover,
    handleVisualPreviewHover,
    
    // 控制方法
    setHighlight,
    clearHighlight,
    
    // 配置
    isCoordinationEnabled: enableCoordination
  };
}