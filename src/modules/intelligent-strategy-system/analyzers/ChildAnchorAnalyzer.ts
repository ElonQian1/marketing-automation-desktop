/**
 * ChildAnchorAnalyzer.ts
 * Step 2: 子锚点分析器
 * 
 * @description 当目标元素自身特征不够独特时，通过分析其子元素的特征来构建匹配策略
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
 * 子锚点分析器 - Step 2
 * 
 * 职责：
 * 1. 分析目标元素的子元素特征
 * 2. 通过子元素的唯一标识符定位父元素
 * 3. 生成基于子元素锚点的匹配策略
 * 
 * 适用场景：
 * - 目标元素本身特征不明显
 * - 目标元素包含具有唯一特征的子元素
 * - 容器类元素的定位
 */
export class ChildAnchorAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.CHILD_ANCHOR;
  readonly name = 'ChildAnchorAnalyzer';
  readonly description = '基于子元素特征的锚点分析';

  /**
   * 检查是否适用于当前上下文
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 必须有子元素且子元素具有可识别特征
    return this.hasValidChildren(element, context);
  }

  /**
   * 获取优先级
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    const children = this.getValidChildren(element, context);
    
    let priority = 0;
    
    // 基于子元素质量评估优先级
    children.forEach(child => {
      if (this.hasValidResourceId(child)) priority += 2;
      if (this.hasMeaningfulText(child)) priority += 1.5;
      if (this.isClickable(child)) priority += 1;
    });
    
    // 子元素数量合适性加分
    if (children.length >= 1 && children.length <= 5) {
      priority += 2;
    }
    
    return Math.min(priority, 9); // 略低于自我锚点
  }

  /**
   * 主要分析方法
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始子锚点分析', { 
      elementTag: element.tag,
      elementXPath: element.xpath
    });

    try {
      const validChildren = this.getValidChildren(element, context);
      
      if (validChildren.length === 0) {
        return this.createResult(false, [], '未找到有效的子元素锚点');
      }

      // 1. 单子元素锚点策略
      const singleChildCandidates = await this.analyzeSingleChildAnchors(
        element, validChildren, context
      );
      candidates.push(...singleChildCandidates);

      // 2. 多子元素组合锚点策略
      const multiChildCandidates = await this.analyzeMultiChildAnchors(
        element, validChildren, context
      );
      candidates.push(...multiChildCandidates);

      // 3. 子元素文本内容策略
      const textBasedCandidates = await this.analyzeChildTextAnchors(
        element, validChildren, context
      );
      candidates.push(...textBasedCandidates);

      // 4. 特定位置子元素策略
      const positionalCandidates = await this.analyzePositionalChildAnchors(
        element, validChildren, context
      );
      candidates.push(...positionalCandidates);

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      this.log('info', `子锚点分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime,
        validChildrenCount: validChildren.length
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `子锚点分析完成，基于 ${validChildren.length} 个子元素找到 ${sortedCandidates.length} 个候选策略`,
        { executionTime, validChildrenCount: validChildren.length }
      );

    } catch (error) {
      this.log('error', '子锚点分析失败', error);
      return this.createResult(false, [], `分析失败: ${error}`);
    }
  }

  // === 具体分析方法 ===

  /**
   * 单子元素锚点分析
   */
  private async analyzeSingleChildAnchors(
    element: any,
    children: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    for (const child of children) {
      let baseScore = 80;
      
      // 基于子元素的 resource-id
      if (this.hasValidResourceId(child)) {
        const childResourceId = child.attributes['resource-id'];
        const isUnique = this.isChildResourceIdUnique(childResourceId, context);
        
        candidates.push(this.createCandidate(
          'child-anchor',
          baseScore + (isUnique ? 15 : 5),
          `通过子元素resource-id定位: ${childResourceId}`,
          context,
          {
            criteria: {
              fields: ['child-resource-id'],
              values: { 'child-resource-id': childResourceId },
              xpath: this.buildChildAnchorXPath(element, child, 'resource-id'),
              strategy: 'child-anchor'
            }
          }
        ));
      }

      // 基于子元素的文本
      if (this.hasMeaningfulText(child)) {
        const childText = child.text.trim();
        const isUnique = this.isChildTextUnique(childText, context);
        
        candidates.push(this.createCandidate(
          'child-anchor',
          baseScore + (isUnique ? 12 : 3),
          `通过子元素文本定位: "${childText}"`,
          context,
          {
            criteria: {
              fields: ['child-text'],
              values: { 'child-text': childText },
              xpath: this.buildChildAnchorXPath(element, child, 'text'),
              strategy: 'child-anchor'
            }
          }
        ));
      }

      // 基于子元素的 content-desc
      const childContentDesc = child.attributes?.['content-desc'];
      if (childContentDesc && childContentDesc.trim()) {
        candidates.push(this.createCandidate(
          'child-anchor',
          baseScore + 10,
          `通过子元素content-desc定位: "${childContentDesc}"`,
          context,
          {
            criteria: {
              fields: ['child-content-desc'],
              values: { 'child-content-desc': childContentDesc },
              xpath: this.buildChildAnchorXPath(element, child, 'content-desc'),
              strategy: 'child-anchor'
            }
          }
        ));
      }
    }

    return candidates;
  }

  /**
   * 多子元素组合锚点分析
   */
  private async analyzeMultiChildAnchors(
    element: any,
    children: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    if (children.length < 2) return candidates;

    // 选择最有特征的2-3个子元素进行组合
    const topChildren = children
      .map(child => ({
        child,
        score: this.calculateChildScore(child, context)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(3, children.length))
      .map(item => item.child);

    if (topChildren.length >= 2) {
      const combinedIdentifiers = topChildren.map(child => {
        if (this.hasValidResourceId(child)) {
          return `resource-id:${child.attributes['resource-id']}`;
        } else if (this.hasMeaningfulText(child)) {
          return `text:${child.text.trim()}`;
        }
        return null;
      }).filter(Boolean);

      if (combinedIdentifiers.length >= 2) {
        candidates.push(this.createCandidate(
          'child-anchor',
          92,
          `通过多子元素组合定位: ${combinedIdentifiers.join(' + ')}`,
          context,
          {
            criteria: {
              fields: ['multi-child-anchors'],
              values: { 'multi-child-anchors': combinedIdentifiers.join('|') },
              xpath: this.buildMultiChildAnchorXPath(element, topChildren),
              strategy: 'child-anchor'
            }
          }
        ));
      }
    }

    return candidates;
  }

  /**
   * 子元素文本内容分析
   */
  private async analyzeChildTextAnchors(
    element: any,
    children: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    const textChildren = children.filter(child => this.hasMeaningfulText(child));
    
    if (textChildren.length === 0) return candidates;

    // 基于所有子元素文本的组合模式
    const allTexts = textChildren.map(child => child.text.trim());
    const textPattern = allTexts.join('|');

    if (allTexts.length > 1) {
      candidates.push(this.createCandidate(
        'child-anchor',
        85,
        `通过子元素文本模式定位: 包含 ${allTexts.length} 个文本项`,
        context,
        {
          criteria: {
            fields: ['child-text-pattern'],
            values: { 'child-text-pattern': textPattern },
            includes: { 'child-texts': allTexts },
            strategy: 'child-anchor'
          }
        }
      ));
    }

    // 特定关键词子元素
    const keywordTexts = allTexts.filter(text => 
      this.isKeywordText(text)
    );
    
    if (keywordTexts.length > 0) {
      candidates.push(this.createCandidate(
        'child-anchor',
        88,
        `通过关键词子元素定位: ${keywordTexts.join(', ')}`,
        context,
        {
          criteria: {
            fields: ['child-keywords'],
            values: { 'child-keywords': keywordTexts.join('|') },
            includes: { 'child-keywords': keywordTexts },
            strategy: 'child-anchor'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 特定位置子元素分析
   */
  private async analyzePositionalChildAnchors(
    element: any,
    children: any[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];

    if (children.length === 0) return candidates;

    // 第一个子元素策略
    const firstChild = children[0];
    if (this.hasValidResourceId(firstChild) || this.hasMeaningfulText(firstChild)) {
      candidates.push(this.createCandidate(
        'child-anchor',
        75,
        '通过第一个子元素定位',
        context,
        {
          criteria: {
            fields: ['first-child'],
            values: this.getChildIdentifyingValues(firstChild),
            xpath: this.buildPositionalChildXPath(element, firstChild, 'first'),
            strategy: 'child-anchor'
          }
        }
      ));
    }

    // 最后一个子元素策略
    const lastChild = children[children.length - 1];
    if (children.length > 1 && 
        (this.hasValidResourceId(lastChild) || this.hasMeaningfulText(lastChild))) {
      candidates.push(this.createCandidate(
        'child-anchor',
        75,
        '通过最后一个子元素定位',
        context,
        {
          criteria: {
            fields: ['last-child'],
            values: this.getChildIdentifyingValues(lastChild),
            xpath: this.buildPositionalChildXPath(element, lastChild, 'last'),
            strategy: 'child-anchor'
          }
        }
      ));
    }

    return candidates;
  }

  // === 辅助方法 ===

  /**
   * 检查是否有有效的子元素
   */
  private hasValidChildren(element: any, context: ElementAnalysisContext): boolean {
    return this.getValidChildren(element, context).length > 0;
  }

  /**
   * 获取有效的子元素列表
   */
  private getValidChildren(element: any, context: ElementAnalysisContext): any[] {
    // 从上下文的文档中查找子元素
    const elementXPath = element.xpath;
    if (!elementXPath) return [];

    const childElements = context.document.allNodes.filter(node => 
      node.xpath.startsWith(elementXPath + '/') && 
      node.xpath.split('/').length === elementXPath.split('/').length + 1
    );

    return childElements.filter((child: any) =>
      this.hasValidResourceId(child) ||
      this.hasMeaningfulText(child) ||
      (child.attributes?.['content-desc'] && child.attributes['content-desc'].trim())
    );
  }

  /**
   * 计算子元素的重要性分数
   */
  private calculateChildScore(child: any, context: ElementAnalysisContext): number {
    let score = 0;
    
    if (this.hasValidResourceId(child)) {
      const resourceId = child.attributes['resource-id'];
      const isUnique = this.isChildResourceIdUnique(resourceId, context);
      score += isUnique ? 40 : 20;
    }
    
    if (this.hasMeaningfulText(child)) {
      const text = child.text.trim();
      const isUnique = this.isChildTextUnique(text, context);
      score += isUnique ? 30 : 15;
      
      // 关键词文本额外加分
      if (this.isKeywordText(text)) {
        score += 10;
      }
    }
    
    if (this.isClickable(child)) {
      score += 15;
    }
    
    return score;
  }

  /**
   * 检查子元素resource-id是否唯一
   */
  private isChildResourceIdUnique(resourceId: string, context: ElementAnalysisContext): boolean {
    const duplicateCount = context.document.statistics.duplicateIds[resourceId] || 1;
    return duplicateCount === 1;
  }

  /**
   * 检查子元素文本是否唯一
   */
  private isChildTextUnique(text: string, context: ElementAnalysisContext): boolean {
    const duplicateCount = context.document.statistics.duplicateTexts[text] || 1;
    return duplicateCount === 1;
  }

  /**
   * 检查是否为关键词文本
   */
  private isKeywordText(text: string): boolean {
    const keywords = [
      '确定', '取消', '保存', '删除', '编辑', '添加', '搜索', '登录', '注册',
      '提交', '重置', '返回', '下一步', '上一步', '完成', '开始'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 构建子锚点XPath
   */
  private buildChildAnchorXPath(parent: any, child: any, anchorType: string): string {
    const parentXPath = parent.xpath || '';
    const childXPath = child.xpath || '';
    
    if (anchorType === 'resource-id') {
      const resourceId = child.attributes['resource-id'];
      return `${parentXPath}/*[@resource-id='${resourceId}']/../`;
    } else if (anchorType === 'text') {
      const text = child.text.trim();
      return `${parentXPath}/*[text()='${text}']/../`;
    } else if (anchorType === 'content-desc') {
      const contentDesc = child.attributes['content-desc'];
      return `${parentXPath}/*[@content-desc='${contentDesc}']/../`;
    }
    
    return parentXPath;
  }

  /**
   * 构建多子元素锚点XPath
   */
  private buildMultiChildAnchorXPath(parent: any, children: any[]): string {
    const parentXPath = parent.xpath || '';
    const childConditions = children.map(child => {
      if (this.hasValidResourceId(child)) {
        return `*[@resource-id='${child.attributes['resource-id']}']`;
      } else if (this.hasMeaningfulText(child)) {
        return `*[text()='${child.text.trim()}']`;
      }
      return null;
    }).filter(Boolean);
    
    if (childConditions.length > 0) {
      return `${parentXPath}[${childConditions.join(' and ')}]`;
    }
    
    return parentXPath;
  }

  /**
   * 构建位置子元素XPath
   */
  private buildPositionalChildXPath(parent: any, child: any, position: 'first' | 'last'): string {
    const parentXPath = parent.xpath || '';
    
    if (position === 'first') {
      return `${parentXPath}/*[1]/../`;
    } else if (position === 'last') {
      return `${parentXPath}/*[last()]/../`;
    }
    
    return parentXPath;
  }

  /**
   * 获取子元素的标识值
   */
  private getChildIdentifyingValues(child: any): Record<string, any> {
    const values: Record<string, any> = {};
    
    if (this.hasValidResourceId(child)) {
      values['resource-id'] = child.attributes['resource-id'];
    }
    
    if (this.hasMeaningfulText(child)) {
      values['text'] = child.text.trim();
    }
    
    if (child.attributes?.['content-desc']) {
      values['content-desc'] = child.attributes['content-desc'];
    }
    
    values['class'] = child.tag;
    
    return values;
  }
}