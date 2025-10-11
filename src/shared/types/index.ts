// src/shared/types/index.ts
// module: shared | layer: shared | role: 共享工具
// summary: 跨模块共享的工具和类型

/**
 * 统一枚举重新导出
 * 解决多重定义冲突，优先使用 constants/precise-acquisition-enums.ts 中的定义
 */

import {
  Platform,
  PLATFORM_OPTIONS,
  TargetType,
  TARGET_TYPE_OPTIONS,
  SourceType,
  SOURCE_TYPE_OPTIONS,
  IndustryTag,
  INDUSTRY_TAG_OPTIONS,
  RegionTag,
  REGION_TAG_OPTIONS,
  TaskType,
  TASK_TYPE_OPTIONS,
  TaskStatus,
  TASK_STATUS_OPTIONS,
  ExecutorMode,
  EXECUTOR_MODE_OPTIONS,
  ResultCode,
  RESULT_CODE_OPTIONS,
} from '../../constants/precise-acquisition-enums';

// 重新导出统一的枚举定义
export {
  Platform,
  PLATFORM_OPTIONS,
  TargetType,
  TARGET_TYPE_OPTIONS,
  SourceType,
  SOURCE_TYPE_OPTIONS,
  IndustryTag,
  INDUSTRY_TAG_OPTIONS,
  RegionTag,
  REGION_TAG_OPTIONS,
  TaskType,
  TASK_TYPE_OPTIONS,
  TaskStatus,
  TASK_STATUS_OPTIONS,
  ExecutorMode,
  EXECUTOR_MODE_OPTIONS,
  ResultCode,
  RESULT_CODE_OPTIONS,
};

// 额外的类型支持（基于导入的枚举）
export type PlatformType = Platform;
export type TargetTypeType = TargetType;
export type TaskStatusType = TaskStatus;
export type TaskTypeType = TaskType;