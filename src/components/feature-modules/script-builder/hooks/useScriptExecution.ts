/**
 * 脚本执行管理 Hook
 * 处理脚本执行、监控、日志记录等功能
 */

import { useState, useCallback, useRef } from 'react';
import type {
  Script,
  ScriptStep,
  ExecutionResult,
  StepResult,
  ExecutionLog,
  StepStatus,
} from '../types';

/**
 * 执行状态
 */
interface ExecutionState {
  isRunning: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  result: ExecutionResult | null;
  logs: ExecutionLog[];
  error: string | null;
}

/**
 * 执行选项
 */
interface ExecutionOptions {
  /** 从指定步骤开始执行 */
  startFromStep?: number;
  /** 执行到指定步骤结束 */
  endAtStep?: number;
  /** 是否跳过禁用的步骤 */
  skipDisabled?: boolean;
  /** 是否在错误时停止 */
  stopOnError?: boolean;
  /** 是否记录详细日志 */
  verboseLogging?: boolean;
  /** 设备ID */
  deviceId?: string;
}

/**
 * 模拟执行器（实际项目中应该调用真实的ADB执行接口）
 */
class MockScriptExecutor {
  private abortController: AbortController | null = null;
  private onProgress?: (progress: { completed: number; total: number }) => void;
  private onStepStart?: (step: ScriptStep, index: number) => void;
  private onStepComplete?: (step: ScriptStep, result: StepResult) => void;
  private onLog?: (log: ExecutionLog) => void;

  setProgressCallback(callback: (progress: { completed: number; total: number }) => void) {
    this.onProgress = callback;
  }

  setStepStartCallback(callback: (step: ScriptStep, index: number) => void) {
    this.onStepStart = callback;
  }

  setStepCompleteCallback(callback: (step: ScriptStep, result: StepResult) => void) {
    this.onStepComplete = callback;
  }

  setLogCallback(callback: (log: ExecutionLog) => void) {
    this.onLog = callback;
  }

  async executeScript(
    script: Script,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    this.abortController = new AbortController();
    
    const startTime = Date.now();
    const result: ExecutionResult = {
      id: Date.now().toString(),
      scriptId: script.id,
      startTime,
      endTime: 0,
      status: 'success',
      stepResults: [],
      statistics: {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        totalDuration: 0,
      },
    };

    try {
      this.log('info', `开始执行脚本: ${script.name}`);
      
      const steps = script.steps.filter(step => 
        options.skipDisabled ? step.enabled : true
      );
      
      const startIndex = options.startFromStep || 0;
      const endIndex = options.endAtStep !== undefined 
        ? Math.min(options.endAtStep, steps.length - 1)
        : steps.length - 1;
        
      const executionSteps = steps.slice(startIndex, endIndex + 1);
      result.statistics.totalSteps = executionSteps.length;

      for (let i = 0; i < executionSteps.length; i++) {
        if (this.abortController.signal.aborted) {
          result.status = 'cancelled';
          break;
        }

        const step = executionSteps[i];
        const stepIndex = startIndex + i;
        
        this.onStepStart?.(step, stepIndex);
        this.onProgress?.({ completed: i, total: executionSteps.length });

        try {
          const stepResult = await this.executeStep(step, options);
          result.stepResults.push(stepResult);
          
          this.onStepComplete?.(step, stepResult);
          
          if (stepResult.status === 'completed') {
            result.statistics.completedSteps++;
          } else if (stepResult.status === 'failed') {
            result.statistics.failedSteps++;
            
            if (options.stopOnError || script.config.errorHandling === 'stop') {
              this.log('error', `步骤执行失败，停止执行: ${stepResult.error}`);
              result.status = 'failed';
              result.error = stepResult.error;
              break;
            }
          } else if (stepResult.status === 'skipped') {
            result.statistics.skippedSteps++;
          }
          
        } catch (error) {
          result.statistics.failedSteps++;
          this.log('error', `步骤执行异常: ${error}`);
          
          if (options.stopOnError || script.config.errorHandling === 'stop') {
            result.status = 'failed';
            result.error = String(error);
            break;
          }
        }
      }

      this.onProgress?.({ completed: executionSteps.length, total: executionSteps.length });
      
    } catch (error) {
      result.status = 'failed';
      result.error = String(error);
      this.log('error', `脚本执行失败: ${error}`);
    }

    result.endTime = Date.now();
    result.statistics.totalDuration = result.endTime - result.startTime;
    
    this.log('info', `脚本执行完成，状态: ${result.status}`);
    
    return result;
  }

