// src/modules/structural-matching/domain/events/structural-matching-event-types.ts
// module: structural-matching | layer: domain | role: 事件类型定义
// summary: 结构匹配功能的具体事件负载类型定义

import type { 
  UnifiedElementData,
  ValidationResult,
  EnhancedElementData 
} from '../../application/data/structural-matching-data-provider';

/**
 * 数据获取事件负载
 */
export interface DataFetchedPayload {
  data: UnifiedElementData;
  source: 'xml_cache' | 'step_card' | 'selection_context' | 'manual';
  cacheHit: boolean;
  fetchTime: number;
}

/**
 * 数据验证事件负载
 */
export interface DataValidatedPayload {
  data: UnifiedElementData;
  validation: ValidationResult;
  validationTime: number;
  autoRepairApplied: boolean;
}

/**
 * 数据增强事件负载
 */
export interface DataEnhancedPayload {
  originalData: UnifiedElementData;
  enhancedData: EnhancedElementData;
  enhancements: string[];
  enhancementTime: number;
}

/**
 * 数据缓存事件负载
 */
export interface DataCachedPayload {
  key: string;
  data: UnifiedElementData;
  ttl: number;
  size: number;
}

/**
 * 元素选择事件负载
 */
export interface ElementSelectedPayload {
  element: {
    xpath: string;
    text?: string;
    attributes: Record<string, string>;
    bounds: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
  };
  selectionMethod: 'click' | 'hover' | 'keyboard' | 'programmatic';
  confidence: number;
}

/**
 * 模态框事件负载
 */
export interface ModalEventPayload {
  modalId: string;
  data?: UnifiedElementData;
  previousState?: 'closed' | 'minimized';
  userAction?: 'click' | 'keyboard' | 'drag';
}

/**
 * 配置变更事件负载
 */
export interface ConfigChangedPayload {
  section: 'matching' | 'validation' | 'ui' | 'performance';
  changes: Record<string, unknown>;
  previousValues: Record<string, unknown>;
  userId?: string;
}

/**
 * 配置保存事件负载
 */
export interface ConfigSavedPayload {
  config: Record<string, unknown>;
  saveMethod: 'auto' | 'manual' | 'batch';
  saveLocation: 'local' | 'server' | 'cache';
  success: boolean;
}

/**
 * 分析开始事件负载
 */
export interface AnalysisStartedPayload {
  analysisId: string;
  type: 'full' | 'partial' | 'incremental';
  targetData: {
    elementCount: number;
    complexity: 'simple' | 'medium' | 'complex';
  };
  estimatedDuration: number;
}

/**
 * 分析完成事件负载
 */
export interface AnalysisCompletedPayload {
  analysisId: string;
  results: {
    matchCount: number;
    accuracy: number;
    processingTime: number;
    strategies: string[];
  };
  success: boolean;
  errors?: string[];
}

/**
 * 匹配执行事件负载
 */
export interface MatchingExecutedPayload {
  strategy: string;
  input: UnifiedElementData;
  results: {
    matches: Array<{
      xpath: string;
      confidence: number;
      method: string;
    }>;
    executionTime: number;
  };
  success: boolean;
}

/**
 * 签名生成事件负载
 */
export interface SignaturesGeneratedPayload {
  element: UnifiedElementData;
  signatures: {
    xpath: string[];
    text: string[];
    structural: string[];
    visual: string[];
  };
  generationTime: number;
  quality: number; // 0-100
}

/**
 * 错误事件负载
 */
