/**
 * MultiNeighborStrategy.ts
 * 多邻居组合策略 - 基于多个邻居元素的组合定位
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { NeighborFinder, NeighborXPathBuilder } from '../calculators';
import { BoundsCalculator } from '../../../../../shared/bounds/BoundsCalculator';

export class MultiNeighborStrategy {
  readonly name = 'MultiNeighborStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    return analysis.all.length >= 2; // 至少需要2个邻居
  }

  /**
   * 分析多邻居组合策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    
    let baseScore = 75; // 多邻居策略通常更稳定

    // 策略1: 左右邻居组合
    const leftNeighbors = analysis.byDirection.left?.slice(0, 2) || [];
    const rightNeighbors = analysis.byDirection.right?.slice(0, 2) || [];
    
    if (leftNeighbors.length > 0 && rightNeighbors.length > 0) {
      const leftAnchor = leftNeighbors[0];
      const rightAnchor = rightNeighbors[0];
      
      if (leftAnchor.attributes?.['resource-id'] && rightAnchor.attributes?.['resource-id']) {
        candidates.push(this.createCandidate(
          baseScore + 20,
          `在 "${leftAnchor.attributes['resource-id']}" 和 "${rightAnchor.attributes['resource-id']}" 之间`,
          element,
          {
            type: 'between-left-right',
            leftAnchorId: leftAnchor.attributes['resource-id'],
            rightAnchorId: rightAnchor.attributes['resource-id'],
            xpath: this.buildBetweenHorizontalXPath(leftAnchor, rightAnchor, element)
          }
        ));
      }
    }

    // 策略2: 上下邻居组合
    const aboveNeighbors = analysis.byDirection.above?.slice(0, 2) || [];
    const belowNeighbors = analysis.byDirection.below?.slice(0, 2) || [];
    
    if (aboveNeighbors.length > 0 && belowNeighbors.length > 0) {
      const topAnchor = aboveNeighbors[0];
      const bottomAnchor = belowNeighbors[0];
      
      if (topAnchor.attributes?.['resource-id'] && bottomAnchor.attributes?.['resource-id']) {
        candidates.push(this.createCandidate(
          baseScore + 18,
          `在 "${topAnchor.attributes['resource-id']}" 上下方向和 "${bottomAnchor.attributes['resource-id']}" 之间`,
          element,
          {
            type: 'between-top-bottom',
            topAnchorId: topAnchor.attributes['resource-id'],
            bottomAnchorId: bottomAnchor.attributes['resource-id'],
            xpath: this.buildBetweenVerticalXPath(topAnchor, bottomAnchor, element)
          }
        ));
      }
    }

    // 策略3: 四方向邻居（最强约束）
    const fourDirections = this.getFourDirectionAnchors(analysis.byDirection);
    if (fourDirections.count >= 3) { // 至少3个方向有邻居
      candidates.push(this.createCandidate(
        baseScore + 25,
        `四方向定位: ${fourDirections.description}`,
        element,
        {
          type: 'four-direction-constraint',
          anchors: fourDirections.anchors,
          xpath: this.buildFourDirectionXPath(fourDirections.anchors, element)
        }
      ));
    }

    // 策略4: 最近的N个邻居组合
    const nearestNeighbors = this.getNearestNeighbors(analysis.all, element, 3);
    if (nearestNeighbors.length >= 2) {
      const anchorsWithIds = nearestNeighbors.filter(neighbor => 
        neighbor.attributes?.['resource-id'] || neighbor.text
      );
      
      if (anchorsWithIds.length >= 2) {
        candidates.push(this.createCandidate(
          baseScore + 12,
          `最近${anchorsWithIds.length}个邻居组合定位`,
          element,
          {
            type: 'nearest-neighbors-combination',
            neighbors: anchorsWithIds.map(n => ({
              id: n.attributes?.['resource-id'],
              text: n.text,
              distance: n._neighborMeta?.distance
            })),
            xpath: this.buildNearestNeighborsXPath(anchorsWithIds, element)
          }
        ));
      }
    }

    // 策略5: 同级邻居链
    const siblingChain = this.buildSiblingChain(analysis.siblings, element);
    if (siblingChain.length >= 2) {
      candidates.push(this.createCandidate(
        baseScore + 15,
        `兄弟元素链定位 (${siblingChain.length}个元素)`,
        element,
        {
          type: 'sibling-chain',
          chain: siblingChain,
          xpath: this.buildSiblingChainXPath(siblingChain, element)
        }
      ));
    }

    // 策略6: 层次结构组合
    const hierarchyAnchors = this.findHierarchyAnchors(element, context);
    if (hierarchyAnchors.length >= 2) {
      candidates.push(this.createCandidate(
        baseScore + 10,
        `层次结构组合定位`,
        element,
        {
          type: 'hierarchy-combination',
          anchors: hierarchyAnchors,
          xpath: this.buildHierarchyXPath(hierarchyAnchors, element)
        }
      ));
    }

    return candidates;
  }

  /**
   * 获取四个方向的锚点
   */
  private getFourDirectionAnchors(byDirection: Record<string, any[]>): {
    count: number;
    anchors: Record<string, any>;
    description: string;
  } {
    const directions = ['left', 'right', 'above', 'below'];
    const anchors: Record<string, any> = {};
    const descriptions: string[] = [];
    
    directions.forEach(direction => {
      const neighbors = byDirection[direction] || [];
      const bestNeighbor = neighbors.find(n => 
        n.attributes?.['resource-id'] || (n.text && n.text.length < 15)
      );
      
      if (bestNeighbor) {
        anchors[direction] = bestNeighbor;
        const identifier = bestNeighbor.attributes?.['resource-id'] || bestNeighbor.text?.substring(0, 10);
        descriptions.push(`${direction}:${identifier}`);
      }
    });
    
    return {
      count: Object.keys(anchors).length,
      anchors,
      description: descriptions.join(', ')
    };
  }

  /**
   * 获取最近的N个邻居
   */
  private getNearestNeighbors(allNeighbors: any[], element: any, count: number): any[] {
    return allNeighbors
      .sort((a, b) => (a._neighborMeta?.distance || 0) - (b._neighborMeta?.distance || 0))
      .slice(0, count);
  }

  /**
   * 构建兄弟元素链
   */
  private buildSiblingChain(siblings: any[], element: any): any[] {
    const chain: any[] = [];
    
    // 找到有稳定标识符的兄弟元素
    siblings.forEach(sibling => {
      if (sibling.attributes?.['resource-id'] || 
          (sibling.text && sibling.text.length < 20 && sibling.text.length > 2)) {
        chain.push(sibling);
      }
    });
    
    return chain.slice(0, 4); // 最多4个兄弟元素
  }

  /**
   * 查找层次结构锚点
   */
  private findHierarchyAnchors(element: any, context: ElementAnalysisContext): any[] {
    const anchors: any[] = [];
    
    // 查找父级锚点
    let current = element.parent;
    let level = 0;
    while (current && level < 3) {
      if (current.attributes?.['resource-id']) {
        anchors.push({
          ...current,
          hierarchyRole: 'parent',
          level: level + 1
        });
        break;
      }
      current = current.parent;
      level++;
    }
    
    // 查找子级锚点
    if (element.children && element.children.length > 0) {
      const childWithId = element.children.find((child: any) => 
        child.attributes?.['resource-id']
      );
      if (childWithId) {
        anchors.push({
          ...childWithId,
          hierarchyRole: 'child',
          level: 1
        });
      }
    }
    
    return anchors;
  }

  /**
   * 构建水平方向之间的XPath
   */
  private buildBetweenHorizontalXPath(leftAnchor: any, rightAnchor: any, element: any): string {
    const leftId = leftAnchor.attributes?.['resource-id'];
    const rightId = rightAnchor.attributes?.['resource-id'];
    const elementTag = element.tag || '*';
    
    return `//*[@resource-id='${leftId}']/following-sibling::${elementTag}[following-sibling::*[@resource-id='${rightId}']]`;
  }

  /**
   * 构建垂直方向之间的XPath
   */
  private buildBetweenVerticalXPath(topAnchor: any, bottomAnchor: any, element: any): string {
    const topId = topAnchor.attributes?.['resource-id'];
    const bottomId = bottomAnchor.attributes?.['resource-id'];
    const elementTag = element.tag || '*';
    
    // 垂直方向的XPath比较复杂，这里提供简化版本
    return `//*[@resource-id='${topId}']/following::${elementTag}[following::*[@resource-id='${bottomId}']]`;
  }

  /**
   * 构建四方向约束XPath
   */
  private buildFourDirectionXPath(anchors: Record<string, any>, element: any): string {
    const elementTag = element.tag || '*';
    
    // 优先使用最稳定的锚点构建XPath
    if (anchors.left?.attributes?.['resource-id']) {
      const leftId = anchors.left.attributes['resource-id'];
      return `//*[@resource-id='${leftId}']/following-sibling::${elementTag}`;
    }
    
    if (anchors.above?.attributes?.['resource-id']) {
      const aboveId = anchors.above.attributes['resource-id'];
      return `//*[@resource-id='${aboveId}']/following::${elementTag}`;
    }
    
    return `//parent::*/${elementTag}[position()=1]`;
  }

  /**
   * 构建最近邻居XPath
   */
  private buildNearestNeighborsXPath(neighbors: any[], element: any): string {
    const elementTag = element.tag || '*';
    const firstNeighbor = neighbors[0];
    
    if (firstNeighbor.attributes?.['resource-id']) {
      const anchorId = firstNeighbor.attributes['resource-id'];
      return `//*[@resource-id='${anchorId}']/following-sibling::${elementTag}[1]`;
    }
    
    if (firstNeighbor.text) {
      const anchorText = firstNeighbor.text.replace(/'/g, "\\'");
      return `//*[text()='${anchorText}']/following-sibling::${elementTag}[1]`;
    }
    
    return `//parent::*/${elementTag}`;
  }

  /**
   * 构建兄弟链XPath
   */
  private buildSiblingChainXPath(chain: any[], element: any): string {
    const elementTag = element.tag || '*';
    
    if (chain.length === 0) return `//parent::*/${elementTag}`;
    
    const firstSibling = chain[0];
    if (firstSibling.attributes?.['resource-id']) {
      const siblingId = firstSibling.attributes['resource-id'];
      return `//*[@resource-id='${siblingId}']/following-sibling::${elementTag}`;
    }
    
    return `//parent::*/${elementTag}[position()>1]`;
  }

  /**
   * 构建层次结构XPath
   */
  private buildHierarchyXPath(anchors: any[], element: any): string {
    const elementTag = element.tag || '*';
    
    const parentAnchor = anchors.find(a => a.hierarchyRole === 'parent');
    if (parentAnchor?.attributes?.['resource-id']) {
      const parentId = parentAnchor.attributes['resource-id'];
      return `//*[@resource-id='${parentId}']/descendant::${elementTag}`;
    }
    
    const childAnchor = anchors.find(a => a.hierarchyRole === 'child');
    if (childAnchor?.attributes?.['resource-id']) {
      const childId = childAnchor.attributes['resource-id'];
      return `//*[@resource-id='${childId}']/parent::${elementTag}`;
    }
    
    return `//parent::*/${elementTag}`;
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
      id: `multi-neighbor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'neighbor-relative',
      sourceStep: 'neighbor-relative',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * this.getUniquenessMultiplier(criteria.type),
          stability: stability,
          performance: score * 0.7, // 多邻居策略计算较复杂
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
          isUnique: criteria.type === 'four-direction-constraint' || criteria.type === 'between-left-right'
        },
        errors: [],
        warnings: this.generateWarnings(criteria),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 150, // 多邻居策略执行时间较长
        deviceCompatibility: this.getDeviceCompatibility(criteria.type),
        complexity: 'complex'
      }
    };
  }

  /**
   * 计算稳定性分数
   */
  private calculateStability(criteria: any): number {
    switch (criteria.type) {
      case 'four-direction-constraint':
        return 95; // 四方向约束最稳定
      case 'between-left-right':
        return 85; // 左右约束很稳定
      case 'between-top-bottom':
        return 80; // 上下约束较稳定
      case 'nearest-neighbors-combination':
        return 75; // 最近邻组合稳定
      case 'sibling-chain':
        return 70; // 兄弟链较稳定
      case 'hierarchy-combination':
        return 65; // 层次组合中等稳定
      default:
        return 75;
    }
  }

  /**
   * 获取字段列表
   */
  private getFields(criteria: any): string[] {
    switch (criteria.type) {
      case 'between-left-right':
        return ['left-anchor-id', 'right-anchor-id'];
      case 'between-top-bottom':
        return ['top-anchor-id', 'bottom-anchor-id'];
      case 'four-direction-constraint':
        return ['direction-anchors'];
      case 'nearest-neighbors-combination':
        return ['neighbor-ids', 'distances'];
      case 'sibling-chain':
        return ['sibling-chain'];
      case 'hierarchy-combination':
        return ['hierarchy-anchors'];
      default:
        return ['multi-neighbor-constraint'];
    }
  }

  /**
   * 获取值对象
   */
  private getValues(criteria: any): Record<string, any> {
    switch (criteria.type) {
      case 'between-left-right':
        return { 
          'left-anchor-id': criteria.leftAnchorId,
          'right-anchor-id': criteria.rightAnchorId
        };
      case 'between-top-bottom':
        return { 
          'top-anchor-id': criteria.topAnchorId,
          'bottom-anchor-id': criteria.bottomAnchorId
        };
      case 'four-direction-constraint':
        return { 'direction-anchors': criteria.anchors };
      case 'nearest-neighbors-combination':
        return { 
          'neighbor-ids': criteria.neighbors.map((n: any) => n.id || n.text),
          'distances': criteria.neighbors.map((n: any) => n.distance)
        };
      case 'sibling-chain':
        return { 'sibling-chain': criteria.chain };
      case 'hierarchy-combination':
        return { 'hierarchy-anchors': criteria.anchors };
      default:
        return {};
    }
  }

  /**
   * 获取唯一性乘数
   */
  private getUniquenessMultiplier(type: string): number {
    switch (type) {
      case 'four-direction-constraint':
        return 0.98;
      case 'between-left-right':
        return 0.9;
      case 'between-top-bottom':
        return 0.85;
      case 'nearest-neighbors-combination':
        return 0.8;
      case 'sibling-chain':
        return 0.75;
      case 'hierarchy-combination':
        return 0.7;
      default:
        return 0.8;
    }
  }

  /**
   * 获取可靠性乘数
   */
  private getReliabilityMultiplier(type: string): number {
    switch (type) {
      case 'four-direction-constraint':
        return 0.95;
      case 'between-left-right':
        return 0.9;
      case 'between-top-bottom':
        return 0.85;
      case 'nearest-neighbors-combination':
        return 0.8;
      case 'sibling-chain':
        return 0.75;
      case 'hierarchy-combination':
        return 0.7;
      default:
        return 0.8;
    }
  }

  /**
   * 获取奖励分数
   */
  private getBonuses(criteria: any): Array<{ reason: string; points: number }> {
    const bonuses: Array<{ reason: string; points: number }> = [];

    if (criteria.type === 'four-direction-constraint') {
      bonuses.push({ reason: '四方向约束提供最高精度定位', points: 15 });
    }

    if (criteria.type === 'between-left-right' || criteria.type === 'between-top-bottom') {
      bonuses.push({ reason: '双向约束大幅提高定位稳定性', points: 10 });
    }

    if (criteria.type === 'nearest-neighbors-combination' && criteria.neighbors?.length >= 3) {
      bonuses.push({ reason: '多邻居组合增强抗干扰能力', points: 8 });
    }

    return bonuses;
  }

  /**
   * 获取惩罚分数
   */
  private getPenalties(criteria: any): Array<{ reason: string; points: number }> {
    const penalties: Array<{ reason: string; points: number }> = [];

    if (criteria.type === 'hierarchy-combination') {
      penalties.push({ reason: '层次结构约束在动态布局中可能失效', points: -5 });
    }

    if (criteria.type === 'sibling-chain' && criteria.chain?.length > 4) {
      penalties.push({ reason: '过长的兄弟链增加脆弱性', points: -8 });
    }

    return penalties;
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any): string[] {
    const warnings: string[] = [];

    if (criteria.type === 'four-direction-constraint') {
      warnings.push('四方向约束要求所有锚点都存在，任一缺失都可能失效');
    }

    if (criteria.type === 'nearest-neighbors-combination') {
      warnings.push('最近邻组合在元素新增时可能发生变化');
    }

    if (criteria.type === 'hierarchy-combination') {
      warnings.push('层次结构组合对DOM变化敏感');
    }

    return warnings;
  }

  /**
   * 获取设备兼容性
   */
  private getDeviceCompatibility(type: string): string[] {
    switch (type) {
      case 'four-direction-constraint':
        return ['similar-layouts', 'different-resolutions', 'robust'];
      case 'between-left-right':
      case 'between-top-bottom':
        return ['similar-layouts', 'different-resolutions'];
      case 'nearest-neighbors-combination':
        return ['similar-layouts'];
      case 'sibling-chain':
        return ['similar-layouts', 'limited-changes'];
      case 'hierarchy-combination':
        return ['similar-layouts'];
      default:
        return ['similar-layouts'];
    }
  }
}