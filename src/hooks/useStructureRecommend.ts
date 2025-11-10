// src/hooks/useStructureRecommend.ts
// module: hooks | layer: hooks | role: 结构匹配推荐Hook
// summary: 封装推荐逻辑和状态管理，提供便捷的推荐功能接口

import { useState, useCallback } from "react";
import { 
  recommendStructureMode, 
  dryRunStructureMatch,
  UiRecommendation, 
  UiOutcome,
  RecommendInput 
} from "../services/structureRecommend";

export interface UseStructureRecommendOptions {
  /** 是否自动获取推荐 */
  autoFetch?: boolean;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 成功回调 */
  onSuccess?: (recommendation: UiRecommendation) => void;
}

export interface UseStructureRecommendReturn {
  /** 推荐结果 */
  recommendation: UiRecommendation | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 试算状态 */
  dryRunning: boolean;
  /** 高亮节点列表 */
  highlightedNodes: number[];
  /** 获取推荐 */
  fetchRecommendation: (input: RecommendInput) => Promise<void>;
  /** 试算高亮 */
  performDryRun: (input: RecommendInput, mode: UiOutcome["mode"]) => Promise<void>;
  /** 清除状态 */
  clear: () => void;
  /** 重试获取推荐 */
  retry: () => Promise<void>;
}

export const useStructureRecommend = (
  options: UseStructureRecommendOptions = {}
): UseStructureRecommendReturn => {
  const { onError, onSuccess } = options;

  const [recommendation, setRecommendation] = useState<UiRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<number[]>([]);
  const [lastInput, setLastInput] = useState<RecommendInput | null>(null);

  const fetchRecommendation = useCallback(async (input: RecommendInput) => {
    setLoading(true);
    setError(null);
    setLastInput(input);

    try {
      console.log("🎯 [推荐Hook] 开始获取推荐:", input);
      
      const result = await recommendStructureMode(input);
      setRecommendation(result);
      
      console.log("✅ [推荐Hook] 获取推荐成功:", {
        recommended: result.recommended,
        confidence: result.confidence_level
      });

      onSuccess?.(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "获取推荐失败";
      setError(errorMsg);
      
      console.error("❌ [推荐Hook] 获取推荐失败:", err);
      
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  }, [onError, onSuccess]);

  const performDryRun = useCallback(async (input: RecommendInput, mode: UiOutcome["mode"]) => {
    setDryRunning(true);
    
    try {
      console.log("🧪 [推荐Hook] 开始试算:", { input, mode });
      
      const targetNodes = await dryRunStructureMatch(input, mode);
      setHighlightedNodes(targetNodes);
      
      console.log("✅ [推荐Hook] 试算完成:", targetNodes);
    } catch (err) {
      console.error("❌ [推荐Hook] 试算失败:", err);
      
      const errorMsg = err instanceof Error ? err.message : "试算失败";
      setError(errorMsg);
    } finally {
      setDryRunning(false);
    }
  }, []);

  const clear = useCallback(() => {
    setRecommendation(null);
    setError(null);
    setHighlightedNodes([]);
    setLastInput(null);
  }, []);

  const retry = useCallback(async () => {
    if (lastInput) {
      await fetchRecommendation(lastInput);
    }
  }, [lastInput, fetchRecommendation]);

  return {
    recommendation,
    loading,
    error,
    dryRunning,
    highlightedNodes,
    fetchRecommendation,
    performDryRun,
    clear,
    retry,
  };
};

/**
 * 快速推荐Hook，仅获取推荐模式和置信度
 */
export const useQuickRecommend = () => {
  const [loading, setLoading] = useState(false);
  
  const quickRecommend = useCallback(async (input: RecommendInput): Promise<{
    mode: UiOutcome["mode"];
    confidence: number;
  } | null> => {
    setLoading(true);
    
    try {
      const result = await recommendStructureMode(input);
      const recommendedOutcome = result.outcomes.find(
        o => o.mode === result.recommended
      );
      
      return {
        mode: result.recommended,
        confidence: recommendedOutcome?.conf || 0
      };
    } catch (err) {
      console.error("❌ [快速推荐] 失败:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { quickRecommend, loading };
};