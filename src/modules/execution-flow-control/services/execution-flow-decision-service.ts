// src/modules/execution-flow-control/services/execution-flow-decision-service.ts
// module: execution-flow-control | layer: services | role: 执行流程决策服务
// summary: 根据失败处理配置做出执行决策，处理失败、重试、跳转等逻辑

import {
  ExecutionFailureStrategy,
  ExecutionFailureHandlingConfig,
  ExecutionFailureDecision,
  ExecutionFlowContext,
  ExecutionFailureHandlingValidator
} from '../domain/failure-handling-strategy';
import {
  ExecutionFlowControlStep,
  FailureHandlingContext,
  ExecutionFlowControlResult
} from '../domain/extended-step-types';

/**
 * 执行流程决策服务
 * 负责在步骤执行失败时做出正确的决策
 */
export class ExecutionFlowDecisionService {
  /**
   * 处理步骤执行失败，返回决策结果
   */
  static async handleStepFailure(
    failedStep: ExecutionFlowControlStep,
    error: Error | string,
    context: FailureHandlingContext
  ): Promise<ExecutionFailureDecision> {
    console.log(`🔍 [执行决策] 处理步骤失败: ${failedStep.name}`, { error: String(error) });

    // 获取失败处理配置
    const config = failedStep.failureHandling;
    if (!config) {
      // 没有配置，使用默认策略（停止脚本）
      return this.createStopDecision('未配置失败处理策略，默认停止执行');
    }

    // 验证配置有效性
    const flowContext = this.buildFlowContext(context);
    const validation = ExecutionFailureHandlingValidator.validate(config, flowContext);
    
    if (!validation.valid) {
      console.warn(`⚠️ [执行决策] 失败处理配置无效:`, validation.errors);
      return this.createStopDecision(`配置无效: ${validation.errors.join(', ')}`);
    }

    // 根据策略做出决策
    switch (config.strategy) {
      case ExecutionFailureStrategy.STOP_SCRIPT:
        return this.handleStopScript(config, error, context);

      case ExecutionFailureStrategy.CONTINUE_NEXT:
        return this.handleContinueNext(config, error, context);

      case ExecutionFailureStrategy.JUMP_TO_STEP:
        return this.handleJumpToStep(config, error, context);

      case ExecutionFailureStrategy.RETRY_CURRENT:
        return this.handleRetryCurrent(config, error, context);

      case ExecutionFailureStrategy.SKIP_CURRENT:
        return this.handleSkipCurrent(config, error, context);

      default:
        console.warn(`⚠️ [执行决策] 未知的失败处理策略: ${config.strategy}`);
        return this.createStopDecision(`未知的失败处理策略: ${config.strategy}`);
    }
  }

  /**
   * 处理停止脚本策略
   */
  private static handleStopScript(
    config: ExecutionFailureHandlingConfig,
    error: Error | string,
    context: FailureHandlingContext
  ): ExecutionFailureDecision {
    const reason = config.failureMessage || `步骤执行失败: ${String(error)}`;
    
    return {
      action: ExecutionFailureStrategy.STOP_SCRIPT,
      shouldStop: true,
      shouldRetry: false,
      reason,
      context: {
        originalError: String(error),
        stepName: context.currentStep.name,
        stepIndex: context.currentStepIndex
      }
    };
  }

  /**
   * 处理继续下一步策略
   */
  private static handleContinueNext(
    config: ExecutionFailureHandlingConfig,
    error: Error | string,
    context: FailureHandlingContext
  ): ExecutionFailureDecision {
    const nextStepIndex = context.currentStepIndex + 1;
    const hasNextStep = nextStepIndex < context.allSteps.length;
    
    if (!hasNextStep) {
      return {
        action: ExecutionFailureStrategy.STOP_SCRIPT,
        shouldStop: true,
        shouldRetry: false,
        reason: '已是最后一个步骤，无法继续执行',
        context: {
          originalError: String(error),
          reachedEnd: true
        }
      };
    }

    return {
      action: ExecutionFailureStrategy.CONTINUE_NEXT,
      shouldStop: false,
      shouldRetry: false,
      reason: '跳过失败步骤，继续执行下一步',
      context: {
        originalError: String(error),
        skippedStepIndex: context.currentStepIndex,
        nextStepIndex
      }
    };
  }

