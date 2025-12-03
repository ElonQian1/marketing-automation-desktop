// src/modules/loop-control/application/use-loop-test-manager.ts
// module: loop-control | layer: application | role: 循环测试状态管理器
// summary: 管理多个循环的测试状态，支持开始/结束卡片联动

import { useState, useCallback, useRef } from 'react';
import { LoopExecutionService } from '../domain/loop-execution-service';
import type { SmartScriptStep } from '../../../types/smartScript';
import { loopExecutionEngine, type LoopExecutionProgress } from '../domain/loop-execution-engine';

export interface LoopTestState {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentStep: number;
  totalSteps: number;
  currentIteration: number;
  totalIterations: number;
  startTime?: number;
  endTime?: number;
  error?: string;
}

interface LoopTestCallbacks {
  onComplete?: (success: boolean, loopId: string) => void;
  onError?: (error: string, loopId: string) => void;
  onProgress?: (progress: number, loopId: string) => void;
}

interface LoopTestManager {
  /** 获取指定循环的测试状态 */
  getLoopState: (loopId: string) => LoopTestState;
  /** 判断是否可以开始测试 */
  canStart: (loopId: string) => boolean;
  /** 判断是否可以停止测试 */
  canStop: (loopId: string) => boolean;
  /** 开始循环测试 */
  startTest: (loopId: string, allSteps: SmartScriptStep[], deviceId: string) => Promise<void>;
  /** 停止循环测试 */
  stopTest: (loopId: string) => Promise<void>;
  /** 获取测试持续时间 */
  getDuration: (loopId: string) => number;
  /** 清理指定循环的状态 */
  clearLoopState: (loopId: string) => void;
}

/**
 * 循环测试状态管理器
 * 
 * 支持多个循环同时存在，每个循环独立管理状态
 * 提供统一的接口给开始/结束卡片使用
 */
