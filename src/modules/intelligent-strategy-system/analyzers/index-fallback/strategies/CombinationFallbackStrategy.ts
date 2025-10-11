// src/modules/intelligent-strategy-system/analyzers/index-fallback/strategies/CombinationFallbackStrategy.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * CombinationFallbackStrategy.ts
 * 组合回退策略 - 最后的兜底方案
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { ElementValidator, BoundsCalculator } from '../../../shared';

export class CombinationFallbackStrategy {
  readonly name = 'CombinationFallbackStrategy';

  /**
   * 检查策略是否适用 - 总是适用，作为最后的兜底
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    return true;
  }

  /**
   * 分析组合回退策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    // 收集所有可用属性
    const availableAttributes = this.collectAvailableAttributes(element);
    
    if (availableAttributes.length === 0) {
      // 如果没有任何属性，创建一个基于位置的最基础策略
      return this.createDesperateStrategies(element);
    }

    let baseScore = 20; // 很低的分数，因为是兜底策略

    // 策略1: 多属性组合
    const multiAttrCombination = this.createMultiAttributeCombination(availableAttributes);
    if (multiAttrCombination.fields.length >= 2) {
      candidates.push(this.createCandidate(
        baseScore + 15,
        `多属性组合: ${multiAttrCombination.description}`,
        element,
        multiAttrCombination
      ));
    }

    // 策略2: 单一最佳属性
    const bestSingleAttr = this.findBestSingleAttribute(availableAttributes);
    if (bestSingleAttr) {
      candidates.push(this.createCandidate(
        baseScore + 10,
        `最佳单属性: ${bestSingleAttr.description}`,
        element,
        bestSingleAttr
      ));
    }

    // 策略3: 类名 + 任意可用属性
    const classBasedCombo = this.createClassBasedCombination(availableAttributes);
    if (classBasedCombo) {
      candidates.push(this.createCandidate(
        baseScore + 5,
        `类名组合: ${classBasedCombo.description}`,
        element,
        classBasedCombo
      ));
    }

    // 策略4: 文本内容匹配（如果有）
    if (element.text && element.text.trim()) {
      candidates.push(this.createCandidate(
        baseScore + 8,
        `文本匹配: "${element.text.substring(0, 20)}${element.text.length > 20 ? '...' : ''}"`,
        element,
        {
          fields: ['text'],
          values: { text: element.text },
          description: '文本内容匹配'
        }
      ));
    }

    return candidates;
  }

  /**
   * 收集所有可用属性
   */
  private collectAvailableAttributes(element: any) {
    const attributes: Array<{field: string, value: any, priority: number}> = [];

    // 按优先级收集属性
    const attrMap = [
      { field: 'resource-id', value: element['resource-id'], priority: 10 },
      { field: 'content-desc', value: element['content-desc'], priority: 9 },
      { field: 'text', value: element.text, priority: 8 },
      { field: 'class', value: element.class, priority: 7 },
      { field: 'package', value: element.package, priority: 6 },
      { field: 'clickable', value: element.clickable, priority: 5 },
      { field: 'enabled', value: element.enabled, priority: 4 },
      { field: 'checkable', value: element.checkable, priority: 3 },
      { field: 'bounds', value: element.bounds, priority: 2 },
      { field: 'index', value: element.index, priority: 1 }
    ];

    attrMap.forEach(attr => {
      if (attr.value !== undefined && attr.value !== null && attr.value !== '') {
        // 对文本长度进行限制
        if (attr.field === 'text' && typeof attr.value === 'string' && attr.value.length > 50) {
          return; // 跳过过长的文本
        }
        attributes.push(attr);
      }
    });

    return attributes.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 创建多属性组合
   */
  private createMultiAttributeCombination(attributes: any[]) {
    const topAttributes = attributes.slice(0, 3); // 取前3个最优属性
    
    if (topAttributes.length < 2) {
      return { fields: [], values: {}, description: '' };
    }

    const fields = topAttributes.map(attr => attr.field);
    const values: Record<string, any> = {};
    const descriptions: string[] = [];

    topAttributes.forEach(attr => {
      values[attr.field] = attr.value;
      descriptions.push(`${attr.field}="${attr.value}"`);
    });

    return {
      fields,
      values,
      description: descriptions.join(' + ')
    };
  }

  /**
   * 找到最佳单属性
   */
  private findBestSingleAttribute(attributes: any[]) {
    if (attributes.length === 0) return null;
    
    const best = attributes[0]; // 已按优先级排序
    
    return {
      fields: [best.field],
      values: { [best.field]: best.value },
      description: `${best.field}="${best.value}"`
    };
  }

  /**
   * 创建基于类名的组合
   */
  private createClassBasedCombination(attributes: any[]) {
    const classAttr = attributes.find(attr => attr.field === 'class');
    if (!classAttr) return null;

    // 找一个非class的属性组合
    const otherAttr = attributes.find(attr => 
      attr.field !== 'class' && 
      attr.field !== 'bounds' && 
      attr.field !== 'index'
    );

    if (!otherAttr) {
      return {
        fields: ['class'],
        values: { class: classAttr.value },
        description: `class="${classAttr.value}"`
      };
    }

    return {
      fields: ['class', otherAttr.field],
      values: { 
        class: classAttr.value,
        [otherAttr.field]: otherAttr.value
      },
      description: `class="${classAttr.value}" + ${otherAttr.field}="${otherAttr.value}"`
    };
  }

  /**
   * 创建绝望策略（当没有有用属性时）
   */
  private createDesperateStrategies(element: any): StrategyCandidate[] {
    const candidates: StrategyCandidate[] = [];
    
    // 尝试使用bounds
    if (element.bounds) {
      const bounds = BoundsCalculator.parseBounds(element.bounds);
      if (bounds) {
        const center = BoundsCalculator.getCenter(bounds);
        candidates.push(this.createCandidate(
          10, // 很低的分数
          `绝望策略: 坐标点击 (${center.x}, ${center.y})`,
          element,
          {
            fields: ['desperate-coordinates'],
            values: { x: center.x, y: center.y },
            description: '绝望的坐标点击'
          }
        ));
      }
    }

    // 如果连bounds都没有，创建一个标记性的失败策略
    if (candidates.length === 0) {
      candidates.push(this.createCandidate(
        1, // 最低分数
        '无可用策略',
        element,
        {
          fields: ['no-strategy'],
          values: { error: 'no-viable-attributes' },
          description: '元素缺乏可识别属性'
        }
      ));
    }

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
    const isDesperateStrategy = criteria.fields.includes('desperate-coordinates') || 
                              criteria.fields.includes('no-strategy');
    
    return {
      id: `combination-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'index-fallback',
      sourceStep: 'index-fallback',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: isDesperateStrategy ? score * 0.1 : score * 0.5,
          stability: isDesperateStrategy ? score * 0.1 : score * 0.6,
          performance: score * 0.8,
          reliability: isDesperateStrategy ? score * 0.1 : score * 0.7
        },
        bonuses: criteria.fields.length > 2 ? [
          { reason: '多属性组合增加匹配精度', points: 5 }
        ] : [],
        penalties: [
          { reason: '兜底策略，优先级最低', points: -30 },
          ...(isDesperateStrategy ? [
            { reason: '绝望策略，稳定性极差', points: -20 }
          ] : [])
        ]
      },
      criteria: {
        fields: criteria.fields,
        values: criteria.values
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { 
          isUnique: false // 兜底策略通常不够唯一
        },
        errors: [],
        warnings: this.generateWarnings(criteria, isDesperateStrategy),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: isDesperateStrategy ? 200 : 80,
        deviceCompatibility: isDesperateStrategy ? ['very-fragile'] : ['limited'],
        complexity: 'complex' // 兜底策略往往复杂度高
      }
    };
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any, isDesperateStrategy: boolean): string[] {
    const warnings: string[] = [
      '这是兜底策略，建议优先使用其他策略'
    ];

    if (isDesperateStrategy) {
      warnings.push('绝望策略，成功率极低，建议手动优化元素定位');
    }

    if (criteria.fields.includes('text') && criteria.values.text?.length > 20) {
      warnings.push('基于长文本的匹配可能不稳定');
    }

    if (criteria.fields.includes('bounds')) {
      warnings.push('基于坐标的策略在不同设备上会失效');
    }

    if (criteria.fields.length === 1 && criteria.fields[0] === 'class') {
      warnings.push('仅基于class的匹配可能匹配到多个元素');
    }

    return warnings;
  }
}