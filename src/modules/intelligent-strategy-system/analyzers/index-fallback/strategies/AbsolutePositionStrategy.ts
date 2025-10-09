/**
 * AbsolutePositionStrategy.ts
 * 绝对位置策略
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { BoundsCalculator } from '../../../shared';

export class AbsolutePositionStrategy {
  readonly name = 'AbsolutePositionStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    return !!element.bounds;
  }

  /**
   * 分析绝对位置策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    if (!bounds) return candidates;

    const center = BoundsCalculator.getCenter(bounds);
    let baseScore = 40; // 较低分数，因为位置策略脆弱

    // 策略1: 精确坐标点击
    candidates.push(this.createCandidate(
      baseScore + 5,
      `绝对坐标点击 (${center.x}, ${center.y})`,
      element,
      {
        fields: ['absolute-coordinates'],
        values: { 
          'x': center.x,
          'y': center.y,
          'bounds': element.bounds
        }
      }
    ));

    // 策略2: 边界匹配
    candidates.push(this.createCandidate(
      baseScore,
      `边界匹配 ${BoundsCalculator.toString(bounds)}`,
      element,
      {
        fields: ['bounds-match'],
        values: { 'bounds': element.bounds }
      }
    ));

    return candidates;
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
      id: `absolute-position-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'index-fallback',
      sourceStep: 'index-fallback',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * 0.9, // 坐标通常是唯一的
          stability: score * 0.3,  // 但稳定性很差
          performance: score * 0.9, // 性能很好
          reliability: score * 0.4  // 可靠性差
        },
        bonuses: [],
        penalties: [
          { reason: '绝对位置策略跨设备兼容性差', points: -20 }
        ]
      },
      criteria: {
        fields: criteria.fields,
        values: criteria.values
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { isUnique: true }, // 坐标总是唯一的
        errors: [],
        warnings: ['绝对位置策略在不同设备上可能失效'],
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 50, // 很快
        deviceCompatibility: ['same-device-only'],
        complexity: 'simple'
      }
    };
  }
}