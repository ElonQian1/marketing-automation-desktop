// src/modules/universal-ui/ui/hooks/useStepCardAnalysis.ts
// module: universal-ui | layer: ui | role: hook
// summary: 步骤卡片智能分析状态管理Hook

import { useState, useCallback, useRef, useEffect } from 'react';
import type { StepCardAnalysisData, StepCardAnalysisActions, AnalysisStepState } from '../types/AnalysisStepCard';
import type { StrategyInfo, AnalysisProgress, AnalysisResult } from '../../../../components/universal-ui/element-selection/types/StrategyAnalysis';

export interface UseStepCardAnalysisProps {
  /** 初始分析数据 */
  initialAnalysis?: Partial<StepCardAnalysisData>;
  /** 步骤ID */
  stepId?: string;
  /** 选择哈希 */
  selectionHash?: string;
  /** 自动跟随智能策略 */
  autoFollowSmart?: boolean;
}

export interface UseStepCardAnalysisReturn {
  /** 分析数据 */
  analysis: StepCardAnalysisData;
  /** 分析操作 */
  actions: StepCardAnalysisActions;
  /** 工具方法 */
  utils: {
    /** 是否分析中 */
    isAnalyzing: boolean;
    /** 是否有结果 */
    hasResult: boolean;
    /** 是否高置信度 */
    isHighConfidence: boolean;
    /** 设置分析状态 */
    setAnalysisState: (state: AnalysisStepState) => void;
    /** 更新分析进度 */
    updateProgress: (progress: AnalysisProgress) => void;
    /** 设置分析结果 */
    setAnalysisResult: (result: AnalysisResult) => void;
    /** 绑定分析任务 */
    bindAnalysisJob: (jobId: string, selectionHash: string) => void;
    /** 清除分析数据 */
    clearAnalysis: () => void;
  };
}

/**
 * 步骤卡片智能分析Hook
 * 管理分析状态、进度和结果回填
 */
export const useStepCardAnalysis = ({
  initialAnalysis,
  stepId,
  selectionHash: initialSelectionHash,
  autoFollowSmart = false
}: UseStepCardAnalysisProps = {}): UseStepCardAnalysisReturn => {
  
  const [analysisData, setAnalysisData] = useState<StepCardAnalysisData>({
    analysisState: 'idle',
    autoFollowSmart,
    ...initialAnalysis,
  });

  // 任务取消引用
  const currentJobRef = useRef<string | null>(null);

  // 设置分析状态
  const setAnalysisState = useCallback((state: AnalysisStepState) => {
    setAnalysisData(prev => ({ ...prev, analysisState: state }));
  }, []);

  // 更新分析进度
  const updateProgress = useCallback((progress: AnalysisProgress) => {
    setAnalysisData(prev => ({ ...prev, analysisProgress: progress }));
  }, []);

  // 设置分析结果
  const setAnalysisResult = useCallback((result: AnalysisResult) => {
    const recommendedStrategy = result.recommendedStrategy;
    setAnalysisData(prev => ({
      ...prev,
      analysisState: 'completed',
      analysisResult: result,
      recommendedStrategy,
      recommendedConfidence: recommendedStrategy?.confidence
    }));
  }, []);

  // 绑定分析任务
  const bindAnalysisJob = useCallback((jobId: string, selectionHash: string) => {
    currentJobRef.current = jobId;
    setAnalysisData(prev => ({
      ...prev,
      analysisJobId: jobId,
      selectionHash,
      analysisState: 'pending'
    }));
  }, []);

  // 清除分析数据
  const clearAnalysis = useCallback(() => {
    currentJobRef.current = null;
    setAnalysisData(prev => ({
      ...prev,
      analysisJobId: undefined,
      selectionHash: undefined,
      analysisState: 'idle',
      analysisProgress: undefined,
      analysisResult: undefined,
      recommendedStrategy: undefined,
      recommendedConfidence: undefined
    }));
  }, []);

  // 重试分析
  const handleRetryAnalysis = useCallback(async () => {
    if (!stepId || !initialSelectionHash) {
      console.warn('缺少stepId或selectionHash，无法重试分析');
      return;
    }

    setAnalysisState('pending');
    
    // TODO: 调用实际分析API
    console.log('重试分析:', { stepId, selectionHash: initialSelectionHash });
    
    // 模拟分析过程
    setTimeout(() => {
      setAnalysisState('failed');
    }, 2000);
  }, [stepId, initialSelectionHash, setAnalysisState]);

  // 取消分析
  const handleCancelAnalysis = useCallback(() => {
    if (currentJobRef.current) {
      // TODO: 调用取消分析API
      console.log('取消分析:', currentJobRef.current);
      setAnalysisState('cancelled');
      currentJobRef.current = null;
    }
  }, [setAnalysisState]);

  // 应用推荐策略
  const handleApplyRecommended = useCallback(async (strategy: StrategyInfo) => {
    if (!stepId) return;
    
    // TODO: 调用策略应用API
    console.log('应用推荐策略:', { stepId, strategy });
    
    // 根据置信度决定是否自动切换
    if (analysisData.autoFollowSmart && (strategy.confidence || 0) >= 82) {
      console.log('自动切换到智能策略');
    }
  }, [stepId, analysisData.autoFollowSmart]);

  // 查看分析详情
  const handleViewAnalysisDetails = useCallback(() => {
    // TODO: 打开分析详情模态框
    console.log('查看分析详情:', analysisData.analysisResult);
  }, [analysisData.analysisResult]);

  // 一键升级
  const handleQuickUpgrade = useCallback(async () => {
    if (analysisData.recommendedStrategy) {
      await handleApplyRecommended(analysisData.recommendedStrategy);
    }
  }, [analysisData.recommendedStrategy, handleApplyRecommended]);

  // 计算工具属性
  const isAnalyzing = analysisData.analysisState === 'pending';
  const hasResult = analysisData.analysisState === 'completed' && !!analysisData.recommendedStrategy;
  const isHighConfidence = (analysisData.recommendedConfidence || 0) >= 82;

  // 操作对象
  const actions: StepCardAnalysisActions = {
    onRetryAnalysis: handleRetryAnalysis,
    onCancelAnalysis: handleCancelAnalysis,
    onApplyRecommended: handleApplyRecommended,
    onViewAnalysisDetails: handleViewAnalysisDetails,
    onQuickUpgrade: handleQuickUpgrade,
  };

  // 工具对象
  const utils = {
    isAnalyzing,
    hasResult,
    isHighConfidence,
    setAnalysisState,
    updateProgress,
    setAnalysisResult,
    bindAnalysisJob,
    clearAnalysis,
  };

  return {
    analysis: analysisData,
    actions,
    utils,
  };
};

export default useStepCardAnalysis;