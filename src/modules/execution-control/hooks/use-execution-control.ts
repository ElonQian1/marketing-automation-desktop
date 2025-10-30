// src/modules/execution-control/hooks/use-execution-control.ts
// module: execution-control | layer: hooks | role: 执行控制Hook
// summary: 提供执行控制相关的React Hook，包含状态管理和操作方法

import { useState, useCallback, useEffect, useRef } from 'react';
import { ExecutionAbortService, ExecutionAbortRequest, ExecutionAbortResult } from '../services/execution-abort-service';

export interface ExecutionControlState {
  isExecuting: boolean;
  canAbort: boolean;
  executionId: string | null;
  lastAbortResult: ExecutionAbortResult | null;
}

export interface ExecutionControlActions {
  startExecution: (executionId?: string) => void;
  finishExecution: () => void;
  abortExecution: (request?: ExecutionAbortRequest) => Promise<ExecutionAbortResult>;
  clearAbortResult: () => void;
}

/**
 * 执行控制 Hook
 * 提供执行状态管理和中止操作
 */
export function useExecutionControl(): ExecutionControlState & ExecutionControlActions {
  const [state, setState] = useState<ExecutionControlState>({
    isExecuting: false,
    canAbort: false,
    executionId: null,
    lastAbortResult: null
  });

  const abortServiceRef = useRef(ExecutionAbortService.getInstance());

  // 同步后端状态
  useEffect(() => {
    const service = abortServiceRef.current;
    const hasActive = service.hasActiveExecution();
    const currentId = service.getCurrentExecutionId();

    setState(prev => ({
      ...prev,
      isExecuting: hasActive,
      canAbort: hasActive,
      executionId: currentId
    }));
  }, []);

  const startExecution = useCallback((executionId?: string) => {
    const id = executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    abortServiceRef.current.startExecution(id);
    
    setState(prev => ({
      ...prev,
      isExecuting: true,
      canAbort: true,
      executionId: id,
      lastAbortResult: null
    }));

    console.log(`🎬 [执行控制Hook] 开始执行: ${id}`);
  }, []);

  const finishExecution = useCallback(() => {
    abortServiceRef.current.finishExecution();
    
    setState(prev => ({
      ...prev,
      isExecuting: false,
      canAbort: false,
      executionId: null
    }));

    console.log(`🏁 [执行控制Hook] 执行结束`);
  }, []);

  const abortExecution = useCallback(async (request?: ExecutionAbortRequest): Promise<ExecutionAbortResult> => {
    console.log(`🛑 [执行控制Hook] 准备中止执行`, request);
    
    const result = await abortServiceRef.current.abortExecution(request);
    
    setState(prev => ({
      ...prev,
      isExecuting: false,
      canAbort: false,
      executionId: null,
      lastAbortResult: result
    }));

    return result;
  }, []);

  const clearAbortResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastAbortResult: null
    }));
  }, []);

  return {
    ...state,
    startExecution,
    finishExecution,
    abortExecution,
    clearAbortResult
  };
}

/**
 * 简化版执行控制 Hook
 * 只提供基本的开始/中止功能
 */
export function useSimpleExecutionControl() {
  const {
    isExecuting,
    canAbort,
    startExecution,
    finishExecution,
    abortExecution
  } = useExecutionControl();

  return {
    isExecuting,
    canAbort,
    startExecution,
    finishExecution,
    abortExecution
  };
}