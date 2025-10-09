/**
 * DirectionalStrategy.ts
 * 方向性策略 - 基于方向的相邻元素定位
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { NeighborFinder, NeighborXPathBuilder } from '../calculators';

export class DirectionalStrategy {
  readonly name = 'DirectionalStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    // 需要有明确方向的邻居
    return Object.values(analysis.byDirection).some(neighbors => neighbors.length > 0);
  }

  /**
   * 分析方向性策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    
    let baseScore = 55; // 中等偏上分数

    // 策略1: 基于每个方向的最优邻居
    const directions = ['left', 'right', 'above', 'below'];
    
    for (const direction of directions) {
      const neighborsInDirection = analysis.byDirection[direction];
      if (neighborsInDirection && neighborsInDirection.length > 0) {
        const bestNeighbor = neighborsInDirection[0]; // 已按距离排序
        
        // 基于最佳属性创建候选
        if (bestNeighbor.attributes?.['resource-id']) {
          candidates.push(this.createCandidate(
            baseScore + 15,
            `${direction}方向相对于ID "${bestNeighbor.attributes['resource-id']}"`,
            element,
            {
              type: 'directional-resource-id',
              direction,
              neighborAttr: 'resource-id',
              neighborValue: bestNeighbor.attributes['resource-id'],
              xpath: NeighborXPathBuilder.buildNeighborResourceIdXPath(bestNeighbor, direction, element)
            }
          ));
        }

        if (bestNeighbor.text && bestNeighbor.text.length < 30) {
          candidates.push(this.createCandidate(
            baseScore + 10,
            `${direction}方向相对于文本 "${bestNeighbor.text.substring(0, 15)}..."`,
            element,
            {
              type: 'directional-text',
              direction,
              neighborAttr: 'text',
              neighborValue: bestNeighbor.text,
              xpath: NeighborXPathBuilder.buildNeighborTextXPath(bestNeighbor.text, direction, element)
            }
          ));
        }

        if (bestNeighbor.attributes?.['content-desc']) {
          candidates.push(this.createCandidate(
            baseScore + 8,
            `${direction}方向相对于描述 "${bestNeighbor.attributes['content-desc']}"`,
            element,
            {
              type: 'directional-content-desc',
              direction,
              neighborAttr: 'content-desc',
              neighborValue: bestNeighbor.attributes['content-desc'],
              xpath: NeighborXPathBuilder.buildNeighborContentDescXPath(bestNeighbor.attributes['content-desc'], direction, element)
            }
          ));
        }
      }
    }

    // 策略2: 最近邻居策略 (任意方向)
    if (analysis.best) {
      const direction = analysis.best._neighborMeta?.direction || 'right';
      candidates.push(this.createCandidate(
        baseScore + 12,
        `最近邻居 (${direction}方向)`,
        element,
        {
          type: 'nearest-neighbor',
          direction,
          neighborAttr: 'mixed',
          neighborValue: this.getElementIdentifier(analysis.best),
          xpath: NeighborXPathBuilder.buildDirectionalNearestXPath(analysis.best, direction, element)
        }
      ));
    }

    // 策略3: 方向性第N个策略
    for (const direction of directions) {
      const neighborsInDirection = analysis.byDirection[direction];
      if (neighborsInDirection && neighborsInDirection.length >= 2) {
        // 第2个和第3个邻居
        for (let i = 1; i < Math.min(3, neighborsInDirection.length); i++) {
          const neighbor = neighborsInDirection[i];
          candidates.push(this.createCandidate(
            baseScore - (i * 5), // 越远分数越低
            `${direction}方向第${i + 1}个邻居`,
            element,
            {
              type: 'directional-nth',
              direction,
              position: i + 1,
              neighborAttr: 'position',
              neighborValue: `${direction}-${i + 1}`,
              xpath: NeighborXPathBuilder.buildDirectionalNthXPath(neighbor, direction, i + 1, element)
            }
          ));
        }
      }
    }

    return candidates;
  }

  /**
   * 获取元素标识符
   */
  private getElementIdentifier(element: any): string {
    if (element.attributes?.['resource-id']) {
      return `id:${element.attributes['resource-id']}`;
    }
    if (element.text && element.text.length < 20) {
      return `text:${element.text}`;
    }
    if (element.attributes?.['content-desc']) {
      return `desc:${element.attributes['content-desc']}`;
    }
    return `tag:${element.tag}`;
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
      id: `directional-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'neighbor-relative',
      sourceStep: 'neighbor-relative',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * this.getUniquenessMultiplier(criteria.type),
          stability: stability,
          performance: score * 0.8,
          reliability: score * this.getReliabilityMultiplier(criteria.type)
        },
        bonuses: this.getBonuses(criteria),
        penalties: this.getPenalties(criteria)
      },
      criteria: {
        fields: [criteria.neighborAttr, 'direction'],
        values: {
          [criteria.neighborAttr]: criteria.neighborValue,
          'direction': criteria.direction
        }
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { 
          isUnique: criteria.type === 'directional-resource-id'
        },
        errors: [],
        warnings: this.generateWarnings(criteria),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 90,
        deviceCompatibility: this.getDeviceCompatibility(criteria.type),
        complexity: 'medium'
      }
    };
  }

  /**
   * 计算稳定性分数
   */
  private calculateStability(criteria: any): number {
    const baseStability = 60;
    
    switch (criteria.type) {
      case 'directional-resource-id':
        return 80;
      case 'directional-text':
        return 65;
      case 'directional-content-desc':
        return 70;
      case 'nearest-neighbor':
        return 75;
      case 'directional-nth':
        return 45; // 位置策略稳定性较低
      default:
        return baseStability;
    }
  }

  /**
   * 获取唯一性乘数
   */
  private getUniquenessMultiplier(type: string): number {
    switch (type) {
      case 'directional-resource-id':
        return 0.9;
      case 'nearest-neighbor':
        return 0.8;
      case 'directional-text':
        return 0.7;
      case 'directional-content-desc':
        return 0.75;
      case 'directional-nth':
        return 0.6;
      default:
        return 0.7;
    }
  }

  /**
   * 获取可靠性乘数
   */
  private getReliabilityMultiplier(type: string): number {
    switch (type) {
      case 'directional-resource-id':
        return 0.9;
      case 'nearest-neighbor':
        return 0.85;
      case 'directional-text':
        return 0.7;
      case 'directional-content-desc':
        return 0.8;
      case 'directional-nth':
        return 0.5;
      default:
        return 0.7;
    }
  }

  /**
   * 获取奖励分数
   */
  private getBonuses(criteria: any): Array<{ reason: string; points: number }> {
    const bonuses: Array<{ reason: string; points: number }> = [];

    if (criteria.direction === 'right' || criteria.direction === 'below') {
      bonuses.push({ reason: '向右/向下的方向性匹配更常见', points: 3 });
    }

    if (criteria.type === 'directional-resource-id') {
      bonuses.push({ reason: '基于ID的方向性定位最稳定', points: 10 });
    }

    return bonuses;
  }

  /**
   * 获取惩罚分数
   */
  private getPenalties(criteria: any): Array<{ reason: string; points: number }> {
    const penalties: Array<{ reason: string; points: number }> = [];

    if (criteria.type === 'directional-nth' && criteria.position > 2) {
      penalties.push({ reason: '第N个位置策略在布局变化时容易失效', points: -10 });
    }

    if (criteria.direction === 'diagonal') {
      penalties.push({ reason: '对角线方向的定位准确性较低', points: -8 });
    }

    return penalties;
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any): string[] {
    const warnings: string[] = [];

    if (criteria.type === 'directional-nth') {
      warnings.push('位置策略可能因布局调整而失效');
    }

    if (criteria.type === 'directional-text' && criteria.neighborValue?.length > 20) {
      warnings.push('基于长文本的方向性定位可能不稳定');
    }

    if (criteria.direction === 'diagonal') {
      warnings.push('对角线方向的相对定位准确性较低');
    }

    return warnings;
  }

  /**
   * 获取设备兼容性
   */
  private getDeviceCompatibility(type: string): string[] {
    switch (type) {
      case 'directional-resource-id':
        return ['similar-layouts', 'different-resolutions'];
      case 'nearest-neighbor':
        return ['similar-layouts'];
      case 'directional-nth':
        return ['fragile'];
      default:
        return ['limited'];
    }
  }
}