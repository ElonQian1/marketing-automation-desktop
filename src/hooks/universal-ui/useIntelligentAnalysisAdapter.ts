// src/hooks/universal-ui/useIntelligentAnalysisAdapter.ts
// module: universal-ui | layer: hooks | role: adapter
// summary: 智能分析 Hook 适配器，当前版本基于模拟版本

import { useCallback } from 'react';
import type { UIElement } from '../../api/universalUIAPI';
import type { IntelligentAnalysisConfig } from '../../config/intelligentAnalysisConfig';
import { 
  useStrategyAnalysis,
  type AnalysisState,
  type AnalysisProgress,
} from './useStrategyAnalysis';
import type { StrategyCandidate } from '../../modules/universal-ui/types/intelligent-analysis-types';

// 统一的上下文接口
export interface UnifiedAnalysisContext {
  element: UIElement;
  stepId?: string;
  jobId?: string;
  selectionHash?: string;
}

// 统一的分析结果接口 (与模拟版本兼容)
export interface UnifiedAnalysisResult {
  confidence: number;
  recommendedStrategy: StrategyCandidate;
  alternatives: StrategyCandidate[];
  reasoning: string;
  metadata: {
    analysisTime: number;
    strategyCount: number;
    usedBackend: 'simulated' | 'real';
  };
}

// 统一的返回接口
export interface UseIntelligentAnalysisAdapterReturn {
  // 状态
  analysisState: AnalysisState;
  analysisProgress: AnalysisProgress | null;
  analysisResult: UnifiedAnalysisResult | null;
  
  // 方法
  startAnalysis: (context: UnifiedAnalysisContext) => Promise<void>;
  cancelAnalysis: () => void;
  resetAnalysis: () => void;
  
  // 配置
  config: {
    useRealBackend: boolean;
    debug: boolean;
  };
}

/**
 * 智能分析适配器 Hook
 * 
 * 当前版本基于模拟版本，后续可扩展支持真实后端
 */
export const useIntelligentAnalysisAdapter = (
  config: IntelligentAnalysisConfig
): UseIntelligentAnalysisAdapterReturn => {
  const {
    useRealBackend,
    debug,
  } = config;

  // 使用模拟版本 Hook
  const simulatedHook = useStrategyAnalysis();

  // 适配器方法 - 转换上下文格式
  const startAnalysis = useCallback(async (context: UnifiedAnalysisContext) => {
    if (debug) {
      console.log(`🚀 [Adapter] Starting analysis (backend: ${useRealBackend ? 'real' : 'simulated'})`, context);
    }

    // 当前只支持模拟版本，直接传递给模拟 Hook
    return simulatedHook.startAnalysis(context);
  }, [useRealBackend, debug, simulatedHook]);

  // 转换分析结果格式以确保一致性
  const analysisResult: UnifiedAnalysisResult | null = simulatedHook.analysisResult ? {
    confidence: simulatedHook.analysisResult.recommendedStrategy.confidence || 0.85,
    recommendedStrategy: simulatedHook.analysisResult.recommendedStrategy,
    alternatives: simulatedHook.analysisResult.alternatives,
    reasoning: simulatedHook.analysisResult.recommendedStrategy.description || '基于智能分析推荐',
    metadata: {
      analysisTime: simulatedHook.analysisResult.analysisMetadata.totalTime,
      strategyCount: 1 + simulatedHook.analysisResult.alternatives.length,
      usedBackend: 'simulated' as const,
    },
  } : null;

  return {
    analysisState: simulatedHook.analysisState,
    analysisProgress: simulatedHook.analysisProgress,
    analysisResult,
    startAnalysis,
    cancelAnalysis: simulatedHook.cancelAnalysis,
    resetAnalysis: simulatedHook.resetAnalysis,
    config: {
      useRealBackend: false, // 当前强制为 false，因为只支持模拟版本
      debug,
    },
  };
};