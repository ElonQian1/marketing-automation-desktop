// src/modules/structural-matching/domain/models/hierarchical-field-config.ts
// module: structural-matching | layer: domain | role: 层级化字段配置模型
// summary: 支持每个层级的每个字段独立配置的数据模型，集成细粒度匹配策略

import { FieldType, MatchMode } from '../constants/field-types';
import { MatchStrategy } from '../constants/match-strategies';

/**
 * 单个字段的配置
 */
export interface FieldConfig {
  /** 是否启用 */
  enabled: boolean;
  
  /** 权重 (0.1 - 2.0) */
  weight: number;
  
  /** 匹配模式（保留兼容性） */
  matchMode: MatchMode;
  
  /** 匹配策略（新的细粒度策略） */
  strategy: MatchStrategy;
}

/**
 * 层级化字段配置
 * 每个元素路径对应一组字段配置
 */
export interface HierarchicalFieldConfig {
  /** 元素路径，如 "root", "root-0", "root-0-0" */
  elementPath: string;
  
  /** 该层级的所有字段配置 */
  fields: Partial<Record<FieldType, FieldConfig>>;
}

/**
 * 完整的层级化配置
 */
export interface StructuralMatchingHierarchicalConfig {
  /** 全局匹配阈值 */
  globalThreshold: number;
  
  /** 所有层级的字段配置 */
  layers: HierarchicalFieldConfig[];

  /**
   * 可选：结构签名（供 V3 执行器触发结构匹配用）
   * 说明：为保持向后兼容，此字段为可选，未设置时后端可回退到传统匹配。
   */
  structural_signatures?: Record<string, unknown>;
}

/**
 * 字段配置的默认值
 */
export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  enabled: true,
  weight: 1.0,
  matchMode: MatchMode.EXACT,
  strategy: MatchStrategy.CONSISTENT_EMPTINESS,
};

/**
 * 根据字段类型获取默认配置
 */
export const getDefaultFieldConfig = (fieldType: FieldType): FieldConfig => {
  const weightMap: Record<FieldType, number> = {
    [FieldType.RESOURCE_ID]: 1.5,
    [FieldType.CONTENT_DESC]: 1.2,
    [FieldType.TEXT]: 1.0,
    [FieldType.CLASS_NAME]: 0.8,
    [FieldType.BOUNDS]: 0.5,
    [FieldType.CHILDREN_STRUCTURE]: 1.3,
  };

  return {
    ...DEFAULT_FIELD_CONFIG,
    weight: weightMap[fieldType] || 1.0,
    strategy: MatchStrategy.CONSISTENT_EMPTINESS,
  };
};

/**
 * 创建层级配置的工具函数
 */
export const createLayerConfig = (elementPath: string, enabledFields: FieldType[] = []): HierarchicalFieldConfig => {
  const fields: Partial<Record<FieldType, FieldConfig>> = {};
  
  // 为启用的字段创建配置
  enabledFields.forEach(fieldType => {
    fields[fieldType] = getDefaultFieldConfig(fieldType);
  });
  
  return {
    elementPath,
    fields,
  };
};

/**
 * 查找指定路径和字段的配置
 */
export const findFieldConfig = (
  layers: HierarchicalFieldConfig[], 
  elementPath: string, 
  fieldType: FieldType
): FieldConfig | undefined => {
  const layer = layers.find(l => l.elementPath === elementPath);
  return layer?.fields[fieldType];
};

/**
 * 更新指定路径和字段的配置
 */
export const updateFieldConfig = (
  layers: HierarchicalFieldConfig[],
  elementPath: string,
  fieldType: FieldType,
  config: Partial<FieldConfig>
): HierarchicalFieldConfig[] => {
  const newLayers = [...layers];
  
  // 查找现有层级
  let layerIndex = newLayers.findIndex(l => l.elementPath === elementPath);
  
  // 如果层级不存在，创建新层级
  if (layerIndex === -1) {
    newLayers.push(createLayerConfig(elementPath, [fieldType]));
    layerIndex = newLayers.length - 1;
  }
  
  // 更新字段配置
  const currentConfig = newLayers[layerIndex].fields[fieldType] || getDefaultFieldConfig(fieldType);
  newLayers[layerIndex] = {
    ...newLayers[layerIndex],
    fields: {
      ...newLayers[layerIndex].fields,
      [fieldType]: {
        ...currentConfig,
        ...config,
      },
    },
  };
  
  return newLayers;
};