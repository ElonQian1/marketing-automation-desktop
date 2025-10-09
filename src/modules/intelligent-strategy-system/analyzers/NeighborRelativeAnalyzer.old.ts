/**
 * NeighborRelativeAnalyzer.ts
 * Step 5: 相邻元素相对分析器 (重构版)
 * 
 * @description 基于相邻元素的相对位置进行定位，处理兄弟元素和附近元素的关系
 * 使用模块化策略架构，支持多种邻居定位策略
 */

import { BaseAnalyzer } from './BaseAnalyzer';
import { AnalysisStep } from '../types/DecisionTypes';
import type {
  ElementAnalysisContext,
} from '../types/AnalysisTypes';
import type {
  StrategyCandidate
} from '../types/StrategyTypes';

// 导入模块化策略
import {
  DirectNeighborStrategy,
  DirectionalStrategy,
  SiblingStrategy,
  DistanceConstraintStrategy,
  MultiNeighborStrategy
} from './neighbor-relative/strategies';

/**
 * 相邻元素相对分析器 - Step 5 (重构版)
 * 
 * 使用模块化策略架构：
 * - DirectNeighborStrategy: 直接邻居定位
 * - DirectionalStrategy: 方向性邻居定位
 * - SiblingStrategy: 兄弟元素策略
 * - DistanceConstraintStrategy: 距离约束策略
 * - MultiNeighborStrategy: 多邻居组合策略
 */
