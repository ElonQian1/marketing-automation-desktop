// src/modules/structural-matching/scoring/structural-matching-completeness-scorer.ts
// module: structural-matching | layer: scoring | role: 完整性评分器
// summary: 评估结构匹配系统的锚点完整性和唯一性识别能力

import { 
  StructuralSignatureProfile, ContainerAnchor, AncestorChain, SkeletonRules, 
  ElementInfo, XmlContext, ScoringConfig, CompletenessAnalysis 
} from '../core/structural-matching-types';

/**
 * 📊 完整性评分器
 * 
 * 职责：
 * 1. 评估锚点覆盖完整性
 * 2. 计算唯一性识别能力
 * 3. 分析潜在冲突和歧义
 * 4. 提供优化建议
 */
export class CompletenessScorer {
  
  /**
   * 📊 计算完整性评分
   */
  static calculateScore(
    profile: StructuralSignatureProfile,
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): number {
    console.log('📊 [CompletenessScorer] 开始计算完整性评分');
    
    // 1️⃣ 容器锚点评分 (25分)
    const containerScore = this.evaluateContainerAnchor(profile.containerAnchor, xmlContext);
    
    // 2️⃣ 祖先链评分 (25分)
    const ancestorScore = this.evaluateAncestorChain(profile.ancestorChain, xmlContext);
    
    // 3️⃣ 骨架规则评分 (30分)
    const skeletonScore = this.evaluateSkeletonRules(profile.skeletonRules, targetElement, xmlContext);
    
    // 4️⃣ 唯一性评分 (20分)
    const uniquenessScore = this.evaluateUniqueness(profile, targetElement, xmlContext);
    
    const totalScore = containerScore + ancestorScore + skeletonScore + uniquenessScore;
    
    console.log('✅ [CompletenessScorer] 评分完成:', {
      container: containerScore,
      ancestor: ancestorScore,
      skeleton: skeletonScore,
      uniqueness: uniquenessScore,
      total: totalScore
    });
    
    return Math.round(totalScore);
  }
  
  /**
   * 🔍 分析完整性
   */
  static analyze(
    profile: StructuralSignatureProfile,
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): CompletenessAnalysis {
    console.log('🔍 [CompletenessScorer] 开始完整性分析');
    
    // 计算总分
    const totalScore = this.calculateScore(profile, targetElement, xmlContext);
    
    // 分析覆盖情况
    const coverage = this.analyzeCoverage(profile, targetElement);
    
    // 检测潜在问题
    const issues = this.detectIssues(profile, xmlContext);
    
    // 生成优化建议
    const suggestions = this.generateSuggestions(profile, coverage, issues);
    
    const analysis: CompletenessAnalysis = {
      score: totalScore,
      coverage,
      issues,
      suggestions,
      confidence: this.calculateConfidence(totalScore, issues.length)
    };
    
    console.log('✅ [CompletenessScorer] 完整性分析完成:', {
      score: analysis.score,
      confidence: analysis.confidence,
      issueCount: analysis.issues.length,
      suggestionCount: analysis.suggestions.length
    });
    
    return analysis;
  }
  
  /**
   * 🎯 评估容器锚点 (25分)
   */
  private static evaluateContainerAnchor(containerAnchor: ContainerAnchor, xmlContext: XmlContext): number {
    let score = 0;
    
    // 基础存在分 (5分)
    if (containerAnchor && containerAnchor.xpath) {
      score += 5;
    } else {
      return 0; // 没有容器锚点，直接返回0
    }
    
    // XPath质量评分 (10分)
    const xpathQuality = this.evaluateXPathQuality(containerAnchor.xpath);
    score += xpathQuality * 10;
    
    // 指纹质量评分 (5分)
    if (containerAnchor.fingerprint) {
      const fingerprintScore = this.evaluateFingerprintQuality(containerAnchor.fingerprint);
      score += fingerprintScore * 5;
    }
    
    // 容器唯一性评分 (5分)
    const uniqueness = this.calculateContainerUniqueness(containerAnchor, xmlContext);
    score += uniqueness * 5;
    
    return Math.min(25, score);
  }
  
  /**
   * 🧬 评估祖先链 (25分)
   */
  private static evaluateAncestorChain(ancestorChain: AncestorChain, xmlContext: XmlContext): number {
    let score = 0;
    
    // 基础存在分 (5分)
    if (ancestorChain && ancestorChain.anchorPoints && ancestorChain.anchorPoints.length > 0) {
      score += 5;
    } else {
      return 5; // 没有祖先链，给基础分
    }
    
    // 深度合理性 (5分)
    if (ancestorChain.depth >= 2 && ancestorChain.depth <= 8) {
      score += 5;
    } else if (ancestorChain.depth > 0) {
      score += 2;
    }
    
    // 锚点质量 (10分)
    const anchorQuality = ancestorChain.anchorPoints.reduce((sum, anchor, index) => {
      const weight = Math.max(0.1, 1 - index * 0.2); // 前面的锚点权重更高
      return sum + this.evaluateAnchorPointQuality(anchor, xmlContext) * weight;
    }, 0) / ancestorChain.anchorPoints.length;
    
    score += anchorQuality * 10;
    
    // 跳跃策略合理性 (5分)
    const strategyScore = this.evaluateJumpStrategy(ancestorChain.jumpStrategy, ancestorChain.depth);
    score += strategyScore * 5;
    
    return Math.min(25, score);
  }
  
