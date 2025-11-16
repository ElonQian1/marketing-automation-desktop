// src/components/universal-ui/strategy-selector/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 统一策略选择器类型定义
 * 合并了新版和旧版的所有功能
 */

import type { ReactNode } from 'react';

// 策略类型 (合并新旧版本的所有策略)
export type MatchStrategy = 
  // XPath 策略组 (新版)
  | 'xpath-direct'
  | 'xpath-first-index' 
  | 'xpath-all-elements'
  // 传统策略组
  | 'absolute'
  | 'strict'
  | 'relaxed'
  | 'positionless'
  | 'standard'
  // 特殊策略组
  | 'hidden-element-parent'
  | 'custom'
  // 智能策略系统核心
  | 'intelligent'           // 智能匹配（多策略级联）
  | 'a11y'                  // 无障碍匹配（文本和描述）
  | 'bounds_near'           // 邻域匹配（坐标范围）
  | 'xpath_fuzzy'           // XPath模糊匹配
  // 智能策略系统新增
  | 'self-anchor'
  | 'child-anchor'
  | 'parent-clickable'
  | 'region-scoped'
  | 'neighbor-relative'
  | 'index-fallback';

// 匹配条件 (基于旧版扩展)
export interface MatchCriteria {
  strategy: MatchStrategy;
  fields: string[];
  values: Record<string, string>;
  includes?: Record<string, string[]>;
  excludes?: Record<string, string[]>;
}

// UI元素接口 (用于自动填充)
export interface UIElement {
  text?: string;
  resourceId?: string;
  contentDesc?: string;
  className?: string;
  type?: string;
  package?: string;
  bounds?: { left: number; top: number; right: number; bottom: number };
  index?: number;
  [key: string]: any;
}

// 策略评分信息 (新版功能)
export interface StrategyScoreInfo {
  score: number;
  isRecommended?: boolean;
  reason?: string;
}

// 策略选项配置
export interface StrategyOption {
  value: MatchStrategy;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
  category: 'xpath' | 'traditional' | 'special' | 'intelligent';
}

// 可用字段配置
export interface FieldConfig {
  name: string;
  label: string;
  description: string;
  isCore: boolean;
}

// 组件显示模式
export type DisplayMode = 
  | 'full'        // 完整模式：所有功能
  | 'compact'     // 紧凑模式：简化UI但保留功能
  | 'simple'      // 简单模式：仅策略选择按钮
  | 'minimal';    // 最小模式：最基础的选择

// 主组件Props
export interface UnifiedStrategyConfiguratorProps {
  // === 核心功能 ===
  /** 当前匹配条件 */
  matchCriteria: MatchCriteria | null;
  /** 匹配条件变化回调 */
  onChange: (criteria: MatchCriteria) => void;
  /** 刷新所有评分回调 */
  onRefreshScores?: () => void | Promise<void>;
  
  // === 显示控制 ===
  /** 显示模式 */
  mode?: DisplayMode;
  /** 自定义类名 */
  className?: string;
  /** 是否显示为Card容器 */
  showCard?: boolean;
  
  // === 功能开关 ===
  /** 是否显示字段配置 */
  showFieldConfig?: boolean;
  /** 是否显示字段值配置 */
  showValueConfig?: boolean;
  /** 是否显示包含/排除条件 */
  showIncludeExclude?: boolean;
  /** 是否显示自动填充 */
  showAutoFill?: boolean;
  /** 是否显示测试按钮 */
  showTestButton?: boolean;
  /** 是否显示策略说明 */
  showDescription?: boolean;
  
  // === 评分和推荐 (新版功能) ===
  /** 策略评分信息 */
  strategyScores?: Record<string, StrategyScoreInfo>;
  /** 是否显示评分徽章 */
  showScores?: boolean;
  /** 推荐的策略 */
  recommendedStrategy?: MatchStrategy;
  
  // === 自动填充 (旧版功能) ===
  /** 参考元素（用于自动填充字段值） */
  referenceElement?: UIElement | null;
  
  // === 回调函数 ===
  /** 测试匹配回调 */
  onTestMatch?: (criteria: MatchCriteria) => void;
  /** 策略变化回调 */
  onStrategyChange?: (strategy: MatchStrategy) => void;
  /** 自动填充回调 */
  onAutoFill?: () => void;
}