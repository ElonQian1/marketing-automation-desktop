// src/modules/intelligent-strategy-system/analyzers/ParentClickableAnalyzer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * ParentClickableAnalyzer.ts
 * Step 3: 父可点击分析器
 * 
 * @description 当目标元素自身不可点击时，通过其可点击的父元素来构建匹配策略
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
 * 父可点击分析器 - Step 3
 * 
 * 职责：
 * 1. 寻找目标元素的可点击父容器
 * 2. 分析父容器的特征和唯一性
 * 3. 生成基于父容器定位的策略
 * 
 * 适用场景：
 * - 按钮内的文本或图标元素
 * - 列表项内的非可点击子元素
 * - 卡片容器内的内容元素
 * - 菜单项内的子元素
 */
export class ParentClickableAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.PARENT_CLICKABLE;
  readonly name = 'ParentClickableAnalyzer';
  readonly description = '基于可点击父容器的定位分析';

  /**
   * 检查是否适用于当前上下文
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 如果目标元素本身已经可点击，则不需要此分析器
    if (this.isClickable(element)) {
      return false;
    }

    // 必须能找到可点击的父元素
    return this.findClickableParents(element, context).length > 0;
  }

  /**
   * 获取优先级
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    const clickableParents = this.findClickableParents(element, context);
    
    let priority = 0;
    
    // 基于可点击父元素的质量评估优先级
    clickableParents.forEach(parent => {
      const distance = this.calculateElementDistance(element, parent);
      const parentScore = this.calculateParentScore(parent, context);
      
      // 距离越近，父元素特征越好，优先级越高
      priority += (parentScore / (distance + 1)) * 2;
    });
    
    // 如果有直接的可点击父元素，优先级更高
    const directParent = this.getDirectClickableParent(element, context);
    if (directParent) {
      priority += 3;
    }
    
    return Math.min(priority, 8); // 中等优先级
  }

  /**
   * 主要分析方法
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始父可点击分析', { 
      elementTag: element.tag,
      isElementClickable: this.isClickable(element)
    });

    try {
      const clickableParents = this.findClickableParents(element, context);
      
      if (clickableParents.length === 0) {
        return this.createResult(false, [], '未找到可点击的父元素');
      }

      // 1. 直接父容器策略
      const directParentCandidates = await this.analyzeDirectParentStrategies(
        element, clickableParents, context
      );
      candidates.push(...directParentCandidates);

      // 2. 父容器特征匹配策略
      const featureBasedCandidates = await this.analyzeParentFeatureStrategies(
        element, clickableParents, context
      );
      candidates.push(...featureBasedCandidates);

      // 3. 父子关系组合策略
      const relationshipCandidates = await this.analyzeParentChildRelationships(
        element, clickableParents, context
      );
      candidates.push(...relationshipCandidates);

      // 4. 层级定位策略
      const hierarchicalCandidates = await this.analyzeHierarchicalStrategies(
        element, clickableParents, context
      );
      candidates.push(...hierarchicalCandidates);

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      this.log('info', `父可点击分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime,
        clickableParentsCount: clickableParents.length
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `父可点击分析完成，基于 ${clickableParents.length} 个可点击父元素找到 ${sortedCandidates.length} 个候选策略`,
        { executionTime, clickableParentsCount: clickableParents.length }
      );

    } catch (error) {
      this.log('error', '父可点击分析失败', error);
      return this.createResult(false, [], `分析失败: ${error}`);
    }
  }

  // === 具体分析方法 ===

  /**
   * 直接父容器策略分析
   */
  private async analyzeDirectParentStrategies(
    element: any,
    clickableParents: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    // 找到最近的可点击父元素
    const nearestParent = this.findNearestClickableParent(element, clickableParents);
    if (!nearestParent) return candidates;

    let baseScore = 82;
    
    // 策略1: 基于父元素resource-id + 目标元素特征
    if (this.hasValidResourceId(nearestParent)) {
      const parentResourceId = nearestParent.attributes['resource-id'];
      const targetFeatures = this.extractElementFeatures(element);
      
      candidates.push(this.createCandidate(
        'parent-clickable',
        baseScore + 10,
        `通过父元素resource-id定位可点击容器: ${parentResourceId}`,
        context,
        {
          criteria: {
            fields: ['parent-resource-id', 'target-features'],
            values: { 
              'parent-resource-id': parentResourceId,
              ...targetFeatures
            },
            xpath: this.buildParentClickableXPath(nearestParent, element),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    // 策略2: 基于父元素文本内容
    if (this.hasMeaningfulText(nearestParent)) {
      const parentText = nearestParent.text.trim();
      
      candidates.push(this.createCandidate(
        'parent-clickable',
        baseScore + 5,
        `通过父元素文本定位可点击容器: "${parentText}"`,
        context,
        {
          criteria: {
            fields: ['parent-text', 'clickable'],
            values: { 
              'parent-text': parentText,
              'clickable': 'true'
            },
            xpath: this.buildParentTextXPath(nearestParent, element),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    // 策略3: 基于父元素content-desc
    const parentContentDesc = nearestParent.attributes?.['content-desc'];
    if (parentContentDesc && parentContentDesc.trim()) {
      candidates.push(this.createCandidate(
        'parent-clickable',
        baseScore + 8,
        `通过父元素content-desc定位: "${parentContentDesc}"`,
        context,
        {
          criteria: {
            fields: ['parent-content-desc', 'clickable'],
            values: { 
              'parent-content-desc': parentContentDesc,
              'clickable': 'true'
            },
            xpath: this.buildParentContentDescXPath(nearestParent, element),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 父容器特征匹配策略分析
   */
  private async analyzeParentFeatureStrategies(
    element: any,
    clickableParents: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    for (const parent of clickableParents.slice(0, 3)) { // 取前3个最相关的父元素
      const parentScore = this.calculateParentScore(parent, context);
      const distance = this.calculateElementDistance(element, parent);
      const adjustedScore = Math.max(70, 85 - distance * 5);

      // 组合特征策略
      const combinedFeatures = this.extractCombinedFeatures(parent, element);
      if (Object.keys(combinedFeatures).length >= 2) {
        candidates.push(this.createCandidate(
          'parent-clickable',
          adjustedScore,
          `通过父子组合特征定位: ${Object.keys(combinedFeatures).join(' + ')}`,
          context,
          {
            criteria: {
              fields: Object.keys(combinedFeatures),
              values: combinedFeatures,
              xpath: this.buildCombinedFeaturesXPath(parent, element),
              strategy: 'parent-clickable'
            }
          }
        ));
      }

      // 布局相关策略
      if (this.isLayoutContainer(parent)) {
        candidates.push(this.createCandidate(
          'parent-clickable',
          adjustedScore - 5,
          '通过布局容器定位',
          context,
          {
            criteria: {
              fields: ['parent-layout', 'child-position'],
              values: {
                'parent-layout': parent.tag,
                'child-position': this.getChildPosition(element, parent, context)
              },
              xpath: this.buildLayoutContainerXPath(parent, element),
              strategy: 'parent-clickable'
            }
          }
        ));
      }
    }

    return candidates;
  }

  /**
   * 父子关系组合策略分析
   */
  private async analyzeParentChildRelationships(
    element: any,
    clickableParents: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    const nearestParent = this.findNearestClickableParent(element, clickableParents);
    if (!nearestParent) return candidates;

    // 基于目标元素在父容器中的位置关系
    const childIndex = this.getChildIndexInParent(element, nearestParent, context);
    if (childIndex !== -1) {
      candidates.push(this.createCandidate(
        'parent-clickable',
        78,
        `通过父子位置关系定位: 第${childIndex + 1}个子元素`,
        context,
        {
          criteria: {
            fields: ['parent-xpath', 'child-index'],
            values: {
              'parent-xpath': nearestParent.xpath,
              'child-index': childIndex
            },
            xpath: `${nearestParent.xpath}/*[${childIndex + 1}]`,
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    // 基于目标元素的相对文本特征
    if (this.hasMeaningfulText(element)) {
      const targetText = element.text.trim();
      candidates.push(this.createCandidate(
        'parent-clickable',
        80,
        `通过父容器内文本定位: "${targetText}"`,
        context,
        {
          criteria: {
            fields: ['parent-clickable', 'descendant-text'],
            values: {
              'parent-clickable': 'true',
              'descendant-text': targetText
            },
            xpath: this.buildParentDescendantTextXPath(nearestParent, targetText),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    // 多层级父子关系
    if (clickableParents.length > 1) {
      const secondParent = clickableParents[1];
      candidates.push(this.createCandidate(
        'parent-clickable',
        75,
        '通过多层级父子关系定位',
        context,
        {
          criteria: {
            fields: ['multi-level-parents'],
            values: {
              'primary-parent': nearestParent.xpath,
              'secondary-parent': secondParent.xpath
            },
            xpath: this.buildMultiLevelParentXPath(nearestParent, secondParent, element),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 层级定位策略分析
   */
  private async analyzeHierarchicalStrategies(
    element: any,
    clickableParents: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    const nearestParent = this.findNearestClickableParent(element, clickableParents);
    if (!nearestParent) return candidates;

    // 策略1: 基于类型层级
    const typeHierarchy = this.buildTypeHierarchy(element, nearestParent);
    if (typeHierarchy.length > 1) {
      candidates.push(this.createCandidate(
        'parent-clickable',
        73,
        `通过类型层级定位: ${typeHierarchy.join(' > ')}`,
        context,
        {
          criteria: {
            fields: ['type-hierarchy'],
            values: { 'type-hierarchy': typeHierarchy.join('/') },
            xpath: this.buildTypeHierarchyXPath(typeHierarchy),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    // 策略2: 相对深度定位
    const depth = this.calculateRelativeDepth(element, nearestParent);
    if (depth > 0 && depth <= 3) {
      candidates.push(this.createCandidate(
        'parent-clickable',
        71,
        `通过相对深度定位: 深度${depth}`,
        context,
        {
          criteria: {
            fields: ['relative-depth'],
            values: { 'relative-depth': depth },
            xpath: this.buildRelativeDepthXPath(nearestParent, depth),
            strategy: 'parent-clickable'
          }
        }
      ));
    }

    return candidates;
  }

  // === 辅助方法 ===

  /**
   * 查找所有可点击的父元素
   */
  private findClickableParents(element: any, context: ElementAnalysisContext): any[] {
    const elementXPath = element.xpath;
    if (!elementXPath) return [];

    const pathParts = elementXPath.split('/');
    const clickableParents: any[] = [];

    // 从当前元素向上查找可点击的祖先元素
    for (let i = pathParts.length - 1; i > 0; i--) {
      const ancestorPath = pathParts.slice(0, i).join('/');
      if (!ancestorPath) continue;

      const ancestor = context.document.allNodes.find(node => 
        node.xpath === ancestorPath && this.isClickable(node)
      );

      if (ancestor) {
        clickableParents.push(ancestor);
      }
    }

    return clickableParents;
  }

  /**
   * 获取直接的可点击父元素
   */
  private getDirectClickableParent(element: any, context: ElementAnalysisContext): any | null {
    const elementXPath = element.xpath;
    if (!elementXPath) return null;

    const pathParts = elementXPath.split('/');
    if (pathParts.length < 2) return null;

    const parentPath = pathParts.slice(0, -1).join('/');
    return context.document.allNodes.find(node => 
      node.xpath === parentPath && this.isClickable(node)
    ) || null;
  }

  /**
   * 找到最近的可点击父元素
   */
  private findNearestClickableParent(element: any, clickableParents: any[]): any | null {
    if (clickableParents.length === 0) return null;
    
    // 按距离排序，返回最近的
    return clickableParents.sort((a, b) => 
      this.calculateElementDistance(element, a) - this.calculateElementDistance(element, b)
    )[0];
  }

  /**
   * 计算元素间的距离（基于XPath层级）
   */
  private calculateElementDistance(child: any, parent: any): number {
    const childParts = child.xpath?.split('/') || [];
    const parentParts = parent.xpath?.split('/') || [];
    
    return Math.max(0, childParts.length - parentParts.length);
  }

  /**
   * 计算父元素的质量分数
   */
  private calculateParentScore(parent: any, context: ElementAnalysisContext): number {
    let score = 0;
    
    if (this.hasValidResourceId(parent)) {
      const resourceId = parent.attributes['resource-id'];
      const isUnique = this.isResourceIdUnique(resourceId, context);
      score += isUnique ? 40 : 20;
    }
    
    if (this.hasMeaningfulText(parent)) {
      score += 20;
    }
    
    if (parent.attributes?.['content-desc']) {
      score += 15;
    }
    
    if (this.isClickable(parent)) {
      score += 25;
    }
    
    return score;
  }

  /**
   * 提取元素特征
   */
  private extractElementFeatures(element: any): Record<string, any> {
    const features: Record<string, any> = {};
    
    if (this.hasMeaningfulText(element)) {
      features['target-text'] = element.text.trim();
    }
    
    if (element.attributes?.['content-desc']) {
      features['target-content-desc'] = element.attributes['content-desc'];
    }
    
    features['target-class'] = element.tag;
    
    return features;
  }

  /**
   * 提取父子组合特征
   */
  private extractCombinedFeatures(parent: any, child: any): Record<string, any> {
    const features: Record<string, any> = {};
    
    if (this.hasValidResourceId(parent)) {
      features['parent-resource-id'] = parent.attributes['resource-id'];
    }
    
    if (this.hasMeaningfulText(child)) {
      features['child-text'] = child.text.trim();
    }
    
    if (this.isClickable(parent)) {
      features['clickable'] = 'true';
    }
    
    return features;
  }

  /**
   * 检查是否为布局容器
   */
  private isLayoutContainer(element: any): boolean {
    const layoutTags = ['LinearLayout', 'RelativeLayout', 'FrameLayout', 'ConstraintLayout'];
    return layoutTags.includes(element.tag);
  }

  /**
   * 获取子元素在父容器中的位置
   */
  private getChildPosition(child: any, parent: any, context: ElementAnalysisContext): string {
    const childXPath = child.xpath;
    const parentXPath = parent.xpath;
    
    if (childXPath.startsWith(parentXPath)) {
      const relativePath = childXPath.substring(parentXPath.length);
      return relativePath || 'direct-child';
    }
    
    return 'unknown';
  }

  /**
   * 获取子元素在父容器中的索引
   */
  private getChildIndexInParent(child: any, parent: any, context: ElementAnalysisContext): number {
    const parentPath = parent.xpath;
    const childrenPaths = context.document.allNodes
      .filter(node => node.xpath.startsWith(parentPath + '/') && 
                     node.xpath.split('/').length === parentPath.split('/').length + 1)
      .map(node => node.xpath)
      .sort();
    
    return childrenPaths.indexOf(child.xpath);
  }

  /**
   * 构建类型层级
   */
  private buildTypeHierarchy(child: any, parent: any): string[] {
    const childParts = child.xpath?.split('/') || [];
    const parentParts = parent.xpath?.split('/') || [];
    
    const startIndex = parentParts.length;
    const hierarchy = childParts.slice(startIndex).map(part => {
      // 提取标签名（移除索引）
      return part.replace(/\[\d+\]$/, '');
    }).filter(Boolean);
    
    return [parent.tag, ...hierarchy];
  }

  /**
   * 计算相对深度
   */
  private calculateRelativeDepth(child: any, parent: any): number {
    return this.calculateElementDistance(child, parent);
  }

  /**
   * 检查resource-id是否唯一
   */
  private isResourceIdUnique(resourceId: string, context: ElementAnalysisContext): boolean {
    const duplicateCount = context.document.statistics.duplicateIds[resourceId] || 1;
    return duplicateCount === 1;
  }

  // === XPath构建方法 ===

  /**
   * 构建父可点击XPath
   */
  private buildParentClickableXPath(parent: any, child: any): string {
    const parentXPath = parent.xpath || '';
    const childRelativePath = this.getRelativePath(child.xpath, parent.xpath);
    return `${parentXPath}[@clickable='true']${childRelativePath}`;
  }

  /**
   * 构建父文本XPath
   */
  private buildParentTextXPath(parent: any, child: any): string {
    const parentText = parent.text?.trim() || '';
    const childRelativePath = this.getRelativePath(child.xpath, parent.xpath);
    return `//*[text()='${parentText}' and @clickable='true']${childRelativePath}`;
  }

  /**
   * 构建父content-desc XPath
   */
  private buildParentContentDescXPath(parent: any, child: any): string {
    const contentDesc = parent.attributes?.['content-desc'] || '';
    const childRelativePath = this.getRelativePath(child.xpath, parent.xpath);
    return `//*[@content-desc='${contentDesc}' and @clickable='true']${childRelativePath}`;
  }

  /**
   * 构建组合特征XPath
   */
  private buildCombinedFeaturesXPath(parent: any, child: any): string {
    const parentXPath = parent.xpath || '';
    const childRelativePath = this.getRelativePath(child.xpath, parent.xpath);
    return `${parentXPath}[@clickable='true']${childRelativePath}`;
  }

  /**
   * 构建布局容器XPath
   */
  private buildLayoutContainerXPath(parent: any, child: any): string {
    const childRelativePath = this.getRelativePath(child.xpath, parent.xpath);
    return `//${parent.tag}[@clickable='true']${childRelativePath}`;
  }

  /**
   * 构建父后代文本XPath
   */
  private buildParentDescendantTextXPath(parent: any, text: string): string {
    return `//*[@clickable='true']//*[text()='${text}']`;
  }

  /**
   * 构建多层级父XPath
   */
  private buildMultiLevelParentXPath(nearParent: any, farParent: any, child: any): string {
    const childRelativePath = this.getRelativePath(child.xpath, nearParent.xpath);
    return `${farParent.xpath}//${nearParent.tag}[@clickable='true']${childRelativePath}`;
  }

  /**
   * 构建类型层级XPath
   */
  private buildTypeHierarchyXPath(hierarchy: string[]): string {
    return `//${hierarchy.join('//')}`;
  }

  /**
   * 构建相对深度XPath
   */
  private buildRelativeDepthXPath(parent: any, depth: number): string {
    const stars = Array(depth).fill('*').join('/');
    return `${parent.xpath}[@clickable='true']/${stars}`;
  }

  /**
   * 获取相对路径
   */
  private getRelativePath(childPath: string, parentPath: string): string {
    if (childPath.startsWith(parentPath)) {
      return childPath.substring(parentPath.length) || '';
    }
    return '';
  }
}