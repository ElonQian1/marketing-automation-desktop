// src/modules/execution-flow-control/domain/extended-step-types.ts
// module: execution-flow-control | layer: domain | role: 扩展步骤类型定义
// summary: 为步骤添加失败处理配置支持，保持与现有类型的兼容性

import type { ExtendedSmartScriptStep } from '../../../types/loopScript';
import type { ExecutionFailureHandlingConfig } from './failure-handling-strategy';

/**
 * 扩展的智能脚本步骤，支持失败处理配置
 */
export interface ExecutionFlowControlStep extends ExtendedSmartScriptStep {
  /**
   * 失败处理配置
   */
  failureHandling?: ExecutionFailureHandlingConfig;
  
  /**
   * 执行重试状态（运行时动态更新）
   */
  retryState?: {
    /** 当前重试次数 */
    currentRetryCount: number;
    /** 最大重试次数 */
    maxRetryCount: number;
    /** 最后一次失败的错误信息 */
    lastError?: string;
    /** 重试开始时间 */
    retryStartTime?: number;
  };
  
  /**
   * 执行跳转状态（运行时动态更新）
   */
  jumpState?: {
    /** 是否是跳转的目标步骤 */
    isJumpTarget: boolean;
    /** 跳转源步骤ID */
    sourceStepId?: string;
    /** 跳转原因 */
    jumpReason?: string;
  };
  
  /**
   * 步骤执行统计（运行时动态更新）
   */
  executionStats?: {
    /** 总执行次数 */
    totalExecutions: number;
    /** 成功次数 */
    successCount: number;
    /** 失败次数 */
    failureCount: number;
    /** 平均执行时间（毫秒） */
    averageExecutionTime: number;
    /** 最后执行时间 */
    lastExecutionTime?: number;
    /** 最后执行状态 */
    lastExecutionStatus?: 'success' | 'failure' | 'skipped' | 'retrying';
  };
}

/**
 * 失败处理上下文信息
 * 包含执行过程中的状态和环境信息
 */
export interface FailureHandlingContext {
  /** 当前步骤信息 */
  currentStep: ExecutionFlowControlStep;
  
  /** 脚本所有步骤 */
  allSteps: ExecutionFlowControlStep[];
  
  /** 当前步骤在数组中的索引 */
  currentStepIndex: number;
  
  /** 执行状态统计 */
  executionStats: {
    totalSteps: number;
    executedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    retriedSteps: number;
  };
  
  /** 执行开始时间 */
  executionStartTime: number;
  
  /** 当前设备ID */
  deviceId?: string;
  
  /** 执行模式 */
  executionMode?: 'normal' | 'debug' | 'dryrun';
  
  /** 全局执行配置 */
  globalConfig?: {
    continueOnError?: boolean;
    maxGlobalRetries?: number;
    detailedLogging?: boolean;
  };
}

/**
 * 步骤执行结果扩展
 */
export interface ExecutionFlowControlResult {
  /** 步骤ID */
  stepId: string;
  
  /** 执行状态 */
  status: 'success' | 'failure' | 'skipped' | 'retrying' | 'jumped';
  
  /** 执行开始时间 */
  startTime: number;
  
  /** 执行结束时间 */
  endTime: number;
  
  /** 执行耗时（毫秒） */
  duration: number;
  
  /** 错误信息（如果失败） */
  error?: string;
  
  /** 失败处理决策（如果失败） */
  failureDecision?: {
    strategy: string;
    action: string;
    targetStepId?: string;
    targetStepIndex?: number;
    retryCount?: number;
    reason: string;
  };
  
  /** 重试信息（如果重试） */
  retryInfo?: {
    currentAttempt: number;
    maxAttempts: number;
    retryReason: string;
    nextRetryTime?: number;
  };
  
  /** 跳转信息（如果跳转） */
  jumpInfo?: {
    fromStepId: string;
    toStepId: string;
    jumpReason: string;
  };
  
  /** 附加的执行数据 */
  data?: Record<string, unknown>;
  
  /** 执行日志 */
  logs?: string[];
}

/**
 * 执行流程控制器状态
 */
export interface ExecutionFlowControllerState {
  /** 当前执行的步骤索引 */
  currentStepIndex: number;
  
  /** 是否正在执行 */
  isExecuting: boolean;
  
  /** 是否已暂停 */
  isPaused: boolean;
  
  /** 是否已停止 */
  isStopped: boolean;
  
  /** 执行结果历史 */
  executionHistory: ExecutionFlowControlResult[];
  
  /** 待执行的步骤队列（支持跳转） */
  pendingSteps: number[];
  
  /** 全局重试计数器 */
  globalRetryCount: number;
  
  /** 执行开始时间 */
  executionStartTime?: number;
  
  /** 最后一次错误 */
  lastError?: string;
}

/**
 * 类型守卫：检查步骤是否支持失败处理
 */
export function hasFailureHandling(step: ExtendedSmartScriptStep): step is ExecutionFlowControlStep {
  return 'failureHandling' in step;
}

/**
 * 类型守卫：检查步骤是否有失败处理配置
 */
export function hasFailureHandlingConfig(step: ExecutionFlowControlStep): boolean {
  return step.failureHandling !== undefined && step.failureHandling !== null;
}

/**
 * 默认的失败处理配置工厂
 */
export function createDefaultFailureHandling(): ExecutionFailureHandlingConfig {
  return {
    strategy: 'stop_script',
    enableDetailedLogging: true
  };
}

/**
 * 步骤类型适配器：将现有步骤转换为支持失败处理的步骤
 */
export function adaptStepForFailureHandling(
  step: ExtendedSmartScriptStep,
  failureHandling?: ExecutionFailureHandlingConfig
): ExecutionFlowControlStep {
  return {
    ...step,
    failureHandling: failureHandling || createDefaultFailureHandling(),
    retryState: {
      currentRetryCount: 0,
      maxRetryCount: failureHandling?.retryCount || 0
    },
    executionStats: {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0
    }
  };
}

/**
 * 批量适配器：将步骤数组批量转换
 */
export function adaptStepsForFailureHandling(
  steps: ExtendedSmartScriptStep[]
): ExecutionFlowControlStep[] {
  return steps.map(step => adaptStepForFailureHandling(step));
}