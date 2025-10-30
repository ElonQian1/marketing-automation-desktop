// src/modules/execution-flow-control/application/execution-flow-use-case.ts
// module: execution-flow-control | layer: application | role: 执行流程控制用例
// summary: 提供执行流程控制的核心业务逻辑，协调决策服务和步骤管理

import {
  ExecutionFailureStrategy,
  ExecutionFailureHandlingConfig,
  ExecutionFailureDecision
} from '../domain/failure-handling-strategy';
import {
  ExecutionFlowControlStep,
  FailureHandlingContext,
  ExecutionFlowControlResult,
  ExecutionFlowControllerState,
  adaptStepForFailureHandling,
  hasFailureHandlingConfig
} from '../domain/extended-step-types';
import { ExecutionFlowDecisionService } from '../services/execution-flow-decision-service';
import type { ExtendedSmartScriptStep } from '../../../types/loopScript';

/**
 * 执行流程控制器
 * 管理整个脚本的执行流程，处理失败、重试、跳转等逻辑
 */
export class ExecutionFlowController {
  private state: ExecutionFlowControllerState;
  private steps: ExecutionFlowControlStep[];
  private onStepResult?: (result: ExecutionFlowControlResult) => void;
  private onStateChange?: (state: ExecutionFlowControllerState) => void;

  constructor(
    originalSteps: ExtendedSmartScriptStep[],
    options?: {
      onStepResult?: (result: ExecutionFlowControlResult) => void;
      onStateChange?: (state: ExecutionFlowControllerState) => void;
    }
  ) {
    // 转换步骤并添加失败处理支持
    this.steps = originalSteps.map(step => adaptStepForFailureHandling(step));
    
    // 初始化状态
    this.state = {
      currentStepIndex: 0,
      isExecuting: false,
      isPaused: false,
      isStopped: false,
      executionHistory: [],
      pendingSteps: [],
      globalRetryCount: 0
    };

    this.onStepResult = options?.onStepResult;
    this.onStateChange = options?.onStateChange;
  }

  /**
   * 开始执行脚本
   */
  async startExecution(deviceId?: string): Promise<void> {
    console.log('🚀 [执行控制器] 开始执行脚本', { 
      totalSteps: this.steps.length,
      deviceId 
    });

    this.updateState({
      isExecuting: true,
      isPaused: false,
      isStopped: false,
      currentStepIndex: 0,
      executionStartTime: Date.now(),
      pendingSteps: Array.from({ length: this.steps.length }, (_, i) => i)
    });

    try {
      await this.executeStepsSequentially(deviceId);
    } catch (error) {
      console.error('💥 [执行控制器] 脚本执行异常:', error);
      this.updateState({ 
        isExecuting: false, 
        isStopped: true,
        lastError: String(error)
      });
    }
  }

  /**
   * 暂停执行
   */
  pauseExecution(): void {
    console.log('⏸️ [执行控制器] 暂停执行');
    this.updateState({ isPaused: true });
  }

  /**
   * 恢复执行
   */
  resumeExecution(): void {
    console.log('▶️ [执行控制器] 恢复执行');
    this.updateState({ isPaused: false });
  }

  /**
   * 停止执行
   */
  stopExecution(): void {
    console.log('🛑 [执行控制器] 停止执行');
    this.updateState({ 
      isExecuting: false, 
      isStopped: true,
      isPaused: false
    });
  }

  /**
   * 为步骤设置失败处理配置
   */
  setStepFailureHandling(stepId: string, config: ExecutionFailureHandlingConfig): boolean {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      console.warn(`⚠️ [执行控制器] 步骤不存在: ${stepId}`);
      return false;
    }

    this.steps[stepIndex] = {
      ...this.steps[stepIndex],
      failureHandling: config
    };

