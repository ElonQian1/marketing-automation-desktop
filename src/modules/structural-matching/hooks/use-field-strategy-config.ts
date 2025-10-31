// src/modules/structural-matching/hooks/use-field-strategy-config.ts
// module: structural-matching | layer: hooks | role: 字段策略配置管理Hook
// summary: 管理每个字段的匹配策略配置状态，支持预设场景和自定义配置

import { useState, useCallback } from 'react';
import { FieldType } from '../domain/constants/field-types';
import { MatchStrategy } from '../domain/constants/match-strategies';
import { 
  getRecommendedStrategy, 
  SCENARIO_PRESETS, 
  ScenarioPreset,
  getScenarioPreset 
} from '../domain/constants/field-strategy-presets';
import { FieldConfig } from '../domain/models/hierarchical-field-config';

/**
 * 单个字段的完整配置
 */
export interface FieldStrategyConfig {
  /** 是否启用该字段的匹配 */
  enabled: boolean;
  
  /** 匹配策略 */
  strategy: MatchStrategy;
  
  /** 字段权重（0-1） */
  weight: number;
}

/**
 * 完整的字段策略配置集合
 */
export interface FieldStrategyConfigSet {
  [FieldType.RESOURCE_ID]: FieldStrategyConfig;
  [FieldType.CONTENT_DESC]: FieldStrategyConfig;
  [FieldType.TEXT]: FieldStrategyConfig;
  [FieldType.CLASS_NAME]: FieldStrategyConfig;
  [FieldType.CHILDREN_STRUCTURE]: FieldStrategyConfig;
  [FieldType.BOUNDS]: FieldStrategyConfig;
}

/**
 * 字段策略配置管理Hook
 */
