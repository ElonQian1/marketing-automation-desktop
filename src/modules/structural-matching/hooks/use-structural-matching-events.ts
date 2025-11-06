// src/modules/structural-matching/hooks/use-structural-matching-events.ts
// module: structural-matching | layer: hooks | role: 事件系统集成Hook
// summary: React组件与事件总线的集成Hook

import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  StructuralMatchingEventBus,
  type StructuralMatchingEventType,
  type EventHandler,
  type EventListenerConfig,
  type EventStats,
  type EventPayload
} from '../domain/events/structural-matching-event-bus';


/**
 * 事件Hook配置
 */
export interface UseEventsConfig {
  // 组件标识，用于事件来源追踪
  componentId: string;
  
  // 是否自动清理监听器
  autoCleanup?: boolean;
  
  // 默认监听器配置
  defaultListenerConfig?: EventListenerConfig;
  
  // 是否启用性能监控
  enablePerformanceMonitoring?: boolean;
  
  // 是否启用调试日志
  enableDebugLogs?: boolean;
}

/**
 * 简化的事件发射器类型
 */
export type EventEmitter = (
  eventType: StructuralMatchingEventType,
  payload: EventPayload,
  source?: string,
  metadata?: {
    userId?: string;
    sessionId?: string;
    traceId?: string;
    tags?: Record<string, string>;
  }
) => Promise<void>;

/**
 * 简化的事件监听器类型
 */
export type EventListener = (
  eventType: StructuralMatchingEventType,
  handler: EventHandler,
  config?: EventListenerConfig
) => string;

/**
 * 事件Hook返回值
 */
export interface UseEventsReturn {
  // 事件发射器
  emit: EventEmitter;
  
  // 事件监听器
  on: EventListener;
  
  // 取消监听
  off: (eventType: StructuralMatchingEventType, listenerId: string) => boolean;
  
  // 获取事件统计
  getStats: () => EventStats;
  
  // 清除所有监听器
  clearListeners: () => void;
  
  // 事件历史查询
  getHistory: (filter?: Parameters<StructuralMatchingEventBus['getEventHistory']>[0]) => ReturnType<StructuralMatchingEventBus['getEventHistory']>;
  
  // 当前激活的监听器数量
  activeListeners: number;
  
  // 最近的错误
  lastError: Error | null;
}

/**
 * 结构匹配事件系统Hook
 * 
 * 用于在React组件中集成事件驱动架构
 */
