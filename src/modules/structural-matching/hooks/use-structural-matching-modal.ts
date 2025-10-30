// src/modules/structural-matching/hooks/use-structural-matching-modal.ts
// module: structural-matching | layer: hooks | role: 模态框状态管理
// summary: 管理结构匹配模态框的状态和交互逻辑

import { useState, useCallback, useMemo } from 'react';
import {
  StructuralMatchingConfig,
  StructuralFieldConfig,
} from '../domain/models/structural-field-config';
import {
  createStructuralConfigFromElement,
  updateFieldConfig,
  toggleFieldEnabled,
  updateGlobalThreshold,
} from '../application/create-structural-config';
import { FieldType } from '../domain/constants/field-types';

export interface UseStructuralMatchingModalProps {
  /** 选中的元素 */
  selectedElement: any;
  /** 初始配置 (可选) */
  initialConfig?: StructuralMatchingConfig;
}

export function useStructuralMatchingModal({
  selectedElement,
  initialConfig,
}: UseStructuralMatchingModalProps) {
  // 初始化配置
  const [config, setConfig] = useState<StructuralMatchingConfig>(() => {
    if (initialConfig) {
      return initialConfig;
    }
    return createStructuralConfigFromElement(selectedElement);
  });

  // 更新字段配置
  const handleUpdateField = useCallback((
    fieldType: FieldType,
    updates: Partial<StructuralFieldConfig>,
  ) => {
    setConfig(prevConfig => updateFieldConfig(prevConfig, fieldType, updates));
  }, []);

  // 切换字段启用
  const handleToggleField = useCallback((fieldType: FieldType) => {
    setConfig(prevConfig => toggleFieldEnabled(prevConfig, fieldType));
  }, []);

  // 更新阈值
  const handleUpdateThreshold = useCallback((threshold: number) => {
    setConfig(prevConfig => updateGlobalThreshold(prevConfig, threshold));
  }, []);

  // 计算预览评分 (简化版，后端会做精确计算)
  const previewScore = useMemo(() => {
    let maxScore = 0;
    let currentScore = 0;

    config.fields.forEach(field => {
      if (field.enabled) {
        const maxFieldScore = Math.max(
          field.scoringRules.exactMatch,
          field.scoringRules.bothNonEmpty,
          field.scoringRules.bothEmpty,
        );
        maxScore += maxFieldScore * field.weight;
        // 假设所有字段都能拿到最高分
        currentScore += maxFieldScore * field.weight;
      }
    });

    return {
      maxPossible: maxScore,
      estimated: currentScore,
      percentage: maxScore > 0 ? (currentScore / maxScore) * 100 : 0,
    };
  }, [config]);

  // 验证配置
  const isConfigValid = useMemo(() => {
    // 至少有一个字段启用
    const hasEnabledField = config.fields.some(f => f.enabled);
    // 阈值在有效范围内
    const validThreshold = config.globalThreshold >= 0 && config.globalThreshold <= 1;
    
    return hasEnabledField && validThreshold;
  }, [config]);

  // 重置为默认配置
  const handleReset = useCallback(() => {
    setConfig(createStructuralConfigFromElement(selectedElement));
  }, [selectedElement]);

  return {
    config,
    updateField: handleUpdateField,
    toggleField: handleToggleField,
    updateThreshold: handleUpdateThreshold,
    previewScore,
    isConfigValid,
    reset: handleReset,
  };
}
