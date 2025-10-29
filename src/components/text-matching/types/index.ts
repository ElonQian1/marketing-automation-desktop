// src/components/text-matching/types/index.ts
// module: text-matching | layer: types | role: 类型定义
// summary: 文本匹配模块的所有类型定义

export type TextMatchingMode = 'exact' | 'partial';

export interface TextMatchingConfig {
  enabled: boolean;
  mode: TextMatchingMode;
  antonymCheckEnabled: boolean;
  semanticAnalysisEnabled: boolean;
  partialMatchThreshold: number;
  description?: string;
}

export interface TextMatchingStepConfig extends TextMatchingConfig {
  stepId: string;
  inheritFromGlobal: boolean;
}

export interface AntonymPair {
  id: string;
  positive: string;
  negative: string;
  category?: string;
  confidence?: number;
  enabled: boolean;
  description?: string;
}