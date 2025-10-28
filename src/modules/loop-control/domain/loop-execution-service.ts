// src/modules/loop-control/domain/loop-execution-service.ts
// module: loop-control | layer: domain | role: service
// summary: 循环执行服务 - 提取和执行循环内的步骤

import type { SmartScriptStep } from '../../../types/smartScript';
import { LoopPairingService } from './loop-pairing-service';

/**
 * 循环执行序列
 */
export interface LoopExecutionSequence {
  loopId: string;
  loopName: string;
  totalIterations: number;
  stepsPerIteration: number;
  steps: Array<{
    step: SmartScriptStep;
    iteration: number;        // 第几次循环（1-based）
    stepIndexInIteration: number;  // 在当前循环中的索引
  }>;
}

/**
 * 循环执行结果
 */
export interface LoopExecutionResult {
  loopId: string;
  success: boolean;
  completedIterations: number;
  totalIterations: number;
  failedAt?: {
    iteration: number;
    stepIndex: number;
    error: string;
  };
  duration: number; // 执行时长（毫秒）
}

/**
 * 循环执行服务
 * 
 * 职责：
 * 1. 提取循环内的步骤
 * 2. 构建执行序列（根据循环次数重复步骤）
 * 3. 验证执行序列的有效性
 * 4. 提供执行进度计算
 */
export class LoopExecutionService {
  /**
   * 提取循环内的步骤
   * @param steps 所有步骤
   * @param loopId 循环ID
   * @returns 循环内的步骤数组，如果循环无效则返回 null
   */
  static extractLoopSteps(
    steps: SmartScriptStep[],
    loopId: string
  ): SmartScriptStep[] | null {
    // 找到循环配对
    const pair = LoopPairingService.findPairByLoopId(steps, loopId);
    if (!pair) {
      console.warn(`[LoopExecutionService] 未找到 loop_id=${loopId} 的配对`);
      return null;
    }

    // 验证配对有效性
    if (!pair.isValid) {
      console.warn(`[LoopExecutionService] 循环配对无效：结束在开始之前`);
      return null;
    }

    // 提取循环内的步骤（开始和结束之间的步骤）
    const loopSteps = steps.slice(pair.startIndex + 1, pair.endIndex);

    return loopSteps;
  }

  /**
   * 构建循环执行序列
   * @param steps 所有步骤
   * @param loopId 循环ID
   * @param iterations 循环次数（可选，默认从配置中读取）
   * @returns 执行序列
   */
  static buildExecutionSequence(
    steps: SmartScriptStep[],
    loopId: string,
    iterations?: number
  ): LoopExecutionSequence | null {
    // 找到循环配对
    const pair = LoopPairingService.findPairByLoopId(steps, loopId);
    if (!pair) return null;

    // 提取循环内的步骤
    const loopSteps = this.extractLoopSteps(steps, loopId);
    if (!loopSteps || loopSteps.length === 0) {
      console.warn(`[LoopExecutionService] 循环内没有步骤`);
      return null;
    }

    // 获取循环次数
    const loopIterations = iterations || 
      (pair.startStep.parameters?.loop_count as number) || 
      1;

    // 检查无限循环
    if (loopIterations === -1) {
      console.warn(`[LoopExecutionService] 不支持测试无限循环`);
      return null;
    }

    // 构建执行序列：将步骤重复 N 次
    const executionSteps: LoopExecutionSequence['steps'] = [];
    
    for (let iteration = 1; iteration <= loopIterations; iteration++) {
      loopSteps.forEach((step, stepIndex) => {
        executionSteps.push({
          step,
          iteration,
          stepIndexInIteration: stepIndex,
        });
      });
    }

    return {
      loopId,
      loopName: (pair.startStep.parameters?.loop_name as string) || pair.startStep.name,
      totalIterations: loopIterations,
      stepsPerIteration: loopSteps.length,
      steps: executionSteps,
    };
  }

  /**
   * 验证执行序列是否有效
   */
  static validateExecutionSequence(sequence: LoopExecutionSequence): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 检查是否有步骤
    if (sequence.steps.length === 0) {
      errors.push('循环内没有步骤');
    }

    // 检查循环次数
    if (sequence.totalIterations <= 0) {
      errors.push('循环次数必须大于0');
    }

    // 检查步骤是否启用
    const disabledSteps = sequence.steps.filter(s => !s.step.enabled);
    if (disabledSteps.length === sequence.steps.length) {
      errors.push('循环内所有步骤都已禁用');
    }

    // 检查步骤类型
    const invalidSteps = sequence.steps.filter(s => 
      s.step.step_type === 'loop_start' || 
      s.step.step_type === 'loop_end'
    );
    if (invalidSteps.length > 0) {
      errors.push('循环内包含其他循环标记（可能是嵌套循环）');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 计算执行进度
   * @param currentStepIndex 当前步骤索引（从0开始）
   * @param totalSteps 总步骤数
   * @returns 进度百分比（0-100）
   */
  static calculateProgress(currentStepIndex: number, totalSteps: number): number {
    if (totalSteps === 0) return 0;
    return Math.round((currentStepIndex / totalSteps) * 100);
  }

  /**
   * 从执行序列中获取当前循环次数
   * @param stepIndex 当前步骤索引
   * @param sequence 执行序列
   * @returns 当前循环次数（1-based）
   */
  static getCurrentIteration(
    stepIndex: number,
    sequence: LoopExecutionSequence
  ): number {
    if (stepIndex < 0 || stepIndex >= sequence.steps.length) {
      return 1;
    }
    return sequence.steps[stepIndex].iteration;
  }

  /**
   * 获取当前步骤在循环内的位置
   */
  static getStepPositionInLoop(
    stepIndex: number,
    sequence: LoopExecutionSequence
  ): {
    iteration: number;
    stepIndexInIteration: number;
    stepName: string;
  } | null {
    if (stepIndex < 0 || stepIndex >= sequence.steps.length) {
      return null;
    }

    const current = sequence.steps[stepIndex];
    return {
      iteration: current.iteration,
      stepIndexInIteration: current.stepIndexInIteration,
      stepName: current.step.name,
    };
  }

  /**
   * 估算循环执行总时长
   * @param sequence 执行序列
   * @param averageStepDuration 平均步骤执行时长（毫秒）
   * @returns 估算总时长（毫秒）
   */
  static estimateDuration(
    sequence: LoopExecutionSequence,
    averageStepDuration: number = 1000
  ): number {
    return sequence.steps.length * averageStepDuration;
  }
}
