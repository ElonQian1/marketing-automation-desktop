// src/modules/intelligent-strategy-system/scoring/stability-assessment/types/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * StabilityAssessment 类型定义
 * 
 * @description 稳定性评估相关的所有类型定义
 */

import type { MatchStrategy } from '../../../types/StrategyTypes';
import type {
  StabilityAssessment,
  StabilityLevel,
  StabilityFactors
} from '../../types';

// === 评估上下文 ===

export interface StabilityEvaluationContext {
  deviceProfiles: DeviceProfile[];
  resolutionProfiles: ResolutionProfile[];
  appVersions: AppVersionProfile[];
  testEnvironment?: string;
}

// === 设备相关 ===

export interface DeviceProfile {
  name: string;
  manufacturer: string;
  model: string;
  screenSize: string;
  resolution: string;
  androidVersion: string;
  characteristics: string[];
}

export interface DeviceCompatibilityResult {
  device: string;
  isCompatible: boolean;
  compatibilityScore: number;
  issues: string[];
  recommendations: string[];
}

export interface DeviceCompatibilityReport {
  strategy: MatchStrategy;
  overallCompatibility: number;
  deviceResults: DeviceCompatibilityResult[];
  recommendedDevices: string[];
  problematicDevices: string[];
  optimizationSuggestions: string[];
}

// === 分辨率相关 ===

export interface ResolutionProfile {
  name: string;
  width: number;
  height: number;
  density: number;
  aspectRatio: string;
}

export interface ResolutionTestResult {
  resolution: string;
  isAdaptable: boolean;
  adaptabilityScore: number;
  scalingIssues: string[];
  recommendations: string[];
}

export interface ResolutionAdaptabilityReport {
  strategy: MatchStrategy;
  overallScore: number;
  adaptabilityLevel: string;
  resolutionResults: ResolutionTestResult[];
  criticalResolutions: string[];
  recommendations: string[];
}

// === 版本相关 ===

export interface AppVersionProfile {
  version: string;
  releaseDate: string;
  majorChanges: string[];
  uiChanges: string[];
}

export interface VersionTestResult {
  version: string;
  isStable: boolean;
  stabilityScore: number;
  changes: string[];
  recommendations: string[];
}

export interface VersionStabilityReport {
  strategy: MatchStrategy;
  overallStability: number;
  stabilityLevel: StabilityLevel;
  versionTests: VersionTestResult[];
  stabilityTrend: string;
  breakingChanges: string[];
  futureCompatibilityPrediction: string;
  recommendations: string[];
}

export interface VersionChange {
  type: string;
  description: string;
  impact: string;
}

// === 布局相关 ===

export interface LayoutVariation {
  name: string;
  description: string;
  changes: LayoutChange[];
}

export interface LayoutChange {
  type: 'position' | 'size' | 'style' | 'structure';
  target: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface LayoutToleranceResult {
  variation: string;
  toleranceScore: number;
  isRobust: boolean;
  sensitivities: string[];
}

export interface LayoutToleranceReport {
  strategy: MatchStrategy;
  overallTolerance: number;
  toleranceLevel: string;
  toleranceResults: LayoutToleranceResult[];
  sensitiveAreas: string[];
  robustnessFactors: any;
  recommendations: string[];
}

export interface LayoutSensitivity {
  overallSensitivity: number;
  sensitiveAreas: string[];
}

// === 历史记录相关 ===

export interface StabilityRecord {
  strategy: MatchStrategy;
  assessment: StabilityAssessment;
  context: StabilityEvaluationContext;
  timestamp: number;
}

export interface StabilityTrendAnalysis {
  averageStabilityScore: number;
  stabilityTrend: string;
  mostStableStrategy: MatchStrategy;
  leastStableStrategy: MatchStrategy;
  commonRiskFactors: string[];
  stabilityImprovements: string[];
  sampleSize: number;
  timeRange: number;
}

// 重新导出上级类型
export type {
  StabilityAssessment,
  StabilityLevel,
  StabilityFactors,
  MatchStrategy
};