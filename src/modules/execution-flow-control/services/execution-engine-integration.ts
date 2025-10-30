// src/modules/execution-flow-control/services/execution-engine-integration.ts
// module: execution-flow-control | layer: services | role: 执行引擎集成
// summary: 为现有执行引擎添加失败处理支持

import type { ExtendedSmartScriptStep } from '../../../types/loopScript';
import { ExecutionFlowController } from '../application/execution-flow-use-case';
import { 
  convertStepsToExecutionFlowSteps, 
  extractFailureConfigFromStep,
  hasValidFailureHandling 
} from '../utils/step-type-adapter';
import type { ExecutionFailureStrategy } from '../domain/failure-handling-strategy';

// 执行结果类型（兼容现有执行引擎）
interface StepExecutionResult {
  success: boolean;
  message: string;
  executorType?: string;
  data?: any;
}

// 执行上下文类型
interface ExecutionContext {
  currentStepIndex: number;
  totalSteps: number;
  device: string;
  config: {
    smart_recovery_enabled: boolean;
    auto_verification_enabled: boolean;
    detailed_logging: boolean;
  };
}

// 步骤执行器类型
type StepExecutor = (step: ExtendedSmartScriptStep, context: ExecutionContext) => Promise<StepExecutionResult>;

/**
 * 增强的脚本执行器，支持失败处理策略
 */
export class EnhancedScriptExecutor {
  private flowController: ExecutionFlowController | null = null;
  private stepExecutor: StepExecutor;

  constructor(stepExecutor: StepExecutor) {
    this.stepExecutor = stepExecutor;
  }

