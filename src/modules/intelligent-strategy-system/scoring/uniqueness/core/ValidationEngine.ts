/**
 * 验证引擎 - 统一的唯一性验证核心
 * 整合 SimilarityAnalyzer 和 ConflictDetector，提供完整的策略验证功能
 * 替代重复的 UniquenessValidator 实现
 */

import { StrategyRecommendation } from '../../../types/StrategyTypes';  
import { 
  UniquenessValidationResult,
  UniquenessValidatorConfig,
  DEFAULT_UNIQUENESS_CONFIG,
  ElementContext
} from '../types';
import { SimilarityAnalyzer } from './SimilarityAnalyzer';
import { ConflictDetector } from './ConflictDetector';

/**
 * 统一验证引擎
 * 核心功能：策略去重、相似性分析、冲突检测、质量评估
 */
export class ValidationEngine {
  private similarityAnalyzer: SimilarityAnalyzer;
  private conflictDetector: ConflictDetector;
  private config: UniquenessValidatorConfig;

  constructor(config: Partial<UniquenessValidatorConfig> = {}) {
    this.config = { ...DEFAULT_UNIQUENESS_CONFIG, ...config };
    this.similarityAnalyzer = new SimilarityAnalyzer(this.config);
    this.conflictDetector = new ConflictDetector(this.config);
  }

  /**
   * 验证策略列表的唯一性和质量
   * 
   * @param strategies 待验证的策略推荐列表
   * @param context 元素上下文（可选，用于高级验证）
   * @returns 完整的验证结果
   */
  validateUniqueness(
    strategies: StrategyRecommendation[], 
    context?: ElementContext
  ): UniquenessValidationResult {
    
    const originalCount = strategies.length;
    
    // 第一步：基础过滤（置信度、评分）
    let filteredStrategies = this.performBasicFiltering(strategies);
    
    // 第二步：相似性分析和合并
    const similarityAnalyses = this.similarityAnalyzer.analyzeAllSimilarities(filteredStrategies);
    if (this.config.autoMergeSimilar) {
      filteredStrategies = this.mergeSimilarStrategies(filteredStrategies, similarityAnalyses);
    }
    
    // 第三步：冲突检测和解决
    const conflictDetections = this.conflictDetector.detectAllConflicts(filteredStrategies);
    filteredStrategies = this.resolveConflicts(filteredStrategies, conflictDetections);
    
    // 第四步：最终限制和排序
    filteredStrategies = this.applyFinalLimitations(filteredStrategies);
    
    // 计算质量评分
    const qualityScore = this.calculateQualityScore(
      filteredStrategies, 
      similarityAnalyses, 
      conflictDetections
    );
    
    // 生成建议
    const recommendations = this.generateRecommendations(
      originalCount,
      filteredStrategies.length,
      similarityAnalyses,
      conflictDetections
    );

    return {
      isValid: filteredStrategies.length > 0 && qualityScore >= this.config.minConfidence,
      filteredStrategies,
      similarityAnalyses,
      conflictDetections,
      summary: {
        originalCount,
        filteredCount: filteredStrategies.length,
        removedCount: originalCount - filteredStrategies.length,
        similarPairsCount: similarityAnalyses.length,
        conflictsCount: conflictDetections.filter(c => c.hasConflict).length,
        qualityScore
      },
      recommendations
    };
  }

  /**
   * 快速验证（性能优化版本）
   */
  validateUniquenessQuick(strategies: StrategyRecommendation[]): UniquenessValidationResult {
    // 简化版本，跳过详细分析
    const quickConfig = { 
      ...this.config, 
      advanced: { 
        ...this.config.advanced, 
        enableDetailedAnalysis: false,
        performanceMode: 'fast' as const
      }
    };
    
    const quickEngine = new ValidationEngine(quickConfig);
    return quickEngine.validateUniqueness(strategies);
  }

  /**
   * 执行基础过滤
   */
  private performBasicFiltering(strategies: StrategyRecommendation[]): StrategyRecommendation[] {
    return strategies.filter(strategy => {
      // 置信度过滤
      if (strategy.confidence < this.config.minConfidence) {
        return false;
      }
      
      // 评分过滤（可选）
      if (strategy.score < 20) { // 最低评分阈值
        return false;
      }
      
      return true;
    });
  }

  /**
   * 合并相似策略
   */
  private mergeSimilarStrategies(
    strategies: StrategyRecommendation[], 
    analyses: import('../types').SimilarityAnalysis[]
  ): StrategyRecommendation[] {
    const toRemove = new Set<number>();
    
    for (const analysis of analyses) {
      if (analysis.recommendation === 'merge' || 
          (analysis.recommendation === 'prioritize' && analysis.similarity > 0.9)) {
        
        // 找到要合并的策略
        const indices = strategies.map((s, i) => 
          analysis.strategies.includes(s.strategy) ? i : -1
        ).filter(i => i >= 0);
        
        if (indices.length >= 2) {
          // 保留评分最高的，移除其他的
          const bestIndex = indices.reduce((best, current) =>
            strategies[current].score > strategies[best].score ? current : best
          );
          
          for (const index of indices) {
            if (index !== bestIndex) {
              toRemove.add(index);
            }
          }
        }
      }
    }
    
    return strategies.filter((_, index) => !toRemove.has(index));
  }

