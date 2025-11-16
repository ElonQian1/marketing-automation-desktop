// src/components/strategy-selector/scoring/smart-single-scoring.ts
// module: strategy-selector | layer: scoring | role: 智能·单步评分逻辑
// summary: Step1-2 结构匹配评分（智能·单步模式）

import type { StepCard } from '../../../store/stepcards';
import type { SmartStep } from '../../../types/strategySelector';
import { executeSharedStructuralScoring, type StructureScoringResult } from './shared-scoring';

/**
 * 步骤参数更新回调
 */
export type StepParametersUpdater = (stepId: string, params: Record<string, unknown>) => void;

/**
 * 执行智能·单步的 Step1-2 评分
 * 
 * @param step 步骤ID (step1 或 step2)
 * @param candidateKey 候选键
 * @param card 步骤卡片
 * @param stepId 步骤ID（用于存储）
 * @param setFinalScores 评分存储函数
 * @param onUpdateStepParameters 步骤参数更新回调（可选）
 * @param getStepConfidence 获取已有评分的函数（可选，用于缓存检查）
 * @param forceRefresh 是否强制刷新（忽略缓存）
 * @returns 是否成功
 */
export async function executeSmartSingleScoring(
  step: SmartStep,
  candidateKey: string,
  card: StepCard,
  stepId: string,
  setFinalScores: (scores: StructureScoringResult[]) => void,
  onUpdateStepParameters?: StepParametersUpdater,
  getStepConfidence?: (candidateKey: string) => number | null,
  forceRefresh?: boolean
): Promise<boolean> {
  const modeName = step === 'step1' ? '卡片子树' : '叶子上下文';
  
  // 只处理 Step1 和 Step2（结构匹配评分）
  if (step !== 'step1' && step !== 'step2') {
    console.warn(`⚠️ [智能单步] ${step} 不支持结构匹配评分，跳过`);
    return false;
  }
  
  // 调用共享评分函数
  const success = await executeSharedStructuralScoring({
    steps: [step],
    card,
    setFinalScores,
    getStepConfidence,
    forceRefresh,
    source: 'smart_single',
    contextName: `智能单步-${modeName}`,
  });

  // TODO: 如果需要应用推荐配置到步骤，需要扩展 shared-scoring.ts 来支持这个功能
  // 目前仅返回评分成功状态
  if (success && onUpdateStepParameters && stepId) {
    console.log(`⚠️ [智能单步] 自动应用推荐配置功能待迁移到共享函数`);
  }

  return success;
}
