// src/stores/analysis-state-store.ts
// module: store | layer: store | role: 分析状态管理
// summary: 统一管理"逐步评分表 + 智能自动链"两类产物的状态存储

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { normalizeTo01, isValidScore } from '../utils/score-utils';

/**
 * 单步评分数据
 */
export interface StepScore {
  stepId: string;
  strategy: string;
  confidence: number; // 0..1
  metrics?: Record<string, number | string>;
  status: 'pending' | 'partial' | 'final';
  xpath?: string;
  description?: string;
}

/**
 * 智能自动链数据
 */
export interface SmartChain {
  orderedSteps: string[]; // stepId 排序（含回退顺序）
  recommended: string; // 首选 stepId
  threshold: number; // 例如 0.6
  reasons?: string[]; // 排序/回退简述
  totalConfidence?: number; // 整体链的置信度
}

/**
 * 分析状态存储接口
 */
export interface AnalysisStateStore {
  // === 两类产物 ===
  /** A. 逐步评分表 - 每个智能单步各自的分数与细项指标 */
  stepScores: Record<string, StepScore>; // stepId -> StepScore
  
  /** B. 智能自动链 - 系统推荐策略链 */
  smartChain: SmartChain | null;
  
  // === 状态管理 ===
  /** 当前分析任务ID */
  currentJobId: string | null;
  
  /** 分析状态 */
  analysisStatus: 'idle' | 'running' | 'completed' | 'error';
  
  /** 错误信息 */
  error: string | null;
  
  // === 数据操作 ===
  /** 设置部分分数（进度事件） */
  setPartialScores: (scores: Array<{ stepId: string; confidence: number; strategy?: string }>) => void;
  
  /** 设置最终分数（完成事件） */
  setFinalScores: (scores: Array<{ stepId: string; confidence: number; strategy?: string; metrics?: Record<string, any> }>) => void;
  
  /** 设置智能自动链 */
  setSmartChain: (chain: SmartChain) => void;
  
  /** 获取步骤置信度（优先最终分，否则临时分） */
  getStepConfidence: (stepId: string) => number | null;
  
  /** 获取步骤详情 */
  getStepScore: (stepId: string) => StepScore | undefined;
  
  /** 获取所有有效分数的步骤 */
  getAllValidSteps: () => StepScore[];
  
  /** 开始新的分析任务 */
  startAnalysis: (jobId: string) => void;
  
  /** 完成分析任务 */
  completeAnalysis: () => void;
  
  /** 设置错误状态 */
  setError: (error: string) => void;
  
  /** 重置状态 */
  reset: () => void;
  
  // === 调试和监控 ===
  /** 获取状态摘要 */
  getStateSummary: () => {
    totalSteps: number;
    completedSteps: number;
    pendingSteps: number;
    hasChain: boolean;
    analysisStatus: string;
  };
}

/**
 * 分析状态存储实现
 */
