// src/modules/intelligent-strategy-system/analyzers/neighbor-relative/strategies/DirectNeighborStrategy.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * DirectNeighborStrategy.ts
 * 直接邻居策略
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { NeighborFinder, NeighborXPathBuilder } from '../calculators';

export class DirectNeighborStrategy {
  readonly name = 'DirectNeighborStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    const neighbors = NeighborFinder.findNeighborElements(element, context);
    return neighbors.length > 0;
  }

  /**
   * 分析直接邻居策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    
    let baseScore = 60; // 直接邻居策略评分较高

    // 策略1: 基于最佳邻居的resource-id
    if (analysis.best?.['resource-id']) {
      const direction = analysis.best._neighborMeta?.direction || 'right';
      candidates.push(this.createCandidate(
        baseScore + 20,
        `相对于 ${analysis.best['resource-id']} 的 ${direction} 方向`,
        element,
        {
          type: 'neighbor-resource-id',
          fields: ['neighbor-resource-id', 'relative-direction'],
          values: {
            'neighbor-resource-id': analysis.best['resource-id'],
            'relative-direction': direction
          },
          xpath: NeighborXPathBuilder.buildNeighborResourceIdXPath(analysis.best, direction, element)
        }
      ));
    }

    // 策略2: 基于最佳邻居的文本
    if (analysis.best?.text && analysis.best.text.length < 50) {
      const direction = analysis.best._neighborMeta?.direction || 'right';
      candidates.push(this.createCandidate(
        baseScore + 15,
        `相对于文本 "${analysis.best.text.substring(0, 20)}..." 的 ${direction} 方向`,
        element,
        {
          type: 'neighbor-text',
          fields: ['neighbor-text', 'relative-direction'],
          values: {
            'neighbor-text': analysis.best.text,
            'relative-direction': direction
          },
          xpath: NeighborXPathBuilder.buildNeighborTextXPath(analysis.best.text, direction, element)
        }
      ));
    }

    // 策略3: 基于最佳邻居的内容描述
    if (analysis.best?.['content-desc']) {
      const direction = analysis.best._neighborMeta?.direction || 'right';
      candidates.push(this.createCandidate(
        baseScore + 12,
        `相对于描述 "${analysis.best['content-desc']}" 的 ${direction} 方向`,
        element,
        {
          type: 'neighbor-content-desc',
          fields: ['neighbor-content-desc', 'relative-direction'],
          values: {
            'neighbor-content-desc': analysis.best['content-desc'],
            'relative-direction': direction
          },
          xpath: NeighborXPathBuilder.buildNeighborContentDescXPath(analysis.best['content-desc'], direction, element)
        }
      ));
    }

    // 策略4: 基于最佳邻居的类型
    if (analysis.best?.tag || analysis.best?.class) {
      const neighborClass = analysis.best.tag || analysis.best.class;
      const direction = analysis.best._neighborMeta?.direction || 'right';
      
      if (this.isSpecificControlType(neighborClass)) {
        candidates.push(this.createCandidate(
          baseScore + 8,
          `相对于 ${neighborClass} 控件的 ${direction} 方向`,
          element,
          {
            type: 'neighbor-class',
            fields: ['neighbor-class', 'relative-direction'],
            values: {
              'neighbor-class': neighborClass,
              'relative-direction': direction
            },
            xpath: NeighborXPathBuilder.buildNeighborClassXPath(neighborClass, direction, element)
          }
        ));
      }
    }

    return candidates;
  }

  /**
   * 检查是否为特定控件类型
   */
  private isSpecificControlType(tagName: string): boolean {
    const specificTypes = [
      'android.widget.Button',
      'android.widget.EditText', 
      'android.widget.TextView',
      'android.widget.ImageView',
      'android.widget.CheckBox',
      'android.widget.RadioButton'
    ];
    return specificTypes.includes(tagName);
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
    const stability = this.calculateStability(criteria);
    
    return {
      id: `direct-neighbor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'neighbor-relative',
      sourceStep: 'neighbor-relative',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * 0.8,
          stability: stability,
          performance: score * 0.7,
          reliability: score * 0.9
        },
        bonuses: criteria.type === 'neighbor-resource-id' ? [
          { reason: '基于resource-id的邻居定位最稳定', points: 15 }
        ] : [],
        penalties: criteria.type === 'neighbor-class' ? [
          { reason: '仅基于类型的邻居定位可能不够精确', points: -5 }
        ] : []
      },
      criteria: {
        fields: criteria.fields,
        values: criteria.values
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { 
          isUnique: criteria.type === 'neighbor-resource-id'
        },
        errors: [],
        warnings: this.generateWarnings(criteria),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 80,
        deviceCompatibility: criteria.type === 'neighbor-resource-id' ? 
          ['similar-layouts'] : ['fragile'],
        complexity: 'medium'
      }
    };
  }

  /**
   * 计算稳定性分数
   */
  private calculateStability(criteria: any): number {
    let stability = 60;

    switch (criteria.type) {
      case 'neighbor-resource-id':
        stability = 85;
        break;
      case 'neighbor-text':
        stability = 65;
        break;
      case 'neighbor-content-desc':
        stability = 70;
        break;
      case 'neighbor-class':
        stability = 50;
        break;
    }

    return stability;
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any): string[] {
    const warnings: string[] = [];

    if (criteria.type === 'neighbor-text' && criteria.values['neighbor-text']?.length > 30) {
      warnings.push('基于长文本的邻居定位可能不稳定');
    }

    if (criteria.type === 'neighbor-class') {
      warnings.push('仅基于类型的邻居定位可能匹配到多个元素');
    }

    if (criteria.values['relative-direction'] === 'diagonal') {
      warnings.push('对角线方向的相对定位准确性较低');
    }

    return warnings;
  }
}