// src/hooks/useActionExecution.ts
// module: hooks | layer: hooks | role: 统一操作执行Hook
// summary: 统一管理操作执行状态和方法的Hook

import { useState, useCallback } from 'react';
import { executeAction, validateActionParams, type ActionExecutionResult } from '../api/action-execution';
import type { ActionType, createActionType } from '../types/action-types';

interface UseActionExecutionOptions {
  /** 执行前的回调 */
  onBeforeExecute?: (action: ActionType) => void | Promise<void>;
  /** 执行成功的回调 */
  onSuccess?: (result: ActionExecutionResult) => void;
  /** 执行失败的回调 */
  onError?: (error: Error) => void;
  /** 是否自动记录执行日志 */
  enableLogging?: boolean;
}

interface ExecutionState {
  /** 是否正在执行 */
  isExecuting: boolean;
  /** 执行结果 */
  result: ActionExecutionResult | null;
  /** 执行错误 */
  error: string | null;
  /** 最后执行的操作 */
  lastAction: ActionType | null;
  /** 执行历史 */
  history: Array<{
    action: ActionType;
    result: ActionExecutionResult;
    timestamp: number;
  }>;
}

export const useActionExecution = (options: UseActionExecutionOptions = {}) => {
  const { onBeforeExecute, onSuccess, onError, enableLogging = true } = options;
  // TODO: 替换为实际的设备状态管理
  const selectedDevice = { id: 'default-device' };

  const [state, setState] = useState<ExecutionState>({
    isExecuting: false,
    result: null,
    error: null,
    lastAction: null,
    history: [],
  });

  /**
   * 执行操作
   */
  const execute = useCallback(async (action: ActionType): Promise<ActionExecutionResult> => {
    // 检查设备连接
    if (!selectedDevice) {
      throw new Error('未选择设备');
    }

    // 验证参数
    try {
      await validateActionParams(action);
    } catch (error) {
      const message = error instanceof Error ? error.message : '参数验证失败';
      throw new Error(`参数无效: ${message}`);
    }

    setState(prev => ({
      ...prev,
      isExecuting: true,
      error: null,
    }));

    try {
      // 执行前回调
      await onBeforeExecute?.(action);

      // 记录开始执行
      if (enableLogging) {
        console.log('[ActionExecution] 开始执行操作:', action);
      }

      // 执行操作
      const result = await executeAction(action, selectedDevice.id);

      // 更新状态
      setState(prev => ({
        ...prev,
        isExecuting: false,
        result,
        lastAction: action,
        history: enableLogging ? [
          ...prev.history.slice(-9), // 保留最近10条记录
          {
            action,
            result,
            timestamp: Date.now(),
          },
        ] : prev.history,
      }));

      // 成功回调
      onSuccess?.(result);

      if (enableLogging) {
        console.log('[ActionExecution] 操作执行成功:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '执行失败';
      
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
        lastAction: action,
      }));

      // 错误回调
      onError?.(error instanceof Error ? error : new Error(errorMessage));

      if (enableLogging) {
        console.error('[ActionExecution] 操作执行失败:', error);
      }

      throw error;
    }
  }, [selectedDevice, onBeforeExecute, onSuccess, onError, enableLogging]);

  /**
   * 快捷执行点击操作
   */
  const click = useCallback(async (x: number, y: number) => {
    return execute({
      type: 'click',
      params: { x, y },
    });
  }, [execute]);

  /**
   * 快捷执行长按操作
   */
  const longPress = useCallback(async (x: number, y: number, duration: number = 1000) => {
    return execute({
      type: 'long_press',
      params: { x, y, duration },
    });
  }, [execute]);

  /**
   * 快捷执行输入操作
   */
  const input = useCallback(async (text: string, x?: number, y?: number) => {
    return execute({
      type: 'input',
      params: { text, x, y },
    });
  }, [execute]);

  /**
   * 快捷执行滑动操作
   */
  const swipe = useCallback(async (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    duration: number = 500
  ) => {
    return execute({
      type: 'swipe_up', // 使用有效的操作类型
      params: { from_x: fromX, from_y: fromY, to_x: toX, to_y: toY, duration },
    });
  }, [execute]);

  /**
   * 快捷执行等待操作
   */
  const wait = useCallback(async (duration: number = 1000) => {
    return execute({
      type: 'wait',
      params: { duration },
    });
  }, [execute]);

  /**
   * 重置执行状态
   */
  const reset = useCallback(() => {
    setState({
      isExecuting: false,
      result: null,
      error: null,
      lastAction: null,
      history: [],
    });
  }, []);

  /**
   * 清除历史记录
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
    }));
  }, []);

  return {
    // 状态
    ...state,
    
    // 通用执行方法
    execute,
    
    // 快捷方法
    click,
    longPress,
    input,
    swipe,
    wait,
    
    // 工具方法
    reset,
    clearHistory,
    
    // 便捷状态
    canExecute: !state.isExecuting && !!selectedDevice,
    hasResult: !!state.result,
    hasError: !!state.error,
    isSuccess: !!state.result && state.result.success,
  };
};