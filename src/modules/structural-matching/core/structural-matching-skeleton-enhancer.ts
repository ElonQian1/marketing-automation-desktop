// src/modules/structural-matching/core/structural-matching-skeleton-enhancer.ts
// module: structural-matching | layer: core | role: 骨架规则增强器
// summary: 从简单布尔配置升级到复杂属性匹配的骨架规则生成器

import { 
  SkeletonRules, ElementInfo, XmlContext, ContainerAnchor, AncestorChain, 
  AttributePattern, LayoutPattern, RelationshipConstraint, FallbackRule, LayoutPatternData, NeighborInfo
} from './structural-matching-types';

/**
 * 🦴 骨架规则增强器
 * 
 * 职责：
 * 1. 生成多维度属性匹配规则
 * 2. 提供布局模式识别
 * 3. 支持容错和回退策略
 * 4. 优化匹配精度和召回率
 */
export class SkeletonEnhancer {
  
  /**
   * 🔧 增强骨架规则
   */
  static enhance(
    targetElement: ElementInfo,
    containerAnchor: ContainerAnchor,
    ancestorChain: AncestorChain,
    xmlContext: XmlContext
  ): SkeletonRules {
    console.log('🦴 [SkeletonEnhancer] 开始生成增强骨架规则');
    
    // 1️⃣ 生成核心属性匹配
    const coreAttributes = this.generateCoreAttributes(targetElement);
    
    // 2️⃣ 生成布局模式
    const layoutPatterns = this.generateLayoutPatterns(targetElement, xmlContext);
    
    // 3️⃣ 生成关系约束
    const relationshipConstraints = this.generateRelationshipConstraints(targetElement, ancestorChain);
    
    // 4️⃣ 生成容错策略
    const fallbackRules = this.generateFallbackRules(targetElement, xmlContext);
    
    const skeletonRules: SkeletonRules = {
      // 🎯 核心匹配规则
      coreAttributes,
      layoutPatterns,
      relationshipConstraints,
      
      // 📐 布局配置（保持兼容）
      requireImageAboveText: this.shouldRequireImageAboveText(targetElement, xmlContext),
      allowDepthFlex: 2, // 允许深度弹性 ±2
      
      // 🛡️ 容错策略
      fallbackRules,
      
      // ⚖️ 权重配置
      weights: {
        exactMatch: 1.0,        // 精确匹配权重
        attributeMatch: 0.8,    // 属性匹配权重
        layoutMatch: 0.6,       // 布局匹配权重
        positionMatch: 0.4,     // 位置匹配权重
        fallback: 0.2          // 回退匹配权重
      }
    };
    
    console.log('✅ [SkeletonEnhancer] 骨架规则增强完成:', {
      coreAttributeCount: coreAttributes.length,
      layoutPatternCount: layoutPatterns.length,
      relationshipCount: relationshipConstraints.length,
      fallbackRuleCount: fallbackRules.length
    });
    
    return skeletonRules;
  }
  
  /**
   * 🎯 生成核心属性匹配
   */
  private static generateCoreAttributes(targetElement: ElementInfo): AttributePattern[] {
    const attributes: AttributePattern[] = [];
    
    // 1. resource-id匹配（最高优先级）
    if (targetElement.resourceId && targetElement.resourceId !== '' && 
        !targetElement.resourceId.includes('0_resource_name_obfuscated')) {
      attributes.push({
        name: 'resource-id',
        value: targetElement.resourceId,
        matchType: 'exact',
        weight: 1.0,
        required: true
      });
    }
    
    // 2. content-desc匹配
    if (targetElement.contentDesc && targetElement.contentDesc !== '') {
      attributes.push({
        name: 'content-desc',
        value: targetElement.contentDesc,
        matchType: 'exact',
        weight: 0.9,
        required: false
      });
    }
    
    // 3. 文本匹配（区分完整和部分匹配）
    if (targetElement.text && targetElement.text.trim() !== '') {
      const text = targetElement.text.trim();
      
      // 短文本：精确匹配
      if (text.length <= 20) {
        attributes.push({
          name: 'text',
          value: text,
          matchType: 'exact',
          weight: 0.8,
          required: false
        });
      } else {
        // 长文本：部分匹配
        attributes.push({
          name: 'text',
          value: text.substring(0, 15), // 前15个字符
          matchType: 'contains',
          weight: 0.6,
          required: false
        });
      }
    }
    
    // 4. 类名匹配
    if (targetElement.className && targetElement.className !== '') {
      const className = targetElement.className.split('.').pop() || targetElement.className;
      attributes.push({
        name: 'class',
        value: className,
        matchType: 'exact',
        weight: 0.7,
        required: false
      });
    }
    
    // 5. 布尔属性匹配
    if (targetElement.clickable) {
      attributes.push({
        name: 'clickable',
        value: 'true',
        matchType: 'exact',
        weight: 0.5,
        required: false
      });
    }
    
    if (targetElement.scrollable) {
      attributes.push({
        name: 'scrollable',
        value: 'true',
        matchType: 'exact',
        weight: 0.5,
        required: false
      });
    }
    
    return attributes;
  }
  
