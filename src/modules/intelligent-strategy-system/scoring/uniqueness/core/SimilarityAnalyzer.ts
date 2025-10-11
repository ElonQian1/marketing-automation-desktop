// src/modules/intelligent-strategy-system/scoring/uniqueness/core/SimilarityAnalyzer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 相似性分析器 - 统一的策略相似度计算核心
 * 提取自重复的 UniquenessValidator 实现，消除代码重复
 */

import { MatchStrategy, StrategyRecommendation } from '../../../types/StrategyTypes';  
import { 
  SimilarityAnalysis, 
  SimilarityType, 
  UniquenessValidatorConfig,
  DEFAULT_UNIQUENESS_CONFIG 
} from '../types';

/**
 * 相似性分析器
 * 负责计算策略之间的相似度和提供合并建议
 */
export class SimilarityAnalyzer {
  private config: UniquenessValidatorConfig;

  constructor(config: Partial<UniquenessValidatorConfig> = {}) {
    this.config = { ...DEFAULT_UNIQUENESS_CONFIG, ...config };
  }

  /**
   * 分析两个策略的相似性
   */
  analyzeSimilarity(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): SimilarityAnalysis {
    const similarity = this.calculateSimilarity(strategy1, strategy2);
    const similarityType = this.classifySimilarity(similarity);
    
    return {
      strategies: [strategy1.strategy, strategy2.strategy],
      similarity,
      similarityType,
      recommendation: this.getRecommendation(similarityType, similarity),
      details: this.config.advanced?.enableDetailedAnalysis 
        ? this.createDetailedAnalysis(strategy1, strategy2)
        : undefined
    };
  }