export const useAnalysisStateStore = create<AnalysisStateStore>()(
  immer((set, get) => ({
    // 初始状态
    stepScores: {},
    smartChain: null,
    currentJobId: null,
    analysisStatus: 'idle',
    error: null,
    
    // 设置部分分数（进度事件）
    setPartialScores: (scores) => {
      set((state) => {
        console.debug('📈 [AnalysisState] 设置部分分数', { 
          count: scores.length, 
          jobId: state.currentJobId?.slice(-8) 
        });
        
        scores.forEach(({ stepId, confidence, strategy }) => {
          const normalized = normalizeTo01(confidence);
          if (normalized === undefined) {
            console.warn('🚨 [AnalysisState] 无效的部分置信度', { stepId, confidence });
            return;
          }
          
          // 保持现有数据，只更新confidence和status
          const existing = state.stepScores[stepId];
          state.stepScores[stepId] = {
            stepId,
            strategy: strategy || existing?.strategy || 'unknown',
            confidence: normalized,
            metrics: existing?.metrics,
            status: 'partial',
            xpath: existing?.xpath,
            description: existing?.description
          };
          
          console.debug('📊 [AnalysisState] 更新部分分数', {
            stepId: stepId.slice(-8),
            confidence: Math.round(normalized * 100) + '%',
            status: 'partial'
          });
        });
      });
    },
    
    // 设置最终分数（完成事件）
    setFinalScores: (scores) => {
      set((state) => {
        console.debug('🎯 [AnalysisState] 设置最终分数', { 
          count: scores.length, 
          jobId: state.currentJobId?.slice(-8) 
        });
        
        scores.forEach(({ stepId, confidence, strategy, metrics }) => {
          const normalized = normalizeTo01(confidence);
          if (normalized === undefined) {
            console.warn('🚨 [AnalysisState] 无效的最终置信度', { stepId, confidence });
            return;
          }
          
          // 覆盖为最终数据
          state.stepScores[stepId] = {
            stepId,
            strategy: strategy || state.stepScores[stepId]?.strategy || 'unknown',
            confidence: normalized,
            metrics: metrics || state.stepScores[stepId]?.metrics,
            status: 'final',
            xpath: state.stepScores[stepId]?.xpath,
            description: state.stepScores[stepId]?.description
          };
          
          console.debug('🏁 [AnalysisState] 更新最终分数', {
            stepId: stepId.slice(-8),
            confidence: Math.round(normalized * 100) + '%',
            status: 'final'
          });
        });
        
        // 检查是否所有步骤都已完成
        const allSteps = Object.values(state.stepScores);
        const finalSteps = allSteps.filter(s => s.status === 'final');
        if (finalSteps.length === allSteps.length && allSteps.length > 0) {
          state.analysisStatus = 'completed';
          console.log('✅ [AnalysisState] 所有步骤分析完成', { 
            totalSteps: allSteps.length,
            finalSteps: finalSteps.length
          });
        }
      });
    },
    
    // 设置智能自动链
    setSmartChain: (chain) => {
      set((state) => {
        state.smartChain = chain;
        console.debug('🔗 [AnalysisState] 设置智能自动链', {
          recommended: chain.recommended,
          stepsCount: chain.orderedSteps.length,
          threshold: chain.threshold
        });
      });
    },
    
    // 获取步骤置信度
    getStepConfidence: (stepId) => {
      const score = get().stepScores[stepId];
      if (!score) return null;
      
      // 优先最终分，否则部分分
      return isValidScore(score.confidence) ? score.confidence : null;
    },
    
    // 获取步骤详情
    getStepScore: (stepId) => {
      return get().stepScores[stepId];
    },
    
    // 获取所有有效分数的步骤
    getAllValidSteps: () => {
      return Object.values(get().stepScores)
        .filter(score => isValidScore(score.confidence))
        .sort((a, b) => b.confidence - a.confidence); // 按置信度降序
    },
    
    // 开始新的分析任务
    startAnalysis: (jobId) => {
      set((state) => {
        state.currentJobId = jobId;
        state.analysisStatus = 'running';
        state.error = null;
        state.stepScores = {}; // 清空之前的数据
        state.smartChain = null;
        
        console.log('🚀 [AnalysisState] 开始新的分析任务', { 
          jobId: jobId.slice(-8) 
        });
      });
    },
    
    // 完成分析任务
    completeAnalysis: () => {
      set((state) => {
        state.analysisStatus = 'completed';
        console.log('🏆 [AnalysisState] 分析任务完成', { 
          jobId: state.currentJobId?.slice(-8),
          totalSteps: Object.keys(state.stepScores).length
        });
      });
    },
    
    // 设置错误状态
    setError: (error) => {
      set((state) => {
        state.analysisStatus = 'error';
        state.error = error;
        console.error('❌ [AnalysisState] 分析错误', { 
          error,
          jobId: state.currentJobId?.slice(-8) 
        });
      });
    },
    
    // 重置状态
    reset: () => {
      set((state) => {
        state.stepScores = {};
        state.smartChain = null;
        state.currentJobId = null;
        state.analysisStatus = 'idle';
        state.error = null;
        
        console.log('🔄 [AnalysisState] 状态已重置');
      });
    },
    
    // 获取状态摘要
    getStateSummary: () => {
      const state = get();
      const allSteps = Object.values(state.stepScores);
      
      return {
        totalSteps: allSteps.length,
        completedSteps: allSteps.filter(s => s.status === 'final').length,
        pendingSteps: allSteps.filter(s => s.status === 'pending').length,
        hasChain: !!state.smartChain,
        analysisStatus: state.analysisStatus
      };
    }
  }))
);

/**
 * 便捷的状态查询Hook
 */
export const useAnalysisState = {
  /** 获取特定步骤的置信度 */
  stepConfidence: (stepId: string) => 
    useAnalysisStateStore(state => state.getStepConfidence(stepId)),
  
  /** 获取智能自动链 */
  smartChain: () => 
    useAnalysisStateStore(state => state.smartChain),
  
  /** 获取分析状态 */
  status: () => 
    useAnalysisStateStore(state => state.analysisStatus),
  
  /** 获取所有有效步骤 */
  validSteps: () => 
    useAnalysisStateStore(state => state.getAllValidSteps()),
  
  /** 获取状态摘要 */
  summary: () => 
    useAnalysisStateStore(state => state.getStateSummary())
};