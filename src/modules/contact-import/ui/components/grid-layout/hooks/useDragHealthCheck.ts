// 拖拽状态检查器 - 快速诊断拖拽功能状态
// 检查基础拖拽功能是否正常工作

import { useEffect, useRef, useState } from 'react';

export interface DragHealthCheck {
  timestamp: number;
  overall: 'healthy' | 'degraded' | 'broken';
  issues: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    element?: HTMLElement;
    fix?: string;
  }[];
  stats: {
    totalHandles: number;
    workingHandles: number;
    visibleHandles: number;
    clickableHandles: number;
    cursorCorrect: number;
  };
  recommendations: string[];
}

/**
 * 拖拽健康检查器 Hook
 * 快速诊断和报告拖拽功能的当前状态
 */
export function useDragHealthCheck(enabled: boolean = true) {
  const [healthCheck, setHealthCheck] = useState<DragHealthCheck | null>(null);
  const checkerRef = useRef<{
    isRunning: boolean;
    checkCount: number;
  }>({ isRunning: false, checkCount: 0 });

  const runHealthCheck = (): DragHealthCheck => {
    const timestamp = Date.now();
    const issues: DragHealthCheck['issues'] = [];
    const recommendations: string[] = [];

    // 查找所有拖拽手柄
    const allHandles = document.querySelectorAll('[data-resize-handle], [role="separator"]');
    const handleElements = Array.from(allHandles) as HTMLElement[];

    let workingHandles = 0;
    let visibleHandles = 0;
    let clickableHandles = 0;
    let cursorCorrect = 0;

    // 检查每个拖拽手柄
    handleElements.forEach((handle, index) => {
      const computedStyle = window.getComputedStyle(handle);
      const rect = handle.getBoundingClientRect();
      
      // 检查可见性
      const isVisible = computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden' &&
                       computedStyle.opacity !== '0';
      if (isVisible) visibleHandles++;

      // 检查可点击性
      const isClickable = rect.width > 0 && rect.height > 0 && 
                         computedStyle.pointerEvents !== 'none';
      if (isClickable) clickableHandles++;

      // 检查光标样式
      const hasCursor = computedStyle.cursor === 'col-resize' || 
                       computedStyle.cursor === 'ew-resize';
      if (hasCursor) cursorCorrect++;

      // 综合判断是否工作正常
      const isWorking = isVisible && isClickable && hasCursor;
      if (isWorking) workingHandles++;

      // 记录具体问题
      if (!isVisible) {
        issues.push({
          type: 'critical',
          message: `拖拽手柄 #${index} 不可见`,
          element: handle,
          fix: '检查 display、visibility、opacity 样式'
        });
      }

      if (!isClickable && isVisible) {
        issues.push({
          type: 'critical',
          message: `拖拽手柄 #${index} 不可点击`,
          element: handle,
          fix: '检查 pointer-events 和元素尺寸'
        });
      }

      if (!hasCursor && isVisible) {
        issues.push({
          type: 'warning',
          message: `拖拽手柄 #${index} 光标样式不正确: ${computedStyle.cursor}`,
          element: handle,
          fix: '设置 cursor: col-resize'
        });
      }

      // 检查过度修复
      const zIndex = parseInt(computedStyle.zIndex);
      if (zIndex > 50000) {
        issues.push({
          type: 'warning',
          message: `拖拽手柄 #${index} z-index 过高: ${zIndex}`,
          element: handle,
          fix: '降低 z-index 到合理范围 (< 10000)'
        });
      }
    });

    // 检查可能的冲突
    const dndContexts = document.querySelectorAll('[data-dnd-kit-element], [data-rbd-droppable-id]');
    if (dndContexts.length > 0 && handleElements.length > 0) {
      issues.push({
        type: 'info',
        message: `检测到 ${dndContexts.length} 个DnD上下文，可能存在事件冲突`,
        fix: '启用拖拽冲突解决器'
      });
    }

    // 检查表格容器
    const tables = document.querySelectorAll('.ant-table-container, table');
    if (tables.length === 0 && handleElements.length > 0) {
      issues.push({
        type: 'warning',
        message: '找到拖拽手柄但未找到表格容器',
        fix: '确认表格已正确渲染'
      });
    }

    // 生成建议
    if (workingHandles === 0 && handleElements.length > 0) {
      recommendations.push('所有拖拽手柄都无法工作，建议使用 useDragRestore 的 rebuild 模式');
    } else if (workingHandles < handleElements.length * 0.5) {
      recommendations.push('超过一半的拖拽手柄有问题，建议使用 useDragRestore 的 reset 模式');
    } else if (workingHandles < handleElements.length) {
      recommendations.push('部分拖拽手柄有问题，建议使用 useDragRestore 的 gentle 模式');
    }

    if (cursorCorrect < handleElements.length) {
      recommendations.push('部分手柄光标样式不正确，检查 CSS cursor 属性');
    }

    if (issues.filter(i => i.type === 'critical').length > 0) {
      recommendations.push('存在严重问题，建议立即修复');
    }

    // 确定整体健康状态
    let overall: DragHealthCheck['overall'];
    const criticalIssues = issues.filter(i => i.type === 'critical').length;
    const workingRatio = handleElements.length > 0 ? workingHandles / handleElements.length : 1;

    if (criticalIssues === 0 && workingRatio >= 0.9) {
      overall = 'healthy';
    } else if (criticalIssues <= 2 && workingRatio >= 0.5) {
      overall = 'degraded';
    } else {
      overall = 'broken';
    }

    return {
      timestamp,
      overall,
      issues,
      stats: {
        totalHandles: handleElements.length,
        workingHandles,
        visibleHandles,
        clickableHandles,
        cursorCorrect
      },
      recommendations
    };
  };

  useEffect(() => {
    if (!enabled) return;

    checkerRef.current.isRunning = true;

    // 立即执行一次检查
    setHealthCheck(runHealthCheck());
    checkerRef.current.checkCount++;

    // 每3秒自动检查一次
    const interval = setInterval(() => {
      if (checkerRef.current.isRunning) {
        setHealthCheck(runHealthCheck());
        checkerRef.current.checkCount++;
      }
    }, 3000);

    return () => {
      checkerRef.current.isRunning = false;
      clearInterval(interval);
    };
  }, [enabled]);

  // 手动触发检查
  const triggerCheck = () => {
    setHealthCheck(runHealthCheck());
    checkerRef.current.checkCount++;
  };

  // 输出详细报告到控制台
  const logHealthReport = () => {
    if (!healthCheck) return;

    console.group('🏥 拖拽健康检查报告');
    console.log('⏰ 检查时间:', new Date(healthCheck.timestamp).toLocaleTimeString());
    console.log('🎯 整体状态:', healthCheck.overall);
    
    console.group('📊 统计数据');
    console.log('总拖拽手柄:', healthCheck.stats.totalHandles);
    console.log('正常工作:', healthCheck.stats.workingHandles);
    console.log('可见手柄:', healthCheck.stats.visibleHandles);
    console.log('可点击手柄:', healthCheck.stats.clickableHandles);
    console.log('光标正确:', healthCheck.stats.cursorCorrect);
    console.groupEnd();

    if (healthCheck.issues.length > 0) {
      console.group('⚠️ 发现的问题');
      healthCheck.issues.forEach((issue, index) => {
        const icon = issue.type === 'critical' ? '🚨' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${issue.message}`);
        if (issue.fix) console.log(`   💡 修复建议: ${issue.fix}`);
      });
      console.groupEnd();
    }

    if (healthCheck.recommendations.length > 0) {
      console.group('💡 修复建议');
      healthCheck.recommendations.forEach(rec => console.info(rec));
      console.groupEnd();
    }

    console.groupEnd();
  };

  // 获取快速修复代码
  const getQuickFixCode = () => {
    if (!healthCheck) return '';

    const criticalIssues = healthCheck.issues.filter(i => i.type === 'critical');
    const workingRatio = healthCheck.stats.totalHandles > 0 ? 
      healthCheck.stats.workingHandles / healthCheck.stats.totalHandles : 1;

    if (workingRatio === 0) {
      return `
// 完全重建拖拽功能
document.querySelectorAll('[data-resize-handle], [role="separator"]').forEach(handle => {
  handle.style.cursor = 'col-resize';
  handle.style.pointerEvents = 'auto';
  handle.style.userSelect = 'none';
  handle.style.zIndex = '1';
});
      `.trim();
    } else if (criticalIssues.length > 0) {
      return `
// 修复关键问题
document.querySelectorAll('[data-resize-handle], [role="separator"]').forEach(handle => {
  const style = window.getComputedStyle(handle);
  if (style.pointerEvents === 'none') handle.style.pointerEvents = 'auto';
  if (style.cursor !== 'col-resize') handle.style.cursor = 'col-resize';
  if (style.display === 'none') handle.style.display = 'block';
});
      `.trim();
    }

    return '// 当前状态良好，无需修复代码';
  };

  return {
    healthCheck,
    triggerCheck,
    logHealthReport,
    getQuickFixCode,
    isRunning: checkerRef.current.isRunning,
    checkCount: checkerRef.current.checkCount
  };
}

export default useDragHealthCheck;