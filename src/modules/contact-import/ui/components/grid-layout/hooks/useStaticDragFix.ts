// 一次性拖拽修复工具 - 静态修复，无循环，无过度干预
// 专门解决表格列宽拖拽问题的简单有效方案

import { useEffect, useRef } from 'react';

export interface StaticDragFixOptions {
  /** 是否启用一次性修复 */
  enabled?: boolean;
  /** 调试模式 */
  debug?: boolean;
  /** 目标选择器 */
  targets?: string[];
}

/**
 * 静态拖拽修复器 Hook
 * 一次性修复，无循环，无过度干预
 */
export function useStaticDragFix(options: StaticDragFixOptions = {}) {
  const {
    enabled = true,
    debug = false,
    targets = [
      '[data-resize-handle]',
      '[role="separator"]'
    ]
  } = options;

  const fixedRef = useRef<boolean>(false);

  const log = (...args: any[]) => {
    if (debug) console.log('[StaticDragFix]', ...args);
  };

  useEffect(() => {
    if (!enabled || fixedRef.current) return;

    const applySimpleFix = () => {
      log('开始一次性拖拽修复');
      
      let fixedCount = 0;
      
      targets.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const element = el as HTMLElement;
          
          // 只设置必要的样式，不过度干预
          element.style.cursor = 'col-resize';
          element.style.userSelect = 'none';
          element.style.webkitUserSelect = 'none';
          
          // 确保可交互
          if (element.style.pointerEvents === 'none') {
            element.style.pointerEvents = 'auto';
          }
          
          // 移除可能的干扰属性
          element.removeAttribute('draggable');
          
          fixedCount++;
        });
      });
      
      log(`修复完成，处理了 ${fixedCount} 个拖拽手柄`);
      fixedRef.current = true;
    };

    // 立即执行一次修复
    applySimpleFix();

    // 延迟再执行一次，确保DOM完全加载
    const timer = setTimeout(applySimpleFix, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, debug, targets]);

  // 手动触发修复
  const triggerFix = () => {
    fixedRef.current = false;
    
    targets.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        
        // 简单有效的修复
        element.style.cursor = 'col-resize';
        element.style.userSelect = 'none';
        element.style.pointerEvents = 'auto';
        element.removeAttribute('draggable');
      });
    });
    
    fixedRef.current = true;
    log('手动修复完成');
  };

  return {
    isFixed: fixedRef.current,
    triggerFix
  };
}

export default useStaticDragFix;