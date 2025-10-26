// src/hooks/useUnifiedSmartAnalysis.ts
// module: hooks | layer: hooks | role: ✅ 统一智能分析Hook（V3智能策略分析）
// summary: 基于V3智能自动链的统一智能分析Hook，使用Step 0-6策略分析替代简化系统
//
// 🎯 【重要】此Hook已升级到 V3 智能策略分析系统：
// ✅ 正确路径：execute_chain_test_v3 → V3智能自动链 → Step 0-6策略分析
// ❌ 旧路径：start_intelligent_analysis → V2简化分析（已弃用）
//
// 🔄 修复历史：
// - 2025-10-26: 修正执行路径，确保步骤卡片生成使用完整的智能策略分析
// - 解决选择"已关注"按钮时错误识别为"关注"的问题
// - 确保空文本元素通过智能策略而不是坐标兜底

import React from 'react';
import { useStepCardStore } from '../store/stepcards';
import { useUnifiedAnalysisEvents } from '../services/unified-analysis-events';
import { invoke } from '@tauri-apps/api/core';
import type { UIElement } from '../api/universalUIAPI';

export interface UseUnifiedSmartAnalysisOptions {
  mockElement?: UIElement;
  autoStart?: boolean;
}

export interface UseUnifiedSmartAnalysisReturn {
  // 快速创建和分析
  createAndAnalyze: (elementData: {
    uid: string;
    xpath?: string;
    text?: string;
    bounds?: string;
    resourceId?: string;
    className?: string;
  }) => Promise<string>; // 返回 cardId
  
  // 状态查询
  isAnalyzing: (cardId: string) => boolean;
  getProgress: (cardId: string) => number;
  getStatus: (cardId: string) => string;
  hasStrategy: (cardId: string) => boolean;
  
  // 操作
  retry: (cardId: string) => Promise<void>;
  remove: (cardId: string) => void;
  
  // 调试信息
  debug: {
    eventsReady: boolean;
    totalCards: number;
  };
}

/**
 * 统一智能分析Hook
 * 
 * 核心设计原则：
 * 1. 创建步骤卡片时立即绑定 jobId （A：强 jobId 绑定）
 * 2. 统一事件路由，精确分发到对应卡片 （B：统一事件消费）
 * 3. 状态机：draft → analyzing → ready/failed （C：步骤卡片状态机）
 * 4. 一个Hook管理所有分析任务
 */
