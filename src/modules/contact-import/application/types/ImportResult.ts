// src/modules/contact-import/application/types/ImportResult.ts
// module: contact-import | layer: application | role: application-logic
// summary: 应用逻辑

// contact-import/application/types | ImportResult | 导入结果类型定义
// 包含导入操作的结果、统计、错误等应用层关注的数据结构

/**
 * 导入结果
 * 描述一次导入操作的完整结果信息
 */
export interface ImportResult {
  /** 导入是否成功 */
  success: boolean;
  
  /** 总联系人数量 */
  totalContacts: number;
  
  /** 成功导入的联系人数量 */
  importedContacts: number;
  
  /** 导入失败的联系人数量 */
  failedContacts: number;
  
  /** 跳过的联系人数量 */
  skippedContacts: number;
  
  /** 重复的联系人数量 */
  duplicateContacts: number;
  
  /** 导入耗时(毫秒) */
  duration: number;
  
  /** 结果消息 */
  message?: string;
  
  /** 详细结果信息 */
  details?: ImportDetails;
  
  /** 错误列表 */
  errors?: ImportError[];
}

/**
 * 导入详细信息
 * 提供导入过程的详细统计和结果
 */
export interface ImportDetails {
  /** 设备ID */
  deviceId: string;
  
  /** 设备名称 */
  deviceName: string;
  
  /** 开始时间 */
  startTime: Date;
  
  /** 结束时间 */
  endTime: Date;
  
  /** 已处理的批次数量 */
  processedBatches: number;
  
  /** 联系人导入结果列表 */
  contactResults: ContactImportResult[];
}

/**
 * 单个联系人导入结果
 * 描述单个联系人的导入状态和信息
 */
export interface ContactImportResult {
  /** 联系人ID */
  contactId: string;
  
  /** 联系人姓名 */
  contactName: string;
  
  /** 导入状态 */
  status: "success" | "failed" | "skipped" | "duplicate";
  
  /** 状态消息 */
  message?: string;
  
  /** 设备中的联系人ID */
  deviceContactId?: string;
}

/**
 * 导入错误信息
 * 描述导入过程中发生的错误详情
 */
export interface ImportError {
  /** 错误代码 */
  code: string;
  
  /** 错误消息 */
  message: string;
  
  /** 相关联系人ID */
  contactId?: string;
  
  /** 相关设备ID */
  deviceId?: string;
  
  /** 错误上下文信息 */
  context?: any;
  
  /** 错误发生时间 */
  timestamp: Date;
}

/**
 * 导入任务分组结果
 * 描述按设备分组的导入任务结果
 */
export interface ImportGroupResult {
  /** 设备ID */
  deviceId: string;
  
  /** 设备名称 */
  deviceName: string;
  
  /** 分配的联系人列表 */
  contacts: string[]; // Contact IDs
  
  /** 导入状态 */
  status: ImportStatus;
  
  /** 导入结果 */
  result?: ImportResult;
  
  /** 分组元数据 */
  metadata?: GroupMetadata;
}

/**
 * 导入状态枚举
 */
export enum ImportStatus {
  /** 等待中 */
  PENDING = "pending",
  
  /** 处理中 */
  PROCESSING = "processing",
  
  /** 已完成 */
  COMPLETED = "completed",
  
  /** 已失败 */
  FAILED = "failed",
  
  /** 已取消 */
  CANCELLED = "cancelled",
}

/**
 * 分组元数据
 * 包含导入分组的额外信息
 */
export interface GroupMetadata {
  /** 预估持续时间(毫秒) */
  estimatedDuration: number;
  
  /** 优先级 */
  priority: number;
  
  /** 重试次数 */
  retryCount: number;
  
  /** 最后尝试时间 */
  lastAttempt?: Date;
}