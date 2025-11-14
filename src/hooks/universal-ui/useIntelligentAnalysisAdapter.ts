// src/hooks/universal-ui/useIntelligentAnalysisAdapter.ts
// module: universal-ui | layer: hooks | role: adapter
// summary: 智能分析 Hook 适配器，支持真实后端（V2/V3）和模拟版本

import { useCallback, useState, useEffect } from 'react';
import type { UIElement } from '../../api/universalUIAPI';
import type { IntelligentAnalysisConfig } from '../../config/intelligentAnalysisConfig';
import { 
  useStrategyAnalysis,
  type AnalysisState,
  type AnalysisProgress,
} from './useStrategyAnalysis';
import { useIntelligentAnalysisBackend } from '../../services/intelligent-analysis-backend';
import { IntelligentAnalysisBackendV3 } from '../../services/intelligent-analysis-backend-v3';
import { featureFlagManager } from '../../config/feature-flags';
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
  const [currentExecutionVersion, setCurrentExecutionVersion] = useState<'v2' | 'v3'>('v2');

  // 🔄 V2/V3版本切换
  useEffect(() => {
    if (!useRealBackend) return;

    const updateExecutionVersion = async () => {
      const version = await featureFlagManager.getSmartExecutionVersion('adapter');
      setCurrentExecutionVersion(version);
    };

    updateExecutionVersion();
    const interval = setInterval(updateExecutionVersion, 30000);

    return () => clearInterval(interval);
  }, [useRealBackend]);

  // 设置真实后端事件监听
  useEffect(() => {
    if (!useRealBackend) return;

    let cleanup: (() => void) | undefined;

    const setupEventListeners = async () => {
      try {
        // 🔀 根据版本选择backend
        const backend = currentExecutionVersion === 'v3'
          ? IntelligentAnalysisBackendV3
          : backendService;

        // 监听进度更新
        await backend.listenToAnalysisProgress((jobId, progress, step, estimatedTimeLeft) => {
          // console.log('📊 [Adapter] 收到进度更新', { jobId, progress, step, estimatedTimeLeft });
          setRealAnalysisProgress({
            currentStep: Math.round((progress / 100) * 7), // 进度是百分比，转换为步骤数
            totalSteps: 7,
            stepName: step || `步骤 ${Math.round((progress / 100) * 7)}`,
            stepDescription: `执行${step || '分析'}`,
          });
        });

        // 监听分析完成 - 使用 jobId 参数
        await backend.listenToAnalysisComplete((jobId, result) => {
          // console.log('🎉 [Adapter] 收到分析完成回调', { jobId, result });
          setRealAnalysisState('completed');
          setRealAnalysisResult(result);
          setRealAnalysisProgress(null);
          setCurrentJobId(null);
        });

        // 监听分析错误
        await backend.listenToAnalysisError((error) => {
          console.error('❌ [Adapter] 真实后端分析失败', error);
          setRealAnalysisState('failed');
          setRealAnalysisProgress(null);
          setCurrentJobId(null);
        });

        // ⚠️ 重要：不再自动清理全局事件监听器
        // 因为全局监听器已在 main.tsx 中注册，不应在组件卸载时清理
        // cleanup = () => backendService.cleanup();
        cleanup = () => {
          console.log('🔗 [Adapter] 组件卸载，清理资源');
          // V3需要额外清理
          if (currentExecutionVersion === 'v3') {
            IntelligentAnalysisBackendV3.cleanup();
          }
        };
      } catch (error) {
        console.error('❌ [Adapter] 设置事件监听器失败', error);
      }
    };

    setupEventListeners();

    return () => {
      cleanup?.();
    };
  }, [useRealBackend, backendService, currentExecutionVersion]);

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

        // 🔀 V2/V3执行路由
        let response: { job_id?: string; analysis_id?: string };
        if (currentExecutionVersion === 'v3') {
          try {
            const v3Response = await IntelligentAnalysisBackendV3.executeChainV3(
              {
                snapshot_cache_key: `${context.element.resource_id || context.element.text}_${Date.now()}`,
                cache_ttl_secs: 300,
                cache_match_threshold: 0.7,
              },
              {
                candidates: [
                  {
                    mode: { ByRef: { step_id: context.stepId || 'adapter-step' } },
                    weight: 1.0,
                  },
                ],
              }
            );
            response = { analysis_id: v3Response.analysis_id };
            setCurrentJobId(v3Response.analysis_id || null);
            console.log('✅ [Adapter] V3真实后端分析已启动', v3Response);
          } catch (error) {
            console.warn('⚠️ [Adapter] V3执行失败，回退到V2:', error);
            const v2Response = await backendService.startAnalysis(
              context.element,
              context.stepId,
              {
                lockContainer: false,
                enableSmartCandidates: true,
                enableStaticCandidates: true,
              }
            );
            response = v2Response;
            setCurrentJobId(v2Response.job_id);
            console.log('✅ [Adapter] V2真实后端分析已启动（回退）', v2Response);
          }
        } else {
          // V2执行
          response = await backendService.startAnalysis(
            context.element,
            context.stepId,
            {
              lockContainer: false,
              enableSmartCandidates: true,
              enableStaticCandidates: true,
            }
          );
          setCurrentJobId(response.job_id);
          console.log('✅ [Adapter] V2真实后端分析已启动', response);
        }
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
        // 🔀 V2/V3取消路由
        if (currentExecutionVersion === 'v3') {
          await IntelligentAnalysisBackendV3.cancelAnalysis(currentJobId);
        } else {
          await backendService.cancelAnalysis(currentJobId);
        }
        setRealAnalysisState('idle');
        setRealAnalysisProgress(null);
        setCurrentJobId(null);
      } catch (error) {
        console.error('❌ [Adapter] 取消真实后端分析失败', error);
      }
    } else {
      simulatedHook.cancelAnalysis();
    }
  }, [useRealBackend, currentJobId, backendService, simulatedHook, currentExecutionVersion]);

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