  /**
   * 📐 生成布局模式
   */
  private static generateLayoutPatterns(targetElement: ElementInfo, xmlContext: XmlContext): LayoutPattern[] {
    const patterns: LayoutPattern[] = [];
    
    // 1. 边界模式
    const bounds = this.parseBounds(targetElement.bounds);
    patterns.push({
      type: 'bounds',
      pattern: {
        minWidth: Math.max(50, bounds.right - bounds.left - 20),
        maxWidth: bounds.right - bounds.left + 20,
        minHeight: Math.max(20, bounds.bottom - bounds.top - 10),
        maxHeight: bounds.bottom - bounds.top + 10
      },
      weight: 0.6,
      tolerance: 20
    });
    
    // 2. 位置模式（相对位置）
    const positionInfo = this.analyzePosition(targetElement, xmlContext);
    if (positionInfo) {
      patterns.push({
        type: 'position',
        pattern: positionInfo,
        weight: 0.5,
        tolerance: 50
      });
    }
    
    // 3. 邻居模式
    const neighborInfo = this.analyzeNeighbors(targetElement, xmlContext);
    if (neighborInfo && neighborInfo.length > 0) {
      patterns.push({
        type: 'neighbors',
        pattern: { neighbors: neighborInfo },
        weight: 0.7,
        tolerance: 0
      });
    }
    
    return patterns;
  }
  
  /**
   * 🔗 生成关系约束
   */
  private static generateRelationshipConstraints(
    targetElement: ElementInfo, 
    ancestorChain: AncestorChain
  ): RelationshipConstraint[] {
    const constraints: RelationshipConstraint[] = [];
    
    // 深度约束
    constraints.push({
      type: 'depth',
      minDepth: Math.max(1, ancestorChain.depth - 2),
      maxDepth: ancestorChain.depth + 2,
      weight: 0.4
    });
    
    // 祖先约束（使用最重要的3个锚点）
    const topAnchorPoints = ancestorChain.anchorPoints
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    
    if (topAnchorPoints.length > 0) {
      constraints.push({
        type: 'ancestors',
        anchorPoints: topAnchorPoints,
        requireAll: false, // 不要求所有祖先都匹配
        minMatches: 1,     // 至少匹配1个
        weight: 0.6
      });
    }
    
    return constraints;
  }
  
  /**
   * 🛡️ 生成回退规则
   */
  private static generateFallbackRules(_targetElement: ElementInfo, _xmlContext: XmlContext): FallbackRule[] {
    const fallbackRules: FallbackRule[] = [];
    
    // 规则1：放宽属性匹配
    fallbackRules.push({
      name: 'relaxed_attributes',
      description: '放宽属性匹配要求',
      modifications: {
        requireExactText: false,
        allowPartialResourceId: true,
        allowSimilarClassName: true
      },
      threshold: 0.7 // 当匹配分数 < 0.7 时启用
    });
    
    // 规则2：忽略位置约束
    fallbackRules.push({
      name: 'ignore_position',
      description: '忽略位置和边界约束',
      modifications: {
        ignoreAbsolutePosition: true,
        relaxBoundsConstraint: true,
        allowPositionFlex: 0.5
      },
      threshold: 0.5 // 当匹配分数 < 0.5 时启用
    });
    
    // 规则3：仅使用核心属性
    fallbackRules.push({
      name: 'core_only',
      description: '仅使用最核心的属性匹配',
      modifications: {
        useOnlyResourceId: true,
        ignoreAllLayout: true,
        ignoreAllRelationships: true
      },
      threshold: 0.3 // 当匹配分数 < 0.3 时启用
    });
    
    return fallbackRules;
  }
  
