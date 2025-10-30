// src/modules/structural-matching/services/structural-matching-service.ts
// module: structural-matching | layer: services | role: Tauri调用服务
// summary: 封装结构匹配的Tauri命令调用

import { invoke } from '@tauri-apps/api/core';
import type {
  StructuralMatchingConfig,
  StructuralMatchResult,
} from '../domain/models/structural-field-config';

/**
 * 评估单个元素是否匹配模板
 */
export async function evaluateStructuralMatch(
  config: StructuralMatchingConfig,
  templateElement: any,
  targetElement: any,
): Promise<StructuralMatchResult> {
  console.log('🏗️ [Service] 调用结构匹配评估', { config, templateElement, targetElement });
  
  try {
    const result = await invoke<StructuralMatchResult>('evaluate_structural_match', {
      config,
      templateElement,
      targetElement,
    });
    
    console.log('✅ [Service] 结构匹配评估完成', result);
    return result;
  } catch (error) {
    console.error('❌ [Service] 结构匹配评估失败', error);
    throw error;
  }
}

/**
 * 批量评估多个元素
 */
export async function evaluateStructuralMatchBatch(
  config: StructuralMatchingConfig,
  templateElement: any,
  targetElements: any[],
): Promise<StructuralMatchResult[]> {
  console.log('🏗️ [Service] 批量评估', { 
    config, 
    templateElement, 
    targetCount: targetElements.length 
  });
  
  try {
    const results = await invoke<StructuralMatchResult[]>('evaluate_structural_match_batch', {
      config,
      templateElement,
      targetElements,
    });
    
    const passedCount = results.filter(r => r.passed).length;
    console.log(`✅ [Service] 批量评估完成，通过: ${passedCount} / ${results.length}`);
    return results;
  } catch (error) {
    console.error('❌ [Service] 批量评估失败', error);
    throw error;
  }
}

/**
 * 获取匹配的元素（筛选）
 */
export async function getMatchedElements(
  config: StructuralMatchingConfig,
  templateElement: any,
  targetElements: any[],
): Promise<any[]> {
  console.log('🔍 [Service] 筛选匹配元素', { 
    config, 
    templateElement, 
    candidateCount: targetElements.length 
  });
  
  try {
    const matchedElements = await invoke<any[]>('get_matched_elements', {
      config,
      templateElement,
      targetElements,
    });
    
    console.log(`✅ [Service] 筛选完成，匹配数: ${matchedElements.length}`);
    return matchedElements;
  } catch (error) {
    console.error('❌ [Service] 筛选失败', error);
    throw error;
  }
}