export function useStructuralMatchingEvents(config: UseEventsConfig): UseEventsReturn {
  const eventBus = useRef<StructuralMatchingEventBus | null>(null);
  const listenerIds = useRef<Set<string>>(new Set());
  const [activeListeners, setActiveListeners] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // 清除所有监听器
  const clearAllListeners = useCallback(() => {
    if (!eventBus.current) return;
    
    let removedCount = 0;
    listenerIds.current.forEach(listenerId => {
      // 遍历所有事件类型尝试移除
      const eventTypes: StructuralMatchingEventType[] = [
        'DATA_FETCHED', 'DATA_VALIDATED', 'DATA_ENHANCED', 'DATA_CACHED',
        'ELEMENT_SELECTED', 'MODAL_OPENED', 'MODAL_CLOSED', 
        'CONFIG_CHANGED', 'CONFIG_SAVED',
        'ANALYSIS_STARTED', 'ANALYSIS_COMPLETED', 'MATCHING_EXECUTED', 'SIGNATURES_GENERATED',
        'ERROR_OCCURRED', 'WARNING_ISSUED', 'PERFORMANCE_MEASURED', 'CACHE_HIT', 'CACHE_MISS'
      ];
      
      eventTypes.forEach(eventType => {
        if (eventBus.current!.unsubscribe(eventType, listenerId)) {
          removedCount++;
        }
      });
    });
    
    listenerIds.current.clear();
    setActiveListeners(0);
    
    if (config.enableDebugLogs && removedCount > 0) {
      console.log(`🧹 [useEvents] 组件 ${config.componentId} 清除了 ${removedCount} 个监听器`);
    }
  }, [config.componentId, config.enableDebugLogs]);
  
  // 初始化事件总线
  useEffect(() => {
    eventBus.current = StructuralMatchingEventBus.getInstance();
    
    if (config.enableDebugLogs) {
      console.log(`🎯 [useEvents] 组件 ${config.componentId} 连接到事件总线`);
    }
    
    return () => {
      if (config.autoCleanup !== false) {
        clearAllListeners();
      }
    };
  }, [config.componentId, config.autoCleanup, clearAllListeners, config.enableDebugLogs]);

  // 事件发射器
  const emit = useCallback(async (
    eventType: StructuralMatchingEventType,
    payload: EventPayload,
    source?: string,
    metadata?: {
      userId?: string;
      sessionId?: string;
      traceId?: string;
      tags?: Record<string, string>;
    }
  ): Promise<void> => {
    if (!eventBus.current) {
      console.warn(`⚠️ [useEvents] 事件总线未初始化，无法发射事件 ${eventType}`);
      return;
    }
    
    const eventSource = source || config.componentId;
    
    if (config.enablePerformanceMonitoring && eventType !== 'PERFORMANCE_MEASURED') {
      const startTime = performance.now();
      await eventBus.current.emit(eventType, payload, eventSource, {
        ...metadata,
        tags: {
          ...metadata?.tags,
          component: config.componentId,
          hookVersion: '1.0.0'
        }
      });
      
      const endTime = performance.now();
      // 发射性能事件
      await eventBus.current.emit('PERFORMANCE_MEASURED', {
        metric: {
          name: `event_emission_${eventType}`,
          value: endTime - startTime,
          unit: 'ms'
        },
        context: {
          operation: 'emit_event',
          component: config.componentId,
          dataSize: JSON.stringify(payload).length
        },
        benchmark: {
          baseline: 5,
          threshold: 50,
          status: endTime - startTime > 50 ? 'critical' : endTime - startTime > 20 ? 'warning' : 'good'
        }
      } as EventPayload, `${eventSource}[perf-monitor]`);
    } else {
      await eventBus.current.emit(eventType, payload, eventSource, {
        ...metadata,
        tags: {
          ...metadata?.tags,
          component: config.componentId,
          hookVersion: '1.0.0'
        }
      });
    }
  }, [config.componentId, config.enablePerformanceMonitoring]);

  // 事件监听器
  const on = useCallback((
    eventType: StructuralMatchingEventType,
    handler: EventHandler,
    listenerConfig?: EventListenerConfig
  ): string => {
    if (!eventBus.current) {
      console.warn(`⚠️ [useEvents] 事件总线未初始化，无法添加监听器 ${eventType}`);
      return '';
    }
    
    const finalConfig: EventListenerConfig = {
      ...config.defaultListenerConfig,
      ...listenerConfig,
      onError: (error: Error, event) => {
        setLastError(error);
        if (config.enableDebugLogs) {
          console.error(`❌ [useEvents] 组件 ${config.componentId} 事件处理错误:`, {
            eventType: event.type,
            error: error.message
          });
        }
        listenerConfig?.onError?.(error, event);
      }
    };
    
    const listenerId = eventBus.current.subscribe(
      eventType,
      handler,
      finalConfig
    );
    
    listenerIds.current.add(listenerId);
    setActiveListeners(prev => prev + 1);
    
    if (config.enableDebugLogs) {
      console.log(`👂 [useEvents] 组件 ${config.componentId} 添加监听器:`, {
        eventType,
        listenerId,
        priority: finalConfig.priority || 0
      });
    }
    
    return listenerId;
  }, [config.componentId, config.defaultListenerConfig, config.enableDebugLogs]);

  // 取消监听
  const off = useCallback((eventType: StructuralMatchingEventType, listenerId: string): boolean => {
    if (!eventBus.current) return false;
    
    const success = eventBus.current.unsubscribe(eventType, listenerId);
    if (success) {
      listenerIds.current.delete(listenerId);
      setActiveListeners(prev => Math.max(0, prev - 1));
      
      if (config.enableDebugLogs) {
        console.log(`🙉 [useEvents] 组件 ${config.componentId} 移除监听器:`, {
          eventType,
          listenerId
        });
      }
    }
    return success;
  }, [config.componentId, config.enableDebugLogs]);

  // 获取统计信息
  const getStats = useCallback((): EventStats => {
    return eventBus.current?.getStats() || {
      totalEvents: 0,
      eventsByType: {} as Record<StructuralMatchingEventType, number>,
      averageProcessingTime: 0,
      errorRate: 0,
      activeListeners: 0
    };
  }, []);

  // 获取事件历史
  const getHistory = useCallback((
    filter?: Parameters<StructuralMatchingEventBus['getEventHistory']>[0]
  ) => {
    return eventBus.current?.getEventHistory(filter) || [];
  }, []);

  // 清除监听器
  const clearListeners = useCallback(() => {
    clearAllListeners();
  }, [clearAllListeners]);

  return {
    emit,
    on,
    off,
    getStats,
    clearListeners,
    getHistory,
    activeListeners,
    lastError
  };
}

/**
 * 简化版事件Hook - 只用于发射事件
 */
export function useEventEmitter(componentId: string) {
  const { emit } = useStructuralMatchingEvents({
    componentId,
    autoCleanup: false,
    enableDebugLogs: false,
    enablePerformanceMonitoring: false
  });
  
  return emit;
}

/**
 * 监听特定事件的Hook
 */
export function useEventListener(
  eventType: StructuralMatchingEventType,
  handler: EventHandler,
  config?: UseEventsConfig & { listenerConfig?: EventListenerConfig }
) {
  const { on, off } = useStructuralMatchingEvents({
    componentId: config?.componentId || 'anonymous',
    autoCleanup: config?.autoCleanup !== false,
    enableDebugLogs: config?.enableDebugLogs || false
  });
  
  const listenerIdRef = useRef<string>('');
  
  useEffect(() => {
    listenerIdRef.current = on(eventType, handler, config?.listenerConfig);
    
    return () => {
      if (listenerIdRef.current) {
        off(eventType, listenerIdRef.current);
      }
    };
  }, [eventType, handler, on, off, config?.listenerConfig]);
}

export default useStructuralMatchingEvents;