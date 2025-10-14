// src/modules/precise-acquisition/index.ts
// module: prospecting | layer: public | role: barrel
// summary: 精准获客模块对外公共出口（契约/用例/Hook）

/**
 * 精准获客系统主导出文件
 * 
 * 仅导出对外稳定的API，不泄露内部实现细节
 */

// ==================== 核心服务门面 ====================
export { ProspectingAcquisitionService as PreciseAcquisitionService } from '../../application/services/prospecting-acquisition-service';

// ==================== 任务引擎服务 ====================
export { ProspectingTaskEngineService as TaskEngineService } from './task-engine/services/prospecting-task-engine-service';
export { ProspectingTaskExecutorService as TaskExecutorService } from './task-engine/services/prospecting-task-executor-service';
export { ProspectingTaskManager as TaskManager } from './task-engine/services/prospecting-task-manager';

// ==================== UI组件 ====================
export { ProspectingStepCard } from './components/prospecting-step-card';
export type { ProspectingStepCardProps } from './components/prospecting-step-card';

// ==================== 核心类型 ====================
export type {
  WatchTarget,
  Comment,
  Task,
  WatchTargetQueryParams,
  ImportValidationResult,
  TaskGenerationConfig,
  TaskQueryParams
} from './shared/types/core';

// ==================== 枚举常量 ====================
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

// ==================== 公共常量 ====================
export * from './shared/constants';

// Note: 不导出内部实现细节（如 domain/strategies、内部服务等）