// src/modules/universal-ui/utils/confidence-utils.ts
// module: universal-ui | layer: utils | role: 置信度计算与评估工具
// summary: 提供置信度估算、等级判断和颜色映射等工具函数

import type { ConfidenceEvidence, AnalysisResult } from '../types/intelligent-analysis-types';

/**
 * 置信度等级定义
 */
export const CONFIDENCE_LEVELS = {
  HIGH: { min: 85, color: '#52c41a', label: '高' },
  MEDIUM: { min: 70, color: '#fa8c16', label: '中' },
  LOW: { min: 0, color: '#ff4d4f', label: '低' }
} as const;

/**
 * 根据置信度分数获取等级信息
 */
export function getConfidenceLevel(confidence: number) {
  const percentage = Math.round(confidence * 100);
  
  if (percentage >= CONFIDENCE_LEVELS.HIGH.min) return CONFIDENCE_LEVELS.HIGH;
  if (percentage >= CONFIDENCE_LEVELS.MEDIUM.min) return CONFIDENCE_LEVELS.MEDIUM;
  return CONFIDENCE_LEVELS.LOW;
}

/**
 * 置信度估算函数（当后端未提供时的兜底逻辑）
 */
export function estimateConfidence(result: AnalysisResult): { confidence: number; evidence: ConfidenceEvidence } {
  // 基础置信度：根据推荐策略存在性判断
  let baseConfidence = result.recommendedKey ? 0.8 : 0.3;
  
  // 模型置信度：基于策略候选数量和质量
  const modelScore = result.smartCandidates && result.smartCandidates.length > 0 
    ? Math.min(0.9, 0.5 + result.smartCandidates.length * 0.1)
    : 0.2;
  
  // 定位稳定性：假设有推荐策略时较稳定
  const locatorScore = result.recommendedKey ? 0.85 : 0.4;
  
  // 可见性：基于是否有明确推荐
  const visibilityScore = result.recommendedKey ? 0.9 : 0.5;
  
  // 设备可用性：默认假设设备正常
  const deviceScore = 0.95;
  
  // 综合计算置信度
  const finalConfidence = Math.min(1.0, 
    baseConfidence * 0.4 + 
    modelScore * 0.3 + 
    locatorScore * 0.2 + 
    visibilityScore * 0.1
  );
  
  return {
    confidence: finalConfidence,
    evidence: {
      model: modelScore,
      locator: locatorScore,
      visibility: visibilityScore,
      device: deviceScore
    }
  };
}

/**
 * 简化版置信度估算（用于事件处理）
 */
export function estimateConfidenceFromEvent(data: {
  recommendedKey?: string;
  candidatesCount?: number;
  topConfidence?: number;
}): { confidence: number; evidence: ConfidenceEvidence } {
  const { recommendedKey, candidatesCount = 0, topConfidence = 0.85 } = data;
  
  // 基础置信度：根据推荐策略存在性判断
  const baseConfidence = recommendedKey ? 0.8 : 0.3;
  
  // 模型置信度：基于策略候选数量和最高候选者置信度
  const modelScore = candidatesCount > 0 
    ? Math.min(0.9, Math.max(topConfidence, 0.5 + candidatesCount * 0.1))
    : 0.2;
  
  // 定位稳定性：假设有推荐策略时较稳定
  const locatorScore = recommendedKey ? 0.85 : 0.4;
  
  // 可见性：基于是否有明确推荐
  const visibilityScore = recommendedKey ? 0.9 : 0.5;
  
  // 设备可用性：默认假设设备正常
  const deviceScore = 0.95;
  
  // 综合计算置信度
  const finalConfidence = Math.min(1.0, 
    baseConfidence * 0.4 + 
    modelScore * 0.3 + 
    locatorScore * 0.2 + 
    visibilityScore * 0.1
  );
  
  return {
    confidence: finalConfidence,
    evidence: {
      model: modelScore,
      locator: locatorScore,
      visibility: visibilityScore,
      device: deviceScore
    }
  };
}

/**
 * 格式化置信度为百分比字符串
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * 生成证据详情的描述文本
 */
export function generateEvidenceDescription(evidence: ConfidenceEvidence): string {
  const items = [];
  
  if (evidence.model !== undefined) {
    items.push(`模型: ${formatConfidence(evidence.model)}`);
  }
  if (evidence.locator !== undefined) {
    items.push(`定位: ${formatConfidence(evidence.locator)}`);
  }
  if (evidence.visibility !== undefined) {
    items.push(`可见: ${formatConfidence(evidence.visibility)}`);
  }
  if (evidence.device !== undefined) {
    items.push(`设备: ${formatConfidence(evidence.device)}`);
  }
  
  return items.join(' | ');
}