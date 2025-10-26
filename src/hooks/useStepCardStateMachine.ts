// src/hooks/useStepCardStateMachine.ts
// module: hooks | layer: application | role: 步骤卡状态机管理
// summary: idle->matching->ready->executing->success/failed 的状态流转逻辑
//
// ⚠️ 【重要】执行路径说明：
// 此Hook通过 StepExecutionGateway 执行步骤卡片
// - V3智能策略模式：StepExecutionGateway 已配置 USE_V3_INTELLIGENT_STRATEGY = true
// - 执行流程：useStepCardStateMachine → StepExecutionGateway → executeV3() → execute_chain_test_v3
// - 避免坐标兜底：不再使用run_step_v2的坐标兜底，改用V3智能策略分析
//
// 🚫 请勿修改为直接调用 run_step_v2 - 会导致坐标兜底问题！
// ✅ 正确路径：通过 StepExecutionGateway 使用 V3 智能策略系统

import { useState, useCallback, useRef } from 'react';
import type { 
  StepStatus, 
  ExecutionMode, 
  MatchResult, 
  StepCardModel,
  StepActionParams 
} from '../types/stepActions';

export interface UseStepCardStateMachineProps {
  stepId: string;
  initialAction: StepActionParams;
  onMatch?: (result: MatchResult) => void;
  onExecute?: (success: boolean, message: string) => void;
}

export interface UseStepCardStateMachineReturn {
  status: StepStatus;
  lastMatch: MatchResult | undefined;
  isLoading: boolean;
  
  // 状态转换方法
  startMatching: () => void;
  setMatchResult: (result: MatchResult) => void;
  setMatchFailed: (message: string) => void;
  startExecuting: () => void;
  setExecuteResult: (success: boolean, message: string) => void;
  startVerifying: () => void;
  setVerifyResult: (success: boolean) => void;
  reset: () => void;
  
  // 执行流程
  runStep: (mode: ExecutionMode, stepCard: StepCardModel) => Promise<void>;
}