  /**
   * 解决冲突
   */
  private resolveConflicts(
    strategies: StrategyRecommendation[], 
    conflicts: import('../types').ConflictDetection[]
  ): StrategyRecommendation[] {
    let result = [...strategies];
    
    for (const conflict of conflicts) {
      if (!conflict.hasConflict || !conflict.resolution) continue;
      
      switch (conflict.resolution.strategy) {
        case 'remove-conflict':
          result = this.removeConflictingStrategies(result, conflict.conflictingStrategies);
          break;
        case 'prioritize-one':
          result = this.prioritizeOneStrategy(result, conflict.conflictingStrategies);
          break;
        case 'modify-parameters':
          // 暂时跳过参数修改，保持策略不变
          break;
      }
    }
    
    return result;
  }

  /**
   * 移除冲突策略
   */
  private removeConflictingStrategies(
    strategies: StrategyRecommendation[], 
    conflictingTypes: import('../../../types/StrategyTypes').MatchStrategy[]
  ): StrategyRecommendation[] {
    // 移除评分较低的冲突策略
    const conflictingStrategies = strategies.filter(s => 
      conflictingTypes.includes(s.strategy)
    );
    
    if (conflictingStrategies.length <= 1) return strategies;
    
    // 保留评分最高的一个
    const bestStrategy = conflictingStrategies.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    
    return strategies.filter(s => 
      !conflictingTypes.includes(s.strategy) || s === bestStrategy
    );
  }

  /**
   * 优先选择一个策略
   */
  private prioritizeOneStrategy(
    strategies: StrategyRecommendation[], 
    conflictingTypes: import('../../../types/StrategyTypes').MatchStrategy[]
  ): StrategyRecommendation[] {
    return this.removeConflictingStrategies(strategies, conflictingTypes);
  }

  /**
   * 应用最终限制
   */
  private applyFinalLimitations(strategies: StrategyRecommendation[]): StrategyRecommendation[] {
    // 按评分排序
    const sorted = strategies.sort((a, b) => b.score - a.score);
    
    // 限制最大数量
    return sorted.slice(0, this.config.maxRecommendations);
  }

  /**
   * 计算质量评分
   */
  private calculateQualityScore(
    strategies: StrategyRecommendation[],
    similarities: import('../types').SimilarityAnalysis[],
    conflicts: import('../types').ConflictDetection[]
  ): number {
    if (strategies.length === 0) return 0;
    
    // 基础评分：策略平均分
    const avgScore = strategies.reduce((sum, s) => sum + s.score, 0) / strategies.length;
    let qualityScore = avgScore / 100; // 转换为 0-1 范围
    
    // 扣分：高相似度策略过多
    const highSimilarityCount = similarities.filter(s => s.similarity > 0.8).length;
    qualityScore -= highSimilarityCount * 0.1;
    
    // 扣分：冲突未解决
    const unresolvedConflicts = conflicts.filter(c => c.hasConflict).length;
    qualityScore -= unresolvedConflicts * 0.15;
    
    // 加分：策略多样性
    const uniqueTypes = new Set(strategies.map(s => s.strategy)).size;
    const diversityBonus = (uniqueTypes / strategies.length) * 0.2;
    qualityScore += diversityBonus;
    
    return Math.max(0, Math.min(1, qualityScore));
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(
    originalCount: number,
    filteredCount: number,
    similarities: import('../types').SimilarityAnalysis[],
    conflicts: import('../types').ConflictDetection[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (originalCount > filteredCount) {
      recommendations.push(`已过滤 ${originalCount - filteredCount} 个低质量策略`);
    }
    
    const highSimilarities = similarities.filter(s => s.similarity > 0.8);
    if (highSimilarities.length > 0) {
      recommendations.push(`发现 ${highSimilarities.length} 对高相似度策略，建议进一步优化`);
    }
    
    const activeConflicts = conflicts.filter(c => c.hasConflict);
    if (activeConflicts.length > 0) {
      recommendations.push(`检测到 ${activeConflicts.length} 个策略冲突，已自动解决`);
    }
    
    if (filteredCount < 2) {
      recommendations.push('策略数量较少，建议增加更多候选策略');
    } else if (filteredCount > 5) {
      recommendations.push('策略数量较多，建议进一步精简以提高性能');
    }
    
    return recommendations;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UniquenessValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.similarityAnalyzer.updateConfig(this.config);
    this.conflictDetector.updateConfig(this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): UniquenessValidatorConfig {
    return { ...this.config };
  }
}