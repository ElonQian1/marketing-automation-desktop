// src/stores/step-score-store.ts
// module: store | layer: store | role: 步骤评分共享缓存
// summary: 统一存储智能单步和自动链的评分结果，避免重复计算

import React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ConfidenceEvidence } from '../modules/universal-ui/types/intelligent-analysis-types';

/**
 * 步骤评分数据
 */
export interface StepScore {
  /** 缓存键：screenSig + elementUid 或 stepId */
  key: string;
  /** 推荐策略 */
  recommended: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 证据详情 */
  evidence?: ConfidenceEvidence;
  /** 来源：单步分析或自动链 */
  origin: 'single' | 'chain';
  /** 时间戳 */
  timestamp: number;
  /** 关联的作业ID */
  jobId?: string;
  /** 关联的卡片ID */
  cardId?: string;
  /** 元素UID */
  elementUid?: string;
}

/**
 * 步骤评分存储接口
 */
export interface StepScoreStore {
  /** 评分缓存映射 */
  scores: Record<string, StepScore>;
  
  /** 插入或更新评分 */
  upsert: (score: StepScore) => void;
  
  /** 根据键获取评分 */
  get: (key: string) => StepScore | undefined;
  
  /** 根据cardId获取评分 */
  getByCardId: (cardId: string) => StepScore | undefined;
  
  /** 根据elementUid获取评分 */
  getByElementUid: (elementUid: string) => StepScore | undefined;
  
  /** 根据jobId获取评分 */
  getByJobId: (jobId: string) => StepScore | undefined;
  
  /** 生成缓存键 */
  generateKey: (elementUid: string, screenSignature?: string) => string;
  
  /** 清理过期评分 */
  cleanExpired: (maxAge?: number) => void;
  
  /** 获取所有评分 */
  getAll: () => StepScore[];
  
  /** 清空所有评分 */
  clear: () => void;
}

/**
 * 生成标准化的缓存键
 */
function generateStandardKey(elementUid: string, screenSignature?: string): string {
  if (screenSignature) {
    return `${screenSignature}:${elementUid}`;
  }
  return `element:${elementUid}`;
}

/**
 * 步骤评分存储
 */
export const useStepScoreStore = create<StepScoreStore>()(
  immer((set, get) => ({
    scores: {},
    
    upsert: (score) => {
      set((state) => {
        state.scores[score.key] = {
          ...score,
          timestamp: Date.now()
        };
        
        console.log('📊 [StepScoreStore] 更新评分缓存', {
          key: score.key,
          confidence: Math.round(score.confidence * 100) + '%',
          origin: score.origin,
          recommended: score.recommended
        });
      });
    },
    
    get: (key) => {
      return get().scores[key];
    },
    
    getByCardId: (cardId) => {
      const scores = get().scores;
      return Object.values(scores).find(score => score.cardId === cardId);
    },
    
    getByElementUid: (elementUid) => {
      const scores = get().scores;
      return Object.values(scores).find(score => score.elementUid === elementUid);
    },
    
    getByJobId: (jobId) => {
      const scores = get().scores;
      return Object.values(scores).find(score => score.jobId === jobId);
    },
    
    generateKey: generateStandardKey,
    
    cleanExpired: (maxAge = 5 * 60 * 1000) => { // 默认5分钟过期
      const now = Date.now();
      set((state) => {
        const expired: string[] = [];
        
        Object.entries(state.scores).forEach(([key, score]) => {
          if (now - score.timestamp > maxAge) {
            expired.push(key);
            delete state.scores[key];
          }
        });
        
        if (expired.length > 0) {
          console.log('🧹 [StepScoreStore] 清理过期评分', { count: expired.length });
        }
      });
    },
    
    getAll: () => {
      return Object.values(get().scores).sort((a, b) => b.timestamp - a.timestamp);
    },
    
    clear: () => {
      set((state) => {
        state.scores = {};
        console.log('🗑️ [StepScoreStore] 清空所有评分缓存');
      });
    }
  }))
);

/**
 * 自动清理过期评分的Hook
 */
export function useStepScoreCleanup(intervalMs = 60000) { // 每分钟清理一次
  const cleanExpired = useStepScoreStore(state => state.cleanExpired);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      cleanExpired();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [cleanExpired, intervalMs]);
}