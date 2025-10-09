/**
 * 稳定性分数计算器
 * 
 * @description 处理稳定性评估的分数计算和级别确定
 */

import type { StabilityLevel, StabilityFactors } from '../types';

/**
 * 稳定性分数权重配置
 */
export interface StabilityScoreWeights {
  deviceCompatibility: number;
  resolutionAdaptability: number;
  versionStability: number;
  layoutTolerance: number;
  elementAccuracy: number;
}

/**
 * 默认权重配置
 */
export const DEFAULT_STABILITY_WEIGHTS: StabilityScoreWeights = {
  deviceCompatibility: 0.25,
  resolutionAdaptability: 0.25,
  versionStability: 0.20,
  layoutTolerance: 0.15,
  elementAccuracy: 0.15
};

/**
 * 稳定性分数计算器
 */
export class StabilityScoreCalculator {
  private weights: StabilityScoreWeights;

  constructor(weights: StabilityScoreWeights = DEFAULT_STABILITY_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * 计算稳定性分数
   */
  calculateStabilityScore(factors: StabilityFactors): number {
    return Math.round(
      factors.deviceCompatibility * this.weights.deviceCompatibility * 100 +
      factors.resolutionAdaptability * this.weights.resolutionAdaptability * 100 +
      factors.versionStability * this.weights.versionStability * 100 +
      factors.layoutTolerance * this.weights.layoutTolerance * 100 +
      factors.elementAccuracy * this.weights.elementAccuracy * 100
    );
  }

  /**
   * 确定稳定性级别
   */
  determineStabilityLevel(score: number): StabilityLevel {
    if (score >= 90) return 'very-stable';
    if (score >= 75) return 'stable';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'unstable';
    return 'very-unstable';
  }

  /**
   * 获取分数级别描述
   */
  getStabilityLevelDescription(level: StabilityLevel): string {
    const descriptions = {
      'very-stable': '非常稳定 - 在各种环境下都能可靠工作',
      'stable': '稳定 - 在大多数环境下表现良好',
      'moderate': '中等 - 在某些条件下可能存在问题',
      'unstable': '不稳定 - 容易受环境变化影响',
      'very-unstable': '极不稳定 - 在多数环境下都可能失败'
    };
    return descriptions[level] || '未知级别';
  }

  /**
   * 获取当前权重配置
   */
  getWeights(): StabilityScoreWeights {
    return { ...this.weights };
  }

  /**
   * 更新权重配置
   */
  updateWeights(newWeights: Partial<StabilityScoreWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * 重置为默认权重
   */
  resetToDefaultWeights(): void {
    this.weights = { ...DEFAULT_STABILITY_WEIGHTS };
  }

  /**
   * 验证权重配置（总和应为1.0）
   */
  validateWeights(): boolean {
    const sum = Object.values(this.weights).reduce((acc, weight) => acc + weight, 0);
    return Math.abs(sum - 1.0) < 0.001; // 允许浮点数精度误差
  }
}

/**
 * 创建稳定性分数计算器
 */
export function createStabilityScoreCalculator(
  weights?: StabilityScoreWeights
): StabilityScoreCalculator {
  return new StabilityScoreCalculator(weights);
}

/**
 * 快速计算稳定性分数
 */
export function calculateStabilityScore(
  factors: StabilityFactors,
  weights?: StabilityScoreWeights
): number {
  const calculator = createStabilityScoreCalculator(weights);
  return calculator.calculateStabilityScore(factors);
}

/**
 * 快速确定稳定性级别
 */
export function determineStabilityLevel(
  score: number
): StabilityLevel {
  const calculator = createStabilityScoreCalculator();
  return calculator.determineStabilityLevel(score);
}