export function useLoopTestManager(callbacks?: LoopTestCallbacks): LoopTestManager {
  // 使用 Map 管理多个循环的状态
  const [loopStates, setLoopStates] = useState<Map<string, LoopTestState>>(new Map());
  const progressTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 获取循环状态的默认值
  const getDefaultState = (): LoopTestState => ({
    status: 'idle',
    progress: 0,
    currentStep: 0,
    totalSteps: 0,
    currentIteration: 0,
    totalIterations: 0,
  });

  // 获取指定循环的状态
  const getLoopState = useCallback((loopId: string): LoopTestState => {
    return loopStates.get(loopId) || getDefaultState();
  }, [loopStates]);

  // 更新循环状态
  const updateLoopState = useCallback((loopId: string, updates: Partial<LoopTestState>) => {
    setLoopStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(loopId) || getDefaultState();
      newMap.set(loopId, { ...currentState, ...updates });
      return newMap;
    });
  }, []);

  // 判断是否可以开始测试
  const canStart = useCallback((loopId: string): boolean => {
    const state = getLoopState(loopId);
    return state.status === 'idle' || state.status === 'completed' || state.status === 'error';
  }, [getLoopState]);

  // 判断是否可以停止测试
  const canStop = useCallback((loopId: string): boolean => {
    const state = getLoopState(loopId);
    return state.status === 'running';
  }, [getLoopState]);

  // 开始循环测试
  const startTest = useCallback(async (loopId: string, allSteps: SmartScriptStep[], deviceId: string) => {
    if (!canStart(loopId)) {
      throw new Error(`循环 ${loopId} 无法启动：当前状态不允许`);
    }

    if (!deviceId) {
      throw new Error('请先连接设备');
    }

    try {
      // 提取循环内的步骤
      const loopSteps = LoopExecutionService.extractLoopSteps(allSteps, loopId);
      if (loopSteps.length === 0) {
        throw new Error(`循环 ${loopId} 内没有找到可执行的步骤`);
      }

      // 获取循环配置
      const loopStartStep = allSteps.find(step => 
        step.step_type === 'loop_start' && 
        (step.parameters?.loop_id === loopId || `loop_${step.id}` === loopId)
      );
      
      const totalIterations = (loopStartStep?.parameters?.loop_count as number) || 1;
      const isInfinite = totalIterations === -1;

      // 初始化状态
      updateLoopState(loopId, {
        status: 'running',
        progress: 0,
        currentStep: 0,
        totalSteps: loopSteps.length,
        currentIteration: 0,
        totalIterations: isInfinite ? Infinity : totalIterations,
        startTime: Date.now(),
        endTime: undefined,
        error: undefined,
      });

      // 构建执行序列
      const executionSequence = LoopExecutionService.buildExecutionSequence(allSteps, loopId, totalIterations);
      if (!executionSequence) {
        throw new Error(`无法构建循环 ${loopId} 的执行序列`);
      }
      
      console.log(`🎯 开始循环测试: ${loopId}`, {
        loopSteps: loopSteps.length,
        totalIterations: isInfinite ? '∞' : totalIterations,
        executionSteps: executionSequence.steps.length,
        deviceId,
      });

      // 🔥 使用真实的循环执行引擎
      try {
        const result = await loopExecutionEngine.executeLoopTest(
          loopSteps,
          isInfinite ? 999 : totalIterations, // 无限循环暂时限制为999次
          deviceId,
          // 进度回调
          (progress: LoopExecutionProgress) => {
            const progressPercentage = progress.progress_percentage;
            updateLoopState(loopId, {
              progress: progressPercentage,
              currentStep: progress.step,
              currentIteration: progress.iteration,
            });
            callbacks?.onProgress?.(progressPercentage, loopId);
          },
          // 步骤完成回调
          (stepName: string, success: boolean) => {
            console.log(`📝 步骤完成: ${stepName} - ${success ? '成功' : '失败'}`);
          }
        );

        // 执行完成
        updateLoopState(loopId, {
          status: result.success ? 'completed' : 'error',
          progress: 100,
          endTime: Date.now(),
          error: result.error_message,
        });

        console.log(`🏁 循环测试完成: ${loopId}`, result);
        callbacks?.onComplete?.(result.success, loopId);

      } catch (error) {
        console.error(`💥 循环测试执行失败: ${loopId}`, error);
        updateLoopState(loopId, {
          status: 'error',
          endTime: Date.now(),
          error: String(error),
        });
        callbacks?.onComplete?.(false, loopId);
      }
      //   steps: executionSequence,
      //   deviceId,
      //   config: { iterations: totalIterations }
      // });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      updateLoopState(loopId, {
        status: 'error',
        error: errorMsg,
        endTime: Date.now(),
      });
      callbacks?.onError?.(errorMsg, loopId);
      throw error;
    }
  }, [canStart, updateLoopState, callbacks]);

  // 停止循环测试
  const stopTest = useCallback(async (loopId: string) => {
    if (!canStop(loopId)) {
      return;
    }

    try {
      console.log(`🛑 停止循环测试: ${loopId}`);
      
      // 🔥 停止真实的循环执行引擎
      loopExecutionEngine.stop();

      // 清理进度定时器（如果有）
      const timer = progressTimersRef.current.get(loopId);
      if (timer) {
        clearInterval(timer);
        progressTimersRef.current.delete(loopId);
      }

      updateLoopState(loopId, {
        status: 'idle',
        progress: 0,
        endTime: Date.now(),
      });

      console.log(`🛑 停止循环测试: ${loopId}`);

      // 调用后端 Tauri 命令停止
      await invoke('plugin:automation|stop_loop_test', { loopId });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '停止失败';
      updateLoopState(loopId, {
        status: 'error',
        error: errorMsg,
      });
      callbacks?.onError?.(errorMsg, loopId);
    }
  }, [canStop, updateLoopState, callbacks]);

  // 获取测试持续时间
  const getDuration = useCallback((loopId: string): number => {
    const state = getLoopState(loopId);
    if (!state.startTime) return 0;
    
    const endTime = state.endTime || Date.now();
    return endTime - state.startTime;
  }, [getLoopState]);

  // 清理循环状态
  const clearLoopState = useCallback((loopId: string) => {
    const timer = progressTimersRef.current.get(loopId);
    if (timer) {
      clearInterval(timer);
      progressTimersRef.current.delete(loopId);
    }

    setLoopStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(loopId);
      return newMap;
    });
  }, []);

  return {
    getLoopState,
    canStart,
    canStop,
    startTest,
    stopTest,
    getDuration,
    clearLoopState,
  };
}