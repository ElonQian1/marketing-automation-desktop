// src/pages/precise-acquisition/modules/task-management/hooks/index.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 任务管理Hooks统一导出
 */
export { usePrecheckEvaluator } from './usePrecheckEvaluator';
export { useSemiAutoTasks } from '../semi-auto/useSemiAutoTasks';
export { useTaskManagement } from './useTaskManagement';
export { useTaskTemplates } from './useTaskTemplates';

// 导出类型
export type { TaskTemplate } from './useTaskTemplates';
export type {
  SemiAutoTask,
  SemiAutoTaskCreate,
  SemiAutoTaskUpdate,
  SemiAutoTaskFilter,
  SemiAutoTaskStats,
  PrecheckKey,
  PrecheckStatus,
  PrecheckResult,
  PrecheckContext,
  UsePrecheckEvaluatorResult
} from '../semi-auto/types';
export type { UseSemiAutoTasksOptions, UseSemiAutoTasksReturn } from '../semi-auto/useSemiAutoTasks';
