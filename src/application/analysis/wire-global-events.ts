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
      console.log('📊 [GlobalWire] 收到全局进度事件', { job_id, progress, current_step });

      const store = useStepCardStore.getState();
      const cardId = store.findByJob(job_id);
      
      if (cardId) {
        store.updateStatus(cardId, 'analyzing');
        store.updateProgress(cardId, progress);
        console.log('🎯 [GlobalWire] 更新卡片进度', { cardId, job_id, progress });

        // 🔄 兜底机制：如果进度到100%，也触发完成逻辑
        if (progress >= 100) {
          console.log('🎉 [GlobalWire] 进度达到100%，触发兜底完成逻辑', { cardId, job_id });
          
          // 为避免重复，先检查卡片是否已经是ready状态
          const card = store.getCard(cardId);
          if (card && card.status !== 'ready') {
            const fallbackStrategy = {
              primary: 'fallback_completed',
              backups: ['text_contains', 'xpath_relative'],
              score: 0.8,
              candidates: [{
                key: 'fallback_completed',
                name: '兜底完成策略',
                confidence: 0.8,
                xpath: card.elementContext?.xpath || '//unknown'
              }]
            };
            
            store.fillStrategyAndReady(cardId, fallbackStrategy);
            console.log('✅ [GlobalWire] 兜底完成策略已应用', { cardId, strategy: fallbackStrategy.primary });
          }
        }
      } else {
        console.warn('⚠️ [GlobalWire] 收到进度事件但未找到对应卡片', { job_id, progress });
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
      console.log('✅ [GlobalWire] 收到全局完成事件', { job_id, recommended_key, smart_candidates });

      const store = useStepCardStore.getState();
      
      // 通过job_id查找目标卡片
      const targetCardId = store.findByJob(job_id);
      
      if (!targetCardId) {
        console.error('❌ [GlobalWire] 未找到对应的卡片', { job_id });
        return;
      }
      
      console.log('🎯 [GlobalWire] 通过job_id找到目标卡片', { job_id, targetCardId });

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
          name: '推荐策略',
          confidence: 0.85,
          xpath: ''
        }]
      };

      store.fillStrategyAndReady(targetCardId, strategy);
      console.log('🎉 [GlobalWire] 卡片已完成并填充策略', { 
        cardId: targetCardId, 
        job_id, 
        strategy: strategy.primary,
        score: strategy.score 
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