  /**
   * 🦴 评估骨架规则 (30分)
   */
  private static evaluateSkeletonRules(skeletonRules: SkeletonRules, targetElement: ElementInfo, xmlContext: XmlContext): number {
    let score = 0;
    
    // 基础存在分 (5分)
    if (skeletonRules) {
      score += 5;
    } else {
      return 0;
    }
    
    // 核心属性评分 (15分)
    if (skeletonRules.coreAttributes && skeletonRules.coreAttributes.length > 0) {
      const attributeScore = skeletonRules.coreAttributes.reduce((sum, attr) => {
        return sum + this.evaluateAttributePattern(attr, targetElement, xmlContext);
      }, 0) / skeletonRules.coreAttributes.length;
      score += attributeScore * 15;
    }
    
    // 布局模式评分 (5分)
    if (skeletonRules.layoutPatterns && skeletonRules.layoutPatterns.length > 0) {
      score += 5;
    }
    
    // 权重配置评分 (5分)
    if (skeletonRules.weights) {
      const weightsQuality = this.evaluateWeightsConfiguration(skeletonRules.weights);
      score += weightsQuality * 5;
    }
    
    return Math.min(30, score);
  }
  
  /**
   * 🎯 评估唯一性 (20分)
   */
  private static evaluateUniqueness(
    profile: StructuralSignatureProfile, 
    targetElement: ElementInfo, 
    xmlContext: XmlContext
  ): number {
    let score = 0;
    
    // 模拟匹配测试
    const simulatedMatches = this.simulateMatching(profile, xmlContext);
    
    // 唯一匹配奖励 (15分)
    if (simulatedMatches.length === 1) {
      score += 15;
    } else if (simulatedMatches.length <= 3) {
      score += 10; // 少量匹配
    } else if (simulatedMatches.length <= 10) {
      score += 5;  // 中等数量匹配
    } else {
      score += 0;  // 过多匹配，没有唯一性
    }
    
    // 目标匹配验证 (5分)
    const containsTarget = simulatedMatches.some(match => match.id === targetElement.id);
    if (containsTarget) {
      score += 5;
    }
    
    return Math.min(20, score);
  }
  
  // 🛠️ 工具方法
  
  private static evaluateXPathQuality(xpath: string): number {
    let quality = 0.3; // 基础分
    
    // 使用了resource-id
    if (xpath.includes("@resource-id=")) quality += 0.3;
    
    // 使用了content-desc
    if (xpath.includes("@content-desc=")) quality += 0.2;
    
    // 使用了scrollable等属性
    if (xpath.includes("@scrollable=")) quality += 0.1;
    
    // 使用了text
    if (xpath.includes("@text=")) quality += 0.1;
    
    return Math.min(1, quality);
  }
  
  private static evaluateFingerprintQuality(fingerprint: Record<string, any>): number {
    const keys = Object.keys(fingerprint);
    let quality = 0;
    
    if (keys.includes('role')) quality += 0.2;
    if (keys.includes('scrollable')) quality += 0.2;
    if (keys.includes('resourceId')) quality += 0.3;
    if (keys.includes('boundsPattern')) quality += 0.3;
    
    return Math.min(1, quality);
  }
  
  private static calculateContainerUniqueness(containerAnchor: ContainerAnchor, xmlContext: XmlContext): number {
    // 简化的唯一性计算
    const xpath = containerAnchor.xpath;
    const allScrollableCount = xmlContext.allElements.filter(el => el.scrollable).length;
    
    if (xpath.includes("@resource-id=")) {
      return 0.9; // resource-id通常很唯一
    } else if (allScrollableCount <= 3) {
      return 0.7; // 少量滚动容器
    } else {
      return 0.4; // 较多滚动容器
    }
  }
  
  private static evaluateAnchorPointQuality(anchorPoint: any, xmlContext: XmlContext): number {
    let quality = 0.3;
    
    if (anchorPoint.xpath.includes("@resource-id=")) quality += 0.4;
    if (anchorPoint.xpath.includes("@content-desc=")) quality += 0.2;
    if (anchorPoint.weight && anchorPoint.weight > 0.5) quality += 0.1;
    
    return Math.min(1, quality);
  }
  
  private static evaluateJumpStrategy(strategy: string, depth: number): number {
    if (depth <= 3 && strategy === 'sequential') return 1;
    if (depth > 5 && strategy === 'skip') return 1;
    if (strategy === 'adaptive') return 0.8;
    return 0.5;
  }
  