  /**
   * 执行带失败处理的脚本
   */
  async executeScriptWithFailureHandling(
    steps: ExtendedSmartScriptStep[],
    context: ExecutionContext
  ): Promise<{
    success: boolean;
    executedCount: number;
    failedCount: number;
    skippedCount: number;
    logs: string[];
    results: StepExecutionResult[];
  }> {
    console.log('🚀 [增强执行器] 开始执行带失败处理的脚本...');

    // 初始化流程控制器
    this.flowController = new ExecutionFlowController(steps);
    await this.flowController.startExecution();

    const results: StepExecutionResult[] = [];
    const logs: string[] = [];
    let executedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    while (!this.flowController.getState().isCompleted) {
      const state = this.flowController.getState();
      const currentStepId = state.currentStepId;
      
      if (!currentStepId) {
        console.error('❌ [增强执行器] 无法获取当前步骤ID');
        break;
      }

      const originalStep = steps.find(s => s.id === currentStepId);
      const stepIndex = steps.findIndex(s => s.id === currentStepId);
      
      if (!originalStep) {
        console.error(`❌ [增强执行器] 找不到原始步骤: ${currentStepId}`);
        break;
      }

      const stepContext: ExecutionContext = {
        ...context,
        currentStepIndex: stepIndex,
        totalSteps: steps.length
      };

      console.log(`🔄 [增强执行器] 执行步骤 ${stepIndex + 1}/${steps.length}: ${originalStep.name}`);

      try {
        // 执行步骤
        const result = await this.stepExecutor(originalStep, stepContext);
        results.push(result);

        if (result.success) {
          // 步骤成功
          console.log(`✅ [增强执行器] 步骤 ${stepIndex + 1} 执行成功`);
          logs.push(`✅ 步骤 ${stepIndex + 1}: ${originalStep.name} - 成功`);
          executedCount++;

          // 继续下一步
          this.flowController.markStepCompleted(currentStepId);
        } else {
          // 步骤失败
          console.warn(`❌ [增强执行器] 步骤 ${stepIndex + 1} 执行失败: ${result.message}`);
          failedCount++;

          const failureConfig = extractFailureConfigFromStep(originalStep);
          
          if (failureConfig) {
            console.log(`🔧 [增强执行器] 应用失败处理策略: ${failureConfig.strategy}`);
            
            switch (failureConfig.strategy) {
              case 'STOP_SCRIPT':
                logs.push(`🛑 步骤 ${stepIndex + 1}: ${originalStep.name} - 失败后停止执行`);
                console.log('🛑 [增强执行器] 根据失败处理策略停止执行');
                this.flowController.stopExecution();
                break;

              case 'CONTINUE_NEXT':
                logs.push(`⏭️ 步骤 ${stepIndex + 1}: ${originalStep.name} - 失败后继续执行`);
                console.log('⏭️ [增强执行器] 根据失败处理策略继续下一步');
                this.flowController.markStepCompleted(currentStepId);
                break;

              case 'JUMP_TO_STEP':
                if (failureConfig.jumpTarget) {
                  const targetIndex = steps.findIndex(s => s.id === failureConfig.jumpTarget);
                  if (targetIndex >= 0) {
                    logs.push(`🎯 步骤 ${stepIndex + 1}: ${originalStep.name} - 失败后跳转到步骤 ${targetIndex + 1}`);
                    console.log(`🎯 [增强执行器] 跳转到步骤: ${failureConfig.jumpTarget}`);
                    this.flowController.jumpToStep(failureConfig.jumpTarget);
                  } else {
                    console.error(`❌ [增强执行器] 找不到跳转目标步骤: ${failureConfig.jumpTarget}`);
                    this.flowController.stopExecution();
                  }
                } else {
                  console.error('❌ [增强执行器] 跳转策略缺少目标步骤ID');
                  this.flowController.stopExecution();
                }
                break;

              case 'RETRY_CURRENT':
                const currentRetries = state.stepRetries[currentStepId] || 0;
                const maxRetries = failureConfig.retryCount || 3;
                
                if (currentRetries < maxRetries) {
                  logs.push(`🔄 步骤 ${stepIndex + 1}: ${originalStep.name} - 重试中 (${currentRetries + 1}/${maxRetries})`);
                  console.log(`🔄 [增强执行器] 重试当前步骤 (${currentRetries + 1}/${maxRetries})`);
                  this.flowController.incrementRetryCount(currentStepId);
                  // 保持在当前步骤，下一轮循环会重新执行
                } else {
                  logs.push(`❌ 步骤 ${stepIndex + 1}: ${originalStep.name} - 重试次数已用完，继续下一步`);
                  console.log('❌ [增强执行器] 重试次数已用完');
                  this.flowController.markStepCompleted(currentStepId);
                }
                break;

              case 'SKIP_CURRENT':
                logs.push(`⏭️ 步骤 ${stepIndex + 1}: ${originalStep.name} - 跳过并继续`);
                console.log('⏭️ [增强执行器] 跳过当前步骤');
                skippedCount++;
                this.flowController.markStepCompleted(currentStepId);
                break;

              default:
                console.error('❌ [增强执行器] 未知的失败处理策略');
                this.flowController.stopExecution();
                break;
            }
          } else {
            // 没有配置失败处理策略，使用默认行为
            if (context.config.smart_recovery_enabled) {
              logs.push(`⏭️ 步骤 ${stepIndex + 1}: ${originalStep.name} - 失败后继续（默认行为）`);
              console.log('⏭️ [增强执行器] 使用默认失败处理：继续执行');
              this.flowController.markStepCompleted(currentStepId);
            } else {
              logs.push(`🛑 步骤 ${stepIndex + 1}: ${originalStep.name} - 失败后停止（默认行为）`);
              console.log('🛑 [增强执行器] 使用默认失败处理：停止执行');
              this.flowController.stopExecution();
            }
          }
        }

        // 添加步骤间延时
        const currentState = this.flowController.getState();
        if (!currentState.isCompleted && !currentState.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`💥 [增强执行器] 步骤 ${stepIndex + 1} 执行异常:`, error);
        results.push({
          success: false,
          message: error instanceof Error ? error.message : '未知错误',
          executorType: 'enhanced'
        });
        
        failedCount++;
        logs.push(`💥 步骤 ${stepIndex + 1}: ${originalStep.name} - 执行异常: ${error}`);
        
        // 异常情况也应用失败处理策略
        const failureConfig = extractFailureConfigFromStep(originalStep);
        if (failureConfig?.strategy === 'STOP_SCRIPT') {
          console.log('🛑 [增强执行器] 遇到异常且配置为停止，终止执行');
          this.flowController.stopExecution();
        } else {
          console.log('⏭️ [增强执行器] 遇到异常但继续执行');
          this.flowController.markStepCompleted(currentStepId);
        }
      }
    }

    const finalState = this.flowController.getState();
    
    console.log('📊 [增强执行器] 执行统计:', finalState.executionStats);
    console.log('🏁 [增强执行器] 脚本执行完成');

    return {
      success: failedCount === 0,
      executedCount,
      failedCount,
      skippedCount,
      logs,
      results
    };
  }

