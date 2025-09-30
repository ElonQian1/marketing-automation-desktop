// 拖拽诊断工具 - 实时诊断拖拽冲突和问题
// 帮助开发者快速定位拖拽问题的根本原因

import { useEffect, useRef, useState } from 'react';

export interface DiagnosticReport {
  timestamp: number;
  resizeHandles: {
    count: number;
    visible: number;
    clickable: number;
    hasConflicts: boolean;
  };
  dndContexts: {
    dndKit: number;
    reactBeautifulDnd: number;
    other: number;
  };
  eventListeners: {
    pointerEvents: number;
    dragEvents: number;
    mouseEvents: number;
  };
  conflicts: string[];
  recommendations: string[];
}

/**
 * 拖拽诊断器 Hook
 * 实时监控和诊断页面中的拖拽相关问题
 */
export function useDragDiagnostic(enabled: boolean = true) {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const diagnosticRef = useRef<{
    isRunning: boolean;
    intervalId?: NodeJS.Timeout;
  }>({ isRunning: false });

  const runDiagnostic = (): DiagnosticReport => {
    const timestamp = Date.now();
    
    // 检查列宽拖拽手柄
    const allHandles = document.querySelectorAll('[data-resize-handle], [role="separator"]');
    const visibleHandles = Array.from(allHandles).filter(handle => {
      const element = handle as HTMLElement;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    const clickableHandles = visibleHandles.filter(handle => {
      const element = handle as HTMLElement;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    // 检查DnD上下文
    const dndKitElements = document.querySelectorAll('[data-dnd-kit-element]');
    const reactBeautifulDndElements = document.querySelectorAll('[data-rbd-droppable-id]');
    const otherDndElements = document.querySelectorAll('[draggable="true"]:not([data-dnd-kit-element]):not([data-rbd-droppable-id])');

    // 检查事件监听器（估算）
    const pointerEvents = document.querySelectorAll('[onpointerdown], [onpointermove], [onpointerup]').length;
    const dragEvents = document.querySelectorAll('[ondragstart], [ondrag], [ondrop]').length;
    const mouseEvents = document.querySelectorAll('[onmousedown], [onmousemove], [onmouseup]').length;

    // 冲突检测
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // 检测1: 列宽手柄与DnD冲突
    if (allHandles.length > 0 && (dndKitElements.length > 0 || reactBeautifulDndElements.length > 0)) {
      conflicts.push('列宽拖拽手柄与DnD上下文可能存在冲突');
      recommendations.push('使用 useDragFixer hook 的 aggressive 模式');
    }

    // 检测2: 不可点击的拖拽手柄
    if (allHandles.length > clickableHandles.length) {
      conflicts.push(`${allHandles.length - clickableHandles.length} 个拖拽手柄不可点击`);
      recommendations.push('检查CSS z-index和pointer-events属性');
    }

    // 检测3: 过多的事件监听器
    const totalEvents = pointerEvents + dragEvents + mouseEvents;
    if (totalEvents > 50) {
      conflicts.push('页面存在大量拖拽相关事件监听器，可能影响性能');
      recommendations.push('考虑事件委托或减少监听器数量');
    }

    // 检测4: 缺少防护机制
    const protectedTables = document.querySelectorAll('[data-drag-protected="true"]');
    if (allHandles.length > 0 && protectedTables.length === 0) {
      conflicts.push('表格缺少拖拽防护机制');
      recommendations.push('启用 useGridDragGuards hook');
    }

    return {
      timestamp,
      resizeHandles: {
        count: allHandles.length,
        visible: visibleHandles.length,
        clickable: clickableHandles.length,
        hasConflicts: conflicts.length > 0
      },
      dndContexts: {
        dndKit: dndKitElements.length,
        reactBeautifulDnd: reactBeautifulDndElements.length,
        other: otherDndElements.length
      },
      eventListeners: {
        pointerEvents,
        dragEvents,
        mouseEvents
      },
      conflicts,
      recommendations
    };
  };

  useEffect(() => {
    if (!enabled) return;

    diagnosticRef.current.isRunning = true;

    // 立即运行一次诊断
    setReport(runDiagnostic());

    // 每2秒更新诊断报告
    const intervalId = setInterval(() => {
      if (diagnosticRef.current.isRunning) {
        setReport(runDiagnostic());
      }
    }, 2000);

    diagnosticRef.current.intervalId = intervalId;

    return () => {
      diagnosticRef.current.isRunning = false;
      if (diagnosticRef.current.intervalId) {
        clearInterval(diagnosticRef.current.intervalId);
      }
    };
  }, [enabled]);

  // 手动触发诊断
  const triggerDiagnostic = () => {
    setReport(runDiagnostic());
  };

  // 输出诊断报告到控制台
  const logReport = () => {
    if (!report) return;

    console.group('🔍 拖拽诊断报告');
    console.log('⏰ 时间:', new Date(report.timestamp).toLocaleTimeString());
    
    console.group('🎯 列宽拖拽手柄');
    console.log('总数:', report.resizeHandles.count);
    console.log('可见:', report.resizeHandles.visible);
    console.log('可点击:', report.resizeHandles.clickable);
    console.log('有冲突:', report.resizeHandles.hasConflicts ? '是' : '否');
    console.groupEnd();

    console.group('🕹️ DnD上下文');
    console.log('@dnd-kit:', report.dndContexts.dndKit);
    console.log('react-beautiful-dnd:', report.dndContexts.reactBeautifulDnd);
    console.log('其他:', report.dndContexts.other);
    console.groupEnd();

    console.group('👂 事件监听器');
    console.log('指针事件:', report.eventListeners.pointerEvents);
    console.log('拖拽事件:', report.eventListeners.dragEvents);
    console.log('鼠标事件:', report.eventListeners.mouseEvents);
    console.groupEnd();

    if (report.conflicts.length > 0) {
      console.group('⚠️ 发现的冲突');
      report.conflicts.forEach(conflict => console.warn(conflict));
      console.groupEnd();
    }

    if (report.recommendations.length > 0) {
      console.group('💡 修复建议');
      report.recommendations.forEach(rec => console.info(rec));
      console.groupEnd();
    }

    console.groupEnd();
  };

  return {
    report,
    triggerDiagnostic,
    logReport,
    isRunning: diagnosticRef.current.isRunning
  };
}

export default useDragDiagnostic;