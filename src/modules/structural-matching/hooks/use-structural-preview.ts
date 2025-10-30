// src/modules/structural-matching/hooks/use-structural-preview.ts
// module: structural-matching | layer: hooks | role: 实时预览计算
// summary: 计算结构匹配的预览评分和详细信息

import { useMemo } from 'react';
import {
  StructuralMatchingConfig,
  StructuralMatchResult,
  FieldMatchResult,
} from '../domain/models/structural-field-config';
import { FieldType } from '../domain/constants/field-types';

export interface UseStructuralPreviewProps {
  /** 当前配置 */
  config: StructuralMatchingConfig;
  /** 选中的元素 */
  selectedElement: any;
}

/**
 * 计算结构匹配预览
 * 注意: 这是前端简化版计算，后端会做精确评分
 */
export function useStructuralPreview({
  config,
  selectedElement,
}: UseStructuralPreviewProps) {
  
  // 计算各字段的预期得分
  const fieldResults = useMemo((): FieldMatchResult[] => {
    return config.fields.map(field => {
      if (!field.enabled) {
        return {
          fieldType: field.fieldType,
          score: 0,
          maxScore: 0,
          matched: false,
          reason: '字段已禁用',
        };
      }

      // 计算最大可能分数
      const maxScore = Math.max(
        field.scoringRules.exactMatch,
        field.scoringRules.bothNonEmpty,
        field.scoringRules.bothEmpty,
      ) * field.weight;

      // 简化评分逻辑 (前端预览用)
      let score = 0;
      let reason = '';
      let matched = false;

      // 根据字段类型和元素属性估算得分
      switch (field.fieldType) {
        case FieldType.RESOURCE_ID:
          if (selectedElement['resource-id']) {
            score = field.scoringRules.bothNonEmpty * field.weight;
            reason = '有resource-id，预计得分';
            matched = true;
          } else {
            score = field.scoringRules.bothEmpty * field.weight;
            reason = '无resource-id，空匹配得分';
            matched = true;
          }
          break;

        case FieldType.CONTENT_DESC:
          if (selectedElement['content-desc']) {
            score = field.scoringRules.bothNonEmpty * field.weight;
            reason = '有content-desc，预计得分';
            matched = true;
          } else {
            score = field.scoringRules.bothEmpty * field.weight;
            reason = '无content-desc，空匹配得分';
            matched = true;
          }
          break;

        case FieldType.TEXT:
          if (selectedElement.text) {
            score = field.scoringRules.bothNonEmpty * field.weight;
            reason = '有text，预计得分';
            matched = true;
          } else {
            score = field.scoringRules.bothEmpty * field.weight;
            reason = '无text，空匹配得分';
            matched = true;
          }
          break;

        case FieldType.CLASS_NAME:
          if (selectedElement.class) {
            score = field.scoringRules.exactMatch * field.weight;
            reason = `类名: ${selectedElement.class}`;
            matched = true;
          } else {
            score = field.scoringRules.mismatchPenalty * field.weight;
            reason = '无类名';
          }
          break;

        case FieldType.CHILDREN_STRUCTURE:
          // 假设结构完全匹配
          score = field.scoringRules.exactMatch * field.weight;
          reason = '结构匹配 (预估)';
          matched = true;
          break;

        case FieldType.BOUNDS:
          // 位置字段通常不完全匹配
          score = field.scoringRules.mismatchPenalty * field.weight;
          reason = '位置可能不同';
          break;
      }

      return {
        fieldType: field.fieldType,
        score,
        maxScore,
        matched,
        reason,
      };
    });
  }, [config.fields, selectedElement]);

  // 计算总分
  const totalResult = useMemo((): StructuralMatchResult => {
    const totalScore = fieldResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = fieldResults.reduce((sum, r) => sum + r.maxScore, 0);
    const passed = totalScore >= config.globalThreshold;

    return {
      totalScore,
      maxScore,
      passed,
      fieldResults,
    };
  }, [fieldResults, config.globalThreshold]);

  // 格式化显示信息
  const displayInfo = useMemo(() => {
    const percentage = totalResult.maxScore > 0
      ? (totalResult.totalScore / totalResult.maxScore) * 100
      : 0;

    const enabledCount = config.fields.filter(f => f.enabled).length;
    const matchedCount = fieldResults.filter(r => r.matched).length;

    return {
      percentage: percentage.toFixed(1),
      scoreText: `${totalResult.totalScore.toFixed(2)} / ${totalResult.maxScore.toFixed(2)}`,
      enabledFields: enabledCount,
      matchedFields: matchedCount,
      statusText: totalResult.passed ? '预计通过' : '预计不通过',
      statusColor: totalResult.passed ? '#52c41a' : '#ff4d4f',
    };
  }, [totalResult, config.fields, fieldResults]);

  return {
    totalResult,
    fieldResults,
    displayInfo,
  };
}
