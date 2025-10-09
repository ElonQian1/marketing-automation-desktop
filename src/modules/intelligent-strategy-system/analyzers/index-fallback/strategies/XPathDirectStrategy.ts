/**
 * XPathDirectStrategy.ts
 * XPath直接定位策略
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { SharedUtils } from '../../../shared';

export class XPathDirectStrategy {
  readonly name = 'XPathDirectStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    return !!element.xpath;
  }

  /**
   * 分析XPath直接定位策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (!element.xpath) return candidates;

    let baseScore = 55; // 中等分数，因为XPath比较脆弱

    // 策略1: 完整XPath路径
    candidates.push(this.createCandidate(
      baseScore + 10,
      '完整XPath路径定位',
      element,
      {
        fields: ['xpath-complete'],
        values: { 'xpath-complete': element.xpath },
        xpath: element.xpath,
        strategy: 'index-fallback'
      }
    ));

    // 策略2: 简化XPath路径（移除具体索引）
    const simplifiedXPath = this.simplifyXPath(element.xpath);
    if (simplifiedXPath !== element.xpath) {
      candidates.push(this.createCandidate(
        baseScore + 5,
        '简化XPath路径定位',
        element,
        {
          fields: ['xpath-simplified'],
          values: { 'xpath-simplified': simplifiedXPath },
          xpath: simplifiedXPath,
          strategy: 'index-fallback'
        }
      ));
    }

    return candidates;
  }

  /**
   * 简化XPath路径
   */
  private simplifyXPath(xpath: string): string {
    // 移除具体的索引号，但保留[1]
    return xpath.replace(/\[(\d+)\]/g, (match, num) => {
      return num === '1' ? '[1]' : '';
    });
  }

  /**
   * 创建候选策略
   */
  private createCandidate(
    score: number,
    description: string,
    element: any,
    criteria: any
  ): StrategyCandidate {
    return {
      id: `xpath-direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'index-fallback',
      sourceStep: 'index-fallback',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * 0.7,
          stability: score * 0.6,
          performance: score * 0.8,
          reliability: score * 0.5
        },
        bonuses: [],
        penalties: []
      },
      criteria: {
        fields: criteria.fields,
        values: criteria.values,
        xpath: criteria.xpath
      },
      validation: {
        passed: false, // 需要后续验证
        matchCount: 0,
        uniqueness: {
          isUnique: false
        },
        errors: [],
        warnings: [],
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 100,
        deviceCompatibility: ['android'],
        complexity: 'medium'
      }
    };
  }
}