// contact-import/application/types | ImportEvent | 导入事件类型定义
// 包含导入操作的事件通知、状态变更等应用层关注的数据结构

/**
 * 导入事件
 * 描述导入过程中发生的各种事件
 */
export interface ImportEvent {
  /** 事件类型 */
  type: ImportEventType;
  
  /** 事件发生时间 */
  timestamp: Date;
  
  /** 事件数据载荷 */
  data: ImportEventData;
  
  /** 事件来源 */
  source?: string;
  
  /** 事件ID */
  eventId?: string;
  
  /** 相关联系人ID */
  contactId?: string;
  
  /** 相关设备ID */
  deviceId?: string;
}

/**
 * 导入事件类型枚举
 */
export enum ImportEventType {
  /** 导入开始 */
  IMPORT_STARTED = "import_started",
  
  /** 导入进度更新 */
  IMPORT_PROGRESS = "import_progress",
  
  /** 导入完成 */
  IMPORT_COMPLETED = "import_completed",
  
  /** 导入失败 */
  IMPORT_FAILED = "import_failed",
  
  /** 导入取消 */
  IMPORT_CANCELLED = "import_cancelled",
  
  /** 设备连接 */
  DEVICE_CONNECTED = "device_connected",
  
  /** 设备断开 */
  DEVICE_DISCONNECTED = "device_disconnected",
  
  /** 联系人处理完成 */
  CONTACT_PROCESSED = "contact_processed",
  
  /** 批次完成 */
  BATCH_COMPLETED = "batch_completed",
  
  /** 错误发生 */
  ERROR_OCCURRED = "error_occurred",
  
  /** 阶段变更 */
  PHASE_CHANGED = "phase_changed",
  
  /** 配置更新 */
  CONFIG_UPDATED = "config_updated",
}

/**
 * 导入事件数据联合类型
 */
export type ImportEventData = 
  | ImportStartedData
  | ImportProgressData
  | ImportCompletedData
  | ImportFailedData
  | ImportCancelledData
  | DeviceConnectedData
  | DeviceDisconnectedData
  | ContactProcessedData
  | BatchCompletedData
  | ErrorOccurredData
  | PhaseChangedData
  | ConfigUpdatedData;

/**
 * 导入开始事件数据
 */
export interface ImportStartedData {
  /** 任务ID */
  taskId: string;
  
  /** 总联系人数 */
  totalContacts: number;
  
  /** 参与设备列表 */
  deviceIds: string[];
  
  /** 配置信息 */
  configurationId: string;
  
  /** 开始时间 */
  startTime: Date;
}

/**
 * 导入进度事件数据
 */
export interface ImportProgressData {
  /** 任务ID */
  taskId: string;
  
  /** 已处理数量 */
  processedCount: number;
  
  /** 总数量 */
  totalCount: number;
  
  /** 进度百分比 */
  percentage: number;
  
  /** 当前阶段 */
  currentPhase: string;
  
  /** 预估剩余时间 */
  estimatedTimeRemaining: number;
}

/**
 * 导入完成事件数据
 */
export interface ImportCompletedData {
  /** 任务ID */
  taskId: string;
  
  /** 总耗时 */
  duration: number;
  
  /** 成功数量 */
  successCount: number;
  
  /** 失败数量 */
  failureCount: number;
  
  /** 跳过数量 */
  skippedCount: number;
  
  /** 完成时间 */
  completedTime: Date;
}

/**
 * 导入失败事件数据
 */
export interface ImportFailedData {
  /** 任务ID */
  taskId: string;
  
  /** 失败原因 */
  reason: string;
  
  /** 错误代码 */
  errorCode: string;
  
  /** 失败时间 */
  failedTime: Date;
  
  /** 已处理数量 */
  processedCount: number;
  
  /** 错误详情 */
  errorDetails?: Record<string, unknown>;
}

/**
 * 导入取消事件数据
 */
export interface ImportCancelledData {
  /** 任务ID */
  taskId: string;
  
  /** 取消原因 */
  reason: string;
  
  /** 取消时间 */
  cancelledTime: Date;
  
  /** 已处理数量 */
  processedCount: number;
  
  /** 取消者 */
  cancelledBy?: string;
}

/**
 * 设备连接事件数据
 */
export interface DeviceConnectedData {
  /** 设备ID */
  deviceId: string;
  
  /** 设备名称 */
  deviceName: string;
  
  /** 连接类型 */
  connectionType: string;
  
  /** 连接时间 */
  connectedTime: Date;
  
  /** 设备能力 */
  capabilities: string[];
}

/**
 * 设备断开事件数据
 */
export interface DeviceDisconnectedData {
  /** 设备ID */
  deviceId: string;
  
  /** 设备名称 */
  deviceName: string;
  
  /** 断开原因 */
  reason: string;
  
  /** 断开时间 */
  disconnectedTime: Date;
  
  /** 是否意外断开 */
  unexpected: boolean;
}

/**
 * 联系人处理事件数据
 */
export interface ContactProcessedData {
  /** 联系人ID */
  contactId: string;
  
  /** 联系人名称 */
  contactName: string;
  
  /** 处理状态 */
  status: "success" | "failed" | "skipped";
  
  /** 处理设备ID */
  deviceId: string;
  
  /** 处理时间 */
  processedTime: Date;
  
  /** 处理耗时 */
  processingDuration: number;
  
  /** 状态消息 */
  message?: string;
}

/**
 * 批次完成事件数据
 */
export interface BatchCompletedData {
  /** 批次ID */
  batchId: string;
  
  /** 批次序号 */
  batchIndex: number;
  
  /** 处理设备ID */
  deviceId: string;
  
  /** 批次大小 */
  batchSize: number;
  
  /** 成功数量 */
  successCount: number;
  
  /** 失败数量 */
  failureCount: number;
  
  /** 批次耗时 */
  duration: number;
  
  /** 完成时间 */
  completedTime: Date;
}

/**
 * 错误发生事件数据
 */
export interface ErrorOccurredData {
  /** 错误代码 */
  errorCode: string;
  
  /** 错误消息 */
  errorMessage: string;
  
  /** 错误级别 */
  severity: "low" | "medium" | "high" | "critical";
  
  /** 相关任务ID */
  taskId?: string;
  
  /** 相关联系人ID */
  contactId?: string;
  
  /** 相关设备ID */
  deviceId?: string;
  
  /** 错误上下文 */
  context?: Record<string, unknown>;
  
  /** 发生时间 */
  occurredTime: Date;
}

/**
 * 阶段变更事件数据
 */
export interface PhaseChangedData {
  /** 任务ID */
  taskId: string;
  
  /** 前一阶段 */
  previousPhase: string;
  
  /** 当前阶段 */
  currentPhase: string;
  
  /** 阶段变更时间 */
  changedTime: Date;
  
  /** 前一阶段耗时 */
  previousPhaseDuration?: number;
}

/**
 * 配置更新事件数据
 */
export interface ConfigUpdatedData {
  /** 配置ID */
  configId: string;
  
  /** 更新字段 */
  updatedFields: string[];
  
  /** 更新时间 */
  updatedTime: Date;
  
  /** 更新者 */
  updatedBy: string;
  
  /** 更新原因 */
  reason?: string;
}