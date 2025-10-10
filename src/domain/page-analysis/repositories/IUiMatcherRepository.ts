/**
 * UI 元素匹配仓储接口
 */

// 导入统一的策略类型定义
import type { MatchStrategy, MatchCriteria } from '../../../modules/intelligent-strategy-system/types/StrategyTypes';

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

// 使用统一的MatchCriteria类型作为DTO
export type MatchCriteriaDTO = MatchCriteria;

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