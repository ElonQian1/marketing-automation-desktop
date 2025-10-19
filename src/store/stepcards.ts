// src/store/stepcards.ts
// module: store | layer: store | role: 步骤卡片状态管理
// summary: 统一的步骤卡片状态管理，支持jobId精确路由和置信度展示

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ConfidenceEvidence, SingleStepScore, StepCardMeta } from '../modules/universal-ui/types/intelligent-analysis-types';

export type StepCardStatus = 'draft' | 'analyzing' | 'ready' | 'failed' | 'blocked';

export interface StepCard {
  id: string;
  jobId?: string;
  elementUid: string;
  elementContext?: {
    xpath?: string;
    text?: string;
    bounds?: string;
    resourceId?: string;
    className?: string;
  };
  status: StepCardStatus;
  strategy?: {
    primary: string;
    backups: string[];
    score: number;
    candidates?: Array<{
      key: string;
      name: string;
      confidence: number;
      xpath: string;
      description?: string;
    }>;
  };
  progress?: number;
  error?: string;
  /** 整体置信度 (0-1) */
  confidence?: number;
  /** 置信度证据分项 */
  evidence?: ConfidenceEvidence;
  /** 扩展元数据 */
  meta?: StepCardMeta;
  createdAt: number;
  updatedAt: number;
}

export interface StepCardStore {
  cards: Record<string, StepCard>;
  
  // 创建操作
  create: (data: {
    elementUid: string;
    elementContext?: StepCard['elementContext'];
    status?: StepCardStatus;
    jobId?: string;
  }) => string;
  
  // 查找操作
  findByJob: (jobId: string) => string | undefined;
  findByElement: (elementUid: string) => string | undefined;
  getCard: (cardId: string) => StepCard | undefined;
  getAllCards: () => StepCard[];
  has: (cardId: string) => boolean;
  
  // 更新操作
  attachJob: (cardId: string, jobId: string) => void;
  updateStatus: (cardId: string, status: StepCardStatus) => void;
  updateProgress: (cardId: string, progress: number) => void;
  fillStrategyAndReady: (cardId: string, strategy: StepCard['strategy']) => void;
  setError: (cardId: string, error: string) => void;
  
  // 置信度管理
  setConfidence: (cardId: string, confidence: number, evidence?: ConfidenceEvidence) => void;
  setSingleStepConfidence: (cardId: string, score: SingleStepScore) => void;
  getStepIdByCard: (cardId: string) => string | undefined;
  
  // 删除操作
  remove: (cardId: string) => void;
  clear: () => void;
}

function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useStepCardStore = create<StepCardStore>()(
  immer((set, get) => ({
    cards: {},
    
    create: (data) => {
      const cardId = generateId();
      const now = Date.now();
      
      set((state) => {
        state.cards[cardId] = {
          id: cardId,
          elementUid: data.elementUid,
          elementContext: data.elementContext,
          status: data.status ?? 'draft',
          jobId: data.jobId,
          createdAt: now,
          updatedAt: now,
        };
      });
      
      console.log('📝 [StepCardStore] 创建步骤卡片', { cardId, data });
      return cardId;
    },
    
    findByJob: (jobId) => {
      const cards = get().cards;
      return Object.values(cards).find(c => c.jobId === jobId)?.id;
    },
    
    findByElement: (elementUid) => {
      const cards = get().cards;
      return Object.values(cards).find(c => c.elementUid === elementUid)?.id;
    },
    
    getCard: (cardId) => {
      return get().cards[cardId];
    },
    
    getAllCards: () => {
      return Object.values(get().cards).sort((a, b) => a.createdAt - b.createdAt);
    },
    
    has: (cardId: string) => {
      return cardId in get().cards;
    },
    
    attachJob: (cardId, jobId) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.jobId = jobId;
          card.updatedAt = Date.now();
          console.log('🔗 [StepCardStore] 绑定Job', { cardId, jobId });
        }
      });
    },
    
    updateStatus: (cardId, status) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.status = status;
          card.updatedAt = Date.now();
          console.log('🔄 [StepCardStore] 更新状态', { cardId, status });
        }
      });
    },
    
    updateProgress: (cardId, progress) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.progress = progress;
          card.updatedAt = Date.now();
        }
      });
    },
    
    fillStrategyAndReady: (cardId, strategy) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.strategy = strategy;
          card.status = 'ready'; // ← 关键：状态切换
          card.progress = 100;
          card.updatedAt = Date.now();
          console.log('✅ [StepCardStore] 填充策略并就绪', { cardId, strategy });
        }
      });
    },
    
    setError: (cardId, error) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.error = error;
          card.status = 'failed';
          card.updatedAt = Date.now();
          console.log('❌ [StepCardStore] 设置错误', { cardId, error });
        }
      });
    },
    
    setConfidence: (cardId, confidence, evidence) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.confidence = confidence;
          card.evidence = evidence;
          card.updatedAt = Date.now();
          console.log('📊 [StepCardStore] 设置置信度', { cardId, confidence, evidence });
        }
      });
    },

    setSingleStepConfidence: (cardId, score) => {
      set((state) => {
        const card = state.cards[cardId];
        if (!card) return;
        
        card.meta = { ...(card.meta ?? {}), singleStepScore: score };
        card.status = 'ready';                     // 从 analyzing → ready
        card.updatedAt = Date.now();
        console.log('🎯 [StepCardStore] 设置单步置信度', { cardId, score });
      });
    },

    getStepIdByCard: (cardId) => {
      const card = get().cards[cardId];
      return card?.elementUid; // 使用 elementUid 作为 stepId
    },
    
    remove: (cardId) => {
      set((state) => {
        delete state.cards[cardId];
        console.log('🗑️ [StepCardStore] 删除卡片', { cardId });
      });
    },
    
    clear: () => {
      set((state) => {
        state.cards = {};
        console.log('🧹 [StepCardStore] 清空所有卡片');
      });
    },
  }))
);