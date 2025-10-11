/**
 * 精准获客系统主导出文件
 * 
 * 整合所有子模块的导出，提供统一的模块接口
 */

// 主服务门面
export { PreciseAcquisitionService } from './PreciseAcquisitionService';

// ==================== 核心类型 ====================
export type {
  WatchTarget,
  Comment,
  Task
} from './shared/types/core';

// ==================== 常量导出 ====================
export {
  Platform,
  TaskType,
  TaskStatus,
  TaskPriority,
  TargetType,
  SourceType,
  IndustryTag,
  RegionTag,
  ExecutorMode,
  ResultCode,
  AuditAction
} from './shared/types/core';

// 审计系统
export * from './audit-system';

// 报告系统
export * from './reporting';

// 演示模块
export * from './demo';