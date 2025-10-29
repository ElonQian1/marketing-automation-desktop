// src/modules/loop-control/domain/loop-execution-engine.ts
// module: loop-control | layer: domain | role: service
// summary: 循环组真实执行引擎 - 调用后端API执行循环内的步骤

import { invoke } from "@tauri-apps/api/core";
import { message } from "antd";
import type { SmartScriptStep } from '../../../types/smartScript';
import { normalizeScriptStepsForBackend } from '../../../pages/SmartScriptBuilderPage/helpers/normalizeSteps';

/**
 * 单步测试结果
 */
interface SingleStepTestResult {
  step_name: string;
  success: boolean;
  duration_ms: number;
  message?: string;
  error?: string;
}

/**
 * 循环执行结果
 */
export interface LoopExecutionResult {
  success: boolean;
  completed_iterations: number;
  total_iterations: number;
  executed_steps: number;
  failed_steps: number;
  duration_ms: number;
  logs: string[];
  error_message?: string;
}

/**
 * 循环执行进度回调
 */
export interface LoopExecutionProgress {
  iteration: number;
  step: number;
  total_steps_per_iteration: number;
  current_step_name: string;
  progress_percentage: number;
}

/**
 * 循环执行引擎 - 真实执行循环内的步骤
 */
export class LoopExecutionEngine {
  private isExecuting = false;
  private shouldStop = false;

  /**
   * 执行循环测试
   */
  async executeLoopTest(
    loopSteps: SmartScriptStep[],
    iterations: number,
    deviceId: string,
    onProgress?: (progress: LoopExecutionProgress) => void,
    onStepComplete?: (stepName: string, success: boolean) => void
  ): Promise<LoopExecutionResult> {
    if (this.isExecuting) {
      throw new Error('循环测试已在执行中');
    }

    this.isExecuting = true;
    this.shouldStop = false;

    console.log('🎯 [LoopExecutionEngine] 开始执行循环测试', {
      loopSteps: loopSteps.length,
      iterations,
      deviceId
    });

    const startTime = Date.now();
    let completedIterations = 0;
    let totalExecutedSteps = 0;
    let totalFailedSteps = 0;
    const allLogs: string[] = [];

    try {
      // 标准化步骤（与正式执行脚本使用相同的处理）
      const normalizedSteps = normalizeScriptStepsForBackend(loopSteps);
      const stepsPerIteration = normalizedSteps.length;

      console.log('📋 [LoopExecutionEngine] 标准化后的步骤', {
        original: loopSteps.length,
        normalized: normalizedSteps.length
      });

      // 执行循环
      for (let iteration = 1; iteration <= iterations && !this.shouldStop; iteration++) {
        console.log(`🔄 [LoopExecutionEngine] 开始第 ${iteration}/${iterations} 轮循环`);

        // 执行当前轮次的所有步骤
        for (let stepIndex = 0; stepIndex < normalizedSteps.length && !this.shouldStop; stepIndex++) {
          const step = normalizedSteps[stepIndex];
          const progressInfo: LoopExecutionProgress = {
            iteration,
            step: stepIndex + 1,
            total_steps_per_iteration: stepsPerIteration,
            current_step_name: step.name || `步骤 ${stepIndex + 1}`,
            progress_percentage: ((completedIterations * stepsPerIteration + stepIndex + 1) / (iterations * stepsPerIteration)) * 100
          };

          onProgress?.(progressInfo);

          try {
            console.log(`📝 [LoopExecutionEngine] 执行步骤: ${step.name} (${step.step_type})`);

            // 调用后端执行单个步骤
            const stepResult = await this.executeSingleStep(step, deviceId);
            
            if (stepResult.success) {
              console.log(`✅ [LoopExecutionEngine] 步骤执行成功: ${step.name}`);
              totalExecutedSteps++;
              onStepComplete?.(step.name || '未命名步骤', true);
            } else {
              console.log(`❌ [LoopExecutionEngine] 步骤执行失败: ${step.name}`, stepResult.error);
              totalFailedSteps++;
              onStepComplete?.(step.name || '未命名步骤', false);
              allLogs.push(`步骤 "${step.name}" 执行失败: ${stepResult.error}`);
            }

            allLogs.push(...(stepResult.logs || []));

          } catch (error) {
            console.error(`💥 [LoopExecutionEngine] 步骤执行异常: ${step.name}`, error);
            totalFailedSteps++;
            onStepComplete?.(step.name || '未命名步骤', false);
            allLogs.push(`步骤 "${step.name}" 执行异常: ${error}`);
          }
        }

        completedIterations++;
        console.log(`✅ [LoopExecutionEngine] 完成第 ${iteration}/${iterations} 轮循环`);
      }

      const duration = Date.now() - startTime;
      const result: LoopExecutionResult = {
        success: totalFailedSteps === 0 && !this.shouldStop,
        completed_iterations: completedIterations,
        total_iterations: iterations,
        executed_steps: totalExecutedSteps,
        failed_steps: totalFailedSteps,
        duration_ms: duration,
        logs: allLogs,
        error_message: this.shouldStop ? '用户停止执行' : undefined
      };

      console.log('🏁 [LoopExecutionEngine] 循环测试完成', result);
      return result;

    } catch (error) {
      console.error('💥 [LoopExecutionEngine] 循环测试执行失败', error);
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        completed_iterations: completedIterations,
        total_iterations: iterations,
        executed_steps: totalExecutedSteps,
        failed_steps: totalFailedSteps + 1,
        duration_ms: duration,
        logs: allLogs,
        error_message: `循环执行失败: ${error}`
      };
    } finally {
      this.isExecuting = false;
      this.shouldStop = false;
    }
  }

  /**
   * 停止循环执行
   */
  stop(): void {
    if (this.isExecuting) {
      console.log('🛑 [LoopExecutionEngine] 收到停止信号');
      this.shouldStop = true;
    }
  }

  /**
   * 检查是否正在执行
   */
  isRunning(): boolean {
    return this.isExecuting;
  }

  /**
   * 执行单个步骤
   */
  private async executeSingleStep(step: SmartScriptStep, deviceId: string): Promise<{
    success: boolean;
    error?: string;
    logs?: string[];
  }> {
    try {
      // 调用后端执行单个步骤 - 使用现有的单步测试API
      const result = await invoke('execute_single_step_test', {
        deviceId: deviceId,
        step: step
      }) as SingleStepTestResult;

      console.log(`✅ [LoopExecutionEngine] 步骤执行成功:`, result);
      
      return {
        success: true,
        logs: [`步骤 "${step.name}" 执行成功 (耗时: ${result.duration_ms}ms)`]
      };

    } catch (error) {
      console.error(`❌ [LoopExecutionEngine] 步骤执行失败:`, error);
      return {
        success: false,
        error: String(error),
        logs: [`步骤 "${step.name}" 执行失败: ${error}`]
      };
    }
  }
}

// 单例实例
export const loopExecutionEngine = new LoopExecutionEngine();