// src/modules/universal-ui/hooks/use-intelligent-analysis-workflow.ts
// module: universal-ui | layer: hooks | role: workflow-manager
// summary: 智能分析工作流管理Hook，处理分析作业生命周期

import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
// import { invoke } from '@tauri-apps/api/tauri';
// import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// 临时使用模拟后端，实际项目中应该使用上面的Tauri API
import { mockAnalysisBackend } from '../services/mock-analysis-backend';

import type {
  ElementSelectionContext,
  SelectionHash,
  AnalysisJob,
  IntelligentStepCard,
  AnalysisResult,
  AnalysisProgressEvent,
  AnalysisDoneEvent,
  AnalysisErrorEvent
} from '../types/intelligent-analysis-types';

import { calculateSelectionHash } from '../utils/selection-hash';

/**
 * 分析工作流Hook返回值
 */
export interface UseIntelligentAnalysisWorkflowReturn {
  // 状态
  currentJobs: Map<string, AnalysisJob>;
  stepCards: IntelligentStepCard[];
  isAnalyzing: boolean;
  
  // 核心操作
  startAnalysis: (context: ElementSelectionContext, stepId?: string) => Promise<string>;
  cancelAnalysis: (jobId: string) => Promise<void>;
  createStepCardQuick: (context: ElementSelectionContext, lockContainer?: boolean) => Promise<string>;
  bindAnalysisResult: (stepId: string, result: AnalysisResult) => Promise<void>;
  
  // 步骤卡片操作
  updateStepCard: (stepId: string, updates: Partial<IntelligentStepCard>) => void;
  deleteStepCard: (stepId: string) => void;
  switchStrategy: (stepId: string, strategyKey: string, followSmart?: boolean) => Promise<void>;
  upgradeStep: (stepId: string) => Promise<void>;
  retryAnalysis: (stepId: string) => Promise<void>;
  
  // 工具方法
  getStepCard: (stepId: string) => IntelligentStepCard | undefined;
  getJobsBySelectionHash: (hash: SelectionHash) => AnalysisJob[];
  clearAllJobs: () => void;
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}



/**
 * 智能分析工作流管理Hook
 */
