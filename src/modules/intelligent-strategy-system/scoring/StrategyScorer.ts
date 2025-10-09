/**
 * StrategyScorer.ts
 * 策略综合评分器
 * 
 * @description 整合所有评估维度，提供统一的策略评分接口
 */

import type {
  ComprehensiveStrategyScore,
  ComprehensiveScore,
  ScoreBreakdown,
  ScoringContext,
  ScoreComparison
} from './types';
import type { MatchStrategy } from '../types/StrategyTypes';
import { ScoreWeightConfigManager } from './ScoreWeightConfig';
import { PerformanceMetricsEvaluator } from './PerformanceMetrics';
import { StabilityAssessmentEvaluator } from './StabilityAssessment';

/**
 * 策略综合评分器
 * 
 * @description 作为评分系统的中央协调器，整合多维度评估结果
 */
export class StrategyScorer {
  private weightManager: ScoreWeightConfigManager;
  private performanceEvaluator: PerformanceMetricsEvaluator;
  private stabilityEvaluator: StabilityAssessmentEvaluator;
  private scoringHistory: ScoringHistoryRecord[] = [];

  constructor(weightManager?: ScoreWeightConfigManager) {
    this.weightManager = weightManager || new ScoreWeightConfigManager();
    this.performanceEvaluator = new PerformanceMetricsEvaluator();
    this.stabilityEvaluator = new StabilityAssessmentEvaluator();
  }

