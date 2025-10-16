// src/hooks/useSmartStrategyAnalysis.ts
// module: hooks | layer: hooks | role: 智能策略分析Hook
// summary: 集成真实智能分析后端，为策略选择器提供数据和操作

import { useState, useCallback, useEffect, useRef } from 'react';
import { useIntelligentAnalysisBackend } from '../services/intelligent-analysis-backend';
import type { 
  StrategySelector, 
  StrategyCandidate, 
  StrategyType,
  SmartStep
} from '../types/strategySelector';
import type { UIElement } from '../api/universalUIAPI';
import type { SmartScriptStep } from '../components/DraggableStepCard';

interface UseSmartStrategyAnalysisProps {
  step: SmartScriptStep;
  element?: UIElement;
}

interface UseSmartStrategyAnalysisReturn {
  strategySelector: StrategySelector | null;
  isAnalyzing: boolean;
  startAnalysis: () => Promise<void>;
  cancelAnalysis: () => Promise<void>;
  applyStrategy: (strategy: { type: StrategyType; key?: string }) => void;
  saveAsStatic: (candidate: StrategyCandidate) => Promise<void>;
}

/**
 * 智能策略分析Hook - 集成真实后端服务
 */
export const useSmartStrategyAnalysis = ({
  step,
  element
}: UseSmartStrategyAnalysisProps): UseSmartStrategyAnalysisReturn => {
  const backendService = useIntelligentAnalysisBackend();
  const [strategySelector, setStrategySelector] = useState<StrategySelector | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const currentJobId = useRef<string | null>(null);
  const cleanupFunctions = useRef<Array<() => void>>([]);

  // 初始化策略选择器状态
  useEffect(() => {
    if (step.enableStrategySelector) {
      setStrategySelector(prev => prev || {
        activeStrategy: {
          type: 'smart-auto'
        },
        analysis: {
          status: 'idle'
        },
        candidates: {
          smart: [],
          static: []
        },
        config: {
          autoFollowSmart: true,
          confidenceThreshold: 0.82,
          enableFallback: true
        }
      });
    }
  }, [step.enableStrategySelector]);

  // 添加超时重置机制
  useEffect(() => {
    if (strategySelector?.analysis?.status === 'analyzing') {
      // 设置超时，如果15秒后仍在分析状态，自动重置
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ [StrategyAnalysis] 分析超时，自动重置状态');
        setStrategySelector(prev => prev ? {
          ...prev,
          analysis: {
            status: 'failed',
            error: '分析超时，请重试'
          }
        } : null);
        setIsAnalyzing(false);
        currentJobId.current = null;
      }, 15000); // 15秒超时

      return () => clearTimeout(timeoutId);
    }
  }, [strategySelector?.analysis?.status]);

  // 清理函数
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // 监听分析进度
        const progressUnlisten = await backendService.listenToAnalysisProgress(
          (progress, stepName, estimatedTimeLeft) => {
            console.log('📊 [StrategyAnalysis] 进度更新:', { progress, stepName, estimatedTimeLeft });
            setStrategySelector(prev => prev ? {
              ...prev,
              analysis: {
                status: 'analyzing',
                progress,
                eta: estimatedTimeLeft,
                currentStep: stepName
              }
            } : null);
          }
        );

        // 监听分析完成
        const completeUnlisten = await backendService.listenToAnalysisComplete(
          (result) => {
            console.log('✅ [StrategyAnalysis] 分析完成:', result);
            
            // 转换后端结果为策略选择器格式
            const smartCandidates: StrategyCandidate[] = result.smartCandidates.map((candidate, index) => ({
              key: candidate.key,
              type: 'smart' as const,
              name: candidate.name,
              confidence: candidate.confidence,
              selector: candidate.xpath || '',
              description: candidate.description || '',
              stepName: `step${(index % 6) + 1}` as SmartStep, // 循环分配step1-step6
              estimatedTime: 150, // 智能策略预估执行时间
              riskLevel: candidate.confidence > 0.9 ? 'low' : candidate.confidence > 0.7 ? 'medium' : 'high'
            }));

            const staticCandidates: StrategyCandidate[] = result.staticCandidates.map(candidate => ({
              key: candidate.key,
              type: 'static' as const,
              name: candidate.name,
              confidence: candidate.confidence,
              selector: candidate.xpath || '',
              description: candidate.description || '',
              estimatedTime: 50, // 静态策略预估执行时间
              riskLevel: 'high' as const // 静态策略风险较高
            }));

            // 找到推荐策略
            const recommendedCandidate = [...smartCandidates, ...staticCandidates]
              .find(c => c.key === result.recommendedKey);

            setStrategySelector(prev => prev ? {
              ...prev,
              analysis: {
                status: 'completed',
                progress: 100,
                completedAt: new Date()
              },
              candidates: {
                smart: smartCandidates,
                static: staticCandidates
              },
              recommended: recommendedCandidate ? {
                key: result.recommendedKey,
                confidence: result.recommendedConfidence
              } : undefined
            } : null);

            setIsAnalyzing(false);
            currentJobId.current = null;
          }
        );

        // 监听分析错误
        const errorUnlisten = await backendService.listenToAnalysisError(
          (error) => {
            console.error('❌ [StrategyAnalysis] 分析失败:', error);
            setStrategySelector(prev => prev ? {
              ...prev,
              analysis: {
                status: 'failed',
                error
              }
            } : null);
            setIsAnalyzing(false);
            currentJobId.current = null;
          }
        );

        // 保存清理函数
        cleanupFunctions.current = [progressUnlisten, completeUnlisten, errorUnlisten];

      } catch (error) {
        console.error('❌ [StrategyAnalysis] 设置事件监听器失败:', error);
      }
    };

    setupEventListeners();

    // 清理函数
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, [backendService]);

  // 开始分析
  const startAnalysis = useCallback(async () => {
    if (!element || !strategySelector) {
      console.warn('⚠️ [StrategyAnalysis] 缺少必要参数:', { element: !!element, strategySelector: !!strategySelector });
      return;
    }

    try {
      setIsAnalyzing(true);
      setStrategySelector(prev => prev ? {
        ...prev,
        analysis: {
          status: 'analyzing',
          progress: 0
        }
      } : null);

      // 调用后端分析服务
      const response = await backendService.startAnalysis(element, step.id, {
        lockContainer: strategySelector.config.enableFallback,
        enableSmartCandidates: true,
        enableStaticCandidates: true
      });

      currentJobId.current = response.job_id;
      console.log('🚀 [StrategyAnalysis] 分析已启动:', response);

    } catch (error) {
      console.error('❌ [StrategyAnalysis] 启动分析失败:', error);
      setIsAnalyzing(false);
      setStrategySelector(prev => prev ? {
        ...prev,
        analysis: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        }
      } : null);
    }
  }, [backendService, element, step.id, strategySelector]);

  // 取消分析
  const cancelAnalysis = useCallback(async () => {
    if (!currentJobId.current) return;

    try {
      await backendService.cancelAnalysis(currentJobId.current);
      setIsAnalyzing(false);
      setStrategySelector(prev => prev ? {
        ...prev,
        analysis: {
          status: 'idle'
        }
      } : null);
      currentJobId.current = null;
      console.log('⏹️ [StrategyAnalysis] 分析已取消');
    } catch (error) {
      console.error('❌ [StrategyAnalysis] 取消分析失败:', error);
    }
  }, [backendService]);

  // 应用策略
  const applyStrategy = useCallback((strategy: { type: StrategyType; key?: string }) => {
    console.log('🎯 [StrategyAnalysis] 应用策略:', strategy);
    setStrategySelector(prev => prev ? {
      ...prev,
      activeStrategy: strategy
    } : null);
  }, []);

  // 保存为静态策略
  const saveAsStatic = useCallback(async (candidate: StrategyCandidate) => {
    console.log('💾 [StrategyAnalysis] 保存静态策略:', candidate);
    
    // TODO: 实现保存到用户静态策略库的逻辑
    // 这里应该调用后端API保存用户自定义策略
    
    // 临时将其添加到静态候选列表
    setStrategySelector(prev => prev ? {
      ...prev,
      candidates: {
        ...prev.candidates,
        static: [
          ...prev.candidates.static,
          {
            ...candidate,
            type: 'static',
            key: `user-${Date.now()}`,
            name: `用户保存-${candidate.name}`
          }
        ]
      }
    } : null);
  }, []);

  return {
    strategySelector,
    isAnalyzing,
    startAnalysis,
    cancelAnalysis,
    applyStrategy,
    saveAsStatic
  };
};