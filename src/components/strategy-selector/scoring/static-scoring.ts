// src/components/strategy-selector/scoring/static-scoring.ts
// module: strategy-selector | layer: scoring | role: 静态策略评分逻辑
// summary: Step1-2 结构匹配评分（静态策略模式）

import { message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import type { StepCard } from '../../../store/stepcards';
import type { StrategyEvents } from '../../../types/strategySelector';
import { loadXmlWithFallback } from '../utils/xml-cache-loader';

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
}

/**
 * 步骤参数更新回调
 */
export type StepParametersUpdater = (stepId: string, params: Record<string, unknown>) => void;

/**
 * 执行静态策略的卡片子树评分（Step1）
 * 
 * @param candidateKey 候选键
 * @param card 步骤卡片
 * @param stepId 步骤ID
 * @param setFinalScores 评分存储函数
 * @param events 策略事件处理器
 * @param onUpdateStepParameters 步骤参数更新回调（可选）
 * @param getStepConfidence 获取已有评分的函数（可选，用于缓存检查）
 * @param forceRefresh 是否强制刷新（忽略缓存）
 * @returns 是否成功
 */
export async function executeStaticCardSubtreeScoring(
  candidateKey: string,
  card: StepCard,
  stepId: string,
  setFinalScores: (scores: StructureScoringResult[]) => void,
  events: StrategyEvents,
  onUpdateStepParameters?: StepParametersUpdater,
  getStepConfidence?: (candidateKey: string) => number | null,
  forceRefresh?: boolean
): Promise<boolean> {
  const context = '静态策略-卡片子树';
  
  console.log(`📌 [${context}] 开始执行评分`, { forceRefresh });

  // 🔍 缓存检查：避免重复计算（除非强制刷新）
  if (getStepConfidence && !forceRefresh) {
    const existingScore = getStepConfidence(candidateKey);
    if (existingScore !== null && existingScore > 0) {
      console.log(`✓ [${context}] 已有评分缓存:`, `${(existingScore * 100).toFixed(1)}%`);
      message.info(`已有卡片子树评分结果（${Math.round(existingScore * 100)}%），无需重复计算（可按住Shift点击强制刷新）`);
      return true;
    }
  }

  // 强制刷新提示
  if (forceRefresh) {
    console.log(`🔄 [${context}] 强制刷新模式，忽略缓存重新评分`);
    message.info('🔄 强制刷新：重新评分卡片子树中...');
  }

  // 检查必要数据
  if (!card.elementContext?.xpath) {
    message.error('缺少必要数据：元素XPath');
    return false;
  }

  // 加载XML缓存
  const xmlResult = await loadXmlWithFallback(card, context);
  
  if (!xmlResult.success || !xmlResult.xmlContent) {
    message.warning('XML缓存已失效，请重新分析页面或使用传统策略');
    return false;
  }

  try {
    // 执行评分
    console.log(`🔄 [${context}] 开始执行评分`);
    
    const recommendation = await invoke<RecommendResponse>('recommend_structure_mode_v2', {
      input: {
        absoluteXpath: card.elementContext.xpath,
        xmlSnapshot: xmlResult.xmlContent,
        containerXpath: null,
      },
    });

    // 提取卡片子树评分结果
    const cardSubtreeOutcome = recommendation.outcomes.find(o => o.mode === 'CardSubtree');
    
    if (!cardSubtreeOutcome) {
      message.error('未找到卡片子树评分结果');
      return false;
    }

    // 存储评分
    const confidence = cardSubtreeOutcome.conf;
    setFinalScores([{
      stepId: candidateKey,
      confidence,
      strategy: '卡片子树评分（静态策略）',
      metrics: {
        source: 'static_strategy',
        mode: 'CardSubtree',
        timestamp: Date.now(),
      }
    }]);

    console.log(`✅ [${context}] 评分存储成功:`, {
      candidateKey,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      source: 'static_strategy',
    });

    // 显示评分结果
    const statusIcon = cardSubtreeOutcome.passed_gate ? '✅' : '⚠️';
    message.success(
      `${statusIcon} 卡片子树评分: ${Math.round(confidence * 100)}% - ${cardSubtreeOutcome.explain}`,
      5
    );

    // 应用推荐配置到步骤
    if (onUpdateStepParameters && stepId) {
      onUpdateStepParameters(stepId, {
        strategy: { selected: recommendation.step_plan_mode },
        plan: recommendation.plan_suggest,
        config: recommendation.config_suggest,
        _scoreMetadata: {
          mode: 'CardSubtree',
          confidence,
          passedGate: cardSubtreeOutcome.passed_gate,
          explanation: cardSubtreeOutcome.explain,
          source: 'static_strategy',
        }
      });
    }

    // 更新策略状态
    await new Promise(resolve => {
      events.onStrategyChange({ 
        type: "static", 
        key: "structural_matching_card_subtree",
        // @ts-expect-error - 扩展属性
        _sharedBaseStep: "step1",
        _scoreApplied: true,
      });
      resolve(undefined);
    });

    console.log(`📌 [${context}] 策略状态更新完成`);
    return true;

  } catch (error) {
    console.error(`❌ [${context}] 评分失败:`, error);
    message.error(`评分失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return false;
  }
}

/**
 * 执行静态策略的叶子上下文评分（Step2）
 * 
 * @param candidateKey 候选键
 * @param card 步骤卡片
 * @param stepId 步骤ID
 * @param setFinalScores 评分存储函数
 * @param events 策略事件处理器
 * @param onUpdateStepParameters 步骤参数更新回调（可选）
 * @param getStepConfidence 获取已有评分的函数（可选，用于缓存检查）
 * @param forceRefresh 是否强制刷新（忽略缓存）
 * @returns 是否成功
 */
export async function executeStaticLeafContextScoring(
  candidateKey: string,
  card: StepCard,
  stepId: string,
  setFinalScores: (scores: StructureScoringResult[]) => void,
  events: StrategyEvents,
  onUpdateStepParameters?: StepParametersUpdater,
  getStepConfidence?: (candidateKey: string) => number | null,
  forceRefresh?: boolean
): Promise<boolean> {
  const context = '静态策略-叶子上下文';
  
  console.log(`📌 [${context}] 开始执行评分`, { forceRefresh });

  // 🔍 缓存检查：避免重复计算（除非强制刷新）
  if (getStepConfidence && !forceRefresh) {
    const existingScore = getStepConfidence(candidateKey);
    if (existingScore !== null && existingScore > 0) {
      console.log(`✓ [${context}] 已有评分缓存:`, `${(existingScore * 100).toFixed(1)}%`);
      message.info(`已有叶子上下文评分结果（${Math.round(existingScore * 100)}%），无需重复计算（可按住Shift点击强制刷新）`);
      return true;
    }
  }

  // 强制刷新提示
  if (forceRefresh) {
    console.log(`🔄 [${context}] 强制刷新模式，忽略缓存重新评分`);
    message.info('🔄 强制刷新：重新评分叶子上下文中...');
  }

  // 检查必要数据
  if (!card.elementContext?.xpath) {
    message.error('缺少必要数据：元素XPath');
    return false;
  }

  // 加载XML缓存
  const xmlResult = await loadXmlWithFallback(card, context);
  
  if (!xmlResult.success || !xmlResult.xmlContent) {
    message.warning('XML缓存已失效，请重新分析页面或使用传统策略');
    return false;
  }

  try {
    // 执行评分
    console.log(`🔄 [${context}] 开始执行评分`);
    
    const recommendation = await invoke<RecommendResponse>('recommend_structure_mode_v2', {
      input: {
        absoluteXpath: card.elementContext.xpath,
        xmlSnapshot: xmlResult.xmlContent,
        containerXpath: null,
      },
    });

    // 提取叶子上下文评分结果
    const leafContextOutcome = recommendation.outcomes.find(o => o.mode === 'LeafContext');
    
    if (!leafContextOutcome) {
      message.error('未找到叶子上下文评分结果');
      return false;
    }

    // 存储评分
    const confidence = leafContextOutcome.conf;
    setFinalScores([{
      stepId: candidateKey,
      confidence,
      strategy: '叶子上下文评分（静态策略）',
      metrics: {
        source: 'static_strategy',
        mode: 'LeafContext',
        timestamp: Date.now(),
      }
    }]);

    console.log(`✅ [${context}] 评分存储成功:`, {
      candidateKey,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      source: 'static_strategy',
    });

    // 显示评分结果
    const statusIcon = leafContextOutcome.passed_gate ? '✅' : '⚠️';
    message.success(
      `${statusIcon} 叶子上下文评分: ${Math.round(confidence * 100)}% - ${leafContextOutcome.explain}`,
      5
    );

    // 应用推荐配置到步骤
    if (onUpdateStepParameters && stepId) {
      onUpdateStepParameters(stepId, {
        strategy: { selected: recommendation.step_plan_mode },
        plan: recommendation.plan_suggest,
        config: recommendation.config_suggest,
        _scoreMetadata: {
          mode: 'LeafContext',
          confidence,
          passedGate: leafContextOutcome.passed_gate,
          explanation: leafContextOutcome.explain,
          source: 'static_strategy',
        }
      });
    }

    // 更新策略状态
    await new Promise(resolve => {
      events.onStrategyChange({ 
        type: "static", 
        key: "structural_matching_leaf_context",
        // @ts-expect-error - 扩展属性
        _sharedBaseStep: "step2",
        _scoreApplied: true,
      });
      resolve(undefined);
    });

    console.log(`📌 [${context}] 策略状态更新完成`);
    return true;

  } catch (error) {
    console.error(`❌ [${context}] 评分失败:`, error);
    message.error(`评分失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return false;
  }
}
