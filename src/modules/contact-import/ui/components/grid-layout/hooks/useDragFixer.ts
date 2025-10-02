// 拖拽强化修复器 - 解决顽固的拖拽冲突问题
// 当标准解决方案不足时的强化修复策略

import { useEffect, useRef, useCallback } from 'react';

export interface DragFixerOptions {
  /** 是否启用强化修复 */
  enabled?: boolean;
  /** 修复策略强度 */
  intensity?: 'gentle' | 'moderate' | 'aggressive';
  /** 调试模式 */
  debug?: boolean;
  /** 目标表格选择器 */
  targetTables?: string[];
}

interface FixerState {
  isActive: boolean;
  fixCount: number;
  lastFix: number;
  activeHandles: Set<HTMLElement>;
}

/**
 * 强化拖拽修复器
 * 专门处理顽固的表格列宽拖拽冲突问题
 */
export function useDragFixer(options: DragFixerOptions = {}) {
  const {
    enabled = true,
    intensity = 'moderate',
    debug = false,
    targetTables = [
      '.ant-table-container',
      '[data-testid*="table"]',
      '.contact-import-table'
    ]
  } = options;

  const fixerRef = useRef<FixerState>({
    isActive: false,
    fixCount: 0,
    lastFix: 0,
    activeHandles: new Set()
  });

  const log = useCallback((...args: any[]) => {
    if (debug) console.log('[DragFixer]', new Date().toLocaleTimeString(), ...args);
  }, [debug]);

  // 强化策略1: 直接DOM操作修复
  const applyDirectDomFix = useCallback(() => {
    const handles = document.querySelectorAll('[data-resize-handle], [role="separator"]');
    
    handles.forEach(handle => {
      const element = handle as HTMLElement;
      
      // 清除可能冲突的属性
      element.removeAttribute('draggable');
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
      element.style.touchAction = 'none';
      
      // 强制最高优先级
      element.style.zIndex = '99999';
      element.style.position = 'relative';
      
      // 添加强化标记
      element.setAttribute('data-drag-fixed', 'true');
      element.setAttribute('data-pointer-events', 'auto');
      
      fixerRef.current.activeHandles.add(element);
    });

    log(`应用直接DOM修复，处理 ${handles.length} 个拖拽手柄`);
  }, [log]);

  // 强化策略2: 事件劫持和重新分发
  const applyEventHijacking = useCallback(() => {
    const hijackPointerEvents = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.closest('[data-resize-handle]')) {
        log('劫持指针事件，确保列宽拖拽优先');
        
        // 停止所有现有传播
        e.stopImmediatePropagation();
        e.preventDefault();
        
        // 标记为拖拽手柄事件
        (e as any)._isDragHandle = true;
        
        // 重新创建事件并分发给列宽处理器
        const newEvent = new PointerEvent(e.type, {
          pointerId: e.pointerId,
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button,
          buttons: e.buttons,
          bubbles: false, // 不冒泡，直接处理
          cancelable: true
        });
        
        // 直接发送给目标元素
        target.dispatchEvent(newEvent);
      }
    };

    // 在最早阶段拦截
    document.addEventListener('pointerdown', hijackPointerEvents, {
      capture: true,
      passive: false
    });

    return () => {
      document.removeEventListener('pointerdown', hijackPointerEvents, { capture: true });
    };
  }, [log]);

  // 强化策略3: DnD库特定修复
  const applyDndLibraryFix = useCallback(() => {
    const fixDndKitSensors = () => {
      // 查找并修复 @dnd-kit 传感器
      const dndContexts = document.querySelectorAll('[data-dnd-kit-element]');
      dndContexts.forEach(context => {
        const element = context as HTMLElement;
        element.setAttribute('data-sensor-ignore', '[data-resize-handle]');
      });
    };

    const fixReactBeautifulDnd = () => {
      // 查找并修复 react-beautiful-dnd
      const droppables = document.querySelectorAll('[data-rbd-droppable-id]');
      droppables.forEach(droppable => {
        const element = droppable as HTMLElement;
        element.setAttribute('data-dnd-exclude', '[data-resize-handle]');
      });
    };

    fixDndKitSensors();
    fixReactBeautifulDnd();
    
    log('应用DnD库特定修复');
  }, [log]);

  // 强化策略4: 实时监控和重新修复
  const applyRealtimeMonitoring = useCallback(() => {
    let monitoringTimer: NodeJS.Timeout;

    const continuousMonitor = () => {
      // 检查修复状态
      const brokenHandles = Array.from(document.querySelectorAll('[data-resize-handle]'))
        .filter(handle => !(handle as HTMLElement).hasAttribute('data-drag-fixed'));

      if (brokenHandles.length > 0) {
        log(`发现 ${brokenHandles.length} 个未修复的拖拽手柄，重新应用修复`);
        applyDirectDomFix();
        applyDndLibraryFix();
        fixerRef.current.fixCount++;
      }

      // 每200ms检查一次
      monitoringTimer = setTimeout(continuousMonitor, 200);
    };

    continuousMonitor();

    return () => {
      if (monitoringTimer) clearTimeout(monitoringTimer);
    };
  }, [log, applyDirectDomFix, applyDndLibraryFix]);

  // 根据强度选择策略组合
  const getFixingStrategies = useCallback(() => {
    switch (intensity) {
      case 'gentle':
        return [applyDirectDomFix];
      case 'moderate':
        return [applyDirectDomFix, applyDndLibraryFix];
      case 'aggressive':
        return [
          applyDirectDomFix,
          applyEventHijacking,
          applyDndLibraryFix,
          applyRealtimeMonitoring
        ];
      default:
        return [applyDirectDomFix, applyDndLibraryFix];
    }
  }, [intensity, applyDirectDomFix, applyEventHijacking, applyDndLibraryFix, applyRealtimeMonitoring]);

  // 主修复逻辑
  useEffect(() => {
    if (!enabled) return;

    fixerRef.current.isActive = true;
    fixerRef.current.lastFix = Date.now();
    
    log(`启动强化拖拽修复器，强度: ${intensity}`);

    const strategies = getFixingStrategies();
    const cleanupFns: (() => void)[] = [];

    // 立即应用所有修复策略
    strategies.forEach(strategy => {
      const cleanup = strategy();
      if (typeof cleanup === 'function') cleanupFns.push(cleanup);
    });

    // 延迟额外修复（确保DOM完全加载）
    const delayedFix = setTimeout(() => {
      strategies.forEach(strategy => {
        strategy();
      });
      fixerRef.current.fixCount++;
    }, 100);

    return () => {
      fixerRef.current.isActive = false;
      cleanupFns.forEach(fn => fn());
      clearTimeout(delayedFix);
      
      // 清理修复标记
      fixerRef.current.activeHandles.forEach(handle => {
        handle.removeAttribute('data-drag-fixed');
      });
      fixerRef.current.activeHandles.clear();
      
      log('强化拖拽修复器已清理');
    };
  }, [enabled, intensity, log, getFixingStrategies]);

  // 手动触发修复
  const triggerManualFix = useCallback(() => {
    log('手动触发强化修复');
    const strategies = getFixingStrategies();
    strategies.forEach(strategy => strategy());
    fixerRef.current.fixCount++;
    fixerRef.current.lastFix = Date.now();
  }, [log, getFixingStrategies]);

  return {
    isActive: fixerRef.current.isActive,
    fixCount: fixerRef.current.fixCount,
    lastFix: fixerRef.current.lastFix,
    triggerManualFix,
    // 获取修复状态报告
    getStatus: () => ({
      active: fixerRef.current.isActive,
      intensity,
      fixCount: fixerRef.current.fixCount,
      lastFix: new Date(fixerRef.current.lastFix).toLocaleTimeString(),
      activeHandles: fixerRef.current.activeHandles.size
    })
  };
}

export default useDragFixer;