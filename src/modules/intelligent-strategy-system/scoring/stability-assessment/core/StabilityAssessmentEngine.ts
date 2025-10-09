/**
 * 稳定性评估核心引擎
 * 
 * @description 稳定性评估的主要引擎，协调各个分析器和计算器
 */

import type { MatchStrategy } from '../../../types/StrategyTypes';
import type {
  StabilityAssessment,
  StabilityLevel,
  StabilityFactors,
  StabilityEvaluationContext,
  StabilityRecord,
  StabilityTrendAnalysis,
  DeviceProfile,
  ResolutionProfile,
  AppVersionProfile,
  LayoutVariation,
  DeviceCompatibilityReport,
  ResolutionAdaptabilityReport,
  VersionStabilityReport,
  LayoutToleranceReport
} from '../types';

import { StabilityScoreCalculator } from '../calculators/StabilityScoreCalculator';
import { DeviceCompatibilityAnalyzer } from '../strategies/DeviceCompatibilityAnalyzer';
import { ResolutionAdaptabilityAnalyzer } from '../strategies/ResolutionAdaptabilityAnalyzer';
import { RiskAssessmentEngine } from '../utils/RiskAssessmentEngine';
import { RecommendationGenerator } from '../utils/RecommendationGenerator';

/**
 * 稳定性评估引擎
 */
export class StabilityAssessmentEngine {
  private scoreCalculator: StabilityScoreCalculator;
  private deviceAnalyzer: DeviceCompatibilityAnalyzer;
  private resolutionAnalyzer: ResolutionAdaptabilityAnalyzer;
  private riskEngine: RiskAssessmentEngine;
  private recommendationGenerator: RecommendationGenerator;
  private assessmentHistory: StabilityRecord[] = [];

  constructor() {
    this.scoreCalculator = new StabilityScoreCalculator();
    this.deviceAnalyzer = new DeviceCompatibilityAnalyzer();
    this.resolutionAnalyzer = new ResolutionAdaptabilityAnalyzer();
    this.riskEngine = new RiskAssessmentEngine();
    this.recommendationGenerator = new RecommendationGenerator();
  }

  /**
   * 综合稳定性评估
   * 
   * @description 评估策略在给定上下文中的整体稳定性
   */
  async evaluateStability(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string,
    context: StabilityEvaluationContext
  ): Promise<StabilityAssessment> {
    
    // 分析各个稳定性因素
    const factors = await this.analyzeStabilityFactors(strategy, element, xmlContent, context);
    
    // 计算总体稳定性分数
    const score = this.scoreCalculator.calculateStabilityScore(factors);
    
    // 确定稳定性级别
    const level = this.scoreCalculator.determineStabilityLevel(score);
    
    // 识别风险因素
    const risks = await this.riskEngine.identifyRiskFactors(factors, strategy, element);
    
    // 生成改进建议
    const recommendations = await this.recommendationGenerator.generateRecommendations(
      factors, risks, strategy, element
    );

    const assessment: StabilityAssessment = {
      level,
      score,
      factors,
      risks,
      recommendations
    };

    // 记录评估历史
    this.recordAssessment(strategy, assessment, context);

    return assessment;
  }

  /**
   * 设备兼容性专项评估
   */
  async evaluateDeviceCompatibility(
    strategy: MatchStrategy,
    element: any,
    targetDevices: DeviceProfile[]
  ): Promise<DeviceCompatibilityReport> {
    return await this.deviceAnalyzer.generateCompatibilityReport(strategy, element, targetDevices);
  }

  /**
   * 分辨率适应性评估
   */
  async evaluateResolutionAdaptability(
    strategy: MatchStrategy,
    element: any,
    resolutions: ResolutionProfile[]
  ): Promise<ResolutionAdaptabilityReport> {
    return await this.resolutionAnalyzer.generateAdaptabilityReport(strategy, element, resolutions);
  }

  /**
   * 获取稳定性历史趋势
   */
  getStabilityTrends(
    strategy?: MatchStrategy,
    timeRange?: number
  ): StabilityTrendAnalysis {
    const cutoffTime = timeRange ? Date.now() - timeRange : 0;
    let relevantHistory = this.assessmentHistory.filter(
      record => record.timestamp > cutoffTime
    );

    if (strategy) {
      relevantHistory = relevantHistory.filter(record => record.strategy === strategy);
    }

    if (relevantHistory.length === 0) {
      return this.createEmptyTrendAnalysis();
    }

    return {
      averageStabilityScore: this.calculateAverageScore(relevantHistory),
      stabilityTrend: this.calculateTrendDirection(relevantHistory),
      mostStableStrategy: this.findMostStableStrategy(relevantHistory),
      leastStableStrategy: this.findLeastStableStrategy(relevantHistory),
      commonRiskFactors: this.analyzeCommonRiskFactors(relevantHistory),
      stabilityImprovements: this.identifyImprovements(relevantHistory),
      sampleSize: relevantHistory.length,
      timeRange: timeRange || (Date.now() - relevantHistory[0].timestamp)
    };
  }

  // === 私有方法 ===

