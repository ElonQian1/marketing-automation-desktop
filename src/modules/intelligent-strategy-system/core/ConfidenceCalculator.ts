// src/modules/intelligent-strategy-system/core/ConfidenceCalculator.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * ConfidenceCalculator.ts
 * 置信度计算器
 * 
 * @description 负责计算策略候选项的置信度和评分
 */

import type { 
  StrategyCandidate,
  MatchStrategy
} from '../types/StrategyTypes';

import type {
  ElementAnalysisContext,
  ElementNode,
  NodeHierarchyInfo
} from '../types/AnalysisTypes';

/**
 * 置信度计算器
 * 
 * 职责：
 * 1. 计算策略候选项的综合评分
 * 2. 基于多维度因素评估置信度
 * 3. 提供评分权重配置
 */
export class ConfidenceCalculator {
  
  // 评分权重配置（基于文档描述）
  private readonly scoreWeights = {
    uniqueness: {
      idUnique: 100,           // ID唯一性: +100分
      descUnique: 95,          // content-desc唯一: +95分  
      textEqual: 70,           // 文本等值匹配: +70分
      regionScoped: 30,        // 区域限定: +30分
      structuralStability: 20, // 结构稳定性: +20~40分
      localIndex: -15,         // 局部索引: -15分
      globalIndex: -60         // 全局索引: -60分
    },
    performance: {
      fast: 20,               // 快速执行加分
      medium: 10,             // 中等速度
      slow: -10               // 慢速执行扣分
    },
    stability: {
      high: 25,               // 高稳定性加分
      medium: 10,             // 中等稳定性  
      low: -15                // 低稳定性扣分
    },
    complexity: {
      simple: 15,             // 简单策略加分
      medium: 5,              // 中等复杂度
      complex: -10            // 复杂策略扣分
    }
  };

  /**
   * 计算策略候选项的综合评分
   * @param candidate 策略候选项
   * @param context 分析上下文
   * @returns 综合评分（0-100）
   */
  async calculateCandidateScore(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext
  ): Promise<number> {
    try {
      let totalScore = 0;
      
      // 1. 基础策略评分
      totalScore += this.calculateBaseScore(candidate.strategy);
      
      // 2. 唯一性评分
      totalScore += await this.calculateUniquenessScore(candidate, context);
      
      // 3. 性能评分
      totalScore += this.calculatePerformanceScore(candidate);
      
      // 4. 稳定性评分
      totalScore += this.calculateStabilityScore(candidate, context);
      
      // 5. 复杂度评分
      totalScore += this.calculateComplexityScore(candidate);
      
      // 6. 上下文适配评分
      totalScore += this.calculateContextScore(candidate, context);
      
      // 确保评分在合理范围内
      const finalScore = Math.max(0, Math.min(100, totalScore));
      
      console.log(`策略 ${candidate.strategy} 综合评分: ${finalScore}`);
      return finalScore;
      
    } catch (error) {
      console.error('评分计算失败:', error);
      return 30; // 返回默认低分
    }
  }

  /**
   * 计算基础策略评分
   */
  private calculateBaseScore(strategy: MatchStrategy): number {
    const baseScores: Record<MatchStrategy, number> = {
      'standard': 60,           // 标准匹配：平衡性好
      'strict': 55,             // 严格匹配：精确但可能脆弱
      'relaxed': 45,            // 宽松匹配：兼容性好但可能不准确
      'positionless': 50,       // 无位置：跨设备友好
      'absolute': 40,           // 绝对定位：精确但脆弱
      'custom': 35,             // 自定义：不确定性高
      'xpath-direct': 65,       // XPath直接：快速且准确
      'xpath-first-index': 55,  // XPath索引：较好的平衡
      'xpath-all-elements': 45, // XPath全部：批量但复杂
      'hidden-element-parent': 50, // 隐藏元素：特殊场景
      'intelligent': 80,        // 智能匹配：多策略级联，最智能
      'a11y': 65,              // 无障碍匹配：文本描述稳定
      'bounds_near': 55,       // 邻域匹配：坐标范围中等稳定
      'xpath_fuzzy': 60,       // XPath模糊：较为灵活
      'self-anchor': 75,        // 自我锚点：最稳定
      'child-anchor': 70,       // 子锚点：很稳定
      'parent-clickable': 65,   // 父可点击：稳定
      'region-scoped': 60,      // 区域限定：较稳定
      'neighbor-relative': 55,  // 邻居相对：中等稳定
      'index-fallback': 30      // 索引兜底：最不稳定
    };

    return baseScores[strategy] || 40;
  }

