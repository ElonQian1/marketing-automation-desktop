// src/utils/step-scoring-validator.ts
// module: utils | layer: utils | role: 步骤评分数据流验证工具
// summary: 验证评分数据在前后端之间的一致性，用于调试和测试

import { StepSequenceMapper, type CandidateKey } from '../config/step-sequence';

/**
 * 评分数据验证器
 */
export class StepScoringValidator {
  /**
   * 验证candidateKey是否有效
   */
  static validateCandidateKey(candidateKey: string): boolean {
    const isValid = StepSequenceMapper.isValidCandidateKey(candidateKey);
    if (!isValid) {
      console.warn(`⚠️ [评分验证] 无效的candidateKey: ${candidateKey}`);
      console.warn(`   有效的candidateKey列表:`, this.getAllValidCandidateKeys());
    }
    return isValid;
  }

  /**
   * 验证评分数据结构
   */
  static validateScoreData(data: {
    stepId?: string;
    candidateKey?: string;
    confidence: number;
    strategy?: string;
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必填字段
    if (data.confidence === undefined || data.confidence === null) {
      errors.push('缺少必填字段: confidence');
    } else if (data.confidence < 0 || data.confidence > 1) {
      errors.push(`confidence值超出范围 [0, 1]: ${data.confidence}`);
    }

    // 验证candidateKey
    if (data.candidateKey) {
      if (!this.validateCandidateKey(data.candidateKey)) {
        errors.push(`无效的candidateKey: ${data.candidateKey}`);
      }
    } else if (data.stepId) {
      // 如果只有stepId，尝试转换为candidateKey
      const candidateKey = StepSequenceMapper.stepIdToCandidateKey(data.stepId);
      if (!candidateKey) {
        warnings.push(`无法从stepId转换candidateKey: ${data.stepId}`);
      }
    } else {
      warnings.push('缺少stepId或candidateKey，建议至少提供一个');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 获取所有有效的candidateKey
   */
  static getAllValidCandidateKeys(): string[] {
    return [
      'card_subtree_scoring',
      'leaf_context_scoring',
      'self_anchor',
      'child_driven',
      'region_scoped',
      'xpath_fallback',
      'index_fallback',
      'emergency_fallback',
    ];
  }

  /**
   * 验证评分数据来源标记
   */
  static validateScoreSource(source: string): boolean {
    const validSources = [
      'intelligent_chain',      // 智能自动链
      'single_step',           // 智能单步
      'static_strategy',       // 静态策略
      'structural_matching',   // 结构匹配
    ];
    
    const isValid = validSources.includes(source);
    if (!isValid) {
      console.warn(`⚠️ [评分验证] 未知的评分来源: ${source}`);
      console.warn(`   有效的来源标记:`, validSources);
    }
    return isValid;
  }

  /**
   * 打印评分数据流追踪信息
   */
  static traceScoreDataFlow(params: {
    stepId?: string;
    candidateKey?: string;
    confidence: number;
    source: string;
    timestamp?: number;
  }): void {
    const timestamp = params.timestamp || Date.now();
    const stepConfig = params.candidateKey 
      ? StepSequenceMapper.getByCandidateKey(params.candidateKey)
      : params.stepId 
        ? StepSequenceMapper.getByStepId(params.stepId)
        : null;

    console.log('📊 [评分数据流追踪]', {
      时间戳: new Date(timestamp).toISOString(),
      来源: params.source,
      步骤ID: params.stepId,
      候选项Key: params.candidateKey,
      置信度: `${(params.confidence * 100).toFixed(1)}%`,
      步骤配置: stepConfig ? {
        序号: stepConfig.step,
        标签: stepConfig.label,
        类别: stepConfig.category,
      } : '未找到配置',
    });
  }

  /**
   * 比对前后端步骤序号映射
   */
  static compareStepMappings(params: {
    frontendStepId: string;
    backendCandidateKey: string;
  }): {
    isConsistent: boolean;
    message: string;
  } {
    const expectedCandidateKey = StepSequenceMapper.stepIdToCandidateKey(params.frontendStepId);
    const isConsistent = expectedCandidateKey === params.backendCandidateKey;

    if (!isConsistent) {
      return {
        isConsistent: false,
        message: `❌ 前后端映射不一致: 前端stepId="${params.frontendStepId}" 期望candidateKey="${expectedCandidateKey}"，但后端返回"${params.backendCandidateKey}"`,
      };
    }

    return {
      isConsistent: true,
      message: `✅ 前后端映射一致: stepId="${params.frontendStepId}" ↔ candidateKey="${params.backendCandidateKey}"`,
    };
  }

  /**
   * 生成评分数据一致性报告
   */
  static generateConsistencyReport(scores: Array<{
    stepId?: string;
    candidateKey?: string;
    confidence: number;
    source?: string;
  }>): {
    totalScores: number;
    validScores: number;
    invalidScores: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let validScores = 0;
    let invalidScores = 0;

    scores.forEach((score, index) => {
      const validation = this.validateScoreData(score);
      
      if (validation.isValid) {
        validScores++;
      } else {
        invalidScores++;
        issues.push(`评分 #${index + 1}: ${validation.errors.join(', ')}`);
      }

      validation.warnings.forEach(warning => {
        issues.push(`评分 #${index + 1} 警告: ${warning}`);
      });
    });

    return {
      totalScores: scores.length,
      validScores,
      invalidScores,
      issues,
    };
  }
}

/**
 * 便捷的全局验证函数
 */
export function validateStepScore(
  candidateKey: string,
  confidence: number,
  source: string = 'unknown'
): boolean {
  const validation = StepScoringValidator.validateScoreData({
    candidateKey,
    confidence,
  });

  if (!validation.isValid) {
    console.error('❌ [评分验证失败]', validation.errors);
    return false;
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ [评分验证警告]', validation.warnings);
  }

  // 追踪数据流
  StepScoringValidator.traceScoreDataFlow({
    candidateKey,
    confidence,
    source,
  });

  return true;
}
