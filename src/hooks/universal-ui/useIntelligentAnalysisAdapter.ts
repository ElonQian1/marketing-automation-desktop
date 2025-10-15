// src/hooks/universal-ui/useIntelligentAnalysisAdapter.ts
// module: universal-ui | layer: hooks | role: adapter
// summary: 智能分析 Hook 适配器，支持真实后端和模拟版本

import { useCallback, useState, useEffect } from 'react';
import type { UIElement } from '../../api/universalUIAPI';
import type { IntelligentAnalysisConfig } from '../../config/intelligentAnalysisConfig';
import { 
  useStrategyAnalysis,
  type AnalysisState,
  type AnalysisProgress,
} from './useStrategyAnalysis';
import { useIntelligentAnalysisBackend } from '../../services/intelligent-analysis-backend';
import type { StrategyCandidate, AnalysisResult } from '../../modules/universal-ui/types/intelligent-analysis-types';

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
 * 支持真实后端和模拟版本，根据配置自动切换
 */
export const useIntelligentAnalysisAdapter = (
  config: IntelligentAnalysisConfig
): UseIntelligentAnalysisAdapterReturn => {
  const {
    useRealBackend,
    debug,
  } = config;

  // 模拟版本 Hook
  const simulatedHook = useStrategyAnalysis();
  
  // 真实后端服务
  const backendService = useIntelligentAnalysisBackend();
  
  // 真实后端状态管理
  const [realAnalysisState, setRealAnalysisState] = useState<AnalysisState>('idle');
  const [realAnalysisProgress, setRealAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [realAnalysisResult, setRealAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // 设置真实后端事件监听
  useEffect(() => {
    if (!useRealBackend) return;

    let cleanup: (() => void) | undefined;

    const setupEventListeners = async () => {
      try {
        // 监听进度更新
        await backendService.listenToAnalysisProgress((progress, step, estimatedTimeLeft) => {
          console.log('📊 [Adapter] 收到进度更新', { progress, step, estimatedTimeLeft });
          setRealAnalysisProgress({
            currentStep: Math.round((progress / 100) * 7), // 进度是百分比，转换为步骤数
            totalSteps: 7,
            stepName: step,
            stepDescription: `执行${step}`,
          });
        });

        // 监听分析完成
        await backendService.listenToAnalysisComplete((result) => {
          console.log('🎉 [Adapter] 收到分析完成回调', result);
          setRealAnalysisState('completed');
          setRealAnalysisResult(result);
          setRealAnalysisProgress(null);
          setCurrentJobId(null);
        });

        // 监听分析错误
        await backendService.listenToAnalysisError((error) => {
          console.error('❌ [Adapter] 真实后端分析失败', error);
          setRealAnalysisState('failed');
          setRealAnalysisProgress(null);
          setCurrentJobId(null);
        });

        cleanup = () => backendService.cleanup();
      } catch (error) {
        console.error('❌ [Adapter] 设置事件监听器失败', error);
      }
    };

    setupEventListeners();

    return () => {
      cleanup?.();
    };
  }, [useRealBackend, backendService]);

  // 适配器方法 - 根据配置选择后端
  const startAnalysis = useCallback(async (context: UnifiedAnalysisContext) => {
    if (debug) {
      console.log(`🚀 [Adapter] Starting analysis (backend: ${useRealBackend ? 'real' : 'simulated'})`, context);
    }

    if (useRealBackend) {
      try {
        // 重置状态
        setRealAnalysisState('analyzing');
        setRealAnalysisResult(null);
        setRealAnalysisProgress({
          currentStep: 1,
          totalSteps: 7,
          stepName: '初始化分析',
          stepDescription: '准备智能分析环境',
        });

        // 调用真实后端
        const response = await backendService.startAnalysis(
          context.element,
          context.stepId,
          {
            lockContainer: false,
            enableSmartCandidates: true,
            enableStaticCandidates: true,
          }
        );

        setCurrentJobId(response.job_id);
        console.log('✅ [Adapter] 真实后端分析已启动', response);
      } catch (error) {
        console.error('❌ [Adapter] 启动真实后端分析失败', error);
        setRealAnalysisState('failed');
        setRealAnalysisProgress(null);
        throw error;
      }
    } else {
      // 使用模拟版本
      return simulatedHook.startAnalysis(context);
    }
  }, [useRealBackend, debug, backendService, simulatedHook]);

  // 取消分析
  const cancelAnalysis = useCallback(async () => {
    if (useRealBackend && currentJobId) {
      try {
        await backendService.cancelAnalysis(currentJobId);
        setRealAnalysisState('idle');
        setRealAnalysisProgress(null);
        setCurrentJobId(null);
      } catch (error) {
        console.error('❌ [Adapter] 取消真实后端分析失败', error);
      }
    } else {
      simulatedHook.cancelAnalysis();
    }
  }, [useRealBackend, currentJobId, backendService, simulatedHook]);

  // 重置分析
  const resetAnalysis = useCallback(() => {
    if (useRealBackend) {
      setRealAnalysisState('idle');
      setRealAnalysisProgress(null);
      setRealAnalysisResult(null);
      setCurrentJobId(null);
    } else {
      simulatedHook.resetAnalysis();
    }
  }, [useRealBackend, simulatedHook]);

  // 根据使用的后端返回相应的状态和结果
  if (useRealBackend) {
    // 转换真实后端结果格式
    const analysisResult: UnifiedAnalysisResult | null = realAnalysisResult ? {
      confidence: realAnalysisResult.recommendedConfidence || 0.85,
      recommendedStrategy: realAnalysisResult.smartCandidates[0] || realAnalysisResult.fallbackStrategy,
      alternatives: [...realAnalysisResult.smartCandidates.slice(1), ...realAnalysisResult.staticCandidates],
      reasoning: '基于真实后端智能分析推荐',
      metadata: {
        analysisTime: 5000, // 暂时使用固定值
        strategyCount: realAnalysisResult.smartCandidates.length + realAnalysisResult.staticCandidates.length,
        usedBackend: 'real' as const,
      },
    } : null;

    return {
      analysisState: realAnalysisState,
      analysisProgress: realAnalysisProgress,
      analysisResult,
      startAnalysis,
      cancelAnalysis,
      resetAnalysis,
      config: {
        useRealBackend: true,
        debug,
      },
    };
  } else {
    // 使用模拟版本的结果
    const analysisResult: UnifiedAnalysisResult | null = simulatedHook.analysisResult ? {
      confidence: simulatedHook.analysisResult.recommendedStrategy.confidence || 0.85,
      recommendedStrategy: simulatedHook.analysisResult.recommendedStrategy,
      alternatives: simulatedHook.analysisResult.alternatives,
      reasoning: simulatedHook.analysisResult.recommendedStrategy.description || '基于模拟智能分析推荐',
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
      cancelAnalysis,
      resetAnalysis,
      config: {
        useRealBackend: false,
        debug,
      },
    };
  }
};