// src/modules/loop-control/application/use-loop-test-execution.ts
// module: loop-control | layer: application | role: hook
// summary: 循环测试执行 Hook - 管理循环测试的执行状态

import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { SmartScriptStep } from '../../../types/smartScript';
import { LoopExecutionService, type LoopExecutionSequence } from '../domain/loop-execution-service';

/**
 * 循环测试执行状态
 */
export type LoopTestStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * 循环测试执行状态
 */
export interface LoopTestState {
  status: LoopTestStatus;
  loopId: string | null;
  loopName: string | null;
  currentIteration: number;
  totalIterations: number;
  currentStepIndex: number;
  totalSteps: number;
  progress: number; // 0-100
  error: string | null;
  startTime: number | null;
  endTime: number | null;
}

export interface UseLoopTestExecutionOptions {
  /** 所有步骤 */
  steps: SmartScriptStep[];
  /** 当前设备ID */
  deviceId?: string;
  /** 执行完成回调 */
  onComplete?: (success: boolean) => void;
  /** 执行错误回调 */
  onError?: (error: string) => void;
  /** 进度更新回调 */
  onProgress?: (progress: number, iteration: number) => void;
}

/**
 * 循环测试执行 Hook
 * 
 * 功能：
 * 1. 管理循环测试的执行状态
 * 2. 提供开始/停止/暂停功能
 * 3. 监听执行进度和结果
 * 4. 显示执行统计信息
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   isRunning,
 *   canStart,
 *   startTest,
 *   stopTest,
 * } = useLoopTestExecution({
 *   steps: allSteps,
 *   deviceId: currentDeviceId,
 *   onComplete: (success) => {
 *     if (success) message.success('循环测试完成');
 *   },
 * });
 * 
 * // 开始测试
 * <Button onClick={() => startTest('loop_123')}>
 *   测试循环
 * </Button>
 * ```
 */
export function useLoopTestExecution(options: UseLoopTestExecutionOptions) {
  const {
    steps,
    deviceId,
    onComplete,
    onError,
    onProgress,
  } = options;

  // 执行状态
  const [state, setState] = useState<LoopTestState>({
    status: 'idle',
    loopId: null,
    loopName: null,
    currentIteration: 0,
    totalIterations: 0,
    currentStepIndex: 0,
    totalSteps: 0,
    progress: 0,
    error: null,
    startTime: null,
    endTime: null,
  });

  // 执行序列引用
  const sequenceRef = useRef<LoopExecutionSequence | null>(null);
  
  // 事件监听器清理函数
  const unlistenRef = useRef<(() => void) | null>(null);

  // 清理事件监听器
  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  // 计算派生状态
  const isRunning = state.status === 'running';
  const isIdle = state.status === 'idle';
  const canStart = isIdle && deviceId !== undefined;
  const canStop = isRunning;

  /**
   * 开始循环测试
   */
  const startTest = useCallback(async (loopId: string, iterations?: number) => {
    if (!canStart) {
      message.warning('请先连接设备');
      return;
    }

    try {
      // 1. 构建执行序列
      const sequence = LoopExecutionService.buildExecutionSequence(
        steps,
        loopId,
        iterations
      );

      if (!sequence) {
        message.error('无法构建循环执行序列');
        return;
      }

      // 2. 验证执行序列
      const validation = LoopExecutionService.validateExecutionSequence(sequence);
      if (!validation.valid) {
        message.error(`循环验证失败：${validation.errors[0]}`);
        return;
      }

      sequenceRef.current = sequence;

      // 3. 更新状态为运行中
      setState({
        status: 'running',
        loopId,
        loopName: sequence.loopName,
        currentIteration: 1,
        totalIterations: sequence.totalIterations,
        currentStepIndex: 0,
        totalSteps: sequence.steps.length,
        progress: 0,
        error: null,
        startTime: Date.now(),
        endTime: null,
      });

      // 4. 监听执行进度
      const unlisten = await listen('loop_test_progress', (event: unknown) => {
        const payload = event as { payload: { step_index: number; iteration: number } };
        const { step_index, iteration } = payload.payload;
        
        const progress = LoopExecutionService.calculateProgress(
          step_index,
          sequence.steps.length
        );

        setState(prev => ({
          ...prev,
          currentStepIndex: step_index,
          currentIteration: iteration,
          progress,
        }));

        onProgress?.(progress, iteration);
      });

      unlistenRef.current = unlisten;

      // 5. 调用后端执行循环测试
      const result = await invoke<{ success: boolean; error?: string }>('execute_loop_test', {
        loopId,
        steps: sequence.steps.map(s => s.step),
        iterations: sequence.totalIterations,
        deviceId,
      });

      // 6. 处理执行结果
      if (result.success) {
        setState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          endTime: Date.now(),
        }));
        message.success(`循环测试完成 (${sequence.totalIterations}次)`);
        onComplete?.(true);
      } else {
        throw new Error(result.error || '执行失败');
      }

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMsg,
        endTime: Date.now(),
      }));
      message.error(`循环测试失败：${errorMsg}`);
      onError?.(errorMsg);
      onComplete?.(false);
    } finally {
      // 清理监听器
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    }
  }, [canStart, steps, deviceId, onComplete, onError, onProgress]);

  /**
   * 停止循环测试
   */
  const stopTest = useCallback(async () => {
    if (!canStop) return;

    try {
      await invoke('stop_loop_test', {
        loopId: state.loopId,
      });

      setState(prev => ({
        ...prev,
        status: 'idle',
        endTime: Date.now(),
      }));

      message.info('已停止循环测试');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      message.error(`停止失败：${errorMsg}`);
    }
  }, [canStop, state.loopId]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      loopId: null,
      loopName: null,
      currentIteration: 0,
      totalIterations: 0,
      currentStepIndex: 0,
      totalSteps: 0,
      progress: 0,
      error: null,
      startTime: null,
      endTime: null,
    });
    sequenceRef.current = null;
  }, []);

  /**
   * 获取执行时长
   */
  const getDuration = useCallback(() => {
    if (!state.startTime) return 0;
    const endTime = state.endTime || Date.now();
    return endTime - state.startTime;
  }, [state.startTime, state.endTime]);

  /**
   * 获取当前步骤信息
   */
  const getCurrentStepInfo = useCallback(() => {
    if (!sequenceRef.current) return null;
    return LoopExecutionService.getStepPositionInLoop(
      state.currentStepIndex,
      sequenceRef.current
    );
  }, [state.currentStepIndex]);

  return {
    /** 执行状态 */
    state,
    /** 是否正在运行 */
    isRunning,
    /** 是否空闲 */
    isIdle,
    /** 是否可以开始 */
    canStart,
    /** 是否可以停止 */
    canStop,
    /** 开始测试 */
    startTest,
    /** 停止测试 */
    stopTest,
    /** 重置状态 */
    reset,
    /** 获取执行时长（毫秒） */
    getDuration,
    /** 获取当前步骤信息 */
    getCurrentStepInfo,
  };
}