export interface ErrorOccurredPayload {
  error: {
    code: string;
    message: string;
    stack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  context: {
    component: string;
    operation: string;
    data?: Record<string, unknown>;
  };
  recovery?: {
    attempted: boolean;
    successful: boolean;
    method: string;
  };
}

/**
 * 警告事件负载
 */
export interface WarningIssuedPayload {
  warning: {
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'important';
  };
  context: {
    component: string;
    trigger: string;
  };
  suggestion?: string;
}

/**
 * 性能测量事件负载
 */
export interface PerformanceMeasuredPayload {
  metric: {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count' | 'percentage';
  };
  context: {
    operation: string;
    component: string;
    dataSize?: number;
  };
  benchmark?: {
    baseline: number;
    threshold: number;
    status: 'good' | 'warning' | 'critical';
  };
}

/**
 * 缓存命中事件负载
 */
export interface CacheHitPayload {
  key: string;
  hitTime: number;
  dataAge: number;
  cacheType: 'memory' | 'disk' | 'network';
}

/**
 * 缓存未命中事件负载
 */
export interface CacheMissPayload {
  key: string;
  reason: 'not_found' | 'expired' | 'invalid' | 'evicted';
  fallbackAction: 'fetch' | 'generate' | 'use_default';
}

/**
 * 事件负载类型映射
 */
export interface EventPayloadMap {
  DATA_FETCHED: DataFetchedPayload;
  DATA_VALIDATED: DataValidatedPayload;
  DATA_ENHANCED: DataEnhancedPayload;
  DATA_CACHED: DataCachedPayload;
  ELEMENT_SELECTED: ElementSelectedPayload;
  MODAL_OPENED: ModalEventPayload;
  MODAL_CLOSED: ModalEventPayload;
  CONFIG_CHANGED: ConfigChangedPayload;
  CONFIG_SAVED: ConfigSavedPayload;
  ANALYSIS_STARTED: AnalysisStartedPayload;
  ANALYSIS_COMPLETED: AnalysisCompletedPayload;
  MATCHING_EXECUTED: MatchingExecutedPayload;
  SIGNATURES_GENERATED: SignaturesGeneratedPayload;
  ERROR_OCCURRED: ErrorOccurredPayload;
  WARNING_ISSUED: WarningIssuedPayload;
  PERFORMANCE_MEASURED: PerformanceMeasuredPayload;
  CACHE_HIT: CacheHitPayload;
  CACHE_MISS: CacheMissPayload;
}

/**
 * 类型安全的事件发射器函数类型
 */
export type TypedEventEmitter = {
  [K in keyof EventPayloadMap]: (
    payload: EventPayloadMap[K],
    source: string,
    metadata?: {
      userId?: string;
      sessionId?: string;
      traceId?: string;
      tags?: Record<string, string>;
    }
  ) => Promise<void>;
};

/**
 * 类型安全的事件监听器函数类型
 */
export type TypedEventListener = {
  [K in keyof EventPayloadMap]: (
    handler: (event: {
      type: K;
      payload: EventPayloadMap[K];
      timestamp: number;
      source: string;
      correlationId: string;
      metadata?: {
        userId?: string;
        sessionId?: string;
        traceId?: string;
        tags?: Record<string, string>;
      };
    }) => void | Promise<void>,
    config?: {
      priority?: number;
      once?: boolean;
      filter?: (event: any) => boolean;
      onError?: (error: Error, event: any) => void;
      timeout?: number;
    }
  ) => string;
};

/**
 * 常用事件过滤器
 */
export const EventFilters = {
  /**
   * 按来源过滤
   */
  bySource: (source: string) => (event: any) => event.source === source,

  /**
   * 按严重性过滤（错误和警告事件）
   */
  bySeverity: (severity: 'low' | 'medium' | 'high' | 'critical') => (event: any) => 
    event.payload?.error?.severity === severity || event.payload?.warning?.severity === severity,

  /**
   * 按成功状态过滤
   */
  bySuccess: (success: boolean) => (event: any) => event.payload?.success === success,

  /**
   * 按数据大小过滤
   */
  byDataSize: (minSize: number, maxSize?: number) => (event: any) => {
    const size = event.payload?.dataSize || event.payload?.size || 0;
    return maxSize ? size >= minSize && size <= maxSize : size >= minSize;
  },

  /**
   * 按时间范围过滤
   */
  byTimeRange: (fromTimestamp: number, toTimestamp: number) => (event: any) => 
    event.timestamp >= fromTimestamp && event.timestamp <= toTimestamp,

  /**
   * 按性能阈值过滤
   */
  byPerformanceThreshold: (threshold: number) => (event: any) => 
    event.payload?.metric?.value > threshold || 
    event.payload?.processingTime > threshold ||
    event.payload?.executionTime > threshold
};