// src/modules/structural-matching/domain/events/structural-matching-event-bus.ts
// module: structural-matching | layer: domain | role: 事件总线
// summary: 结构匹配功能的事件驱动架构核心

/**
 * 事件类型定义
 */
export type StructuralMatchingEventType = 
  // 数据相关事件
  | 'DATA_FETCHED'
  | 'DATA_VALIDATED'
  | 'DATA_ENHANCED'
  | 'DATA_CACHED'
  
  // UI交互事件
  | 'ELEMENT_SELECTED'
  | 'MODAL_OPENED'
  | 'MODAL_CLOSED'
  | 'CONFIG_CHANGED'
  | 'CONFIG_SAVED'
  
  // 分析和匹配事件
  | 'ANALYSIS_STARTED'
  | 'ANALYSIS_COMPLETED'
  | 'MATCHING_EXECUTED'
  | 'SIGNATURES_GENERATED'
  
  // 错误和性能事件
  | 'ERROR_OCCURRED'
  | 'WARNING_ISSUED'
  | 'PERFORMANCE_MEASURED'
  | 'CACHE_HIT'
  | 'CACHE_MISS';

/**
 * 事件载荷接口
 */
export interface EventPayload {
  [key: string]: unknown;
}

/**
 * 事件对象
 */
export interface StructuralMatchingEvent<T extends EventPayload = EventPayload> {
  type: StructuralMatchingEventType;
  payload: T;
  timestamp: number;
  source: string; // 事件来源组件/服务
  correlationId: string; // 关联ID用于追踪
  metadata?: {
    userId?: string;
    sessionId?: string;
    traceId?: string;
    tags?: Record<string, string>;
  };
}

/**
 * 事件处理器
 */
export type EventHandler<T extends EventPayload = EventPayload> = (
  event: StructuralMatchingEvent<T>
) => void | Promise<void>;

/**
 * 事件监听器配置
 */
export interface EventListenerConfig {
  // 监听器优先级 (数字越大优先级越高)
  priority?: number;
  
  // 是否只执行一次
  once?: boolean;
  
  // 过滤条件
  filter?: (event: StructuralMatchingEvent) => boolean;
  
  // 错误处理
  onError?: (error: Error, event: StructuralMatchingEvent) => void;
  
  // 超时设置 (毫秒)
  timeout?: number;
}

/**
 * 事件统计信息
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<StructuralMatchingEventType, number>;
  averageProcessingTime: number;
  errorRate: number;
  activeListeners: number;
}

/**
 * 结构匹配事件总线
 * 
 * 特性：
 * - 类型安全的事件系统
 * - 异步事件处理
 * - 事件过滤和优先级
 * - 错误处理和超时机制
 * - 事件历史和重放
 * - 性能监控
 */
export class StructuralMatchingEventBus {
  private static instance: StructuralMatchingEventBus;
  
  private listeners = new Map<StructuralMatchingEventType, Array<{
    handler: EventHandler;
    config: EventListenerConfig;
    id: string;
  }>>();
  
  private eventHistory: StructuralMatchingEvent[] = [];
  private stats: EventStats = {
    totalEvents: 0,
    eventsByType: {} as Record<StructuralMatchingEventType, number>,
    averageProcessingTime: 0,
    errorRate: 0,
    activeListeners: 0
  };
  
  private maxHistorySize = 1000;
  private isReplaying = false;

  private constructor() {
    console.log('🚌 [EventBus] 初始化结构匹配事件总线');
  }

  public static getInstance(): StructuralMatchingEventBus {
    if (!this.instance) {
      this.instance = new StructuralMatchingEventBus();
    }
    return this.instance;
  }

  /**
   * 发布事件
   */
  public async emit<T extends EventPayload = EventPayload>(
    type: StructuralMatchingEventType,
    payload: T,
    source: string,
    metadata?: StructuralMatchingEvent['metadata']
  ): Promise<void> {
    const event: StructuralMatchingEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source,
      correlationId: this.generateCorrelationId(),
      metadata
    };

    console.log(`📡 [EventBus] 发布事件 ${type}:`, {
      source,
      correlationId: event.correlationId,
      payloadKeys: Object.keys(payload),
      listenerCount: this.listeners.get(type)?.length || 0
    });

    // 添加到历史记录
    this.addToHistory(event);
    
    // 更新统计
    this.updateStats(event);

