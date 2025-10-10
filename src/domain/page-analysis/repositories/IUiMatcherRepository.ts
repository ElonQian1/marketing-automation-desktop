/**
 * UI 元素匹配仓储接口
 */

export type MatchStrategy = 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard' | 'hidden-element-parent' | 'xpath-direct';

export interface HiddenElementParentConfig {
  /** 是否启用隐藏元素的父容器策略 */
  enableParentDetection?: boolean;
  /** 向上查找父元素的最大层级数（默认：3） */
  maxParentLevels?: number;
  /** 期望的父容器类型/类名匹配列表 */
  expectedParentTypes?: string[];
  /** 是否优先选择可点击的父容器 */
  preferClickableParent?: boolean;
}

export interface MatchCriteriaDTO {
  strategy: MatchStrategy;
  fields: string[];
  values: Record<string, string>;
  /** 负向匹配：每字段一个字符串数组，表示"不包含"的词列表 */
  excludes?: Record<string, string[]>;
  /** 正向额外包含：每字段一个字符串数组，表示"必须包含"的词列表 */
  includes?: Record<string, string[]>;
  /** 每字段匹配模式：equals | contains | regex（前端使用camelCase） */
  matchMode?: Record<string, 'equals' | 'contains' | 'regex'>;
  /** 每字段"必须匹配"的正则（全部需满足，前端使用camelCase） */
  regexIncludes?: Record<string, string[]>;
  /** 每字段"不可匹配"的正则（任一命中即失败，前端使用camelCase） */
  regexExcludes?: Record<string, string[]>;
  /** 隐藏元素父容器配置 */
  hiddenElementParentConfig?: HiddenElementParentConfig;
}

export interface MatchPreview {
  text?: string;
  resource_id?: string;
  class_name?: string;
  package?: string;
  bounds?: string;
  xpath?: string;
}

export interface MatchResultDTO {
  ok: boolean;
  message: string;
  total?: number;
  matchedIndex?: number;
  preview?: MatchPreview;
}

export interface IUiMatcherRepository {
  matchByCriteria(deviceId: string, criteria: MatchCriteriaDTO): Promise<MatchResultDTO>;
}