export function useIntelligentAnalysisWorkflow(): UseIntelligentAnalysisWorkflowReturn {
  // 状态管理
  const [currentJobs, setCurrentJobs] = useState<Map<string, AnalysisJob>>(new Map());
  const [stepCards, setStepCards] = useState<IntelligentStepCard[]>([]);
  
  // 事件监听器引用
  const unlistenFunctions = useRef<(() => void)[]>([]);
  
  // 计算是否正在分析
  const isAnalyzing = Array.from(currentJobs.values()).some(job => 
    job.state === 'queued' || job.state === 'running'
  );
  
  /**
   * 设置事件监听器
   */
  useEffect(() => {
    const setupEventListeners = () => {
      try {
        // 分析进度事件
        const unlistenProgress = mockAnalysisBackend.listen<AnalysisProgressEvent>('analysis:progress', (payload) => {
          const { jobId, progress, estimatedTimeLeft } = payload;
          
          setCurrentJobs(prev => {
            const updated = new Map(prev);
            const job = updated.get(jobId);
            if (job && job.state === 'running') {
              updated.set(jobId, {
                ...job,
                progress,
                estimatedTimeLeft
              });
            }
            return updated;
          });
          
          // 更新关联的步骤卡片
          setStepCards(prev => prev.map(card => 
            card.analysisJobId === jobId 
              ? { ...card, analysisProgress: progress }
              : card
          ));
        });
        
        // 分析完成事件
        const unlistenDone = mockAnalysisBackend.listen<AnalysisDoneEvent>('analysis:done', (payload) => {
          const { jobId, result } = payload;
          
          setCurrentJobs(prev => {
            const updated = new Map(prev);
            const job = updated.get(jobId);
            if (job) {
              updated.set(jobId, {
                ...job,
                state: 'completed',
                progress: 100,
                completedAt: Date.now(),
                result
              });
            }
            return updated;
          });
          
          // 处理结果回填
          handleAnalysisComplete(jobId, result);
        });
        
        // 分析错误事件
        const unlistenError = mockAnalysisBackend.listen<AnalysisErrorEvent>('analysis:error', (payload) => {
          const { jobId, error } = payload;
          
          setCurrentJobs(prev => {
            const updated = new Map(prev);
            const job = updated.get(jobId);
            if (job) {
              updated.set(jobId, {
                ...job,
                state: 'failed',
                completedAt: Date.now(),
                error
              });
            }
            return updated;
          });
          
          // 更新关联的步骤卡片
          setStepCards(prev => prev.map(card => 
            card.analysisJobId === jobId 
              ? { 
                  ...card, 
                  analysisState: 'analysis_failed',
                  analysisError: error,
                  analysisProgress: 0
                }
              : card
          ));
          
          if (error !== 'canceled') {
            message.error(`分析失败: ${error}`);
          }
        });
        
        unlistenFunctions.current = [unlistenProgress, unlistenDone, unlistenError];
      } catch (error) {
        console.error('设置事件监听器失败:', error);
      }
    };
    
    setupEventListeners();
    
    return () => {
      unlistenFunctions.current.forEach(unlisten => unlisten());
    };
  }, []);
  
  /**
   * 处理分析完成
   */
  const handleAnalysisComplete = useCallback(async (jobId: string, result: AnalysisResult) => {
    const job = currentJobs.get(jobId);
    if (!job) return;
    
    // 查找关联的步骤卡片
    const relatedStep = stepCards.find(card => 
      card.analysisJobId === jobId || 
      card.selectionHash === result.selectionHash
    );
    
    if (relatedStep) {
      try {
        await bindAnalysisResult(relatedStep.stepId, result);
      } catch (error) {
        console.error('绑定分析结果失败:', error);
      }
    }
  }, [currentJobs, stepCards]);
  
  /**
   * 启动分析
   */
  const startAnalysis = useCallback(async (
    context: ElementSelectionContext, 
    stepId?: string
  ): Promise<string> => {
    const selectionHash = calculateSelectionHash(context);
    
    // 检查是否已有相同选择的分析任务
    const existingJob = Array.from(currentJobs.values()).find(job => 
      job.selectionHash === selectionHash && 
      (job.state === 'queued' || job.state === 'running')
    );
    
    if (existingJob) {
      // 如果指定了stepId，更新作业关联
      if (stepId && !existingJob.stepId) {
        setCurrentJobs(prev => {
          const updated = new Map(prev);
          updated.set(existingJob.jobId, { ...existingJob, stepId });
          return updated;
        });
      }
      return existingJob.jobId;
    }
    
    try {
      // 调用后端分析命令
      const jobId = await mockAnalysisBackend.startAnalysis({
        snapshotId: context.snapshotId,
        elementCtxJson: JSON.stringify(context),
        stepId
      });
      
      // 创建分析作业
      const job: AnalysisJob = {
        jobId,
        selectionHash,
        stepId,
        state: 'queued',
        progress: 0,
        startedAt: Date.now()
      };
      
      setCurrentJobs(prev => new Map(prev).set(jobId, job));
      
      return jobId;
    } catch (error) {
      console.error('启动分析失败:', error);
      throw new Error(`启动分析失败: ${error}`);
    }
  }, [currentJobs]);
  
  /**
   * 取消分析
   */
  const cancelAnalysis = useCallback(async (jobId: string): Promise<void> => {
    try {
      await mockAnalysisBackend.cancelAnalysis(jobId);
      
      setCurrentJobs(prev => {
        const updated = new Map(prev);
        const job = updated.get(jobId);
        if (job) {
          updated.set(jobId, { ...job, state: 'canceled', completedAt: Date.now() });
        }
        return updated;
      });
    } catch (error) {
      console.error('取消分析失败:', error);
      throw new Error(`取消分析失败: ${error}`);
    }
  }, []);
  
  /**
   * 快速创建步骤卡片
   */
  const createStepCardQuick = useCallback(async (
    context: ElementSelectionContext,
    lockContainer: boolean = false
  ): Promise<string> => {
    const stepId = generateId();
    const selectionHash = calculateSelectionHash(context);
    
    // 使用增强的兜底策略生成器
    const fallbackStrategy = (await import('../domain/fallback-strategy-generator')).FallbackStrategyGenerator.generatePrimaryFallback(context);
    
    try {
      // 调用后端创建步骤卡片
      await mockAnalysisBackend.createStepCardQuick({
        snapshotId: context.snapshotId,
        elementCtxJson: JSON.stringify(context),
        lockContainer
      });
      
      // 创建步骤卡片 - 关键：立即可用的默认值
      const stepCard: IntelligentStepCard = {
        stepId,
        stepName: `步骤 ${stepCards.length + 1}`,
        stepType: context.elementType || 'tap',
        elementContext: context,
        selectionHash,
        analysisState: 'idle', // 初始状态：未分析但可用
        analysisProgress: 0,
        strategyMode: 'intelligent', // 默认智能模式
        smartCandidates: [],
        staticCandidates: [],
        activeStrategy: fallbackStrategy, // 立即使用兜底策略
        fallbackStrategy, // 保存兜底策略引用
        autoFollowSmart: true,
        lockContainer,
        smartThreshold: 0.82,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setStepCards(prev => [...prev, stepCard]);
      
      // 自动启动后台分析（不阻塞用户操作）
      const jobId = await startAnalysis(context, stepId);
      
      // 更新步骤卡片的分析状态
      setStepCards(prev => prev.map(card => 
        card.stepId === stepId 
          ? { 
              ...card, 
              analysisState: 'analyzing',
              analysisJobId: jobId 
            }
          : card
      ));
      
      return stepId;
    } catch (error) {
      console.error('创建步骤卡片失败:', error);
      throw new Error(`创建步骤卡片失败: ${error}`);
    }
  }, [stepCards.length, startAnalysis]);
  
  /**
   * 绑定分析结果
   */
  const bindAnalysisResult = useCallback(async (
    stepId: string, 
    result: AnalysisResult
  ): Promise<void> => {
    try {
      await mockAnalysisBackend.bindAnalysisResultToStep({
        stepId,
        resultJson: JSON.stringify(result)
      });
      
      setStepCards(prev => prev.map(card => {
        if (card.stepId !== stepId) return card;
        
        const recommendedStrategy = result.smartCandidates.find(c => c.key === result.recommendedKey);
        const shouldAutoUpgrade = card.autoFollowSmart && 
                                result.recommendedConfidence >= card.smartThreshold;
        
        return {
          ...card,
          analysisState: 'analysis_completed',
          analysisProgress: 100,
          smartCandidates: result.smartCandidates,
          staticCandidates: result.staticCandidates,
          recommendedStrategy,
          activeStrategy: shouldAutoUpgrade ? recommendedStrategy : card.activeStrategy,
          strategyMode: shouldAutoUpgrade ? 'intelligent' : card.strategyMode,
          analyzedAt: Date.now(),
          updatedAt: Date.now()
        };
      }));
      
      message.success('分析完成，策略已更新');
    } catch (error) {
      console.error('绑定分析结果失败:', error);
      throw new Error(`绑定分析结果失败: ${error}`);
    }
  }, []);
  
  /**
   * 更新步骤卡片
   */
  const updateStepCard = useCallback((stepId: string, updates: Partial<IntelligentStepCard>) => {
    setStepCards(prev => prev.map(card => 
      card.stepId === stepId 
        ? { ...card, ...updates, updatedAt: Date.now() }
        : card
    ));
  }, []);
  
  /**
   * 删除步骤卡片
   */
  const deleteStepCard = useCallback((stepId: string) => {
    // 取消关联的分析作业
    const card = stepCards.find(c => c.stepId === stepId);
    if (card?.analysisJobId) {
      cancelAnalysis(card.analysisJobId).catch(console.error);
    }
    
    setStepCards(prev => prev.filter(card => card.stepId !== stepId));
  }, [stepCards, cancelAnalysis]);
  
  /**
   * 切换策略
   */
  const switchStrategy = useCallback(async (
    stepId: string, 
    strategyKey: string, 
    followSmart: boolean = false
  ): Promise<void> => {
    try {
      await mockAnalysisBackend.switchActiveStrategy({
        stepId,
        strategyKey,
        followSmart
      });
      
      const card = stepCards.find(c => c.stepId === stepId);
      if (!card) return;
      
      const allCandidates = [...card.smartCandidates, ...card.staticCandidates];
      const selectedStrategy = allCandidates.find(s => s.key === strategyKey);
      
      if (selectedStrategy) {
        updateStepCard(stepId, {
          activeStrategy: selectedStrategy,
          strategyMode: selectedStrategy.variant.includes('smart') ? 'smart_variant' : 'static_user',
          autoFollowSmart: followSmart
        });
      }
    } catch (error) {
      console.error('切换策略失败:', error);
      throw new Error(`切换策略失败: ${error}`);
    }
  }, [stepCards, updateStepCard]);
  
  /**
   * 升级步骤
   */
  const upgradeStep = useCallback(async (stepId: string): Promise<void> => {
    const card = stepCards.find(c => c.stepId === stepId);
    if (!card?.recommendedStrategy) return;
    
    await switchStrategy(stepId, card.recommendedStrategy.key, true);
    message.success('已升级到推荐策略');
  }, [stepCards, switchStrategy]);
  
  /**
   * 重试分析
   */
  const retryAnalysis = useCallback(async (stepId: string): Promise<void> => {
    const card = stepCards.find(c => c.stepId === stepId);
    if (!card) return;
    
    // 取消旧的分析作业
    if (card.analysisJobId) {
      await cancelAnalysis(card.analysisJobId);
    }
    
    // 启动新的分析
    const jobId = await startAnalysis(card.elementContext, stepId);
    
    updateStepCard(stepId, {
      analysisState: 'analyzing',
      analysisJobId: jobId,
      analysisProgress: 0,
      analysisError: undefined
    });
  }, [stepCards, cancelAnalysis, startAnalysis, updateStepCard]);
  
  /**
   * 获取步骤卡片
   */
  const getStepCard = useCallback((stepId: string): IntelligentStepCard | undefined => {
    return stepCards.find(card => card.stepId === stepId);
  }, [stepCards]);
  
  /**
   * 根据选择哈希获取作业
   */
  const getJobsBySelectionHash = useCallback((hash: SelectionHash): AnalysisJob[] => {
    return Array.from(currentJobs.values()).filter(job => job.selectionHash === hash);
  }, [currentJobs]);
  
  /**
   * 清空所有作业
   */
  const clearAllJobs = useCallback(() => {
    // 取消所有活跃作业
    currentJobs.forEach(job => {
      if (job.state === 'queued' || job.state === 'running') {
        cancelAnalysis(job.jobId).catch(console.error);
      }
    });
    
    setCurrentJobs(new Map());
    setStepCards([]);
  }, [currentJobs, cancelAnalysis]);
  
  return {
    // 状态
    currentJobs,
    stepCards,
    isAnalyzing,
    
    // 核心操作
    startAnalysis,
    cancelAnalysis,
    createStepCardQuick,
    bindAnalysisResult,
    
    // 步骤卡片操作
    updateStepCard,
    deleteStepCard,
    switchStrategy,
    upgradeStep,
    retryAnalysis,
    
    // 工具方法
    getStepCard,
    getJobsBySelectionHash,
    clearAllJobs
  };
}