  /**
   * 批量分析策略相似性
   */
  analyzeAllSimilarities(strategies: StrategyRecommendation[]): SimilarityAnalysis[] {
    const analyses: SimilarityAnalysis[] = [];
    
    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const analysis = this.analyzeSimilarity(
          strategies[i], 
          strategies[j]
        );
        
        // 只保留有意义的相似性分析（中度以上相似度）
        if (analysis.similarity >= this.config.similarityThresholds.moderatelySimilar) {
          analyses.push(analysis);
        }
      }
    }
    
    return analyses;
  }

  /**
   * 计算两个策略的相似度分数 (0-1)
   */
  private calculateSimilarity(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): number {
    let totalScore = 0;
    let totalWeight = 0;

    // 1. 策略类型匹配 (权重: 0.4)
    const typeWeight = 0.4;
    const typeScore = strategy1.strategy === strategy2.strategy ? 1.0 : 0.0;
    totalScore += typeScore * typeWeight;
    totalWeight += typeWeight;

    // 2. 推荐评分相似度 (权重: 0.3)  
    const scoreWeight = 0.3;
    const scoreScore = this.calculateScoreSimilarity(strategy1, strategy2);
    totalScore += scoreScore * scoreWeight;
    totalWeight += scoreWeight;

    // 3. 置信度相似度 (权重: 0.2)
    const confidenceWeight = 0.2;
    const confidenceScore = this.calculateConfidenceSimilarity(strategy1, strategy2);
    totalScore += confidenceScore * confidenceWeight;
    totalWeight += confidenceWeight;

    // 4. 原因相似度 (权重: 0.1)
    const reasonWeight = 0.1;
    const reasonScore = this.calculateReasonSimilarity(strategy1, strategy2);
    totalScore += reasonScore * reasonWeight;
    totalWeight += reasonWeight;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * 计算推荐评分相似度
   */
  private calculateScoreSimilarity(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): number {
    const score1 = strategy1.score || 0;
    const score2 = strategy2.score || 0;
    
    if (score1 === 0 && score2 === 0) return 1.0;
    
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);
    
    return maxScore > 0 ? minScore / maxScore : 0.0;
  }

  /**
   * 计算置信度相似度
   */
  private calculateConfidenceSimilarity(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): number {
    const conf1 = strategy1.confidence || 0;
    const conf2 = strategy2.confidence || 0;
    
    if (conf1 === 0 && conf2 === 0) return 1.0;
    
    const maxConf = Math.max(conf1, conf2);
    const minConf = Math.min(conf1, conf2);
    
    return maxConf > 0 ? minConf / maxConf : 0.0;
  }

  /**
   * 计算推荐理由相似度
   */
  private calculateReasonSimilarity(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): number {
    const reason1 = strategy1.reason || '';
    const reason2 = strategy2.reason || '';
    
    if (!reason1 && !reason2) return 1.0;
    if (!reason1 || !reason2) return 0.5;
    
    // 简单的字符串相似度计算
    const words1 = new Set(reason1.toLowerCase().split(/\s+/));
    const words2 = new Set(reason2.toLowerCase().split(/\s+/));
    
    const words1Array = Array.from(words1);
    const words2Array = Array.from(words2);
    const intersection = new Set(words1Array.filter(x => words2.has(x)));
    const union = new Set([...words1Array, ...words2Array]);
    
    return union.size > 0 ? intersection.size / union.size : 0.0;
  }

  /**
   * 分类相似度类型
   */
  private classifySimilarity(similarity: number): SimilarityType {
    const thresholds = this.config.similarityThresholds;
    
    if (similarity >= thresholds.identical) return 'identical';
    if (similarity >= thresholds.highlySimilar) return 'highly-similar';
    if (similarity >= thresholds.moderatelySimilar) return 'moderately-similar';
    if (similarity >= 0.3) return 'low-similar';
    return 'different';
  }

  /**
   * 获取推荐操作
   */
  private getRecommendation(
    similarityType: SimilarityType, 
    similarity: number
  ): 'merge' | 'prioritize' | 'keep-both' | 'remove-weaker' {
    switch (similarityType) {
      case 'identical':
        return 'merge';
      case 'highly-similar':
        return this.config.autoMergeSimilar ? 'merge' : 'prioritize';
      case 'moderately-similar':
        return 'prioritize';
      case 'low-similar':
        return 'keep-both';
      default:
        return 'keep-both';
    }
  }

  /**
   * 创建详细分析结果
   */
  private createDetailedAnalysis(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation) {
    return {
      fieldMatches: this.getFieldMatches(strategy1, strategy2),
      valueMatches: this.getValueMatches(strategy1, strategy2),
      strategyTypeMatch: strategy1.strategy === strategy2.strategy,
      parameterSimilarity: this.calculateScoreSimilarity(strategy1, strategy2)
    };
  }

  /**
   * 获取字段匹配详情 (基于策略类型)
   */
  private getFieldMatches(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): Record<string, boolean> {
    // 简化版：基于策略类型和标签的匹配
    const tags1 = new Set(strategy1.tags || []);
    const tags2 = new Set(strategy2.tags || []);
    const tags1Array = Array.from(tags1);
    const tags2Array = Array.from(tags2);
    const allTags = new Set([...tags1Array, ...tags2Array]);
    
    const matches: Record<string, boolean> = {};
    const allTagsArray = Array.from(allTags);
    for (const tag of allTagsArray) {
      matches[String(tag)] = tags1.has(tag) && tags2.has(tag);
    }
    
    return matches;
  }

  /**
   * 获取值匹配详情 (基于性能指标)
   */
  private getValueMatches(strategy1: StrategyRecommendation, strategy2: StrategyRecommendation): Record<string, number> {
    const matches: Record<string, number> = {};
    
    // 比较性能指标
    if (strategy1.performance && strategy2.performance) {
      matches['speed'] = strategy1.performance.speed === strategy2.performance.speed ? 1.0 : 0.0;
      matches['stability'] = strategy1.performance.stability === strategy2.performance.stability ? 1.0 : 0.0;
      matches['crossDevice'] = strategy1.performance.crossDevice === strategy2.performance.crossDevice ? 1.0 : 0.0;
    }
    
    return matches;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UniquenessValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}