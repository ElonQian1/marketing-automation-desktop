// 拖拽恢复器 - 修复过度修复导致的基础功能丢失
// 当拖拽修复过度时，恢复基础拖拽功能

import { useEffect, useRef, useCallback } from 'react';

export interface DragRestoreOptions {
  /** 是否启用恢复 */
  enabled?: boolean;
  /** 恢复模式 */
  mode?: 'gentle' | 'reset' | 'rebuild';
  /** 调试模式 */
  debug?: boolean;
  /** 目标选择器 */
  targets?: string[];
}

interface RestoreState {
  isActive: boolean;
  restoreCount: number;
  lastRestore: number;
  originalStyles: Map<HTMLElement, any>;
}

/**
 * 拖拽恢复器 Hook
 * 恢复被过度修复破坏的基础拖拽功能
 */
export function useDragRestore(options: DragRestoreOptions = {}) {
  const {
    enabled = true,
    mode = 'gentle',
    debug = false,
    targets = [
      '[data-resize-handle]',
      '[role="separator"]',
      '.ant-table-thead th',
      '.resizable-header'
    ]
  } = options;

  const restoreRef = useRef<RestoreState>({
    isActive: false,
    restoreCount: 0,
    lastRestore: 0,
    originalStyles: new Map()
  });

  const log = useCallback((...args: any[]) => {
    if (debug) console.log('[DragRestore]', new Date().toLocaleTimeString(), ...args);
  }, [debug]);

  // 保存原始样式
  const saveOriginalStyles = useCallback((element: HTMLElement) => {
    if (!restoreRef.current.originalStyles.has(element)) {
      const computedStyle = window.getComputedStyle(element);
      restoreRef.current.originalStyles.set(element, {
        cursor: computedStyle.cursor,
        pointerEvents: computedStyle.pointerEvents,
        userSelect: computedStyle.userSelect,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position
      });
    }
  }, []);

  // 温和恢复 - 只恢复必要的样式
  const applyGentleRestore = useCallback(() => {
    targets.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        saveOriginalStyles(element);

        // 恢复基础的列宽拖拽样式
        const isResizeHandle = element.hasAttribute('data-resize-handle') || 
                              element.getAttribute('role') === 'separator';

        if (isResizeHandle) {
          // 确保基础拖拽光标正常
          element.style.cursor = 'col-resize';
          
          // 移除可能阻止交互的样式
          if (element.style.pointerEvents === 'none') {
            element.style.pointerEvents = 'auto';
          }
          
          // 保持用户不可选择但不影响拖拽
          element.style.userSelect = 'none';
          element.style.webkitUserSelect = 'none';
          
          // 移除过度的z-index（可能导致层级问题）
          if (parseInt(element.style.zIndex) > 10000) {
            element.style.zIndex = '1000';
          }
          
          log(`恢复拖拽手柄: ${selector}`);
        }
      });
    });
  }, [targets, log, saveOriginalStyles]);

  // 重置恢复 - 完全清除修复样式
  const applyResetRestore = useCallback(() => {
    targets.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        
        // 移除所有修复相关的属性
        element.removeAttribute('data-drag-fixed');
        element.removeAttribute('data-drag-protected');
        element.removeAttribute('data-pointer-events');
        element.removeAttribute('data-sensor-ignore');
        element.removeAttribute('data-dnd-exclude');
        
        // 清除内联样式（保留重要的）
        const isResizeHandle = element.hasAttribute('data-resize-handle') || 
                              element.getAttribute('role') === 'separator';
        
        if (isResizeHandle) {
          // 只保留必要的拖拽样式
          element.style.cssText = 'cursor: col-resize; user-select: none;';
        }
        
        log(`重置元素: ${selector}`);
      });
    });
  }, [targets, log]);

  // 重建恢复 - 重新构建基础拖拽功能
  const applyRebuildRestore = useCallback(() => {
    // 先重置
    applyResetRestore();
    
    // 然后重新构建
    targets.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        
        const isResizeHandle = element.hasAttribute('data-resize-handle') || 
                              element.getAttribute('role') === 'separator';

        if (isResizeHandle) {
          // 重新构建基础拖拽功能
          element.style.cursor = 'col-resize';
          element.style.userSelect = 'none';
          element.style.pointerEvents = 'auto';
          element.style.position = 'relative';
          element.style.zIndex = '1';
          
          // 添加必要的事件处理
          element.addEventListener('mouseenter', () => {
            element.style.cursor = 'col-resize';
          }, { passive: true });
          
          element.addEventListener('mouseleave', () => {
            // 保持光标样式
          }, { passive: true });
          
          log(`重建拖拽手柄: ${selector}`);
        }
      });
    });
  }, [targets, log, applyResetRestore]);

  // 检查基础拖拽功能是否正常
  const checkDragFunction = useCallback(() => {
    const issues: string[] = [];
    
    targets.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        const isResizeHandle = element.hasAttribute('data-resize-handle') || 
                              element.getAttribute('role') === 'separator';
        
        if (isResizeHandle) {
          const computedStyle = window.getComputedStyle(element);
          
          // 检查光标样式
          if (computedStyle.cursor !== 'col-resize') {
            issues.push(`元素 ${selector} 光标样式不正确: ${computedStyle.cursor}`);
          }
          
          // 检查指针事件
          if (computedStyle.pointerEvents === 'none') {
            issues.push(`元素 ${selector} 指针事件被禁用`);
          }
          
          // 检查可见性
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            issues.push(`元素 ${selector} 不可见或无尺寸`);
          }
        }
      });
    });
    
    log('拖拽功能检查结果:', issues.length === 0 ? '正常' : issues);
    return issues;
  }, [targets, log]);

  // 主恢复逻辑
  useEffect(() => {
    if (!enabled) return;

    restoreRef.current.isActive = true;
    restoreRef.current.lastRestore = Date.now();
    
    log(`启动拖拽恢复器，模式: ${mode}`);

    // 根据模式选择恢复策略
    switch (mode) {
      case 'gentle':
        applyGentleRestore();
        break;
      case 'reset':
        applyResetRestore();
        break;
      case 'rebuild':
        applyRebuildRestore();
        break;
    }

    restoreRef.current.restoreCount++;

    // 延迟检查恢复效果
    const checkTimer = setTimeout(() => {
      const issues = checkDragFunction();
      if (issues.length > 0) {
        log('发现问题，尝试重新恢复');
        if (mode === 'gentle') {
          applyResetRestore();
        }
      }
    }, 500);

    return () => {
      clearTimeout(checkTimer);
      restoreRef.current.isActive = false;
      log('拖拽恢复器已清理');
    };
  }, [enabled, mode, log, applyGentleRestore, applyResetRestore, applyRebuildRestore, checkDragFunction]);

  // 手动触发恢复
  const triggerRestore = useCallback((restoreMode?: typeof mode) => {
    const currentMode = restoreMode || mode;
    log(`手动触发恢复，模式: ${currentMode}`);
    
    switch (currentMode) {
      case 'gentle':
        applyGentleRestore();
        break;
      case 'reset':
        applyResetRestore();
        break;
      case 'rebuild':
        applyRebuildRestore();
        break;
    }
    
    restoreRef.current.restoreCount++;
    restoreRef.current.lastRestore = Date.now();
  }, [mode, log, applyGentleRestore, applyResetRestore, applyRebuildRestore]);

  return {
    isActive: restoreRef.current.isActive,
    restoreCount: restoreRef.current.restoreCount,
    lastRestore: restoreRef.current.lastRestore,
    triggerRestore,
    checkDragFunction,
    // 获取恢复状态
    getStatus: () => ({
      active: restoreRef.current.isActive,
      mode,
      restoreCount: restoreRef.current.restoreCount,
      lastRestore: new Date(restoreRef.current.lastRestore).toLocaleTimeString(),
      hasIssues: checkDragFunction().length > 0
    })
  };
}

export default useDragRestore;