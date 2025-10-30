// src/modules/structural-matching/application/create-structural-config.ts
// module: structural-matching | layer: application | role: 创建配置用例
// summary: 根据选中的元素创建默认的结构匹配配置

import {
  StructuralFieldConfig,
  StructuralMatchingConfig,
} from '../domain/models/structural-field-config';
import { FieldType, MatchMode, FIELD_DISPLAY_NAMES, FIELD_DESCRIPTIONS } from '../domain/constants/field-types';
import {
  DEFAULT_RESOURCE_ID_SCORING,
  DEFAULT_CONTENT_DESC_SCORING,
  DEFAULT_TEXT_SCORING,
  DEFAULT_CLASS_NAME_SCORING,
  DEFAULT_CHILDREN_STRUCTURE_SCORING,
  DEFAULT_FIELD_WEIGHTS,
  DEFAULT_GLOBAL_THRESHOLD,
} from '../domain/constants/scoring-weights';

/**
 * 创建默认字段配置
 */
function createDefaultFieldConfig(
  fieldType: FieldType,
  templateValue: any,
): StructuralFieldConfig {
  let scoringRules;
  let matchMode = MatchMode.EXACT;

  switch (fieldType) {
    case FieldType.RESOURCE_ID:
      scoringRules = DEFAULT_RESOURCE_ID_SCORING;
      break;
    case FieldType.CONTENT_DESC:
      scoringRules = DEFAULT_CONTENT_DESC_SCORING;
      matchMode = MatchMode.NON_EMPTY; // 笔记卡片：非空即可
      break;
    case FieldType.TEXT:
      scoringRules = DEFAULT_TEXT_SCORING;
      matchMode = MatchMode.NON_EMPTY; // 只检查非空/空状态
      break;
    case FieldType.CLASS_NAME:
      scoringRules = DEFAULT_CLASS_NAME_SCORING;
      break;
    case FieldType.CHILDREN_STRUCTURE:
      scoringRules = DEFAULT_CHILDREN_STRUCTURE_SCORING;
      matchMode = MatchMode.STRUCTURE;
      break;
    case FieldType.BOUNDS:
      scoringRules = { exactMatch: 0, bothNonEmpty: 0, bothEmpty: 0, mismatchPenalty: 0 };
      matchMode = MatchMode.DISABLED; // 不使用
      break;
  }

  return {
    fieldType,
    enabled: fieldType !== FieldType.BOUNDS, // Bounds默认禁用
    matchMode,
    weight: DEFAULT_FIELD_WEIGHTS[fieldType],
    scoringRules,
    displayName: FIELD_DISPLAY_NAMES[fieldType],
    description: FIELD_DESCRIPTIONS[fieldType],
    templateValue,
  };
}

/**
 * 从元素创建结构匹配配置
 */
export function createStructuralConfigFromElement(
  element: any,
): StructuralMatchingConfig {
  const fields: StructuralFieldConfig[] = [
    createDefaultFieldConfig(FieldType.RESOURCE_ID, element.resource_id),
    createDefaultFieldConfig(FieldType.CONTENT_DESC, element.content_desc),
    createDefaultFieldConfig(FieldType.TEXT, element.text),
    createDefaultFieldConfig(FieldType.CLASS_NAME, element.class_name),
    createDefaultFieldConfig(FieldType.CHILDREN_STRUCTURE, element.children),
    createDefaultFieldConfig(FieldType.BOUNDS, element.bounds),
  ];

  const configId = `structural_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    configId,
    templateElementId: element.id || '',
    templateStructure: element,
    fields,
    globalThreshold: DEFAULT_GLOBAL_THRESHOLD,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * 更新字段配置
 */
export function updateFieldConfig(
  config: StructuralMatchingConfig,
  fieldType: FieldType,
  updates: Partial<StructuralFieldConfig>,
): StructuralMatchingConfig {
  return {
    ...config,
    fields: config.fields.map(field =>
      field.fieldType === fieldType
        ? { ...field, ...updates }
        : field
    ),
    updatedAt: Date.now(),
  };
}

/**
 * 切换字段启用状态
 */
export function toggleFieldEnabled(
  config: StructuralMatchingConfig,
  fieldType: FieldType,
): StructuralMatchingConfig {
  return {
    ...config,
    fields: config.fields.map(field =>
      field.fieldType === fieldType
        ? { ...field, enabled: !field.enabled }
        : field
    ),
    updatedAt: Date.now(),
  };
}

/**
 * 更新全局阈值
 */
export function updateGlobalThreshold(
  config: StructuralMatchingConfig,
  threshold: number,
): StructuralMatchingConfig {
  return {
    ...config,
    globalThreshold: Math.max(0, Math.min(1, threshold)),
    updatedAt: Date.now(),
  };
}
