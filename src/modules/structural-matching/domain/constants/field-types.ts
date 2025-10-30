// src/modules/structural-matching/domain/constants/field-types.ts
// module: structural-matching | layer: domain | role: 字段类型常量
// summary: 定义结构匹配支持的字段类型

/**
 * 支持的字段类型
 */
export enum FieldType {
  /** Resource-ID */
  RESOURCE_ID = 'resource_id',
  
  /** Content-Desc (内容描述) */
  CONTENT_DESC = 'content_desc',
  
  /** Text (文本) */
  TEXT = 'text',
  
  /** Class Name (类名) */
  CLASS_NAME = 'class_name',
  
  /** Children Structure (子元素结构) */
  CHILDREN_STRUCTURE = 'children_structure',
  
  /** Bounds (边界，暂不使用) */
  BOUNDS = 'bounds',
}

/**
 * 匹配模式
 */
export enum MatchMode {
  /** 值完全相同 */
  EXACT = 'exact',
  
  /** 都非空即可 */
  NON_EMPTY = 'non_empty',
  
  /** 都为空即可 */
  EMPTY = 'empty',
  
  /** 结构匹配 (用于子元素) */
  STRUCTURE = 'structure',
  
  /** 不参与匹配 */
  DISABLED = 'disabled',
}

/**
 * 字段显示名称映射
 */
export const FIELD_DISPLAY_NAMES: Record<FieldType, string> = {
  [FieldType.RESOURCE_ID]: 'Resource-ID',
  [FieldType.CONTENT_DESC]: 'Content-Desc',
  [FieldType.TEXT]: 'Text',
  [FieldType.CLASS_NAME]: 'Class Name',
  [FieldType.CHILDREN_STRUCTURE]: '子元素结构',
  [FieldType.BOUNDS]: 'Bounds',
};

/**
 * 字段类型显示名称映射（别名，与 FIELD_DISPLAY_NAMES 相同）
 */
export const FIELD_TYPE_DISPLAY_NAMES = FIELD_DISPLAY_NAMES;

/**
 * 字段描述映射
 */
export const FIELD_DESCRIPTIONS: Record<FieldType, string> = {
  [FieldType.RESOURCE_ID]: '资源ID，通常用于唯一标识控件',
  [FieldType.CONTENT_DESC]: '内容描述，用于无障碍功能',
  [FieldType.TEXT]: '元素文本内容',
  [FieldType.CLASS_NAME]: 'Android控件类名',
  [FieldType.CHILDREN_STRUCTURE]: '子元素的结构组成',
  [FieldType.BOUNDS]: '元素在屏幕上的位置和大小',
};

/**
 * 匹配模式显示名称映射
 */
export const MATCH_MODE_DISPLAY_NAMES: Record<MatchMode, string> = {
  [MatchMode.EXACT]: '精确匹配',
  [MatchMode.NON_EMPTY]: '非空匹配',
  [MatchMode.EMPTY]: '空值匹配',
  [MatchMode.STRUCTURE]: '结构匹配',
  [MatchMode.DISABLED]: '不匹配',
};

/**
 * 匹配模式描述映射
 */
export const MATCH_MODE_DESCRIPTIONS: Record<MatchMode, string> = {
  [MatchMode.EXACT]: '值必须完全相同',
  [MatchMode.NON_EMPTY]: '两个字段都非空即可',
  [MatchMode.EMPTY]: '两个字段都为空即可',
  [MatchMode.STRUCTURE]: '比较子元素的结构相似度',
  [MatchMode.DISABLED]: '不参与匹配评分',
};