export const useStepCardStateMachine = ({
  // stepId,
  // initialAction,
  onMatch,
  onExecute,
}: UseStepCardStateMachineProps): UseStepCardStateMachineReturn => {
  const [status, setStatus] = useState<StepStatus>('idle');
  const [lastMatch, setLastMatch] = useState<MatchResult | undefined>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 计算是否处于加载状态
  const isLoading = ['matching', 'executing', 'verifying'].includes(status);

  // 状态转换方法
  const startMatching = useCallback(() => {
    setStatus('matching');
    setLastMatch(undefined);
  }, []);

  const setMatchResult = useCallback((result: MatchResult) => {
    setLastMatch(result);
    setStatus('ready');
    onMatch?.(result);
  }, [onMatch]);

  const setMatchFailed = useCallback((message: string) => {
    setLastMatch({
      score: 0,
      confidence: 0,
      summary: message,
    });
    setStatus('failed');
  }, []);

  const startExecuting = useCallback(() => {
    setStatus('executing');
  }, []);

  const setExecuteResult = useCallback((success: boolean, message: string) => {
    setStatus(success ? 'success' : 'failed');
    onExecute?.(success, message);
  }, [onExecute]);

  const startVerifying = useCallback(() => {
    setStatus('verifying');
  }, []);

  const setVerifyResult = useCallback((success: boolean) => {
    setStatus(success ? 'success' : 'failed');
  }, []);

  const reset = useCallback(() => {
    // 取消正在进行的操作
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('idle');
    setLastMatch(undefined);
  }, []);

  // 🎯 【核心执行流程】使用V3智能策略系统，避免坐标兜底
  // ⚠️ 重要：此方法通过 StepExecutionGateway 路由到 V3 系统
  // 执行路径：runStep → StepExecutionGateway.executeStep → executeV3 → execute_chain_test_v3
  // 🚫 禁止直接调用 run_step_v2 - 会导致坐标兜底！
  const runStep = useCallback(async (mode: ExecutionMode, stepCard: StepCardModel) => {
    try {
      // 创建新的取消控制器
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      console.log(`🚀 [状态机] 开始执行步骤: ${stepCard.name}, 模式: ${mode}`);
      console.log(`🎯 [状态机] 执行路径: StepExecutionGateway → V3智能策略 (避免坐标兜底)`);

      // ✅ 正确：使用执行引擎网关，内部已配置V3智能策略路由
      const { getStepExecutionGateway } = await import('../infrastructure/gateways/StepExecutionGateway');
      const gateway = getStepExecutionGateway();

      // 准备网关请求参数
      const gatewayRequest = {
        deviceId: 'default_device', // TODO: 从实际设备状态获取
        mode: mode === 'matchOnly' ? 'match-only' as const : 'execute-step' as const,
        actionParams: stepCard.currentAction,
        selectorId: stepCard.selectorId,
        bounds: stepCard.lastMatch?.elementRect ? {
          x: stepCard.lastMatch.elementRect.x,
          y: stepCard.lastMatch.elementRect.y,
          width: stepCard.lastMatch.elementRect.width,
          height: stepCard.lastMatch.elementRect.height,
        } : undefined,
      };
      
      // 1. 匹配阶段
      startMatching();
      console.log(`📍 [状态机] ${mode === 'matchOnly' ? '仅匹配' : '匹配+执行'}模式开始`);

      // ✅ 关键调用：此处会被StepExecutionGateway路由到V3智能策略
      // 内部流程：executeStep → executeV3 → execute_chain_test_v3 → Step 0-6策略分析
      const result = await gateway.executeStep(gatewayRequest);
      
      if (signal.aborted) return;

      // 处理匹配结果
      if (result.matched) {
        const matchResult: MatchResult = {
          score: result.matched.score,
          confidence: result.matched.confidence,
          summary: result.matched.text || `${result.engine.toUpperCase()} 匹配元素`,
          elementRect: {
            x: result.matched.bounds.left,
            y: result.matched.bounds.top,
            width: result.matched.bounds.right - result.matched.bounds.left,
            height: result.matched.bounds.bottom - result.matched.bounds.top,
          },
        };
        
        if (matchResult.confidence < stepCard.common.confidenceThreshold) {
          setMatchFailed(`匹配失败: 置信度 ${matchResult.confidence} 低于阈值 ${stepCard.common.confidenceThreshold}`);
          return;
        }

        setMatchResult(matchResult);
        console.log(`✅ [状态机] ${result.engine.toUpperCase()}引擎匹配成功: 置信度 ${matchResult.confidence}`);
      } else if (!result.success) {
        setMatchFailed(result.message);
        return;
      }

      // 仅匹配模式：到此结束
      if (mode === 'matchOnly') {
        console.log(`🎯 [状态机] 仅匹配模式完成`);
        return;
      }

      // 执行模式：检查执行结果
      if (result.success && result.executedAction) {
        console.log(`✅ [状态机] ${result.engine.toUpperCase()}引擎执行成功: ${result.executedAction}`);
        
        // 处理验证结果
        if (result.verifyPassed !== undefined) {
          if (result.verifyPassed) {
            console.log(`✅ [状态机] 验证通过`);
            setExecuteResult(true, `${result.executedAction} 执行成功并验证通过`);
          } else {
            console.log(`❌ [状态机] 验证失败`);
            setExecuteResult(false, `${result.executedAction} 执行成功但验证失败`);
          }
        } else {
          setExecuteResult(true, `${result.executedAction} 执行成功`);
        }

        // 记录影子执行信息
        if (result.shadowResult) {
          console.log(`🔍 [状态机] 影子执行对比:`, result.shadowResult.comparison);
        }
      } else {
        console.error(`❌ [状态机] ${result.engine.toUpperCase()}引擎执行失败: ${result.message}`);
        setExecuteResult(false, result.message);
      }

    } catch (error) {
      console.error('❌ [状态机] 执行异常:', error);
      setMatchFailed(`执行异常: ${error}`);
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    startMatching, 
    setMatchResult, 
    setMatchFailed, 
    startExecuting, 
    setExecuteResult,
    startVerifying,
    setVerifyResult
  ]);

  return {
    status,
    lastMatch,
    isLoading,
    
    // 状态转换方法
    startMatching,
    setMatchResult,
    setMatchFailed,
    startExecuting,
    setExecuteResult,
    startVerifying,
    setVerifyResult,
    reset,
    
    // 执行流程
    runStep,
  };
};