  /**
   * 检查脚本是否包含失败处理配置
   */
  static hasFailureHandlingSteps(steps: ExtendedSmartScriptStep[]): boolean {
    return steps.some(step => hasValidFailureHandling(step));
  }

  /**
   * 获取失败处理配置摘要
   */
  static getFailureHandlingSummary(steps: ExtendedSmartScriptStep[]): {
    totalSteps: number;
    stepsWithFailureHandling: number;
    strategyCounts: Record<ExecutionFailureStrategy, number>;
  } {
    const strategyCounts: Record<ExecutionFailureStrategy, number> = {
      'STOP_SCRIPT': 0,
      'CONTINUE_NEXT': 0,
      'JUMP_TO_STEP': 0,
      'RETRY_CURRENT': 0,
      'SKIP_CURRENT': 0
    };

    let stepsWithFailureHandling = 0;

    steps.forEach(step => {
      const config = extractFailureConfigFromStep(step);
      if (config && config.enabled) {
        stepsWithFailureHandling++;
        strategyCounts[config.strategy]++;
      }
    });

    return {
      totalSteps: steps.length,
      stepsWithFailureHandling,
      strategyCounts
    };
  }
}

/**
 * 创建增强的执行函数包装器
 */
export function createEnhancedExecuteScript(originalExecutor: StepExecutor) {
  const enhancedExecutor = new EnhancedScriptExecutor(originalExecutor);

  return async function executeScriptWithFailureHandling(
    steps: ExtendedSmartScriptStep[],
    context: ExecutionContext
  ) {
    console.log('🎯 [执行引擎集成] 检查是否需要使用增强执行器...');
    
    const hasFailureHandling = EnhancedScriptExecutor.hasFailureHandlingSteps(steps);
    
    if (hasFailureHandling) {
      console.log('✨ [执行引擎集成] 检测到失败处理配置，使用增强执行器');
      const summary = EnhancedScriptExecutor.getFailureHandlingSummary(steps);
      console.log('📋 [执行引擎集成] 失败处理配置摘要:', summary);
      
      return await enhancedExecutor.executeScriptWithFailureHandling(steps, context);
    } else {
      console.log('📝 [执行引擎集成] 未检测到失败处理配置，使用原始执行流程');
      
      // 如果没有失败处理配置，回退到原始执行逻辑
      const results: StepExecutionResult[] = [];
      let executedCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < steps.length; i++) {
        try {
          const result = await originalExecutor(steps[i], {
            ...context,
            currentStepIndex: i,
            totalSteps: steps.length
          });
          
          results.push(result);
          
          if (result.success) {
            executedCount++;
          } else {
            failedCount++;
            if (!context.config.smart_recovery_enabled) {
              break;
            }
          }
        } catch (error) {
          failedCount++;
          results.push({
            success: false,
            message: error instanceof Error ? error.message : '未知错误'
          });
          
          if (!context.config.smart_recovery_enabled) {
            break;
          }
        }
      }
      
      return {
        success: failedCount === 0,
        executedCount,
        failedCount,
        skippedCount: steps.length - executedCount - failedCount,
        logs: [`原始执行器: 成功${executedCount}/${steps.length}个步骤`],
        results
      };
    }
  };
}

export type { StepExecutionResult, ExecutionContext, StepExecutor };