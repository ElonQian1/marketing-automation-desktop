/**
 * 区域容器策略分析器
 * 提取自 RegionScopedAnalyzer，专门负责基于区域容器的策略分析
 */

import { BoundsCalculator } from '../../../../../shared/bounds/BoundsCalculator';
import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import type { RegionInfo } from '../types';

/**
 * 区域容器策略分析器
 */
export class RegionContainerAnalyzer {
  
  /**
   * 分析区域容器策略
   */
  async analyzeRegionContainerStrategies(
    element: any,
    context: ElementAnalysisContext,
    containingRegions: RegionInfo[]
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    let baseScore = 79;

    for (const region of containingRegions.slice(0, 3)) { // 取前3个最相关的区域
      // 策略1: 基于区域容器的resource-id
      if (this.hasValidResourceId(region.container)) {
        const regionId = region.container.attributes['resource-id'];
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore + 10,
          `通过区域容器定位: ${regionId}`,
          context,
          {
            criteria: {
              fields: ['region-container-id', 'target-bounds'],
              values: {
                'region-container-id': regionId,
                'target-bounds': this.formatBounds(element.bounds)
              },
              xpath: this.buildRegionContainerXPath(region.container, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      // 策略2: 基于区域类型和相对位置
      if (region.type && region.type !== 'unknown') {
        const relativePosition = this.calculateRelativePosition(element, region);
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore + 5,
          `通过区域类型定位: ${region.type} - ${relativePosition.description}`,
          context,
          {
            criteria: {
              fields: ['region-type', 'relative-position'],
              values: {
                'region-type': region.type,
                'relative-direction': relativePosition.direction,
                'relative-distance': relativePosition.distance
              },
              xpath: this.buildRegionTypeXPath(region.type, relativePosition, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      // 策略3: 基于区域索引和层级
      const regionIndex = this.calculateRegionIndex(region, context);
      if (regionIndex >= 0) {
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore,
          `通过区域索引定位: 第${regionIndex + 1}个区域`,
          context,
          {
            criteria: {
              fields: ['region-index', 'region-class'],
              values: {
                'region-index': regionIndex,
                'region-class': region.container.tag
              },
              xpath: this.buildRegionIndexXPath(regionIndex, region.container, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      baseScore -= 3;
    }

    return candidates;
  }

  /**
   * 计算相对位置
   */
  private calculateRelativePosition(element: any, region: RegionInfo) {
    const elementBounds = BoundsCalculator.getBoundsInfo(element.bounds);
    const regionBounds = region.bounds;
    
    if (!elementBounds) {
      return { direction: 'inside' as const, distance: 0, description: '位置未知' };
    }

    const elementCenterX = (elementBounds.left + elementBounds.right) / 2;
    const elementCenterY = (elementBounds.top + elementBounds.bottom) / 2;
    const regionCenterX = (regionBounds.left + regionBounds.right) / 2;
    const regionCenterY = (regionBounds.top + regionBounds.bottom) / 2;

    const dx = elementCenterX - regionCenterX;
    const dy = elementCenterY - regionCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let direction: 'above' | 'below' | 'left' | 'right' | 'inside' = 'inside';
    let description = '';

    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
      description = `位于区域${direction === 'right' ? '右侧' : '左侧'}`;
    } else {
      direction = dy > 0 ? 'below' : 'above';
      description = `位于区域${direction === 'below' ? '下方' : '上方'}`;
    }

    return { direction, distance: Math.round(distance), description };
  }

  /**
   * 计算区域索引
   */
  private calculateRegionIndex(region: RegionInfo, context: ElementAnalysisContext): number {
    const sameTypeRegions = context.document.allNodes.filter(el => 
      el.tag === region.container.tag && this.isContainer(el)
    );

    return sameTypeRegions.indexOf(region.container);
  }

  /**
   * 构建区域容器XPath
   */
  private buildRegionContainerXPath(container: any, element: any): string {
    const resourceId = container.attributes['resource-id'];
    const elementTag = element.tag;
    return `//*[@resource-id="${resourceId}"]//${elementTag}`;
  }

  /**
   * 构建区域类型XPath
   */
  private buildRegionTypeXPath(regionType: string, relativePosition: any, element: any): string {
    // 简化的XPath构建逻辑
    return `//*[contains(@class,"${regionType}")]//${element.tag}`;
  }

  /**
   * 构建区域索引XPath
   */
  private buildRegionIndexXPath(index: number, container: any, element: any): string {
    return `(//${container.tag})[${index + 1}]//${element.tag}`;
  }

  /**
   * 格式化边界
   */
  private formatBounds(bounds: any): string {
    if (typeof bounds === 'string') return bounds;
    const boundsInfo = BoundsCalculator.getBoundsInfo(bounds);
    return boundsInfo ? BoundsCalculator.rectToBoundsString(boundsInfo) : '';
  }

  /**
   * 检查是否有有效的resource-id
   */
  private hasValidResourceId(element: any): boolean {
    const resourceId = element.attributes?.['resource-id'];
    return resourceId && resourceId.trim().length > 0 && !resourceId.includes('$');
  }

  /**
   * 检查是否为容器
   */
  private isContainer(element: any): boolean {
    const containerTags = [
      'LinearLayout', 'RelativeLayout', 'FrameLayout', 'ConstraintLayout',
      'RecyclerView', 'ListView', 'ScrollView', 'ViewGroup'
    ];
    return containerTags.some(tag => element.tag.includes(tag));
  }

  /**
   * 创建策略候选
   */
  private createCandidate(
    strategy: string,
    score: number,
    reason: string,
    context: ElementAnalysisContext,
    metadata?: any
  ): StrategyCandidate {
    return {
      id: `region-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: strategy as any,
      sourceStep: 'RegionContainerAnalyzer',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * 0.3,
          stability: score * 0.25,
          performance: score * 0.25,
          reliability: score * 0.2
        },
        bonuses: [],
        penalties: []
      },
      criteria: metadata?.criteria || {
        fields: [],
        values: {}
      },
      validation: {
        passed: true,
        matchCount: 1,
        uniqueness: {
          isUnique: true
        },
        errors: [],
        warnings: [],
        validationTime: 50
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 150,
        deviceCompatibility: ['android'],
        complexity: 'medium' as const
      }
    };
  }
}