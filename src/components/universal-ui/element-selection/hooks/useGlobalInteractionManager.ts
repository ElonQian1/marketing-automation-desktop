/**
 * 交互事件管理模块
 * 专门处理点击空白、键盘事件等全局交互
 */

import { useEffect, useCallback, useRef } from 'react';

export interface GlobalInteractionOptions {
  /** 是否启用点击空白清理 */
  enableClickOutside?: boolean;
  /** 是否启用ESC键清理 */
  enableEscapeKey?: boolean;
  /** 点击空白的延迟清理时间（毫秒） */
  clickOutsideDelay?: number;
  /** 排除的元素选择器 */
  excludeSelectors?: string[];
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 全局交互管理 Hook
 * 处理点击空白、键盘事件等交互场景
 */
export const useGlobalInteractionManager = (
  options: GlobalInteractionOptions = {}
) => {
  const {
    enableClickOutside = true,
    enableEscapeKey = true,
    clickOutsideDelay = 100,
    excludeSelectors = [
      '.ant-popover',
      '.ant-modal',
      '.ant-dropdown',
      '.element-selection-popover'
    ],
    debug = false
  } = options;

  const cleanupCallbackRef = useRef<(() => void) | null>(null);
  const isActiveRef = useRef(false);

  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('🎯 [GlobalInteraction]', ...args);
    }
  }, [debug]);

  // 检查点击是否在排除区域内
  const isClickInExcludedArea = useCallback((event: MouseEvent): boolean => {
    const target = event.target as Element;
    
    return excludeSelectors.some(selector => {
      try {
        return target.closest(selector) !== null;
      } catch (e) {
        log('选择器错误:', selector, e);
        return false;
      }
    });
  }, [excludeSelectors, log]);

  // 处理点击空白事件
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!isActiveRef.current || !cleanupCallbackRef.current) {
      return;
    }

    log('检测到点击事件:', {
      target: event.target,
      isInExcludedArea: isClickInExcludedArea(event)
    });

    // 如果点击在排除区域内，不处理
    if (isClickInExcludedArea(event)) {
      log('点击在排除区域内，跳过处理');
      return;
    }

    // 延迟执行清理，避免与其他事件冲突
    setTimeout(() => {
      if (cleanupCallbackRef.current && isActiveRef.current) {
        log('执行点击空白清理');
        cleanupCallbackRef.current();
      }
    }, clickOutsideDelay);
  }, [isClickInExcludedArea, clickOutsideDelay, log]);

  // 处理ESC键事件
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (!isActiveRef.current || !cleanupCallbackRef.current) {
      return;
    }

    if (event.key === 'Escape') {
      log('检测到ESC键，执行清理');
      event.preventDefault();
      event.stopPropagation();
      cleanupCallbackRef.current();
    }
  }, [log]);

  // 注册全局事件监听器
  const registerGlobalListeners = useCallback(() => {
    if (enableClickOutside) {
      document.addEventListener('mousedown', handleClickOutside, true);
      log('已注册点击空白监听器');
    }

    if (enableEscapeKey) {
      document.addEventListener('keydown', handleEscapeKey, true);
      log('已注册ESC键监听器');
    }
  }, [enableClickOutside, enableEscapeKey, handleClickOutside, handleEscapeKey, log]);

  // 移除全局事件监听器
  const removeGlobalListeners = useCallback(() => {
    if (enableClickOutside) {
      document.removeEventListener('mousedown', handleClickOutside, true);
      log('已移除点击空白监听器');
    }

    if (enableEscapeKey) {
      document.removeEventListener('keydown', handleEscapeKey, true);
      log('已移除ESC键监听器');
    }
  }, [enableClickOutside, enableEscapeKey, handleClickOutside, handleEscapeKey, log]);

  // 激活交互监听
  const activateInteraction = useCallback((cleanupCallback: () => void) => {
    log('激活全局交互监听');
    
    cleanupCallbackRef.current = cleanupCallback;
    isActiveRef.current = true;
    registerGlobalListeners();
  }, [registerGlobalListeners, log]);

  // 停用交互监听
  const deactivateInteraction = useCallback(() => {
    log('停用全局交互监听');
    
    isActiveRef.current = false;
    cleanupCallbackRef.current = null;
    removeGlobalListeners();
  }, [removeGlobalListeners, log]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      deactivateInteraction();
    };
  }, [deactivateInteraction]);

  return {
    activateInteraction,
    deactivateInteraction,
    isActive: isActiveRef.current
  };
};

/**
 * 专门用于气泡组件的交互管理
 */
export const usePopoverInteractionManager = (
  onClickOutside?: () => void,
  onEscapeKey?: () => void
) => {
  const interactionManager = useGlobalInteractionManager({
    enableClickOutside: !!onClickOutside,
    enableEscapeKey: !!onEscapeKey,
    excludeSelectors: [
      '.ant-popover',
      '.ant-modal', 
      '.ant-dropdown',
      '.element-selection-popover',
      '.element-discovery-modal'
    ],
    debug: true
  });

  const activatePopoverInteraction = useCallback(() => {
    const cleanupCallback = () => {
      onClickOutside?.();
      onEscapeKey?.();
    };
    
    interactionManager.activateInteraction(cleanupCallback);
  }, [interactionManager, onClickOutside, onEscapeKey]);

  const deactivatePopoverInteraction = useCallback(() => {
    interactionManager.deactivateInteraction();
  }, [interactionManager]);

  return {
    activatePopoverInteraction,
    deactivatePopoverInteraction
  };
};