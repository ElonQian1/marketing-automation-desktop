/**
 * 分辨率适应性分析策略
 * 
 * @description 处理不同分辨率环境下的适应性评估
 */

import type { MatchStrategy } from '../../../types/StrategyTypes';
import type {
  ResolutionProfile,
  ResolutionTestResult,
  ResolutionAdaptabilityReport
} from '../types';
import { UnifiedBoundsParser } from '../../../shared/utils/boundsParser';

/**
 * 分辨率适应性分析器
 */
export class ResolutionAdaptabilityAnalyzer {
  /**
   * 分析分辨率适应性
   */
  async analyzeResolutionAdaptability(
    strategy: MatchStrategy,
    element: any,
    resolutionProfiles: ResolutionProfile[]
  ): Promise<number> {
    if (!resolutionProfiles || resolutionProfiles.length === 0) {
      return this.getDefaultResolutionScore(strategy);
    }

    const adaptabilityResults = await Promise.all(
      resolutionProfiles.map(resolution => this.testSingleResolutionAdaptability(strategy, element, resolution))
    );

    const adaptableResolutions = adaptabilityResults.filter(result => result.isAdaptable).length;
    return adaptableResolutions / resolutionProfiles.length;
  }

  /**
   * 测试单个分辨率适应性
   */
  async testSingleResolutionAdaptability(
    strategy: MatchStrategy,
    element: any,
    resolution: ResolutionProfile
  ): Promise<ResolutionTestResult> {
    const scalingIssues: string[] = [];
    const recommendations: string[] = [];
    let adaptabilityScore = 1.0;

    // 检查策略对分辨率变化的敏感性
    if (this.isAbsolutePositionStrategy(strategy)) {
      if (this.isDifferentAspectRatio(resolution)) {
        scalingIssues.push('绝对定位在不同宽高比下可能失效');
        adaptabilityScore -= 0.4;
      }
      
      if (this.isHighDensityScreen(resolution)) {
        scalingIssues.push('高密度屏幕可能导致坐标偏移');
        adaptabilityScore -= 0.3;
      }
    }

    // 检查元素特征与分辨率的兼容性
    if (element && element.bounds) {
      const elementBounds = this.parseBounds(element.bounds);
      if (this.isTooSmallForResolution(elementBounds, resolution)) {
        scalingIssues.push('元素在高分辨率下可能过小');
        recommendations.push('考虑使用密度无关的匹配方式');
        adaptabilityScore -= 0.2;
      }

      if (this.isTooLargeForResolution(elementBounds, resolution)) {
        scalingIssues.push('元素在低分辨率下可能溢出');
        recommendations.push('添加分辨率适配逻辑');
        adaptabilityScore -= 0.2;
      }
    }

    // 策略特定建议
    if (strategy === 'absolute' && scalingIssues.length > 0) {
      recommendations.push('建议改用语义化匹配策略（standard或relaxed）');
    }

    adaptabilityScore = Math.max(0, Math.min(1, adaptabilityScore));

    return {
      resolution: `${resolution.width}x${resolution.height}@${resolution.density}x`,
      isAdaptable: adaptabilityScore >= 0.6,
      adaptabilityScore,
      scalingIssues,
      recommendations
    };
  }

  /**
   * 生成分辨率适应性报告
   */
  async generateAdaptabilityReport(
    strategy: MatchStrategy,
    element: any,
    resolutionProfiles: ResolutionProfile[]
  ): Promise<ResolutionAdaptabilityReport> {
    const resolutionResults = await Promise.all(
      resolutionProfiles.map(resolution => this.testSingleResolutionAdaptability(strategy, element, resolution))
    );

    const overallScore = resolutionResults.reduce(
      (sum, result) => sum + result.adaptabilityScore, 0
    ) / resolutionResults.length;

    const adaptabilityLevel = this.determineAdaptabilityLevel(overallScore);

    const criticalResolutions = resolutionResults
      .filter(result => !result.isAdaptable)
      .map(result => result.resolution);

    const recommendations = this.generateGlobalRecommendations(resolutionResults, strategy);

    return {
      strategy,
      overallScore,
      adaptabilityLevel,
      resolutionResults,
      criticalResolutions,
      recommendations
    };
  }

  // === 私有辅助方法 ===

  private getDefaultResolutionScore(strategy: MatchStrategy): number {
    const strategyScores = {
      'absolute': 0.3,      // 绝对定位对分辨率最敏感
      'strict': 0.6,        // 严格匹配中等敏感
      'relaxed': 0.8,       // 宽松匹配较好适应
      'positionless': 0.9,  // 无位置匹配最好
      'standard': 0.85      // 标准匹配较好适应
    };
    return strategyScores[strategy] || 0.5;
  }

  private isAbsolutePositionStrategy(strategy: MatchStrategy): boolean {
    return strategy === 'absolute';
  }

  private isDifferentAspectRatio(resolution: ResolutionProfile): boolean {
    const commonRatios = ['16:9', '18:9', '19:9', '4:3'];
    return !commonRatios.includes(resolution.aspectRatio);
  }

  private isHighDensityScreen(resolution: ResolutionProfile): boolean {
    return resolution.density >= 3.0;
  }

  /**
   * 解析边界字符串为Rectangle格式
   * @param boundsStr 边界字符串
   * @returns Rectangle格式的边界信息
   * @deprecated 使用 UnifiedBoundsParser.parseBoundsAsRectangle() 统一实现
   */
  private parseBounds(boundsStr: string): { x: number; y: number; width: number; height: number } | null {
    // 使用统一的边界解析器
    const rectangle = UnifiedBoundsParser.parseBoundsAsRectangle(boundsStr);
    return rectangle;
  }

  private isTooSmallForResolution(
    bounds: { width: number; height: number } | null,
    resolution: ResolutionProfile
  ): boolean {
    if (!bounds) return false;
    const minTouchSize = 48 * resolution.density; // 48dp minimum touch target
    return bounds.width < minTouchSize || bounds.height < minTouchSize;
  }

  private isTooLargeForResolution(
    bounds: { width: number; height: number } | null,
    resolution: ResolutionProfile
  ): boolean {
    if (!bounds) return false;
    // 如果元素大小超过屏幕的80%，可能存在问题
    return bounds.width > resolution.width * 0.8 || bounds.height > resolution.height * 0.8;
  }

  private determineAdaptabilityLevel(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.75) return 'good';
    if (score >= 0.6) return 'fair';
    if (score >= 0.4) return 'poor';
    return 'very-poor';
  }

  private generateGlobalRecommendations(
    results: ResolutionTestResult[],
    strategy: MatchStrategy
  ): string[] {
    const recommendations: string[] = [];
    const problematicResults = results.filter(r => !r.isAdaptable);

    if (problematicResults.length > 0) {
      if (strategy === 'absolute') {
        recommendations.push('考虑使用相对定位或语义化匹配');
        recommendations.push('添加多分辨率测试覆盖');
      }

      if (problematicResults.some(r => r.scalingIssues.some(i => i.includes('密度')))) {
        recommendations.push('实现密度无关的匹配逻辑');
      }

      if (problematicResults.some(r => r.scalingIssues.some(i => i.includes('宽高比')))) {
        recommendations.push('处理不同宽高比的屏幕适配');
      }
    }

    return recommendations;
  }
}