// src/hooks/useSmartStrategyAnalysis.ts
// module: hooks | layer: hooks | role: 智能策略分析Hook
// summary: 集成真实智能分析后端，为策略选择器提供数据和操作

import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
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
  resetAnalysisState: () => void;
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

  // 添加超时重置机制 - 改进版本
  useEffect(() => {
    if (strategySelector?.analysis?.status === 'analyzing') {
      console.log('⏱️ [StrategyAnalysis] 开始15秒超时监控', {
        stepId: step.id,
        currentTime: new Date().toISOString(),
        analysisState: strategySelector.analysis
      });
      
      // 设置超时，如果15秒后仍在分析状态，自动重置
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ [StrategyAnalysis] 分析超时，强制重置状态', {
          stepId: step.id,
          duration: '15s',
          previousState: strategySelector?.analysis
        });
        
        setStrategySelector(prev => prev ? {
          ...prev,
          analysis: {
            status: 'failed',
            error: '分析超时 - 可能后端服务未响应，请检查后端服务状态'
          }
        } : null);
        setIsAnalyzing(false);
        currentJobId.current = null;
      }, 15000); // 15秒超时

      return () => {
        console.log('🧹 [StrategyAnalysis] 清理超时监控', { stepId: step.id });
        clearTimeout(timeoutId);
      };
    }
  }, [strategySelector?.analysis?.status, step.id]);

  // 清理函数
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // 监听分析进度
        const progressUnlisten = await backendService.listenToAnalysisProgress(
          (jobId, progress, currentStep, estimatedTimeLeft) => {
            // console.log('📊 [StrategyAnalysis] 进度更新:', { jobId, progress, currentStep, estimatedTimeLeft });
            
            // 只处理当前任务的进度更新
            if (!currentJobId.current || currentJobId.current === jobId) {
              setStrategySelector(prev => prev ? {
                ...prev,
                analysis: {
                  status: 'analyzing',
                  progress,
                  eta: estimatedTimeLeft,
                  currentStep
                }
              } : null);
            }
          }
        );

        // 监听分析完成
        const completeUnlisten = await backendService.listenToAnalysisComplete(
          (jobId, result) => {
            // console.log('✅ [StrategyAnalysis] 分析完成:', { jobId, result });
            // console.log('🔍 [StrategyAnalysis] 当前分析状态:', {
            //   currentJobId: currentJobId.current,
            //   receivedJobId: jobId,
            //   isAnalyzing,
            //   stepId: step.id,
            //   resultSelectionHash: result.selectionHash
            // });
            
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

  // 手动重置分析状态
  const resetAnalysisState = useCallback(() => {
    console.log('🔄 [StrategyAnalysis] 手动重置分析状态', { stepId: step.id });
    setStrategySelector(prev => prev ? {
      ...prev,
      analysis: {
        status: 'idle'
      }
    } : null);
    setIsAnalyzing(false);
    currentJobId.current = null;
  }, [step.id]);

  // 开始分析 - 改进版本
  const startAnalysis = useCallback(async () => {
    if (!element || !strategySelector) {
      console.warn('⚠️ [StrategyAnalysis] 缺少必要参数:', { element: !!element, strategySelector: !!strategySelector });
      return;
    }

    // 如果已经在分析中，先重置状态再开始新的分析
    if (strategySelector.analysis.status === 'analyzing') {
      console.warn('⚠️ [StrategyAnalysis] 检测到状态卡在analyzing，先重置再重新开始', { stepId: step.id });
      // 取消当前分析
      if (currentJobId.current) {
        try {
          await backendService.cancelAnalysis(currentJobId.current);
        } catch (error) {
          console.error('取消分析失败:', error);
        }
      }
      // 重置状态
      setIsAnalyzing(false);
      currentJobId.current = null;
    }

    try {
      console.log('🚀 [StrategyAnalysis] 开始分析', { 
        stepId: step.id, 
        element: element.resource_id || element.text,
        timestamp: new Date().toISOString()
      });

      setIsAnalyzing(true);
      setStrategySelector(prev => prev ? {
        ...prev,
        analysis: {
          status: 'analyzing',
          progress: 0,
          startTime: Date.now()
        }
      } : null);

      // 调用后端分析服务
      const response = await backendService.startAnalysis(element, step.id, {
        lockContainer: strategySelector.config.enableFallback,
        enableSmartCandidates: true,
        enableStaticCandidates: true
      });

      currentJobId.current = response.job_id;
      console.log('✅ [StrategyAnalysis] 分析请求已发送:', response);

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
    
    try {
      const { StaticStrategyStore } = await import('../stores/staticStrategies');
      
      // 基于selector生成稳定的key，避免重复保存相同策略
      const selectorHash = candidate.selector.length > 50 
        ? candidate.selector.substring(0, 50) + '...' 
        : candidate.selector;
      const stableKey = `user-${btoa(selectorHash).replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
      
      const savedStrategy = {
        key: stableKey,
        name: `用户保存-${candidate.name || candidate.key}`,
        locator: {
          type: 'xpath',
          value: candidate.selector
        },
        createdAt: new Date().toISOString(),
        description: `从智能分析结果保存: ${candidate.description || '无描述'}`
      };
      
      StaticStrategyStore.save(savedStrategy);
      
      // 同时更新当前选择器的静态候选列表（用于即时显示，去重处理）
      setStrategySelector(prev => prev ? {
        ...prev,
        candidates: {
          ...prev.candidates,
          static: [
            // 过滤掉已存在的相同key策略
            ...prev.candidates.static.filter(existing => existing.key !== savedStrategy.key),
            {
              ...candidate,
              type: 'static',
              key: savedStrategy.key,
              name: savedStrategy.name
            }
          ]
        }
      } : null);
      
      message.success(`已保存为静态策略: ${savedStrategy.name}`);
    } catch (error) {
      console.error('保存静态策略失败:', error);
      message.error('保存静态策略失败');
    }
  }, []);

  return {
    strategySelector,
    isAnalyzing,
    startAnalysis,
    cancelAnalysis,
    applyStrategy,
    saveAsStatic,
    resetAnalysisState
  };
};