  /**
   * 处理跳转到指定步骤策略
   */
  private static handleJumpToStep(
    config: ExecutionFailureHandlingConfig,
    error: Error | string,
    context: FailureHandlingContext
  ): ExecutionFailureDecision {
    let targetStepIndex: number;
    let targetStepId: string;

    // 优先使用步骤ID
    if (config.targetStepId) {
      const targetStep = context.allSteps.find(step => step.id === config.targetStepId);
      if (!targetStep) {
        return this.createStopDecision(`跳转目标步骤不存在: ${config.targetStepId}`);
      }
      targetStepIndex = context.allSteps.indexOf(targetStep);
      targetStepId = config.targetStepId;
    }
    // 使用步骤索引
    else if (config.targetStepIndex !== undefined) {
      targetStepIndex = config.targetStepIndex;
      if (targetStepIndex < 0 || targetStepIndex >= context.allSteps.length) {
        return this.createStopDecision(`跳转目标索引超出范围: ${targetStepIndex}`);
      }
      targetStepId = context.allSteps[targetStepIndex].id;
    }
    else {
      return this.createStopDecision('跳转策略未指定目标步骤');
    }

    // 检查是否会造成无限循环
    if (targetStepIndex === context.currentStepIndex) {
      return this.createStopDecision('不能跳转到当前步骤，避免无限循环');
    }

    return {
      action: ExecutionFailureStrategy.JUMP_TO_STEP,
      targetStepId,
      targetStepIndex,
      shouldStop: false,
      shouldRetry: false,
      reason: `跳转到步骤 #${targetStepIndex + 1}: ${context.allSteps[targetStepIndex].name}`,
      context: {
        originalError: String(error),
        sourceStepIndex: context.currentStepIndex,
        targetStepIndex,
        targetStepId
      }
    };
  }

  /**
   * 处理重试当前步骤策略
   */
  private static handleRetryCurrent(
    config: ExecutionFailureHandlingConfig,
    error: Error | string,
    context: FailureHandlingContext
  ): ExecutionFailureDecision {
    const currentRetryCount = context.currentStep.retryState?.currentRetryCount || 0;
    const maxRetryCount = config.retryCount || 0;

    // 检查是否已达到重试上限
    if (currentRetryCount >= maxRetryCount) {
      return {
        action: ExecutionFailureStrategy.STOP_SCRIPT,
        shouldStop: true,
        shouldRetry: false,
        reason: `已达到最大重试次数 (${maxRetryCount})，停止执行`,
        context: {
          originalError: String(error),
          retryCount: currentRetryCount,
          maxRetryCount
        }
      };
    }

    return {
      action: ExecutionFailureStrategy.RETRY_CURRENT,
      shouldStop: false,
      shouldRetry: true,
      retryCount: currentRetryCount + 1,
      reason: `重试当前步骤 (第 ${currentRetryCount + 1}/${maxRetryCount} 次)`,
      context: {
        originalError: String(error),
        retryCount: currentRetryCount + 1,
        maxRetryCount,
        retryInterval: config.retryIntervalMs || 1000
      }
    };
  }

  /**
   * 处理跳过当前步骤策略
   */
  private static handleSkipCurrent(
    config: ExecutionFailureHandlingConfig,
    error: Error | string,
    context: FailureHandlingContext
  ): ExecutionFailureDecision {
    const nextStepIndex = context.currentStepIndex + 1;
    const hasNextStep = nextStepIndex < context.allSteps.length;
    
    if (!hasNextStep) {
      return {
        action: ExecutionFailureStrategy.STOP_SCRIPT,
        shouldStop: true,
        shouldRetry: false,
        reason: '已是最后一个步骤，跳过后脚本结束',
        context: {
          originalError: String(error),
          reachedEnd: true
        }
      };
    }

    return {
      action: ExecutionFailureStrategy.SKIP_CURRENT,
      shouldStop: false,
      shouldRetry: false,
      reason: '跳过当前失败步骤，标记为已跳过',
      context: {
        originalError: String(error),
        skippedStepIndex: context.currentStepIndex,
        nextStepIndex
      }
    };
  }