  /**
   * 计算唯一性评分
   */
  private async calculateUniquenessScore(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext
  ): Promise<number> {
    let score = 0;
    const criteria = candidate.criteria;
    const element = context.targetElement;
    
    // 检查resource-id唯一性
    if (criteria.fields.includes('resource-id') || criteria.fields.includes('resource_id')) {
      const resourceId = element.attributes['resource-id'];
      if (resourceId) {
        const duplicateCount = context.document.statistics.duplicateIds[resourceId] || 1;
        if (duplicateCount === 1) {
          score += this.scoreWeights.uniqueness.idUnique;
        } else {
          score += this.scoreWeights.uniqueness.idUnique / duplicateCount;
        }
      }
    }

    // 检查content-desc唯一性
    if (criteria.fields.includes('content-desc') || criteria.fields.includes('content_desc')) {
      const contentDesc = element.attributes['content-desc'];
      if (contentDesc) {
        const isUnique = this.isContentDescUnique(contentDesc, context);
        if (isUnique) {
          score += this.scoreWeights.uniqueness.descUnique;
        } else {
          score += this.scoreWeights.uniqueness.descUnique * 0.5;
        }
      }
    }

    // 检查文本唯一性
    if (criteria.fields.includes('text')) {
      const text = element.text;
      if (text && text.trim()) {
        const duplicateCount = context.document.statistics.duplicateTexts[text] || 1;
        if (duplicateCount === 1) {
          score += this.scoreWeights.uniqueness.textEqual;
        } else {
          score += this.scoreWeights.uniqueness.textEqual / duplicateCount;
        }
      }
    }

    // 区域限定加分
    if (candidate.strategy === 'region-scoped' || 
        context.hierarchy.stableContainerAncestor) {
      score += this.scoreWeights.uniqueness.regionScoped;
    }

    // 结构稳定性评分
    const structuralScore = this.assessStructuralStability(candidate, context);
    score += structuralScore;

    // 索引使用的扣分
    if (candidate.strategy.includes('index') || criteria.xpath?.includes('[')) {
      if (candidate.strategy === 'index-fallback') {
        score += this.scoreWeights.uniqueness.globalIndex;
      } else {
        score += this.scoreWeights.uniqueness.localIndex;
        // 局部索引加校验补偿
        if (candidate.validation.passed) {
          score += 10; // 校验补偿
        }
      }
    }

    return score;
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(candidate: StrategyCandidate): number {
    const estimatedSpeed = candidate.metadata?.complexity || 'medium';
    // 基于复杂度估算性能
    const speedMap = {
      'simple': 'fast',
      'medium': 'medium', 
      'complex': 'slow'
    } as const;
    const speed = speedMap[estimatedSpeed] || 'medium';
    return this.scoreWeights.performance[speed] || 0;
  }

  /**
   * 计算稳定性评分
   */
  private calculateStabilityScore(
    candidate: StrategyCandidate, 
    context: ElementAnalysisContext
  ): number {
    let score = 0;
    
    // 基于策略的稳定性 - 根据策略类型推断稳定性
    let crossDeviceStability: 'high' | 'medium' | 'low' = 'medium';
    const stableStrategies = ['self-anchor', 'child-anchor', 'standard', 'positionless'];
    const unstableStrategies = ['absolute', 'index-fallback', 'custom'];
    
    if (stableStrategies.includes(candidate.strategy)) {
      crossDeviceStability = 'high';
    } else if (unstableStrategies.includes(candidate.strategy)) {
      crossDeviceStability = 'low';
    }
    
    score += this.scoreWeights.stability[crossDeviceStability] || 0;
    
    // 基于元素特征的稳定性
    const element = context.targetElement;
    
    // 有稳定ID的元素加分
    if (element.attributes['resource-id'] && 
        !element.attributes['resource-id'].includes('generated')) {
      score += 15;
    }
    
    // 有意义文本的元素加分
    if (element.text && element.text.length > 2 && 
        !/^\d+$/.test(element.text)) {
      score += 10;
    }
    
    // 可点击元素加分
    if (element.clickable) {
      score += 8;
    }
    
    // 稳定容器内的元素加分
    if (context.hierarchy.stableContainerAncestor) {
      score += 12;
    }
    
    return score;
  }

  /**
   * 计算复杂度评分
   */
  private calculateComplexityScore(candidate: StrategyCandidate): number {
    let complexity: keyof typeof this.scoreWeights.complexity = 'medium';
    
    // 基于策略复杂度
    const simpleStrategies = ['self-anchor', 'xpath-direct', 'standard'];
    const complexStrategies = ['neighbor-relative', 'hidden-element-parent', 'custom'];
    
    if (simpleStrategies.includes(candidate.strategy)) {
      complexity = 'simple';
    } else if (complexStrategies.includes(candidate.strategy)) {
      complexity = 'complex';
    }
    
    // 基于匹配条件复杂度
    const criteria = candidate.criteria;
    const fieldCount = criteria.fields.length;
    const hasIncludes = criteria.includes && Object.keys(criteria.includes).length > 0;
    const hasExcludes = criteria.excludes && Object.keys(criteria.excludes).length > 0;
    
    if (fieldCount > 3 || hasIncludes || hasExcludes) {
      complexity = 'complex';
    } else if (fieldCount === 1) {
      complexity = 'simple';
    }
    
    return this.scoreWeights.complexity[complexity];
  }

  /**
   * 计算上下文适配评分
   */
  private calculateContextScore(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext
  ): number {
    let score = 0;
    const element = context.targetElement;
    const hierarchy = context.hierarchy;
    
    // 基于元素类型的适配性
    if (element.tag === 'Button' || element.tag === 'ImageButton') {
      if (candidate.strategy === 'self-anchor' || candidate.strategy === 'strict') {
        score += 10; // 按钮元素适合精确匹配
      }
    }
    
    if (element.tag === 'TextView') {
      if (candidate.strategy === 'positionless' || candidate.strategy === 'standard') {
        score += 8; // 文本元素适合无位置匹配
      }
    }
    
    // 基于层级深度的适配性
    if (hierarchy.depth > 5) {
      if (candidate.strategy === 'region-scoped' || candidate.strategy === 'parent-clickable') {
        score += 12; // 深层元素适合区域限定
      }
    } else {
      if (candidate.strategy === 'self-anchor') {
        score += 8; // 浅层元素适合自我锚定
      }
    }
    
    // 基于兄弟节点数量的适配性
    if (hierarchy.siblings.length > 5) {
      if (candidate.strategy === 'xpath-first-index' || candidate.strategy === 'child-anchor') {
        score += 10; // 多兄弟节点适合索引或子锚点
      }
    }
    
    // 基于应用类型的适配性
    const packageName = context.document.appInfo.packageName;
    if (packageName.includes('social') || packageName.includes('chat')) {
      if (candidate.strategy === 'standard' || candidate.strategy === 'positionless') {
        score += 5; // 社交应用适合标准匹配
      }
    }
    
    return score;
  }

  // === 辅助方法 ===

  /**
   * 检查content-desc是否唯一
   */
  private isContentDescUnique(contentDesc: string, context: ElementAnalysisContext): boolean {
    const matchingNodes = context.document.allNodes.filter(node => 
      node.attributes['content-desc'] === contentDesc
    );
    return matchingNodes.length === 1;
  }

  /**
   * 评估结构稳定性
   */
  private assessStructuralStability(
    candidate: StrategyCandidate,
    context: ElementAnalysisContext
  ): number {
    let score = 0;
    
    // 基于祖先节点的稳定性
    const stableAncestors = context.hierarchy.ancestors.filter(ancestor => 
      ancestor.attributes['resource-id'] && 
      !ancestor.attributes['resource-id'].includes('generated')
    );
    
    score += Math.min(stableAncestors.length * 5, 20);
    
    // 基于可点击父节点的存在
    if (context.hierarchy.nearestClickableParent) {
      score += 10;
    }
    
    // 基于稳定容器的存在
    if (context.hierarchy.stableContainerAncestor) {
      score += 15;
    }
    
    return Math.min(score, this.scoreWeights.uniqueness.structuralStability * 2);
  }

  /**
   * 计算策略间的相似度
   */
  calculateStrategySimilarity(
    strategy1: MatchStrategy, 
    strategy2: MatchStrategy
  ): number {
    // 策略相似度矩阵
    const similarityMatrix: Record<MatchStrategy, Record<MatchStrategy, number>> = {
      'standard': { 'strict': 0.8, 'positionless': 0.7, 'relaxed': 0.6 },
      'strict': { 'standard': 0.8, 'absolute': 0.7, 'self-anchor': 0.9 },
      'self-anchor': { 'strict': 0.9, 'child-anchor': 0.8, 'xpath-direct': 0.7 },
      'xpath-direct': { 'xpath-first-index': 0.8, 'absolute': 0.6, 'self-anchor': 0.7 }
      // ... 其他策略的相似度定义
    } as any;

    return similarityMatrix[strategy1]?.[strategy2] || 0.1;
  }

  /**
   * 获取策略推荐置信度
   */
  calculateRecommendationConfidence(
    candidates: StrategyCandidate[]
  ): number {
    if (candidates.length === 0) return 0;
    
    const bestScore = candidates[0].scoring.total;
    const secondBestScore = candidates[1]?.scoring.total || 0;
    
    // 如果最佳策略明显优于第二名，置信度更高
    const scoreDiff = bestScore - secondBestScore;
    let confidence = bestScore / 100;
    
    if (scoreDiff > 20) {
      confidence = Math.min(confidence + 0.2, 1.0);
    } else if (scoreDiff < 5) {
      confidence = Math.max(confidence - 0.1, 0.1);
    }
    
    return confidence;
  }

  /**
   * 更新评分权重配置
   */
  updateScoreWeights(newWeights: Partial<typeof this.scoreWeights>): void {
    Object.assign(this.scoreWeights, newWeights);
  }

  /**
   * 获取当前权重配置
   */
  getScoreWeights(): typeof this.scoreWeights {
    return { ...this.scoreWeights };
  }
}