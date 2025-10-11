// src/components/universal-ui/element-selection/hooks/usePopoverLifecycleManager.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 气泡卡片生命周期管理模块
 * 专门处理气泡状态的清理和生命周期管理
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ElementSelectionState } from '../ElementSelectionPopover';

export interface PopoverLifecycleOptions {
  /** 自动清理延迟时间（毫秒） */
  autoCleanupDelay?: number;
  /** 是否启用调试日志 */
  enableDebugLog?: boolean;
}

/**
 * 气泡卡片生命周期管理 Hook
 * 提供统一的清理和状态管理能力
 */
export const usePopoverLifecycleManager = (
  options: PopoverLifecycleOptions = {}
) => {
  const {
    autoCleanupDelay = 300,
    enableDebugLog = true
  } = options;

  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const log = useCallback((...args: any[]) => {
    if (enableDebugLog) {
      console.log('🔄 [PopoverLifecycle]', ...args);
    }
  }, [enableDebugLog]);

  // 清理定时器
  const clearCleanupTimeout = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  // 延迟清理
  const scheduleCleanup = useCallback((
    cleanupFn: () => void,
    reason: string = '延迟清理'
  ) => {
    clearCleanupTimeout();
    
    log(`安排${reason}，延迟 ${autoCleanupDelay}ms`);
    
    cleanupTimeoutRef.current = setTimeout(() => {
      log(`执行${reason}`);
      cleanupFn();
      cleanupTimeoutRef.current = null;
    }, autoCleanupDelay);
  }, [autoCleanupDelay, clearCleanupTimeout, log]);

  // 立即清理
  const immediateCleanup = useCallback((
    cleanupFn: () => void,
    reason: string = '立即清理'
  ) => {
    clearCleanupTimeout();
    log(`执行${reason}`);
    cleanupFn();
  }, [clearCleanupTimeout, log]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearCleanupTimeout();
      log('组件卸载，清理定时器');
    };
  }, [clearCleanupTimeout, log]);

  return {
    scheduleCleanup,
    immediateCleanup,
    clearCleanupTimeout
  };
};

/**
 * 气泡状态验证工具
 */
export const PopoverStateValidator = {
  /**
   * 验证气泡是否应该显示
   */
  shouldShowPopover: (
    visible: boolean,
    pendingSelection: ElementSelectionState | null,
    modalVisible: boolean
  ): boolean => {
    // 模态框关闭时，气泡不应显示
    if (!modalVisible) return false;
    
    // 必须有待选择的元素
    if (!pendingSelection) return false;
    
    // 显式的visible控制
    return visible;
  },

  /**
   * 检查气泡状态是否异常
   */
  detectAbnormalState: (
    pendingSelection: ElementSelectionState | null,
    modalVisible: boolean,
    componentPath: string
  ): string[] => {
    const issues: string[] = [];
    
    // 模态框关闭但气泡仍有状态
    if (!modalVisible && pendingSelection) {
      issues.push(`${componentPath}: 模态框已关闭但pendingSelection仍存在`);
    }
    
    // 气泡状态检查
    if (pendingSelection) {
      if (!pendingSelection.element) {
        issues.push(`${componentPath}: pendingSelection.element为空`);
      }
      
      if (!pendingSelection.position) {
        issues.push(`${componentPath}: pendingSelection.position为空`);
      }
    }
    
    return issues;
  }
};

/**
 * 全局气泡状态监控
 * 用于调试和问题定位
 */
export class PopoverStateMonitor {
  private static instance: PopoverStateMonitor | null = null;
  private activePopovers = new Map<string, ElementSelectionState>();
  
  static getInstance(): PopoverStateMonitor {
    if (!this.instance) {
      this.instance = new PopoverStateMonitor();
    }
    return this.instance;
  }
  
  registerPopover(id: string, state: ElementSelectionState | null) {
    if (state) {
      this.activePopovers.set(id, state);
      console.log(`📌 [PopoverMonitor] 注册气泡: ${id}`, {
        totalActive: this.activePopovers.size,
        elementId: state.element.id
      });
    } else {
      this.activePopovers.delete(id);
      console.log(`📌 [PopoverMonitor] 取消注册气泡: ${id}`, {
        totalActive: this.activePopovers.size
      });
    }
  }
  
  getActivePopovers() {
    return Array.from(this.activePopovers.entries());
  }
  
  hasAnyActivePopovers(): boolean {
    return this.activePopovers.size > 0;
  }
  
  clearAllPopovers() {
    console.log('🧹 [PopoverMonitor] 清理所有活跃气泡', {
      count: this.activePopovers.size
    });
    this.activePopovers.clear();
  }
}