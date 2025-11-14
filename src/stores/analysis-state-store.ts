// src/stores/analysis-state-store.ts
// module: store | layer: store | role: 分析状态管理
// summary: 统一管理"逐步评分表 + 智能自动链"两类产物的状态存储

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { normalizeTo01, isValidScore } from '../utils/score-utils';
import { formatPercent } from '../utils/confidence-format';

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

  // === 🆕 评分质量检查模块（从旧API迁移） ===
  /** 
   * 检查评分是否达到可用标准
   * 
   * 质量判定规则:
   * 1. 优先: 后端闸门通过 (metrics.passedGate === true)
   * 2. 兜底: 置信度 >= 0.3 (参考旧API的最低阈值)
   * 
   * @param stepId 步骤ID
   * @returns true=可用于策略选择, false=不建议使用
   * 
   * @example
   * const isUsable = store.isStepScoreUsable('card_subtree_scoring');
   * if (!isUsable) {
   *   showWarning('评分质量偏低，建议手动选择');
   * }
   */
  isStepScoreUsable: (stepId: string) => boolean;

  /**
   * 生成评分推荐摘要文案（从旧API迁移）
   * 
   * 根据通过闸门的步骤数量和置信度生成用户友好的说明文字
   * 
   * @param stepIds 要分析的步骤ID列表
   * @returns 推荐摘要文案
   * 
   * @example
   * const summary = store.generateScoreSummary(['card_subtree_scoring', 'leaf_context_scoring']);
   * // => "2个策略通过闸门，优选 卡片子树 (85%)"
   */
  generateScoreSummary: (stepIds: string[]) => string;
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
    },

    // 🆕 检查评分是否达到可用标准（从旧API迁移的质量检查逻辑）
    isStepScoreUsable: (stepId: string) => {
      const state = get();
      const score = state.stepScores[stepId];
      
      if (!score) {
        console.debug('🔍 [评分质量检查] 步骤未找到', { stepId });
        return false;
      }

      // 规则1: 优先检查后端闸门（如果metrics中有passedGate字段）
      const passedGate = score.metrics?.passedGate;
      if (typeof passedGate === 'boolean' && passedGate === true) {
        console.debug('✅ [评分质量检查] 通过闸门', { 
          stepId: stepId.slice(-12),
          confidence: Math.round(score.confidence * 100) + '%'
        });
        return true;
      }

      // 规则2: 兜底阈值 0.3（参考旧API的最低可用标准）
      const MINIMUM_USABLE_THRESHOLD = 0.3;
      const isUsable = score.confidence >= MINIMUM_USABLE_THRESHOLD;
      
      if (isUsable) {
        console.debug('⚠️ [评分质量检查] 未通过闸门但达到兜底阈值', {
          stepId: stepId.slice(-12),
          confidence: Math.round(score.confidence * 100) + '%',
          threshold: MINIMUM_USABLE_THRESHOLD
        });
      } else {
        console.warn('❌ [评分质量检查] 评分质量偏低', {
          stepId: stepId.slice(-12),
          confidence: Math.round(score.confidence * 100) + '%',
          threshold: MINIMUM_USABLE_THRESHOLD
        });
      }

      return isUsable;
    },

    // 🆕 生成评分推荐摘要（从旧API迁移的文案生成逻辑）
    generateScoreSummary: (stepIds: string[]) => {
      const state = get();
      
      if (stepIds.length === 0) {
        return '暂无可用评分';
      }

      // 统计通过闸门的步骤数
      const passedSteps = stepIds
        .map(id => state.stepScores[id])
        .filter(score => {
          if (!score) return false;
          const passedGate = score.metrics?.passedGate;
          return typeof passedGate === 'boolean' && passedGate === true;
        });
      
      const passedCount = passedSteps.length;

      // 找到最高置信度的步骤
      const allScores = stepIds
        .map(id => state.stepScores[id])
        .filter(score => score && score.confidence > 0);
      
      if (allScores.length === 0) {
        return '所有评分均无效';
      }

      const topScore = allScores.reduce((max, score) => 
        score.confidence > max.confidence ? score : max
      );

      const confidenceText = formatPercent(topScore.confidence);
      const strategyText = topScore.strategy || topScore.stepId;

      // 根据通过闸门数量生成不同文案
      if (passedCount === 0) {
        return `所有策略均未通过闸门，采用兜底策略推荐 ${strategyText}`;
      } else if (passedCount === 1) {
        return `推荐使用 ${strategyText}，置信度 ${confidenceText}`;
      } else {
        return `${passedCount}个策略通过闸门，优选 ${strategyText} (${confidenceText})`;
      }
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