// src/modules/loop-control/domain/loop-execution-engine.ts
// module: loop-control | layer: domain | role: service
// summary: 循环组真实执行引擎 - 使用与单步测试按钮相同的执行路径

import type { SmartScriptStep } from '../../../types/smartScript';
import { normalizeScriptStepsForBackend } from '../../../pages/SmartScriptBuilderPage/helpers/normalizeSteps';
import { getStepExecutionGateway } from '../../../infrastructure/gateways/StepExecutionGateway';
import { convertSmartStepToV2Request } from '../../../hooks/useV2StepTest';

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
   * @param loopSteps 循环内的步骤列表
   * @param iterations 循环次数
   * @param deviceId 设备ID
   * @param onProgress 进度回调
   * @param onStepComplete 步骤完成回调
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
   * 执行单个步骤 - 使用与单步测试按钮完全相同的路径（包括repeat逻辑）
   */
  private async executeSingleStep(step: SmartScriptStep, deviceId: string): Promise<{
    success: boolean;
    error?: string;
    logs?: string[];
  }> {
    try {
      // 🎯 使用与单步测试按钮完全相同的路径
      // StepTestButton → useSingleStepTest → useV2StepTest → StepExecutionGateway → run_step_v2
      console.log(`🔄 [LoopExecutionEngine] 执行步骤: ${step.name} (使用单步测试路径)`);
      
      // 1. 标准化步骤（和useStepTestV2MigrationFixed相同）
      const normalizedStep = {
        ...step,
        description: step.description || "",
        enabled: step.enabled ?? true,
        order: step.order ?? 0,
      };

      // 🔑 获取重复执行参数（与useV2StepTest完全相同）
      const params = step.parameters || {};
      const repeatCount = Number(params.repeat_count) || 1;
      const waitBetween = params.wait_between === true;
      const waitDuration = Number(params.wait_duration) || 500;

      console.log('🔄 [LoopExecutionEngine] 重复执行配置:', {
        stepName: step.name,
        repeatCount,
        waitBetween,
        waitDuration,
        stepType: step.step_type
      });

      // 2. 转换为V2请求格式（和useV2StepTest相同）
      const gateway = getStepExecutionGateway();
      const v2Request = convertSmartStepToV2Request(normalizedStep, deviceId, 'execute-step');
      
      console.log(`📋 [LoopExecutionEngine] V2请求参数:`, v2Request);
      
      // 🔄 重复执行逻辑（与useV2StepTest完全相同）
      let lastResponse: Awaited<ReturnType<typeof gateway.executeStep>> | null = null;
      const executionLogs: string[] = [];

      for (let i = 0; i < repeatCount; i++) {
        console.log(`🔄 [LoopExecutionEngine] 执行第 ${i + 1}/${repeatCount} 次: ${step.name}`);
        executionLogs.push(`执行第 ${i + 1}/${repeatCount} 次`);

        // 3. 使用StepExecutionGateway执行（和单步测试完全相同）
        const v2Result = await gateway.executeStep(v2Request);
        lastResponse = v2Result;

        if (!v2Result.success) {
          console.warn(`⚠️ [LoopExecutionEngine] 第 ${i + 1} 次执行失败:`, v2Result.message);
          executionLogs.push(`第 ${i + 1} 次执行失败: ${v2Result.message}`);
          // 如果某次执行失败，继续执行剩余次数（与useV2StepTest相同策略）
        } else {
          console.log(`✅ [LoopExecutionEngine] 第 ${i + 1} 次执行成功`);
          executionLogs.push(`第 ${i + 1} 次执行成功`);
        }

        // 🔥 修复：循环场景下每次执行后都需要等待（包括最后一次）
        // 原因：防止当前轮最后一次执行与下一轮第一次执行重叠
        if (waitBetween) {
          console.log(`⏳ [LoopExecutionEngine] 等待 ${waitDuration}ms 让动画完成`);
          executionLogs.push(`等待 ${waitDuration}ms`);
          await new Promise(resolve => setTimeout(resolve, waitDuration));
        }
      }

      // 使用最后一次执行的结果
      const finalResponse = lastResponse;
      if (!finalResponse) {
        throw new Error('所有执行尝试都失败了');
      }
      
      console.log(`✅ [LoopExecutionEngine] 步骤执行完成:`, {
        stepName: step.name,
        success: finalResponse.success,
        repeatCount,
        executionLogs
      });
      
      return {
        success: finalResponse.success,
        logs: [...(finalResponse.logs || []), ...executionLogs] // 合并执行日志
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