    console.log(`✅ [执行控制器] 已设置步骤失败处理: ${stepId}`, config);
    return true;
  }

  /**
   * 获取步骤的失败处理配置
   */
  getStepFailureHandling(stepId: string): ExecutionFailureHandlingConfig | undefined {
    const step = this.steps.find(step => step.id === stepId);
    return step?.failureHandling;
  }

  /**
   * 获取当前状态
   */
  getState(): ExecutionFlowControllerState {
    return { ...this.state };
  }

  /**
   * 获取所有步骤
   */
  getSteps(): ExecutionFlowControlStep[] {
    return [...this.steps];
  }

  /**
   * 顺序执行步骤
   */
  private async executeStepsSequentially(deviceId?: string): Promise<void> {
    while (this.state.pendingSteps.length > 0 && !this.state.isStopped) {
      // 检查暂停状态
      if (this.state.isPaused) {
        await new Promise(resolve => {
          const checkPause = () => {
            if (!this.state.isPaused || this.state.isStopped) {
              resolve(undefined);
            } else {
              setTimeout(checkPause, 100);
            }
          };
          checkPause();
        });
      }

      if (this.state.isStopped) break;

      const stepIndex = this.state.pendingSteps.shift()!;
      await this.executeStep(stepIndex, deviceId);
    }

    // 执行完成
    this.updateState({ 
      isExecuting: false,
      currentStepIndex: this.steps.length 
    });
    
    console.log('🏁 [执行控制器] 脚本执行完成', {
      totalSteps: this.steps.length,
      executedSteps: this.state.executionHistory.filter(r => r.status === 'success').length,
      failedSteps: this.state.executionHistory.filter(r => r.status === 'failure').length,
      skippedSteps: this.state.executionHistory.filter(r => r.status === 'skipped').length
    });
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(stepIndex: number, deviceId?: string): Promise<void> {
    const step = this.steps[stepIndex];
    if (!step) {
      console.warn(`⚠️ [执行控制器] 步骤索引超出范围: ${stepIndex}`);
      return;
    }

    this.updateState({ currentStepIndex: stepIndex });

    const result: ExecutionFlowControlResult = {
      stepId: step.id,
      status: 'success',
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      logs: []
    };

    try {
      console.log(`📋 [执行控制器] 执行步骤 ${stepIndex + 1}/${this.steps.length}: ${step.name}`);
      
      // 这里应该调用实际的步骤执行逻辑
      // 为了演示，我们暂时模拟执行
      await this.executeStepLogic(step, deviceId);
      
      result.status = 'success';
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

      // 更新步骤统计
      if (step.executionStats) {
        step.executionStats.totalExecutions += 1;
        step.executionStats.successCount += 1;
        step.executionStats.lastExecutionTime = Date.now();
        step.executionStats.lastExecutionStatus = 'success';
        step.executionStats.averageExecutionTime = 
          ((step.executionStats.averageExecutionTime * (step.executionStats.totalExecutions - 1)) + result.duration) / 
          step.executionStats.totalExecutions;
      }

    } catch (error) {
      console.error(`❌ [执行控制器] 步骤执行失败: ${step.name}`, error);
      
      result.status = 'failure';
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      result.error = String(error);

      // 处理失败
      await this.handleStepFailure(step, stepIndex, error, result);
    }

    // 记录执行结果
    this.state.executionHistory.push(result);
    this.onStepResult?.(result);
  }

  /**
   * 处理步骤执行失败
   */
  private async handleStepFailure(
    step: ExecutionFlowControlStep,
    stepIndex: number,
    error: unknown,
    result: ExecutionFlowControlResult
  ): Promise<void> {
    // 构建失败处理上下文
    const context: FailureHandlingContext = {
      currentStep: step,
      allSteps: this.steps,
      currentStepIndex: stepIndex,
      executionStats: {
        totalSteps: this.steps.length,
        executedSteps: this.state.executionHistory.filter(r => r.status === 'success').length,
        failedSteps: this.state.executionHistory.filter(r => r.status === 'failure').length + 1,
        skippedSteps: this.state.executionHistory.filter(r => r.status === 'skipped').length,
        retriedSteps: this.state.executionHistory.filter(r => r.status === 'retrying').length
      },
      executionStartTime: this.state.executionStartTime || Date.now()
    };

    // 获取失败处理决策
    const decision = await ExecutionFlowDecisionService.handleStepFailure(
      step, 
      error as Error, 
      context
    );

    // 记录决策日志
    ExecutionFlowDecisionService.logDecision(decision, step.name);

    // 更新执行结果
    result.failureDecision = {
      strategy: decision.action,
      action: decision.action,
      targetStepId: decision.targetStepId,
      targetStepIndex: decision.targetStepIndex,
      retryCount: decision.retryCount,
      reason: decision.reason
    };

    // 应用决策
    this.applyFailureDecision(decision, step, stepIndex);
  }

  /**
   * 应用失败处理决策
   */
  private applyFailureDecision(
    decision: ExecutionFailureDecision,
    step: ExecutionFlowControlStep,
    stepIndex: number
  ): void {
    switch (decision.action) {
      case ExecutionFailureStrategy.STOP_SCRIPT:
        this.stopExecution();
        break;

      case ExecutionFailureStrategy.CONTINUE_NEXT:
        // 继续下一步（已在主循环中处理）
        break;

      case ExecutionFailureStrategy.JUMP_TO_STEP:
        this.handleJumpToStep(decision, stepIndex);
        break;

      case ExecutionFailureStrategy.RETRY_CURRENT:
        this.handleRetryStep(decision, stepIndex);
        break;

      case ExecutionFailureStrategy.SKIP_CURRENT:
        // 跳过当前步骤（已在主循环中处理）
        break;
    }
  }

  /**
   * 处理跳转到指定步骤
   */
  private handleJumpToStep(decision: ExecutionFailureDecision, sourceStepIndex: number): void {
    if (decision.targetStepIndex === undefined) return;

    // 将目标步骤插入到待执行队列的前面
    this.state.pendingSteps.unshift(decision.targetStepIndex);

    // 标记目标步骤
    if (decision.targetStepId) {
      const targetStep = this.steps[decision.targetStepIndex];
      this.steps[decision.targetStepIndex] = ExecutionFlowDecisionService.markJumpTarget(
        targetStep,
        this.steps[sourceStepIndex].id,
        decision.reason
      );
    }

    console.log(`🎯 [执行控制器] 跳转到步骤 ${decision.targetStepIndex + 1}: ${this.steps[decision.targetStepIndex].name}`);
  }

  /**
   * 处理重试当前步骤
   */
  private handleRetryStep(decision: ExecutionFailureDecision, stepIndex: number): void {
    // 将当前步骤重新插入到待执行队列的前面
    this.state.pendingSteps.unshift(stepIndex);

    // 更新重试状态
    const step = this.steps[stepIndex];
    this.steps[stepIndex] = ExecutionFlowDecisionService.applyDecision(
      step,
      decision,
      {
        currentStep: step,
        allSteps: this.steps,
        currentStepIndex: stepIndex,
        executionStats: {
          totalSteps: this.steps.length,
          executedSteps: 0,
          failedSteps: 0,
          skippedSteps: 0,
          retriedSteps: 0
        },
        executionStartTime: Date.now()
      }
    );

    // 等待重试间隔
    const retryInterval = step.failureHandling?.retryIntervalMs || 1000;
    if (retryInterval > 0) {
      setTimeout(() => {
        console.log(`🔄 [执行控制器] 重试步骤: ${step.name} (间隔 ${retryInterval}ms)`);
      }, retryInterval);
    }
  }

  /**
   * 实际的步骤执行逻辑（这里应该集成到现有的执行引擎）
   */
  private async executeStepLogic(step: ExecutionFlowControlStep, deviceId?: string): Promise<void> {
    // 这里应该调用现有的步骤执行逻辑
    // 比如 routeAndExecuteStep 函数
    
    // 为了演示，我们模拟执行时间和可能的失败
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    
    // 模拟随机失败（仅用于演示）
    if (Math.random() < 0.1) { // 10% 失败率
      throw new Error('模拟步骤执行失败');
    }
    
    console.log(`✅ [执行控制器] 步骤执行成功: ${step.name}`);
  }

  /**
   * 更新状态并触发回调
   */
  private updateState(updates: Partial<ExecutionFlowControllerState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }
}