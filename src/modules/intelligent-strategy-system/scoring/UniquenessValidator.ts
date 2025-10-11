// src/modules/intelligent-strategy-system/scoring/UniquenessValidator.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * UniquenessValidator.ts (简化版)
 * 策略唯一性校验器
 * 
 * 主要功能：
 * - 策略相似性分析
 * - 冲突检测
 * - 重复推荐过滤
 * 
 * @author AI Assistant
 * @version 1.0.0 (简化版)
 */

import { 
  MatchStrategy,
  StrategyRecommendation
} from '../types/StrategyTypes';

/**
 * 简化的元素上下文接口
 */
export interface SimpleElementContext {
  /** 元素节点 */
  element: any;
  /** XML内容 */
  xmlContent?: string;
  /** 设备信息 */
  deviceInfo?: any;
}

/**
 * 相似性分析结果
 */
export interface SimilarityAnalysis {
  /** 策略对 */
  strategies: [MatchStrategy, MatchStrategy];
  /** 相似度分数 (0-1) */
  similarity: number;
  /** 相似度类型 */
  similarityType: 'identical' | 'highly-similar' | 'moderately-similar' | 'different';
  /** 建议操作 */
  recommendation: 'merge' | 'prioritize' | 'keep-both';
}

/**
 * 冲突检测结果
 */
export interface ConflictDetection {
  /** 是否存在冲突 */
  hasConflict: boolean;
  /** 冲突类型 */
  conflictType?: 'mutually-exclusive' | 'redundant' | 'performance-impact';
  /** 冲突的策略 */
  conflictingStrategies: MatchStrategy[];
  /** 冲突描述 */
  description: string;
}

/**
 * 唯一性验证结果
 */
export interface UniquenessValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 过滤后的策略 */
  filteredStrategies: StrategyRecommendation[];
  /** 相似性分析结果 */
  similarityAnalyses: SimilarityAnalysis[];
  /** 冲突检测结果 */
  conflictDetections: ConflictDetection[];
  /** 验证摘要 */
  summary: {
    originalCount: number;
    filteredCount: number;
    removedCount: number;
    qualityScore: number;
  };
  /** 建议操作 */
  recommendations: string[];
}

/**
 * 唯一性校验配置
 */
export interface UniquenessValidatorConfig {
  /** 相似度阈值 */
  similarityThresholds: {
    identical: number;
    highlySimilar: number;
    moderatelySimilar: number;
  };
  /** 是否启用冲突检测 */
  enableConflictDetection: boolean;
  /** 是否自动合并相似策略 */
  autoMergeSimilar: boolean;
  /** 最大推荐策略数量 */
  maxRecommendations: number;
  /** 最小置信度要求 */
  minConfidence: number;
}

/**
 * 默认配置
 */
export const DEFAULT_UNIQUENESS_CONFIG: UniquenessValidatorConfig = {
  similarityThresholds: {
    identical: 0.95,
    highlySimilar: 0.85,
    moderatelySimilar: 0.65
  },
  enableConflictDetection: true,
  autoMergeSimilar: true,
  maxRecommendations: 5,
  minConfidence: 0.6
};

/**
 * 简化版策略唯一性校验器
 */
export class UniquenessValidator {
  private config: UniquenessValidatorConfig;

  constructor(config: Partial<UniquenessValidatorConfig> = {}) {
    this.config = { ...DEFAULT_UNIQUENESS_CONFIG, ...config };
  }

  /**
   * 验证策略推荐的唯一性
   */
  public async validateUniqueness(
    recommendations: StrategyRecommendation[],
    context: SimpleElementContext
  ): Promise<UniquenessValidationResult> {
    try {
      // 1. 预过滤 - 移除低置信度策略
      const preFiltered = this.preFilterByConfidence(recommendations);

      // 2. 相似性分析
      const similarityAnalyses = this.analyzeSimilarities(preFiltered);

      // 3. 冲突检测
      const conflictDetections = this.detectConflicts(preFiltered);

      // 4. 应用过滤规则
      const filteredStrategies = this.applyFilteringRules(
        preFiltered,
        similarityAnalyses,
        conflictDetections
      );

      // 5. 生成验证结果
      const result = this.generateValidationResult(
        recommendations,
        filteredStrategies,
        similarityAnalyses,
        conflictDetections
      );

      return result;
    } catch (error) {
      console.error('唯一性验证失败:', error);
      
      // 返回失败结果，保留原始推荐
      return {
        isValid: false,
        filteredStrategies: recommendations,
        similarityAnalyses: [],
        conflictDetections: [],
        summary: {
          originalCount: recommendations.length,
          filteredCount: recommendations.length,
          removedCount: 0,
          qualityScore: 0
        },
        recommendations: ['验证过程出现错误，请检查输入数据']
      };
    }
  }

