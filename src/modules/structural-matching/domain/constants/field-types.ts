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
  
  /** Clickable (可点击) */
  CLICKABLE = 'clickable',
  
  /** Enabled (启用状态) */
  ENABLED = 'enabled',
  
  /** Focusable (可获得焦点) */
  FOCUSABLE = 'focusable',
  
  /** Focused (已获得焦点) */
  FOCUSED = 'focused',
  
  /** Scrollable (可滚动) */
  SCROLLABLE = 'scrollable',
  
  /** Long-Clickable (长按可点击) */
  LONG_CLICKABLE = 'long_clickable',
  
  /** Checkable (可检查) */
  CHECKABLE = 'checkable',
  
  /** Checked (已检查) */
  CHECKED = 'checked',
  
  /** Selected (选中状态) */
  SELECTED = 'selected',
  
  /** Password (密码字段) */
  PASSWORD = 'password',
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
  [FieldType.CLICKABLE]: 'Clickable',
  [FieldType.ENABLED]: 'Enabled',
  [FieldType.FOCUSABLE]: 'Focusable',
  [FieldType.FOCUSED]: 'Focused',
  [FieldType.SCROLLABLE]: 'Scrollable',
  [FieldType.LONG_CLICKABLE]: 'Long-Clickable',
  [FieldType.CHECKABLE]: 'Checkable',
  [FieldType.CHECKED]: 'Checked',
  [FieldType.SELECTED]: 'Selected',
  [FieldType.PASSWORD]: 'Password',
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
  [FieldType.CLICKABLE]: '元素是否可点击',
  [FieldType.ENABLED]: '元素是否启用',
  [FieldType.FOCUSABLE]: '元素是否可获得焦点',
  [FieldType.FOCUSED]: '元素是否已获得焦点',
  [FieldType.SCROLLABLE]: '元素是否可滚动',
  [FieldType.LONG_CLICKABLE]: '元素是否支持长按',
  [FieldType.CHECKABLE]: '元素是否可检查',
  [FieldType.CHECKED]: '元素是否已检查',
  [FieldType.SELECTED]: '元素是否已选中',
  [FieldType.PASSWORD]: '元素是否为密码字段',
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