  /**
   * 🖼️ 检查是否需要图片-文本约束
   */
  private static shouldRequireImageAboveText(targetElement: ElementInfo, xmlContext: XmlContext): boolean {
    // 检查目标元素周围是否有图片元素
    const nearbyElements = this.findNearbyElements(targetElement, xmlContext, 100);
    const hasNearbyImage = nearbyElements.some(el => 
      el.className.includes('Image') || el.className.includes('Icon')
    );
    
    // 检查目标元素是否有文本
    const hasText = targetElement.text && targetElement.text.trim() !== '';
    
    return hasNearbyImage && hasText;
  }
  
  // 🛠️ 工具方法
  
  private static parseBounds(boundsStr: string): { left: number, top: number, right: number, bottom: number } {
    const matches = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (matches) {
      return {
        left: parseInt(matches[1]),
        top: parseInt(matches[2]),
        right: parseInt(matches[3]),
        bottom: parseInt(matches[4])
      };
    }
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }
  
  private static analyzePosition(targetElement: ElementInfo, _xmlContext: XmlContext): LayoutPatternData {
    const bounds = this.parseBounds(targetElement.bounds);
    const screenWidth = 1080; // 假设屏幕宽度
    const screenHeight = 2400; // 假设屏幕高度
    
    return {
      relativeX: bounds.left / screenWidth,
      relativeY: bounds.top / screenHeight,
      quadrant: this.determineQuadrant(bounds, screenWidth, screenHeight)
    };
  }
  
  private static determineQuadrant(bounds: { left: number; top: number; right: number; bottom: number }, screenWidth: number, screenHeight: number): string {
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    
    const isLeft = centerX < screenWidth / 2;
    const isTop = centerY < screenHeight / 2;
    
    if (isTop && isLeft) return 'top-left';
    if (isTop && !isLeft) return 'top-right';
    if (!isTop && isLeft) return 'bottom-left';
    return 'bottom-right';
  }
  
  private static analyzeNeighbors(targetElement: ElementInfo, xmlContext: XmlContext): NeighborInfo[] {
    const targetBounds = this.parseBounds(targetElement.bounds);
    const neighbors = this.findNearbyElements(targetElement, xmlContext, 50);
    
    return neighbors.slice(0, 3).map(neighbor => {
      const neighborBounds = this.parseBounds(neighbor.bounds);
      const relationship = this.determineRelationship(targetBounds, neighborBounds);
      
      return {
        elementInfo: {
          className: neighbor.className,
          resourceId: neighbor.resourceId,
          text: neighbor.text?.substring(0, 10) // 最多10个字符
        },
        relationship,
        distance: this.calculateDistance(targetBounds, neighborBounds)
      };
    });
  }
  
  private static findNearbyElements(targetElement: ElementInfo, xmlContext: XmlContext, maxDistance: number): ElementInfo[] {
    const targetBounds = this.parseBounds(targetElement.bounds);
    
    return xmlContext.allElements
      .filter(el => el.id !== targetElement.id)
      .map(el => ({
        element: el,
        distance: this.calculateDistance(targetBounds, this.parseBounds(el.bounds))
      }))
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.element);
  }
  
  private static calculateDistance(bounds1: { left: number; top: number; right: number; bottom: number }, bounds2: { left: number; top: number; right: number; bottom: number }): number {
    const center1 = {
      x: (bounds1.left + bounds1.right) / 2,
      y: (bounds1.top + bounds1.bottom) / 2
    };
    const center2 = {
      x: (bounds2.left + bounds2.right) / 2,
      y: (bounds2.top + bounds2.bottom) / 2
    };
    
    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );
  }
  
  private static determineRelationship(bounds1: { left: number; top: number; right: number; bottom: number }, bounds2: { left: number; top: number; right: number; bottom: number }): string {
    const center1Y = (bounds1.top + bounds1.bottom) / 2;
    const center2Y = (bounds2.top + bounds2.bottom) / 2;
    const center1X = (bounds1.left + bounds1.right) / 2;
    const center2X = (bounds2.left + bounds2.right) / 2;
    
    const verticalDiff = Math.abs(center1Y - center2Y);
    const horizontalDiff = Math.abs(center1X - center2X);
    
    if (verticalDiff < 20) return 'horizontal'; // 水平对齐
    if (horizontalDiff < 20) return 'vertical';   // 垂直对齐
    
    if (center2Y < center1Y && center2X < center1X) return 'top-left';
    if (center2Y < center1Y && center2X > center1X) return 'top-right';
    if (center2Y > center1Y && center2X < center1X) return 'bottom-left';
    return 'bottom-right';
  }
}