  private static evaluateAttributePattern(attr: any, targetElement: ElementInfo, xmlContext: XmlContext): number {
    let score = 0.3; // 基础分
    
    // 属性重要性
    if (attr.name === 'resource-id' && attr.required) score += 0.4;
    if (attr.name === 'content-desc') score += 0.2;
    if (attr.name === 'text' && attr.matchType === 'exact') score += 0.1;
    
    return Math.min(1, score);
  }
  
  private static evaluateWeightsConfiguration(weights: any): number {
    const expectedTotal = weights.exactMatch + weights.attributeMatch + weights.layoutMatch + weights.positionMatch + weights.fallback;
    
    // 权重合理性检查
    if (weights.exactMatch >= 0.8 && expectedTotal > 2) {
      return 1;
    } else if (weights.exactMatch >= 0.5) {
      return 0.7;
    } else {
      return 0.4;
    }
  }
  
  private static simulateMatching(profile: StructuralSignatureProfile, xmlContext: XmlContext): ElementInfo[] {
    // 简化的匹配模拟
    const matches: ElementInfo[] = [];
    
    // 基于resource-id的粗略匹配
    if (profile.skeletonRules?.coreAttributes) {
      const resourceIdAttr = profile.skeletonRules.coreAttributes.find(attr => 
        attr.name === 'resource-id' && attr.value && attr.value !== ''
      );
      
      if (resourceIdAttr) {
        const resourceIdMatches = xmlContext.allElements.filter(el => 
          el.resourceId === resourceIdAttr.value
        );
        matches.push(...resourceIdMatches);
      }
    }
    
    // 如果没有resource-id匹配，基于className匹配
    if (matches.length === 0 && profile.skeletonRules?.coreAttributes) {
      const classAttr = profile.skeletonRules.coreAttributes.find(attr => attr.name === 'class');
      if (classAttr) {
        const classMatches = xmlContext.allElements.filter(el => 
          el.className.includes(classAttr.value)
        ).slice(0, 20); // 最多20个
        matches.push(...classMatches);
      }
    }
    
    return matches;
  }
  
  private static analyzeCoverage(profile: StructuralSignatureProfile, targetElement: ElementInfo): Record<string, boolean> {
    return {
      hasContainerAnchor: !!(profile.containerAnchor && profile.containerAnchor.xpath),
      hasAncestorChain: !!(profile.ancestorChain && profile.ancestorChain.anchorPoints?.length > 0),
      hasSkeletonRules: !!(profile.skeletonRules),
      hasCoreAttributes: !!(profile.skeletonRules?.coreAttributes?.length > 0),
      hasResourceId: !!(profile.skeletonRules?.coreAttributes?.some(attr => 
        attr.name === 'resource-id' && attr.value && attr.value !== ''
      )),
      hasContentDesc: !!(profile.skeletonRules?.coreAttributes?.some(attr => 
        attr.name === 'content-desc' && attr.value && attr.value !== ''
      )),
      hasText: !!(profile.skeletonRules?.coreAttributes?.some(attr => 
        attr.name === 'text' && attr.value && attr.value !== ''
      ))
    };
  }
  
  private static detectIssues(profile: StructuralSignatureProfile, xmlContext: XmlContext): string[] {
    const issues: string[] = [];
    
    // 检查容器锚点问题
    if (!profile.containerAnchor || !profile.containerAnchor.xpath) {
      issues.push('缺少容器锚点');
    }
    
    // 检查骨架规则问题
    if (!profile.skeletonRules?.coreAttributes || profile.skeletonRules.coreAttributes.length === 0) {
      issues.push('缺少核心属性匹配规则');
    }
    
    // 检查resource-id问题
    const hasResourceId = profile.skeletonRules?.coreAttributes?.some(attr => 
      attr.name === 'resource-id' && attr.value && attr.value !== ''
    );
    if (!hasResourceId) {
      issues.push('缺少resource-id匹配，可能影响唯一性');
    }
    
    // 检查祖先链深度问题
    if (profile.ancestorChain && profile.ancestorChain.depth > 10) {
      issues.push('祖先链深度过大，可能影响性能');
    }
    
    return issues;
  }
  
  private static generateSuggestions(
    profile: StructuralSignatureProfile, 
    coverage: Record<string, boolean>,
    issues: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (!coverage.hasResourceId) {
      suggestions.push('建议添加resource-id匹配以提高唯一性');
    }
    
    if (!coverage.hasContentDesc && !coverage.hasText) {
      suggestions.push('建议添加content-desc或text匹配作为备选方案');
    }
    
    if (issues.includes('缺少容器锚点')) {
      suggestions.push('建议配置容器锚点以限制搜索范围');
    }
    
    if (profile.ancestorChain && profile.ancestorChain.anchorPoints && profile.ancestorChain.anchorPoints.length < 2) {
      suggestions.push('建议增加祖先锚点以增强路径导航能力');
    }
    
    return suggestions;
  }
  
  private static calculateConfidence(score: number, issueCount: number): 'high' | 'medium' | 'low' {
    const adjustedScore = Math.max(0, score - issueCount * 10);
    
    if (adjustedScore >= 80) return 'high';
    if (adjustedScore >= 60) return 'medium';
    return 'low';
  }
}