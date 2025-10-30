// src/modules/execution-flow-control/utils/step-type-adapter.ts
// module: execution-flow-control | layer: utils | role: 类型适配器
// summary: 连接ExtendedSmartScriptStep和执行流程控制类型的适配器

import type { ExtendedSmartScriptStep } from '../../../types/loopScript';
import type {
  ExecutionFailureHandlingConfig,
} from '../domain/failure-handling-strategy';
import { ExecutionFailureStrategy } from '../domain/failure-handling-strategy';
import type { ExecutionFlowControlStep } from '../domain/extended-step-types';
import { DEFAULT_FAILURE_HANDLING_CONFIG } from '../domain/failure-handling-strategy';

/**
 * 从 ExtendedSmartScriptStep 提取失败处理配置
 */
export function extractFailureConfigFromStep(
  step: ExtendedSmartScriptStep
): ExecutionFailureHandlingConfig | undefined {
  if (!step.failureHandling || !step.failureHandling.enabled) {
    return undefined;
  }

  // 转换格式：'STOP_SCRIPT' -> 'stop_script'
  const convertFromStepFormat = (strategy: 'STOP_SCRIPT' | 'CONTINUE_NEXT' | 'JUMP_TO_STEP' | 'RETRY_CURRENT' | 'SKIP_CURRENT'): ExecutionFailureStrategy => {
    switch (strategy) {
      case 'STOP_SCRIPT':
        return ExecutionFailureStrategy.STOP_SCRIPT;
      case 'CONTINUE_NEXT':
        return ExecutionFailureStrategy.CONTINUE_NEXT;
      case 'JUMP_TO_STEP':
        return ExecutionFailureStrategy.JUMP_TO_STEP;
      case 'RETRY_CURRENT':
        return ExecutionFailureStrategy.RETRY_CURRENT;
      case 'SKIP_CURRENT':
        return ExecutionFailureStrategy.SKIP_CURRENT;
      default:
        return ExecutionFailureStrategy.STOP_SCRIPT;
    }
  };

  return {
    strategy: convertFromStepFormat(step.failureHandling.strategy),
    targetStepId: step.failureHandling.jumpTarget,
    retryCount: step.failureHandling.retryCount || 3,
    retryIntervalMs: step.failureHandling.retryDelay || 1000,
    enableDetailedLogging: step.failureHandling.enabled
  };
}

/**
 * 将失败处理配置应用到 ExtendedSmartScriptStep
 */
export function applyFailureConfigToStep(
  step: ExtendedSmartScriptStep,
  config: ExecutionFailureHandlingConfig | undefined
): ExtendedSmartScriptStep {
  if (!config) {
    // 移除失败处理配置
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { failureHandling, ...stepWithoutFailureHandling } = step;
    return stepWithoutFailureHandling;
  }

  // 转换枚举值格式：'stop_script' -> 'STOP_SCRIPT'
  const convertStrategyFormat = (strategy: ExecutionFailureStrategy): 'STOP_SCRIPT' | 'CONTINUE_NEXT' | 'JUMP_TO_STEP' | 'RETRY_CURRENT' | 'SKIP_CURRENT' => {
    switch (strategy) {
      case 'stop_script':
        return 'STOP_SCRIPT';
      case 'continue_next':
        return 'CONTINUE_NEXT';
      case 'jump_to_step':
        return 'JUMP_TO_STEP';
      case 'retry_current':
        return 'RETRY_CURRENT';
      case 'skip_current':
        return 'SKIP_CURRENT';
      default:
        return 'STOP_SCRIPT';
    }
  };

  return {
    ...step,
    failureHandling: {
      strategy: convertStrategyFormat(config.strategy),
      jumpTarget: config.targetStepId,
      retryCount: config.retryCount,
      retryDelay: config.retryIntervalMs,
      enabled: config.enableDetailedLogging || true
    }
  };
}

/**
 * 转换 ExtendedSmartScriptStep 为 ExecutionFlowControlStep
 */
