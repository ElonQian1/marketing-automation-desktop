/**
 * 增强的元素选择管理器 Hook
 * 在原有基础上增加父子元素选择功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UIElement } from '../../../api/universalUIAPI';
import type { ElementSelectionState } from './ElementSelectionPopover';
import type { AlternativeElement } from './hierarchy/types';
import type { EnhancedElementSelectionState } from './enhanced-popover/EnhancedSelectionPopover';

// 隐藏元素的状态接口
interface HiddenElement {
  id: string;
  hiddenAt: number;
}

// 增强选择管理器的配置选项
interface EnhancedElementSelectionManagerOptions {
  autoRestoreTime?: number;
  enableHover?: boolean;
  hoverDelay?: number;
  enableAlternatives?: boolean;
  allElements?: UIElement[]; // 用于构建层次结构
}

/**
 * 增强的元素选择管理器 Hook
 * 支持父子元素选择和替代元素推荐
 */
export const useEnhancedElementSelectionManager = (
  elements: UIElement[],
  onElementSelected?: (element: UIElement) => void,
  onAlternativeSelected?: (alternative: AlternativeElement) => void,
  options: EnhancedElementSelectionManagerOptions = {}
) => {
  const {
    autoRestoreTime = 60000,
    enableHover = true,
    hoverDelay = 300,
    enableAlternatives = true,
    allElements = elements
  } = options;

  // 当前选中但未确认的元素（增强版）
  const [pendingSelection, setPendingSelection] = useState<EnhancedElementSelectionState | null>(null);
  
  // 隐藏的元素列表
  const [hiddenElements, setHiddenElements] = useState<HiddenElement[]>([]);
  
  // 悬停的元素ID
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  // 定时器引用
  const restoreTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      restoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
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

  // 处理元素点击（增强版）
  const handleElementClick = useCallback((element: UIElement, clickPosition: { x: number; y: number }) => {
    if (isElementHidden(element.id)) {
      return;
    }

    console.log('🎯 元素点击 (增强版):', element.id, element.text, '坐标:', clickPosition);
    console.log('📊 所有元素数量:', allElements.length);
    console.log('🔄 清除旧选择状态'); // 🆕 添加清除日志
    
    // 🆕 先清除旧的选择状态，确保气泡能刷新
    setPendingSelection(null);
    
    // 短暂延迟后设置新的选择状态，确保 React 能检测到变化
    setTimeout(() => {
      console.log('✨ 设置新的选择状态');
      const enhancedSelection: EnhancedElementSelectionState = {
        element,
        position: clickPosition,
        confirmed: false,
        allElements: enableAlternatives ? allElements : undefined
      };
      
      setPendingSelection(enhancedSelection);
    }, 10); // 10ms 延迟确保状态刷新
  }, [isElementHidden, enableAlternatives, allElements]);

  // 处理元素悬停
  const handleElementHover = useCallback((elementId: string | null) => {
    if (!enableHover) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (elementId) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredElement(elementId);
      }, hoverDelay);
    } else {
      setHoveredElement(null);
    }
  }, [enableHover, hoverDelay]);

  // 确认选择元素
  const confirmSelection = useCallback(() => {
    console.log('🔍 confirmSelection called (增强版), pendingSelection:', pendingSelection);
    if (pendingSelection) {
      console.log('✅ 确认选择元素:', pendingSelection.element.text, 'ID:', pendingSelection.element.id);
      
      setPendingSelection(null);
      
      setTimeout(() => {
        console.log('📞 延迟调用 onElementSelected 回调');
        onElementSelected?.(pendingSelection.element);
      }, 0);
    } else {
      console.log('❌ confirmSelection: 没有待确认的选择');
    }
  }, [pendingSelection, onElementSelected]);

  // 处理替代元素选择
  const handleAlternativeSelection = useCallback((alternative: AlternativeElement) => {
    console.log('🔄 选择替代元素:', alternative);
    
    // 清除当前选择
    setPendingSelection(null);
    
    // 通知替代元素选择
    if (onAlternativeSelected) {
      onAlternativeSelected(alternative);
    } else {
      // 如果没有专门的替代元素处理器，就当作普通元素选择
      onElementSelected?.(alternative.node.element);
    }
  }, [onAlternativeSelected, onElementSelected]);

  // 隐藏元素
  const hideElement = useCallback(() => {
    if (pendingSelection) {
      console.log('👁️ 隐藏元素:', pendingSelection.element.text);
      
      const elementId = pendingSelection.element.id;
      const hiddenElement: HiddenElement = {
        id: elementId,
        hiddenAt: Date.now()
      };
      
      setHiddenElements(prev => [...prev, hiddenElement]);
      
      const restoreTimeout = setTimeout(() => {
        setHiddenElements(prev => prev.filter(h => h.id !== elementId));
        restoreTimeoutsRef.current.delete(elementId);
      }, autoRestoreTime);
      
      restoreTimeoutsRef.current.set(elementId, restoreTimeout);
      setPendingSelection(null);
    }
  }, [pendingSelection, autoRestoreTime]);

  // 取消选择
  const cancelSelection = useCallback(() => {
    console.log('❌ 取消选择 (增强版)');
    setPendingSelection(null);
  }, []);

  // 恢复指定元素
  const restoreElement = useCallback((elementId: string) => {
    console.log('🔄 恢复元素:', elementId);
    
    setHiddenElements(prev => prev.filter(h => h.id !== elementId));
    
    const timeout = restoreTimeoutsRef.current.get(elementId);
    if (timeout) {
      clearTimeout(timeout);
      restoreTimeoutsRef.current.delete(elementId);
    }
  }, []);

  // 恢复所有元素
  const restoreAllElements = useCallback(() => {
    console.log('🔄 恢复所有隐藏元素');
    
    restoreTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    restoreTimeoutsRef.current.clear();
    setHiddenElements([]);
  }, []);

  // 获取元素显示状态
  const getElementDisplayState = useCallback((elementId: string) => {
    const isHidden = isElementHidden(elementId);
    return {
      isHidden,
      isVisible: !isHidden, // 添加缺失的属性
      isHovered: hoveredElement === elementId,
      isPending: pendingSelection?.element.id === elementId
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
    hideElement,
    cancelSelection,
    handleAlternativeSelection, // 🆕 新增
    selectAlternative: handleAlternativeSelection, // 🆕 暴露别名
    
    // 管理方法
    restoreElement,
    restoreAllElements,
    getElementDisplayState,
    
    // 工具方法
    isElementHidden,
    
    // 🆕 新增：增强模式标识
    isEnhanced: true
  };
};