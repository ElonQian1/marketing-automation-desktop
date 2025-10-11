// src/modules/intelligent-strategy-system/scoring/uniqueness/core/ConflictDetector.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 冲突检测器 - 策略冲突识别和解决方案提供
 * 提取自重复的 UniquenessValidator 实现，统一冲突检测逻辑
 */

import { MatchStrategy, StrategyRecommendation } from '../../../types/StrategyTypes';  
import { 
  ConflictDetection, 
  UniquenessValidatorConfig,
  DEFAULT_UNIQUENESS_CONFIG 
} from '../types';

/**
 * 冲突检测器
 * 负责识别策略之间的冲突并提供解决方案
 */
export class ConflictDetector {
  private config: UniquenessValidatorConfig;

  constructor(config: Partial<UniquenessValidatorConfig> = {}) {
    this.config = { ...DEFAULT_UNIQUENESS_CONFIG, ...config };
  }

  /**
   * 检测策略列表中的所有冲突
   */
  detectAllConflicts(strategies: StrategyRecommendation[]): ConflictDetection[] {
    if (!this.config.enableConflictDetection) {
      return [];
    }

    const conflicts: ConflictDetection[] = [];
    
    // 检查互斥策略
    const mutuallyExclusiveConflict = this.detectMutuallyExclusiveStrategies(strategies);
    if (mutuallyExclusiveConflict.hasConflict) {
      conflicts.push(mutuallyExclusiveConflict);
    }

    // 检查冗余策略
    const redundantConflicts = this.detectRedundantStrategies(strategies);
    conflicts.push(...redundantConflicts);

    // 检查性能影响冲突
    const performanceConflicts = this.detectPerformanceConflicts(strategies);
    conflicts.push(...performanceConflicts);

    return conflicts;
  }

  /**
   * 检测两个策略是否冲突
   */
  detectConflictBetween(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): ConflictDetection {
    // 检查互斥性  
    if (this.areStrategiesMutuallyExclusive(strategy1.strategy, strategy2.strategy)) {
      return {
        hasConflict: true,
        conflictType: 'mutually-exclusive',
        conflictingStrategies: [strategy1.strategy, strategy2.strategy],
        description: `策略 "${strategy1.strategy}" 和 "${strategy2.strategy}" 互相冲突，不能同时使用`,
        resolution: {
          strategy: 'prioritize-one',
          steps: [
            '比较两个策略的置信度和评分',
            '选择置信度更高的策略',
            '移除冲突的低分策略'
          ]
        }
      };
    }

    // 检查冗余性
    if (this.areStrategiesRedundant(strategy1, strategy2)) {
      return {
        hasConflict: true,
        conflictType: 'redundant',
        conflictingStrategies: [strategy1.strategy, strategy2.strategy],
        description: `策略 "${strategy1.strategy}" 和 "${strategy2.strategy}" 功能重复，存在冗余`,
        resolution: {
          strategy: 'remove-conflict',
          steps: [
            '合并相似的策略参数',
            '保留评分更高的策略',
            '删除冗余策略'
          ]
        }
      };
    }

    // 检查性能影响
    if (this.hasPerformanceConflict(strategy1, strategy2)) {
      return {
        hasConflict: true,
        conflictType: 'performance-impact',
        conflictingStrategies: [strategy1.strategy, strategy2.strategy],
        description: `策略组合 "${strategy1.strategy}" + "${strategy2.strategy}" 会影响性能`,
        resolution: {
          strategy: 'modify-parameters',
          steps: [
            '优化策略执行顺序',
            '调整策略参数以提高效率',
            '考虑使用更快的替代策略'
          ]
        }
      };
    }

    return {
      hasConflict: false,
      conflictingStrategies: [],
      description: '未检测到冲突'
    };
  }

