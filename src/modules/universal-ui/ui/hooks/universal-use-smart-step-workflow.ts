// src/modules/universal-ui/ui/hooks/universal-use-smart-step-workflow.ts
// module: universal-ui | layer: ui | role: hook
// summary: 智能分析步骤工作流状态管理Hook

import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';

/**
 * 元素选择上下文
 */
export interface ElementSelectionContext {
  snapshotId: string;
  elementPath: string;
  elementText?: string;
  elementBounds?: string;
  elementType?: string;
}

/**
 * 分析作业状态
 */
export interface AnalysisJob {
  jobId: string;
  stepId?: string;
  selectionHash: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedTimeLeft?: number;
  candidates?: StrategyCandidate[];
  recommendedKey?: string;
  error?: string;
}

/**
 * 策略候选项
 */
export interface StrategyCandidate {
  key: string;
  name: string;
  confidence: number;
  description: string;
  variant: 'self_anchor' | 'child_driven' | 'region_scoped' | 'neighbor_relative' | 'index_fallback';
  xpath?: string;
  selector?: string;
  enabled: boolean;
}

/**
 * 步骤卡片数据
 */
export interface SmartStepCard {
  stepId: string;
  stepName: string;
  stepType: string;
  elementContext?: ElementSelectionContext;
  analysisJobId?: string;
  analysisState: 'idle' | 'analyzing' | 'analyzed' | 'upgrade_available' | 'failed' | 'expired';
  analysisProgress: number;
  strategyMode: 'intelligent' | 'smart_variant' | 'static_user';
  strategyCandidates: StrategyCandidate[];
  activeStrategy?: StrategyCandidate;
  recommendedStrategy?: StrategyCandidate;
  recommendedConfidence?: number;
  autoFollowSmart: boolean;
  createdAt: Date;
  analyzedAt?: Date;
}

/**
 * 智能步骤工作流Hook返回类型
 */
export interface UseSmartStepWorkflowReturn {
  // 状态
  currentJob: AnalysisJob | null;
  stepCards: SmartStepCard[];
  isAnalyzing: boolean;
  
  // 气泡操作
  startAnalysisFromPopover: (context: ElementSelectionContext) => Promise<string>; // 返回jobId
  createStepCardQuick: (context: ElementSelectionContext, useExistingJob?: boolean) => Promise<string>; // 返回stepId
  cancelAnalysis: (jobId: string) => Promise<void>;
  
  // 步骤卡片操作
  bindAnalysisToStep: (stepId: string, jobId: string) => void;
  applyRecommendedStrategy: (stepId: string) => Promise<void>;
  switchStrategyMode: (stepId: string, mode: SmartStepCard['strategyMode']) => void;
  selectCandidate: (stepId: string, candidate: StrategyCandidate) => void;
  retryAnalysis: (stepId: string) => Promise<void>;
  quickUpgrade: (stepId: string) => Promise<void>;
  
  // 工具方法
  getStepCard: (stepId: string) => SmartStepCard | undefined;
  deleteStep: (stepId: string) => void;
  clearAllJobs: () => void;
}

/**
 * 智能分析步骤工作流Hook
 * 管理从气泡选择到步骤卡片的完整工作流状态
 */
