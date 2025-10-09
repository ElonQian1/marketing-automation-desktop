/**
 * 风险评估引擎
 * 
 * @description 识别和分析稳定性风险因素
 */

import type { MatchStrategy } from '../../../types/StrategyTypes';
import type { StabilityFactors } from '../types';

/**
 * 风险评估引擎
 */
export class RiskAssessmentEngine {
  /**
   * 识别风险因素
   */
  async identifyRiskFactors(
    factors: StabilityFactors,
    strategy: MatchStrategy,
    element: any
  ): Promise<string[]> {
    const risks: string[] = [];

    // 基于因素分数识别风险
    if (factors.deviceCompatibility < 0.6) {
      risks.push('设备兼容性风险');
      if (factors.deviceCompatibility < 0.4) {
        risks.push('严重设备兼容性问题');
      }
    }

    if (factors.resolutionAdaptability < 0.6) {
      risks.push('分辨率适应性风险');
      if (this.isAbsoluteStrategy(strategy)) {
        risks.push('绝对定位在多分辨率环境下高风险');
      }
    }

    if (factors.versionStability < 0.5) {
      risks.push('版本稳定性风险');
      risks.push('应用更新可能导致匹配失效');
    }

    if (factors.layoutTolerance < 0.6) {
      risks.push('布局变化敏感性风险');
      if (this.hasPositionDependentElement(element)) {
        risks.push('位置依赖元素在布局变化时高风险');
      }
    }

    if (factors.elementAccuracy < 0.5) {
      risks.push('元素特征不足风险');
      risks.push('匹配准确性可能受到影响');
    }

    // 策略特定风险
    risks.push(...this.getStrategySpecificRisks(strategy, factors));

    return risks;
  }

  /**
   * 评估风险严重程度
   */
  assessRiskSeverity(risks: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['严重', '高风险', 'critical'];
    const highKeywords = ['风险', '问题', '失效'];
    const mediumKeywords = ['敏感性', '影响'];

    const hasCritical = risks.some(risk => 
      criticalKeywords.some(keyword => risk.includes(keyword))
    );
    if (hasCritical) return 'critical';

    const highRiskCount = risks.filter(risk =>
      highKeywords.some(keyword => risk.includes(keyword))
    ).length;
    if (highRiskCount >= 3) return 'high';
    if (highRiskCount >= 1) return 'medium';

    return 'low';
  }

  /**
   * 获取风险缓解建议
   */
  getRiskMitigationSuggestions(risks: string[]): string[] {
    const suggestions: string[] = [];
    const riskSet = new Set(risks);

    if (riskSet.has('设备兼容性风险')) {
      suggestions.push('在多种设备上进行测试验证');
      suggestions.push('考虑使用更通用的匹配策略');
    }

    if (riskSet.has('分辨率适应性风险')) {
      suggestions.push('实现分辨率自适应逻辑');
      suggestions.push('避免硬编码坐标值');
    }

    if (riskSet.has('版本稳定性风险')) {
      suggestions.push('建立版本兼容性测试流程');
      suggestions.push('监控应用更新对匹配的影响');
    }

    if (riskSet.has('布局变化敏感性风险')) {
      suggestions.push('使用布局无关的匹配方式');
      suggestions.push('增加容错机制');
    }

    if (riskSet.has('元素特征不足风险')) {
      suggestions.push('丰富元素识别特征');
      suggestions.push('使用多重匹配条件');
    }

    return suggestions;
  }

  // === 私有辅助方法 ===

  private isAbsoluteStrategy(strategy: MatchStrategy): boolean {
    return strategy === 'absolute';
  }

  private hasPositionDependentElement(element: any): boolean {
    return element && element.bounds && element.bounds.trim() !== '';
  }

  private getStrategySpecificRisks(strategy: MatchStrategy, factors: StabilityFactors): string[] {
    const risks: string[] = [];

    switch (strategy) {
      case 'absolute':
        if (factors.resolutionAdaptability < 0.7) {
          risks.push('绝对定位策略在多分辨率环境下脆弱');
        }
        if (factors.layoutTolerance < 0.6) {
          risks.push('绝对定位对布局变化极其敏感');
        }
        break;

      case 'strict':
        if (factors.versionStability < 0.6) {
          risks.push('严格匹配在版本更新时可能失效');
        }
        break;

      case 'relaxed':
        if (factors.elementAccuracy < 0.6) {
          risks.push('宽松匹配可能产生误匹配');
        }
        break;

      case 'positionless':
        if (factors.elementAccuracy < 0.7) {
          risks.push('无位置匹配需要更强的元素特征');
        }
        break;

      case 'standard':
        // 标准策略通常风险较低
        if (factors.deviceCompatibility < 0.5) {
          risks.push('标准匹配在某些设备上可能需要调整');
        }
        break;
    }

    return risks;
  }
}