  /**
   * 创建停止决策的快捷方法
   */
  private static createStopDecision(reason: string): ExecutionFailureDecision {
    return {
      action: ExecutionFailureStrategy.STOP_SCRIPT,
      shouldStop: true,
      shouldRetry: false,
      reason
    };
  }

  /**
   * 构建执行流程上下文
   */
  private static buildFlowContext(context: FailureHandlingContext): ExecutionFlowContext {
    return {
      currentStepIndex: context.currentStepIndex,
      currentStepId: context.currentStep.id,
      totalSteps: context.allSteps.length,
      executedSteps: context.executionStats.executedSteps,
      failedSteps: context.executionStats.failedSteps,
      skippedSteps: context.executionStats.skippedSteps,
      availableSteps: context.allSteps.map((step, index) => ({
        id: step.id,
        index,
        name: step.name,
        enabled: step.enabled
      }))
    };
  }

  /**
   * 应用执行决策，更新步骤状态
   */
  static applyDecision(
    step: ExecutionFlowControlStep,
    decision: ExecutionFailureDecision,
    context: FailureHandlingContext
  ): ExecutionFlowControlStep {
    const updatedStep = { ...step };

    // 更新重试状态
    if (decision.shouldRetry) {
      updatedStep.retryState = {
        currentRetryCount: decision.retryCount || 0,
        maxRetryCount: step.failureHandling?.retryCount || 0,
        lastError: decision.context?.originalError as string,
        retryStartTime: Date.now()
      };
    }

    // 更新跳转状态
    if (decision.action === ExecutionFailureStrategy.JUMP_TO_STEP) {
      updatedStep.jumpState = {
        isJumpTarget: false,
        sourceStepId: undefined,
        jumpReason: decision.reason
      };
    }

    // 更新执行统计
    if (updatedStep.executionStats) {
      updatedStep.executionStats.totalExecutions += 1;
      updatedStep.executionStats.failureCount += 1;
      updatedStep.executionStats.lastExecutionTime = Date.now();
      updatedStep.executionStats.lastExecutionStatus = decision.shouldRetry ? 'retrying' : 'failure';
    }

    return updatedStep;
  }

  /**
   * 标记跳转目标步骤
   */
  static markJumpTarget(
    targetStep: ExecutionFlowControlStep,
    sourceStepId: string,
    jumpReason: string
  ): ExecutionFlowControlStep {
    return {
      ...targetStep,
      jumpState: {
        isJumpTarget: true,
        sourceStepId,
        jumpReason
      }
    };
  }

  /**
   * 记录执行决策日志
   */
  static logDecision(decision: ExecutionFailureDecision, stepName: string): void {
    const logLevel = decision.shouldStop ? 'error' : decision.shouldRetry ? 'warn' : 'info';
    const actionIcon = {
      [ExecutionFailureStrategy.STOP_SCRIPT]: '🛑',
      [ExecutionFailureStrategy.CONTINUE_NEXT]: '⏭️',
      [ExecutionFailureStrategy.JUMP_TO_STEP]: '🎯',
      [ExecutionFailureStrategy.RETRY_CURRENT]: '🔄',
      [ExecutionFailureStrategy.SKIP_CURRENT]: '⏸️'
    }[decision.action] || '❓';

    const message = `${actionIcon} [失败处理] ${stepName}: ${decision.reason}`;
    
    switch (logLevel) {
      case 'error':
        console.error(message, decision.context);
        break;
      case 'warn':
        console.warn(message, decision.context);
        break;
      default:
        console.log(message, decision.context);
        break;
    }
  }
}