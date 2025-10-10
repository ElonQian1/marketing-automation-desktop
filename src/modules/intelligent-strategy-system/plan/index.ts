/**
 * Strategy Plan Module Index
 * 策略计划模块索引文件
 * 
 * 统一导出所有 Plan 相关的类型和实现
 */

// 核心类
export { StrategyPlanFactory, getStrategyPlanFactory } from './StrategyPlanFactory';

// 类型定义 (从 types 模块导入)
export type {
  StrategyPlan,
  PlanMetadata,
  ExecutionConfig,
  LocalValidationResult,
  CandidateValidation,
  ValidationRisk,
  AssertionRule,
  FallbackExecutionContext,
  ExecutionAttempt,
  ExecutionResult,
  PlanGeneratorConfig,
  StrategyOptimization,
  OptimizationChange
} from '../types/StrategyPlanTypes';

// 工厂函数快速访问  
import { getStrategyPlanFactory } from './StrategyPlanFactory';
export const createPlanFactory = (config?: any) => getStrategyPlanFactory(config);

/**
 * 使用示例:
 * 
 * ```typescript
 * import { createPlanFactory } from '@/modules/intelligent-strategy-system/plan';
 * 
 * const factory = createPlanFactory({
 *   maxCandidates: 5,
 *   performanceMode: 'fast'
 * });
 * 
 * const plan = await factory.createPlanFromRecommendation(recommendation, context);
 * const result = await factory.executePlan(plan, context);
 * ```
 */