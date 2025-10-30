// src/modules/execution-flow-control/hooks/use-execution-flow-control.ts
// module: execution-flow-control | layer: hooks | role: 执行流程控制Hook
// summary: 提供React Hook接口，简化执行流程控制的使用

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ExecutionFailureHandlingConfig,
  DEFAULT_FAILURE_HANDLING_CONFIG
} from '../domain/failure-handling-strategy';
import {
  ExecutionFlowControlStep,
  ExecutionFlowControlResult,
  ExecutionFlowControllerState
} from '../domain/extended-step-types';
import { ExecutionFlowController } from '../application/execution-flow-use-case';
import type { ExtendedSmartScriptStep } from '../../../types/loopScript';

export interface UseExecutionFlowControlOptions {
  /** 步骤执行结果回调 */
  onStepResult?: (result: ExecutionFlowControlResult) => void;
  /** 执行状态变化回调 */
  onStateChange?: (state: ExecutionFlowControllerState) => void;
  /** 执行完成回调 */
  onComplete?: (results: ExecutionFlowControlResult[]) => void;
  /** 执行错误回调 */
  onError?: (error: Error) => void;
}

export interface UseExecutionFlowControlReturn {
  /** 当前控制器状态 */
  state: ExecutionFlowControllerState;
  /** 所有步骤 */
  steps: ExecutionFlowControlStep[];
  /** 执行历史 */
  executionHistory: ExecutionFlowControlResult[];
  /** 是否正在执行 */
  isExecuting: boolean;
  /** 是否已暂停 */
  isPaused: boolean;
  /** 是否已停止 */
  isStopped: boolean;
  
  // 控制方法
  /** 开始执行 */
  startExecution: (deviceId?: string) => Promise<void>;
  /** 暂停执行 */
  pauseExecution: () => void;
  /** 恢复执行 */
  resumeExecution: () => void;
  /** 停止执行 */
  stopExecution: () => void;
  
  // 配置方法
  /** 设置步骤失败处理配置 */
  setStepFailureHandling: (stepId: string, config: ExecutionFailureHandlingConfig) => boolean;
  /** 获取步骤失败处理配置 */
  getStepFailureHandling: (stepId: string) => ExecutionFailureHandlingConfig | undefined;
  /** 批量设置失败处理配置 */
  setMultipleStepFailureHandling: (configs: Array<{ stepId: string; config: ExecutionFailureHandlingConfig }>) => void;
  /** 重置所有配置为默认值 */
  resetAllFailureHandling: () => void;
  
  // 统计方法
  /** 获取执行统计 */
  getExecutionStats: () => {
    totalSteps: number;
    executedSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
    retriedSteps: number;
    averageStepTime: number;
  };
}

/**
 * 执行流程控制Hook
 */