export const useFieldStrategyConfig = (initialConfig?: Partial<FieldStrategyConfigSet>) => {
  // 初始化配置，使用推荐策略作为默认值
  const [fieldConfigs, setFieldConfigs] = useState<FieldStrategyConfigSet>(() => {
    const defaultConfig: FieldStrategyConfigSet = {
      [FieldType.RESOURCE_ID]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.RESOURCE_ID),
        weight: 1.0
      },
      [FieldType.CONTENT_DESC]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.CONTENT_DESC),
        weight: 1.0
      },
      [FieldType.TEXT]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.TEXT),
        weight: 1.0
      },
      [FieldType.CLASS_NAME]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.CLASS_NAME),
        weight: 1.0
      },
      [FieldType.CHILDREN_STRUCTURE]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.CHILDREN_STRUCTURE),
        weight: 1.0
      },
      [FieldType.BOUNDS]: {
        enabled: false, // 默认禁用Bounds字段
        strategy: getRecommendedStrategy(FieldType.BOUNDS),
        weight: 0.5
      },
    };

    return {
      ...defaultConfig,
      ...initialConfig,
    };
  });

  // 更新单个字段的启用状态
  const updateFieldEnabled = useCallback((fieldType: FieldType, enabled: boolean) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldType]: {
        ...prev[fieldType],
        enabled,
      },
    }));
  }, []);

  // 更新单个字段的策略
  const updateFieldStrategy = useCallback((fieldType: FieldType, strategy: MatchStrategy) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldType]: {
        ...prev[fieldType],
        strategy,
      },
    }));
  }, []);

  // 更新单个字段的权重
  const updateFieldWeight = useCallback((fieldType: FieldType, weight: number) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldType]: {
        ...prev[fieldType],
        weight: Math.max(0, Math.min(1, weight)), // 限制在0-1之间
      },
    }));
  }, []);

  // 批量更新字段配置
  const updateMultipleConfigs = useCallback((updates: Partial<FieldStrategyConfigSet>) => {
    setFieldConfigs(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // 应用场景预设
  const applyScenarioPreset = useCallback((scenarioName: string) => {
    const preset = getScenarioPreset(scenarioName);
    if (preset?.strategies) {
      const updates: Partial<FieldStrategyConfigSet> = {};
      
      Object.entries(preset.strategies).forEach(([fieldType, strategy]) => {
        const type = fieldType as FieldType;
        if (strategy) {
          updates[type] = {
            ...fieldConfigs[type],
            enabled: strategy !== MatchStrategy.DISABLED,
            strategy: strategy,
          };
        }
      });
      
      updateMultipleConfigs(updates);
      return true;
    }
    return false;
  }, [fieldConfigs, updateMultipleConfigs]);

  // 重置为推荐配置
  const resetToRecommended = useCallback(() => {
    const recommendedConfig: FieldStrategyConfigSet = {
      [FieldType.RESOURCE_ID]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.RESOURCE_ID),
        weight: 1.0
      },
      [FieldType.CONTENT_DESC]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.CONTENT_DESC),
        weight: 1.0
      },
      [FieldType.TEXT]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.TEXT),
        weight: 1.0
      },
      [FieldType.CLASS_NAME]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.CLASS_NAME),
        weight: 1.0
      },
      [FieldType.CHILDREN_STRUCTURE]: {
        enabled: true,
        strategy: getRecommendedStrategy(FieldType.CHILDREN_STRUCTURE),
        weight: 1.0
      },
      [FieldType.BOUNDS]: {
        enabled: false,
        strategy: getRecommendedStrategy(FieldType.BOUNDS),
        weight: 0.5
      },
    };
    setFieldConfigs(recommendedConfig);
  }, []);

  // 转换为层级化配置格式
  const toHierarchicalConfig = useCallback((elementPath: string = 'root'): {
    elementPath: string;
    fields: Partial<Record<FieldType, FieldConfig>>;
  } => {
    const fields: Partial<Record<FieldType, FieldConfig>> = {};
    
    Object.entries(fieldConfigs).forEach(([fieldType, config]) => {
      const type = fieldType as FieldType;
      if (config.enabled) {
        fields[type] = {
          enabled: config.enabled,
          weight: config.weight,
          matchMode: 'exact' as const,
          strategy: config.strategy,
        };
      }
    });

    return {
      elementPath,
      fields,
    };
  }, [fieldConfigs]);

  // 获取配置摘要
  const getConfigSummary = useCallback(() => {
    const summary = {
      totalFields: Object.keys(fieldConfigs).length,
      enabledFields: Object.values(fieldConfigs).filter(c => c.enabled).length,
      strategyCounts: {} as Record<MatchStrategy, number>,
      averageWeight: 0,
    };

    let totalWeight = 0;
    let enabledCount = 0;

    Object.values(fieldConfigs).forEach(config => {
      if (config.enabled) {
        summary.strategyCounts[config.strategy] = (summary.strategyCounts[config.strategy] || 0) + 1;
        totalWeight += config.weight;
        enabledCount++;
      }
    });

    summary.averageWeight = enabledCount > 0 ? totalWeight / enabledCount : 0;

    return summary;
  }, [fieldConfigs]);

  // 生成配置建议
  const generateSuggestions = useCallback((configs: FieldStrategyConfigSet) => {
    const suggestions: string[] = [];
    
    // 根据启用的字段数量给出建议
    const enabledCount = Object.values(configs).filter(c => c.enabled).length;
    if (enabledCount >= 5) {
      suggestions.push('当前启用字段较多，可考虑禁用不重要的字段以提高匹配速度');
    }
    
    // 根据策略组合给出建议
    const exactMatchCount = Object.values(configs)
      .filter(c => c.enabled && c.strategy === MatchStrategy.EXACT_MATCH).length;
    if (exactMatchCount >= 4) {
      suggestions.push('过多精确匹配可能降低容错性，考虑使用"都非空即可"或"值相似匹配"');
    }

    return suggestions;
  }, []);

  // 验证配置合理性
  const validateConfig = useCallback(() => {
    const issues: string[] = [];
    const enabledFields = Object.entries(fieldConfigs).filter(([, config]) => config.enabled);
    
    // 检查是否有足够的字段被启用
    if (enabledFields.length === 0) {
      issues.push('至少需要启用一个字段进行匹配');
    } else if (enabledFields.length === 1) {
      issues.push('建议启用多个字段以提高匹配准确性');
    }
    
    // 检查关键字段是否被启用
    const hasKeyField = fieldConfigs[FieldType.RESOURCE_ID].enabled || 
                       fieldConfigs[FieldType.CLASS_NAME].enabled;
    if (!hasKeyField) {
      issues.push('建议至少启用Resource-ID或Class Name字段作为主要识别依据');
    }

    // 检查权重配置
    const totalWeight = enabledFields.reduce((sum, [, config]) => sum + config.weight, 0);
    if (totalWeight === 0) {
      issues.push('启用的字段权重不能全部为0');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions: generateSuggestions(fieldConfigs),
    };
  }, [fieldConfigs, generateSuggestions]);

  return {
    // 状态
    fieldConfigs,
    
    // 字段操作方法
    updateFieldEnabled,
    updateFieldStrategy,
    updateFieldWeight,
    updateMultipleConfigs,
    
    // 场景和预设方法
    applyScenarioPreset,
    resetToRecommended,
    
    // 转换和工具方法
    toHierarchicalConfig,
    getConfigSummary,
    validateConfig,
    
    // 预设数据
    availableScenarios: SCENARIO_PRESETS,
  };
};

export default useFieldStrategyConfig;