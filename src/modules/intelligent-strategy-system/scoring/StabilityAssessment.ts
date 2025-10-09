/**
 * StabilityAssessment.ts
 * 稳定性评估模块
 * 
 * @description 提供策略在不同环境和条件下的稳定性全面评估
 */

import type {
  StabilityAssessment,
  StabilityLevel,
  StabilityFactors
} from './types';
import type { MatchStrategy } from '../types/StrategyTypes';

/**
 * 稳定性评估器
 * 
 * @description 评估策略在跨设备、跨版本、布局变化等场景下的稳定性
 */
export class StabilityAssessmentEvaluator {
  private assessmentHistory: StabilityRecord[] = [];
  private deviceCompatibilityDatabase: DeviceCompatibilityDB;
  private versionStabilityAnalyzer: VersionStabilityAnalyzer;
  private layoutToleranceAnalyzer: LayoutToleranceAnalyzer;

  constructor() {
    this.deviceCompatibilityDatabase = new DeviceCompatibilityDB();
    this.versionStabilityAnalyzer = new VersionStabilityAnalyzer();
    this.layoutToleranceAnalyzer = new LayoutToleranceAnalyzer();
  }

  /**
   * 综合稳定性评估
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
    const score = this.calculateStabilityScore(factors);
    
    // 确定稳定性级别
    const level = this.determineStabilityLevel(score);
    
    // 识别风险因素
    const risks = this.identifyRiskFactors(factors, strategy);
    
    // 生成改进建议
    const recommendations = this.generateRecommendations(factors, risks, strategy);

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
    const results: DeviceCompatibilityResult[] = [];

    for (const device of targetDevices) {
      const compatibility = await this.assessDeviceCompatibility(strategy, element, device);
      results.push(compatibility);
    }

    return {
      strategy,
      overallCompatibility: this.calculateOverallCompatibility(results),
      deviceResults: results,
      recommendedDevices: this.getRecommendedDevices(results),
      problematicDevices: this.getProblematicDevices(results),
      optimizationSuggestions: this.generateDeviceOptimizations(results)
    };
  }

  /**
   * 分辨率适应性评估
   */
  async evaluateResolutionAdaptability(
    strategy: MatchStrategy,
    element: any,
    resolutions: ResolutionProfile[]
  ): Promise<ResolutionAdaptabilityReport> {
    const results: ResolutionTestResult[] = [];

    for (const resolution of resolutions) {
      const adaptability = await this.testResolutionAdaptability(strategy, element, resolution);
      results.push(adaptability);
    }

    const overallScore = this.calculateResolutionScore(results);
    const criticalResolutions = this.identifyCriticalResolutions(results);

    return {
      strategy,
      overallScore,
      adaptabilityLevel: this.determineAdaptabilityLevel(overallScore),
      resolutionResults: results,
      criticalResolutions,
      recommendations: this.generateResolutionRecommendations(results)
    };
  }

  /**
   * 版本稳定性评估
   */
  async evaluateVersionStability(
    strategy: MatchStrategy,
    element: any,
    versions: AppVersionProfile[]
  ): Promise<VersionStabilityReport> {
    const versionTests = await Promise.all(
      versions.map(version => this.testVersionCompatibility(strategy, element, version))
    );

    const stabilityTrend = this.analyzeVersionTrend(versionTests);
    const breakingChanges = this.identifyBreakingChanges(versionTests);
    const stabilityScore = this.calculateVersionStabilityScore(versionTests);

    return {
      strategy,
      overallStability: stabilityScore,
      stabilityLevel: this.determineStabilityLevel(stabilityScore),
      versionTests,
      stabilityTrend,
      breakingChanges,
      futureCompatibilityPrediction: this.predictFutureCompatibility(stabilityTrend),
      recommendations: this.generateVersionRecommendations(versionTests, breakingChanges)
    };
  }

