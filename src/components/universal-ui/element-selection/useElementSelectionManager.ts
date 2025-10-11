// src/components/universal-ui/element-selection/useElementSelectionManager.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UIElement } from '../../../api/universalUIAPI';
import type { ElementSelectionState } from './ElementSelectionPopover';

// 隐藏元素的状态接口
interface HiddenElement {
  id: string;
  hiddenAt: number; // 隐藏时间戳
}

// 交互管理器的配置选项
interface ElementSelectionManagerOptions {
  /** 隐藏元素的自动恢复时间（毫秒），默认60秒 */
  autoRestoreTime?: number;
  /** 是否启用悬停效果 */
  enableHover?: boolean;
  /** 悬停延迟时间（毫秒） */
  hoverDelay?: number;
}

/**
 * 元素选择管理器 Hook
 * 专门处理可视化视图中的元素选择交互逻辑
 */
export const useElementSelectionManager = (
  elements: UIElement[],
  onElementSelected?: (element: UIElement) => void,
  options: ElementSelectionManagerOptions = {}
) => {
  const {
    autoRestoreTime = 60000, // 60秒后自动恢复隐藏的元素
    enableHover = true,
    hoverDelay = 300
  } = options;

  // 当前选中但未确认的元素
  const [pendingSelection, setPendingSelection] = useState<ElementSelectionState | null>(null);
  
  // 隐藏的元素列表
  const [hiddenElements, setHiddenElements] = useState<HiddenElement[]>([]);
  
  // 悬停的元素
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  // 定时器引用
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restoreTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      restoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      restoreTimeoutsRef.current.clear();
    };
  }, []);

  // 检查元素是否被隐藏
  const isElementHidden = useCallback((elementId: string): boolean => {
    return hiddenElements.some(hidden => hidden.id === elementId);
  }, [hiddenElements]);

  // 获取可见的元素列表
  const getVisibleElements = useCallback((): UIElement[] => {
    const hiddenIds = new Set(hiddenElements.map(h => h.id));
    return elements.filter(element => !hiddenIds.has(element.id));
  }, [elements, hiddenElements]);

  // 处理元素点击
  const handleElementClick = useCallback((element: UIElement, clickPosition: { x: number; y: number }) => {
    console.log('🚀 [useElementSelectionManager] handleElementClick 被调用:', {
      elementId: element.id,
      elementText: element.text,
      clickPosition,
      isHidden: isElementHidden(element.id),
      currentPendingSelection: pendingSelection
    });
    
    // 如果元素被隐藏，不处理点击
    if (isElementHidden(element.id)) {
      console.log('⚠️ [useElementSelectionManager] 元素被隐藏，跳过点击处理');
      return;
    }

    console.log('✅ [useElementSelectionManager] 设置 pendingSelection');
    
    // 直接设置新的选择状态
    const newSelection = {
      element,
      position: clickPosition,
      confirmed: false
    };
    
    console.log('📝 [useElementSelectionManager] 新的 selection 状态:', newSelection);
    setPendingSelection(newSelection);
  }, [isElementHidden, pendingSelection]);

  // 处理元素悬停
  const handleElementHover = useCallback((elementId: string | null) => {
    if (!enableHover) return;

    // 清除之前的悬停定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (elementId) {
      // 设置延迟悬停
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredElement(elementId);
      }, hoverDelay);
    } else {
      setHoveredElement(null);
    }
  }, [enableHover, hoverDelay]);

  // 确认选择元素
  const confirmSelection = useCallback(() => {
    console.log('🔍 confirmSelection called, pendingSelection:', pendingSelection);
    if (pendingSelection) {
      console.log('✅ 确认选择元素:', pendingSelection.element.text, 'ID:', pendingSelection.element.id);
      
      // 先清除待确认状态，避免在回调中重新触发
      console.log('🧹 正在清除pendingSelection...');
      setPendingSelection(null);
      console.log('🧹 setPendingSelection(null) 已调用');
      
      // 延迟调用回调函数，确保状态已经更新
      setTimeout(() => {
        console.log('📞 延迟调用 onElementSelected 回调');
        onElementSelected?.(pendingSelection.element);
      }, 0);
    } else {
      console.log('❌ confirmSelection: 没有待确认的选择');
    }
  }, [pendingSelection, onElementSelected]);

  // 隐藏元素
  const hideElement = useCallback(() => {
    if (pendingSelection) {
      console.log('👁️ 隐藏元素:', pendingSelection.element.text);
      
      const elementId = pendingSelection.element.id;
      const hiddenElement: HiddenElement = {
        id: elementId,
        hiddenAt: Date.now()
      };
      
      // 添加到隐藏列表
      setHiddenElements(prev => [...prev, hiddenElement]);
      
      // 设置自动恢复定时器
      const restoreTimeout = setTimeout(() => {
        setHiddenElements(prev => prev.filter(h => h.id !== elementId));
        restoreTimeoutsRef.current.delete(elementId);
      }, autoRestoreTime);
      
      restoreTimeoutsRef.current.set(elementId, restoreTimeout);
      
      // 清除待确认状态
      setPendingSelection(null);
    }
  }, [pendingSelection, autoRestoreTime]);

  // 取消选择
  const cancelSelection = useCallback(() => {
    console.log('❌ 取消选择');
    setPendingSelection(null);
  }, []);

  // 直接确认指定元素（跳过依赖 pendingSelection 的竞态）
  const confirmElement = useCallback((element: UIElement) => {
    console.log('✅ [useElementSelectionManager] 直接确认指定元素:', element.id);
    // 清除待选，避免残留气泡
    setPendingSelection(null);
    // 直接触发回调，避免依赖 setState 的时序
    try {
      onElementSelected?.(element);
    } catch (err) {
      console.error('❌ confirmElement 回调异常:', err);
    }
  }, [onElementSelected]);

  // 恢复指定元素
  const restoreElement = useCallback((elementId: string) => {
    console.log('🔄 恢复元素:', elementId);
    
    setHiddenElements(prev => prev.filter(h => h.id !== elementId));
    
    // 清除对应的定时器
    const timeout = restoreTimeoutsRef.current.get(elementId);
    if (timeout) {
      clearTimeout(timeout);
      restoreTimeoutsRef.current.delete(elementId);
    }
  }, []);

  // 恢复所有隐藏的元素
  const restoreAllElements = useCallback(() => {
    console.log('🔄 恢复所有隐藏元素');
    
    // 清除所有定时器
    restoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    restoreTimeoutsRef.current.clear();
    
    // 清空隐藏列表
    setHiddenElements([]);
  }, []);

  // 🆕 全局清理机制 - 重置所有状态
  const clearAllStates = useCallback(() => {
    console.log('🧹 [ElementSelectionManager] 执行全局清理');
    
    // 清除所有状态
    setPendingSelection(null);
    setHiddenElements([]);
    setHoveredElement(null);
    
    // 清除所有定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    restoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    restoreTimeoutsRef.current.clear();
    
    console.log('✅ [ElementSelectionManager] 全局清理完成');
  }, []);

  // 🆕 强制隐藏气泡（紧急清理）
  const forceHidePopover = useCallback(() => {
    console.log('⚡ [ElementSelectionManager] 强制隐藏气泡');
    setPendingSelection(null);
  }, []);

  // 获取元素的显示状态
  const getElementDisplayState = useCallback((elementId: string) => {
    const isHidden = isElementHidden(elementId);
    const isHovered = hoveredElement === elementId;
    const isPending = pendingSelection?.element.id === elementId;
    
    return {
      isHidden,
      isHovered,
      isPending,
      isVisible: !isHidden
    };
  }, [isElementHidden, hoveredElement, pendingSelection]);

  return {
    // 状态
    pendingSelection,
    hiddenElements,
    hoveredElement,
    
    // 数据
    visibleElements: getVisibleElements(),
    
    // 事件处理器
    handleElementClick,
    handleElementHover,
    confirmSelection,
  confirmElement,
    hideElement,
    cancelSelection,
    
    // 管理方法
    restoreElement,
    restoreAllElements,
    getElementDisplayState,
    
    // 🆕 清理方法
    clearAllStates,
    forceHidePopover,
    
    // 工具方法
    isElementHidden
  };
};