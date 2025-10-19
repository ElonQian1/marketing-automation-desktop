// src/application/analysis/wire-global-events.ts
// module: analysis | layer: application | role: global-event-wire
// summary: 全局常驻的分析事件监听器，独立于UI组件生命周期

import { listen } from '@tauri-apps/api/event';
import { useStepCardStore } from '../../store/stepcards';
import { EVENTS } from '../../shared/constants/events';

let globalWired = false;
let globalUnlistenFunctions: (() => void)[] = [];

/**
 * 全局注册分析事件监听器
 * 注意：此函数应在应用启动时调用一次，不要在组件内调用
 */
export async function wireAnalysisEventsGlobally(): Promise<void> {
  if (globalWired) {
    console.log('🔗 [GlobalWire] 事件监听器已经全局注册，跳过重复注册');
    return;
  }

  console.log('🌐 [GlobalWire] 开始注册全局分析事件监听器');

  try {
    // 监听分析进度事件
    const unlistenProgress = await listen<{
      job_id: string;
      progress: number;
      current_step?: string;
      estimated_time_left?: number;
    }>(EVENTS.ANALYSIS_PROGRESS, (event) => {
      const { job_id, progress, current_step } = event.payload;
      console.debug('[EVT] progress', job_id.slice(-8), progress, current_step);

      const store = useStepCardStore.getState();
      const cardId = store.findByJob(job_id);
      
      if (cardId) {
        store.updateStatus(cardId, 'analyzing');
        store.updateProgress(cardId, progress);
        console.debug('[ROUTE] progress → card', cardId.slice(-8), '← job', job_id.slice(-8), 'progress:', progress);

        // 🔄 兜底机制：如果进度到100%，也触发完成逻辑
        if (progress >= 100) {
          const card = store.getCard(cardId);
          console.debug('[ROUTE] 100% → card', cardId.slice(-8), '→ stepId', card?.elementUid?.slice(-6));
          
          // 为避免重复，先检查卡片是否已经是ready状态
          if (card && card.status !== 'ready') {
            const fallbackStrategy = {
              primary: 'progress_100_fallback',
              backups: ['text_contains', 'xpath_relative'],
              score: 0.9,
              candidates: [{
                key: 'progress_100_fallback',
                name: '进度100%兜底策略',
                confidence: 0.9,
                xpath: card.elementContext?.xpath || '//unknown'
              }]
            };
            
            store.fillStrategyAndReady(cardId, fallbackStrategy);
            console.debug('[ROUTE] 100% strategy applied', { 
              cardId: cardId.slice(-8), 
              strategy: fallbackStrategy.primary,
              elementUid: card.elementUid?.slice(-6)
            });
          }
        }
      } else {
        console.warn('⚠️ [GlobalWire] progress事件找不到卡片', { 
          job_id: job_id.slice(-8), 
          progress,
          allJobIds: Object.values(store.cards).map(c => c.jobId?.slice(-8)).filter(Boolean)
        });
      }
    });

    // 监听分析完成事件
    const unlistenCompleted = await listen<{
      job_id: string;
      selection_hash: string;
      result: {
        recommended_key: string;
        smart_candidates?: Array<{
          key: string;
          name: string;
          confidence: number;
          xpath?: string;
          description?: string;
        }>;
      };
    }>(EVENTS.ANALYSIS_DONE, (event) => {
      const { job_id, result } = event.payload;
      const { recommended_key, smart_candidates } = result;
      console.debug('[EVT] ✅ completed', job_id.slice(-8), 'recommended:', recommended_key);
      
      const store = useStepCardStore.getState();
      
      // 通过job_id查找目标卡片
      const targetCardId = store.findByJob(job_id);
      
      if (!targetCardId) {
        const allCards = store.getAllCards();
        console.warn('❌ [ROUTE] completed 找不到卡片', { 
          job_id: job_id.slice(-8), 
          availableJobs: allCards.map(c => ({ 
            cardId: c.id.slice(-8), 
            jobId: c.jobId?.slice(-8), 
            status: c.status 
          }))
        });
        return;
      }
      
      const card = store.getCard(targetCardId);
      console.debug('[ROUTE] completed → card', targetCardId.slice(-8), '→ elementUid', card?.elementUid?.slice(-6));

      // 构建策略对象
      const strategy = {
        primary: recommended_key || 'completed_strategy',
        backups: smart_candidates?.slice(1).map(c => c.key) || [],
        score: smart_candidates?.[0]?.confidence || 0.85,
        candidates: smart_candidates?.map(c => ({
          key: c.key,
          name: c.name,
          confidence: c.confidence,
          xpath: c.xpath || '',
          description: c.description
        })) || [{
          key: recommended_key || 'completed_strategy',
          name: '分析完成策略',
          confidence: 0.85,
          xpath: card?.elementContext?.xpath || ''
        }]
      };

      store.fillStrategyAndReady(targetCardId, strategy);
      console.debug('[ROUTE] completed strategy applied', { 
        cardId: targetCardId.slice(-8), 
        strategy: strategy.primary,
        confidence: strategy.score,
        elementUid: card?.elementUid?.slice(-6)
      });
    });

    // 监听分析错误事件
    const unlistenError = await listen<{
      job_id: string;
      selection_hash: string;
      error: string;
    }>(EVENTS.ANALYSIS_ERROR, (event) => {
      const { job_id, error } = event.payload;
      console.error('❌ [GlobalWire] 收到全局错误事件', { job_id, error });

      const store = useStepCardStore.getState();
      const cardId = store.findByJob(job_id);
      
      if (cardId) {
        store.setError(cardId, `分析失败: ${error}`);
        console.log('🚫 [GlobalWire] 更新卡片错误状态', { cardId, job_id, error });
      }
    });

    // 保存清理函数（但通常不会使用，除非应用关闭）
    globalUnlistenFunctions = [unlistenProgress, unlistenCompleted, unlistenError];
    globalWired = true;

    console.log('✅ [GlobalWire] 全局分析事件监听器注册完成', { 
      listenersCount: globalUnlistenFunctions.length 
    });

    // 🔄 启动超时检查机制：每5秒检查一次analyzing状态的卡片
    setInterval(() => {
      const store = useStepCardStore.getState();
      const allCards = store.getAllCards();
      const analyzingCards = allCards.filter(c => c.status === 'analyzing');
      
      analyzingCards.forEach(card => {
        const analyzeStartTime = card.updatedAt || card.createdAt;
        const timeoutThreshold = 15000; // 15秒超时
        
        if (Date.now() - analyzeStartTime > timeoutThreshold) {
          console.warn('⏰ [GlobalWire] 分析超时，应用兜底策略', {
            cardId: card.id.slice(-8),
            jobId: card.jobId?.slice(-8),
            timeoutMs: Date.now() - analyzeStartTime
          });
          
          // 应用兜底策略
          const timeoutStrategy = {
            primary: 'timeout_fallback',
            backups: ['text_contains', 'xpath_absolute'],
            score: 0.7,
            candidates: [{
              key: 'timeout_fallback',
              name: '超时兜底策略',
              confidence: 0.7,
              xpath: card.elementContext?.xpath || '//timeout-fallback'
            }]
          };
          
          store.fillStrategyAndReady(card.id, timeoutStrategy);
        }
      });
    }, 5000); // 每5秒检查一次

  } catch (error) {
    console.error('💥 [GlobalWire] 注册全局事件监听器失败', error);
    throw error;
  }
}

/**
 * 清理全局事件监听器（通常只在应用关闭时调用）
 */
export function unwireAnalysisEventsGlobally(): void {
  if (globalWired) {
    globalUnlistenFunctions.forEach(unlisten => {
      try {
        unlisten();
      } catch (err) {
        console.warn('⚠️ [GlobalWire] 清理监听器时出错', err);
      }
    });
    
    globalUnlistenFunctions = [];
    globalWired = false;
    console.log('🧹 [GlobalWire] 全局事件监听器已清理');
  }
}

/**
 * 检查全局监听器状态
 */
export function getGlobalWireStatus(): { wired: boolean; listenersCount: number } {
  return {
    wired: globalWired,
    listenersCount: globalUnlistenFunctions.length
  };
}