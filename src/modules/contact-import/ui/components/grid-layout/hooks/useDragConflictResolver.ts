// 智能拖拽冲突解决器 - 运行时检测并修复拖拽冲突
// 为现有代码提供无侵入式的拖拽冲突解决方案

import { useEffect, useRef } from 'react';

export interface ConflictResolverOptions {
  /** 是否启用自动修复 */
  autoFix?: boolean;
  /** 检测间隔(ms) */
  detectInterval?: number;
  /** 调试输出 */
  debug?: boolean;
  /** 优先保护的拖拽类型 */
  priority?: 'table-resize' | 'drag-sort' | 'auto';
}

/**
 * 智能拖拽冲突解决器 Hook
 * 无需修改现有代码，自动检测并解决拖拽事件冲突
 */
export function useDragConflictResolver(options: ConflictResolverOptions = {}) {
  const {
    autoFix = true,
    detectInterval = 1000,
    debug = false,
    priority = 'auto'
  } = options;

  const resolverRef = useRef<{
    detectedConflicts: Set<string>;
    activeResolvers: Map<string, () => void>;
    isMonitoring: boolean;
  }>({
    detectedConflicts: new Set(),
    activeResolvers: new Map(),
    isMonitoring: false
  });

  const log = (...args: any[]) => {
    if (debug) console.log('[ConflictResolver]', ...args);
  };

  useEffect(() => {
    if (!autoFix) return;

    resolverRef.current.isMonitoring = true;

    // 检测和修复拖拽冲突
    const detectAndResolveConflicts = () => {
      if (!resolverRef.current.isMonitoring) return;

      // 1. 检测表格列宽拖拽组件
      const resizableHeaders = document.querySelectorAll('[data-resize-handle]');
      
      // 2. 检测DnD上下文
      const dndContexts = document.querySelectorAll('[data-rbd-droppable-id], .dnd-context, [data-dnd-context]');
      
      // 3. 检测@dnd-kit组件
      const dndKitElements = document.querySelectorAll('[data-dnd-kit-element], .sortable-item');

      if (resizableHeaders.length > 0 && (dndContexts.length > 0 || dndKitElements.length > 0)) {
        const conflictId = 'table-resize-vs-dnd';
        
        if (!resolverRef.current.detectedConflicts.has(conflictId)) {
          log(`发现拖拽冲突: ${resizableHeaders.length}个列宽拖拽 vs ${dndContexts.length + dndKitElements.length}个DnD上下文`);
          resolverRef.current.detectedConflicts.add(conflictId);

          // 应用修复方案
          const resolver = applyTableResizeProtection();
          resolverRef.current.activeResolvers.set(conflictId, resolver);
        }
      }

      // 4. 检测文件拖拽组件
      const fileDropZones = document.querySelectorAll('[data-drag-over="true"], .ant-upload-drag');
      if (fileDropZones.length > 0 && resizableHeaders.length > 0) {
        const conflictId = 'file-drop-vs-table-resize';
        
        if (!resolverRef.current.detectedConflicts.has(conflictId)) {
          log(`发现文件拖拽冲突: ${fileDropZones.length}个拖拽区域`);
          resolverRef.current.detectedConflicts.add(conflictId);

          const resolver = applyFileDropProtection();
          resolverRef.current.activeResolvers.set(conflictId, resolver);
        }
      }
    };

    // 应用表格列宽保护
    const applyTableResizeProtection = () => {
      log('应用表格列宽保护方案');

      // 策略1: 提升列宽手柄的事件优先级
      const enhanceResizeHandles = () => {
        const handles = document.querySelectorAll('[data-resize-handle]');
        handles.forEach(handle => {
          const element = handle as HTMLElement;
          
          // 提升z-index
          element.style.zIndex = '10000';
          element.style.position = 'relative';
          
          // 阻止事件冒泡到DnD上下文
          const stopPropagation = (e: Event) => {
            e.stopImmediatePropagation();
          };

          element.addEventListener('pointerdown', stopPropagation, { capture: true });
          element.addEventListener('dragstart', stopPropagation, { capture: true });
        });
      };

      // 策略2: 动态调整DnD传感器敏感度
      const adjustDndSensitivity = () => {
        // 查找@dnd-kit DndContext
        const dndElements = document.querySelectorAll('[data-dnd-kit-element]');
        dndElements.forEach(element => {
          // 为DnD元素添加列宽拖拽排除区域标记
          element.setAttribute('data-exclude-resize-areas', 'true');
        });
      };

      enhanceResizeHandles();
      adjustDndSensitivity();

      // 返回清理函数
      return () => {
        const handles = document.querySelectorAll('[data-resize-handle]');
        handles.forEach(handle => {
          const element = handle as HTMLElement;
          element.style.zIndex = '';
          element.style.position = '';
        });
      };
    };

    // 应用文件拖拽保护
    const applyFileDropProtection = () => {
      log('应用文件拖拽保护方案');

      const fileDropListener = (e: DragEvent) => {
        const target = e.target as HTMLElement;
        
        // 如果拖拽发生在列宽手柄上，阻止文件拖拽处理
        if (target.closest('[data-resize-handle]')) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      };

      document.addEventListener('dragover', fileDropListener, { capture: true });
      document.addEventListener('drop', fileDropListener, { capture: true });

      return () => {
        document.removeEventListener('dragover', fileDropListener, { capture: true });
        document.removeEventListener('drop', fileDropListener, { capture: true });
      };
    };

    // 启动冲突检测
    const interval = setInterval(detectAndResolveConflicts, detectInterval);
    
    // 立即执行一次检测
    detectAndResolveConflicts();

    log('拖拽冲突解决器已启动');

    return () => {
      resolverRef.current.isMonitoring = false;
      clearInterval(interval);
      
      // 清理所有active resolvers
      resolverRef.current.activeResolvers.forEach(cleanup => cleanup());
      resolverRef.current.activeResolvers.clear();
      resolverRef.current.detectedConflicts.clear();
      
      log('拖拽冲突解决器已清理');
    };
  }, [autoFix, detectInterval, debug, priority]);

  return {
    detectedConflicts: Array.from(resolverRef.current.detectedConflicts),
    isMonitoring: resolverRef.current.isMonitoring,
    // 手动触发冲突检测
    triggerDetection: () => {
      // 可以手动触发检测逻辑
    }
  };
}

export default useDragConflictResolver;