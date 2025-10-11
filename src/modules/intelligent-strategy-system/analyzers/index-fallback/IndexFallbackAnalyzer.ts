// src/modules/intelligent-strategy-system/analyzers/index-fallback/IndexFallbackAnalyzer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * IndexFallbackAnalyzer.ts (重构版)
 * Step 6: 索引兜底分析器 - 主控制器
 * 
 * @description 模块化重构后的主分析器，职责单一，文件精简
 */

import { BaseAnalyzer } from '../BaseAnalyzer';
import { AnalysisStep } from '../../types/DecisionTypes';
import type {
  ElementAnalysisContext,
} from '../../types/AnalysisTypes';
import type {
  StrategyCandidate
} from '../../types/StrategyTypes';

// 导入拆分后的策略模块
import { 
  XPathDirectStrategy,
  AbsolutePositionStrategy,
  ElementIndexStrategy,
  HierarchyPathStrategy,
  CombinationFallbackStrategy
} from './strategies';

// 导入计算器模块
import { IndexCalculator } from './calculators/IndexCalculator';
import { PositionCalculator } from './calculators/PositionCalculator';

// 导入共享工具
import { ElementValidator, BoundsCalculator } from '../../shared';

/**
 * 索引兜底分析器 - Step 6 (重构版)
 * 
 * 重构要点：
 * 1. 拆分大文件为多个职责单一的策略模块
 * 2. 抽取通用计算逻辑到独立的计算器
 * 3. 使用共享工具消除重复代码
 * 4. 主分析器只负责流程控制和策略协调
 */
export class IndexFallbackAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.INDEX_FALLBACK;
  readonly name = 'IndexFallbackAnalyzer';
  readonly description = '基于索引和位置信息的兜底定位分析';

  // 策略实例
  private readonly xpathDirectStrategy = new XPathDirectStrategy();
  private readonly absolutePositionStrategy = new AbsolutePositionStrategy();
  private readonly elementIndexStrategy = new ElementIndexStrategy();
  private readonly hierarchyPathStrategy = new HierarchyPathStrategy();
  private readonly combinationFallbackStrategy = new CombinationFallbackStrategy();

  // 计算器实例
  private readonly indexCalculator = new IndexCalculator();
  private readonly positionCalculator = new PositionCalculator();

  /**
   * 检查是否适用于当前上下文
   * 注意：作为兜底策略，此分析器始终适用
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 兜底策略：只要有基本信息就适用
    return !!(element.xpath || element.bounds || element.tag);
  }

  /**
   * 获取优先级
   * 注意：作为兜底策略，优先级最低
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    let priority = 1; // 基础优先级最低
    
    // 使用IndexCalculator计算基础优先级
    const basePriority = this.indexCalculator.calculateBasePriority(element, context);
    priority += basePriority;
    
    return Math.min(priority, 4); // 最大优先级为4，仍然很低
  }

  /**
   * 主要分析方法 - 精简的流程控制
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始索引兜底分析', { 
      elementTag: element.tag,
      hasXPath: !!element.xpath,
      hasBounds: !!element.bounds
    });

    try {
      // 使用策略模式执行各种兜底策略
      const strategies = [
        this.xpathDirectStrategy,
        this.absolutePositionStrategy,
        this.elementIndexStrategy,
        this.hierarchyPathStrategy,
        this.combinationFallbackStrategy
      ];

      // 并行执行所有策略
      const strategyResults = await Promise.all(
        strategies.map(strategy => this.executeStrategy(strategy, element, context))
      );

      // 收集所有候选策略
      strategyResults.forEach(result => {
        if (result.candidates && result.candidates.length > 0) {
          candidates.push(...result.candidates);
        }
      });

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      this.log('info', `索引兜底分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `索引兜底分析完成，生成 ${sortedCandidates.length} 个兜底策略`,
        { executionTime, fallbackLevel: 'index-based' }
      );

    } catch (error) {
      this.log('error', '索引兜底分析失败', error);
      
      // 即使分析失败，也要提供最基础的兜底策略
      const emergencyCandidates = this.generateEmergencyFallbackStrategies(element, context);
      
      return this.createResult(
        emergencyCandidates.length > 0,
        emergencyCandidates,
        `分析失败，提供 ${emergencyCandidates.length} 个紧急兜底策略`,
        { executionTime: Date.now() - startTime, fallbackLevel: 'emergency' }
      );
    }
  }

  /**
   * 执行单个策略
   */
  private async executeStrategy(
    strategy: any, 
    element: any, 
    context: ElementAnalysisContext
  ): Promise<{ candidates: StrategyCandidate[] }> {
    try {
      if (!strategy.isApplicable(element, context)) {
        return { candidates: [] };
      }

      const candidates = await strategy.analyze(element, context);
      return { candidates: candidates || [] };

    } catch (error) {
      this.log('warn', `策略 ${strategy.name} 执行失败`, error);
      return { candidates: [] };
    }
  }

  /**
   * 生成紧急兜底策略
   * 当所有策略都失败时的最后手段
   */
  private generateEmergencyFallbackStrategies(
    element: any, 
    context: ElementAnalysisContext
  ): StrategyCandidate[] {
    const candidates: StrategyCandidate[] = [];

    // 紧急策略1: 直接使用xpath（如果有）
    if (element.xpath) {
      candidates.push(this.createCandidate(
        'index-fallback',
        30, // 很低的分数
        '紧急XPath兜底策略',
        context,
        {
          criteria: {
            fields: ['emergency-xpath'],
            values: { 'emergency-xpath': element.xpath },
            xpath: element.xpath,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 紧急策略2: 基于bounds的绝对位置点击
    if (element.bounds && BoundsCalculator.parseBounds(element.bounds)) {
      const bounds = BoundsCalculator.parseBounds(element.bounds)!;
      const center = BoundsCalculator.getCenter(bounds);
      
      candidates.push(this.createCandidate(
        'index-fallback',
        20, // 最低分数
        `紧急坐标点击策略 (${center.x}, ${center.y})`,
        context,
        {
          criteria: {
            fields: ['emergency-coordinates'],
            values: { 
              'emergency-coordinates': `${center.x},${center.y}`,
              'bounds': element.bounds
            },
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 紧急策略3: 基于tag的第一个匹配
    if (element.tag) {
      candidates.push(this.createCandidate(
        'index-fallback',
        10, // 极低分数
        `紧急标签匹配策略: ${element.tag}[1]`,
        context,
        {
          criteria: {
            fields: ['emergency-tag'],
            values: { 'emergency-tag': element.tag },
            xpath: `//${element.tag}[1]`,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    return candidates;
  }
}