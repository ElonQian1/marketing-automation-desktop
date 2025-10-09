/**
 * 策略唯一性校验器
 * 验证策略推荐的唯一性和有效性，防止重复或冲突的策略建议
 * 
 * 主要功能：
 * - 策略相似性分析
 * - 冲突检测
 * - 重复推荐过滤
 * - 推荐质量验证
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import { 
  MatchStrategy as MatchingStrategy, 
  StrategyRecommendation
} from '../types/StrategyTypes';

// 定义唯一性校验需要的类型
export type ConfidenceLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';

export interface ElementContext {
  /** 元素节点 */
  element: any;
  /** XML内容 */
  xmlContent: string;
  /** 设备配置 */
  deviceProfiles?: any[];
  /** 分辨率配置 */
  resolutionProfiles?: any[];
  /** 应用版本信息 */
  appVersions?: any[];
  /** 环境信息 */
  environment?: string;
}

// 简化的校验结果类型
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// 简化的评分结果类型
export interface ScoringResult {
  score: number;
  level: string;
}

// 简化的策略比较类型
export interface StrategyComparison {
  strategy1: MatchingStrategy;
  strategy2: MatchingStrategy;
  similarity: number;
}

/**
 * 策略相似性分析结果
 */
export interface SimilarityAnalysis {
  /** 策略对 */
  strategies: [MatchingStrategy, MatchingStrategy];
  /** 相似度分数 (0-1) */
  similarity: number;
  /** 相似度类型 */
  similarityType: SimilarityType;
  /** 详细分析 */
  details: SimilarityDetails;
  /** 建议操作 */
  recommendation: SimilarityRecommendation;
}

/**
 * 相似度类型
 */
export type SimilarityType = 
  | 'identical'       // 完全相同
  | 'highly-similar'  // 高度相似
  | 'moderately-similar' // 中度相似
  | 'low-similar'     // 低相似度
  | 'different';      // 不同

/**
 * 相似性详细分析
 */
export interface SimilarityDetails {
  /** 字段匹配情况 */
  fieldMatches: Record<string, boolean>;
  /** 值匹配情况 */
  valueMatches: Record<string, number>;
  /** 策略类型匹配 */
  strategyTypeMatch: boolean;
  /** 参数相似度 */
  parameterSimilarity: number;
  /** 预期效果相似度 */
  expectedEffectSimilarity: number;
}

/**
 * 相似性建议
 */
export interface SimilarityRecommendation {
  /** 建议类型 */
  type: 'merge' | 'prioritize' | 'differentiate' | 'keep-both';
  /** 建议原因 */
  reason: string;
  /** 优先选择的策略 */
  preferredStrategy?: MatchingStrategy;
  /** 具体建议操作 */
  actions: string[];
}

/**
 * 冲突检测结果
 */
export interface ConflictDetection {
  /** 是否存在冲突 */
  hasConflict: boolean;
  /** 冲突类型 */
  conflictType?: ConflictType;
  /** 冲突的策略 */
  conflictingStrategies: MatchingStrategy[];
  /** 冲突详情 */
  details: ConflictDetails;
  /** 解决建议 */
  resolutionSuggestion: ResolutionSuggestion;
}

/**
 * 冲突类型
 */
export type ConflictType = 
  | 'mutually-exclusive'  // 互斥
  | 'contradictory'       // 矛盾
  | 'redundant'          // 冗余
  | 'performance-impact'; // 性能影响

/**
 * 冲突详情
 */
export interface ConflictDetails {
  /** 冲突描述 */
  description: string;
  /** 受影响的字段 */
  affectedFields: string[];
  /** 冲突严重程度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 潜在后果 */
  potentialConsequences: string[];
}

/**
 * 解决建议
 */
export interface ResolutionSuggestion {
  /** 建议策略 */
  strategy: 'remove-conflict' | 'modify-parameters' | 'prioritize-one' | 'separate-contexts';
  /** 具体步骤 */
  steps: string[];
  /** 预期结果 */
  expectedOutcome: string;
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
  summary: ValidationSummary;
  /** 建议操作 */
  recommendations: string[];
}

/**
 * 验证摘要
 */
