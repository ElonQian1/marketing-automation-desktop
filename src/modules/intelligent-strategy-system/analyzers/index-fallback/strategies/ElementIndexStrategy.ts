// src/modules/intelligent-strategy-system/analyzers/index-fallback/strategies/ElementIndexStrategy.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * ElementIndexStrategy.ts
 * 元素索引策略
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { ElementValidator } from '../../../shared';

export class ElementIndexStrategy {
  readonly name = 'ElementIndexStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    return element.index !== undefined && element.index !== null;
  }

  /**
   * 分析元素索引策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    const index = parseInt(element.index);
    if (isNaN(index)) return candidates;

    let baseScore = 30; // 中等分数

    // 获取父元素信息以构建更精确的索引路径
    const parentInfo = this.extractParentInfo(element, context);
    
    // 策略1: 简单索引匹配
    candidates.push(this.createCandidate(
      baseScore,
      `索引匹配 [${index}]`,
      element,
      {
        fields: ['index'],
        values: { 'index': index }
      }
    ));

    // 策略2: 带父元素的索引匹配
    if (parentInfo.hasParent) {
      candidates.push(this.createCandidate(
        baseScore + 10,
        `父元素+索引 ${parentInfo.description}[${index}]`,
        element,
        {
          fields: ['parent-index'],
          values: { 
            'index': index,
            'parent': parentInfo.identifier
          }
        }
      ));
    }

    // 策略3: 类型+索引匹配
    if (element.class) {
      candidates.push(this.createCandidate(
        baseScore + 5,
        `类型索引 ${element.class}[${index}]`,
        element,
        {
          fields: ['class', 'index'],
          values: { 
            'class': element.class,
            'index': index
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 提取父元素信息
   */
  private extractParentInfo(element: any, context: ElementAnalysisContext) {
    // 简化实现 - 实际可能需要从XML上下文获取父元素
    return {
      hasParent: !!element.parent,
      identifier: element.parent?.['resource-id'] || element.parent?.class || 'unknown',
      description: element.parent?.['resource-id'] ? `#${element.parent['resource-id']}` : element.parent?.class || 'parent'
    };
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
    const reliability = this.calculateReliability(element, criteria);
    
    return {
      id: `element-index-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'index-fallback',
      sourceStep: 'index-fallback',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * 0.6, // 索引可能不唯一
          stability: score * 0.7,  // 中等稳定性
          performance: score * 0.9, // 性能很好
          reliability: reliability
        },
        bonuses: criteria.fields.length > 1 ? [
          { reason: '组合索引策略更精确', points: 5 }
        ] : [],
        penalties: []
      },
      criteria: {
        fields: criteria.fields,
        values: criteria.values
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { 
          isUnique: criteria.fields.includes('parent-index') // 父元素+索引通常更唯一
        },
        errors: [],
        warnings: criteria.fields.length === 1 ? ['纯索引匹配可能不够精确'] : [],
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 60,
        deviceCompatibility: criteria.fields.includes('parent-index') ? ['similar-layouts'] : ['fragile'],
        complexity: 'simple'
      }
    };
  }

  /**
   * 计算可靠性分数
   */
  private calculateReliability(element: any, criteria: any): number {
    let reliability = 40; // 基础分数

    // 组合条件增加可靠性
    if (criteria.fields.length > 1) {
      reliability += 20;
    }

    // 有父元素上下文增加可靠性
    if (criteria.fields.includes('parent-index')) {
      reliability += 15;
    }

    // 有类型信息增加可靠性
    if (criteria.fields.includes('class')) {
      reliability += 10;
    }

    return Math.min(reliability, 100);
  }
}