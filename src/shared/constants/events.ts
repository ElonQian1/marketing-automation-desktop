// src/shared/constants/events.ts
// module: shared | layer: constants | role: event-names
// summary: 统一的事件名称常量定义，防止硬编码和拼写错误

/**
 * 统一事件常量定义
 * 
 * 🎯 目标：
 * - 消除硬编码事件名称字符串
 * - 提供类型安全和IDE自动完成
 * - 便于重构和维护
 * - 防止拼写错误导致的bug
 * 
 * 🔧 使用方式：
 * ```typescript
 * import { EVENTS } from '@/shared/constants/events';
 * 
 * // 替代硬编码字符串
 * listen(EVENTS.DEVICE_CHANGE, handler);  // 而不是 listen('device-change', handler)
 * emit(EVENTS.ANALYSIS_PROGRESS, data);   // 而不是 emit('analysis:progress', data)
 * ```
 */

export const EVENTS = {
  // === 设备管理事件 ===
  /** 设备状态变化事件 */
  DEVICE_CHANGE: 'device-change',
  
  // === 日志管理事件 ===
  /** 新日志条目事件 */
  LOG_ENTRY: 'log-entry',
  /** ADB命令日志事件 */
  ADB_COMMAND_LOG: 'adb-command-log',
  /** 日志清理事件 */
  LOGS_CLEARED: 'logs-cleared',
  
  // === 智能分析事件 ===
  /** 分析进度更新事件 */
  ANALYSIS_PROGRESS: 'analysis:progress',
  /** 分析完成事件 */
  ANALYSIS_DONE: 'analysis:done',
  /** 分析错误事件 */
  ANALYSIS_ERROR: 'analysis:error',
  
  // === 联系人导入事件 (从ContactImporterUseCase中提取) ===
  /** 联系人导入开始 */
  CONTACT_IMPORT_START: 'contact:import:start',
  /** 联系人导入进度 */
  CONTACT_IMPORT_PROGRESS: 'contact:import:progress', 
  /** 联系人导入完成 */
  CONTACT_IMPORT_COMPLETE: 'contact:import:complete',
  /** 联系人导入错误 */
  CONTACT_IMPORT_ERROR: 'contact:import:error',
  
  // === 脚本执行事件 ===
  /** 脚本执行开始 */
  SCRIPT_EXECUTION_START: 'script:execution:start',
  /** 脚本执行进度 */
  SCRIPT_EXECUTION_PROGRESS: 'script:execution:progress',
  /** 脚本执行完成 */
  SCRIPT_EXECUTION_COMPLETE: 'script:execution:complete',
  /** 脚本执行错误 */
  SCRIPT_EXECUTION_ERROR: 'script:execution:error',
  
  // === 任务引擎事件 ===
  /** 任务状态变化 */
  TASK_STATUS_CHANGE: 'task:status:change',
  /** 任务分配 */
  TASK_ASSIGNED: 'task:assigned',
  /** 任务完成 */
  TASK_COMPLETED: 'task:completed',
  
} as const;

/**
 * 事件名称类型定义
 * 
 * 提供类型安全的事件名称约束
 */
export type EventName = typeof EVENTS[keyof typeof EVENTS];

/**
 * 事件分类枚举
 * 
 * 按功能模块对事件进行分类
 */
export const EVENT_CATEGORIES = {
  DEVICE: [EVENTS.DEVICE_CHANGE],
  LOGGING: [EVENTS.LOG_ENTRY, EVENTS.ADB_COMMAND_LOG, EVENTS.LOGS_CLEARED],
  ANALYSIS: [EVENTS.ANALYSIS_PROGRESS, EVENTS.ANALYSIS_DONE, EVENTS.ANALYSIS_ERROR],
  CONTACT_IMPORT: [
    EVENTS.CONTACT_IMPORT_START,
    EVENTS.CONTACT_IMPORT_PROGRESS,
    EVENTS.CONTACT_IMPORT_COMPLETE,
    EVENTS.CONTACT_IMPORT_ERROR
  ],
  SCRIPT_EXECUTION: [
    EVENTS.SCRIPT_EXECUTION_START,
    EVENTS.SCRIPT_EXECUTION_PROGRESS,
    EVENTS.SCRIPT_EXECUTION_COMPLETE,
    EVENTS.SCRIPT_EXECUTION_ERROR
  ],
  TASK_ENGINE: [
    EVENTS.TASK_STATUS_CHANGE,
    EVENTS.TASK_ASSIGNED,
    EVENTS.TASK_COMPLETED
  ]
} as const;

/**
 * 获取事件分类
 * @param eventName 事件名称
 * @returns 事件所属的分类
 */
export function getEventCategory(eventName: EventName): string | null {
  for (const [category, events] of Object.entries(EVENT_CATEGORIES)) {
    if ((events as readonly EventName[]).includes(eventName)) {
      return category;
    }
  }
  return null;
}

/**
 * 验证事件名称是否有效
 * @param eventName 待验证的事件名称
 * @returns 是否为有效的事件名称
 */
export function isValidEvent(eventName: string): eventName is EventName {
  return Object.values(EVENTS).includes(eventName as EventName);
}

// === 智能分析状态常量 ===
/**
 * 分析状态枚举，用于统一分析状态值
 */
export const ANALYSIS_STATES = {
  /** 空闲状态 */
  IDLE: 'idle',
  /** 分析中 */
  ANALYZING: 'analyzing', 
  /** 分析完成 */
  COMPLETED: 'analysis_completed',
  /** 分析失败 */
  FAILED: 'analysis_failed'
} as const;

export type AnalysisState = typeof ANALYSIS_STATES[keyof typeof ANALYSIS_STATES];