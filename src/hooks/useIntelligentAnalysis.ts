// src/hooks/useIntelligentAnalysis.ts
// module: hooks | layer: application | role: 智能分析Hook
// summary: 封装智能分析API调用，自动填充候选项评分到analysis-state-store

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { message } from 'antd';
import { useAnalysisStateStore } from '../stores/analysis-state-store';

/**
 * 元素选择上下文（与后端保持一致）
 */
export interface ElementSelectionContext {
  snapshot_id: string;
  element_path: string;
  element_text?: string;
  element_bounds?: string;
  element_type?: string;
  key_attributes?: Record<string, string>;
  container_info?: {
    container_type: string;
    container_path: string;
    item_index?: number;
    total_items?: number;
  };
  siblingTexts?: string[];
  parentElement?: {
    content_desc: string;
    text: string;
    resource_id: string;
  };
  childrenTexts?: string[];
}

/**
 * 分析任务配置
 */
export interface AnalysisJobConfig {
  element_context: ElementSelectionContext;
  step_id?: string;
  lock_container: boolean;
  enable_smart_candidates: boolean;
  enable_static_candidates: boolean;
}

/**
 * 策略候选项
 */
export interface StrategyCandidate {
  key: string;
  name: string;
  confidence: number;
  description: string;
  variant: string;
  xpath?: string;
  text?: string;
  resource_id?: string;
  class_name?: string;
  content_desc?: string;
  enabled: boolean;
  is_recommended: boolean;
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  selection_hash: string;
  step_id?: string;
  smart_candidates: StrategyCandidate[];
  static_candidates: StrategyCandidate[];
  recommended_key: string;
  recommended_confidence: number;
  fallback_strategy: StrategyCandidate;
}

/**
 * 分析完成事件
 */
export interface AnalysisDoneEvent {
  job_id: string;
  selection_hash: string;
  result: AnalysisResult;
  confidence: number;
  evidence: {
    resource_id_match: number;
    text_match: number;
    position_match: number;
    structure_match: number;
  };
  origin: string;
  element_uid?: string;
  card_id?: string;
}

/**
 * 智能分析Hook
 */
export const useIntelligentAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const analysisStore = useAnalysisStateStore();

  /**
   * 填充候选项评分到 analysis-state-store
   */
  const fillCandidatesScores = useCallback((result: AnalysisResult) => {
    console.log('💾 [智能分析] 填充候选项评分:', {
      smartCount: result.smart_candidates.length,
      staticCount: result.static_candidates.length
    });

    // 合并智能候选项和静态候选项
    const allCandidates = [
      ...result.smart_candidates,
      ...result.static_candidates
    ];

    // 填充最终分数
    const scores = allCandidates.map(candidate => ({
      stepId: candidate.key,  // 使用 candidateKey 作为 stepId
      confidence: candidate.confidence,
      strategy: candidate.name,
      metrics: {
        xpath: candidate.xpath,
        description: candidate.description,
        variant: candidate.variant
      }
    }));

    analysisStore.setFinalScores(scores);

    console.log('✅ [智能分析] 已填充评分:', scores.map(s => ({
      key: s.stepId,
      conf: `${Math.round(s.confidence * 100)}%`
    })));
  }, [analysisStore]);

  /**
   * 启动智能分析
   */
  const startAnalysis = useCallback(async (config: AnalysisJobConfig) => {
    try {
      setIsAnalyzing(true);
      setProgress(0);
      setError(null);

      // 生成jobId
      const jobId = `analysis-${Date.now()}`;
      
      // 开始分析任务
      analysisStore.startAnalysis(jobId);

      console.log('🚀 [智能分析] 启动分析:', config);

      // 调用后端命令
      const response = await invoke<{ job_id: string; selection_hash: string; state: string }>(
        'start_intelligent_analysis',
        { config }
      );

      console.log('✅ [智能分析] 分析已启动:', response);

      // 监听进度事件
      const progressUnlisten = await listen<{ job_id: string; progress: number; current_step: string }>(
        'analysis:progress',
        (event) => {
          if (event.payload.job_id === response.job_id) {
            setProgress(event.payload.progress);
            setCurrentStep(event.payload.current_step);
            console.log(`📊 [智能分析] 进度: ${event.payload.progress}% - ${event.payload.current_step}`);
          }
        }
      );

      // 监听完成事件
      const doneUnlisten = await listen<AnalysisDoneEvent>(
        'analysis:done',
        (event) => {
          if (event.payload.job_id === response.job_id) {
            console.log('🎉 [智能分析] 分析完成:', event.payload);

            // 🔑 核心：将候选项评分填充到 analysis-state-store
            fillCandidatesScores(event.payload.result);

            // 设置智能自动链
            if (event.payload.result.smart_candidates.length > 0) {
              const orderedSteps = event.payload.result.smart_candidates
                .sort((a, b) => b.confidence - a.confidence)
                .map(c => c.key);

              analysisStore.setSmartChain({
                orderedSteps,
                recommended: event.payload.result.recommended_key,
                threshold: 0.6,
                reasons: [
                  `主要策略: ${event.payload.result.recommended_key} (${Math.round(event.payload.result.recommended_confidence * 100)}%)`,
                  `备选策略: ${orderedSteps.length - 1}个`,
                  '按置信度降序排列'
                ],
                totalConfidence: event.payload.confidence
              });
            }

            // 完成分析
            analysisStore.completeAnalysis();
            setIsAnalyzing(false);
            setProgress(100);

            // 清理监听器
            progressUnlisten();
            doneUnlisten();
            errorUnlisten();

            message.success('智能分析完成');
          }
        }
      );

      // 监听错误事件
      const errorUnlisten = await listen<{ job_id: string; error: string }>(
        'analysis:error',
        (event) => {
          if (event.payload.job_id === response.job_id) {
            console.error('❌ [智能分析] 分析失败:', event.payload.error);
            
            setError(event.payload.error);
            analysisStore.setError(event.payload.error);
            setIsAnalyzing(false);

            // 清理监听器
            progressUnlisten();
            doneUnlisten();
            errorUnlisten();

            message.error(`分析失败: ${event.payload.error}`);
          }
        }
      );

      return response.job_id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      console.error('❌ [智能分析] 启动失败:', err);
      
      setError(errorMsg);
      analysisStore.setError(errorMsg);
      setIsAnalyzing(false);
      
      message.error(`启动分析失败: ${errorMsg}`);
      throw err;
    }
  }, [analysisStore, fillCandidatesScores]);

  /**
   * 取消分析
   */
  const cancelAnalysis = useCallback(async (jobId: string) => {
    try {
      await invoke('cancel_intelligent_analysis', { jobId });
      setIsAnalyzing(false);
      message.info('已取消分析');
    } catch (err) {
      console.error('❌ [智能分析] 取消失败:', err);
    }
  }, []);

  return {
    isAnalyzing,
    progress,
    currentStep,
    error,
    startAnalysis,
    cancelAnalysis
  };
};