export function useSmartStepWorkflow(): UseSmartStepWorkflowReturn {
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  const [stepCards, setStepCards] = useState<SmartStepCard[]>([]);
  const jobTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const isAnalyzing = currentJob?.state === 'running' || currentJob?.state === 'pending';

  /**
   * 生成选择哈希（防串扰）
   */
  const generateSelectionHash = useCallback((context: ElementSelectionContext): string => {
    const hashData = `${context.snapshotId}-${context.elementPath}-${context.elementText || ''}-${Date.now()}`;
    return btoa(hashData).slice(0, 16);
  }, []);

  /**
   * 从气泡启动分析
   */
  const startAnalysisFromPopover = useCallback(async (context: ElementSelectionContext): Promise<string> => {
    try {
      const jobId = 'job_' + Date.now().toString(36);
      const selectionHash = generateSelectionHash(context);
      
      const newJob: AnalysisJob = {
        jobId,
        selectionHash,
        state: 'pending',
        progress: 0,
        estimatedTimeLeft: 3000 // 3秒预估
      };

      setCurrentJob(newJob);

      // 模拟分析进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 每次增加5-20%
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // 模拟分析完成
          const mockCandidates: StrategyCandidate[] = [
            {
              key: 'self_anchor',
              name: '自我锚点',
              confidence: 95,
              description: '基于元素自身属性定位',
              variant: 'self_anchor',
              xpath: '//android.widget.Button[@resource-id="com.example:id/button"]',
              enabled: true
            },
            {
              key: 'child_driven',
              name: '子树锚点',
              confidence: 87,
              description: '基于子元素特征定位',
              variant: 'child_driven',
              xpath: '//android.widget.LinearLayout[child::android.widget.Button[contains(@text,"确定")]]',
              enabled: true
            },
            {
              key: 'region_scoped',
              name: '区域限定',
              confidence: 82,
              description: '在特定区域内定位',
              variant: 'region_scoped',
              xpath: '//android.widget.ScrollView//android.widget.Button[1]',
              enabled: true
            }
          ];

          setCurrentJob(prev => prev ? {
            ...prev,
            state: 'completed',
            progress: 100,
            candidates: mockCandidates,
            recommendedKey: 'self_anchor'
          } : null);
        } else {
          setCurrentJob(prev => prev ? {
            ...prev,
            state: 'running',
            progress: Math.min(progress, 95),
            estimatedTimeLeft: Math.max(0, 3000 - progress * 30)
          } : null);
        }
      }, 200);

      // 设置超时
      const timeout = setTimeout(() => {
        clearInterval(progressInterval);
        setCurrentJob(prev => prev ? {
          ...prev,
          state: 'failed',
          error: '分析超时'
        } : null);
      }, 10000);

      jobTimeoutsRef.current.set(jobId, timeout);

      return jobId;
    } catch (error) {
      message.error('启动分析失败');
      throw error;
    }
  }, [generateSelectionHash]);

  /**
   * 快速创建步骤卡片
   */
  const createStepCardQuick = useCallback(async (
    context: ElementSelectionContext, 
    useExistingJob = false
  ): Promise<string> => {
    const stepId = 'step_' + Date.now().toString(36);
    
    // 创建基础步骤卡片（使用静态兜底策略）
    const newStepCard: SmartStepCard = {
      stepId,
      stepName: `点击${context.elementText || '元素'}`,
      stepType: 'tap',
      elementContext: context,
      analysisState: 'idle',
      analysisProgress: 0,
      strategyMode: 'intelligent',
      strategyCandidates: [],
      autoFollowSmart: true,
      createdAt: new Date()
    };

    // 如果有现有分析作业，绑定它
    if (useExistingJob && currentJob) {
      newStepCard.analysisJobId = currentJob.jobId;
      newStepCard.analysisState = 'analyzing';
      newStepCard.analysisProgress = currentJob.progress;
      
      // 更新job中的stepId
      setCurrentJob(prev => prev ? { ...prev, stepId } : null);
    }

    setStepCards(prev => [...prev, newStepCard]);

    // 如果没有现有作业，自动启动分析
    if (!useExistingJob) {
      try {
        const jobId = await startAnalysisFromPopover(context);
        setStepCards(prev => prev.map(card => 
          card.stepId === stepId 
            ? { ...card, analysisJobId: jobId, analysisState: 'analyzing' }
            : card
        ));
      } catch (error) {
        console.error('Auto-start analysis failed:', error);
      }
    }

    return stepId;
  }, [currentJob, startAnalysisFromPopover]);

  /**
   * 取消分析
   */
  const cancelAnalysis = useCallback(async (jobId: string): Promise<void> => {
    const timeout = jobTimeoutsRef.current.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      jobTimeoutsRef.current.delete(jobId);
    }

    setCurrentJob(prev => 
      prev?.jobId === jobId 
        ? { ...prev, state: 'cancelled' }
        : prev
    );

    // 更新相关步骤卡片状态
    setStepCards(prev => prev.map(card => 
      card.analysisJobId === jobId
        ? { ...card, analysisState: 'idle', analysisProgress: 0 }
        : card
    ));

    message.info('已取消分析');
  }, []);

  /**
   * 绑定分析结果到步骤
   */
  const bindAnalysisToStep = useCallback((stepId: string, jobId: string) => {
    if (!currentJob || currentJob.jobId !== jobId || currentJob.state !== 'completed') {
      return;
    }

    setStepCards(prev => prev.map(card => {
      if (card.stepId === stepId) {
        const recommendedCandidate = currentJob.candidates?.find(c => c.key === currentJob.recommendedKey);
        return {
          ...card,
          analysisState: recommendedCandidate && recommendedCandidate.confidence >= 82 ? 'upgrade_available' : 'analyzed',
          analysisProgress: 100,
          strategyCandidates: currentJob.candidates || [],
          recommendedStrategy: recommendedCandidate,
          recommendedConfidence: recommendedCandidate?.confidence,
          analyzedAt: new Date()
        };
      }
      return card;
    }));
  }, [currentJob]);

  /**
   * 应用推荐策略
   */
  const applyRecommendedStrategy = useCallback(async (stepId: string): Promise<void> => {
    setStepCards(prev => prev.map(card => {
      if (card.stepId === stepId && card.recommendedStrategy) {
        return {
          ...card,
          activeStrategy: card.recommendedStrategy,
          strategyMode: 'intelligent',
          analysisState: 'analyzed'
        };
      }
      return card;
    }));
    
    message.success('已应用推荐策略');
  }, []);

  /**
   * 切换策略模式
   */
  const switchStrategyMode = useCallback((stepId: string, mode: SmartStepCard['strategyMode']) => {
    setStepCards(prev => prev.map(card => 
      card.stepId === stepId ? { ...card, strategyMode: mode } : card
    ));
  }, []);

  /**
   * 选择策略候选
   */
  const selectCandidate = useCallback((stepId: string, candidate: StrategyCandidate) => {
    setStepCards(prev => prev.map(card => 
      card.stepId === stepId 
        ? { ...card, activeStrategy: candidate, strategyMode: 'smart_variant' }
        : card
    ));
  }, []);

  /**
   * 重试分析
   */
  const retryAnalysis = useCallback(async (stepId: string): Promise<void> => {
    const stepCard = stepCards.find(card => card.stepId === stepId);
    if (!stepCard?.elementContext) {
      message.error('缺少元素上下文，无法重试');
      return;
    }

    try {
      const jobId = await startAnalysisFromPopover(stepCard.elementContext);
      setStepCards(prev => prev.map(card => 
        card.stepId === stepId 
          ? { ...card, analysisJobId: jobId, analysisState: 'analyzing', analysisProgress: 0 }
          : card
      ));
    } catch (error) {
      message.error('重试分析失败');
    }
  }, [stepCards, startAnalysisFromPopover]);

  /**
   * 一键升级
   */
  const quickUpgrade = useCallback(async (stepId: string): Promise<void> => {
    await applyRecommendedStrategy(stepId);
    message.success('已升级到推荐策略！');
  }, [applyRecommendedStrategy]);

  /**
   * 获取步骤卡片
   */
  const getStepCard = useCallback((stepId: string): SmartStepCard | undefined => {
    return stepCards.find(card => card.stepId === stepId);
  }, [stepCards]);

  /**
   * 删除步骤
   */
  const deleteStep = useCallback((stepId: string) => {
    setStepCards(prev => prev.filter(card => card.stepId !== stepId));
  }, []);

  /**
   * 清空所有作业
   */
  const clearAllJobs = useCallback(() => {
    // 清空所有超时器
    jobTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    jobTimeoutsRef.current.clear();
    
    setCurrentJob(null);
    setStepCards([]);
  }, []);

  return {
    // 状态
    currentJob,
    stepCards,
    isAnalyzing,
    
    // 气泡操作
    startAnalysisFromPopover,
    createStepCardQuick,
    cancelAnalysis,
    
    // 步骤卡片操作
    bindAnalysisToStep,
    applyRecommendedStrategy,
    switchStrategyMode,
    selectCandidate,
    retryAnalysis,
    quickUpgrade,
    
    // 工具方法
    getStepCard,
    deleteStep,
    clearAllJobs
  };
}