export interface ValidationSummary {
  /** 原始策略数量 */
  originalCount: number;
  /** 过滤后策略数量 */
  filteredCount: number;
  /** 移除的策略数量 */
  removedCount: number;
  /** 发现的相似策略对数 */
  similarPairsCount: number;
  /** 发现的冲突数量 */
  conflictsCount: number;
  /** 验证质量评分 */
  qualityScore: number;
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
  minConfidenceLevel: ConfidenceLevel;
}

/**
 * 默认唯一性校验配置
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
  minConfidenceLevel: 'medium'
};

/**
 * 策略唯一性校验器
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
    context: ElementContext
  ): Promise<UniquenessValidationResult> {
    try {
      // 1. 预过滤 - 移除低置信度策略
      const preFiltered = this.preFilterByConfidence(recommendations);

      // 2. 相似性分析
      const similarityAnalyses = await this.analyzeSimilarities(preFiltered);

      // 3. 冲突检测
      const conflictDetections = await this.detectConflicts(preFiltered, context);

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
          similarPairsCount: 0,
          conflictsCount: 0,
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
    const confidenceOrder: ConfidenceLevel[] = ['very-low', 'low', 'medium', 'high', 'very-high'];
    const minIndex = confidenceOrder.indexOf(this.config.minConfidenceLevel);

    return recommendations.filter(rec => {
      const recIndex = confidenceOrder.indexOf(rec.confidence);
      return recIndex >= minIndex;
    });
  }

  /**
   * 分析策略相似性
   */
  private async analyzeSimilarities(
    recommendations: StrategyRecommendation[]
  ): Promise<SimilarityAnalysis[]> {
    const analyses: SimilarityAnalysis[] = [];

    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const strategy1 = recommendations[i].strategy;
        const strategy2 = recommendations[j].strategy;
        
        const analysis = this.calculateSimilarity(strategy1, strategy2);
        if (analysis.similarity > 0.3) { // 只保留有意义的相似性分析
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
    strategy1: MatchingStrategy,
    strategy2: MatchingStrategy
  ): SimilarityAnalysis {
    // 1. 策略类型匹配
    const strategyTypeMatch = strategy1 === strategy2;
    let strategyTypeSimilarity = strategyTypeMatch ? 1.0 : 0.0;

    // 对于不同但相关的策略类型，给予部分相似度
    if (!strategyTypeMatch) {
      strategyTypeSimilarity = this.getStrategyCrossSimilarity(strategy1, strategy2);
    }

    // 2. 字段匹配分析（这里简化处理，实际应该根据具体的策略参数进行比较）
    const fieldMatches: Record<string, boolean> = {};
    const valueMatches: Record<string, number> = {};

    // 3. 参数相似度（简化计算）
    const parameterSimilarity = this.calculateParameterSimilarity(strategy1, strategy2);

    // 4. 预期效果相似度
    const expectedEffectSimilarity = this.calculateEffectSimilarity(strategy1, strategy2);

    // 5. 综合相似度计算
    const similarity = (
      strategyTypeSimilarity * 0.4 +
      parameterSimilarity * 0.3 +
      expectedEffectSimilarity * 0.3
    );

    // 6. 确定相似度类型
    const similarityType = this.determineSimilarityType(similarity);

    // 7. 生成建议
    const recommendation = this.generateSimilarityRecommendation(
      strategy1,
      strategy2,
      similarity,
      similarityType
    );

    return {
      strategies: [strategy1, strategy2],
      similarity,
      similarityType,
      details: {
        fieldMatches,
        valueMatches,
        strategyTypeMatch,
        parameterSimilarity,
        expectedEffectSimilarity
      },
      recommendation
    };
  }

  /**
   * 获取策略跨类型相似度
   */
  private getStrategyCrossSimilarity(
    strategy1: MatchingStrategy,
    strategy2: MatchingStrategy
  ): number {
    // 定义策略间的相似度矩阵
    const similarityMatrix: Record<MatchingStrategy, Record<MatchingStrategy, number>> = {
      'absolute': {
        'absolute': 1.0,
        'strict': 0.7,
        'relaxed': 0.4,
        'positionless': 0.2,
        'standard': 0.5,
        'custom': 0.3
      },
      'strict': {
        'absolute': 0.7,
        'strict': 1.0,
        'relaxed': 0.8,
        'positionless': 0.6,
        'standard': 0.9,
        'custom': 0.5
      },
      'relaxed': {
        'absolute': 0.4,
        'strict': 0.8,
        'relaxed': 1.0,
        'positionless': 0.7,
        'standard': 0.6,
        'custom': 0.6
      },
      'positionless': {
        'absolute': 0.2,
        'strict': 0.6,
        'relaxed': 0.7,
        'positionless': 1.0,
        'standard': 0.8,
        'custom': 0.4
      },
      'standard': {
        'absolute': 0.5,
        'strict': 0.9,
        'relaxed': 0.6,
        'positionless': 0.8,
        'standard': 1.0,
        'custom': 0.4
      },
      'custom': {
        'absolute': 0.3,
        'strict': 0.5,
        'relaxed': 0.6,
        'positionless': 0.4,
        'standard': 0.4,
        'custom': 1.0
      }
    };

    return similarityMatrix[strategy1]?.[strategy2] ?? 0.0;
  }

  /**
   * 计算参数相似度
   */
  private calculateParameterSimilarity(
    strategy1: MatchingStrategy,
    strategy2: MatchingStrategy
  ): number {
    // 这里简化处理，实际应该根据具体的策略参数进行详细比较
    // 例如比较字段选择、匹配条件等
    
    if (strategy1 === strategy2) {
      return 1.0;
    }

    // 基于策略特征的相似度
    const featureSimilarity = this.getStrategyCrossSimilarity(strategy1, strategy2);
    return featureSimilarity * 0.8; // 降低权重，因为参数可能不同
  }

  /**
   * 计算预期效果相似度
   */
  private calculateEffectSimilarity(
    strategy1: MatchingStrategy,
    strategy2: MatchingStrategy
  ): number {
    // 基于策略的预期匹配准确性和稳定性来计算效果相似度
    const effectMap: Record<MatchingStrategy, number> = {
      'absolute': 0.9,   // 高准确性，低稳定性
      'strict': 0.85,    // 高准确性，中等稳定性
      'standard': 0.8,   // 中等准确性，高稳定性
      'relaxed': 0.7,    // 中等准确性，中等稳定性
      'positionless': 0.75, // 中等准确性，高稳定性
      'custom': 0.6      // 可变准确性，可变稳定性
    };

    const effect1 = effectMap[strategy1] ?? 0.5;
    const effect2 = effectMap[strategy2] ?? 0.5;

    // 计算效果差异的相似度
    const difference = Math.abs(effect1 - effect2);
    return 1.0 - difference;
  }

  /**
   * 确定相似度类型
   */
  private determineSimilarityType(similarity: number): SimilarityType {
    const { identical, highlySimilar, moderatelySimilar } = this.config.similarityThresholds;

    if (similarity >= identical) return 'identical';
    if (similarity >= highlySimilar) return 'highly-similar';
    if (similarity >= moderatelySimilar) return 'moderately-similar';
    if (similarity >= 0.3) return 'low-similar';
    return 'different';
  }

  /**
   * 生成相似性建议
   */
  private generateSimilarityRecommendation(
    strategy1: MatchingStrategy,
    strategy2: MatchingStrategy,
    similarity: number,
    similarityType: SimilarityType
  ): SimilarityRecommendation {
    switch (similarityType) {
      case 'identical':
        return {
          type: 'merge',
          reason: '策略完全相同，应该合并以避免重复',
          preferredStrategy: strategy1,
          actions: ['移除重复策略', '保留单一实例']
        };

      case 'highly-similar':
        return {
          type: 'prioritize',
          reason: '策略高度相似，建议优先选择更稳定的策略',
          preferredStrategy: this.selectPreferredStrategy(strategy1, strategy2),
          actions: ['选择优先策略', '可考虑保留备选']
        };

      case 'moderately-similar':
        return {
          type: 'differentiate',
          reason: '策略中度相似，建议明确差异化应用场景',
          actions: ['明确各自适用场景', '保持策略差异性']
        };

      default:
        return {
          type: 'keep-both',
          reason: '策略差异明显，可以并存',
          actions: ['保持两个策略', '根据具体场景选择']
        };
    }
  }

  /**
   * 选择优先策略
   */
  private selectPreferredStrategy(
    strategy1: MatchingStrategy,
    strategy2: MatchingStrategy
  ): MatchingStrategy {
    // 策略优先级排序（基于稳定性和通用性）
    const priorityOrder: MatchingStrategy[] = [
      'standard',    // 最佳平衡
      'strict',      // 高准确性
      'positionless', // 高稳定性
      'relaxed',     // 中等平衡
      'absolute',    // 高精度但不稳定
      'custom'       // 最低优先级
    ];

    const index1 = priorityOrder.indexOf(strategy1);
    const index2 = priorityOrder.indexOf(strategy2);

    return index1 <= index2 ? strategy1 : strategy2;
  }

  /**
   * 检测策略冲突
   */
  private async detectConflicts(
    recommendations: StrategyRecommendation[],
    context: ElementContext
  ): Promise<ConflictDetection[]> {
    if (!this.config.enableConflictDetection) {
      return [];
    }

    const conflicts: ConflictDetection[] = [];

    // 检测互斥策略
    const mutuallyExclusiveConflicts = this.detectMutuallyExclusiveStrategies(recommendations);
    conflicts.push(...mutuallyExclusiveConflicts);

    // 检测性能影响冲突
    const performanceConflicts = this.detectPerformanceConflicts(recommendations);
    conflicts.push(...performanceConflicts);

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

    // 定义互斥策略组
    const mutuallyExclusiveGroups: MatchingStrategy[][] = [
      ['absolute', 'positionless'], // 绝对定位与无位置策略互斥
      // 可以添加更多互斥组
    ];

    for (const group of mutuallyExclusiveGroups) {
      const conflictingRecs = recommendations.filter(rec => 
        group.includes(rec.strategy)
      );

      if (conflictingRecs.length > 1) {
        conflicts.push({
          hasConflict: true,
          conflictType: 'mutually-exclusive',
          conflictingStrategies: conflictingRecs.map(rec => rec.strategy),
          details: {
            description: `策略 ${group.join('、')} 之间互斥`,
            affectedFields: ['strategy'],
            severity: 'high',
            potentialConsequences: ['可能导致匹配失败', '影响系统稳定性']
          },
          resolutionSuggestion: {
            strategy: 'prioritize-one',
            steps: ['选择最适合当前场景的策略', '移除其他冲突策略'],
            expectedOutcome: '消除策略冲突，提高匹配成功率'
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * 检测性能影响冲突
   */
  private detectPerformanceConflicts(
    recommendations: StrategyRecommendation[]
  ): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];

    // 检测是否存在过多的计算密集型策略
    const intensiveStrategies = recommendations.filter(rec => 
      ['absolute', 'strict'].includes(rec.strategy)
    );

    if (intensiveStrategies.length > 3) {
      conflicts.push({
        hasConflict: true,
        conflictType: 'performance-impact',
        conflictingStrategies: intensiveStrategies.map(rec => rec.strategy),
        details: {
          description: '过多的计算密集型策略可能影响性能',
          affectedFields: ['performance'],
          severity: 'medium',
          potentialConsequences: ['增加匹配耗时', '影响用户体验']
        },
        resolutionSuggestion: {
          strategy: 'prioritize-one',
          steps: ['选择1-2个最重要的精确策略', '用更高效的策略替代其他'],
          expectedOutcome: '在准确性和性能间取得平衡'
        }
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
    const strategyCount = new Map<MatchingStrategy, number>();
    recommendations.forEach(rec => {
      strategyCount.set(rec.strategy, (strategyCount.get(rec.strategy) || 0) + 1);
    });

    for (const [strategy, count] of strategyCount) {
      if (count > 1) {
        conflicts.push({
          hasConflict: true,
          conflictType: 'redundant',
          conflictingStrategies: [strategy],
          details: {
            description: `策略 ${strategy} 存在 ${count} 个重复推荐`,
            affectedFields: ['strategy'],
            severity: 'low',
            potentialConsequences: ['资源浪费', '选择困难']
          },
          resolutionSuggestion: {
            strategy: 'remove-conflict',
            steps: ['保留最佳实例', '移除重复推荐'],
            expectedOutcome: '简化策略选择，提高清晰度'
          }
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

    // 1. 处理相似性
    if (this.config.autoMergeSimilar) {
      filtered = this.mergeSimilarStrategies(filtered, similarityAnalyses);
    }

    // 2. 解决冲突
    filtered = this.resolveConflicts(filtered, conflictDetections);

    // 3. 限制数量
    if (filtered.length > this.config.maxRecommendations) {
      filtered = filtered
        .sort((a, b) => this.compareRecommendations(a, b))
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
    const toRemove = new Set<MatchingStrategy>();

    for (const analysis of similarityAnalyses) {
      if (analysis.recommendation.type === 'merge' || 
          analysis.recommendation.type === 'prioritize') {
        
        const [strategy1, strategy2] = analysis.strategies;
        const preferred = analysis.recommendation.preferredStrategy || strategy1;
        const toRemoveStrategy = preferred === strategy1 ? strategy2 : strategy1;
        
        toRemove.add(toRemoveStrategy);
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
        switch (conflict.resolutionSuggestion.strategy) {
          case 'prioritize-one':
            // 保留最佳策略，移除其他冲突策略
            const bestStrategy = this.selectBestFromConflicting(
              conflict.conflictingStrategies,
              filtered
            );
            filtered = filtered.filter(rec => 
              !conflict.conflictingStrategies.includes(rec.strategy) || 
              rec.strategy === bestStrategy
            );
            break;

          case 'remove-conflict':
            // 移除所有冲突策略
            filtered = filtered.filter(rec => 
              !conflict.conflictingStrategies.includes(rec.strategy)
            );
            break;

          // 其他解决策略可以在这里添加
        }
      }
    }

    return filtered;
  }

  /**
   * 从冲突策略中选择最佳策略
   */
  private selectBestFromConflicting(
    conflictingStrategies: MatchingStrategy[],
    recommendations: StrategyRecommendation[]
  ): MatchingStrategy {
    const conflictingRecs = recommendations.filter(rec => 
      conflictingStrategies.includes(rec.strategy)
    );

    if (conflictingRecs.length === 0) {
      return conflictingStrategies[0];
    }

    // 按推荐质量排序，选择最佳
    conflictingRecs.sort((a, b) => this.compareRecommendations(a, b));
    return conflictingRecs[0].strategy;
  }

  /**
   * 比较推荐策略的质量
   */
  private compareRecommendations(
    a: StrategyRecommendation,
    b: StrategyRecommendation
  ): number {
    // 置信度权重
    const confidenceOrder: ConfidenceLevel[] = ['very-low', 'low', 'medium', 'high', 'very-high'];
    const confidenceA = confidenceOrder.indexOf(a.confidence);
    const confidenceB = confidenceOrder.indexOf(b.confidence);

    if (confidenceA !== confidenceB) {
      return confidenceB - confidenceA; // 高置信度优先
    }

    // 策略优先级权重
    const strategyPriority: Record<MatchingStrategy, number> = {
      'standard': 5,
      'strict': 4,
      'positionless': 3,
      'relaxed': 2,
      'absolute': 1,
      'custom': 0
    };

    const priorityA = strategyPriority[a.strategy] || 0;
    const priorityB = strategyPriority[b.strategy] || 0;

    return priorityB - priorityA; // 高优先级优先
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

    const summary: ValidationSummary = {
      originalCount,
      filteredCount,
      removedCount,
      similarPairsCount: similarityAnalyses.length,
      conflictsCount: conflictDetections.filter(c => c.hasConflict).length,
      qualityScore
    };

    return {
      isValid: conflictDetections.every(c => !c.hasConflict || c.details.severity !== 'critical'),
      filteredStrategies,
      similarityAnalyses,
      conflictDetections,
      summary,
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
      c.hasConflict && c.details.severity === 'critical'
    ).length;
    const highConflicts = conflictDetections.filter(c => 
      c.hasConflict && c.details.severity === 'high'
    ).length;
    const mediumConflicts = conflictDetections.filter(c => 
      c.hasConflict && c.details.severity === 'medium'
    ).length;

    score -= criticalConflicts * 30;
    score -= highConflicts * 20;
    score -= mediumConflicts * 10;

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
      c.hasConflict && c.details.severity === 'critical'
    );
    if (criticalConflicts.length > 0) {
      recommendations.push('检测到严重冲突，建议手动检查策略配置');
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
  context: ElementContext,
  config?: Partial<UniquenessValidatorConfig>
): Promise<UniquenessValidationResult> {
  const validator = createUniquenessValidator(config);
  return validator.validateUniqueness(recommendations, context);
}

export default UniquenessValidator;