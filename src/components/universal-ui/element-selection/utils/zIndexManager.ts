/**
 * Z轴层级管理模块
 * 专门处理组件层级关系，避免遮挡问题
 */

export class ZIndexManager {
  private static instance: ZIndexManager | null = null;
  
  // 预定义的层级常量
  static readonly LEVELS = {
    // 基础层级
    BASE: 1,
    CONTENT: 100,
    NAVIGATION: 200,
    
    // 悬浮层级
    TOOLTIP: 1000,
    DROPDOWN: 1010,
    POPOVER: 1020,
    
    // 模态层级  
    MODAL_BACKDROP: 1050,
    MODAL: 1060,
    MODAL_CONTENT: 1070,
    
    // 顶层
    NOTIFICATION: 2000,
    LOADING: 2010,
    EMERGENCY: 9999
  } as const;

  private activeModals = new Set<string>();
  private reservedLevels = new Map<string, number>();

  static getInstance(): ZIndexManager {
    if (!this.instance) {
      this.instance = new ZIndexManager();
    }
    return this.instance;
  }

  /**
   * 获取气泡卡片的合适层级
   * 根据当前模态框状态动态计算
   */
  getPopoverZIndex(modalId?: string): number {
    // 如果没有活跃的模态框，使用标准气泡层级
    if (this.activeModals.size === 0) {
      return ZIndexManager.LEVELS.POPOVER;
    }

    // 如果指定了模态框ID，且该模态框处于活跃状态
    if (modalId && this.activeModals.has(modalId)) {
      return ZIndexManager.LEVELS.MODAL_CONTENT + 10;
    }

    // 默认情况：高于模态框但低于通知
    return ZIndexManager.LEVELS.MODAL_CONTENT + 5;
  }

  /**
   * 注册模态框
   */
  registerModal(modalId: string, zIndex?: number): number {
    this.activeModals.add(modalId);
    
    const level = zIndex || ZIndexManager.LEVELS.MODAL;
    this.reservedLevels.set(modalId, level);
    
    console.log(`📐 [ZIndexManager] 注册模态框: ${modalId}, z-index: ${level}`, {
      activeModals: Array.from(this.activeModals),
      totalActive: this.activeModals.size
    });
    
    return level;
  }

  /**
   * 注销模态框
   */
  unregisterModal(modalId: string): void {
    this.activeModals.delete(modalId);
    this.reservedLevels.delete(modalId);
    
    console.log(`📐 [ZIndexManager] 注销模态框: ${modalId}`, {
      activeModals: Array.from(this.activeModals),
      totalActive: this.activeModals.size
    });
  }

  /**
   * 获取模态框的层级
   */
  getModalZIndex(modalId: string): number {
    return this.reservedLevels.get(modalId) || ZIndexManager.LEVELS.MODAL;
  }

  /**
   * 检查是否有活跃的模态框
   */
  hasActiveModals(): boolean {
    return this.activeModals.size > 0;
  }

  /**
   * 获取所有活跃模态框
   */
  getActiveModals(): string[] {
    return Array.from(this.activeModals);
  }

  /**
   * 清理所有注册的模态框
   */
  clearAllModals(): void {
    console.log('📐 [ZIndexManager] 清理所有模态框');
    this.activeModals.clear();
    this.reservedLevels.clear();
  }

  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      activeModals: Array.from(this.activeModals),
      reservedLevels: Object.fromEntries(this.reservedLevels),
      totalActive: this.activeModals.size
    };
  }
}

/**
 * React Hook 形式的 Z轴管理
 */
import { useEffect, useState, useCallback } from 'react';

export const useZIndexManager = (componentId: string, componentType: 'modal' | 'popover' = 'modal') => {
  const [zIndex, setZIndex] = useState<number>(0);
  const manager = ZIndexManager.getInstance();

  const registerComponent = useCallback(() => {
    let level: number;
    
    if (componentType === 'modal') {
      level = manager.registerModal(componentId);
    } else {
      level = manager.getPopoverZIndex(componentId);
    }
    
    setZIndex(level);
    return level;
  }, [componentId, componentType, manager]);

  const unregisterComponent = useCallback(() => {
    if (componentType === 'modal') {
      manager.unregisterModal(componentId);
    }
    setZIndex(0);
  }, [componentId, componentType, manager]);

  // 动态更新气泡层级（当模态框状态变化时）
  const updatePopoverZIndex = useCallback(() => {
    if (componentType === 'popover') {
      const newLevel = manager.getPopoverZIndex();
      setZIndex(newLevel);
      return newLevel;
    }
    return zIndex;
  }, [componentType, manager, zIndex]);

  useEffect(() => {
    return () => {
      unregisterComponent();
    };
  }, [unregisterComponent]);

  return {
    zIndex,
    registerComponent,
    unregisterComponent,
    updatePopoverZIndex,
    manager
  };
};

/**
 * 专门用于气泡组件的层级管理
 */
export const usePopoverZIndex = (popoverId: string, modalId?: string) => {
  const [zIndex, setZIndex] = useState<number>(ZIndexManager.LEVELS.POPOVER);
  const manager = ZIndexManager.getInstance();

  const updateZIndex = useCallback(() => {
    const newZIndex = manager.getPopoverZIndex(modalId);
    setZIndex(newZIndex);
    
    console.log(`📐 [usePopoverZIndex] 更新气泡层级: ${popoverId}`, {
      newZIndex,
      modalId,
      hasActiveModals: manager.hasActiveModals()
    });
    
    return newZIndex;
  }, [manager, modalId, popoverId]);

  // 监听模态框状态变化
  useEffect(() => {
    updateZIndex();
    
    // 可以在这里添加更复杂的监听逻辑
    const interval = setInterval(updateZIndex, 1000); // 每秒检查一次
    
    return () => clearInterval(interval);
  }, [updateZIndex]);

  return {
    zIndex,
    updateZIndex
  };
};