  /**
   * 布局变化容忍度评估
   */
  async evaluateLayoutTolerance(
    strategy: MatchStrategy,
    element: any,
    layoutVariations: LayoutVariation[]
  ): Promise<LayoutToleranceReport> {
    const toleranceResults: LayoutToleranceResult[] = [];

    for (const variation of layoutVariations) {
      const tolerance = await this.testLayoutTolerance(strategy, element, variation);
      toleranceResults.push(tolerance);
    }

    const overallTolerance = this.calculateOverallTolerance(toleranceResults);
    const sensitiveAreas = this.identifySensitiveAreas(toleranceResults);

    return {
      strategy,
      overallTolerance,
      toleranceLevel: this.determineToleranceLevel(overallTolerance),
      toleranceResults,
      sensitiveAreas,
      robustnessFactors: this.analyzeRobustnessFactors(toleranceResults),
      recommendations: this.generateLayoutRecommendations(toleranceResults, sensitiveAreas)
    };
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

  // === 私有方法：稳定性因素分析 ===

  /**
   * 分析稳定性因素
   */
  private async analyzeStabilityFactors(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string,
    context: StabilityEvaluationContext
  ): Promise<StabilityFactors> {
    
    const deviceCompatibility = await this.analyzeDeviceCompatibility(strategy, element, context.deviceProfiles);
    const resolutionAdaptability = await this.analyzeResolutionAdaptability(strategy, element, context.resolutionProfiles);
    const versionStability = await this.analyzeVersionStability(strategy, element, context.appVersions);
    const layoutTolerance = await this.analyzeLayoutTolerance(strategy, element, xmlContent);
    const elementAccuracy = await this.analyzeElementAccuracy(strategy, element, xmlContent);

    return {
      deviceCompatibility,
      resolutionAdaptability,
      versionStability,
      layoutTolerance,
      elementAccuracy
    };
  }

  /**
   * 设备兼容性分析
   */
  private async analyzeDeviceCompatibility(
    strategy: MatchStrategy,
    element: any,
    deviceProfiles: DeviceProfile[]
  ): Promise<number> {
    if (!deviceProfiles || deviceProfiles.length === 0) {
      return 0.5; // 默认中等兼容性
    }

    const compatibilityResults = await Promise.all(
      deviceProfiles.map(device => this.assessDeviceCompatibility(strategy, element, device))
    );

    const compatibleDevices = compatibilityResults.filter(result => result.isCompatible).length;
    return compatibleDevices / deviceProfiles.length;
  }

  /**
   * 分辨率适应性分析
   */
  private async analyzeResolutionAdaptability(
    strategy: MatchStrategy,
    element: any,
    resolutionProfiles: ResolutionProfile[]
  ): Promise<number> {
    if (!resolutionProfiles || resolutionProfiles.length === 0) {
      return this.getDefaultResolutionScore(strategy);
    }

    const adaptabilityResults = await Promise.all(
      resolutionProfiles.map(resolution => this.testResolutionAdaptability(strategy, element, resolution))
    );

    const adaptableResolutions = adaptabilityResults.filter(result => result.isAdaptable).length;
    return adaptableResolutions / resolutionProfiles.length;
  }

  /**
   * 版本稳定性分析
   */
  private async analyzeVersionStability(
    strategy: MatchStrategy,
    element: any,
    appVersions: AppVersionProfile[]
  ): Promise<number> {
    if (!appVersions || appVersions.length === 0) {
      return this.getDefaultVersionStability(strategy);
    }

    const versionTests = await Promise.all(
      appVersions.map(version => this.testVersionCompatibility(strategy, element, version))
    );

    const stableVersions = versionTests.filter(test => test.isStable).length;
    const baseScore = stableVersions / appVersions.length;

    // 考虑版本跨度的影响
    const versionSpanPenalty = this.calculateVersionSpanPenalty(appVersions);
    
    return Math.max(0, baseScore - versionSpanPenalty);
  }

  /**
   * 布局容忍度分析
   */
  private async analyzeLayoutTolerance(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string
  ): Promise<number> {
    // 基于策略类型的基础容忍度
    const baseScore = this.getStrategyLayoutTolerance(strategy);
    
    // 元素特征分析
    const elementFeatures = this.analyzeElementFeatures(element);
    const featureBonus = this.calculateFeatureBonus(elementFeatures, strategy);
    
    // XML结构复杂度分析
    const complexityPenalty = this.analyzeXmlComplexity(xmlContent);
    
    return Math.min(1, Math.max(0, baseScore + featureBonus - complexityPenalty));
  }

  /**
   * 元素定位准确性分析
   */
  private async analyzeElementAccuracy(
    strategy: MatchStrategy,
    element: any,
    xmlContent: string
  ): Promise<number> {
    // 策略固有准确性
    const strategyAccuracy = this.getStrategyAccuracy(strategy);
    
    // 元素唯一性分析
    const uniquenessScore = this.analyzeElementUniqueness(element, xmlContent);
    
    // 定位稳定性分析
    const stabilityScore = this.analyzePositionStability(element, strategy);
    
    // 加权计算
    return strategyAccuracy * 0.4 + uniquenessScore * 0.4 + stabilityScore * 0.2;
  }

  /**
   * 计算稳定性分数
   */
  private calculateStabilityScore(factors: StabilityFactors): number {
    const weights = {
      deviceCompatibility: 0.25,
      resolutionAdaptability: 0.25,
      versionStability: 0.20,
      layoutTolerance: 0.15,
      elementAccuracy: 0.15
    };

    return Math.round(
      factors.deviceCompatibility * weights.deviceCompatibility * 100 +
      factors.resolutionAdaptability * weights.resolutionAdaptability * 100 +
      factors.versionStability * weights.versionStability * 100 +
      factors.layoutTolerance * weights.layoutTolerance * 100 +
      factors.elementAccuracy * weights.elementAccuracy * 100
    );
  }

  /**
   * 确定稳定性级别
   */
  private determineStabilityLevel(score: number): StabilityLevel {
    if (score >= 90) return 'very-stable';
    if (score >= 75) return 'stable';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'unstable';
    return 'very-unstable';
  }

  /**
   * 识别风险因素
   */
  private identifyRiskFactors(factors: StabilityFactors, strategy: MatchStrategy): string[] {
    const risks: string[] = [];

    if (factors.deviceCompatibility < 0.7) {
      risks.push('设备兼容性较低，可能在某些设备上失败');
    }

    if (factors.resolutionAdaptability < 0.6) {
      risks.push('分辨率适应性不足，可能在非标准分辨率下失效');
    }

    if (factors.versionStability < 0.8) {
      risks.push('版本稳定性风险，应用更新可能导致失效');
    }

    if (factors.layoutTolerance < 0.5) {
      risks.push('布局变化敏感，UI微调可能影响定位');
    }

    if (factors.elementAccuracy < 0.7) {
      risks.push('元素定位准确性有待提高');
    }

    // 策略特定风险
    risks.push(...this.getStrategySpecificRisks(strategy, factors));

    return risks;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(
    factors: StabilityFactors,
    risks: string[],
    strategy: MatchStrategy
  ): string[] {
    const recommendations: string[] = [];

    if (factors.deviceCompatibility < 0.7) {
      recommendations.push('建议增加设备特定的适配逻辑');
      recommendations.push('考虑使用更通用的元素识别特征');
    }

    if (factors.resolutionAdaptability < 0.6) {
      recommendations.push('采用相对定位替代绝对坐标');
      recommendations.push('增加分辨率归一化处理');
    }

    if (factors.versionStability < 0.8) {
      recommendations.push('定期更新元素识别规则');
      recommendations.push('建立版本变化监控机制');
    }

    if (factors.layoutTolerance < 0.5) {
      recommendations.push('优化元素选择策略，减少对布局的依赖');
      recommendations.push('增加多重匹配机制');
    }

    // 策略特定建议
    recommendations.push(...this.getStrategySpecificRecommendations(strategy, factors));

    return recommendations;
  }

  // === 辅助方法 ===

  /**
   * 获取策略特定风险
   */
  private getStrategySpecificRisks(strategy: MatchStrategy, factors: StabilityFactors): string[] {
    const strategyRisks: Partial<Record<MatchStrategy, string[]>> = {
      'absolute': [
        '绝对定位对屏幕尺寸变化极其敏感',
        '设备适配性最差，不建议跨设备使用'
      ],
      'strict': [
        '严格匹配可能因细微变化失效',
        '对元素属性变化容忍度低'
      ],
      'relaxed': [
        '宽松匹配可能导致误匹配',
        '准确性与稳定性需要平衡'
      ],
      'positionless': [
        '完全忽略位置可能导致多重匹配',
        '需要确保其他特征足够唯一'
      ],
      'standard': [
        '标准匹配在复杂布局中可能不够精确',
        '需要组合多种识别特征'
      ],
      'custom': [
        '自定义策略的稳定性取决于具体实现',
        '需要充分测试各种边界条件'
      ],
      'xpath-direct': [
        'XPath路径对DOM结构变化敏感',
        '元素层级调整可能导致失效'
      ],
      'xpath-first-index': [
        '索引匹配对元素顺序变化敏感',
        '动态内容可能影响索引稳定性'
      ],
      'xpath-all-elements': [
        '批量匹配可能导致性能问题',
        '需要确保匹配结果的一致性'
      ],
      'hidden-element-parent': [
        '隐藏元素查找可能不稳定',
        '依赖父容器结构变化敏感'
      ],
      'self-anchor': [
        '自我锚点可能因元素自身变化失效',
        '需要确保锚点特征的稳定性'
      ],
      'child-anchor': [
        '子节点锚点对层级结构变化敏感',
        '子元素动态更新可能影响定位'
      ],
      'parent-clickable': [
        '父节点可点击性可能因权限变化',
        '事件冒泡机制可能不稳定'
      ],
      'region-scoped': [
        '区域限定对布局变化敏感',
        '需要确保区域边界的准确性'
      ],
      'neighbor-relative': [
        '邻居元素位置变化影响定位准确性',
        '相对定位对布局重排敏感'
      ],
      'index-fallback': [
        '索引兜底策略准确性有限',
        '应仅作为最后备选方案'
      ]
    };

    return strategyRisks[strategy] || [];
  }

  /**
   * 获取策略特定建议
   */
  private getStrategySpecificRecommendations(strategy: MatchStrategy, factors: StabilityFactors): string[] {
    const strategyRecommendations: Partial<Record<MatchStrategy, string[]>> = {
      'absolute': [
        '考虑切换到相对定位策略',
        '如必须使用，请限制在单一设备类型'
      ],
      'strict': [
        '可考虑适度放宽匹配条件',
        '增加备用匹配策略'
      ],
      'relaxed': [
        '增加唯一性验证机制',
        '设置合理的相似度阈值'
      ],
      'positionless': [
        '强化其他识别特征',
        '增加元素上下文验证'
      ],
      'standard': [
        '这是推荐的默认策略',
        '可根据具体场景微调'
      ],
      'custom': [
        '仔细测试自定义实现的边界情况',
        '建立完善的错误处理机制'
      ],
      'xpath-direct': [
        '考虑使用更稳定的元素特征',
        '建立XPath更新机制'
      ],
      'xpath-first-index': [
        '避免依赖动态内容的索引',
        '考虑使用相对索引'
      ],
      'xpath-all-elements': [
        '优化匹配条件减少结果集',
        '增加结果排序和优选逻辑'
      ],
      'hidden-element-parent': [
        '增加可见性验证机制',
        '建立父容器稳定性检查'
      ],
      'self-anchor': [
        '选择稳定的自身特征作为锚点',
        '增加锚点有效性验证'
      ],
      'child-anchor': [
        '选择相对稳定的子元素',
        '建立层级变化监控'
      ],
      'parent-clickable': [
        '验证父元素的交互能力',
        '增加权限检查机制'
      ],
      'region-scoped': [
        '确保区域边界的准确定义',
        '增加区域有效性验证'
      ],
      'neighbor-relative': [
        '选择稳定的邻居元素作为参考',
        '增加相对位置容错机制'
      ],
      'index-fallback': [
        '仅在其他策略失效时使用',
        '定期验证索引的有效性'
      ]
    };

    return strategyRecommendations[strategy] || [];
  }

  /**
   * 记录评估历史
   */
  private recordAssessment(
    strategy: MatchStrategy,
    assessment: StabilityAssessment,
    context: StabilityEvaluationContext
  ): void {
    this.assessmentHistory.push({
      strategy,
      assessment,
      context,
      timestamp: Date.now()
    });

    // 保持历史记录在合理范围内
    if (this.assessmentHistory.length > 500) {
      this.assessmentHistory = this.assessmentHistory.slice(-250);
    }
  }

  // === 占位实现（这些方法在实际应用中需要具体实现） ===

  private async assessDeviceCompatibility(strategy: MatchStrategy, element: any, device: DeviceProfile): Promise<DeviceCompatibilityResult> {
    // 实际实现中这里会进行真实的设备兼容性测试
    return {
      device: device.name,
      isCompatible: Math.random() > 0.2, // 模拟80%兼容性
      compatibilityScore: Math.random() * 0.3 + 0.7,
      issues: [],
      recommendations: []
    };
  }

  private async testResolutionAdaptability(strategy: MatchStrategy, element: any, resolution: ResolutionProfile): Promise<ResolutionTestResult> {
    return {
      resolution: `${resolution.width}x${resolution.height}`,
      isAdaptable: Math.random() > 0.15,
      adaptabilityScore: Math.random() * 0.2 + 0.8,
      scalingIssues: [],
      recommendations: []
    };
  }

  private async testVersionCompatibility(strategy: MatchStrategy, element: any, version: AppVersionProfile): Promise<VersionTestResult> {
    return {
      version: version.version,
      isStable: Math.random() > 0.1,
      stabilityScore: Math.random() * 0.1 + 0.9,
      changes: [],
      recommendations: []
    };
  }

  private getDefaultResolutionScore(strategy: MatchStrategy): number {
    // 基于策略类型返回默认分辨率适应性分数
    const scores: Partial<Record<MatchStrategy, number>> = {
      'absolute': 0.2,
      'strict': 0.7,
      'relaxed': 0.8,
      'positionless': 0.9,
      'standard': 0.8
    };
    return scores[strategy] || 0.7;
  }

  private getDefaultVersionStability(strategy: MatchStrategy): number {
    const stability: Partial<Record<MatchStrategy, number>> = {
      'absolute': 0.3,
      'strict': 0.6,
      'relaxed': 0.8,
      'positionless': 0.9,
      'standard': 0.85
    };
    return stability[strategy] || 0.7;
  }

  private getStrategyLayoutTolerance(strategy: MatchStrategy): number {
    const tolerance: Partial<Record<MatchStrategy, number>> = {
      'absolute': 0.1,
      'strict': 0.4,
      'relaxed': 0.7,
      'positionless': 0.9,
      'standard': 0.8
    };
    return tolerance[strategy] || 0.6;
  }

  private getStrategyAccuracy(strategy: MatchStrategy): number {
    const accuracy: Partial<Record<MatchStrategy, number>> = {
      'absolute': 0.95,
      'strict': 0.9,
      'relaxed': 0.7,
      'positionless': 0.6,
      'standard': 0.85
    };
    return accuracy[strategy] || 0.8;
  }

  // 其他私有方法的简化实现...
  private analyzeElementFeatures(element: any): any { return {}; }
  private calculateFeatureBonus(features: any, strategy: MatchStrategy): number { return 0; }
  private analyzeXmlComplexity(xmlContent: string): number { return 0.1; }
  private analyzeElementUniqueness(element: any, xmlContent: string): number { return 0.8; }
  private analyzePositionStability(element: any, strategy: MatchStrategy): number { return 0.7; }
  private calculateVersionSpanPenalty(versions: AppVersionProfile[]): number { return 0.05; }
  private calculateOverallCompatibility(results: DeviceCompatibilityResult[]): number { return 0.8; }
  private getRecommendedDevices(results: DeviceCompatibilityResult[]): string[] { return []; }
  private getProblematicDevices(results: DeviceCompatibilityResult[]): string[] { return []; }
  private generateDeviceOptimizations(results: DeviceCompatibilityResult[]): string[] { return []; }
  private calculateResolutionScore(results: ResolutionTestResult[]): number { return 0.8; }
  private identifyCriticalResolutions(results: ResolutionTestResult[]): string[] { return []; }
  private generateResolutionRecommendations(results: ResolutionTestResult[]): string[] { return []; }
  private determineAdaptabilityLevel(score: number): string { return 'good'; }
  private analyzeVersionTrend(tests: VersionTestResult[]): string { return 'stable'; }
  private identifyBreakingChanges(tests: VersionTestResult[]): string[] { return []; }
  private calculateVersionStabilityScore(tests: VersionTestResult[]): number { return 0.85; }
  private predictFutureCompatibility(trend: string): string { return 'stable'; }
  private generateVersionRecommendations(tests: VersionTestResult[], changes: string[]): string[] { return []; }
  private async testLayoutTolerance(strategy: MatchStrategy, element: any, variation: LayoutVariation): Promise<LayoutToleranceResult> { 
    return { variation: variation.name, toleranceScore: 0.8, isRobust: true, sensitivities: [] }; 
  }
  private calculateOverallTolerance(results: LayoutToleranceResult[]): number { return 0.8; }
  private identifySensitiveAreas(results: LayoutToleranceResult[]): string[] { return []; }
  private determineToleranceLevel(tolerance: number): string { return 'good'; }
  private analyzeRobustnessFactors(results: LayoutToleranceResult[]): any { return {}; }
  private generateLayoutRecommendations(results: LayoutToleranceResult[], areas: string[]): string[] { return []; }
  private calculateAverageScore(history: StabilityRecord[]): number { return 0.8; }
  private calculateTrendDirection(history: StabilityRecord[]): string { return 'stable'; }
  private findMostStableStrategy(history: StabilityRecord[]): MatchStrategy { return 'standard'; }
  private findLeastStableStrategy(history: StabilityRecord[]): MatchStrategy { return 'absolute'; }
  private analyzeCommonRiskFactors(history: StabilityRecord[]): string[] { return []; }
  private identifyImprovements(history: StabilityRecord[]): string[] { return []; }
  private createEmptyTrendAnalysis(): StabilityTrendAnalysis {
    return {
      averageStabilityScore: 0,
      stabilityTrend: 'stable',
      mostStableStrategy: 'standard',
      leastStableStrategy: 'absolute',
      commonRiskFactors: [],
      stabilityImprovements: [],
      sampleSize: 0,
      timeRange: 0
    };
  }
}

// === 辅助类型和类 ===

/**
 * 设备兼容性数据库（简化实现）
 */
class DeviceCompatibilityDB {
  getDeviceProfile(deviceName: string): DeviceProfile | null {
    // 实际实现中这里会查询真实的设备数据库
    return null;
  }
}

/**
 * 版本稳定性分析器
 */
class VersionStabilityAnalyzer {
  analyzeVersionChanges(oldVersion: string, newVersion: string): VersionChange[] {
    // 实际实现中这里会分析版本间的具体变化
    return [];
  }
}

/**
 * 布局容忍度分析器
 */
class LayoutToleranceAnalyzer {
  analyzeLayoutSensitivity(element: any, variations: LayoutVariation[]): LayoutSensitivity {
    // 实际实现中这里会分析布局变化的敏感性
    return { overallSensitivity: 0.3, sensitiveAreas: [] };
  }
}

// === 导出的接口类型 ===

export interface StabilityEvaluationContext {
  deviceProfiles: DeviceProfile[];
  resolutionProfiles: ResolutionProfile[];
  appVersions: AppVersionProfile[];
  testEnvironment?: string;
}

export interface DeviceProfile {
  name: string;
  manufacturer: string;
  model: string;
  screenSize: string;
  resolution: string;
  androidVersion: string;
  characteristics: string[];
}

export interface ResolutionProfile {
  name: string;
  width: number;
  height: number;
  density: number;
  aspectRatio: string;
}

export interface AppVersionProfile {
  version: string;
  releaseDate: string;
  majorChanges: string[];
  uiChanges: string[];
}

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

// 其他接口类型...
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

export interface VersionChange {
  type: string;
  description: string;
  impact: string;
}

export interface LayoutSensitivity {
  overallSensitivity: number;
  sensitiveAreas: string[];
}

// === 便捷函数 ===

/**
 * 创建稳定性评估器
 */
export function createStabilityEvaluator(): StabilityAssessmentEvaluator {
  return new StabilityAssessmentEvaluator();
}

/**
 * 快速稳定性评估
 */
export async function quickStabilityAssessment(
  strategy: MatchStrategy,
  element: any,
  context: Partial<StabilityEvaluationContext> = {}
): Promise<StabilityAssessment> {
  const evaluator = createStabilityEvaluator();
  const fullContext: StabilityEvaluationContext = {
    deviceProfiles: [],
    resolutionProfiles: [],
    appVersions: [],
    ...context
  };
  
  return await evaluator.evaluateStability(strategy, element, '', fullContext);
}