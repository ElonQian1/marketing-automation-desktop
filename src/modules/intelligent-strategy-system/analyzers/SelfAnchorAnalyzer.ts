// src/modules/intelligent-strategy-system/analyzers/SelfAnchorAnalyzer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * SelfAnchorAnalyzer.ts
 * Step 1: 自我锚点分析器
 * 
 * @description 分析目标元素自身的唯一标识符，生成基于元素自身特征的匹配策略
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
 * 自我锚点分析器 - Step 1
 * 
 * 职责：
 * 1. 检查目标元素的resource-id唯一性
 * 2. 分析text/content-desc的唯一性
 * 3. 生成基于元素自身特征的高可靠性策略
 * 
 * 优势：
 * - 最直接和可靠的匹配方式
 * - 跨设备兼容性好
 * - 执行速度快
 */
export class SelfAnchorAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.SELF_ANCHOR;
  readonly name = 'SelfAnchorAnalyzer';
  readonly description = '基于目标元素自身特征的锚点分析';

  /**
   * 检查是否适用于当前上下文
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 必须有有效的标识符之一
    return this.hasValidResourceId(element) || 
           this.hasMeaningfulText(element) ||
           this.hasValidContentDesc(element);
  }

  /**
   * 获取优先级 - 自我锚点是最高优先级
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    let priority = 0;
    
    // resource-id 存在且唯一 = 最高优先级
    if (this.hasValidResourceId(element)) {
      const resourceId = element.attributes['resource-id'];
      const isUnique = this.isResourceIdUnique(resourceId, context);
      priority += isUnique ? 10 : 8;
    }
    
    // 有意义的文本内容
    if (this.hasMeaningfulText(element)) {
      const isUnique = this.isTextUnique(element.text, context);
      priority += isUnique ? 8 : 6;
    }
    
    // content-desc 存在且唯一
    if (this.hasValidContentDesc(element)) {
      const contentDesc = element.attributes['content-desc'];
      const isUnique = this.isContentDescUnique(contentDesc, context);
      priority += isUnique ? 7 : 5;
    }
    
    return Math.min(priority, 10);
  }

  /**
   * 主要分析方法
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始自我锚点分析', { 
      elementTag: element.tag,
      hasResourceId: this.hasValidResourceId(element),
      hasText: this.hasMeaningfulText(element)
    });

    try {
      // 1. 基于 resource-id 的策略
      const resourceIdCandidates = await this.analyzeResourceId(element, context);
      candidates.push(...resourceIdCandidates);

      // 2. 基于文本内容的策略
      const textCandidates = await this.analyzeTextContent(element, context);
      candidates.push(...textCandidates);

      // 3. 基于 content-desc 的策略
      const contentDescCandidates = await this.analyzeContentDesc(element, context);
      candidates.push(...contentDescCandidates);

      // 4. 组合策略（多重锚点）
      const combinedCandidates = await this.analyzeCombinedAnchors(element, context);
      candidates.push(...combinedCandidates);

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      this.log('info', `自我锚点分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime,
        topScore: sortedCandidates[0]?.scoring.total || 0
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `自我锚点分析完成，找到 ${sortedCandidates.length} 个候选策略`,
        { executionTime, totalCandidates: sortedCandidates.length }
      );

    } catch (error) {
      this.log('error', '自我锚点分析失败', error);
      return this.createResult(false, [], `分析失败: ${error}`);
    }
  }

  // === 具体分析方法 ===

  /**
   * 基于 resource-id 的分析
   */
  private async analyzeResourceId(
    element: any, 
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (!this.hasValidResourceId(element)) {
      return candidates;
    }

    const resourceId = element.attributes['resource-id'];
    const isUnique = this.isResourceIdUnique(resourceId, context);
    const baseScore = isUnique ? 95 : 75;

    // 策略1: 纯 resource-id 匹配
    candidates.push(this.createCandidate(
      'self-anchor',
      baseScore,
      `基于唯一resource-id: ${resourceId}`,
      context,
      {
        criteria: {
          fields: ['resource-id'],
          values: { 'resource-id': resourceId },
          strategy: 'standard'
        }
      }
    ));

    // 策略2: resource-id + 可点击性验证
    if (this.isClickable(element)) {
      candidates.push(this.createCandidate(
        'strict',
        baseScore + 5,
        `基于resource-id + 可点击性验证`,
        context,
        {
          criteria: {
            fields: ['resource-id', 'clickable'],
            values: { 
              'resource-id': resourceId,
              'clickable': 'true'
            },
            strategy: 'strict'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 基于文本内容的分析
   */
  private async analyzeTextContent(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (!this.hasMeaningfulText(element)) {
      return candidates;
    }

    const text = element.text.trim();
    const isUnique = this.isTextUnique(text, context);
    const baseScore = isUnique ? 85 : 65;

    // 策略1: 纯文本匹配
    candidates.push(this.createCandidate(
      'self-anchor',
      baseScore,
      `基于唯一文本内容: "${text}"`,
      context,
      {
        criteria: {
          fields: ['text'],
          values: { text },
          strategy: 'standard'
        }
      }
    ));

    // 策略2: 文本 + 元素类型
    candidates.push(this.createCandidate(
      'strict',
      baseScore + 3,
      `基于文本内容 + 元素类型`,
      context,
      {
        criteria: {
          fields: ['text', 'class'],
          values: { 
            text,
            class: element.tag
          },
          strategy: 'strict'
        }
      }
    ));

    // 策略3: 文本包含匹配（对于较长文本）
    if (text.length > 10) {
      candidates.push(this.createCandidate(
        'relaxed',
        baseScore - 10,
        `基于文本包含匹配`,
        context,
        {
          criteria: {
            fields: ['text'],
            values: { text: '' },
            includes: { text: [text] },
            strategy: 'relaxed'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 基于 content-desc 的分析
   */
  private async analyzeContentDesc(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (!this.hasValidContentDesc(element)) {
      return candidates;
    }

    const contentDesc = element.attributes['content-desc'];
    const isUnique = this.isContentDescUnique(contentDesc, context);
    const baseScore = isUnique ? 90 : 70;

    // 策略1: 纯 content-desc 匹配
    candidates.push(this.createCandidate(
      'self-anchor',
      baseScore,
      `基于唯一content-desc: "${contentDesc}"`,
      context,
      {
        criteria: {
          fields: ['content-desc'],
          values: { 'content-desc': contentDesc },
          strategy: 'standard'
        }
      }
    ));

    return candidates;
  }

  /**
   * 组合锚点分析（多重验证）
   */
  private async analyzeCombinedAnchors(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    const hasResourceId = this.hasValidResourceId(element);
    const hasText = this.hasMeaningfulText(element);
    const hasContentDesc = this.hasValidContentDesc(element);

    // 双重锚点组合
    if (hasResourceId && hasText) {
      candidates.push(this.createCandidate(
        'strict',
        98,
        `双重锚点: resource-id + text`,
        context,
        {
          criteria: {
            fields: ['resource-id', 'text'],
            values: {
              'resource-id': element.attributes['resource-id'],
              text: element.text.trim()
            },
            strategy: 'strict'
          }
        }
      ));
    }

    if (hasResourceId && hasContentDesc) {
      candidates.push(this.createCandidate(
        'strict',
        96,
        `双重锚点: resource-id + content-desc`,
        context,
        {
          criteria: {
            fields: ['resource-id', 'content-desc'],
            values: {
              'resource-id': element.attributes['resource-id'],
              'content-desc': element.attributes['content-desc']
            },
            strategy: 'strict'
          }
        }
      ));
    }

    // 三重锚点（最高可靠性）
    if (hasResourceId && hasText && hasContentDesc) {
      candidates.push(this.createCandidate(
        'strict',
        100,
        `三重锚点: resource-id + text + content-desc`,
        context,
        {
          criteria: {
            fields: ['resource-id', 'text', 'content-desc'],
            values: {
              'resource-id': element.attributes['resource-id'],
              text: element.text.trim(),
              'content-desc': element.attributes['content-desc']
            },
            strategy: 'strict'
          }
        }
      ));
    }

    return candidates;
  }

  // === 辅助方法 ===

  /**
   * 检查是否有有效的 content-desc
   */
  private hasValidContentDesc(element: any): boolean {
    const contentDesc = element.attributes?.['content-desc'];
    return contentDesc && 
           contentDesc.trim() !== '' &&
           contentDesc !== 'null' &&
           contentDesc !== 'undefined';
  }

  /**
   * 检查 resource-id 是否在文档中唯一
   */
  private isResourceIdUnique(resourceId: string, context: ElementAnalysisContext): boolean {
    const duplicateCount = context.document.statistics.duplicateIds[resourceId] || 1;
    return duplicateCount === 1;
  }

  /**
   * 检查文本是否在文档中唯一
   */
  private isTextUnique(text: string, context: ElementAnalysisContext): boolean {
    const duplicateCount = context.document.statistics.duplicateTexts[text] || 1;
    return duplicateCount === 1;
  }

  /**
   * 检查 content-desc 是否在文档中唯一
   */
  private isContentDescUnique(contentDesc: string, context: ElementAnalysisContext): boolean {
    const matchingNodes = context.document.allNodes.filter(node => 
      node.attributes['content-desc'] === contentDesc
    );
    return matchingNodes.length === 1;
  }
}