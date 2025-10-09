/**
 * RegionScopedAnalyzer.ts
 * Step 4: 区域范围分析器
 * 
 * @description 基于页面区域进行元素定位，处理复杂布局中的区域性匹配
 */

import { BaseAnalyzer } from './BaseAnalyzer';
import { AnalysisStep } from '../types/DecisionTypes';
import type {
  ElementAnalysisContext,
} from '../types/AnalysisTypes';
import type {
  StrategyCandidate
} from '../types/StrategyTypes';

/**
 * 区域范围分析器 - Step 4
 * 
 * 职责：
 * 1. 分析目标元素所在的页面区域
 * 2. 识别区域边界和约束条件
 * 3. 生成基于区域范围的定位策略
 * 
 * 适用场景：
 * - 复杂布局中的精确定位
 * - 多区域页面的元素识别
 * - 相对位置约束的元素查找
 * - 容器级别的范围限定
 */
export class RegionScopedAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.REGION_SCOPED;
  readonly name = 'RegionScopedAnalyzer';
  readonly description = '基于页面区域和范围约束的定位分析';

  /**
   * 检查是否适用于当前上下文
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 必须有明确的边界信息
    if (!element.bounds) {
      return false;
    }

    // 页面必须有足够的区域复杂性
    const regionComplexity = this.calculateRegionComplexity(context);
    if (regionComplexity < 2) {
      return false;
    }

    // 目标元素必须在可识别的区域内
    const containingRegions = this.identifyContainingRegions(element, context);
    return containingRegions.length > 0;
  }

  /**
   * 获取优先级
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    let priority = 0;
    
    // 基于区域复杂性评估优先级
    const regionComplexity = this.calculateRegionComplexity(context);
    priority += Math.min(regionComplexity * 1.5, 5);
    
    // 基于区域唯一性
    const containingRegions = this.identifyContainingRegions(element, context);
    const uniqueRegions = containingRegions.filter(region => 
      this.isRegionUnique(region, context)
    );
    priority += uniqueRegions.length * 2;
    
    // 基于边界清晰度
    const boundsClarity = this.calculateBoundsClarity(element, context);
    priority += boundsClarity;
    
    // 如果存在明确的区域标识符，提高优先级
    const hasRegionIdentifiers = this.hasRegionIdentifiers(element, context);
    if (hasRegionIdentifiers) {
      priority += 3;
    }
    
    return Math.min(priority, 7); // 中等优先级
  }

  /**
   * 主要分析方法
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始区域范围分析', { 
      elementTag: element.tag,
      bounds: element.bounds
    });

    try {
      // 1. 区域容器策略
      const regionContainerCandidates = await this.analyzeRegionContainerStrategies(
        element, context
      );
      candidates.push(...regionContainerCandidates);

      // 2. 相对位置策略
      const relativePositionCandidates = await this.analyzeRelativePositionStrategies(
        element, context
      );
      candidates.push(...relativePositionCandidates);

      // 3. 边界约束策略
      const boundsConstraintCandidates = await this.analyzeBoundsConstraintStrategies(
        element, context
      );
      candidates.push(...boundsConstraintCandidates);

      // 4. 区域特征匹配策略
      const regionFeatureCandidates = await this.analyzeRegionFeatureStrategies(
        element, context
      );
      candidates.push(...regionFeatureCandidates);

      // 5. 多区域组合策略
      const multiRegionCandidates = await this.analyzeMultiRegionStrategies(
        element, context
      );
      candidates.push(...multiRegionCandidates);

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      const regionCount = this.identifyContainingRegions(element, context).length;
      
      this.log('info', `区域范围分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime,
        regionCount
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `区域范围分析完成，基于 ${regionCount} 个区域找到 ${sortedCandidates.length} 个候选策略`,
        { executionTime, regionCount }
      );

    } catch (error) {
      this.log('error', '区域范围分析失败', error);
      return this.createResult(false, [], `分析失败: ${error}`);
    }
  }

  // === 具体分析方法 ===

  /**
   * 区域容器策略分析
   */
  private async analyzeRegionContainerStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const containingRegions = this.identifyContainingRegions(element, context);
    
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
      const regionType = this.identifyRegionType(region);
      if (regionType !== 'unknown') {
        const relativePosition = this.calculateRelativePosition(element, region);
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore + 5,
          `通过区域类型定位: ${regionType} (${relativePosition})`,
          context,
          {
            criteria: {
              fields: ['region-type', 'relative-position'],
              values: {
                'region-type': regionType,
                'relative-position': relativePosition
              },
              xpath: this.buildRegionTypeXPath(regionType, relativePosition, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      // 策略3: 基于区域边界约束
      const boundsConstraints = this.calculateBoundsConstraints(element, region);
      if (boundsConstraints.isValid) {
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore + 7,
          `通过区域边界约束定位: ${boundsConstraints.description}`,
          context,
          {
            criteria: {
              fields: ['bounds-constraints'],
              values: {
                'min-x': boundsConstraints.minX,
                'max-x': boundsConstraints.maxX,
                'min-y': boundsConstraints.minY,
                'max-y': boundsConstraints.maxY
              },
              xpath: this.buildBoundsConstraintXPath(boundsConstraints, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      baseScore -= 3; // 后续区域优先级递减
    }

    return candidates;
  }

  /**
   * 相对位置策略分析
   */
  private async analyzeRelativePositionStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const referenceElements = this.findReferenceElements(element, context);
    
    let baseScore = 76;

    for (const refElement of referenceElements.slice(0, 4)) {
      const relativePosition = this.calculateElementRelativePosition(element, refElement);
      
      // 策略1: 基于参考元素的相对位置
      if (this.hasValidResourceId(refElement)) {
        const refId = refElement.attributes['resource-id'];
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore + 8,
          `相对于元素 ${refId} 的 ${relativePosition.direction} 方向`,
          context,
          {
            criteria: {
              fields: ['reference-element', 'relative-direction', 'distance'],
              values: {
                'reference-element': refId,
                'relative-direction': relativePosition.direction,
                'distance': relativePosition.distance
              },
              xpath: this.buildRelativePositionXPath(refElement, relativePosition, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      // 策略2: 基于参考元素文本的相对位置
      if (this.hasMeaningfulText(refElement)) {
        const refText = refElement.text.trim();
        candidates.push(this.createCandidate(
          'region-scoped',
          baseScore + 5,
          `相对于文本"${refText}"的 ${relativePosition.direction} 方向`,
          context,
          {
            criteria: {
              fields: ['reference-text', 'relative-direction'],
              values: {
                'reference-text': refText,
                'relative-direction': relativePosition.direction
              },
              xpath: this.buildTextRelativeXPath(refText, relativePosition, element),
              strategy: 'region-scoped'
            }
          }
        ));
      }

      baseScore -= 2;
    }

    return candidates;
  }

  /**
   * 边界约束策略分析
   */
  private async analyzeBoundsConstraintStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const bounds = this.parseBounds(element.bounds);
    
    if (!bounds) return candidates;

    // 策略1: 基于屏幕区域约束
    const screenRegion = this.identifyScreenRegion(bounds, context);
    if (screenRegion !== 'unknown') {
      candidates.push(this.createCandidate(
        'region-scoped',
        74,
        `通过屏幕区域约束: ${screenRegion}`,
        context,
        {
          criteria: {
            fields: ['screen-region', 'element-class'],
            values: {
              'screen-region': screenRegion,
              'element-class': element.tag
            },
            xpath: this.buildScreenRegionXPath(screenRegion, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    // 策略2: 基于尺寸约束
    const sizeConstraints = this.calculateSizeConstraints(bounds, context);
    if (sizeConstraints.isValid) {
      candidates.push(this.createCandidate(
        'region-scoped',
        72,
        `通过尺寸约束: ${sizeConstraints.width}x${sizeConstraints.height}`,
        context,
        {
          criteria: {
            fields: ['width-range', 'height-range'],
            values: {
              'min-width': sizeConstraints.minWidth,
              'max-width': sizeConstraints.maxWidth,
              'min-height': sizeConstraints.minHeight,
              'max-height': sizeConstraints.maxHeight
            },
            xpath: this.buildSizeConstraintXPath(sizeConstraints, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    // 策略3: 基于边界比例约束
    const proportionConstraints = this.calculateProportionConstraints(bounds, context);
    if (proportionConstraints.isValid) {
      candidates.push(this.createCandidate(
        'region-scoped',
        70,
        `通过比例约束: ${proportionConstraints.description}`,
        context,
        {
          criteria: {
            fields: ['proportion-constraints'],
            values: proportionConstraints.values,
            xpath: this.buildProportionXPath(proportionConstraints, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 区域特征匹配策略分析
   */
  private async analyzeRegionFeatureStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const regionFeatures = this.extractRegionFeatures(element, context);

    // 策略1: 基于区域密度特征
    if (regionFeatures.density) {
      candidates.push(this.createCandidate(
        'region-scoped',
        68,
        `通过区域密度特征: ${regionFeatures.density.type}`,
        context,
        {
          criteria: {
            fields: ['region-density', 'element-count'],
            values: {
              'region-density': regionFeatures.density.type,
              'element-count': regionFeatures.density.count
            },
            xpath: this.buildDensityFeatureXPath(regionFeatures.density, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    // 策略2: 基于区域布局模式
    if (regionFeatures.layoutPattern) {
      candidates.push(this.createCandidate(
        'region-scoped',
        66,
        `通过布局模式: ${regionFeatures.layoutPattern.type}`,
        context,
        {
          criteria: {
            fields: ['layout-pattern', 'pattern-index'],
            values: {
              'layout-pattern': regionFeatures.layoutPattern.type,
              'pattern-index': regionFeatures.layoutPattern.index
            },
            xpath: this.buildLayoutPatternXPath(regionFeatures.layoutPattern, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    // 策略3: 基于区域内容特征
    if (regionFeatures.contentSignature) {
      candidates.push(this.createCandidate(
        'region-scoped',
        64,
        `通过内容特征: ${regionFeatures.contentSignature.type}`,
        context,
        {
          criteria: {
            fields: ['content-signature'],
            values: regionFeatures.contentSignature.values,
            xpath: this.buildContentSignatureXPath(regionFeatures.contentSignature, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 多区域组合策略分析
   */
  private async analyzeMultiRegionStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    const containingRegions = this.identifyContainingRegions(element, context);

    if (containingRegions.length < 2) return candidates;

    // 策略1: 嵌套区域组合
    const nestedRegions = this.findNestedRegions(containingRegions);
    if (nestedRegions.length >= 2) {
      candidates.push(this.createCandidate(
        'region-scoped',
        62,
        `通过嵌套区域组合: ${nestedRegions.length}层嵌套`,
        context,
        {
          criteria: {
            fields: ['nested-regions'],
            values: {
              'outer-region': this.getRegionIdentifier(nestedRegions[0]),
              'inner-region': this.getRegionIdentifier(nestedRegions[1])
            },
            xpath: this.buildNestedRegionXPath(nestedRegions, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    // 策略2: 相邻区域约束
    const adjacentRegions = this.findAdjacentRegions(element, context);
    if (adjacentRegions.length > 0) {
      candidates.push(this.createCandidate(
        'region-scoped',
        60,
        `通过相邻区域约束: ${adjacentRegions.length}个相邻区域`,
        context,
        {
          criteria: {
            fields: ['adjacent-regions'],
            values: {
              'adjacent-count': adjacentRegions.length,
              'primary-adjacent': this.getRegionIdentifier(adjacentRegions[0])
            },
            xpath: this.buildAdjacentRegionXPath(adjacentRegions, element),
            strategy: 'region-scoped'
          }
        }
      ));
    }

    return candidates;
  }

  // === 辅助方法 ===

  /**
   * 计算区域复杂性
   */
  private calculateRegionComplexity(context: ElementAnalysisContext): number {
    const allElements = context.document.allNodes;
    const uniqueContainerTypes = new Set(
      allElements
        .filter(el => this.isContainer(el))
        .map(el => el.tag)
    );
    return uniqueContainerTypes.size;
  }

  /**
   * 识别包含区域
   */
  private identifyContainingRegions(element: any, context: ElementAnalysisContext): any[] {
    const elementBounds = this.parseBounds(element.bounds);
    if (!elementBounds) return [];

    const regions: any[] = [];
    const allElements = context.document.allNodes;

    for (const el of allElements) {
      if (this.isContainer(el) && el !== element) {
        const containerBounds = this.parseBounds(el.bounds);
        if (containerBounds && this.isElementContainedIn(elementBounds, containerBounds)) {
          regions.push({
            container: el,
            bounds: containerBounds,
            area: this.calculateArea(containerBounds)
          });
        }
      }
    }

    // 按包含面积排序（越小越精确）
    return regions.sort((a, b) => a.area - b.area);
  }

  /**
   * 检查区域是否唯一
   */
  private isRegionUnique(region: any, context: ElementAnalysisContext): boolean {
    if (this.hasValidResourceId(region.container)) {
      const resourceId = region.container.attributes['resource-id'];
      const duplicateCount = context.document.allNodes.filter(el => 
        el.attributes?.['resource-id'] === resourceId
      ).length;
      return duplicateCount === 1;
    }
    return false;
  }

  /**
   * 计算边界清晰度
   */
  private calculateBoundsClarity(element: any, context: ElementAnalysisContext): number {
    const bounds = this.parseBounds(element.bounds);
    if (!bounds) return 0;

    let clarity = 0;
    
    // 基于尺寸合理性
    const area = this.calculateArea(bounds);
    if (area > 100 && area < 100000) { // 合理的元素尺寸
      clarity += 2;
    }

    // 基于位置合理性
    if (bounds.left >= 0 && bounds.top >= 0) {
      clarity += 1;
    }

    // 基于边界规整性
    if (bounds.width > 0 && bounds.height > 0) {
      clarity += 1;
    }

    return clarity;
  }

  /**
   * 检查是否有区域标识符
   */
  private hasRegionIdentifiers(element: any, context: ElementAnalysisContext): boolean {
    const containingRegions = this.identifyContainingRegions(element, context);
    return containingRegions.some(region => 
      this.hasValidResourceId(region.container) || 
      this.hasMeaningfulText(region.container)
    );
  }

  /**
   * 查找参考元素
   */
  private findReferenceElements(element: any, context: ElementAnalysisContext): any[] {
    const elementBounds = this.parseBounds(element.bounds);
    if (!elementBounds) return [];

    const allElements = context.document.allNodes;
    const references: any[] = [];

    for (const el of allElements) {
      if (el === element) continue;
      
      const elBounds = this.parseBounds(el.bounds);
      if (!elBounds) continue;

      // 必须有明确的标识符
      if (this.hasValidResourceId(el) || this.hasMeaningfulText(el)) {
        const distance = this.calculateDistance(elementBounds, elBounds);
        if (distance < 500) { // 在合理距离内
          references.push({
            ...el,
            distance
          });
        }
      }
    }

    // 按距离排序
    return references.sort((a, b) => a.distance - b.distance);
  }

  /**
   * 计算元素相对位置
   */
  private calculateElementRelativePosition(element: any, reference: any): any {
    const elementBounds = this.parseBounds(element.bounds);
    const refBounds = this.parseBounds(reference.bounds);
    
    if (!elementBounds || !refBounds) {
      return { direction: 'unknown', distance: 0 };
    }

    const dx = elementBounds.left - refBounds.left;
    const dy = elementBounds.top - refBounds.top;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let direction = 'unknown';
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'below' : 'above';
    }

    return { direction, distance: Math.round(distance) };
  }

  /**
   * 识别屏幕区域
   */
  private identifyScreenRegion(bounds: any, context: ElementAnalysisContext): string {
    // 使用默认屏幕尺寸或从上下文推断
    const screenWidth = 1080;  // 默认值
    const screenHeight = 1920; // 默认值

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const xRatio = centerX / screenWidth;
    const yRatio = centerY / screenHeight;

    if (yRatio < 0.3) {
      return xRatio < 0.5 ? 'top-left' : 'top-right';
    } else if (yRatio > 0.7) {
      return xRatio < 0.5 ? 'bottom-left' : 'bottom-right';
    } else {
      return xRatio < 0.5 ? 'center-left' : 'center-right';
    }
  }

  /**
   * 提取区域特征
   */
  private extractRegionFeatures(element: any, context: ElementAnalysisContext): any {
    const containingRegions = this.identifyContainingRegions(element, context);
    const features: any = {};

    if (containingRegions.length > 0) {
      const primaryRegion = containingRegions[0];
      
      // 密度特征
      features.density = this.calculateRegionDensity(primaryRegion, context);
      
      // 布局模式
      features.layoutPattern = this.identifyLayoutPattern(primaryRegion, context);
      
      // 内容签名
      features.contentSignature = this.generateContentSignature(primaryRegion, context);
    }

    return features;
  }

  /**
   * 计算区域密度
   */
  private calculateRegionDensity(region: any, context: ElementAnalysisContext): any {
    const regionBounds = region.bounds;
    const regionArea = this.calculateArea(regionBounds);
    
    const childElements = context.document.allNodes.filter(el => {
      const elBounds = this.parseBounds(el.bounds);
      return elBounds && this.isElementContainedIn(elBounds, regionBounds);
    });

    const density = childElements.length / (regionArea / 10000); // 元素密度

    let type = 'unknown';
    if (density > 5) type = 'dense';
    else if (density > 2) type = 'medium';
    else type = 'sparse';

    return {
      type,
      count: childElements.length,
      density: Math.round(density * 100) / 100
    };
  }

  /**
   * 识别布局模式
   */
  private identifyLayoutPattern(region: any, context: ElementAnalysisContext): any {
    // 简化的布局模式识别
    const containerTag = region.container.tag;
    
    let pattern = 'unknown';
    let index = -1;

    if (containerTag.includes('Linear')) {
      pattern = 'linear';
    } else if (containerTag.includes('Grid') || containerTag.includes('RecyclerView')) {
      pattern = 'grid';
    } else if (containerTag.includes('Frame')) {
      pattern = 'overlay';
    }

    return { type: pattern, index };
  }

  /**
   * 生成内容签名
   */
  private generateContentSignature(region: any, context: ElementAnalysisContext): any {
    const regionBounds = region.bounds;
    const childElements = context.document.allNodes.filter(el => {
      const elBounds = this.parseBounds(el.bounds);
      return elBounds && this.isElementContainedIn(elBounds, regionBounds);
    });

    const textElements = childElements.filter(el => this.hasMeaningfulText(el));
    const clickableElements = childElements.filter(el => this.isClickable(el));
    const imageElements = childElements.filter(el => el.tag.includes('Image'));

    return {
      type: 'content-mix',
      values: {
        'text-count': textElements.length,
        'clickable-count': clickableElements.length,
        'image-count': imageElements.length
      }
    };
  }

  // === 检查和计算辅助方法 ===

  /**
   * 检查是否为容器
   */
  private isContainer(element: any): boolean {
    const containerTags = [
      'LinearLayout', 'RelativeLayout', 'FrameLayout', 'ConstraintLayout',
      'ScrollView', 'RecyclerView', 'ListView', 'GridView'
    ];
    return containerTags.some(tag => element.tag.includes(tag));
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
   * 检查元素是否包含在容器内
   */
  private isElementContainedIn(elementBounds: any, containerBounds: any): boolean {
    return elementBounds.left >= containerBounds.left &&
           elementBounds.top >= containerBounds.top &&
           elementBounds.right <= containerBounds.right &&
           elementBounds.bottom <= containerBounds.bottom;
  }

  /**
   * 计算面积
   */
  private calculateArea(bounds: any): number {
    return bounds.width * bounds.height;
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

  // === XPath构建方法（简化版本） ===

  private buildRegionContainerXPath(container: any, element: any): string {
    const containerId = container.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${containerId}']//${element.tag}`;
  }

  private buildRegionTypeXPath(regionType: string, position: string, element: any): string {
    return `//*[contains(@class,'${regionType}')]//${element.tag}`;
  }

  private buildBoundsConstraintXPath(constraints: any, element: any): string {
    return `//${element.tag}[@bounds]`;
  }

  private buildRelativePositionXPath(reference: any, position: any, element: any): string {
    const refId = reference.attributes?.['resource-id'] || '';
    return `//*[@resource-id='${refId}']/following::${element.tag}`;
  }

  private buildTextRelativeXPath(text: string, position: any, element: any): string {
    return `//*[text()='${text}']/following::${element.tag}`;
  }

  private buildScreenRegionXPath(region: string, element: any): string {
    return `//${element.tag}[@bounds]`;
  }

  private buildSizeConstraintXPath(constraints: any, element: any): string {
    return `//${element.tag}[@bounds]`;
  }

  private buildProportionXPath(constraints: any, element: any): string {
    return `//${element.tag}[@bounds]`;
  }

  private buildDensityFeatureXPath(density: any, element: any): string {
    return `//${element.tag}`;
  }

  private buildLayoutPatternXPath(pattern: any, element: any): string {
    return `//*[contains(@class,'${pattern.type}')]//${element.tag}`;
  }

  private buildContentSignatureXPath(signature: any, element: any): string {
    return `//${element.tag}`;
  }

  private buildNestedRegionXPath(regions: any[], element: any): string {
    return `//${regions[0].container.tag}//${regions[1].container.tag}//${element.tag}`;
  }

  private buildAdjacentRegionXPath(regions: any[], element: any): string {
    return `//${element.tag}`;
  }

  // === 其他辅助方法 ===

  private formatBounds(bounds: string | any): string {
    if (typeof bounds === 'string') {
      return bounds;
    }
    if (typeof bounds === 'object' && bounds !== null) {
      return `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
    }
    return '';
  }

  private identifyRegionType(region: any): string {
    const tag = region.container.tag;
    if (tag.includes('Linear')) return 'linear';
    if (tag.includes('Grid')) return 'grid';
    if (tag.includes('Frame')) return 'frame';
    if (tag.includes('Scroll')) return 'scroll';
    return 'unknown';
  }

  private calculateRelativePosition(element: any, region: any): string {
    return 'center'; // 简化实现
  }

  private calculateBoundsConstraints(element: any, region: any): any {
    const elementBounds = this.parseBounds(element.bounds);
    const regionBounds = region.bounds;
    
    if (!elementBounds || !regionBounds) {
      return { isValid: false };
    }

    return {
      isValid: true,
      description: '在区域范围内',
      minX: regionBounds.left,
      maxX: regionBounds.right,
      minY: regionBounds.top,
      maxY: regionBounds.bottom
    };
  }

  private calculateSizeConstraints(bounds: any, context: ElementAnalysisContext): any {
    return {
      isValid: true,
      width: bounds.width,
      height: bounds.height,
      minWidth: bounds.width - 10,
      maxWidth: bounds.width + 10,
      minHeight: bounds.height - 10,
      maxHeight: bounds.height + 10
    };
  }

  private calculateProportionConstraints(bounds: any, context: ElementAnalysisContext): any {
    const ratio = bounds.width / bounds.height;
    return {
      isValid: ratio > 0.1 && ratio < 10,
      description: `宽高比约 ${Math.round(ratio * 10) / 10}`,
      values: { 'aspect-ratio': ratio }
    };
  }

  private findNestedRegions(regions: any[]): any[] {
    return regions.slice(0, 2); // 简化实现
  }

  private findAdjacentRegions(element: any, context: ElementAnalysisContext): any[] {
    return []; // 简化实现
  }

  private getRegionIdentifier(region: any): string {
    return region.container.attributes?.['resource-id'] || region.container.tag;
  }
}