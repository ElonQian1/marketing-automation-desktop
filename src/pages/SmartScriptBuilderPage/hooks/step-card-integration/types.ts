// src/pages/SmartScriptBuilderPage/hooks/step-card-integration/types.ts
// module: pages | layer: hooks | role: types
// summary: 步骤卡片集成相关类型定义

import type { UIElement } from "../../../../api/universalUIAPI";

/**
 * 元素选择上下文
 * 用于在元素选择和步骤创建之间传递数据
 */
export interface ElementSelectionContext {
  snapshotId: string;
  elementPath: string;
  elementText?: string;
  elementBounds?: string;
  elementType?: string;
  // 🎯 完整XML快照信息
  xmlContent?: string;
  xmlHash?: string;
  // 🔥 indexPath 字段，确保结构匹配可用
  indexPath?: number[];
  keyAttributes?: Record<string, string>;
  // 🔥 关系锚点数据，传递给后端
  siblingTexts?: string[];
  parentElement?: {
    content_desc: string;
    text: string;
    resource_id: string;
  };
  childrenTexts?: string[];
  childrenContentDescs?: string[];
  // 🔥 原始UIElement - 用于策略配置
  originalUIElement?: UIElement;
  // 🎯 父子元素提取增强数据（内部使用）
  _enrichment?: ElementEnrichmentData;
}

/**
 * 元素增强数据
 * 从XML中提取的父子/兄弟元素信息
 */
export interface ElementEnrichmentData {
  parentContentDesc: string;
  childText: string | null;
  allChildTexts: string[];
  allChildContentDescs?: string[];
  siblingTexts?: string[];
  parentElement?: {
    content_desc: string;
    text: string;
    resource_id: string;
  };
}

/**
 * 智能匹配配置
 * 用于解决按钮识别混淆问题
 */
export interface SmartMatchingConfig {
  targetText: string;
  exclusionRules: string[];
  aliases: string[];
}
