// src/components/strategy-selector/scoring/shared-scoring.ts
// module: strategy-selector | layer: scoring | role: 共享评分逻辑
// summary: 结构匹配评分的公共实现，消除代码重复

import { message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import type { StepCard } from '../../../store/stepcards';
import { loadXmlWithFallback, validateXmlContent } from '../utils/xml-cache-loader';

/**
 * 结构匹配评分结果
 */
export interface StructureScoringResult {
  stepId: string;
  confidence: number;
  strategy: string;
  metrics: {
    source: string;
    mode: string;
    timestamp: number;
  };
}

/**
 * 后端推荐响应类型
 */
interface RecommendResponse {
  outcomes: Array<{
    mode: string;
    conf: number;
    explain: string;
    passed_gate: boolean;
  }>;
}

/**
 * 评分模式映射
 */
const MODE_MAP = {
  step1: {
    backendMode: 'CardSubtree',
    candidateKey: 'card_subtree_scoring',
    displayName: '卡片子树',
  },
  step2: {
    backendMode: 'LeafContext',
    candidateKey: 'leaf_context_scoring',
    displayName: '叶子上下文',
  },
} as const;

/**
 * 评分配置
 */
export interface ScoringConfig {
  /** 评分步骤 */
  steps: Array<'step1' | 'step2'>;
  /** 步骤卡片 */
  card: StepCard;
  /** 评分存储函数 */
  setFinalScores: (scores: StructureScoringResult[]) => void;
  /** 获取已有评分的函数（用于缓存检查） */
  getStepConfidence?: (candidateKey: string) => number | null;
  /** 是否强制刷新（忽略缓存） */
  forceRefresh?: boolean;
  /** 评分来源标识 */
  source: 'smart_auto_chain' | 'smart_single' | 'static_strategy';
  /** 上下文名称（用于日志） */
  contextName: string;
}

/**
 * 🎯 通用结构匹配评分函数
 * 
 * 此函数是所有结构匹配评分的统一实现，消除代码重复
 * 
 * @param config 评分配置
 * @returns 是否成功
 * 
 * @example
 * // 智能·自动链模式
 * await executeSharedStructuralScoring({
 *   steps: ['step1', 'step2'],
 *   card,
 *   setFinalScores,
 *   getStepConfidence,
 *   forceRefresh,
 *   source: 'smart_auto_chain',
 *   contextName: '智能·自动链',
 * });
 * 
 * @example
 * // 智能·单步模式
 * await executeSharedStructuralScoring({
 *   steps: ['step1'],  // 只评分Step1
 *   card,
 *   setFinalScores,
 *   getStepConfidence,
 *   forceRefresh,
 *   source: 'smart_single',
 *   contextName: '智能单步-卡片子树',
 * });
 */
export async function executeSharedStructuralScoring(
  config: ScoringConfig
): Promise<boolean> {
  const {
    steps,
    card,
    setFinalScores,
    getStepConfidence,
    forceRefresh = false,
    source,
    contextName,
  } = config;

  console.log(`🎯 [${contextName}] 触发结构匹配评分`, {
    steps,
    forceRefresh,
    source,
  });

  // 🔍 缓存检查：避免重复计算（除非强制刷新）
  if (getStepConfidence && !forceRefresh) {
    const cacheResults = steps.map(step => {
      const { candidateKey, displayName } = MODE_MAP[step];
      const score = getStepConfidence(candidateKey);
      return { step, candidateKey, displayName, score };
    });

    const allCached = cacheResults.every(r => r.score !== null && r.score > 0);

    if (allCached) {
      const cacheInfo = cacheResults
        .map(r => `${r.displayName}: ${(r.score! * 100).toFixed(1)}%`)
        .join(', ');
      
      console.log(`✓ [${contextName}] 已有评分缓存，跳过重复计算:`, cacheInfo);
      message.info('已有评分结果，无需重复计算（可点击"强制刷新"重新评分）');
      return true;
    }
  }

  // 强制刷新提示
  if (forceRefresh) {
    console.log(`🔄 [${contextName}] 强制刷新模式，忽略缓存重新评分`);
    message.info('🔄 强制刷新：重新评分中...');
  }

  // 检查必要数据
  if (!card.elementContext?.xpath) {
    console.warn(`⚠️ [${contextName}] 缺少xpath，跳过评分`);
    message.warning('步骤卡片数据不完整，跳过评分');
    return false;
  }

  // 🐛 调试：打印卡片完整数据
  console.log(`🔍 [${contextName}] 卡片数据检查:`, {
    cardId: card.id,
    hasElementContext: !!card.elementContext,
    elementContextKeys: card.elementContext ? Object.keys(card.elementContext) : [],
    xpath: card.elementContext?.xpath,
    hasXmlSnapshot: !!card.xmlSnapshot,
    xmlSnapshotKeys: card.xmlSnapshot ? Object.keys(card.xmlSnapshot) : [],
    xmlCacheId: card.xmlSnapshot?.xmlCacheId,
    hasXmlContent: !!card.xmlSnapshot?.xmlContent,
  });

  // 加载XML缓存
  const xmlResult = await loadXmlWithFallback(card, contextName);
  
  if (!xmlResult.success || !xmlResult.xmlContent) {
    console.warn(`⚠️ [${contextName}] XML缓存丢失`);
    message.info('XML缓存已失效，将使用动态分析');
    return false;
  }

  // 验证XML完整性
  if (!validateXmlContent(xmlResult.xmlContent, contextName)) {
    message.warning('XML数据可能不完整，评分结果仅供参考');
  }

  const results: StructureScoringResult[] = [];

  // 🎯 调用后端评分接口
  try {
    console.log(`🔄 [${contextName}] 调用后端评分接口`, {
      xpath: card.elementContext.xpath,
      indexPath: card.staticLocator?.indexPath,
      requestedSteps: steps,
    });
    
    const recommendation = await invoke<RecommendResponse>('recommend_structure_mode_v2', {
      input: {
        indexPath: card.staticLocator?.indexPath || null,  // 🎯 优先使用 index_path
        absoluteXpath: card.elementContext.xpath,          // 🔄 回退使用 xpath
        xmlSnapshot: xmlResult.xmlContent,
        containerXpath: null,
      },
    });

    console.log(`✅ [${contextName}] 后端返回 ${recommendation.outcomes.length} 个评分结果`);

    // 提取请求的步骤评分
    for (const step of steps) {
      const { backendMode, candidateKey, displayName } = MODE_MAP[step];
      const outcome = recommendation.outcomes.find(o => o.mode === backendMode);

      if (outcome && outcome.conf >= 0 && outcome.conf <= 1) {
        results.push({
          stepId: candidateKey,
          confidence: outcome.conf,
          strategy: `${displayName}评分（${contextName}）`,
          metrics: {
            source,
            mode: backendMode,
            timestamp: Date.now(),
          }
        });
        
        console.log(`✅ [${contextName}] ${displayName}评分完成:`, (outcome.conf * 100).toFixed(1) + '%');
      } else if (!outcome) {
        console.warn(`⚠️ [${contextName}] 未找到${displayName}评分结果`);
      }
    }

  } catch (error) {
    console.error(`❌ [${contextName}] 评分失败:`, error);
    message.error(`评分失败: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }

  // 存储评分结果
  if (results.length > 0) {
    console.log(`💾 [${contextName}] 准备存储评分:`, results.map(r => ({
      stepId: r.stepId,
      confidence: `${(r.confidence * 100).toFixed(1)}%`,
      strategy: r.strategy
    })));
    
    setFinalScores(results);
    
    console.log(`✅ [${contextName}] 评分已存储到 analysis-state-store`);
    message.success(`${contextName}评分完成（${results.length}/${steps.length}）`);
    return true;
  }

  return false;
}
