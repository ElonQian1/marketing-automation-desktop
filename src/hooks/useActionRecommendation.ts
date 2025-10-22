// src/hooks/useActionRecommendation.ts
// module: hooks | layer: hooks | role: 操作推荐Hook
// summary: 基于元素特征自动推荐操作类型的Hook

import { useState, useEffect, useCallback } from 'react';
import { recommendAction, batchRecommendActions, type ActionRecommendation } from '../api/action-execution';
import type { ActionType } from '../types/action-types';
import { DEFAULT_ACTION } from '../types/action-types';

interface UseActionRecommendationOptions {
  /** 是否自动推荐 */
  autoRecommend?: boolean;
  /** 推荐失败时的回调 */
  onError?: (error: Error) => void;
  /** 推荐成功时的回调 */
  onRecommended?: (recommendation: ActionRecommendation) => void;
}

interface ActionRecommendationState {
  /** 推荐的操作类型 */
  recommendedAction: ActionType;
  /** 推荐置信度 */
  confidence: number;
  /** 推荐理由 */
  reason: string;
  /** 备选操作 */
  alternatives: ActionRecommendation['alternatives'];
  /** 是否正在推荐 */
  isRecommending: boolean;
  /** 推荐错误 */
  error: string | null;
}

export const useActionRecommendation = (options: UseActionRecommendationOptions = {}) => {
  const { autoRecommend = true, onError, onRecommended } = options;

  const [state, setState] = useState<ActionRecommendationState>({
    recommendedAction: DEFAULT_ACTION,
    confidence: 0.5,
    reason: '默认点击操作',
    alternatives: [],
    isRecommending: false,
    error: null,
  });

  /**
   * 推荐单个元素的操作类型
   */
  const recommend = useCallback(async (xmlElement: string) => {
    setState(prev => ({
      ...prev,
      isRecommending: true,
      error: null,
    }));

    try {
      const recommendation = await recommendAction(xmlElement);
      
      setState(prev => ({
        ...prev,
        recommendedAction: recommendation.action,
        confidence: recommendation.confidence,
        reason: recommendation.reason,
        alternatives: recommendation.alternatives,
        isRecommending: false,
        error: null,
      }));

      onRecommended?.(recommendation);
      return recommendation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '推荐失败';
      setState(prev => ({
        ...prev,
        isRecommending: false,
        error: errorMessage,
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onError, onRecommended]);

  /**
   * 批量推荐多个元素的操作类型
   */
  const batchRecommend = useCallback(async (xmlElements: string[]) => {
    setState(prev => ({
      ...prev,
      isRecommending: true,
      error: null,
    }));

    try {
      const recommendations = await batchRecommendActions(xmlElements);
      
      setState(prev => ({
        ...prev,
        isRecommending: false,
        error: null,
      }));

      return recommendations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量推荐失败';
      setState(prev => ({
        ...prev,
        isRecommending: false,
        error: errorMessage,
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onError]);

  /**
   * 重置推荐状态
   */
  const reset = useCallback(() => {
    setState({
      recommendedAction: DEFAULT_ACTION,
      confidence: 0.5,
      reason: '默认点击操作',
      alternatives: [],
      isRecommending: false,
      error: null,
    });
  }, []);

  /**
   * 设置推荐结果（手动设置）
   */
  const setRecommendation = useCallback((recommendation: Partial<ActionRecommendationState>) => {
    setState(prev => ({
      ...prev,
      ...recommendation,
    }));
  }, []);

  return {
    // 状态
    ...state,
    
    // 方法
    recommend,
    batchRecommend,
    reset,
    setRecommendation,
    
    // 便捷方法
    hasRecommendation: state.confidence > 0.5,
    isHighConfidence: state.confidence >= 0.8,
    isLowConfidence: state.confidence < 0.6,
  };
};