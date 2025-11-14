// src/components/strategy-selector/scoring/smart-auto-scoring.ts
// module: strategy-selector | layer: scoring | role: 智能·自动链评分逻辑
// summary: Step1-2 结构匹配评分（智能·自动链模式）

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
 * 执行智能·自动链的 Step1-2 评分
 * 
 * @param card 步骤卡片
 * @param setFinalScores 评分存储函数
 * @returns 是否成功
 */
export async function executeSmartAutoScoring(
  card: StepCard,
  setFinalScores: (scores: StructureScoringResult[]) => void
): Promise<boolean> {
  const context = '智能·自动链';
  
  console.log(`🧠 [${context}] 触发 Step1-2 结构匹配评分`);

  // 检查必要数据
  if (!card.elementContext?.xpath) {
    console.warn(`⚠️ [${context}] 缺少xpath，跳过评分`);
    message.warning('步骤卡片数据不完整，跳过评分');
    return false;
  }

  // 加载XML缓存
  const xmlResult = await loadXmlWithFallback(card, context);
  
  if (!xmlResult.success || !xmlResult.xmlContent) {
    console.warn(`⚠️ [${context}] XML缓存丢失，跳过评分`);
    message.info('XML缓存已失效，将使用动态分析');
    return false;
  }

  // 验证XML完整性
  if (!validateXmlContent(xmlResult.xmlContent, context)) {
    message.warning('XML数据可能不完整，评分结果仅供参考');
  }

  const results: StructureScoringResult[] = [];

  // 🎯 Step1: 卡片子树评分
  try {
    const step1Result = await invoke<RecommendResponse>('recommend_structure_mode_v2', {
      input: {
        absoluteXpath: card.elementContext.xpath,
        xmlSnapshot: xmlResult.xmlContent,
        containerXpath: null,
      },
    });

    const cardSubtreeOutcome = step1Result.outcomes.find(o => o.mode === 'CardSubtree');
    
    if (cardSubtreeOutcome && cardSubtreeOutcome.conf >= 0 && cardSubtreeOutcome.conf <= 1) {
      results.push({
        stepId: 'card_subtree_scoring',  // ✅ 使用candidateKey与菜单查询匹配
        confidence: cardSubtreeOutcome.conf,
        strategy: '卡片子树评分（智能·自动链）',
        metrics: {
          source: 'smart_auto_chain',
          mode: 'CardSubtree',
          timestamp: Date.now(),
        }
      });
      
      console.log(`✅ [${context}] Step1评分完成:`, (cardSubtreeOutcome.conf * 100).toFixed(1) + '%');
    }
  } catch (error) {
    console.error(`❌ [${context}] Step1评分失败:`, error);
  }

  // 🎯 Step2: 叶子上下文评分
  try {
    const step2Result = await invoke<RecommendResponse>('recommend_structure_mode_v2', {
      input: {
        absoluteXpath: card.elementContext.xpath,
        xmlSnapshot: xmlResult.xmlContent,
        containerXpath: null,
      },
    });

    const leafContextOutcome = step2Result.outcomes.find(o => o.mode === 'LeafContext');
    
    if (leafContextOutcome && leafContextOutcome.conf >= 0 && leafContextOutcome.conf <= 1) {
      results.push({
        stepId: 'leaf_context_scoring',  // ✅ 使用candidateKey与菜单查询匹配
        confidence: leafContextOutcome.conf,
        strategy: '叶子上下文评分（智能·自动链）',
        metrics: {
          source: 'smart_auto_chain',
          mode: 'LeafContext',
          timestamp: Date.now(),
        }
      });
      
      console.log(`✅ [${context}] Step2评分完成:`, (leafContextOutcome.conf * 100).toFixed(1) + '%');
    }
  } catch (error) {
    console.error(`❌ [${context}] Step2评分失败:`, error);
  }

  // 存储评分结果
  if (results.length > 0) {
    setFinalScores(results);
    message.success(`🧠 智能·自动链评分完成（${results.length}/2）`);
    return true;
  }

  return false;
}
