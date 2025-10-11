// src/components/universal-ui/element-selection/utils/performanceMonitor.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 性能监控和分析模块
 * 专门监控气泡组件的性能指标和用户行为
 */

// 内存使用信息接口
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceMetrics {
  /** 组件渲染次数 */
  renderCount: number;
  /** 平均渲染时间（毫秒） */
  averageRenderTime: number;
  /** 最后渲染时间 */
  lastRenderTime: number;
  /** 用户交互次数 */
  interactionCount: number;
  /** 内存使用情况 */
  memoryUsage?: MemoryInfo;
}

export interface UserBehaviorMetrics {
  /** 气泡显示次数 */
  showCount: number;
  /** 气泡隐藏次数 */
  hideCount: number;
  /** 平均显示时长（毫秒） */
  averageDisplayTime: number;
  /** 用户确认次数 */
  confirmCount: number;
  /** 用户取消次数 */
  cancelCount: number;
  /** 点击空白清理次数 */
  clickOutsideCount: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private behaviorMetrics: Map<string, UserBehaviorMetrics> = new Map();
  private renderStartTimes: Map<string, number> = new Map();
  private displayStartTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * 开始渲染计时
   */
  startRenderTimer(componentId: string) {
    this.renderStartTimes.set(componentId, performance.now());
  }

  /**
   * 结束渲染计时
   */
  endRenderTimer(componentId: string) {
    const startTime = this.renderStartTimes.get(componentId);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    this.updateRenderMetrics(componentId, renderTime);
    this.renderStartTimes.delete(componentId);
  }

  /**
   * 更新渲染性能指标
   */
  private updateRenderMetrics(componentId: string, renderTime: number) {
    const current = this.metrics.get(componentId) || {
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      interactionCount: 0
    };

    const newRenderCount = current.renderCount + 1;
    const newAverageRenderTime = 
      (current.averageRenderTime * current.renderCount + renderTime) / newRenderCount;

    this.metrics.set(componentId, {
      ...current,
      renderCount: newRenderCount,
      averageRenderTime: newAverageRenderTime,
      lastRenderTime: renderTime,
      memoryUsage: this.getMemoryUsage()
    });

    console.log(`📊 [PerformanceMonitor] ${componentId} 渲染完成`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      totalRenders: newRenderCount,
      averageTime: `${newAverageRenderTime.toFixed(2)}ms`
    });
  }

  /**
   * 记录用户行为
   */
  recordUserBehavior(
    componentId: string, 
    action: 'show' | 'hide' | 'confirm' | 'cancel' | 'clickOutside'
  ) {
    const current = this.behaviorMetrics.get(componentId) || {
      showCount: 0,
      hideCount: 0,
      averageDisplayTime: 0,
      confirmCount: 0,
      cancelCount: 0,
      clickOutsideCount: 0
    };

    // 处理显示/隐藏时间计算
    if (action === 'show') {
      this.displayStartTimes.set(componentId, performance.now());
      current.showCount++;
    } else if (action === 'hide') {
      const startTime = this.displayStartTimes.get(componentId);
      if (startTime) {
        const displayTime = performance.now() - startTime;
        current.averageDisplayTime = 
          (current.averageDisplayTime * current.hideCount + displayTime) / (current.hideCount + 1);
        this.displayStartTimes.delete(componentId);
      }
      current.hideCount++;
    } else {
      // 其他行为计数
      current[`${action}Count` as keyof UserBehaviorMetrics] = 
        (current[`${action}Count` as keyof UserBehaviorMetrics] as number) + 1;
    }

    this.behaviorMetrics.set(componentId, current);

    console.log(`👤 [PerformanceMonitor] ${componentId} 用户行为: ${action}`, current);
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): MemoryInfo | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory;
    }
    return undefined;
  }

  /**
   * 获取组件性能报告
   */
  getPerformanceReport(componentId: string) {
    const metrics = this.metrics.get(componentId);
    const behavior = this.behaviorMetrics.get(componentId);

    return {
      componentId,
      performance: metrics,
      behavior,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取所有组件的性能概览
   */
  getAllPerformanceReports() {
    const reports = [];
    
    for (const [componentId] of this.metrics) {
      reports.push(this.getPerformanceReport(componentId));
    }

    return reports;
  }

  /**
   * 清理组件数据
   */
  clearComponentData(componentId: string) {
    this.metrics.delete(componentId);
    this.behaviorMetrics.delete(componentId);
    this.renderStartTimes.delete(componentId);
    this.displayStartTimes.delete(componentId);

    console.log(`🧹 [PerformanceMonitor] 清理组件数据: ${componentId}`);
  }

  /**
   * 检测性能问题
   */
  detectPerformanceIssues(componentId: string) {
    const metrics = this.metrics.get(componentId);
    const behavior = this.behaviorMetrics.get(componentId);
    
    if (!metrics || !behavior) return [];

    const issues: string[] = [];

    // 检查渲染性能
    if (metrics.averageRenderTime > 16) { // 超过一帧时间
      issues.push(`渲染时间过长: ${metrics.averageRenderTime.toFixed(2)}ms`);
    }

    // 检查渲染频率
    if (metrics.renderCount > 100) {
      issues.push(`渲染次数过多: ${metrics.renderCount} 次`);
    }

    // 检查用户体验
    if (behavior.cancelCount > behavior.confirmCount * 2) {
      issues.push(`取消率过高: ${behavior.cancelCount} 取消 vs ${behavior.confirmCount} 确认`);
    }

    if (behavior.clickOutsideCount > behavior.confirmCount) {
      issues.push(`点击空白过多: ${behavior.clickOutsideCount} 次，可能表示用户体验问题`);
    }

    return issues;
  }
}

/**
 * React Hook 形式的性能监控
 */
import { useEffect, useRef, useCallback } from 'react';

export const usePerformanceMonitor = (componentId: string) => {
  const monitor = PerformanceMonitor.getInstance();
  const renderCountRef = useRef(0);

  // 渲染性能监控
  useEffect(() => {
    monitor.startRenderTimer(componentId);
    renderCountRef.current++;
    
    return () => {
      monitor.endRenderTimer(componentId);
    };
  });

  // 记录用户行为的便捷方法
  const recordBehavior = useCallback((
    action: 'show' | 'hide' | 'confirm' | 'cancel' | 'clickOutside'
  ) => {
    monitor.recordUserBehavior(componentId, action);
  }, [monitor, componentId]);

  // 获取性能报告
  const getReport = useCallback(() => {
    return monitor.getPerformanceReport(componentId);
  }, [monitor, componentId]);

  // 检测性能问题
  const checkIssues = useCallback(() => {
    return monitor.detectPerformanceIssues(componentId);
  }, [monitor, componentId]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      monitor.clearComponentData(componentId);
    };
  }, [monitor, componentId]);

  return {
    recordBehavior,
    getReport,
    checkIssues,
    renderCount: renderCountRef.current
  };
};

/**
 * 专门用于气泡组件的性能监控
 */
export const usePopoverPerformanceMonitor = (popoverId: string) => {
  const performanceMonitor = usePerformanceMonitor(`popover-${popoverId}`);

  return {
    ...performanceMonitor,
    // 预定义的行为记录方法
    onShow: () => performanceMonitor.recordBehavior('show'),
    onHide: () => performanceMonitor.recordBehavior('hide'),
    onConfirm: () => performanceMonitor.recordBehavior('confirm'),
    onCancel: () => performanceMonitor.recordBehavior('cancel'),
    onClickOutside: () => performanceMonitor.recordBehavior('clickOutside')
  };
};