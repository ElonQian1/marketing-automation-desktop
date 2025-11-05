// src/modules/structural-matching/structural-matching-coordinator.ts
// module: structural-matching | layer: application | role: 主协调器
// summary: 协调各个模块，生成完整的结构化签名配置

import { ContainerAnchorGenerator } from './anchors/structural-matching-container-anchor';
import { AncestorAnalyzer } from './anchors/structural-matching-ancestor-analyzer';
import { SkeletonEnhancer } from './core/structural-matching-skeleton-enhancer';
import { CompletenessScorer } from './scoring/structural-matching-completeness-scorer';

import { 
  StructuralSignatureProfile, ElementInfo, XmlContext, ScoringConfig, CompletenessAnalysis
} from './core/structural-matching-types';

/**
 * 🎛️ 结构匹配协调器
 * 
 * 职责：
 * 1. 协调容器锚点、祖先链、骨架规则生成
 * 2. 执行完整性评分和分析
 * 3. 提供统一的结构化签名生成接口
 * 4. 支持配置优化和迭代改进
 */
export class StructuralMatchingCoordinator {
  
  /**
   * 🚀 生成完整结构化签名
   */
  static generateProfile(
    targetElement: ElementInfo,
    xmlContext: XmlContext,
    scoringConfig?: ScoringConfig
  ): StructuralSignatureProfile {
    console.log('🚀 [StructuralMatchingCoordinator] 开始生成结构化签名配置');
    
    try {
      // 1️⃣ 生成容器锚点
      console.log('🎯 [Step 1/5] 生成容器锚点...');
      const containerAnchor = ContainerAnchorGenerator.generate(targetElement, xmlContext);
      
      // 2️⃣ 分析祖先链
      console.log('🧬 [Step 2/5] 分析祖先链...');
      const ancestorChain = AncestorAnalyzer.analyze(
        targetElement, 
        this.findContainerElement(containerAnchor, xmlContext, targetElement), 
        xmlContext
      );
      
      // 3️⃣ 增强骨架规则
      console.log('🦴 [Step 3/5] 增强骨架规则...');
      const skeletonRules = SkeletonEnhancer.enhance(
        targetElement, 
        containerAnchor, 
        ancestorChain, 
        xmlContext
      );
      
      // 4️⃣ 构建初始配置
      const profile: StructuralSignatureProfile = {
        containerAnchor,
        ancestorChain,
        skeletonRules,
        // contextAnchor, cardRootAnchor, fieldRules, convertibilityAnchors 暂时为空
        contextAnchor: undefined,
        cardRootAnchor: undefined,
        fieldRules: [],
        convertibilityAnchors: [],
        scoring: scoringConfig || this.getDefaultScoringConfig(),
        completenessScore: 0 // 将在下一步计算
      };
      
      // 5️⃣ 计算完整性评分
      console.log('📊 [Step 4/5] 计算完整性评分...');
      const completenessScore = CompletenessScorer.calculateScore(profile, targetElement, xmlContext);
      profile.completenessScore = completenessScore;
      
      // 📋 完整性分析（可选）
      console.log('🔍 [Step 5/5] 执行完整性分析...');
      const analysis = CompletenessScorer.analyze(profile, targetElement, xmlContext);
      
      console.log('✅ [StructuralMatchingCoordinator] 结构化签名生成完成:', {
        containerXPath: profile.containerAnchor?.xpath || 'N/A',
        ancestorDepth: profile.ancestorChain?.depth || 0,
        coreAttributeCount: profile.skeletonRules?.coreAttributes?.length || 0,
        completenessScore: profile.completenessScore,
        confidence: analysis.confidence
      });
      
      // 输出分析结果供调试
      if (analysis.issues.length > 0) {
        console.warn('⚠️ [分析] 发现问题:', analysis.issues);
      }
      if (analysis.suggestions.length > 0) {
        console.info('💡 [建议]:', analysis.suggestions);
      }
      
      return profile;
      
    } catch (error) {
      console.error('❌ [StructuralMatchingCoordinator] 生成失败:', error);
      
      // 返回兜底配置
      return this.createFallbackProfile(targetElement, scoringConfig);
    }
  }
  
  /**
   * 🔍 分析现有配置
   */
  static analyzeProfile(
    profile: StructuralSignatureProfile,
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): CompletenessAnalysis {
    return CompletenessScorer.analyze(profile, targetElement, xmlContext);
  }
  
