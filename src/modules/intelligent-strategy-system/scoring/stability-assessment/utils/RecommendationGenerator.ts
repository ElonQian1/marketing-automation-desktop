// src/modules/intelligent-strategy-system/scoring/stability-assessment/utils/RecommendationGenerator.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 建议生成器
 * 
 * @description 基于稳定性分析结果生成改进建议
 */

import type { MatchStrategy } from '../../../types/StrategyTypes';
import type { StabilityFactors } from '../types';

/**
 * 建议生成器
 */
export class RecommendationGenerator {
  /**
   * 生成改进建议
   */
  async generateRecommendations(
    factors: StabilityFactors,
    risks: string[],
    strategy: MatchStrategy,
    element: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // 基于因素分数的建议
    recommendations.push(...this.getFactorBasedRecommendations(factors));

    // 基于风险的建议
    recommendations.push(...this.getRiskBasedRecommendations(risks));

    // 基于策略的建议
    recommendations.push(...this.getStrategyBasedRecommendations(strategy, factors));

    // 基于元素特征的建议
    recommendations.push(...this.getElementBasedRecommendations(element, factors));

    // 去重并排序
    const uniqueRecommendations = Array.from(new Set(recommendations));
    return this.prioritizeRecommendations(uniqueRecommendations);
  }

  /**
   * 生成快速优化建议
   */
  generateQuickOptimizationTips(
    strategy: MatchStrategy,
    factors: StabilityFactors
  ): string[] {
    const tips: string[] = [];

    // 最重要的问题优先
    const worstFactor = this.findWorstFactor(factors);
    
    switch (worstFactor) {
      case 'deviceCompatibility':
        tips.push('优先解决设备兼容性问题');
        tips.push('测试更多设备型号');
        break;
      case 'resolutionAdaptability':
        tips.push('优先解决分辨率适应性');
        tips.push('避免使用固定坐标');
        break;
      case 'versionStability':
        tips.push('关注应用版本更新影响');
        tips.push('建立版本兼容性监控');
        break;
      case 'layoutTolerance':
        tips.push('提高布局变化容忍度');
        tips.push('使用相对定位方式');
        break;
      case 'elementAccuracy':
        tips.push('丰富元素识别特征');
        tips.push('使用多重匹配条件');
        break;
    }

    return tips;
  }

  // === 私有方法 ===

  private getFactorBasedRecommendations(factors: StabilityFactors): string[] {
    const recommendations: string[] = [];

    if (factors.deviceCompatibility < 0.7) {
      recommendations.push('增加设备兼容性测试覆盖');
      recommendations.push('使用设备无关的匹配特征');
    }

    if (factors.resolutionAdaptability < 0.7) {
      recommendations.push('实现分辨率自适应逻辑');
      recommendations.push('使用相对坐标而非绝对坐标');
    }

    if (factors.versionStability < 0.7) {
      recommendations.push('建立版本兼容性检查机制');
      recommendations.push('为关键更新建立回归测试');
    }

    if (factors.layoutTolerance < 0.7) {
      recommendations.push('减少对精确布局位置的依赖');
      recommendations.push('使用语义化匹配而非位置匹配');
    }

    if (factors.elementAccuracy < 0.7) {
      recommendations.push('增加元素识别的特征维度');
      recommendations.push('结合多个属性进行匹配');
    }

    return recommendations;
  }

  private getRiskBasedRecommendations(risks: string[]): string[] {
    const recommendations: string[] = [];
    const riskSet = new Set(risks);

    if (riskSet.has('绝对定位在多分辨率环境下脆弱')) {
      recommendations.push('考虑切换到相对定位策略');
      recommendations.push('使用百分比坐标替代像素坐标');
    }

    if (riskSet.has('严重设备兼容性问题')) {
      recommendations.push('立即在问题设备上进行测试');
      recommendations.push('评估是否需要设备特定的处理逻辑');
    }

    if (riskSet.has('版本稳定性风险')) {
      recommendations.push('监控目标应用的版本更新');
      recommendations.push('建立版本变化的自动检测机制');
    }

    return recommendations;
  }