  /**
   * 综合评分单个策略
   */
  async scoreStrategy(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string,
    context: ScoringContext
  ): Promise<ComprehensiveStrategyScore> {
    
    const scoringSession = this.createScoringSession(strategy, context);
    
    try {
      // 并行执行各维度评估
      const [performanceResult, stabilityResult] = await Promise.all([
        this.performanceEvaluator.evaluatePerformance(strategy, element, xmlContent),
        this.stabilityEvaluator.evaluateStability(strategy, element, xmlContent, {
          deviceProfiles: context.deviceProfiles || [],
          resolutionProfiles: context.resolutionProfiles || [],
          appVersions: context.appVersions || []
        })
      ]);

      // 计算准确性和跨设备兼容性评分
      const accuracyScore = await this.calculateAccuracyScore(strategy, element, xmlContent, context);
      const crossDeviceScore = await this.calculateCrossDeviceScore(strategy, element, context);
      const maintainabilityScore = await this.calculateMaintainabilityScore(strategy, element, context);

      // 构建评分明细
      const breakdown: ScoreBreakdown = {
        performance: {
          score: performanceResult.score,
          level: performanceResult.level,
          details: performanceResult
        },
        stability: {
          score: stabilityResult.score,
          level: stabilityResult.level,
          details: stabilityResult
        },
        accuracy: {
          score: accuracyScore.score,
          level: accuracyScore.level,
          details: accuracyScore.details
        },
        crossDevice: {
          score: crossDeviceScore.score,
          level: crossDeviceScore.level,
          details: crossDeviceScore.details
        },
        maintainability: {
          score: maintainabilityScore.score,
          level: maintainabilityScore.level,
          details: maintainabilityScore.details
        }
      };

      // 计算综合分数
      const comprehensiveScore = this.calculateComprehensiveScore(breakdown);
      
      // 生成评分等级
      const scoreLevel = this.determineScoreLevel(comprehensiveScore.total);
      
      // 分析优缺点
      const strengths = this.identifyStrengths(breakdown);
      const weaknesses = this.identifyWeaknesses(breakdown);
      
      // 生成改进建议
      const recommendations = this.generateRecommendations(breakdown, strategy);

      const strategyScore: ComprehensiveStrategyScore = {
        strategy,
        overall: comprehensiveScore,
        breakdown,
        level: scoreLevel,
        strengths,
        weaknesses,
        recommendations,
        confidence: this.calculateConfidence(breakdown),
        metadata: {
          evaluatedAt: Date.now(),
          sessionId: scoringSession.id,
          context: this.summarizeContext(context)
        }
      };

      // 记录评分历史
      this.recordScoringResult(scoringSession, strategyScore);

      return strategyScore;

    } catch (error) {
      throw new Error(`策略评分失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量评分多个策略
   */
  async scoreMultipleStrategies(
    strategies: MatchStrategy[],
    element: any,
    xmlContent: string,
    context: ScoringContext
  ): Promise<ComprehensiveStrategyScore[]> {
    
    // 批量并行评分
    const scoringPromises = strategies.map(strategy =>
      this.scoreStrategy(strategy, element, xmlContent, context)
    );

    const scores = await Promise.all(scoringPromises);
    
    // 按综合分数排序
    const sortedScores = scores.sort((a, b) => b.overall.total - a.overall.total);
    
    return sortedScores;
  }

  /**
   * 获取最佳策略推荐
   */
  async getBestStrategyRecommendation(
    element: any,
    xmlContent: string,
    context: ScoringContext,
    candidateStrategies?: MatchStrategy[]
  ): Promise<ComprehensiveStrategyScore> {
    
    // 使用候选策略或默认策略集
    const strategies = candidateStrategies || this.getDefaultCandidateStrategies();
    
    const scores = await this.scoreMultipleStrategies(strategies, element, xmlContent, context);
    
    if (scores.length === 0) {
      throw new Error('没有可用的策略评分结果');
    }

    return scores[0]; // 已按分数排序，第一个是最佳策略
  }

  /**
   * 更新权重配置
   */
  updateWeightConfig(weights: Partial<any>): void {
    this.weightManager.setCustomWeights(weights);
  }

  /**
   * 获取当前权重配置
   */
  getCurrentWeights(): any {
    return this.weightManager.getCurrentConfig();
  }

  // === 私有方法：评分计算 ===

  /**
   * 计算综合分数
   */
  private calculateComprehensiveScore(breakdown: ScoreBreakdown): ComprehensiveScore {
    const weights = this.weightManager.getCurrentConfig();
    
    const weightedScores = {
      performance: breakdown.performance.score * weights.performance,
      stability: breakdown.stability.score * weights.stability,
      accuracy: breakdown.accuracy.score * weights.accuracy,
      crossDevice: breakdown.crossDevice.score * weights.crossDevice,
      maintainability: breakdown.maintainability.score * weights.maintainability
    };

    const total = Math.round(
      weightedScores.performance +
      weightedScores.stability +
      weightedScores.accuracy +
      weightedScores.crossDevice +
      weightedScores.maintainability
    );

    return {
      total,
      weighted: weightedScores,
      breakdown: {
        performance: breakdown.performance.score,
        stability: breakdown.stability.score,
        accuracy: breakdown.accuracy.score,
        crossDevice: breakdown.crossDevice.score,
        maintainability: breakdown.maintainability.score
      }
    };
  }

  /**
   * 计算准确性评分
   */
  private async calculateAccuracyScore(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string,
    context: ScoringContext
  ): Promise<ScoreDimension> {
    
    // 基于策略类型的基础准确性
    const baseAccuracy = this.getStrategyBaseAccuracy(strategy);
    
    const score = Math.max(0, Math.min(100, baseAccuracy));

    return {
      score: Math.round(score),
      level: this.getScoreLevel(score),
      details: {
        baseAccuracy,
        factors: this.getAccuracyFactors(strategy, element)
      }
    };
  }

  /**
   * 计算跨设备兼容性评分
   */
  private async calculateCrossDeviceScore(
    strategy: MatchStrategy,
    element: any,
    context: ScoringContext
  ): Promise<ScoreDimension> {
    
    const deviceProfiles = context.deviceProfiles || [];
    
    if (deviceProfiles.length === 0) {
      // 无设备信息时基于策略类型估算
      const estimatedScore = this.estimateCrossDeviceScore(strategy);
      return {
        score: estimatedScore,
        level: this.getScoreLevel(estimatedScore),
        details: {
          estimation: true,
          reason: '缺少设备配置信息，基于策略类型估算'
        }
      };
    }

    const score = this.estimateCrossDeviceScore(strategy);

    return {
      score: Math.round(score),
      level: this.getScoreLevel(score),
      details: {
        deviceCount: deviceProfiles.length
      }
    };
  }

  /**
   * 计算可维护性评分
   */
  private async calculateMaintainabilityScore(
    strategy: MatchStrategy,
    element: any,
    context: ScoringContext
  ): Promise<ScoreDimension> {
    
    // 策略固有可维护性
    const inherentMaintainability = this.getInherentMaintainability(strategy);
    
    const score = Math.round(inherentMaintainability);

    return {
      score,
      level: this.getScoreLevel(score),
      details: {
        inherentMaintainability,
        factors: this.getMaintainabilityFactors(strategy, element)
      }
    };
  }

  /**
   * 确定评分等级
   */
  private determineScoreLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * 识别优势
   */
  private identifyStrengths(breakdown: ScoreBreakdown): string[] {
    const strengths: string[] = [];
    const threshold = 80; // 优势阈值

    if (breakdown.performance.score >= threshold) {
      strengths.push('执行性能优秀');
    }
    if (breakdown.stability.score >= threshold) {
      strengths.push('稳定性表现良好');
    }
    if (breakdown.accuracy.score >= threshold) {
      strengths.push('定位准确性高');
    }
    if (breakdown.crossDevice.score >= threshold) {
      strengths.push('跨设备兼容性强');
    }
    if (breakdown.maintainability.score >= threshold) {
      strengths.push('维护成本低');
    }

    return strengths.length > 0 ? strengths : ['暂无突出优势'];
  }

  /**
   * 识别弱点
   */
  private identifyWeaknesses(breakdown: ScoreBreakdown): string[] {
    const weaknesses: string[] = [];
    const threshold = 60; // 弱点阈值

    if (breakdown.performance.score < threshold) {
      weaknesses.push('执行性能需要改进');
    }
    if (breakdown.stability.score < threshold) {
      weaknesses.push('稳定性有待提升');
    }
    if (breakdown.accuracy.score < threshold) {
      weaknesses.push('定位准确性不足');
    }
    if (breakdown.crossDevice.score < threshold) {
      weaknesses.push('跨设备兼容性较差');
    }
    if (breakdown.maintainability.score < threshold) {
      weaknesses.push('维护成本较高');
    }

    return weaknesses;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(breakdown: ScoreBreakdown, strategy: MatchStrategy): string[] {
    const recommendations: string[] = [];

    // 基于弱点生成建议
    if (breakdown.performance.score < 70) {
      recommendations.push('优化元素选择策略以提升执行效率');
      recommendations.push('考虑使用更快的定位方法');
    }

    if (breakdown.stability.score < 70) {
      recommendations.push('增加多重匹配机制提升稳定性');
      recommendations.push('建立版本兼容性监控');
    }

    if (breakdown.accuracy.score < 70) {
      recommendations.push('精细化元素特征选择');
      recommendations.push('增加唯一性验证');
    }

    if (breakdown.crossDevice.score < 70) {
      recommendations.push('采用设备无关的定位特征');
      recommendations.push('建立设备适配机制');
    }

    if (breakdown.maintainability.score < 70) {
      recommendations.push('简化定位逻辑降低维护成本');
      recommendations.push('建立自动化测试覆盖');
    }

    return recommendations.length > 0 ? recommendations : ['当前配置已较为优化'];
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(breakdown: ScoreBreakdown): number {
    // 基于评分方差计算置信度
    const scores = [
      breakdown.performance.score,
      breakdown.stability.score,
      breakdown.accuracy.score,
      breakdown.crossDevice.score,
      breakdown.maintainability.score
    ];

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // 标准差越小，置信度越高
    const confidence = Math.max(0.6, Math.min(1.0, 1 - (standardDeviation / 50)));
    
    return Math.round(confidence * 100) / 100;
  }

  // === 辅助方法 ===

  private createScoringSession(strategy: MatchStrategy, context: ScoringContext): ScoringSession {
    return {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategy,
      context,
      timestamp: Date.now()
    };
  }

  private recordScoringResult(session: ScoringSession, result: ComprehensiveStrategyScore): void {
    this.scoringHistory.push({
      session,
      result,
      timestamp: Date.now()
    });

    // 保持历史记录在合理范围内
    if (this.scoringHistory.length > 500) {
      this.scoringHistory = this.scoringHistory.slice(-250);
    }
  }

  private summarizeContext(context: ScoringContext): any {
    return {
      hasDeviceProfiles: (context.deviceProfiles?.length || 0) > 0,
      hasResolutionProfiles: (context.resolutionProfiles?.length || 0) > 0,
      hasAppVersions: (context.appVersions?.length || 0) > 0,
      environment: context.environment || 'unknown'
    };
  }

  private getDefaultCandidateStrategies(): MatchStrategy[] {
    return ['standard', 'strict', 'relaxed', 'positionless'];
  }

  // 简化实现的占位方法
  private getStrategyBaseAccuracy(strategy: MatchStrategy): number {
    const accuracyMap: Partial<Record<MatchStrategy, number>> = {
      'absolute': 95,
      'strict': 90,
      'standard': 85,
      'relaxed': 75,
      'positionless': 70
    };
    return accuracyMap[strategy] || 80;
  }

  private getScoreLevel(score: number): string { 
    return score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'; 
  }
  
  private getAccuracyFactors(strategy: MatchStrategy, element: any): string[] { 
    return []; 
  }
  
  private estimateCrossDeviceScore(strategy: MatchStrategy): number { 
    return 75; 
  }
  
  private getInherentMaintainability(strategy: MatchStrategy): number { 
    return 75; 
  }
  
  private getMaintainabilityFactors(strategy: MatchStrategy, element: any): string[] { 
    return []; 
  }
}

// === 辅助类型 ===

interface ScoringSession {
  id: string;
  strategy: MatchStrategy;
  context: ScoringContext;
  timestamp: number;
}

interface ScoringHistoryRecord {
  session: ScoringSession;
  result: ComprehensiveStrategyScore;
  timestamp: number;
}

interface ScoreDimension {
  score: number;
  level: string;
  details: any;
}

// === 便捷函数 ===

/**
 * 创建策略评分器
 */
export function createStrategyScorer(weightManager?: ScoreWeightConfigManager): StrategyScorer {
  return new StrategyScorer(weightManager);
}

/**
 * 快速策略评分
 */
export async function quickScoreStrategy(
  strategy: MatchStrategy,
  element: any,
  xmlContent: string = '',
  context: Partial<ScoringContext> = {}
): Promise<ComprehensiveStrategyScore> {
  const scorer = createStrategyScorer();
  const fullContext: ScoringContext = {
    deviceProfiles: [],
    resolutionProfiles: [],
    appVersions: [],
    ...context
  };
  
  return await scorer.scoreStrategy(strategy, element, xmlContent, fullContext);
}

/**
 * 快速获取最佳策略
 */
export async function quickGetBestStrategy(
  element: any,
  xmlContent: string = '',
  context: Partial<ScoringContext> = {},
  candidateStrategies?: MatchStrategy[]
): Promise<ComprehensiveStrategyScore> {
  const scorer = createStrategyScorer();
  const fullContext: ScoringContext = {
    deviceProfiles: [],
    resolutionProfiles: [],
    appVersions: [],
    ...context
  };
  
  return await scorer.getBestStrategyRecommendation(element, xmlContent, fullContext, candidateStrategies);
}