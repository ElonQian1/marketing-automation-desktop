/**
 * 任务引擎模块主入口
 * 
 * 导出任务引擎模块的所有公共组件、服务和类型
 */

// 服务层
export { TaskEngineService } from './services/TaskEngineService';
export { TaskExecutorService } from './services/TaskExecutorService';

// Hook
export { useTaskEngine } from './hooks/useTaskEngine';

// UI组件
export { TaskEngineManager } from './components/TaskEngineManager';
export { TaskExecutor } from './components/TaskExecutor';

// 类型定义
export type {
  TaskGenerationConfig,
  TaskGenerationResult,
  BatchTaskGenerationConfig,
  TaskExecutionStats,
  TaskQuery
} from './services/TaskEngineService';

export type {
  TaskExecutionContext,
  TaskExecutionResult
} from './services/TaskExecutorService';

export type {
  UseTaskEngineOptions,
  UseTaskEngineReturn
} from './hooks/useTaskEngine';