  private getStrategyBasedRecommendations(
    strategy: MatchStrategy,
    factors: StabilityFactors
  ): string[] {
    const recommendations: string[] = [];

    switch (strategy) {
      case 'absolute':
        if (factors.resolutionAdaptability < 0.6 || factors.layoutTolerance < 0.6) {
          recommendations.push('考虑切换到更稳定的匹配策略（standard或relaxed）');
        }
        recommendations.push('如果必须使用绝对定位，请增加多分辨率测试');
        break;

      case 'strict':
        if (factors.versionStability < 0.6) {
          recommendations.push('严格匹配可能在版本更新时失效，考虑适当放宽条件');
        }
        break;

      case 'relaxed':
        if (factors.elementAccuracy < 0.7) {
          recommendations.push('宽松匹配需要更精确的元素特征以避免误匹配');
        }
        break;

      case 'positionless':
        recommendations.push('无位置匹配是好选择，继续优化元素特征识别');
        break;

      case 'standard':
        recommendations.push('标准匹配策略平衡性好，继续优化元素特征');
        break;
    }

    return recommendations;
  }

  private getElementBasedRecommendations(element: any, factors: StabilityFactors): string[] {
    const recommendations: string[] = [];

    if (!element) {
      recommendations.push('元素信息缺失，无法进行详细分析');
      return recommendations;
    }

    // 检查元素特征完整性
    if (!element['resource-id']) {
      recommendations.push('尝试获取元素的resource-id以提高匹配准确性');
    }

    if (!element.text || !element.text.trim()) {
      recommendations.push('元素文本为空，考虑使用其他识别特征');
    } else if (this.isTextLikelyToChange(element.text)) {
      recommendations.push('元素文本可能会变化，建议结合其他稳定特征');
    }

    if (!element['content-desc']) {
      recommendations.push('如果可能，为元素添加content-desc以提高可访问性');
    }

    if (element.bounds && this.isElementTooSmall(element.bounds)) {
      recommendations.push('元素尺寸较小，在高分辨率设备上可能难以匹配');
    }

    return recommendations;
  }

  private findWorstFactor(factors: StabilityFactors): string {
    const factorEntries = Object.entries(factors);
    factorEntries.sort((a, b) => a[1] - b[1]);
    return factorEntries[0][0];
  }

  private prioritizeRecommendations(recommendations: string[]): string[] {
    // 按重要性排序建议
    const priorityKeywords = [
      '立即', '严重', '考虑切换', '避免使用',
      '建立', '增加', '实现', '使用',
      '监控', '优化', '结合', '继续'
    ];

    return recommendations.sort((a, b) => {
      const aPriority = this.getRecommendationPriority(a, priorityKeywords);
      const bPriority = this.getRecommendationPriority(b, priorityKeywords);
      return aPriority - bPriority;
    });
  }

  private getRecommendationPriority(recommendation: string, keywords: string[]): number {
    for (let i = 0; i < keywords.length; i++) {
      if (recommendation.includes(keywords[i])) {
        return i;
      }
    }
    return keywords.length; // 最低优先级
  }

  private isTextLikelyToChange(text: string): boolean {
    // 检查文本是否可能经常变化（如时间、计数器等）
    const changeablePatterns = [
      /\d{4}-\d{2}-\d{2}/, // 日期
      /\d{2}:\d{2}:\d{2}/, // 时间
      /\d+\s*(个|条|次|人)/, // 计数
      /\d+%/, // 百分比
      /第\s*\d+\s*(页|条)/ // 序号
    ];

    return changeablePatterns.some(pattern => pattern.test(text));
  }

  private isElementTooSmall(bounds: string): boolean {
    try {
      const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (match) {
        const [, x1, y1, x2, y2] = match.map(Number);
        const width = x2 - x1;
        const height = y2 - y1;
        return width < 48 || height < 48; // 48px 是最小触摸目标尺寸
      }
    } catch (error) {
      console.warn('解析bounds失败:', error);
    }
    return false;
  }
}