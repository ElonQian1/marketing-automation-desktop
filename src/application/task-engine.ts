// src/application/task-engine.ts
// module: application | layer: application | role: application-logic
// summary: 应用逻辑

/**
 * 统一任务引擎导出入口
 * 
 * 🎯 目标：提供统一的导入入口，简化使用体验
 * 🔄 策略：桶文件模式，集中导出所有相关接口
 * 📅 创建：任务引擎架构整合阶段
 * 
 * 🚀 使用方式：
 * ```typescript
 * // 统一接口 (推荐)
 * import { useUnifiedTaskEngine, enhancedTaskEngineManager } from '@/application/task-engine';
 * 
 * // 兼容接口 (现有代码)
 * import { TaskExecutionEngine, useTaskEngine } from '@/application/task-engine';
 * ```
 */

// ==================== 核心接口导出 ====================

// 统一接口
export type { UnifiedTaskEngine } from './services/task-execution/UnifiedTaskEngine';
export { EnhancedTaskEngineManager, enhancedTaskEngineManager } from './services/task-execution/EnhancedTaskEngineManager';

// 统一Hook
export { 
  useUnifiedTaskEngine,
  useTaskGeneration,
  useTaskExecution,
  useTaskQuery,
  useTaskStats
} from './hooks/useUnifiedTaskEngine';

// ==================== 类型导出 ====================

// 核心接口类型
export type {
  UnifiedTaskGenerationParams,
  UnifiedTaskGenerationResult,
  UnifiedTaskExecutionParams,
  UnifiedTaskExecutionResult,
  UnifiedTaskQueryParams,
  UnifiedTaskQueryResult,
  UnifiedTaskAssignmentResult,
  UnifiedTaskExecutionStats,
  TaskPriority
} from './services/task-execution/UnifiedTaskEngine';

// Hook类型
export type {
  UseUnifiedTaskEngineState,
  UseUnifiedTaskEngineActions,
  UseUnifiedTaskEngineReturn,
  UseUnifiedTaskEngineOptions
} from './hooks/useUnifiedTaskEngine';

// 枚举类型
export {
  ExecutionStrategy,
  ExecutorMode,
  ResultCode
} from './services/task-execution/UnifiedTaskEngine';

// ==================== 兼容性导出 ====================

// 适配器
export {
  TaskExecutionEngineAdapter,
  TaskEngineServiceAdapter,
  TaskGeneratorAdapter,
  TaskQueryServiceAdapter,
  TaskManagerAdapter,
  useTaskEngineAdapter,
  useTaskManagementAdapter
} from './TaskEngineAdapter';

// 兼容别名
export {
  taskExecutionEngineAdapter as TaskExecutionEngine,
  taskEngineServiceAdapter as TaskEngineService,
  taskGeneratorAdapter as TaskGenerator,
  taskQueryServiceAdapter as TaskQueryService,
  taskManagerAdapter as TaskManager,
  useTaskEngineAdapter as useTaskEngine,
  useTaskManagementAdapter as useTaskManagement
} from './TaskEngineAdapter';

// ==================== 便捷导出 ====================

/**
 * 🎯 默认统一任务引擎实例
 * 
 * 便捷访问全局任务引擎管理器
 */
export { enhancedTaskEngineManager as default } from './services/task-execution/EnhancedTaskEngineManager';

/**
 * 🔄 快速访问别名
 */
export { 
  enhancedTaskEngineManager as taskEngine,
  enhancedTaskEngineManager as unifiedTaskEngine,
  enhancedTaskEngineManager as taskManager
} from './services/task-execution/EnhancedTaskEngineManager';

// ==================== 迁移指南 ====================

/**
 * 📚 导入指南
 * 
 * ## 新项目 (推荐使用统一接口):
 * ```typescript
 * import { useUnifiedTaskEngine } from '@/application/task-engine';
 * import { enhancedTaskEngineManager } from '@/application/task-engine';
 * ```
 * 
 * ## 现有项目 (渐进式迁移):
 * ```typescript
 * // 第一阶段：保持现有导入不变 (适配器自动处理)
 * import { TaskExecutionEngine, useTaskEngine } from '@/application/task-engine';
 * 
 * // 第二阶段：逐个替换为统一接口
 * import { useUnifiedTaskEngine } from '@/application/task-engine';
 * 
 * // 第三阶段：完全切换到统一架构
 * const { generateTasks, executeTask } = useUnifiedTaskEngine();
 * ```
 * 
 * ## 类型导入:
 * ```typescript
 * import type { 
 *   UnifiedTaskGenerationParams,
 *   UnifiedTaskExecutionResult,
 *   UseUnifiedTaskEngineReturn
 * } from '@/application/task-engine';
 * ```
 */