  /**
   * 按置信度预过滤
   */
  private preFilterByConfidence(
    recommendations: StrategyRecommendation[]
  ): StrategyRecommendation[] {
    return recommendations.filter(rec => rec.confidence >= this.config.minConfidence);
  }

  /**
   * 分析策略相似性
   */
  private analyzeSimilarities(
    recommendations: StrategyRecommendation[]
  ): SimilarityAnalysis[] {
    const analyses: SimilarityAnalysis[] = [];

    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const strategy1 = recommendations[i].strategy;
        const strategy2 = recommendations[j].strategy;
        
        const analysis = this.calculateSimilarity(strategy1, strategy2);
        if (analysis.similarity > 0.3) {
          analyses.push(analysis);
        }
      }
    }

    return analyses;
  }

  /**
   * 计算两个策略的相似性
   */
  private calculateSimilarity(
    strategy1: MatchStrategy,
    strategy2: MatchStrategy
  ): SimilarityAnalysis {
    // 简化的相似度计算
    let similarity = 0;
    
    if (strategy1 === strategy2) {
      similarity = 1.0; // 完全相同
    } else {
      // 基于策略特征的相似度
      similarity = this.getStrategyCrossSimilarity(strategy1, strategy2);
    }

    const similarityType = this.determineSimilarityType(similarity);
    const recommendation = this.generateSimilarityRecommendation(similarityType);

    return {
      strategies: [strategy1, strategy2],
      similarity,
      similarityType,
      recommendation
    };
  }

  /**
   * 获取策略跨类型相似度（简化版）
   */
  private getStrategyCrossSimilarity(
    strategy1: MatchStrategy,
    strategy2: MatchStrategy
  ): number {
    // 简化的相似度映射，只考虑主要策略
    const coreStrategies: MatchStrategy[] = ['absolute', 'strict', 'relaxed', 'positionless', 'standard', 'custom'];
    
    // 如果都是核心策略，给予一定相似度
    if (coreStrategies.includes(strategy1) && coreStrategies.includes(strategy2)) {
      if ((strategy1 === 'strict' && strategy2 === 'standard') || 
          (strategy1 === 'standard' && strategy2 === 'strict')) {
        return 0.9; // 严格和标准策略高度相似
      }
      if ((strategy1 === 'relaxed' && strategy2 === 'positionless') || 
          (strategy1 === 'positionless' && strategy2 === 'relaxed')) {
        return 0.7; // 宽松和无位置策略中度相似
      }
      return 0.5; // 其他核心策略中等相似度
    }

    // XPath策略之间的相似度
    if (strategy1.startsWith('xpath') && strategy2.startsWith('xpath')) {
      return 0.8;
    }

    return 0.2; // 默认低相似度
  }

  /**
   * 确定相似度类型
   */
  private determineSimilarityType(similarity: number): SimilarityAnalysis['similarityType'] {
    const { identical, highlySimilar, moderatelySimilar } = this.config.similarityThresholds;

    if (similarity >= identical) return 'identical';
    if (similarity >= highlySimilar) return 'highly-similar';
    if (similarity >= moderatelySimilar) return 'moderately-similar';
    return 'different';
  }

  /**
   * 生成相似性建议
   */
  private generateSimilarityRecommendation(
    similarityType: SimilarityAnalysis['similarityType']
  ): SimilarityAnalysis['recommendation'] {
    switch (similarityType) {
      case 'identical':
        return 'merge';
      case 'highly-similar':
        return 'prioritize';
      default:
        return 'keep-both';
    }
  }

  /**
   * 检测策略冲突
   */
  private detectConflicts(
    recommendations: StrategyRecommendation[]
  ): ConflictDetection[] {
    if (!this.config.enableConflictDetection) {
      return [];
    }

    const conflicts: ConflictDetection[] = [];

    // 检测互斥策略
    const mutuallyExclusiveConflicts = this.detectMutuallyExclusiveStrategies(recommendations);
    conflicts.push(...mutuallyExclusiveConflicts);

    // 检测冗余策略
    const redundancyConflicts = this.detectRedundantStrategies(recommendations);
    conflicts.push(...redundancyConflicts);

    return conflicts;
  }

  /**
   * 检测互斥策略
   */
  private detectMutuallyExclusiveStrategies(
    recommendations: StrategyRecommendation[]
  ): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];

    // 简化的互斥检测：绝对定位与无位置策略互斥
    const absoluteRecs = recommendations.filter(rec => rec.strategy === 'absolute');
    const positionlessRecs = recommendations.filter(rec => rec.strategy === 'positionless');

    if (absoluteRecs.length > 0 && positionlessRecs.length > 0) {
      conflicts.push({
        hasConflict: true,
        conflictType: 'mutually-exclusive',
        conflictingStrategies: ['absolute', 'positionless'],
        description: '绝对定位策略与无位置策略互斥'
      });
    }

    return conflicts;
  }

  /**
   * 检测冗余策略
   */
  private detectRedundantStrategies(
    recommendations: StrategyRecommendation[]
  ): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];

    // 检测相同策略的重复推荐
    const strategyCount = new Map<MatchStrategy, number>();
    recommendations.forEach(rec => {
      strategyCount.set(rec.strategy, (strategyCount.get(rec.strategy) || 0) + 1);
    });

    for (const [strategy, count] of strategyCount) {
      if (count > 1) {
        conflicts.push({
          hasConflict: true,
          conflictType: 'redundant',
          conflictingStrategies: [strategy],
          description: `策略 ${strategy} 存在 ${count} 个重复推荐`
        });
      }
    }

    return conflicts;
  }

  /**
   * 应用过滤规则
   */
  private applyFilteringRules(
    recommendations: StrategyRecommendation[],
    similarityAnalyses: SimilarityAnalysis[],
    conflictDetections: ConflictDetection[]
  ): StrategyRecommendation[] {
    let filtered = [...recommendations];

    // 处理相似性
    if (this.config.autoMergeSimilar) {
      filtered = this.mergeSimilarStrategies(filtered, similarityAnalyses);
    }

    // 解决冲突
    filtered = this.resolveConflicts(filtered, conflictDetections);

    // 限制数量
    if (filtered.length > this.config.maxRecommendations) {
      filtered = filtered
        .sort((a, b) => b.confidence - a.confidence) // 按置信度排序
        .slice(0, this.config.maxRecommendations);
    }

    return filtered;
  }

  /**
   * 合并相似策略
   */
  private mergeSimilarStrategies(
    recommendations: StrategyRecommendation[],
    similarityAnalyses: SimilarityAnalysis[]
  ): StrategyRecommendation[] {
    const toRemove = new Set<MatchStrategy>();

    for (const analysis of similarityAnalyses) {
      if (analysis.recommendation === 'merge' || analysis.recommendation === 'prioritize') {
        const [strategy1, strategy2] = analysis.strategies;
        
        // 找到对应的推荐，保留置信度更高的
        const rec1 = recommendations.find(r => r.strategy === strategy1);
        const rec2 = recommendations.find(r => r.strategy === strategy2);
        
        if (rec1 && rec2) {
          if (rec1.confidence >= rec2.confidence) {
            toRemove.add(strategy2);
          } else {
            toRemove.add(strategy1);
          }
        }
      }
    }

    return recommendations.filter(rec => !toRemove.has(rec.strategy));
  }

  /**
   * 解决冲突
   */
  private resolveConflicts(
    recommendations: StrategyRecommendation[],
    conflictDetections: ConflictDetection[]
  ): StrategyRecommendation[] {
    let filtered = [...recommendations];

    for (const conflict of conflictDetections) {
      if (conflict.hasConflict) {
        switch (conflict.conflictType) {
          case 'mutually-exclusive':
            // 保留置信度更高的策略
            const conflictingRecs = filtered.filter(rec => 
              conflict.conflictingStrategies.includes(rec.strategy)
            );
            if (conflictingRecs.length > 1) {
              const best = conflictingRecs.reduce((a, b) => a.confidence > b.confidence ? a : b);
              filtered = filtered.filter(rec => 
                !conflict.conflictingStrategies.includes(rec.strategy) || rec === best
              );
            }
            break;

          case 'redundant':
            // 移除重复，保留第一个
            const seen = new Set<MatchStrategy>();
            filtered = filtered.filter(rec => {
              if (conflict.conflictingStrategies.includes(rec.strategy)) {
                if (seen.has(rec.strategy)) {
                  return false;
                }
                seen.add(rec.strategy);
              }
              return true;
            });
            break;
        }
      }
    }

    return filtered;
  }

  /**
   * 生成验证结果
   */
  private generateValidationResult(
    originalRecommendations: StrategyRecommendation[],
    filteredStrategies: StrategyRecommendation[],
    similarityAnalyses: SimilarityAnalysis[],
    conflictDetections: ConflictDetection[]
  ): UniquenessValidationResult {
    const originalCount = originalRecommendations.length;
    const filteredCount = filteredStrategies.length;
    const removedCount = originalCount - filteredCount;

    // 计算质量评分
    const qualityScore = this.calculateQualityScore(
      filteredStrategies,
      similarityAnalyses,
      conflictDetections
    );

    // 生成建议
    const recommendations = this.generateActionRecommendations(
      similarityAnalyses,
      conflictDetections,
      removedCount
    );

    return {
      isValid: conflictDetections.every(c => !c.hasConflict || c.conflictType !== 'mutually-exclusive'),
      filteredStrategies,
      similarityAnalyses,
      conflictDetections,
      summary: {
        originalCount,
        filteredCount,
        removedCount,
        qualityScore
      },
      recommendations
    };
  }

  /**
   * 计算质量评分
   */
  private calculateQualityScore(
    filteredStrategies: StrategyRecommendation[],
    similarityAnalyses: SimilarityAnalysis[],
    conflictDetections: ConflictDetection[]
  ): number {
    let score = 100;

    // 扣除冲突分数
    const criticalConflicts = conflictDetections.filter(c => 
      c.hasConflict && c.conflictType === 'mutually-exclusive'
    ).length;
    const redundantConflicts = conflictDetections.filter(c => 
      c.hasConflict && c.conflictType === 'redundant'
    ).length;

    score -= criticalConflicts * 30;
    score -= redundantConflicts * 10;

    // 扣除过度相似分数
    const identicalPairs = similarityAnalyses.filter(a => 
      a.similarityType === 'identical'
    ).length;
    const highlySimilarPairs = similarityAnalyses.filter(a => 
      a.similarityType === 'highly-similar'
    ).length;

    score -= identicalPairs * 15;
    score -= highlySimilarPairs * 10;

    // 策略多样性奖励
    const uniqueStrategies = new Set(filteredStrategies.map(s => s.strategy)).size;
    if (uniqueStrategies >= 3) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成操作建议
   */
  private generateActionRecommendations(
    similarityAnalyses: SimilarityAnalysis[],
    conflictDetections: ConflictDetection[],
    removedCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (removedCount > 0) {
      recommendations.push(`已自动移除 ${removedCount} 个重复或冲突的策略`);
    }

    const criticalConflicts = conflictDetections.filter(c => 
      c.hasConflict && c.conflictType === 'mutually-exclusive'
    );
    if (criticalConflicts.length > 0) {
      recommendations.push('检测到互斥冲突，已自动选择最优策略');
    }

    const identicalPairs = similarityAnalyses.filter(a => 
      a.similarityType === 'identical'
    );
    if (identicalPairs.length > 0) {
      recommendations.push('发现完全相同的策略，已自动合并');
    }

    if (recommendations.length === 0) {
      recommendations.push('策略推荐通过唯一性验证，质量良好');
    }

    return recommendations;
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<UniquenessValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): UniquenessValidatorConfig {
    return { ...this.config };
  }
}

/**
 * 创建默认唯一性校验器
 */
export function createUniquenessValidator(
  config?: Partial<UniquenessValidatorConfig>
): UniquenessValidator {
  return new UniquenessValidator(config);
}

/**
 * 快速唯一性验证
 */
export async function validateUniqueness(
  recommendations: StrategyRecommendation[],
  context: SimpleElementContext,
  config?: Partial<UniquenessValidatorConfig>
): Promise<UniquenessValidationResult> {
  const validator = createUniquenessValidator(config);
  return validator.validateUniqueness(recommendations, context);
}

export default UniquenessValidator;