  private async executeStep(
    step: ScriptStep,
    options: ExecutionOptions
  ): Promise<StepResult> {
    const startTime = Date.now();
    
    this.log('debug', `开始执行步骤: ${step.name} (${step.type})`);

    // 检查步骤是否启用
    if (!step.enabled) {
      return {
        stepId: step.id,
        status: 'skipped',
        startTime,
        endTime: Date.now(),
        duration: 0,
      };
    }

    try {
      // 模拟执行延迟
      const delay = step.parameters.delay || 1000;
      await this.sleep(delay);
      
      // 模拟步骤执行
      const success = await this.simulateStepExecution(step);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (success) {
        this.log('debug', `步骤执行成功: ${step.name}`);
        return {
          stepId: step.id,
          status: 'completed',
          startTime,
          endTime,
          duration,
          result: { success: true },
        };
      } else {
        const error = `步骤 ${step.name} 执行失败`;
        this.log('warn', error);
        return {
          stepId: step.id,
          status: 'failed',
          startTime,
          endTime,
          duration,
          error,
        };
      }
      
    } catch (error) {
      const endTime = Date.now();
      const errorMessage = `步骤 ${step.name} 执行异常: ${error}`;
      this.log('error', errorMessage);
      
      return {
        stepId: step.id,
        status: 'failed',
        startTime,
        endTime,
        duration: endTime - startTime,
        error: errorMessage,
      };
    }
  }

  private async simulateStepExecution(step: ScriptStep): Promise<boolean> {
    // 模拟不同类型步骤的执行成功率
    const successRates: Record<string, number> = {
      tap: 0.9,
      input: 0.95,
      swipe: 0.85,
      wait: 0.98,
      screenshot: 0.99,
      loop: 0.8,
      condition: 0.7,
      custom: 0.6,
    };
    
    const successRate = successRates[step.type] || 0.8;
    return Math.random() < successRate;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('执行被取消'));
      });
    });
  }

  private log(level: ExecutionLog['level'], message: string, stepId?: string) {
    this.onLog?.({
      id: Date.now().toString(),
      timestamp: Date.now(),
      level,
      message,
      stepId,
    });
  }

  abort() {
    this.abortController?.abort();
  }
}

/**
 * 脚本执行管理 Hook
 */
export const useScriptExecution = () => {
  const [state, setState] = useState<ExecutionState>({
    isRunning: false,
    isPaused: false,
    currentStepIndex: -1,
    progress: {
      completed: 0,
      total: 0,
      percentage: 0,
    },
    result: null,
    logs: [],
    error: null,
  });

  const executorRef = useRef<MockScriptExecutor | null>(null);

  // 开始执行脚本
  const executeScript = useCallback(async (
    script: Script,
    options: ExecutionOptions = {}
  ) => {
    if (state.isRunning) {
      throw new Error('脚本正在执行中');
    }

    // 重置状态
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentStepIndex: options.startFromStep || 0,
      progress: {
        completed: 0,
        total: script.steps.length,
        percentage: 0,
      },
      result: null,
      error: null,
      logs: [],
    }));

    try {
      // 创建执行器
      const executor = new MockScriptExecutor();
      executorRef.current = executor;

      // 设置回调
      executor.setProgressCallback(({ completed, total }) => {
        setState(prev => ({
          ...prev,
          progress: {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
        }));
      });

      executor.setStepStartCallback((step, index) => {
        setState(prev => ({
          ...prev,
          currentStepIndex: index,
        }));
      });

      executor.setStepCompleteCallback((step, result) => {
        // 可以在这里更新步骤状态
      });

      executor.setLogCallback((log) => {
        setState(prev => ({
          ...prev,
          logs: [...prev.logs, log],
        }));
      });

      // 执行脚本
      const result = await executor.executeScript(script, options);

      setState(prev => ({
        ...prev,
        isRunning: false,
        result,
        error: result.status === 'failed' ? result.error || null : null,
      }));

      return result;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: String(error),
      }));
      throw error;
    } finally {
      executorRef.current = null;
    }
  }, [state.isRunning]);

  // 停止执行
  const stopExecution = useCallback(() => {
    if (executorRef.current) {
      executorRef.current.abort();
      executorRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
    }));
  }, []);

  // 暂停执行（模拟，实际需要执行器支持）
  const pauseExecution = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  // 恢复执行
  const resumeExecution = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  // 清除日志
  const clearLogs = useCallback(() => {
    setState(prev => ({
      ...prev,
      logs: [],
    }));
  }, []);

  // 清除执行结果
  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    executeScript,
    stopExecution,
    pauseExecution,
    resumeExecution,
    clearLogs,
    clearResult,
  };
};