export function useExecutionFlowControl(
  initialSteps: ExtendedSmartScriptStep[],
  options: UseExecutionFlowControlOptions = {}
): UseExecutionFlowControlReturn {
  const controllerRef = useRef<ExecutionFlowController | null>(null);
  const [state, setState] = useState<ExecutionFlowControllerState>({
    currentStepIndex: 0,
    isExecuting: false,
    isPaused: false,
    isStopped: false,
    executionHistory: [],
    pendingSteps: [],
    globalRetryCount: 0
  });
  const [steps, setSteps] = useState<ExecutionFlowControlStep[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionFlowControlResult[]>([]);

  // 初始化控制器
  useEffect(() => {
    controllerRef.current = new ExecutionFlowController(initialSteps, {
      onStepResult: (result) => {
        setExecutionHistory(prev => [...prev, result]);
        options.onStepResult?.(result);
      },
      onStateChange: (newState) => {
        setState(newState);
        setExecutionHistory(newState.executionHistory);
        options.onStateChange?.(newState);
        
        // 检查是否执行完成
        if (!newState.isExecuting && newState.executionHistory.length > 0) {
          options.onComplete?.(newState.executionHistory);
        }
      }
    });

    setSteps(controllerRef.current.getSteps());
    setState(controllerRef.current.getState());
  }, [initialSteps]);

  // 开始执行
  const startExecution = useCallback(async (deviceId?: string) => {
    if (!controllerRef.current) return;
    
    try {
      await controllerRef.current.startExecution(deviceId);
    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [options]);

  // 暂停执行
  const pauseExecution = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.pauseExecution();
  }, []);

  // 恢复执行
  const resumeExecution = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.resumeExecution();
  }, []);

  // 停止执行
  const stopExecution = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.stopExecution();
  }, []);

  // 设置步骤失败处理配置
  const setStepFailureHandling = useCallback((stepId: string, config: ExecutionFailureHandlingConfig) => {
    if (!controllerRef.current) return false;
    
    const success = controllerRef.current.setStepFailureHandling(stepId, config);
    if (success) {
      setSteps(controllerRef.current.getSteps());
    }
    return success;
  }, []);

  // 获取步骤失败处理配置
  const getStepFailureHandling = useCallback((stepId: string) => {
    if (!controllerRef.current) return undefined;
    return controllerRef.current.getStepFailureHandling(stepId);
  }, []);

  // 批量设置失败处理配置
  const setMultipleStepFailureHandling = useCallback((configs: Array<{ stepId: string; config: ExecutionFailureHandlingConfig }>) => {
    if (!controllerRef.current) return;
    
    configs.forEach(({ stepId, config }) => {
      controllerRef.current!.setStepFailureHandling(stepId, config);
    });
    
    setSteps(controllerRef.current.getSteps());
  }, []);

  // 重置所有配置为默认值
  const resetAllFailureHandling = useCallback(() => {
    if (!controllerRef.current) return;
    
    const allSteps = controllerRef.current.getSteps();
    allSteps.forEach(step => {
      controllerRef.current!.setStepFailureHandling(step.id, DEFAULT_FAILURE_HANDLING_CONFIG);
    });
    
    setSteps(controllerRef.current.getSteps());
  }, []);

  // 获取执行统计
  const getExecutionStats = useCallback(() => {
    const totalSteps = steps.length;
    const executedSteps = executionHistory.length;
    const successfulSteps = executionHistory.filter(r => r.status === 'success').length;
    const failedSteps = executionHistory.filter(r => r.status === 'failure').length;
    const skippedSteps = executionHistory.filter(r => r.status === 'skipped').length;
    const retriedSteps = executionHistory.filter(r => r.status === 'retrying').length;
    
    const totalTime = executionHistory.reduce((sum, r) => sum + r.duration, 0);
    const averageStepTime = executedSteps > 0 ? totalTime / executedSteps : 0;

    return {
      totalSteps,
      executedSteps,
      successfulSteps,
      failedSteps,
      skippedSteps,
      retriedSteps,
      averageStepTime
    };
  }, [steps, executionHistory]);

  return {
    state,
    steps,
    executionHistory,
    isExecuting: state.isExecuting,
    isPaused: state.isPaused,
    isStopped: state.isStopped,
    
    startExecution,
    pauseExecution,
    resumeExecution,
    stopExecution,
    
    setStepFailureHandling,
    getStepFailureHandling,
    setMultipleStepFailureHandling,
    resetAllFailureHandling,
    
    getExecutionStats
  };
}

/**
 * 失败处理配置Hook
 * 用于单个步骤的失败处理配置管理
 */
export function useStepFailureHandling(
  stepId: string,
  initialConfig?: ExecutionFailureHandlingConfig
) {
  const [config, setConfig] = useState<ExecutionFailureHandlingConfig>(
    initialConfig || DEFAULT_FAILURE_HANDLING_CONFIG
  );

  const updateConfig = useCallback((updates: Partial<ExecutionFailureHandlingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_FAILURE_HANDLING_CONFIG);
  }, []);

  return {
    config,
    setConfig,
    updateConfig,
    resetConfig
  };
}