// src/components/strategy-selector/scoring/smart-auto-scoring.ts
// module: strategy-selector | layer: scoring | role: 智能·自动链评分逻辑
// summary: Step1-2 结构匹配评分（智能·自动链模式）

import type { StepCard } from '../../../store/stepcards';
import { executeSharedStructuralScoring, type StructureScoringResult } from './shared-scoring';

/**
 * 执行智能·自动链的 Step1-2 评分
 * 
 * @param card 步骤卡片
 * @param setFinalScores 评分存储函数
 * @param getStepConfidence 获取已有评分的函数（可选，用于缓存检查）
 * @param forceRefresh 是否强制刷新（忽略缓存）
 * @returns 是否成功
 */
export async function executeSmartAutoScoring(
  card: StepCard,
  setFinalScores: (scores: StructureScoringResult[]) => void,
  getStepConfidence?: (candidateKey: string) => number | null,
  forceRefresh?: boolean
): Promise<boolean> {
  return executeSharedStructuralScoring({
    steps: ['step1', 'step2'],
    card,
    setFinalScores,
    getStepConfidence,
    forceRefresh,
    source: 'smart_auto_chain',
    contextName: '智能·自动链',
  });
}