  /**
   * ⚡ 优化配置（基于分析结果）
   */
  static optimizeProfile(
    profile: StructuralSignatureProfile,
    analysis: CompletenessAnalysis,
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): StructuralSignatureProfile {
    console.log('⚡ [优化] 开始优化配置，当前评分:', profile.completenessScore);
    
    let optimizedProfile = { ...profile };
    
    // 应用优化建议
    if (analysis.suggestions.includes('建议添加resource-id匹配以提高唯一性')) {
      optimizedProfile = this.addResourceIdFallback(optimizedProfile, targetElement);
    }
    
    if (analysis.suggestions.includes('建议配置容器锚点以限制搜索范围')) {
      optimizedProfile.containerAnchor = ContainerAnchorGenerator.generate(targetElement, xmlContext);
    }
    
    if (analysis.suggestions.includes('建议增加祖先锚点以增强路径导航能力')) {
      // 重新生成祖先链，增加更多锚点
      const containerElement = this.findContainerElement(optimizedProfile.containerAnchor!, xmlContext, targetElement);
      optimizedProfile.ancestorChain = AncestorAnalyzer.analyze(targetElement, containerElement, xmlContext);
    }
    
    // 重新计算评分
    optimizedProfile.completenessScore = CompletenessScorer.calculateScore(optimizedProfile, targetElement, xmlContext);
    
    console.log('✅ [优化] 优化完成，新评分:', optimizedProfile.completenessScore);
    
    return optimizedProfile;
  }
  
  /**
   * 🎛️ 转换为后端格式
   */
  static convertToBackendFormat(profile: StructuralSignatureProfile): Record<string, any> {
    console.log('🎛️ [转换] 转换为后端格式');
    
    // 简化的后端格式，兼容现有 SM Runtime
    const backendFormat = {
      // 保持现有的布尔配置
      require_image_above_text: profile.skeletonRules?.requireImageAboveText || false,
      allow_depth_flex: profile.skeletonRules?.allowDepthFlex || 2,
      
      // 新增：增强属性匹配规则
      enhanced_rules: {
        container_xpath: profile.containerAnchor?.xpath,
        core_attributes: profile.skeletonRules?.coreAttributes?.map(attr => ({
          name: attr.name,
          value: attr.value,
          match_type: attr.matchType,
          weight: attr.weight,
          required: attr.required
        })) || [],
        ancestor_anchors: profile.ancestorChain?.anchorPoints?.slice(0, 3).map(anchor => ({
          xpath: anchor.xpath,
          weight: anchor.weight
        })) || [],
        completeness_score: profile.completenessScore
      }
    };
    
    console.log('✅ [转换] 转换完成，增强规则数量:', backendFormat.enhanced_rules.core_attributes.length);
    
    return backendFormat;
  }
  
  // 🛠️ 工具方法
  
  private static findContainerElement(
    containerAnchor: any, 
    xmlContext: XmlContext, 
    fallbackElement: ElementInfo
  ): ElementInfo {
    // 简化：使用第一个滚动容器或目标元素的父级
    const scrollableContainers = xmlContext.allElements.filter(el => el.scrollable);
    
    if (scrollableContainers.length > 0) {
      return scrollableContainers[0];
    }
    
    // 回退到目标元素的父级
    return fallbackElement.parent || fallbackElement;
  }
  
  private static getDefaultScoringConfig(): ScoringConfig {
    return {
      containerWeight: 0.25,
      ancestorWeight: 0.25,
      skeletonWeight: 0.30,
      uniquenessWeight: 0.20,
      thresholds: {
        excellent: 85,
        good: 70,
        acceptable: 50,
        poor: 30
      }
    };
  }
  
  private static createFallbackProfile(targetElement: ElementInfo, scoringConfig?: ScoringConfig): StructuralSignatureProfile {
    console.log('🛡️ [兜底] 创建兜底配置');
    
    return {
      containerAnchor: {
        xpath: '//*[@scrollable="true"] | //RecyclerView | //ListView',
        fingerprint: { role: 'View', scrollable: true },
        fallbackStrategy: 'global'
      },
      ancestorChain: {
        depth: 1,
        anchorPoints: [],
        jumpStrategy: 'sequential',
        fallbackDepth: 1
      },
      skeletonRules: {
        requireImageAboveText: false,
        allowDepthFlex: 3,
        coreAttributes: [
          {
            name: 'class',
            value: targetElement.className.split('.').pop() || 'View',
            matchType: 'exact',
            weight: 0.7,
            required: true
          }
        ]
      },
      contextAnchor: undefined,
      cardRootAnchor: undefined,
      fieldRules: [],
      convertibilityAnchors: [],
      scoring: scoringConfig || this.getDefaultScoringConfig(),
      completenessScore: 30 // 兜底配置给30分
    };
  }
  
  private static addResourceIdFallback(profile: StructuralSignatureProfile, targetElement: ElementInfo): StructuralSignatureProfile {
    if (!profile.skeletonRules?.coreAttributes) return profile;
    
    // 检查是否已有resource-id匹配
    const hasResourceId = profile.skeletonRules.coreAttributes.some(attr => 
      attr.name === 'resource-id' && attr.value && attr.value !== ''
    );
    
    // 如果没有且目标元素有resource-id，则添加
    if (!hasResourceId && targetElement.resourceId && targetElement.resourceId !== '') {
      profile.skeletonRules.coreAttributes.unshift({
        name: 'resource-id',
        value: targetElement.resourceId,
        matchType: 'exact',
        weight: 1.0,
        required: true
      });
    }
    
    return profile;
  }
}