export class NeighborRelativeAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.NEIGHBOR_RELATIVE;
  readonly name = 'NeighborRelativeAnalyzer';
  readonly description = '基于相邻元素相对位置的定位分析 (模块化)';

  // 策略实例
  private strategies = [
    new DirectNeighborStrategy(),
    new DirectionalStrategy(),
    new SiblingStrategy(),
    new DistanceConstraintStrategy(),
    new MultiNeighborStrategy()
  ];

  /**
   * 检查是否适用于当前上下文
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 必须有边界信息用于计算相对位置
    if (!element.bounds) {
      return false;
    }

    // 检查是否有任何策略适用
    return this.strategies.some(strategy => 
      strategy.isApplicable(element, context)
    );
    }

    // 至少有一个具有明确标识符的相邻元素
    const identifiableNeighbors = neighbors.filter(n => 
      this.hasValidResourceId(n.element) || 
      this.hasMeaningfulText(n.element)
    );
    
    return identifiableNeighbors.length > 0;
  }

  /**
   * 获取优先级
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    let priority = 0;
    
    const neighbors = this.findNeighborElements(element, context);
    
    // 基于相邻元素的质量评估优先级
    neighbors.forEach(neighbor => {
      const distance = neighbor.distance;
      const elementScore = this.calculateElementScore(neighbor.element, context);
      
      // 距离越近，元素质量越高，优先级越高
      const neighborScore = (elementScore / (distance + 10)) * 2;
      priority += neighborScore;
    });
    
    // 基于相邻元素的数量
    priority += Math.min(neighbors.length * 0.5, 3);
    
    // 基于最佳相邻元素的质量
    const bestNeighbor = this.findBestNeighbor(neighbors, context);
    if (bestNeighbor) {
      const bestScore = this.calculateElementScore(bestNeighbor.element, context);
      priority += bestScore * 0.1;
    }
    
    return Math.min(priority, 6); // 中等偏低优先级
  }

  /**
   * 主要分析方法
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始相邻元素相对分析', { 
      elementTag: element.tag,
      bounds: element.bounds
    });

    try {
      const neighbors = this.findNeighborElements(element, context);
      
      if (neighbors.length === 0) {
        return this.createResult(false, [], '未找到可用的相邻元素');
      }

      // 1. 直接相邻策略
      const directNeighborCandidates = await this.analyzeDirectNeighborStrategies(
        element, neighbors, context
      );
      candidates.push(...directNeighborCandidates);

      // 2. 方向性相对策略
      const directionalCandidates = await this.analyzeDirectionalStrategies(
        element, neighbors, context
      );
      candidates.push(...directionalCandidates);

      // 3. 兄弟元素策略
      const siblingCandidates = await this.analyzeSiblingStrategies(
        element, neighbors, context
      );
      candidates.push(...siblingCandidates);

      // 4. 距离约束策略
      const distanceCandidates = await this.analyzeDistanceConstraintStrategies(
        element, neighbors, context
      );
      candidates.push(...distanceCandidates);

      // 5. 多相邻元素组合策略
      const multiNeighborCandidates = await this.analyzeMultiNeighborStrategies(
        element, neighbors, context
      );
      candidates.push(...multiNeighborCandidates);

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      this.log('info', `相邻元素相对分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime,
        neighborsCount: neighbors.length
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `相邻元素相对分析完成，基于 ${neighbors.length} 个相邻元素找到 ${sortedCandidates.length} 个候选策略`,
        { executionTime, neighborsCount: neighbors.length }
      );

    } catch (error) {
      this.log('error', '相邻元素相对分析失败', error);
      return this.createResult(false, [], `分析失败: ${error}`);
    }
  }

  // === 具体分析方法 ===

  /**
   * 直接相邻策略分析
   */
  private async analyzeDirectNeighborStrategies(
    element: any,
    neighbors: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    // 取最近的几个相邻元素
    const closestNeighbors = neighbors.slice(0, 4);
    let baseScore = 75;

    for (const neighbor of closestNeighbors) {
      const neighborElement = neighbor.element;
      const direction = neighbor.direction;
      const distance = neighbor.distance;

      // 策略1: 基于相邻元素resource-id的相对定位
      if (this.hasValidResourceId(neighborElement)) {
        const neighborId = neighborElement.attributes['resource-id'];
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 10,
          `相对于元素 ${neighborId} 的 ${direction} 方向`,
          context,
          {
            criteria: {
              fields: ['neighbor-resource-id', 'relative-direction', 'distance-range'],
              values: {
                'neighbor-resource-id': neighborId,
                'relative-direction': direction,
                'distance-range': this.getDistanceRange(distance)
              },
              xpath: this.buildNeighborResourceIdXPath(neighborElement, direction, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略2: 基于相邻元素文本的相对定位
      if (this.hasMeaningfulText(neighborElement)) {
        const neighborText = neighborElement.text.trim();
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 7,
          `相对于文本"${neighborText}"的 ${direction} 方向`,
          context,
          {
            criteria: {
              fields: ['neighbor-text', 'relative-direction'],
              values: {
                'neighbor-text': neighborText,
                'relative-direction': direction
              },
              xpath: this.buildNeighborTextXPath(neighborText, direction, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略3: 基于相邻元素content-desc的相对定位
      const neighborContentDesc = neighborElement.attributes?.['content-desc'];
      if (neighborContentDesc && neighborContentDesc.trim()) {
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 8,
          `相对于描述"${neighborContentDesc}"的 ${direction} 方向`,
          context,
          {
            criteria: {
              fields: ['neighbor-content-desc', 'relative-direction'],
              values: {
                'neighbor-content-desc': neighborContentDesc,
                'relative-direction': direction
              },
              xpath: this.buildNeighborContentDescXPath(neighborContentDesc, direction, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略4: 基于相邻元素类型的相对定位
      const neighborClass = neighborElement.tag;
      if (this.isSpecificControlType(neighborClass)) {
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 5,
          `相对于 ${neighborClass} 控件的 ${direction} 方向`,
          context,
          {
            criteria: {
              fields: ['neighbor-class', 'relative-direction'],
              values: {
                'neighbor-class': neighborClass,
                'relative-direction': direction
              },
              xpath: this.buildNeighborClassXPath(neighborClass, direction, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      baseScore -= 2; // 后续相邻元素优先级递减
    }

    return candidates;
  }

  /**
   * 方向性相对策略分析
   */
  private async analyzeDirectionalStrategies(
    element: any,
    neighbors: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    // 按方向分组相邻元素
    const directionGroups = this.groupNeighborsByDirection(neighbors);
    
    let baseScore = 72;

    for (const [direction, directionNeighbors] of Object.entries(directionGroups)) {
      if (directionNeighbors.length === 0) continue;

      const bestNeighbor = directionNeighbors[0]; // 已按距离排序
      const neighborElement = bestNeighbor.element;

      // 策略1: 基于特定方向的最近元素
      if (this.hasValidResourceId(neighborElement) || this.hasMeaningfulText(neighborElement)) {
        const identifier = this.getElementIdentifier(neighborElement);
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 6,
          `${direction}方向最近的元素: ${identifier}`,
          context,
          {
            criteria: {
              fields: ['directional-nearest', 'direction'],
              values: {
                'directional-nearest': identifier,
                'direction': direction
              },
              xpath: this.buildDirectionalNearestXPath(neighborElement, direction, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略2: 基于方向上的第N个元素
      if (directionNeighbors.length > 1) {
        for (let i = 0; i < Math.min(directionNeighbors.length, 3); i++) {
          const nthNeighbor = directionNeighbors[i];
          const nthElement = nthNeighbor.element;
          
          if (this.hasValidResourceId(nthElement) || this.hasMeaningfulText(nthElement)) {
            const identifier = this.getElementIdentifier(nthElement);
            candidates.push(this.createCandidate(
              'neighbor-relative',
              baseScore + 4 - i,
              `${direction}方向第${i + 1}个元素: ${identifier}`,
              context,
              {
                criteria: {
                  fields: ['directional-nth', 'direction', 'position'],
                  values: {
                    'directional-nth': identifier,
                    'direction': direction,
                    'position': i + 1
                  },
                  xpath: this.buildDirectionalNthXPath(nthElement, direction, i + 1, element),
                  strategy: 'neighbor-relative'
                }
              }
            ));
          }
        }
      }

      baseScore -= 1;
    }

    return candidates;
  }

  /**
   * 兄弟元素策略分析
   */
  private async analyzeSiblingStrategies(
    element: any,
    neighbors: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    // 找到兄弟元素（同一父容器下的元素）
    const siblings = this.findSiblingElements(element, neighbors, context);
    
    if (siblings.length === 0) return candidates;

    let baseScore = 70;

    for (const sibling of siblings.slice(0, 3)) {
      const siblingElement = sibling.element;
      const siblingIndex = this.calculateSiblingIndex(element, siblingElement, context);

      // 策略1: 基于兄弟元素的相对索引
      if (siblingIndex !== -1 && this.hasValidResourceId(siblingElement)) {
        const siblingId = siblingElement.attributes['resource-id'];
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 8,
          `兄弟元素 ${siblingId} 的相对位置`,
          context,
          {
            criteria: {
              fields: ['sibling-resource-id', 'relative-index'],
              values: {
                'sibling-resource-id': siblingId,
                'relative-index': siblingIndex
              },
              xpath: this.buildSiblingIndexXPath(siblingElement, siblingIndex, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略2: 基于兄弟元素文本的相对位置
      if (this.hasMeaningfulText(siblingElement)) {
        const siblingText = siblingElement.text.trim();
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 6,
          `相对于兄弟文本"${siblingText}"`,
          context,
          {
            criteria: {
              fields: ['sibling-text', 'sibling-relation'],
              values: {
                'sibling-text': siblingText,
                'sibling-relation': siblingIndex > 0 ? 'following' : 'preceding'
              },
              xpath: this.buildSiblingTextXPath(siblingText, siblingIndex, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略3: 基于同类型兄弟元素的序号
      if (element.tag === siblingElement.tag) {
        const sameTypeIndex = this.calculateSameTypeSiblingIndex(element, siblingElement, context);
        if (sameTypeIndex !== -1) {
          candidates.push(this.createCandidate(
            'neighbor-relative',
            baseScore + 4,
            `同类型兄弟元素第${sameTypeIndex + 1}个`,
            context,
            {
              criteria: {
                fields: ['same-type-sibling', 'type-index'],
                values: {
                  'same-type-sibling': element.tag,
                  'type-index': sameTypeIndex
                },
                xpath: this.buildSameTypeSiblingXPath(element.tag, sameTypeIndex, element),
                strategy: 'neighbor-relative'
              }
            }
          ));
        }
      }

      baseScore -= 2;
    }

    return candidates;
  }

  /**
   * 距离约束策略分析
   */
  private async analyzeDistanceConstraintStrategies(
    element: any,
    neighbors: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    // 按距离分组
    const distanceGroups = this.groupNeighborsByDistance(neighbors);
    
    let baseScore = 68;

    for (const [distanceRange, rangeNeighbors] of Object.entries(distanceGroups)) {
      if (rangeNeighbors.length === 0) continue;

      const representativeNeighbor = rangeNeighbors[0];
      const neighborElement = representativeNeighbor.element;

      // 策略1: 基于距离范围内的最佳元素
      if (this.hasValidResourceId(neighborElement)) {
        const neighborId = neighborElement.attributes['resource-id'];
        candidates.push(this.createCandidate(
          'neighbor-relative',
          baseScore + 5,
          `距离${distanceRange}内相对于 ${neighborId}`,
          context,
          {
            criteria: {
              fields: ['distance-constrained', 'reference-id'],
              values: {
                'distance-constrained': distanceRange,
                'reference-id': neighborId
              },
              xpath: this.buildDistanceConstrainedXPath(neighborElement, distanceRange, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }

      // 策略2: 基于距离范围内的元素组合
      if (rangeNeighbors.length >= 2) {
        const secondNeighbor = rangeNeighbors[1];
        if (this.hasValidResourceId(secondNeighbor.element)) {
          const firstId = neighborElement.attributes?.['resource-id'];
          const secondId = secondNeighbor.element.attributes?.['resource-id'];
          
          if (firstId && secondId) {
            candidates.push(this.createCandidate(
              'neighbor-relative',
              baseScore + 3,
              `距离${distanceRange}内的元素组合`,
              context,
              {
                criteria: {
                  fields: ['distance-group', 'primary-ref', 'secondary-ref'],
                  values: {
                    'distance-group': distanceRange,
                    'primary-ref': firstId,
                    'secondary-ref': secondId
                  },
                  xpath: this.buildDistanceGroupXPath(neighborElement, secondNeighbor.element, element),
                  strategy: 'neighbor-relative'
                }
              }
            ));
          }
        }
      }

      baseScore -= 1;
    }

    return candidates;
  }

  /**
   * 多相邻元素组合策略分析
   */
  private async analyzeMultiNeighborStrategies(
    element: any,
    neighbors: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (neighbors.length < 2) return candidates;

    // 策略1: 基于两个最近相邻元素的组合
    const closestTwo = neighbors.slice(0, 2);
    if (closestTwo.length === 2) {
      const first = closestTwo[0];
      const second = closestTwo[1];
      
      if (this.hasValidResourceId(first.element) && this.hasValidResourceId(second.element)) {
        const firstName = first.element.attributes['resource-id'];
        const secondName = second.element.attributes['resource-id'];
        
        candidates.push(this.createCandidate(
          'neighbor-relative',
          66,
          `相对于 ${firstName} 和 ${secondName} 的位置`,
          context,
          {
            criteria: {
              fields: ['multi-neighbor', 'primary-neighbor', 'secondary-neighbor'],
              values: {
                'multi-neighbor': 'two-closest',
                'primary-neighbor': firstName,
                'secondary-neighbor': secondName
              },
              xpath: this.buildMultiNeighborXPath(first.element, second.element, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }
    }

    // 策略2: 基于四个方向的相邻元素
    const directionGroups = this.groupNeighborsByDirection(neighbors);
    const hasAllDirections = ['left', 'right', 'above', 'below'].every(dir => 
      directionGroups[dir] && directionGroups[dir].length > 0
    );
    
    if (hasAllDirections) {
      const directionRefs = Object.entries(directionGroups).map(([dir, neighs]) => {
        const best = neighs[0];
        return {
          direction: dir,
          identifier: this.getElementIdentifier(best.element)
        };
      }).filter(ref => ref.identifier);

      if (directionRefs.length >= 3) {
        candidates.push(this.createCandidate(
          'neighbor-relative',
          64,
          '基于四方向相邻元素的中心定位',
          context,
          {
            criteria: {
              fields: ['four-direction-center'],
              values: {
                'left-ref': directionRefs.find(r => r.direction === 'left')?.identifier,
                'right-ref': directionRefs.find(r => r.direction === 'right')?.identifier,
                'top-ref': directionRefs.find(r => r.direction === 'above')?.identifier,
                'bottom-ref': directionRefs.find(r => r.direction === 'below')?.identifier
              },
              xpath: this.buildFourDirectionCenterXPath(directionGroups, element),
              strategy: 'neighbor-relative'
            }
          }
        ));
      }
    }

    // 策略3: 基于相同类型的相邻元素群
    const sameTypeGroups = this.groupNeighborsBySameType(neighbors, element);
    for (const [elementType, typeNeighbors] of Object.entries(sameTypeGroups)) {
      if (typeNeighbors.length >= 2) {
        const firstOfType = typeNeighbors[0];
        if (this.hasValidResourceId(firstOfType.element)) {
          const typeId = firstOfType.element.attributes['resource-id'];
          candidates.push(this.createCandidate(
            'neighbor-relative',
            62,
            `相对于同类型元素群: ${elementType}`,
            context,
            {
              criteria: {
                fields: ['same-type-group', 'type-reference'],
                values: {
                  'same-type-group': elementType,
                  'type-reference': typeId,
                  'group-size': typeNeighbors.length
                },
                xpath: this.buildSameTypeGroupXPath(elementType, firstOfType.element, element),
                strategy: 'neighbor-relative'
              }
            }
          ));
        }
      }
    }

    return candidates;
  }

  // === 辅助方法 ===

  /**
   * 查找相邻元素
   */
  private findNeighborElements(element: any, context: ElementAnalysisContext): any[] {
    const elementBounds = this.parseBounds(element.bounds);
    if (!elementBounds) return [];

    const allElements = context.document.allNodes;
    const neighbors: any[] = [];
    const maxDistance = 300; // 最大相邻距离

    for (const el of allElements) {
      if (el === element) continue;
      
      const elBounds = this.parseBounds(el.bounds);
      if (!elBounds) continue;

      const distance = this.calculateDistance(elementBounds, elBounds);
      if (distance <= maxDistance) {
        const direction = this.calculateDirection(elementBounds, elBounds);
        neighbors.push({
          element: el,
          distance,
          direction,
          bounds: elBounds
        });
      }
    }

    // 按距离排序
    return neighbors.sort((a, b) => a.distance - b.distance);
  }

  /**
   * 查找最佳相邻元素
   */
  private findBestNeighbor(neighbors: any[], context: ElementAnalysisContext): any | null {
    if (neighbors.length === 0) return null;
    
    return neighbors.reduce((best, current) => {
      const bestScore = this.calculateElementScore(best.element, context) / (best.distance + 10);
      const currentScore = this.calculateElementScore(current.element, context) / (current.distance + 10);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 计算元素评分
   */
  private calculateElementScore(element: any, context: ElementAnalysisContext): number {
    let score = 0;
    
    if (this.hasValidResourceId(element)) {
      const resourceId = element.attributes['resource-id'];
      const isUnique = this.isResourceIdUnique(resourceId, context);
      score += isUnique ? 40 : 20;
    }
    
    if (this.hasMeaningfulText(element)) {
      score += 25;
    }
    
    if (element.attributes?.['content-desc']) {
      score += 20;
    }
    
    if (this.isClickable(element)) {
      score += 15;
    }
    
    return score;
  }

  /**
   * 按方向分组相邻元素
   */
  private groupNeighborsByDirection(neighbors: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      left: [],
      right: [],
      above: [],
      below: []
    };

    neighbors.forEach(neighbor => {
      const direction = neighbor.direction;
      if (groups[direction]) {
        groups[direction].push(neighbor);
      }
    });

    // 每个方向按距离排序
    Object.keys(groups).forEach(dir => {
      groups[dir].sort((a, b) => a.distance - b.distance);
    });

    return groups;
  }

  /**
   * 查找兄弟元素
   */
  private findSiblingElements(element: any, neighbors: any[], context: ElementAnalysisContext): any[] {
    const elementPath = element.xpath;
    if (!elementPath) return [];

    const pathParts = elementPath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/');

    return neighbors.filter(neighbor => {
      const neighborPath = neighbor.element.xpath;
      if (!neighborPath) return false;
      
      const neighborPathParts = neighborPath.split('/');
      const neighborParentPath = neighborPathParts.slice(0, -1).join('/');
      
      return parentPath === neighborParentPath;
    });
  }

  /**
   * 计算兄弟元素索引
   */
  private calculateSiblingIndex(element: any, sibling: any, context: ElementAnalysisContext): number {
    const elementPath = element.xpath;
    const siblingPath = sibling.xpath;
    
    if (!elementPath || !siblingPath) return -1;

    const elementIndex = this.extractIndexFromPath(elementPath);
    const siblingIndex = this.extractIndexFromPath(siblingPath);
    
    return elementIndex - siblingIndex;
  }

  /**
   * 计算同类型兄弟元素索引
   */
  private calculateSameTypeSiblingIndex(element: any, sibling: any, context: ElementAnalysisContext): number {
    const elementPath = element.xpath;
    const parentPath = elementPath.split('/').slice(0, -1).join('/');
    
    const sameTypeSiblings = context.document.allNodes.filter(el => {
      const elPath = el.xpath;
      if (!elPath) return false;
      
      const elParentPath = elPath.split('/').slice(0, -1).join('/');
      return elParentPath === parentPath && el.tag === element.tag;
    });

    sameTypeSiblings.sort((a, b) => {
      const aIndex = this.extractIndexFromPath(a.xpath);
      const bIndex = this.extractIndexFromPath(b.xpath);
      return aIndex - bIndex;
    });

    return sameTypeSiblings.findIndex(el => el.xpath === element.xpath);
  }

  /**
   * 按距离分组相邻元素
   */
  private groupNeighborsByDistance(neighbors: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      'very-close': [],  // 0-50
      'close': [],       // 51-150
      'medium': [],      // 151-300
    };

    neighbors.forEach(neighbor => {
      const distance = neighbor.distance;
      if (distance <= 50) {
        groups['very-close'].push(neighbor);
      } else if (distance <= 150) {
        groups['close'].push(neighbor);
      } else {
        groups['medium'].push(neighbor);
      }
    });

    return groups;
  }

  /**
   * 按相同类型分组相邻元素
   */
  private groupNeighborsBySameType(neighbors: any[], targetElement: any): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    neighbors.forEach(neighbor => {
      const elementType = neighbor.element.tag;
      if (!groups[elementType]) {
        groups[elementType] = [];
      }
      groups[elementType].push(neighbor);
    });

    return groups;
  }

  /**
   * 获取元素标识符
   */
  private getElementIdentifier(element: any): string {
    if (this.hasValidResourceId(element)) {
      return element.attributes['resource-id'];
    }
    if (this.hasMeaningfulText(element)) {
      return `"${element.text.trim()}"`;
    }
    if (element.attributes?.['content-desc']) {
      return `desc:"${element.attributes['content-desc']}"`;
    }
    return element.tag;
  }

  /**
   * 计算方向
   */
  private calculateDirection(elementBounds: any, otherBounds: any): string {
    const elementCenterX = elementBounds.left + elementBounds.width / 2;
    const elementCenterY = elementBounds.top + elementBounds.height / 2;
    const otherCenterX = otherBounds.left + otherBounds.width / 2;
    const otherCenterY = otherBounds.top + otherBounds.height / 2;

    const dx = otherCenterX - elementCenterX;
    const dy = otherCenterY - elementCenterY;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'below' : 'above';
    }
  }

  /**
   * 计算距离
   */
  private calculateDistance(bounds1: any, bounds2: any): number {
    const center1 = {
      x: bounds1.left + bounds1.width / 2,
      y: bounds1.top + bounds1.height / 2
    };
    const center2 = {
      x: bounds2.left + bounds2.width / 2,
      y: bounds2.top + bounds2.height / 2
    };
    
    const dx = center1.x - center2.x;
    const dy = center1.y - center2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 解析边界信息
   */
  private parseBounds(bounds: string | any): any {
    // 如果已经是对象，直接返回
    if (typeof bounds === 'object' && bounds !== null) {
      return bounds;
    }
    
    // 如果是字符串，解析
    if (typeof bounds === 'string' && bounds) {
      try {
        const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (match) {
          const [, left, top, right, bottom] = match.map(Number);
          return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top
          };
        }
      } catch (error) {
        this.log('warn', '解析边界失败', { bounds, error });
      }
    }
    
    return null;
  }

  /**
   * 检查是否为特定控件类型
   */
  private isSpecificControlType(tagName: string): boolean {
    const specificTypes = [
      'Button', 'EditText', 'TextView', 'ImageView', 'CheckBox', 
      'RadioButton', 'Switch', 'SeekBar', 'ProgressBar'
    ];
    return specificTypes.some(type => tagName.includes(type));
  }

  /**
   * 获取距离范围描述
   */
  private getDistanceRange(distance: number): string {
    if (distance <= 50) return 'very-close';
    if (distance <= 150) return 'close';
    return 'medium';
  }

  /**
   * 从路径提取索引
   */
  private extractIndexFromPath(xpath: string): number {
    const match = xpath.match(/\[(\d+)\]$/);
    return match ? parseInt(match[1]) - 1 : 0;
  }

  /**
   * 检查resource-id是否唯一
   */
  private isResourceIdUnique(resourceId: string, context: ElementAnalysisContext): boolean {
    const duplicateCount = context.document.allNodes.filter(el => 
      el.attributes?.['resource-id'] === resourceId
    ).length;
    return duplicateCount === 1;
  }

  // === XPath构建方法 ===

  private buildNeighborResourceIdXPath(neighbor: any, direction: string, element: any): string {
    const neighborId = neighbor.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${neighborId}']/following::${element.tag}`;
  }

  private buildNeighborTextXPath(text: string, direction: string, element: any): string {
    return `//*[text()='${text}']/following::${element.tag}`;
  }

  private buildNeighborContentDescXPath(contentDesc: string, direction: string, element: any): string {
    return `//*[@content-desc='${contentDesc}']/following::${element.tag}`;
  }

  private buildNeighborClassXPath(className: string, direction: string, element: any): string {
    return `//${className}/following::${element.tag}`;
  }

  private buildDirectionalNearestXPath(neighbor: any, direction: string, element: any): string {
    const neighborId = neighbor.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${neighborId}']/following::${element.tag}[1]`;
  }

  private buildDirectionalNthXPath(neighbor: any, direction: string, position: number, element: any): string {
    const neighborId = neighbor.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${neighborId}']/following::${element.tag}[${position}]`;
  }

  private buildSiblingIndexXPath(sibling: any, index: number, element: any): string {
    const siblingId = sibling.attributes?.['resource-id'] || '';
    const axis = index > 0 ? 'following-sibling' : 'preceding-sibling';
    return `//*[@resource-id='${siblingId}']/${axis}::${element.tag}[${Math.abs(index)}]`;
  }

  private buildSiblingTextXPath(text: string, index: number, element: any): string {
    const axis = index > 0 ? 'following-sibling' : 'preceding-sibling';
    return `//*[text()='${text}']/${axis}::${element.tag}[1]`;
  }

  private buildSameTypeSiblingXPath(elementType: string, index: number, element: any): string {
    return `//${elementType}[${index + 1}]`;
  }

  private buildDistanceConstrainedXPath(neighbor: any, range: string, element: any): string {
    const neighborId = neighbor.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${neighborId}']/following::${element.tag}`;
  }

  private buildDistanceGroupXPath(neighbor1: any, neighbor2: any, element: any): string {
    const id1 = neighbor1.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${id1}']/following::${element.tag}`;
  }

  private buildMultiNeighborXPath(neighbor1: any, neighbor2: any, element: any): string {
    const id1 = neighbor1.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${id1}']/following::${element.tag}`;
  }

  private buildFourDirectionCenterXPath(directionGroups: Record<string, any[]>, element: any): string {
    return `//${element.tag}`;
  }

  private buildSameTypeGroupXPath(elementType: string, reference: any, element: any): string {
    const refId = reference.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${refId}']/following::${elementType}`;
  }
}