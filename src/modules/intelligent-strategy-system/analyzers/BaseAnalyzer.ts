/**
 * BaseAnalyzer.ts
 * 分析器基类和通用接口定义
 * 
 * @description 为Step 1-6分析器提供统一的基础架构
 */

import type {
  ElementAnalysisContext
} from '../types/AnalysisTypes';

import type {
  StrategyCandidate,
  ValidationResult
} from '../types/StrategyTypes';

import type {
  StepAnalysisResult
} from '../types/DecisionTypes';

import { AnalysisStep } from '../types/DecisionTypes';

/**
 * 分析器基类 - 所有Step分析器的基础接口
 */
export abstract class BaseAnalyzer {
  /** 分析器对应的步骤 */
  abstract readonly step: AnalysisStep;
  
  /** 分析器名称 */
  abstract readonly name: string;
  
  /** 分析器描述 */
  abstract readonly description: string;

  /**
   * 主要分析方法 - 每个分析器必须实现
   * @param context 元素分析上下文
   * @returns 分析结果和候选策略
   */
  abstract analyze(context: ElementAnalysisContext): Promise<StepAnalysisResult>;

  /**
   * 检查是否适用于当前上下文
   * @param context 元素分析上下文
   * @returns 是否适用
   */
  abstract isApplicable(context: ElementAnalysisContext): boolean;

  /**
   * 获取优先级（1-10，数字越大优先级越高）
   * @param context 元素分析上下文
   * @returns 优先级分数
   */
  abstract getPriority(context: ElementAnalysisContext): number;

  // === 通用工具方法 ===

  /**
   * 创建策略候选项的通用方法
   */
  protected createCandidate(
    strategy: any,
    score: number,
    reason: string,
    context: ElementAnalysisContext,
    additionalData?: any
  ): StrategyCandidate {
    return {
      id: `${this.step}-${strategy}-${Date.now()}`,
      strategy,
      sourceStep: this.step.toString(),
      scoring: {
        total: score,
        breakdown: {
          uniqueness: 0,
          stability: 0,
          performance: 0,
          reliability: score
        },
        bonuses: [],
        penalties: []
      },
      criteria: {
        fields: [],
        values: {},
        includes: {},
        excludes: {},
        xpath: '',
        strategy: 'standard',
        ...additionalData?.criteria
      },
      validation: {
        passed: true,
        matchCount: 1,
        uniqueness: {
          isUnique: true,
          conflicts: []
        },
        errors: [],
        warnings: [],
        validationTime: Date.now()
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 100,
        deviceCompatibility: ['android'],
        complexity: 'medium'
      }
    };
  }

  /**
   * 创建分析结果的通用方法
   */
  protected createResult(
    success: boolean,
    candidates: StrategyCandidate[],
    message?: string,
    data?: any
  ): StepAnalysisResult {
    return {
      step: this.step,
      success,
      candidates,
      executionTime: Date.now(),
      details: {
        message: message || `${this.name} 分析完成`,
        debugInfo: data,
        warnings: []
      },
      shouldContinue: !success || candidates.length === 0
    };
  }

  /**
   * 检查元素是否具有有效的resource-id
   */
  protected hasValidResourceId(element: any): boolean {
    const resourceId = element.attributes?.['resource-id'];
    return resourceId && 
           resourceId.trim() !== '' && 
           !resourceId.includes('generated') &&
           !resourceId.includes('auto');
  }

  /**
   * 检查元素是否有有意义的文本
   */
  protected hasMeaningfulText(element: any): boolean {
    const text = element.text?.trim();
    return text && 
           text.length > 1 && 
           !/^\d+$/.test(text) && // 不是纯数字
           !/^[!@#$%^&*(),.?":{}|<>]+$/.test(text); // 不是纯符号
  }

  /**
   * 检查元素是否可点击
   */
  protected isClickable(element: any): boolean {
    return element.clickable === true || 
           element.clickable === 'true' ||
           element.attributes?.clickable === 'true';
  }

  /**
   * 获取元素的XPath
   */
  protected getElementXPath(element: any): string {
    return element.xpath || '';
  }

  /**
   * 计算元素在文档中的唯一性分数
   */
  protected calculateUniquenessScore(
    element: any, 
    context: ElementAnalysisContext
  ): number {
    let score = 0;
    
    // resource-id 唯一性
    if (this.hasValidResourceId(element)) {
      const resourceId = element.attributes['resource-id'];
      const duplicateCount = context.document.statistics.duplicateIds[resourceId] || 1;
      score += duplicateCount === 1 ? 40 : 40 / duplicateCount;
    }
    
    // 文本唯一性
    if (this.hasMeaningfulText(element)) {
      const text = element.text.trim();
      const duplicateCount = context.document.statistics.duplicateTexts[text] || 1;
      score += duplicateCount === 1 ? 30 : 30 / duplicateCount;
    }
    
    // content-desc 唯一性
    const contentDesc = element.attributes?.['content-desc'];
    if (contentDesc && contentDesc.trim()) {
      const duplicateCount = context.document.allNodes.filter(
        node => node.attributes['content-desc'] === contentDesc
      ).length;
      score += duplicateCount === 1 ? 20 : 20 / duplicateCount;
    }
    
    // 可点击性加分
    if (this.isClickable(element)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 日志输出工具
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = `[${this.name}]`;
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data);
        break;
      case 'info':
        console.info(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }
}

/**
 * 分析器工厂接口
 */
export interface AnalyzerFactory {
  createAnalyzer(step: AnalysisStep): BaseAnalyzer | null;
  getAllAnalyzers(): BaseAnalyzer[];
  getAnalyzerByStep(step: AnalysisStep): BaseAnalyzer | null;
}

/**
 * 分析结果排序器
 */
export class AnalysisResultSorter {
  /**
   * 根据分数对候选策略进行排序
   */
  static sortCandidatesByScore(candidates: StrategyCandidate[]): StrategyCandidate[] {
    return [...candidates].sort((a, b) => b.scoring.total - a.scoring.total);
  }

  /**
   * 根据策略类型优先级排序
   */
  static sortCandidatesByPriority(candidates: StrategyCandidate[]): StrategyCandidate[] {
    const priorityMap: Record<string, number> = {
      'self-anchor': 10,
      'child-anchor': 9,
      'parent-clickable': 8,
      'region-scoped': 7,
      'neighbor-relative': 6,
      'standard': 5,
      'strict': 4,
      'positionless': 3,
      'relaxed': 2,
      'index-fallback': 1
    };

    return [...candidates].sort((a, b) => {
      const priorityA = priorityMap[a.strategy] || 0;
      const priorityB = priorityMap[b.strategy] || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // 相同优先级时按分数排序
      return b.scoring.total - a.scoring.total;
    });
  }
}