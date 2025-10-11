// src/modules/intelligent-strategy-system/analyzers/neighbor-relative/strategies/SiblingStrategy.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * SiblingStrategy.ts
 * 兄弟元素策略 - 基于兄弟元素关系的定位
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { NeighborFinder, NeighborXPathBuilder } from '../calculators';

export class SiblingStrategy {
  readonly name = 'SiblingStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    return analysis.siblings.length > 0;
  }

  /**
   * 分析兄弟元素策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    
    let baseScore = 65; // 兄弟元素策略相对稳定

    // 策略1: 兄弟元素索引
    const siblingIndex = this.calculateSiblingIndex(element, analysis.siblings);
    if (siblingIndex > 0) {
      candidates.push(this.createCandidate(
        baseScore + 10,
        `第${siblingIndex}个兄弟元素`,
        element,
        {
          type: 'sibling-index',
          index: siblingIndex,
          xpath: NeighborXPathBuilder.buildSiblingIndexXPath(element, siblingIndex)
        }
      ));
    }

    // 策略2: 同类型兄弟元素索引
    const sameTypeSiblings = analysis.siblings.filter(sibling => sibling.tag === element.tag);
    const sameTypeIndex = this.calculateSameTypeIndex(element, sameTypeSiblings);
    if (sameTypeIndex > 0 && sameTypeSiblings.length > 1) {
      candidates.push(this.createCandidate(
        baseScore + 15,
        `第${sameTypeIndex}个${element.tag}类型兄弟`,
        element,
        {
          type: 'same-type-sibling',
          index: sameTypeIndex,
          elementType: element.tag,
          xpath: NeighborXPathBuilder.buildSameTypeSiblingXPath(element, sameTypeIndex)
        }
      ));
    }

    // 策略3: 相对于兄弟元素的定位
    for (const sibling of analysis.siblings.slice(0, 3)) { // 只取前3个兄弟
      if (sibling.attributes?.['resource-id']) {
        const relativePosition = this.calculateRelativePosition(element, sibling);
        candidates.push(this.createCandidate(
          baseScore + 12,
          `相对于兄弟元素 "${sibling.attributes['resource-id']}" ${relativePosition}`,
          element,
          {
            type: 'relative-to-sibling',
            siblingId: sibling.attributes['resource-id'],
            position: relativePosition,
            xpath: this.buildRelativeToSiblingXPath(sibling, relativePosition, element)
          }
        ));
      }

      if (sibling.text && sibling.text.length < 30) {
        const relativePosition = this.calculateRelativePosition(element, sibling);
        candidates.push(this.createCandidate(
          baseScore + 8,
          `相对于兄弟文本 "${sibling.text.substring(0, 15)}..." ${relativePosition}`,
          element,
          {
            type: 'relative-to-sibling-text',
            siblingText: sibling.text,
            position: relativePosition,
            xpath: this.buildRelativeToSiblingTextXPath(sibling, relativePosition, element)
          }
        ));
      }
    }

    // 策略4: 兄弟元素组合定位
    if (analysis.siblings.length >= 2) {
      const firstSibling = analysis.siblings[0];
      const lastSibling = analysis.siblings[analysis.siblings.length - 1];
      
      if (firstSibling.attributes?.['resource-id'] && lastSibling.attributes?.['resource-id']) {
        candidates.push(this.createCandidate(
          baseScore + 5,
          `在兄弟元素 "${firstSibling.attributes['resource-id']}" 和 "${lastSibling.attributes['resource-id']}" 之间`,
          element,
          {
            type: 'between-siblings',
            firstSiblingId: firstSibling.attributes['resource-id'],
            lastSiblingId: lastSibling.attributes['resource-id'],
            xpath: this.buildBetweenSiblingsXPath(firstSibling, lastSibling, element)
          }
        ));
      }
    }

    return candidates;
  }

  /**
   * 计算兄弟元素索引
   */
  private calculateSiblingIndex(element: any, siblings: any[]): number {
    // 简化实现 - 实际需要XML DOM遍历
    return siblings.indexOf(element) + 1;
  }

  /**
   * 计算同类型索引
   */
  private calculateSameTypeIndex(element: any, sameTypeSiblings: any[]): number {
    return sameTypeSiblings.indexOf(element) + 1;
  }

  /**
   * 计算相对位置
   */
  private calculateRelativePosition(element: any, sibling: any): string {
    // 简化实现 - 基于索引判断
    const elementIndex = element.index || 0;
    const siblingIndex = sibling.index || 0;
    
    if (elementIndex > siblingIndex) {
      return 'after';
    } else if (elementIndex < siblingIndex) {
      return 'before';
    } else {
      return 'same-level';
    }
  }

  /**
   * 构建相对于兄弟元素的XPath
   */
  private buildRelativeToSiblingXPath(sibling: any, position: string, element: any): string {
    const siblingId = sibling.attributes?.['resource-id'];
    const elementTag = element.tag || '*';
    
    if (position === 'after') {
      return `//*[@resource-id='${siblingId}']/following-sibling::${elementTag}`;
    } else if (position === 'before') {
      return `//*[@resource-id='${siblingId}']/preceding-sibling::${elementTag}`;
    } else {
      return `//*[@resource-id='${siblingId}']/parent::*/${elementTag}`;
    }
  }

  /**
   * 构建相对于兄弟文本的XPath
   */
  private buildRelativeToSiblingTextXPath(sibling: any, position: string, element: any): string {
    const siblingText = sibling.text?.replace(/'/g, "\\'");
    const elementTag = element.tag || '*';
    
    if (position === 'after') {
      return `//*[text()='${siblingText}']/following-sibling::${elementTag}`;
    } else if (position === 'before') {
      return `//*[text()='${siblingText}']/preceding-sibling::${elementTag}`;
    } else {
      return `//*[text()='${siblingText}']/parent::*/${elementTag}`;
    }
  }

  /**
   * 构建两个兄弟元素之间的XPath
   */
  private buildBetweenSiblingsXPath(firstSibling: any, lastSibling: any, element: any): string {
    const firstId = firstSibling.attributes?.['resource-id'];
    const lastId = lastSibling.attributes?.['resource-id'];
    const elementTag = element.tag || '*';
    
    // XPath表达式比较复杂，这里提供一个简化版本
    return `//*[@resource-id='${firstId}']/following-sibling::${elementTag}[following-sibling::*[@resource-id='${lastId}']]`;
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
      id: `sibling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'neighbor-relative',
      sourceStep: 'neighbor-relative',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * this.getUniquenessMultiplier(criteria.type),
          stability: stability,
          performance: score * 0.85,
          reliability: score * this.getReliabilityMultiplier(criteria.type)
        },
        bonuses: this.getBonuses(criteria),
        penalties: this.getPenalties(criteria)
      },
      criteria: {
        fields: this.getFields(criteria),
        values: this.getValues(criteria)
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { 
          isUnique: criteria.type === 'relative-to-sibling' && !!criteria.siblingId
        },
        errors: [],
        warnings: this.generateWarnings(criteria),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 75,
        deviceCompatibility: this.getDeviceCompatibility(criteria.type),
        complexity: 'medium'
      }
    };
  }

  /**
   * 计算稳定性分数
   */
  private calculateStability(criteria: any): number {
    switch (criteria.type) {
      case 'same-type-sibling':
        return 75; // 同类型兄弟相对稳定
      case 'relative-to-sibling':
        return 80; // 基于ID的兄弟关系很稳定
      case 'sibling-index':
        return 60; // 索引策略中等稳定
      case 'relative-to-sibling-text':
        return 65; // 基于文本的兄弟关系
      case 'between-siblings':
        return 70; // 两个锚点之间相对稳定
      default:
        return 65;
    }
  }

  /**
   * 获取字段列表
   */
  private getFields(criteria: any): string[] {
    switch (criteria.type) {
      case 'sibling-index':
        return ['sibling-index'];
      case 'same-type-sibling':
        return ['same-type-index', 'element-type'];
      case 'relative-to-sibling':
        return ['sibling-resource-id', 'relative-position'];
      case 'relative-to-sibling-text':
        return ['sibling-text', 'relative-position'];
      case 'between-siblings':
        return ['first-sibling-id', 'last-sibling-id'];
      default:
        return ['sibling-relation'];
    }
  }

  /**
   * 获取值对象
   */
  private getValues(criteria: any): Record<string, any> {
    switch (criteria.type) {
      case 'sibling-index':
        return { 'sibling-index': criteria.index };
      case 'same-type-sibling':
        return { 
          'same-type-index': criteria.index,
          'element-type': criteria.elementType
        };
      case 'relative-to-sibling':
        return { 
          'sibling-resource-id': criteria.siblingId,
          'relative-position': criteria.position
        };
      case 'relative-to-sibling-text':
        return { 
          'sibling-text': criteria.siblingText,
          'relative-position': criteria.position
        };
      case 'between-siblings':
        return { 
          'first-sibling-id': criteria.firstSiblingId,
          'last-sibling-id': criteria.lastSiblingId
        };
      default:
        return {};
    }
  }

  /**
   * 获取唯一性乘数
   */
  private getUniquenessMultiplier(type: string): number {
    switch (type) {
      case 'relative-to-sibling':
        return 0.85;
      case 'same-type-sibling':
        return 0.75;
      case 'between-siblings':
        return 0.8;
      case 'sibling-index':
        return 0.7;
      case 'relative-to-sibling-text':
        return 0.65;
      default:
        return 0.7;
    }
  }

  /**
   * 获取可靠性乘数
   */
  private getReliabilityMultiplier(type: string): number {
    switch (type) {
      case 'relative-to-sibling':
        return 0.9;
      case 'same-type-sibling':
        return 0.8;
      case 'between-siblings':
        return 0.85;
      case 'sibling-index':
        return 0.7;
      case 'relative-to-sibling-text':
        return 0.75;
      default:
        return 0.75;
    }
  }

  /**
   * 获取奖励分数
   */
  private getBonuses(criteria: any): Array<{ reason: string; points: number }> {
    const bonuses: Array<{ reason: string; points: number }> = [];

    if (criteria.type === 'relative-to-sibling') {
      bonuses.push({ reason: '兄弟元素ID关系稳定可靠', points: 8 });
    }

    if (criteria.type === 'same-type-sibling' && criteria.index === 1) {
      bonuses.push({ reason: '第一个同类型元素通常更稳定', points: 5 });
    }

    return bonuses;
  }

  /**
   * 获取惩罚分数
   */
  private getPenalties(criteria: any): Array<{ reason: string; points: number }> {
    const penalties: Array<{ reason: string; points: number }> = [];

    if (criteria.type === 'sibling-index' && criteria.index > 5) {
      penalties.push({ reason: '过大的兄弟索引在布局变化时容易失效', points: -8 });
    }

    if (criteria.type === 'relative-to-sibling-text' && criteria.siblingText?.length > 25) {
      penalties.push({ reason: '基于长文本的兄弟定位可能不稳定', points: -5 });
    }

    return penalties;
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any): string[] {
    const warnings: string[] = [];

    if (criteria.type === 'sibling-index') {
      warnings.push('兄弟索引策略可能因添加/删除元素而失效');
    }

    if (criteria.type === 'relative-to-sibling-text') {
      warnings.push('基于文本的兄弟定位在文本变化时会失效');
    }

    if (criteria.type === 'between-siblings') {
      warnings.push('两个锚点之间的定位要求两个锚点都存在');
    }

    return warnings;
  }

  /**
   * 获取设备兼容性
   */
  private getDeviceCompatibility(type: string): string[] {
    switch (type) {
      case 'relative-to-sibling':
        return ['similar-layouts', 'different-resolutions'];
      case 'same-type-sibling':
        return ['similar-layouts'];
      case 'between-siblings':
        return ['similar-layouts'];
      case 'sibling-index':
        return ['fragile'];
      default:
        return ['limited'];
    }
  }
}