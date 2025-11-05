// src/modules/structural-matching/ui/hooks/use-parameter-inference-status.ts
// module: structural-matching | layer: ui | role: 参数推理状态管理Hook
// summary: 管理和跟踪步骤卡片参数推理状态的React Hook

import { useState, useEffect, useCallback } from 'react';
import { useStepCardStore } from '../../../../store/stepcards';
import { 
  RuntimeInferenceResult,
  RuntimeInferenceStatus,
  defaultRuntimeInferenceService 
} from '../../services/step-card-parameter-inference/runtime-parameter-inference-service';

export interface ParameterInferenceHookResult {
  /** 推理结果 */
  inferenceResult: RuntimeInferenceResult | null;
  
  /** 推理状态 */
  status: RuntimeInferenceStatus;
  
  /** 是否正在推理 */
  isInferring: boolean;
  
  /** 推理错误 */
  error: string | null;
  
  /** 手动触发推理 */
  triggerInference: () => Promise<void>;
  
  /** 清除推理结果 */
  clearInference: () => void;
  
  /** 刷新状态 */
  refresh: () => void;
}

/**
 * 参数推理状态管理Hook
 * 
 * @param stepCardId 步骤卡片ID
 * @param autoRefresh 是否自动刷新状态
 * @returns 推理状态和控制函数
 */
export function useParameterInferenceStatus(
  stepCardId: string,
  autoRefresh: boolean = true
): ParameterInferenceHookResult {
  const [inferenceResult, setInferenceResult] = useState<RuntimeInferenceResult | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { cards, byStepId } = useStepCardStore();
  
  // 获取当前步骤卡片
  const stepCard = byStepId[stepCardId] ? cards[byStepId[stepCardId]] : null;
  
  // 从步骤卡片获取推理状态
  const getInferenceStatusFromStepCard = useCallback(() => {
    if (!stepCard) {
      return 'disabled' as RuntimeInferenceStatus;
    }
    
    // 检查是否已有结构匹配参数
    if (stepCard.structuralMatchPlan) {
      return 'not_needed' as RuntimeInferenceStatus;
    }
    
    // 检查推理状态
    if (stepCard.inferenceState) {
      return stepCard.inferenceState.status as RuntimeInferenceStatus;
    }
    
    // 检查是否可以推理
    return defaultRuntimeInferenceService.needsInference(stepCard) ? 
      'pending' as RuntimeInferenceStatus : 
      'disabled' as RuntimeInferenceStatus;
  }, [stepCard]);

  const status = getInferenceStatusFromStepCard();

  // 手动触发推理
  const triggerInference = useCallback(async () => {
    if (!stepCard || isInferring) {
      return;
    }
    
    try {
      setIsInferring(true);
      setError(null);
      
      console.log(`🧠 [Hook] 开始为步骤卡片 ${stepCardId} 推理参数`);
      
      const result = await defaultRuntimeInferenceService.inferParametersForStepCard(stepCard);
      
      setInferenceResult(result);
      
      if (result.status === 'failed') {
        setError(result.error || '推理失败');
      }
      
      console.log(`🧠 [Hook] 步骤卡片 ${stepCardId} 推理完成:`, result.status);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error(`❌ [Hook] 步骤卡片 ${stepCardId} 推理出错:`, errorMsg);
    } finally {
      setIsInferring(false);
    }
  }, [stepCard, stepCardId, isInferring]);

  // 清除推理结果
  const clearInference = useCallback(() => {
    setInferenceResult(null);
    setError(null);
    setIsInferring(false);
  }, []);

  // 刷新状态
  const refresh = useCallback(() => {
    if (stepCard?.inferenceState) {
      // 从步骤卡片构建推理结果
      const result: RuntimeInferenceResult = {
        status: stepCard.inferenceState.status as RuntimeInferenceStatus,
        plan: stepCard.structuralMatchPlan,
        error: stepCard.inferenceState.error,
      };
      setInferenceResult(result);
      
      if (result.error) {
        setError(result.error);
      }
    }
  }, [stepCard]);

  // 自动刷新状态
  useEffect(() => {
    if (autoRefresh) {
      refresh();
    }
  }, [autoRefresh, refresh, stepCard?.inferenceState, stepCard?.structuralMatchPlan]);

  return {
    inferenceResult,
    status,
    isInferring,
    error,
    triggerInference,
    clearInference,
    refresh,
  };
}

/**
 * 批量参数推理状态管理Hook
 * 
 * @param stepCardIds 步骤卡片ID列表
 * @returns 批量推理状态
 */
export function useBatchParameterInferenceStatus(stepCardIds: string[]) {
  const [batchResults, setBatchResults] = useState<Record<string, RuntimeInferenceResult>>({});
  const [isInferring, setIsInferring] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { cards, byStepId } = useStepCardStore();

  // 批量推理
  const triggerBatchInference = useCallback(async () => {
    if (isInferring) return;
    
    try {
      setIsInferring(true);
      setProgress(0);
      
      const results: Record<string, RuntimeInferenceResult> = {};
      
      for (let i = 0; i < stepCardIds.length; i++) {
        const stepCardId = stepCardIds[i];
        const stepCard = byStepId[stepCardId] ? cards[byStepId[stepCardId]] : null;
        
        if (stepCard) {
          console.log(`🧠 [批量推理] 处理步骤 ${i + 1}/${stepCardIds.length}: ${stepCardId}`);
          
          try {
            const result = await defaultRuntimeInferenceService.inferParametersForStepCard(stepCard);
            results[stepCardId] = result;
          } catch (error) {
            results[stepCardId] = {
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }
        
        // 更新进度
        setProgress(((i + 1) / stepCardIds.length) * 100);
      }
      
      setBatchResults(results);
      
      console.log(`✅ [批量推理] 完成批量推理，处理了 ${Object.keys(results).length} 个步骤`);
      
    } catch (error) {
      console.error('❌ [批量推理] 批量推理失败:', error);
    } finally {
      setIsInferring(false);
      setProgress(100);
    }
  }, [stepCardIds, cards, byStepId, isInferring]);

  // 获取批量状态统计
  const getStatusSummary = useCallback(() => {
    const results = Object.values(batchResults);
    return {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length,
      notNeeded: results.filter(r => r.status === 'not_needed').length,
    };
  }, [batchResults]);

  return {
    batchResults,
    isInferring,
    progress,
    triggerBatchInference,
    statusSummary: getStatusSummary(),
  };
}