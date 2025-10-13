// 智能策略分析相关类型定义
// src/components/universal-ui/element-selection/types/StrategyAnalysis.ts

import type { UIElement } from '../../../../api/universalUIAPI';

export type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'failed';

export interface AnalysisProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  stepDescription: string;
}

export interface StrategyPerformance {
  speed: 'fast' | 'medium' | 'slow';
  stability: 'high' | 'medium' | 'low';
  crossDevice: 'excellent' | 'good' | 'fair';
}

export interface StrategyInfo {
  name: string;
  confidence: number;
  description: string;
  category: 'self-anchor' | 'child-driven' | 'region-scoped' | 'neighbor-relative' | 'index-fallback';
  performance: StrategyPerformance;
  pros: string[];
  cons: string[];
  scenarios: string[];
}

export interface AnalysisMetadata {
  totalTime: number;
  elementComplexity: 'simple' | 'medium' | 'complex';
  containerStability: number;
  textStability: number;
  selectionHash?: string; // 用于防串扰
}

export interface AnalysisResult {
  recommendedStrategy: StrategyInfo;
  alternatives: StrategyInfo[];
  analysisMetadata: AnalysisMetadata;
}

export interface StrategyAnalysisContext {
  element: UIElement;
  jobId?: string;
  stepId?: string;
  selectionHash?: string;
}