  /**
   * 分析稳定性因素
   */
  private async analyzeStabilityFactors(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string,
    context: StabilityEvaluationContext
  ): Promise<StabilityFactors> {
    
    const [
      deviceCompatibility,
      resolutionAdaptability,
      versionStability,
      layoutTolerance,
      elementAccuracy
    ] = await Promise.all([
      this.deviceAnalyzer.analyzeDeviceCompatibility(strategy, element, context.deviceProfiles || []),
      this.resolutionAnalyzer.analyzeResolutionAdaptability(strategy, element, context.resolutionProfiles || []),
      this.analyzeVersionStability(strategy, element, context.appVersions || []),
      this.analyzeLayoutTolerance(strategy, element, xmlContent),
      this.analyzeElementAccuracy(strategy, element)
    ]);

    return {
      deviceCompatibility,
      resolutionAdaptability,
      versionStability,
      layoutTolerance,
      elementAccuracy
    };
  }

  private async analyzeVersionStability(
    strategy: MatchStrategy,
    element: any,
    appVersions: AppVersionProfile[]
  ): Promise<number> {
    if (!appVersions || appVersions.length === 0) {
      return 0.7; // 默认中等稳定性
    }

    // 简化版本分析，实际实现可以更复杂
    const hasBreakingChanges = appVersions.some(version => 
      version.majorChanges.some(change => 
        change.includes('UI') || change.includes('layout')
      )
    );

    return hasBreakingChanges ? 0.5 : 0.8;
  }

  private async analyzeLayoutTolerance(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string
  ): Promise<number> {
    // 基于策略类型的布局容忍度评估
    const strategyTolerance = {
      'absolute': 0.3,
      'strict': 0.6,
      'relaxed': 0.8,
      'positionless': 0.9,
      'standard': 0.85
    };

    return strategyTolerance[strategy] || 0.5;
  }

  private async analyzeElementAccuracy(
    strategy: MatchStrategy,
    element: any
  ): Promise<number> {
    if (!element) return 0.3;

    let accuracy = 0.5;

    // 检查元素特征的完整性
    if (element['resource-id']) accuracy += 0.25;
    if (element.text && element.text.trim()) accuracy += 0.15;
    if (element['content-desc']) accuracy += 0.1;

    return Math.min(1.0, accuracy);
  }

  private recordAssessment(
    strategy: MatchStrategy,
    assessment: StabilityAssessment,
    context: StabilityEvaluationContext
  ): void {
    const record: StabilityRecord = {
      strategy,
      assessment,
      context,
      timestamp: Date.now()
    };

    this.assessmentHistory.push(record);

    // 保持历史记录数量在合理范围内
    if (this.assessmentHistory.length > 1000) {
      this.assessmentHistory = this.assessmentHistory.slice(-800);
    }
  }

  private createEmptyTrendAnalysis(): StabilityTrendAnalysis {
    return {
      averageStabilityScore: 0,
      stabilityTrend: 'no-data',
      mostStableStrategy: 'standard',
      leastStableStrategy: 'absolute',
      commonRiskFactors: [],
      stabilityImprovements: [],
      sampleSize: 0,
      timeRange: 0
    };
  }

  private calculateAverageScore(history: StabilityRecord[]): number {
    const sum = history.reduce((acc, record) => acc + record.assessment.score, 0);
    return Math.round(sum / history.length);
  }

  private calculateTrendDirection(history: StabilityRecord[]): string {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);
    
    if (older.length === 0) return 'insufficient-data';
    
    const recentAvg = recent.reduce((acc, r) => acc + r.assessment.score, 0) / recent.length;
    const olderAvg = older.reduce((acc, r) => acc + r.assessment.score, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private findMostStableStrategy(history: StabilityRecord[]): MatchStrategy {
    const strategyScores: { [key: string]: number[] } = {};
    
    history.forEach(record => {
      if (!strategyScores[record.strategy]) {
        strategyScores[record.strategy] = [];
      }
      strategyScores[record.strategy].push(record.assessment.score);
    });

    let bestStrategy: MatchStrategy = 'standard';
    let bestScore = 0;

    Object.entries(strategyScores).forEach(([strategy, scores]) => {
      const avgScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestStrategy = strategy as MatchStrategy;
      }
    });

    return bestStrategy;
  }

  private findLeastStableStrategy(history: StabilityRecord[]): MatchStrategy {
    const strategyScores: { [key: string]: number[] } = {};
    
    history.forEach(record => {
      if (!strategyScores[record.strategy]) {
        strategyScores[record.strategy] = [];
      }
      strategyScores[record.strategy].push(record.assessment.score);
    });

    let worstStrategy: MatchStrategy = 'absolute';
    let worstScore = 100;

    Object.entries(strategyScores).forEach(([strategy, scores]) => {
      const avgScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;
      if (avgScore < worstScore) {
        worstScore = avgScore;
        worstStrategy = strategy as MatchStrategy;
      }
    });

    return worstStrategy;
  }

  private analyzeCommonRiskFactors(history: StabilityRecord[]): string[] {
    const riskCounts: { [risk: string]: number } = {};
    
    history.forEach(record => {
      record.assessment.risks.forEach(risk => {
        riskCounts[risk] = (riskCounts[risk] || 0) + 1;
      });
    });

    return Object.entries(riskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([risk]) => risk);
  }

  private identifyImprovements(history: StabilityRecord[]): string[] {
    // 简化实现：基于趋势分析返回改进建议
    const trend = this.calculateTrendDirection(history);
    
    if (trend === 'improving') {
      return ['策略优化显示正面效果', '继续当前优化方向'];
    } else if (trend === 'declining') {
      return ['需要重新评估策略选择', '考虑更稳定的匹配方式'];
    }
    
    return ['保持当前策略', '定期监控稳定性变化'];
  }
}