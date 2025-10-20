// src/application/analysis/wire-global-events.ts
// module: analysis | layer: application | role: global-event-wire
// summary: 全局常驻的分析事件监听器，独立于UI组件生命周期

import { listen } from '@tauri-apps/api/event';
import { useStepCardStore } from '../../store/stepcards';
import { useStepScoreStore } from '../../stores/step-score-store';
import { useAnalysisStateStore } from '../../stores/analysis-state-store';
import { EVENTS } from '../../shared/constants/events';
import type { ConfidenceEvidence } from '../../modules/universal-ui/types/intelligent-analysis-types';

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
      /** 🆕 部分分数（按用户指导） */
      partial_scores?: Array<{
        step_id: string;
        strategy: string;
        confidence: number;
        metrics?: Record<string, number | string>;
      }>;
    }>(EVENTS.ANALYSIS_PROGRESS, (event) => {
      const { job_id, progress, current_step, partial_scores } = event.payload;
      console.debug('[EVT] progress', job_id.slice(-8), progress, current_step, 'partialScores:', partial_scores?.length || 0);

      const store = useStepCardStore.getState();
      const cardId = store.findByJob(job_id);
      
      if (cardId) {
        store.updateStatus(cardId, 'analyzing');
        store.updateProgress(cardId, progress);
        console.debug('[ROUTE] progress → card', cardId.slice(-8), '← job', job_id.slice(-8), 'progress:', progress);

        // 🆕 处理部分分数（按用户最佳实践）
        if (partial_scores && partial_scores.length > 0) {
          const analysisStore = useAnalysisStateStore.getState();
          
          // 确保分析任务已开始
          if (analysisStore.currentJobId !== job_id) {
            analysisStore.startAnalysis(job_id);
          }
          
          // 设置部分分数
          const normalizedScores = partial_scores.map(ps => ({
            stepId: ps.step_id,
            confidence: ps.confidence,
            strategy: ps.strategy
          }));
          
          analysisStore.setPartialScores(normalizedScores);
          
          console.debug('[ROUTE] 部分分数已更新', {
            jobId: job_id.slice(-8),
            cardId: cardId.slice(-8),
            scoresCount: normalizedScores.length
          });
        }

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
      /** 整体置信度 (0-1) - 现在由后端直接提供 */
      confidence: number;
      /** 置信度证据分项 - 现在由后端直接提供 */
      evidence: {
        model: number;
        locator: number;
        visibility: number;
        uniqueness: number;
        proximity: number;
        screen: number;
        history: number;
        penalty_margin: number;
      };
      /** 分析来源：'single' 或 'chain' */
      origin: string;
      /** 可选的元素ID和卡片ID (前端路由用) */
      element_uid?: string;
      card_id?: string;
      /** 🆕 最终分数（按用户指导的关键字段） */
      final_scores?: Array<{
        step_id: string;
        strategy: string;
        confidence: number;
        metrics?: Record<string, number | string>;
        xpath?: string;
        description?: string;
      }>;
      /** 🆕 智能自动链（按用户指导） */
      smart_chain?: {
        ordered_steps: string[];
        recommended: string;
        threshold: number;
        reasons?: string[];
        total_confidence?: number;
      };
    }>(EVENTS.ANALYSIS_DONE, (event) => {
      const { job_id, result, confidence, evidence, origin, final_scores, smart_chain } = event.payload;
      const { recommended_key, smart_candidates } = result;
      console.debug('[EVT] ✅ completed', job_id.slice(-8), 'recommended:', recommended_key, 'confidence:', confidence, 'origin:', origin, 'finalScores:', final_scores?.length || 0);
      
      const store = useStepCardStore.getState();
      const analysisStore = useAnalysisStateStore.getState();
      
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

      // 🆕 处理最终分数（核心修复按用户指导）
      if (final_scores && final_scores.length > 0) {
        console.log('🎯 [ROUTE] 处理最终分数', {
          jobId: job_id.slice(-8),
          cardId: targetCardId.slice(-8),
          finalScoresCount: final_scores.length
        });
        
        // 设置最终分数到分析状态存储
        const normalizedFinalScores = final_scores.map(fs => ({
          stepId: fs.step_id,
          confidence: fs.confidence,
          strategy: fs.strategy,
          metrics: fs.metrics
        }));
        
        analysisStore.setFinalScores(normalizedFinalScores);
        
        // 同时写入老的StepScoreStore（向后兼容）
        const scoreStore = useStepScoreStore.getState();
        const stepId = card?.elementUid || targetCardId;
        
        final_scores.forEach(fs => {
          scoreStore.setCandidateScore(stepId, fs.step_id, fs.confidence);
        });
        
        console.debug('[ROUTE] 最终分数已写入', {
          analysisStore: '✅',
          stepScoreStore: '✅',
          scoresCount: final_scores.length
        });
      }
      
      // 🆕 处理智能自动链
      if (smart_chain) {
        console.log('🔗 [ROUTE] 处理智能自动链', {
          jobId: job_id.slice(-8),
          recommended: smart_chain.recommended,
          stepsCount: smart_chain.ordered_steps.length
        });
        
        analysisStore.setSmartChain({
          orderedSteps: smart_chain.ordered_steps,
          recommended: smart_chain.recommended,
          threshold: smart_chain.threshold,
          reasons: smart_chain.reasons,
          totalConfidence: smart_chain.total_confidence
        });
      }
      
      // 完成分析任务
      analysisStore.completeAnalysis();

      // 构建策略对象（向后兼容现有卡片系统）
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

      // 填充策略并更新状态
      store.fillStrategyAndReady(targetCardId, strategy);
      
      // 🆕 专门处理单步置信度（按朋友建议的优化方案）
      // 兼容多种置信度格式：0~1 或 0~100
      let normalizedConfidence = confidence;
      if (typeof confidence === 'number') {
        // 如果 >1 说明是百分比格式，需要转换为 0~1
        normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
      }
      
      const singleStepScore = {
        confidence: normalizedConfidence,
        source: origin === 'single' ? 'auto_chain' as const : 'model' as const,
        evidence: {
          locator: evidence.locator,
          visibility: evidence.visibility,
          uniqueness: evidence.uniqueness,
          proximity: evidence.proximity
        },
        at: new Date().toISOString(),
      };
      
      // 调用专门的setSingleStepConfidence方法
      const cardExists = !!useStepCardStore.getState().cards[targetCardId];
      console.log('🔧 [Wire Events] 调用 setSingleStepConfidence', {
        targetCardId: targetCardId.slice(-8),
        rawConfidence: confidence,
        normalizedConfidence,
        confidence: singleStepScore.confidence,
        source: singleStepScore.source,
        cardExists
      });
      store.setSingleStepConfidence(targetCardId, singleStepScore);
      
      // 仍然保留原有的setConfidence（向后兼容）
      const finalEvidence: ConfidenceEvidence = {
        model: evidence.model,
        locator: evidence.locator,
        visibility: evidence.visibility,
        device: Math.max(0.1, 1.0 - evidence.penalty_margin), // 转换边界惩罚为设备兼容性
      };
      store.setConfidence(targetCardId, confidence, finalEvidence);
      
      console.debug('[ROUTE] single step confidence applied', { 
        cardId: targetCardId.slice(-8), 
        singleStepScore,
        origin,
        backendEvidence: evidence
      });
      
      // 🆕 写入共享缓存（专家建议的核心） - 候选项维度修复
      const scoreStore = useStepScoreStore.getState();
      const stepId = card?.elementUid || targetCardId;
      
      // 🔧 修复：同时写候选分和全局分（按朋友建议）
      console.log('📊 [Wire Events] 写入候选项评分', {
        stepId: stepId.slice(-8),
        smartCandidates: smart_candidates?.length || 0,
        candidateKeys: smart_candidates?.map(c => c.key) || [],
        recommendedKey: recommended_key,
        globalConfidence: normalizedConfidence
      });
      
      // 1) 写入每个候选项的分数
      smart_candidates?.forEach(candidate => {
        if (typeof candidate.confidence === 'number') {
          console.log('🔍 [Wire Events] 候选项原始数据', {
            candidateKey: candidate.key,
            rawConfidence: candidate.confidence,
            confidenceType: typeof candidate.confidence,
            isNormalRange: candidate.confidence >= 0 && candidate.confidence <= 1,
            isPercentRange: candidate.confidence >= 0 && candidate.confidence <= 100,
          });
          scoreStore.setCandidateScore(stepId, candidate.key, candidate.confidence);
          
          // 🔍 立刻读回验证是否写入成功
          const readBack = scoreStore.getCandidateScore(stepId, candidate.key);
          console.log('✅ [Wire Events] 候选分写入验证', {
            stepId: stepId.slice(-8),
            candidateKey: candidate.key,
            written: candidate.confidence,
            readBack,
            success: readBack === candidate.confidence
          });
        }
      });
      
      // 2) 写入全局分数（job-level置信度）
      scoreStore.setGlobalScore(stepId, normalizedConfidence);
      
      // 🔄 原有缓存逻辑（向后兼容）
      const cacheKey = scoreStore.generateKey(card?.elementUid || 'unknown');
      scoreStore.upsert({
        key: cacheKey,
        recommended: recommended_key,
        confidence,
        evidence: finalEvidence,
        origin: origin as 'single' | 'chain', // 现在由后端直接提供
        jobId: job_id,
        cardId: targetCardId,
        elementUid: card?.elementUid,
        timestamp: Date.now()
      });
      
      console.debug('[ROUTE] completed strategy applied', { 
        cardId: targetCardId.slice(-8), 
        strategy: strategy.primary,
        confidence,
        elementUid: card?.elementUid?.slice(-6),
        cacheKey
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