  /**
   * 检测互斥策略
   */
  private detectMutuallyExclusiveStrategies(strategies: StrategyRecommendation[]): ConflictDetection {
    const mutuallyExclusivePairs: [MatchStrategy, MatchStrategy][] = [
      ['absolute', 'positionless'],
      ['xpath-direct', 'standard'],
      ['strict', 'relaxed']
    ];

    const conflictingStrategies: MatchStrategy[] = [];
    let conflictDescription = '';

    for (const [strategy1, strategy2] of mutuallyExclusivePairs) {
      const hasStrategy1 = strategies.some(s => s.strategy === strategy1);
      const hasStrategy2 = strategies.some(s => s.strategy === strategy2);
      
      if (hasStrategy1 && hasStrategy2) {
        conflictingStrategies.push(strategy1, strategy2);
        conflictDescription = `发现互斥策略对: ${strategy1} vs ${strategy2}`;
        break;
      }
    }

    return {
      hasConflict: conflictingStrategies.length > 0,
      conflictType: conflictingStrategies.length > 0 ? 'mutually-exclusive' : undefined,
      conflictingStrategies,
      description: conflictDescription || '未发现互斥策略',
      resolution: conflictingStrategies.length > 0 ? {
        strategy: 'prioritize-one',
        steps: [
          '分析各策略的适用场景',
          '根据当前上下文选择最合适的策略',
          '移除不适用的互斥策略'
        ]
      } : undefined
    };
  }

  /**
   * 检测冗余策略
   */
  private detectRedundantStrategies(strategies: StrategyRecommendation[]): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];
    const checked = new Set<string>();

    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const pair = `${strategies[i].strategy}-${strategies[j].strategy}`;
        if (checked.has(pair)) continue;
        checked.add(pair);

        if (this.areStrategiesRedundant(strategies[i], strategies[j])) {
          conflicts.push({
            hasConflict: true,
            conflictType: 'redundant',
            conflictingStrategies: [strategies[i].strategy, strategies[j].strategy],
            description: `策略 "${strategies[i].strategy}" 和 "${strategies[j].strategy}" 功能重复`,
            resolution: {
              strategy: 'remove-conflict',
              steps: [
                '比较策略评分和置信度',
                '保留性能更优的策略',
                '移除冗余策略'
              ]
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * 检测性能影响冲突
   */
  private detectPerformanceConflicts(strategies: StrategyRecommendation[]): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];
    
    // 检查慢策略组合
    const slowStrategies = strategies.filter(s => 
      s.performance && s.performance.speed === 'slow'
    );

    if (slowStrategies.length > 2) {
      conflicts.push({
        hasConflict: true,
        conflictType: 'performance-impact',
        conflictingStrategies: slowStrategies.map(s => s.strategy),
        description: `检测到 ${slowStrategies.length} 个慢策略，可能影响整体性能`,
        resolution: {
          strategy: 'modify-parameters',
          steps: [
            '减少慢策略的数量',
            '优先使用快速策略',
            '考虑并行执行策略'
          ]
        }
      });
    }

    return conflicts;
  }

  /**
   * 判断两种策略是否互斥
   */
  private areStrategiesMutuallyExclusive(strategy1: MatchStrategy, strategy2: MatchStrategy): boolean {
    const mutuallyExclusivePairs: [MatchStrategy, MatchStrategy][] = [
      ['absolute', 'positionless'],
      ['xpath-direct', 'standard'],
      ['strict', 'relaxed'],
      ['custom', 'xpath-direct']
    ];

    return mutuallyExclusivePairs.some(([s1, s2]) =>
      (strategy1 === s1 && strategy2 === s2) || (strategy1 === s2 && strategy2 === s1)
    );
  }

  /**
   * 判断两种策略是否冗余
   */
  private areStrategiesRedundant(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): boolean {
    // 相同策略类型通常是冗余的
    if (strategy1.strategy === strategy2.strategy) {
      return true;
    }

    // 评分和置信度非常接近的相似策略
    const scoreDiff = Math.abs(strategy1.score - strategy2.score);
    const confidenceDiff = Math.abs(strategy1.confidence - strategy2.confidence);
    
    if (scoreDiff < 5 && confidenceDiff < 0.1) {
      // 检查策略类型的功能重叠
      const redundantGroups: MatchStrategy[][] = [
        ['strict', 'standard'],
        ['relaxed', 'positionless'],
        ['xpath-direct', 'xpath-first-index']
      ];

      return redundantGroups.some(group =>
        group.includes(strategy1.strategy) && group.includes(strategy2.strategy)
      );
    }

    return false;
  }

  /**
   * 判断两种策略是否存在性能冲突
   */
  private hasPerformanceConflict(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): boolean {
    // 两个都是慢策略
    if (strategy1.performance?.speed === 'slow' && strategy2.performance?.speed === 'slow') {
      return true;
    }

    // 稳定性差异很大的策略组合
    if (strategy1.performance?.stability === 'low' && strategy2.performance?.stability === 'high') {
      return true;
    }

    return false;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UniquenessValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}