export function useUnifiedSmartAnalysis(options: UseUnifiedSmartAnalysisOptions = {}): UseUnifiedSmartAnalysisReturn {
  const { 
    create, 
    attachJob, 
    updateStatus, 
    getCard, 
    getAllCards, 
    remove, 
    findByElement 
  } = useStepCardStore();
  
  const { isReady: eventsReady } = useUnifiedAnalysisEvents();

  /**
   * 核心方法：创建步骤卡片并立即启动分析
   * 
   * 这是解决问题的关键：
   * 1. 创建卡片
   * 2. 立即调用后端分析
   * 3. 获得 jobId 后立即绑定
   * 4. 后续事件通过 jobId 精确路由
   */
  const createAndAnalyze = React.useCallback(async (elementData: {
    uid: string;
    xpath?: string;
    text?: string;
    bounds?: string;
    resourceId?: string;
    className?: string;
  }): Promise<string> => {
    console.log('🚀 [UnifiedSmartAnalysis] 创建并分析', elementData);

    // 检查是否已存在相同元素的卡片
    let cardId = findByElement(elementData.uid);
    
    if (!cardId) {
      // 1. 创建步骤卡片（draft 状态）
      cardId = create({
        elementUid: elementData.uid,
        elementContext: {
          xpath: elementData.xpath,
          text: elementData.text,
          bounds: elementData.bounds,
          resourceId: elementData.resourceId,
          className: elementData.className,
        },
        status: 'draft'
      });
      console.log('📝 [UnifiedSmartAnalysis] 创建新卡片', { cardId, elementData });
    } else {
      console.log('♻️ [UnifiedSmartAnalysis] 复用现有卡片', { cardId });
    }

    try {
      // 2. 立即切换到分析状态
      updateStatus(cardId, 'analyzing');

      // 3. 调用后端分析接口
      // 🎯 【修正】使用 V3 智能自动链进行 Step 0-6 策略分析  
      // ✅ 正确路径：execute_chain_test_v3 → 完整智能策略分析
      // ❌ 旧路径：start_intelligent_analysis → 绕过策略分析
      
      // 构建V3分析配置
      const analysisConfig = {
        element_context: {
          snapshot_id: cardId,
          element_path: elementData.xpath || '',
          element_text: elementData.text,
          element_bounds: elementData.bounds,
          element_type: elementData.className,
          key_attributes: {
            'resource-id': elementData.resourceId || '',
            'class': elementData.className || '',
            'text': elementData.text || ''
          }
        },
        step_id: cardId,
        lock_container: false,
        enable_smart_candidates: true,
        enable_static_candidates: true
      };

      const jobId = await invoke<string>('execute_chain_test_v3', {
        analysisId: `unified_analysis_${cardId}`,
        deviceId: elementData.uid,
        chainId: 'unified_smart_analysis',
        steps: [{
          step_id: cardId,
          action: 'analyze',
          params: analysisConfig
        }],
        threshold: 0.5, // 较低阈值获取更多策略
        mode: 'sequential',
        dryrun: true, // 只分析不执行
        enableFallback: true,
        timeoutMs: 15000
      });

      console.log('✅ [UnifiedSmartAnalysis] 后端分析已启动', { cardId, jobId });

      // 4. 关键：立即绑定 jobId（这样后续事件就能找到对应卡片）
      attachJob(cardId, jobId);

      return cardId;

    } catch (error) {
      console.error('❌ [UnifiedSmartAnalysis] 分析启动失败', error);
      updateStatus(cardId, 'failed');
      throw error;
    }
  }, [create, findByElement, updateStatus, attachJob]);

  // 状态查询方法
  const isAnalyzing = React.useCallback((cardId: string): boolean => {
    const card = getCard(cardId);
    return card?.status === 'analyzing';
  }, [getCard]);

  const getProgress = React.useCallback((cardId: string): number => {
    const card = getCard(cardId);
    return card?.progress || 0;
  }, [getCard]);

  const getStatus = React.useCallback((cardId: string): string => {
    const card = getCard(cardId);
    return card?.status || 'unknown';
  }, [getCard]);

  const hasStrategy = React.useCallback((cardId: string): boolean => {
    const card = getCard(cardId);
    return !!(card?.strategy);
  }, [getCard]);

  // 重试分析
  const retry = React.useCallback(async (cardId: string): Promise<void> => {
    const card = getCard(cardId);
    if (!card?.elementContext) {
      throw new Error('卡片信息不完整，无法重试');
    }

    const elementData = {
      uid: card.elementUid,
      xpath: card.elementContext.xpath,
      text: card.elementContext.text,
      bounds: card.elementContext.bounds,
      resourceId: card.elementContext.resourceId,
      className: card.elementContext.className,
    };

    // 复用创建和分析逻辑
    await createAndAnalyze(elementData);
  }, [getCard, createAndAnalyze]);

  // 删除卡片
  const removeCard = React.useCallback((cardId: string) => {
    console.log('🗑️ [UnifiedSmartAnalysis] 删除卡片', { cardId });
    remove(cardId);
  }, [remove]);

  // 调试信息
  const debug = React.useMemo(() => ({
    eventsReady,
    totalCards: getAllCards().length,
  }), [eventsReady, getAllCards]);

  return {
    createAndAnalyze,
    isAnalyzing,
    getProgress,
    getStatus,
    hasStrategy,
    retry,
    remove: removeCard,
    debug,
  };
}