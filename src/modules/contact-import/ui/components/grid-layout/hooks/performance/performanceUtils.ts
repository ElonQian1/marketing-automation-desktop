// src/modules/contact-import/ui/components/grid-layout/hooks/performance/performanceUtils.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 性能优化工具模块
 * 提供节流、防抖、RAF 等性能优化工具
 */

export type ThrottleFunction<T extends (...args: any[]) => any> = T & {
  cancel: () => void;
};

export type DebounceFunction<T extends (...args: any[]) => any> = T & {
  cancel: () => void;
  flush: () => void;
};

/**
 * 使用 requestAnimationFrame 的节流函数
 * 确保函数在一个渲染帧内最多执行一次
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): ThrottleFunction<T> {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
        rafId = null;
      });
    }
  }) as ThrottleFunction<T>;

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastArgs = null;
    }
  };

  return throttled;
}

/**
 * 传统时间间隔节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ThrottleFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastExecTime >= delay) {
      func(...args);
      lastExecTime = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastExecTime = Date.now();
        }
        timeoutId = null;
      }, delay - (now - lastExecTime));
    }
  }) as ThrottleFunction<T>;

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebounceFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
      }
    }, delay);
  }) as DebounceFunction<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * 批量状态更新工具
 * 使用 RAF 批量处理状态更新，减少重渲染
 */
export class BatchUpdater {
  private updates: Array<() => void> = [];
  private rafId: number | null = null;

  add(update: () => void) {
    this.updates.push(update);
    this.schedule();
  }

  private schedule() {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    const updates = this.updates.splice(0);
    updates.forEach(update => update());
    this.rafId = null;
  }

  cancel() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates = [];
  }
}

/**
 * 创建批量更新器实例
 */
export function createBatchUpdater() {
  return new BatchUpdater();
}

/**
 * 内存友好的事件监听器管理器
 */
export class EventListenerManager {
  private listeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  add(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  removeAll() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
  }

  remove(element: EventTarget, event: string, handler: EventListener) {
    const index = this.listeners.findIndex(
      listener => 
        listener.element === element && 
        listener.event === event && 
        listener.handler === handler
    );
    
    if (index >= 0) {
      const listener = this.listeners[index];
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      this.listeners.splice(index, 1);
    }
  }
}

/**
 * 创建事件监听器管理器实例
 */
export function createEventListenerManager() {
  return new EventListenerManager();
}