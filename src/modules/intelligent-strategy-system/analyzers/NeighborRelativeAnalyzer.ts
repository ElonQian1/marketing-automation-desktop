/**
 * NeighborRelativeAnalyzer.ts (重构版)
 * Step 5: 相邻元素相对分析器
 * 
 * @description 使用模块化策略架构，支持多种邻居定位策略
 */

import { BaseAnalyzer } from './BaseAnalyzer';
import { AnalysisStep, StepAnalysisResult } from '../types/DecisionTypes';
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
 * 相邻元素相对分析器 - Step 5 (模块化重构版)
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

  /**
   * 获取分析优先级
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    let basePriority = 60;

    // 根据相邻元素质量调整优先级
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.isApplicable(element, context)
    );

    // 每个可用策略增加优先级
    basePriority += applicableStrategies.length * 8;

    // 多邻居策略可用时提高优先级
    if (applicableStrategies.some(s => s.name === 'MultiNeighborStrategy')) {
      basePriority += 15;
    }

    // 直接邻居策略可用时提高优先级
    if (applicableStrategies.some(s => s.name === 'DirectNeighborStrategy')) {
      basePriority += 10;
    }

    return Math.min(basePriority, 95); // 限制最大优先级
  }

  /**
   * 执行相邻元素相对分析
   */
  async analyze(context: ElementAnalysisContext): Promise<StepAnalysisResult> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始相邻元素相对分析 (模块化)', {
      element: element.tag,
      strategiesCount: this.strategies.length
    });

    try {
      // 并行执行所有适用的策略
      const strategyPromises = this.strategies
        .filter(strategy => strategy.isApplicable(element, context))
        .map(async strategy => {
          try {
            this.log('debug', `执行策略: ${strategy.name}`);
            const strategyCandidates = await strategy.analyze(element, context);
            this.log('debug', `策略 ${strategy.name} 生成候选: ${strategyCandidates.length}个`);
            return strategyCandidates;
          } catch (error) {
            this.log('warn', `策略 ${strategy.name} 执行失败`, { error });
            return [];
          }
        });

      const strategyResults = await Promise.all(strategyPromises);
      
      // 收集所有候选策略
      strategyResults.forEach(strategyCandidates => {
        candidates.push(...strategyCandidates);
      });

      // 按分数排序
      candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const endTime = Date.now();
      const performance = {
        analysisTime: endTime - startTime,
        strategiesExecuted: strategyResults.length,
        candidatesGenerated: candidates.length
      };

      this.log('info', '相邻元素相对分析完成 (模块化)', {
        candidatesCount: candidates.length,
        executionTime: `${performance.analysisTime}ms`,
        strategiesExecuted: performance.strategiesExecuted
      });

      return {
        step: this.step,
        success: candidates.length > 0,
        candidates: candidates.slice(0, 20), // 限制候选数量
        executionTime: performance.analysisTime,
        details: {
          message: `相邻元素相对分析完成，生成${candidates.length}个候选策略`,
          debugInfo: {
            strategiesExecuted: performance.strategiesExecuted,
            totalCandidates: candidates.length,
            bestScore: candidates[0]?.scoring.total || 0
          }
        },
        shouldContinue: candidates.length === 0 // 没有候选时继续下一步
      };

    } catch (error) {
      this.log('error', '相邻元素相对分析失败', { error });
      
      return {
        step: this.step,
        success: false,
        candidates: [],
        executionTime: Date.now() - startTime,
        details: {
          message: '相邻元素相对分析失败',
          debugInfo: {
            error: error instanceof Error ? error.message : '未知错误'
          }
        },
        shouldContinue: true // 失败时继续下一步
      };
    }
  }

  /**
   * 日志记录
   */
  protected log(level: 'info' | 'debug' | 'warn' | 'error', message: string, data?: any) {
    console[level](`[NeighborRelativeAnalyzer] ${message}`, data || '');
  }
}