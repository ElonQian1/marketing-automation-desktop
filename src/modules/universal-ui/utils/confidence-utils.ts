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

/**
 * 生成详细的证据分析文本（专家建议的详细版本）
 */
export function generateDetailedEvidenceAnalysis(evidence: ConfidenceEvidence): {
  summary: string;
  details: string[];
} {
  const details: string[] = [];
  
  if (evidence.model !== undefined) {
    const modelPercent = formatConfidence(evidence.model);
    const modelDesc = evidence.model >= 0.7 
      ? '视觉/语义模型理解度高' 
      : evidence.model >= 0.4 
        ? '模型理解度中等' 
        : '模型理解度较低';
    details.push(`🧠 模型分析: ${modelPercent} - ${modelDesc}`);
  }
  
  if (evidence.locator !== undefined) {
    const locatorPercent = formatConfidence(evidence.locator);
    const locatorDesc = evidence.locator >= 0.15 
      ? '定位策略稳定可靠' 
      : evidence.locator >= 0.08 
        ? '定位策略基本可用' 
        : '定位策略不够稳定';
    details.push(`📍 定位稳定性: ${locatorPercent} - ${locatorDesc}`);
  }
  
  if (evidence.visibility !== undefined) {
    const visibilityPercent = formatConfidence(evidence.visibility);
    const visibilityDesc = evidence.visibility >= 0.08 
      ? '元素完全可见可点' 
      : evidence.visibility >= 0.05 
        ? '元素基本可操作' 
        : '元素可见性存疑';
    details.push(`👁️ 可见性: ${visibilityPercent} - ${visibilityDesc}`);
  }
  
  if (evidence.device !== undefined) {
    const devicePercent = formatConfidence(evidence.device);
    const deviceDesc = evidence.device >= 0.9 
      ? '设备连接正常' 
      : evidence.device >= 0.5 
        ? '设备状态一般' 
        : '设备连接异常';
    details.push(`📱 设备可用性: ${devicePercent} - ${deviceDesc}`);
  }
  
  const total = (evidence.model || 0) + (evidence.locator || 0) + (evidence.visibility || 0) + (evidence.device || 0);
  const summary = `综合评分: ${formatConfidence(total)} (${details.length}个维度)`;
  
  return { summary, details };
}