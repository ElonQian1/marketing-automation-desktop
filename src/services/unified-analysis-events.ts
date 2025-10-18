// src/services/unified-analysis-events.ts
// module: services | layer: services | role: 统一分析事件监听路由
// summary: 统一监听后端分析事件，并根据jobId路由到对应步骤卡片

import { listen } from '@tauri-apps/api/event';
import { useStepCardStore } from '../store/stepcards';
import { EVENTS } from '../shared/constants/events';

export interface ProgressPayload {
  jobId: string;
  progress: number;
  status?: string;
  current_step?: string;
}

export interface CompletedPayload {
  jobId: string;
  result: {
    strategy: string;
    confidence: number;
    candidates: Array<{
      key: string;
      name: string;
      confidence: number;
      xpath: string;
      description?: string;
    }>;
    score: number;
    backup_strategies?: string[];
  };
}

export interface FailedPayload {
  jobId: string;
  error: string;
}

/**
 * 统一的分析事件监听器
 * 
 * 核心设计：
 * 1. 全局只有一个实例监听后端事件
 * 2. 接收到事件后，通过 jobId 路由到具体的步骤卡片
 * 3. 步骤卡片通过 Store 进行状态同步
 */
class UnifiedAnalysisEventService {
  private isInitialized = false;
  private unlistenProgress?: () => void;
  private unlistenCompleted?: () => void;
  private unlistenFailed?: () => void;

  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 [UnifiedAnalysisEvents] 初始化统一事件监听');

    // 监听进度事件
    this.unlistenProgress = await listen<ProgressPayload>(
      EVENTS.ANALYSIS_PROGRESS,
      (event) => {
        const { jobId, progress } = event.payload;
        console.log('📈 [UnifiedAnalysisEvents] 收到进度事件', { jobId, progress });
        
        const store = useStepCardStore.getState();
        const cardId = store.findByJob(jobId);
        
        if (cardId) {
          store.updateProgress(cardId, progress);
          if (progress === 0) {
            // 开始分析
            store.updateStatus(cardId, 'analyzing');
          }
        } else {
          console.warn('❓ [UnifiedAnalysisEvents] 找不到对应的步骤卡片', { jobId });
        }
      }
    );

    // 监听完成事件
    this.unlistenCompleted = await listen<CompletedPayload>(
      EVENTS.ANALYSIS_DONE,
      (event) => {
        const { jobId, result } = event.payload;
        console.log('✅ [UnifiedAnalysisEvents] 收到完成事件', { jobId, result });
        
        const store = useStepCardStore.getState();
        const cardId = store.findByJob(jobId);
        
        if (cardId) {
          // 填充策略数据并设置为就绪状态
          store.fillStrategyAndReady(cardId, {
            primary: result.strategy,
            backups: result.backup_strategies || [],
            score: result.score || result.confidence,
            candidates: result.candidates,
          });
        } else {
          console.warn('❓ [UnifiedAnalysisEvents] 找不到对应的步骤卡片', { jobId });
        }
      }
    );

    // 监听失败事件 (可选)
    this.unlistenFailed = await listen<FailedPayload>(
      'analysis-failed', // 假设有这个事件
      (event) => {
        const { jobId, error } = event.payload;
        console.log('❌ [UnifiedAnalysisEvents] 收到失败事件', { jobId, error });
        
        const store = useStepCardStore.getState();
        const cardId = store.findByJob(jobId);
        
        if (cardId) {
          store.setError(cardId, error);
        }
      }
    );

    this.isInitialized = true;
  }

  async cleanup() {
    if (!this.isInitialized) return;

    console.log('🧹 [UnifiedAnalysisEvents] 清理事件监听');
    
    this.unlistenProgress?.();
    this.unlistenCompleted?.();
    this.unlistenFailed?.();
    
    this.isInitialized = false;
  }

  isReady() {
    return this.isInitialized;
  }
}

// 全局单例
export const unifiedAnalysisEvents = new UnifiedAnalysisEventService();

/**
 * Hook：确保事件监听器已初始化
 */
export function useUnifiedAnalysisEvents() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const initializeEvents = async () => {
      try {
        await unifiedAnalysisEvents.initialize();
        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('❌ [useUnifiedAnalysisEvents] 初始化失败', error);
      }
    };

    if (!unifiedAnalysisEvents.isReady()) {
      initializeEvents();
    } else {
      setIsReady(true);
    }

    // 清理时不需要关闭监听器，因为是全局共享的
    return () => {
      mounted = false;
    };
  }, []);

  return { isReady };
}

import React from 'react';