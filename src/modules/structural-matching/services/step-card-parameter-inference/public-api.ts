// src/modules/structural-matching/services/step-card-parameter-inference/public-api.ts
// module: structural-matching | layer: services | role: 参数推理公共API
// summary: 提供给外部模块使用的参数推理接口

import { RuntimeParameterInferenceService } from './runtime-parameter-inference-service';
import type { InferenceResult, ParameterInferenceOptions } from './types';
import type { StepCard } from '../../../../store/stepcards';

/**
 * 全局参数推理服务实例
 */
const globalInferenceService = new RuntimeParameterInferenceService();

/**
 * 为步骤卡片推导结构匹配参数
 * @param stepCard 步骤卡片数据
 * @param options 推导选项
 * @returns 推导结果
 */
export async function inferParametersForStepCard(
  stepCard: StepCard,
  options: ParameterInferenceOptions = { mode: 'balanced', containerStrategy: 'auto' }
): Promise<InferenceResult> {
  try {
    // 确保步骤卡片有必要的数据
    if (!stepCard.elementContext?.xpath || !stepCard.xmlSnapshot?.xmlContent) {
      return {
        success: false,
        error: '步骤卡片缺少必要的XPath或XML快照数据',
        plan: undefined,
        stats: {
          analysisTimeMs: 0,
          elementsAnalyzed: 0,
          featuresExtracted: 0
        }
      };
    }

    // 构造推理服务需要的参数
    const inferenceData = {
      id: stepCard.id,
      staticXPath: stepCard.elementContext.xpath,
      xmlSnapshot: stepCard.xmlSnapshot.xmlContent,
      existingPlan: stepCard.structuralMatchPlan
    };

    return await globalInferenceService.inferFromStepCard(inferenceData, options);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [参数推理API] 推理失败:`, errorMsg);
    
    return {
      success: false,
      error: errorMsg,
      plan: undefined,
      stats: {
        analysisTimeMs: 0,
        elementsAnalyzed: 0,
        featuresExtracted: 0
      }
    };
  }
}

/**
 * 检查步骤卡片是否需要参数推理
 * @param stepCard 步骤卡片数据
 * @returns 是否需要推理
 */
export function stepCardNeedsInference(stepCard: StepCard): boolean {
  try {
    // 检查基本条件
    if (!stepCard.elementContext?.xpath || !stepCard.xmlSnapshot?.xmlContent) {
      return false; // 缺少必要数据，无法推理
    }

    // 已有完整的结构匹配计划，无需重新推理
    if (stepCard.structuralMatchPlan && 
        stepCard.structuralMatchPlan.sourceXPath && 
        stepCard.structuralMatchPlan.containerGate?.containerXPath) {
      return false;
    }

    // 对于步骤卡片，我们假设需要推理（因为step_type不在StepCard类型中）
    // 实际应用中可以通过其他方式判断是否需要推理
    
    // 需要推理
    return true;
  } catch (error) {
    console.error(`❌ [参数推理API] 检查步骤卡片是否需要推理时出错:`, error);
    return false; // 出错时默认不推理
  }
}

/**
 * 获取推理服务实例（用于高级用法）
 */
export function getInferenceServiceInstance(): RuntimeParameterInferenceService {
  return globalInferenceService;
}