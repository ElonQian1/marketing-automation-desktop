/**
 * DistanceConstraintStrategy.ts  
 * 距离约束策略 - 基于距离的元素定位
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { NeighborFinder, NeighborXPathBuilder } from '../calculators';
import { BoundsCalculator } from '../../../../../shared/bounds/BoundsCalculator';

export class DistanceConstraintStrategy {
  readonly name = 'DistanceConstraintStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    return analysis.all.length > 0;
  }

  /**
   * 分析距离约束策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const analysis = NeighborFinder.analyzeNeighbors(element, context);
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    
    let baseScore = 60; // 距离策略适中稳定性

    // 策略1: 最近的已知元素
    const nearestElements = this.findNearestElements(element, analysis.all, 3);
    for (const nearest of nearestElements) {
      const distance = BoundsCalculator.calculateDistance(bounds, BoundsCalculator.parseBounds(nearest.bounds));
      
      if (nearest.attributes?.['resource-id']) {
        candidates.push(this.createCandidate(
          baseScore + 15,
          `距离元素 "${nearest.attributes['resource-id']}" ${distance.toFixed(0)}px`,
          element,
          {
            type: 'distance-from-id',
            anchorId: nearest.attributes['resource-id'],
            distance: distance,
            direction: BoundsCalculator.calculateDirection(bounds, BoundsCalculator.parseBounds(nearest.bounds)),
            xpath: this.buildDistanceFromIdXPath(nearest, distance, element)
          }
        ));
      }

      if (nearest.text && nearest.text.length < 20) {
        candidates.push(this.createCandidate(
          baseScore + 10,
          `距离文本 "${nearest.text}" ${distance.toFixed(0)}px`,
          element,
          {
            type: 'distance-from-text',
            anchorText: nearest.text,
            distance: distance,
            direction: BoundsCalculator.calculateDirection(bounds, BoundsCalculator.parseBounds(nearest.bounds)),
            xpath: this.buildDistanceFromTextXPath(nearest, distance, element)
          }
        ));
      }
    }

    // 策略2: 固定距离范围内的元素
    const withinRange = this.findElementsWithinRange(element, analysis.all, 100); // 100px内
    if (withinRange.length > 0) {
      for (const inRange of withinRange.slice(0, 2)) {
        if (inRange.attributes?.['resource-id']) {
          candidates.push(this.createCandidate(
            baseScore + 12,
            `100px范围内的 "${inRange.attributes['resource-id']}"`,
            element,
            {
              type: 'within-range-id',
              anchorId: inRange.attributes['resource-id'],
              maxDistance: 100,
              xpath: this.buildWithinRangeXPath(inRange, 100, element)
            }
          ));
        }
      }
    }

    // 策略3: 相对距离比例
    const container = this.findContainer(element, context);
    if (container) {
      const containerBounds = BoundsCalculator.parseBounds(container.bounds);
      const relativePosition = this.calculateRelativePosition(bounds, containerBounds);
      
      candidates.push(this.createCandidate(
        baseScore + 8,
        `容器内相对位置 (${relativePosition.xPercent}%, ${relativePosition.yPercent}%)`,
        element,
        {
          type: 'relative-position',
          xPercent: relativePosition.xPercent,
          yPercent: relativePosition.yPercent,
          containerId: container.attributes?.['resource-id'] || container.tag,
          xpath: this.buildRelativePositionXPath(container, relativePosition, element)
        }
      ));
    }

    // 策略4: 区域中心距离 (简化版，没有 regionBounds)
    // const centerDistance = this.calculateCenterDistance(bounds, analysis.regionBounds);
    
    // 策略5: 多点距离约束
    const anchors = this.findAnchorElements(analysis.all, 2);
    if (anchors.length >= 2) {
      const distances = anchors.map(anchor => ({
        element: anchor,
        distance: BoundsCalculator.calculateDistance(bounds, BoundsCalculator.parseBounds(anchor.bounds))
      }));

      candidates.push(this.createCandidate(
        baseScore + 18,
        `多点定位: ${distances.map(d => `${d.element.attributes?.['resource-id'] || d.element.tag}(${d.distance.toFixed(0)}px)`).join(', ')}`,
        element,
        {
          type: 'multi-point-distance',
          anchors: distances,
          xpath: this.buildMultiPointXPath(distances, element)
        }
      ));
    }

    return candidates;
  }

  /**
   * 找到最近的元素
   */
  private findNearestElements(element: any, nearbyElements: any[], limit: number): any[] {
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    
    return nearbyElements
      .map(neighbor => ({
        element: neighbor,
        distance: BoundsCalculator.calculateDistance(bounds, BoundsCalculator.parseBounds(neighbor.bounds))
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(item => item.element);
  }

  /**
   * 找到指定范围内的元素
   */
  private findElementsWithinRange(element: any, nearbyElements: any[], range: number): any[] {
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    
    return nearbyElements.filter(neighbor => {
      const neighborBounds = BoundsCalculator.parseBounds(neighbor.bounds);
      const distance = BoundsCalculator.calculateDistance(bounds, neighborBounds);
      return distance <= range;
    });
  }

  /**
   * 找到容器元素
   */
  private findContainer(element: any, context: ElementAnalysisContext): any | null {
    // 简化实现 - 寻找包含此元素的最小容器
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    
    let bestContainer = null;
    let minArea = Infinity;

    for (const candidate of context.document.allNodes) {
      if (candidate === element) continue;
      
      const candidateBounds = BoundsCalculator.parseBounds(candidate.bounds?.toString());
      if (candidateBounds && BoundsCalculator.contains(candidateBounds, bounds)) {
        const area = (candidateBounds.right - candidateBounds.left) * (candidateBounds.bottom - candidateBounds.top);
        if (area < minArea) {
          minArea = area;
          bestContainer = candidate;
        }
      }
    }

    return bestContainer;
  }

  /**
   * 计算相对位置
   */
  private calculateRelativePosition(elementBounds: any, containerBounds: any): { xPercent: number; yPercent: number } {
    const xPercent = Math.round(((elementBounds.centerX - containerBounds.left) / containerBounds.width) * 100);
    const yPercent = Math.round(((elementBounds.centerY - containerBounds.top) / containerBounds.height) * 100);
    
    return { xPercent, yPercent };
  }

  /**
   * 计算到区域中心的距离
   */
  private calculateCenterDistance(elementBounds: any, regionBounds: any): number {
    if (!regionBounds) return Infinity;
    
    const regionCenter = {
      x: regionBounds.left + regionBounds.width / 2,
      y: regionBounds.top + regionBounds.height / 2
    };

    const dx = elementBounds.centerX - regionCenter.x;
    const dy = elementBounds.centerY - regionCenter.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 找到锚点元素
   */
  private findAnchorElements(nearbyElements: any[], limit: number): any[] {
    return nearbyElements
      .filter(element => 
        element.attributes?.['resource-id'] || 
        (element.text && element.text.length < 15)
      )
      .slice(0, limit);
  }

  /**
   * 构建基于ID距离的XPath
   */
  private buildDistanceFromIdXPath(anchor: any, distance: number, element: any): string {
    const anchorId = anchor.attributes?.['resource-id'];
    // 这是一个简化实现，实际XPath不直接支持距离计算
    return `//*[@resource-id='${anchorId}']/following::*[position()<=5]`;
  }

  /**
   * 构建基于文本距离的XPath
   */
  private buildDistanceFromTextXPath(anchor: any, distance: number, element: any): string {
    const anchorText = anchor.text?.replace(/'/g, "\\'");
    return `//*[text()='${anchorText}']/following::*[position()<=3]`;
  }

  /**
   * 构建范围内元素的XPath
   */
  private buildWithinRangeXPath(anchor: any, range: number, element: any): string {
    const anchorId = anchor.attributes?.['resource-id'];
    // 简化实现
    return `//*[@resource-id='${anchorId}']/parent::*//*[position()<=10]`;
  }

  /**
   * 构建相对位置XPath
   */
  private buildRelativePositionXPath(container: any, position: any, element: any): string {
    const containerId = container.attributes?.['resource-id'];
    if (containerId) {
      return `//*[@resource-id='${containerId}']/descendant::*[position()=${Math.ceil(position.yPercent / 10)}]`;
    } else {
      return `//${container.tag}/descendant::*[position()=${Math.ceil(position.yPercent / 10)}]`;
    }
  }

  /**
   * 构建中心距离XPath
   */
  private buildCenterDistanceXPath(regionBounds: any, distance: number, element: any): string {
    // XPath无法直接表达距离，使用位置近似
    return `//*[position()>=${Math.floor(distance / 50)} and position()<=${Math.ceil(distance / 30)}]`;
  }

  /**
   * 构建多点距离XPath
   */
  private buildMultiPointXPath(distances: any[], element: any): string {
    // 复杂的多点约束，使用第一个锚点作为基准
    const firstAnchor = distances[0].element;
    const anchorId = firstAnchor.attributes?.['resource-id'];
    
    if (anchorId) {
      return `//*[@resource-id='${anchorId}']/following::*[position()<=3] | //*[@resource-id='${anchorId}']/preceding::*[position()<=3]`;
    } else {
      return `//${firstAnchor.tag}/following::*[position()<=3]`;
    }
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
      id: `distance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'neighbor-relative',
      sourceStep: 'neighbor-relative',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * this.getUniquenessMultiplier(criteria.type),
          stability: stability,
          performance: score * 0.8, // 距离计算有一定性能开销
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
          isUnique: criteria.type === 'multi-point-distance' || criteria.type === 'distance-from-id'
        },
        errors: [],
        warnings: this.generateWarnings(criteria),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 120, // 距离计算相对耗时
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
      case 'distance-from-id':
        return 70; // ID锚点相对稳定
      case 'multi-point-distance':
        return 85; // 多点约束最稳定
      case 'within-range-id':
        return 75; // 范围约束较稳定
      case 'relative-position':
        return 60; // 相对位置中等稳定
      case 'distance-from-text':
        return 55; // 文本锚点较不稳定
      case 'center-distance':
        return 50; // 中心距离最不稳定
      default:
        return 60;
    }
  }

  /**
   * 获取字段列表
   */
  private getFields(criteria: any): string[] {
    switch (criteria.type) {
      case 'distance-from-id':
        return ['anchor-resource-id', 'distance', 'direction'];
      case 'distance-from-text':
        return ['anchor-text', 'distance', 'direction'];
      case 'within-range-id':
        return ['anchor-resource-id', 'max-distance'];
      case 'relative-position':
        return ['container-id', 'x-percent', 'y-percent'];
      case 'center-distance':
        return ['center-distance', 'region-bounds'];
      case 'multi-point-distance':
        return ['anchor-elements', 'distances'];
      default:
        return ['distance-constraint'];
    }
  }

  /**
   * 获取值对象
   */
  private getValues(criteria: any): Record<string, any> {
    switch (criteria.type) {
      case 'distance-from-id':
        return { 
          'anchor-resource-id': criteria.anchorId,
          'distance': criteria.distance,
          'direction': criteria.direction
        };
      case 'distance-from-text':
        return { 
          'anchor-text': criteria.anchorText,
          'distance': criteria.distance,
          'direction': criteria.direction
        };
      case 'within-range-id':
        return { 
          'anchor-resource-id': criteria.anchorId,
          'max-distance': criteria.maxDistance
        };
      case 'relative-position':
        return { 
          'container-id': criteria.containerId,
          'x-percent': criteria.xPercent,
          'y-percent': criteria.yPercent
        };
      case 'center-distance':
        return { 
          'center-distance': criteria.distance,
          'region-bounds': criteria.regionBounds
        };
      case 'multi-point-distance':
        return { 
          'anchor-elements': criteria.anchors.map((a: any) => a.element.attributes?.['resource-id'] || a.element.tag),
          'distances': criteria.anchors.map((a: any) => a.distance)
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
      case 'multi-point-distance':
        return 0.95;
      case 'distance-from-id':
        return 0.8;
      case 'within-range-id':
        return 0.75;
      case 'relative-position':
        return 0.7;
      case 'distance-from-text':
        return 0.65;
      case 'center-distance':
        return 0.5;
      default:
        return 0.7;
    }
  }

  /**
   * 获取可靠性乘数
   */
  private getReliabilityMultiplier(type: string): number {
    switch (type) {
      case 'multi-point-distance':
        return 0.9;
      case 'distance-from-id':
        return 0.8;
      case 'within-range-id':
        return 0.75;
      case 'relative-position':
        return 0.65;
      case 'distance-from-text':
        return 0.6;
      case 'center-distance':
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

    if (criteria.type === 'multi-point-distance') {
      bonuses.push({ reason: '多点约束提供高精度定位', points: 12 });
    }

    if (criteria.type === 'distance-from-id' && criteria.distance < 50) {
      bonuses.push({ reason: '近距离ID锚点非常可靠', points: 8 });
    }

    if (criteria.type === 'within-range-id' && criteria.maxDistance <= 100) {
      bonuses.push({ reason: '小范围约束提高精度', points: 6 });
    }

    return bonuses;
  }

  /**
   * 获取惩罚分数
   */
  private getPenalties(criteria: any): Array<{ reason: string; points: number }> {
    const penalties: Array<{ reason: string; points: number }> = [];

    if (criteria.type === 'center-distance') {
      penalties.push({ reason: '中心距离策略在布局变化时很脆弱', points: -10 });
    }

    if (criteria.type === 'distance-from-text' && criteria.anchorText?.length > 20) {
      penalties.push({ reason: '长文本锚点可能发生变化', points: -6 });
    }

    if (criteria.distance && criteria.distance > 300) {
      penalties.push({ reason: '过大的距离约束降低可靠性', points: -8 });
    }

    return penalties;
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any): string[] {
    const warnings: string[] = [];

    if (criteria.type === 'center-distance') {
      warnings.push('中心距离策略对屏幕尺寸敏感');
    }

    if (criteria.type === 'relative-position') {
      warnings.push('相对位置在动态内容变化时可能失效');
    }

    if (criteria.distance && criteria.distance > 200) {
      warnings.push('距离过大可能影响定位精度');
    }

    return warnings;
  }

  /**
   * 获取设备兼容性
   */
  private getDeviceCompatibility(type: string): string[] {
    switch (type) {
      case 'multi-point-distance':
        return ['similar-layouts', 'different-densities'];
      case 'distance-from-id':
        return ['similar-layouts'];
      case 'within-range-id':
        return ['similar-layouts'];
      case 'relative-position':
        return ['different-resolutions', 'similar-ratios'];
      case 'distance-from-text':
        return ['similar-layouts'];
      case 'center-distance':
        return ['fragile'];
      default:
        return ['limited'];
    }
  }
}