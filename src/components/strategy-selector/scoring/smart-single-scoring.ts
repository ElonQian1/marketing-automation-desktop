// src/components/strategy-selector/scoring/smart-single-scoring.ts
// module: strategy-selector | layer: scoring | role: 智能·单步评分逻辑
// summary: Step1-2 结构匹配评分（智能·单步模式）

import { message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import type { StepCard } from '../../../store/stepcards';
import type { SmartStep } from '../../../types/strategySelector';
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
 * 后端推荐完整响应类型
 */
interface RecommendFullResponse {
  recommended: string;
  outcomes: Array<{
    mode: string;
    conf: number;
    explain: string;
    passed_gate: boolean;
  }>;
  step_plan_mode: string;
  plan_suggest: Record<string, unknown>;
  config_suggest: Record<string, unknown>;
  intent_suggest: Record<string, unknown>;
  confidence_level: string;
  recommendation_reason: string;
}

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
 * @returns 是否成功
 */
export async function executeSmartSingleScoring(
  step: SmartStep,
  candidateKey: string,
  card: StepCard,
  stepId: string,
  setFinalScores: (scores: StructureScoringResult[]) => void,
  onUpdateStepParameters?: StepParametersUpdater,
  getStepConfidence?: (candidateKey: string) => number | null
): Promise<boolean> {
  const context = '智能单步';
  const modeName = step === 'step1' ? '卡片子树' : '叶子上下文';
  
  console.log(`🎯 [${context}] 触发${modeName}评分`);

  // 🔍 缓存检查：避免重复计算
  if (getStepConfidence) {
    const existingScore = getStepConfidence(candidateKey);
    if (existingScore !== null && existingScore > 0) {
      console.log(`✓ [${context}] 已有${modeName}评分缓存:`, `${(existingScore * 100).toFixed(1)}%`);
      message.info(`已有${modeName}评分结果（${Math.round(existingScore * 100)}%），无需重复计算`);
      return true;
    }
  }

  // 检查必要数据
  if (!card.elementContext?.xpath) {
    message.error('步骤卡片数据不完整，请重新分析页面并选择元素');
    return false;
  }

  console.log(`📦 [${context}] 使用步骤卡片快照:`, {
    xpath: card.elementContext.xpath,
    xmlContentLength: card.xmlSnapshot?.xmlContent?.length,
    xmlCacheId: card.xmlSnapshot?.xmlCacheId,
  });

  // 加载XML缓存
  const xmlResult = await loadXmlWithFallback(card, context);
  
  if (!xmlResult.success || !xmlResult.xmlContent) {
    message.error(xmlResult.error || 'XML缓存已失效');
    return false;
  }

  // 验证XML完整性
  if (!validateXmlContent(xmlResult.xmlContent, context)) {
    message.warning('XML数据可能不完整，评分结果仅供参考');
  }

  try {
    // 调用推荐命令
    console.log(`🔄 [${context}] 调用后端评分接口:`, {
      xpath: card.elementContext.xpath,
      xmlLength: xmlResult.xmlContent.length,
      targetMode: step === 'step1' ? 'CardSubtree' : 'LeafContext',
    });

    const recommendation = await invoke<RecommendFullResponse>('recommend_structure_mode_v2', {
      input: {
        absoluteXpath: card.elementContext.xpath,
        xmlSnapshot: xmlResult.xmlContent,
        containerXpath: null,
      },
    });

    console.log(`✅ [${context}] 评分完成:`, recommendation);

    // 根据选择的步骤过滤对应的评分结果
    const targetMode = step === 'step1' ? 'CardSubtree' : 'LeafContext';
    const targetOutcome = recommendation.outcomes.find(o => o.mode === targetMode);

    if (!targetOutcome) {
      message.error(`未找到${targetMode}评分结果`);
      return false;
    }

    // 数据验证：检查置信度范围
    if (targetOutcome.conf < 0 || targetOutcome.conf > 1) {
      console.error(`❌ [${context}] 置信度超出范围:`, targetOutcome.conf);
      message.error('评分数据异常，请重试');
      return false;
    }

    // 显示评分信息
    const confidence = Math.round(targetOutcome.conf * 100);
    const statusIcon = targetOutcome.passed_gate ? '✅' : '⚠️';
    message.success(
      `${statusIcon} ${modeName}评分: ${confidence}% - ${targetOutcome.explain}`,
      5
    );

    // 存储评分到 analysis-state-store
    setFinalScores([{
      stepId: candidateKey,
      confidence: targetOutcome.conf,
      strategy: `${modeName}评分（智能单步）`,
      metrics: {
        source: 'intelligent_single_step',
        mode: targetMode,
        timestamp: Date.now(),
      }
    }]);

    console.log(`💾 [${context}] 已存储评分到 analysis-state-store:`, {
      stepId: stepId.slice(-8),
      candidateKey,
      confidence: `${(targetOutcome.conf * 100).toFixed(1)}%`,
      dataSource: 'intelligent-single-step',
    });

    // 数据验证：验证存储的数据
    import('../../../utils/step-scoring-validator').then(({ validateStepScore }) => {
      validateStepScore(candidateKey, targetOutcome.conf, 'intelligent_single_step');
    });

    // 自动应用推荐配置到步骤
    if (onUpdateStepParameters && stepId) {
      const stepPatch = {
        strategy: { selected: recommendation.step_plan_mode },
        plan: recommendation.plan_suggest,
        config: recommendation.config_suggest,
        intent: recommendation.intent_suggest,
      };

      onUpdateStepParameters(stepId, stepPatch);
      console.log(`🔧 [${context}] 已应用推荐配置到步骤`);
    }

    return true;

  } catch (error) {
    console.error(`❌ [${context}] 评分失败:`, error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    message.error(`评分失败: ${errorMsg}`);
    return false;
  }
}