export function convertToExecutionFlowStep(
  step: ExtendedSmartScriptStep
): ExecutionFlowControlStep {
  const failureHandling = extractFailureConfigFromStep(step);
  
  return {
    ...step,
    failureHandling: failureHandling || DEFAULT_FAILURE_HANDLING_CONFIG
  };
}

/**
 * 批量转换步骤数组
 */
export function convertStepsToExecutionFlowSteps(
  steps: ExtendedSmartScriptStep[]
): ExecutionFlowControlStep[] {
  return steps.map(convertToExecutionFlowStep);
}

/**
 * 从 ExecutionFlowControlStep 转换回 ExtendedSmartScriptStep
 */
export function convertFromExecutionFlowStep(
  step: ExecutionFlowControlStep
): ExtendedSmartScriptStep {
  // 如果失败处理配置存在且启用，则包含在结果中
  const shouldIncludeFailureHandling = 
    step.failureHandling && 
    step.failureHandling.enableDetailedLogging;

  const baseStep: ExtendedSmartScriptStep = {
    id: step.id,
    step_type: step.step_type,
    name: step.name,
    description: step.description,
    parameters: step.parameters,
    enabled: step.enabled,
    order: step.order,
    
    // 保留其他字段
    loop_config: step.loop_config,
    parent_loop_id: step.parent_loop_id,
    is_in_loop: step.is_in_loop,
    enableStrategySelector: step.enableStrategySelector,
    strategySelector: step.strategySelector,
    find_condition: step.find_condition,
    verification: step.verification,
    retry_config: step.retry_config,
    fallback_actions: step.fallback_actions,
    pre_conditions: step.pre_conditions,
    post_conditions: step.post_conditions
  };

  if (shouldIncludeFailureHandling) {
    // 转换回步骤格式：'stop_script' -> 'STOP_SCRIPT'
    const convertToStepFormat = (strategy: ExecutionFailureStrategy): 'STOP_SCRIPT' | 'CONTINUE_NEXT' | 'JUMP_TO_STEP' | 'RETRY_CURRENT' | 'SKIP_CURRENT' => {
      switch (strategy) {
        case 'stop_script':
          return 'STOP_SCRIPT';
        case 'continue_next':
          return 'CONTINUE_NEXT';
        case 'jump_to_step':
          return 'JUMP_TO_STEP';
        case 'retry_current':
          return 'RETRY_CURRENT';
        case 'skip_current':
          return 'SKIP_CURRENT';
        default:
          return 'STOP_SCRIPT';
      }
    };
    
    return {
      ...baseStep,
      failureHandling: {
        strategy: convertToStepFormat(step.failureHandling.strategy),
        jumpTarget: step.failureHandling.targetStepId,
        retryCount: step.failureHandling.retryCount,
        retryDelay: step.failureHandling.retryIntervalMs,
        enabled: step.failureHandling.enableDetailedLogging || true
      }
    };
  }

  return baseStep;
}

/**
 * 批量转换执行流程步骤回原始类型
 */
export function convertFromExecutionFlowSteps(
  steps: ExecutionFlowControlStep[]
): ExtendedSmartScriptStep[] {
  return steps.map(convertFromExecutionFlowStep);
}

/**
 * 检查步骤是否有有效的失败处理配置
 */
export function hasValidFailureHandling(step: ExtendedSmartScriptStep): boolean {
  return Boolean(
    step.failureHandling &&
    step.failureHandling.enabled &&
    step.failureHandling.strategy
  );
}

/**
 * 获取步骤的失败处理策略（如果有的话）
 */
export function getStepFailureStrategy(
  step: ExtendedSmartScriptStep
): ExecutionFailureStrategy | undefined {
  if (!hasValidFailureHandling(step)) {
    return undefined;
  }
  return step.failureHandling!.strategy as ExecutionFailureStrategy;
}

/**
 * 为步骤创建默认的失败处理配置
 */
export function createDefaultFailureHandlingForStep(
  stepId: string,
  strategy: ExecutionFailureStrategy = ExecutionFailureStrategy.CONTINUE_NEXT
): ExecutionFailureHandlingConfig {
  return {
    ...DEFAULT_FAILURE_HANDLING_CONFIG,
    strategy,
    enableDetailedLogging: true
  };
}