    // 获取监听器并排序
    const eventListeners = this.listeners.get(type) || [];
    const sortedListeners = [...eventListeners].sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0));

    // 并行执行监听器
    const processingPromises = sortedListeners.map(async (listener) => {
      // 应用过滤器
      if (listener.config.filter && !listener.config.filter(event)) {
        return;
      }

      const startTime = performance.now();

      try {
        // 超时处理
        if (listener.config.timeout) {
          await Promise.race([
            Promise.resolve(listener.handler(event)),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Handler timeout after ${listener.config.timeout}ms`)), listener.config.timeout)
            )
          ]);
        } else {
          await Promise.resolve(listener.handler(event));
        }

        // 一次性监听器移除
        if (listener.config.once) {
          this.removeListener(type, listener.id);
        }

      } catch (error) {
        console.error(`❌ [EventBus] 事件处理器执行失败:`, {
          type,
          listenerId: listener.id,
          error: error instanceof Error ? error.message : error
        });

        // 调用错误处理器
        if (listener.config.onError) {
          try {
            listener.config.onError(error as Error, event);
          } catch (errorHandlerError) {
            console.error('❌ [EventBus] 错误处理器执行失败:', errorHandlerError);
          }
        }

        // 更新错误统计
        this.stats.errorRate = (this.stats.errorRate * this.stats.totalEvents + 1) / (this.stats.totalEvents + 1);
      }

      // 更新性能统计
      const processingTime = performance.now() - startTime;
      this.stats.averageProcessingTime = (
        this.stats.averageProcessingTime * (this.stats.totalEvents - 1) + processingTime
      ) / this.stats.totalEvents;
    });

    // 等待所有处理器完成
    await Promise.allSettled(processingPromises);
  }

  /**
   * 订阅事件
   */
  public subscribe<T extends EventPayload = EventPayload>(
    type: StructuralMatchingEventType,
    handler: EventHandler<T>,
    config: EventListenerConfig = {}
  ): string {
    const listenerId = this.generateListenerId();
    
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    this.listeners.get(type)!.push({
      handler: handler as EventHandler,
      config,
      id: listenerId
    });

    this.stats.activeListeners++;

    console.log(`👂 [EventBus] 添加监听器:`, {
      type,
      listenerId,
      priority: config.priority || 0,
      once: config.once || false,
      totalListeners: this.stats.activeListeners
    });

    return listenerId;
  }

  /**
   * 取消订阅
   */
  public unsubscribe(type: StructuralMatchingEventType, listenerId: string): boolean {
    const listeners = this.listeners.get(type);
    if (!listeners) return false;

    const index = listeners.findIndex(l => l.id === listenerId);
    if (index === -1) return false;

    listeners.splice(index, 1);
    this.stats.activeListeners--;

    console.log(`🙉 [EventBus] 移除监听器:`, {
      type,
      listenerId,
      remainingListeners: listeners.length
    });

    return true;
  }

  /**
   * 移除监听器（内部使用）
   */
  private removeListener(type: StructuralMatchingEventType, listenerId: string): void {
    this.unsubscribe(type, listenerId);
  }

  /**
   * 移除所有监听器
   */
  public removeAllListeners(type?: StructuralMatchingEventType): void {
    if (type) {
      const count = this.listeners.get(type)?.length || 0;
      this.listeners.delete(type);
      this.stats.activeListeners -= count;
      console.log(`🧹 [EventBus] 清除 ${type} 的所有监听器: ${count}个`);
    } else {
      const totalCount = Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0);
      this.listeners.clear();
      this.stats.activeListeners = 0;
      console.log(`🧹 [EventBus] 清除所有监听器: ${totalCount}个`);
    }
  }

  /**
   * 获取事件历史
   */
  public getEventHistory(
    filter?: {
      type?: StructuralMatchingEventType;
      source?: string;
      fromTimestamp?: number;
      toTimestamp?: number;
      correlationId?: string;
    }
  ): StructuralMatchingEvent[] {
    let filteredHistory = [...this.eventHistory];

    if (filter) {
      if (filter.type) {
        filteredHistory = filteredHistory.filter(e => e.type === filter.type);
      }
      if (filter.source) {
        filteredHistory = filteredHistory.filter(e => e.source === filter.source);
      }
      if (filter.fromTimestamp) {
        filteredHistory = filteredHistory.filter(e => e.timestamp >= filter.fromTimestamp!);
      }
      if (filter.toTimestamp) {
        filteredHistory = filteredHistory.filter(e => e.timestamp <= filter.toTimestamp!);
      }
      if (filter.correlationId) {
        filteredHistory = filteredHistory.filter(e => e.correlationId === filter.correlationId);
      }
    }

    return filteredHistory.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 重放事件
   */
  public async replayEvents(
    events: StructuralMatchingEvent[],
    options: {
      respectTimestamp?: boolean;
      batchSize?: number;
      delayBetweenBatches?: number;
    } = {}
  ): Promise<void> {
    if (this.isReplaying) {
      console.warn('⚠️ [EventBus] 正在重放事件，忽略新的重放请求');
      return;
    }

    this.isReplaying = true;
    console.log(`🔄 [EventBus] 开始重放事件: ${events.length}个`);

    try {
      const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
      const batchSize = options.batchSize || 10;
      
      for (let i = 0; i < sortedEvents.length; i += batchSize) {
        const batch = sortedEvents.slice(i, i + batchSize);
        
        await Promise.all(batch.map(event => 
          this.emit(event.type, event.payload, `[REPLAY]${event.source}`, event.metadata)
        ));
        
        // 批次间延迟
        if (options.delayBetweenBatches && i + batchSize < sortedEvents.length) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
        }
      }

      console.log('✅ [EventBus] 事件重放完成');
    } catch (error) {
      console.error('❌ [EventBus] 事件重放失败:', error);
      throw error;
    } finally {
      this.isReplaying = false;
    }
  }

  /**
   * 获取统计信息
   */
  public getStats(): EventStats {
    return { ...this.stats };
  }

  /**
   * 清除历史记录
   */
  public clearHistory(): void {
    this.eventHistory = [];
    console.log('🧹 [EventBus] 清除事件历史');
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<StructuralMatchingEventType, number>,
      averageProcessingTime: 0,
      errorRate: 0,
      activeListeners: this.stats.activeListeners // 保留监听器数量
    };
    console.log('📊 [EventBus] 重置统计信息');
  }

  /**
   * 私有方法
   */
  private addToHistory(event: StructuralMatchingEvent): void {
    this.eventHistory.push(event);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private updateStats(event: StructuralMatchingEvent): void {
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁事件总线
   */
  public destroy(): void {
    this.removeAllListeners();
    this.clearHistory();
    this.resetStats();
    console.log('💥 [EventBus] 事件总线已销毁');
  }
}

export default StructuralMatchingEventBus;