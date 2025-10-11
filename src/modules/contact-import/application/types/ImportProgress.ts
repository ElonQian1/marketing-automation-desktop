// src/modules/contact-import/application/types/ImportProgress.ts
// module: contact-import | layer: application | role: application-logic
// summary: 应用逻辑

// contact-import/application/types | ImportProgress | 导入进度类型定义
// 包含导入操作的进度跟踪、状态监控等应用层关注的数据结构

import { ImportStatus } from "./ImportResult";

/**
 * 导入进度信息
 * 实时跟踪导入操作的进度和状态
 */
export interface ImportProgress {
  /** 总联系人数量 */
  totalContacts: number;
  
  /** 已处理联系人数量 */
  processedContacts: number;
  
  /** 当前处理的设备 */
  currentDevice?: string;
  
  /** 当前处理的联系人 */
  currentContact?: string;
  
  /** 完成百分比 (0-100) */
  percentage: number;
  
  /** 预估剩余时间(秒) */
  estimatedTimeRemaining: number;
  
  /** 处理速度 (联系人/秒) */
  speed: number;
  
  /** 当前状态 */
  status: ImportStatus;
  
  /** 当前阶段 */
  phase: ImportPhase;
  
  /** 阶段详细信息 */
  phaseDetails?: PhaseDetails;
  
  /** 性能指标 */
  performanceMetrics?: PerformanceMetrics;
}

/**
 * 导入阶段枚举
 * 描述导入过程的不同阶段
 */
export enum ImportPhase {
  /** 初始化中 */
  INITIALIZING = "initializing",
  
  /** 解析文件中 */
  PARSING = "parsing",
  
  /** 验证数据中 */
  VALIDATING = "validating",
  
  /** 分发任务中 */
  DISTRIBUTING = "distributing",
  
  /** 转换数据中 */
  CONVERTING = "converting",
  
  /** 导入数据中 */
  IMPORTING = "importing",
  
  /** 验证结果中 */
  VERIFYING = "verifying",
  
  /** 已完成 */
  COMPLETED = "completed",
}

/**
 * 阶段详细信息
 * 提供当前阶段的详细状态和信息
 */
export interface PhaseDetails {
  /** 阶段名称 */
  phaseName: string;
  
  /** 阶段描述 */
  description: string;
  
  /** 阶段开始时间 */
  startTime: Date;
  
  /** 阶段进度 (0-100) */
  phaseProgress: number;
  
  /** 阶段子任务 */
  subTasks?: SubTaskProgress[];
  
  /** 阶段特定数据 */
  phaseSpecificData?: Record<string, unknown>;
}

/**
 * 子任务进度
 * 跟踪阶段内子任务的进度
 */
export interface SubTaskProgress {
  /** 子任务ID */
  id: string;
  
  /** 子任务名称 */
  name: string;
  
  /** 子任务状态 */
  status: "pending" | "running" | "completed" | "failed";
  
  /** 子任务进度 (0-100) */
  progress: number;
  
  /** 子任务开始时间 */
  startTime?: Date;
  
  /** 子任务结束时间 */
  endTime?: Date;
}

/**
 * 性能指标
 * 监控导入过程的性能数据
 */
export interface PerformanceMetrics {
  /** CPU使用率 (0-100) */
  cpuUsage: number;
  
  /** 内存使用量 (MB) */
  memoryUsage: number;
  
  /** 网络使用量 (KB/s) */
  networkUsage: number;
  
  /** 磁盘I/O速度 (KB/s) */
  diskIOSpeed: number;
  
  /** 活跃设备数量 */
  activeDeviceCount: number;
  
  /** 平均响应时间 (毫秒) */
  averageResponseTime: number;
  
  /** 错误率 (0-100) */
  errorRate: number;
}

/**
 * 批次进度信息
 * 跟踪批处理的进度状态
 */
export interface BatchProgress {
  /** 批次ID */
  batchId: string;
  
  /** 批次序号 */
  batchIndex: number;
  
  /** 总批次数 */
  totalBatches: number;
  
  /** 批次大小 */
  batchSize: number;
  
  /** 批次状态 */
  status: "pending" | "processing" | "completed" | "failed";
  
  /** 批次进度 (0-100) */
  progress: number;
  
  /** 处理的联系人数量 */
  processedCount: number;
  
  /** 成功数量 */
  successCount: number;
  
  /** 失败数量 */
  failureCount: number;
  
  /** 批次开始时间 */
  startTime?: Date;
  
  /** 批次结束时间 */
  endTime?: Date;
  
  /** 目标设备ID */
  targetDeviceId?: string;
}

/**
 * 实时统计信息
 * 提供导入过程的实时统计数据
 */
export interface RealTimeStatistics {
  /** 总处理时间 (毫秒) */
  totalProcessingTime: number;
  
  /** 平均每个联系人处理时间 (毫秒) */
  averageContactProcessingTime: number;
  
  /** 最快处理时间 (毫秒) */
  fastestProcessingTime: number;
  
  /** 最慢处理时间 (毫秒) */
  slowestProcessingTime: number;
  
  /** 成功率 (0-100) */
  successRate: number;
  
  /** 当前并发数 */
  currentConcurrency: number;
  
  /** 最大并发数 */
  maxConcurrency: number;
  
  /** 队列长度 */
  queueLength: number;
}