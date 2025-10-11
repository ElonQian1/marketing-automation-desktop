// src/components/universal-ui/element-selection/alternative-selection/AlternativeElementFinder.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 替代元素查找器
 * 负责为给定元素查找更适合自动化匹配的替代元素
 */

import type { UIElement } from '../../../../api/universalUIAPI';
import type { 
  ElementHierarchyNode, 
  AlternativeElement, 
  TraversalOptions 
} from '../hierarchy/types';
import { ElementHierarchyAnalyzer } from '../hierarchy/ElementHierarchyAnalyzer';
import { ElementQualityScorer } from '../hierarchy/ElementQualityScorer';

export class AlternativeElementFinder {

  /**
   * 查找替代元素
   * @param targetNode 目标元素节点
   * @param nodeMap 节点映射
   * @param options 查找选项
   * @returns 替代元素列表
   */
  static findAlternatives(
    targetNode: ElementHierarchyNode,
    nodeMap: Map<string, ElementHierarchyNode>,
    options: TraversalOptions = {}
  ): AlternativeElement[] {
    console.log('🔍 开始查找替代元素，目标:', targetNode.element.text || targetNode.element.id);
    
    const alternatives: AlternativeElement[] = [];
    
    // 1. 查找父元素
    const parentAlternatives = this.findParentAlternatives(targetNode, options);
    alternatives.push(...parentAlternatives);
    
    // 2. 查找子元素
    const childAlternatives = this.findChildAlternatives(targetNode, options);
    alternatives.push(...childAlternatives);
    
    // 3. 查找兄弟元素
    if (options.includeSiblings) {
      const siblingAlternatives = this.findSiblingAlternatives(targetNode, options);
      alternatives.push(...siblingAlternatives);
    }
    
    // 4. 过滤和排序
    const filteredAlternatives = this.filterAndSort(alternatives, options);
    
    console.log('✅ 找到替代元素数量:', filteredAlternatives.length);
    
    return filteredAlternatives;
  }

  /**
   * 查找父元素替代方案
   */
  private static findParentAlternatives(
    targetNode: ElementHierarchyNode,
    options: TraversalOptions
  ): AlternativeElement[] {
    const alternatives: AlternativeElement[] = [];
    const ancestors = ElementHierarchyAnalyzer.getAncestors(targetNode);
    const maxDepth = options.maxDepth || 3;
    
    ancestors.slice(0, maxDepth).forEach((ancestor, index) => {
      const quality = ElementQualityScorer.calculateQuality(ancestor);
      
      // 只推荐质量得分较高的父元素
      if (quality.totalScore > 40) {
        const alternative: AlternativeElement = {
          node: ancestor,
          relationship: index === 0 ? 'parent' : 'ancestor',
          distance: index + 1,
          qualityScore: quality.totalScore,
          reason: this.generateReasonForParent(ancestor, quality)
        };
        
        alternatives.push(alternative);
      }
    });
    
    return alternatives;
  }

  /**
   * 查找子元素替代方案
   */
  private static findChildAlternatives(
    targetNode: ElementHierarchyNode,
    options: TraversalOptions
  ): AlternativeElement[] {
    const alternatives: AlternativeElement[] = [];
    const descendants = ElementHierarchyAnalyzer.getDescendants(targetNode);
    const maxDepth = options.maxDepth || 2;
    
    descendants.forEach(descendant => {
      const depthDiff = descendant.depth - targetNode.depth;
      
      if (depthDiff <= maxDepth) {
        const quality = ElementQualityScorer.calculateQuality(descendant);
        
        // 优先推荐有文本内容或resource_id的子元素
        if (this.isGoodChildCandidate(descendant)) {
          const alternative: AlternativeElement = {
            node: descendant,
            relationship: depthDiff === 1 ? 'child' : 'descendant',
            distance: depthDiff,
            qualityScore: quality.totalScore,
            reason: this.generateReasonForChild(descendant, quality)
          };
          
          alternatives.push(alternative);
        }
      }
    });
    
    return alternatives;
  }

  /**
   * 查找兄弟元素替代方案
   */
  private static findSiblingAlternatives(
    targetNode: ElementHierarchyNode,
    options: TraversalOptions
  ): AlternativeElement[] {
    const alternatives: AlternativeElement[] = [];
    const siblings = ElementHierarchyAnalyzer.getSiblings(targetNode);
    
    siblings.forEach(sibling => {
      const quality = ElementQualityScorer.calculateQuality(sibling);
      
      if (quality.totalScore > 30) {
        const alternative: AlternativeElement = {
          node: sibling,
          relationship: 'sibling',
          distance: 1,
          qualityScore: quality.totalScore,
          reason: this.generateReasonForSibling(sibling, quality)
        };
        
        alternatives.push(alternative);
      }
    });
    
    return alternatives;
  }

  /**
   * 检查是否为好的子元素候选
   */
  private static isGoodChildCandidate(node: ElementHierarchyNode): boolean {
    const element = node.element;
    
    // 有文本内容
    if (element.text && element.text.trim().length > 0) {
      return true;
    }
    
    // 有resource_id
    if (element.resource_id && element.resource_id.length > 0) {
      return true;
    }
    
    // 有content_desc
    if (element.content_desc && element.content_desc.length > 0) {
      return true;
    }
    
    // 是可交互元素
    if (element.is_clickable || element.is_scrollable) {
      return true;
    }
    
    return false;
  }

  /**
   * 为父元素生成推荐原因
   */
  private static generateReasonForParent(
    node: ElementHierarchyNode, 
    quality: any
  ): string {
    const element = node.element;
    const reasons = [];
    
    if (element.resource_id) {
      reasons.push('有资源ID');
    }
    
    if (element.text && element.text.trim().length > 0) {
      reasons.push('包含文本内容');
    }
    
    if (element.is_clickable) {
      reasons.push('可点击');
    }
    
    if (quality.totalScore > 70) {
      reasons.push('高质量匹配');
    }
    
    return reasons.length > 0 ? reasons.join('，') : '父容器元素';
  }

  /**
   * 为子元素生成推荐原因
   */
  private static generateReasonForChild(
    node: ElementHierarchyNode, 
    quality: any
  ): string {
    const element = node.element;
    const reasons = [];
    
    if (element.text && element.text.trim().length > 0) {
      reasons.push(`包含文本"${element.text.substring(0, 10)}"`);
    }
    
    if (element.resource_id) {
      reasons.push('有唯一标识');
    }
    
    if (element.is_clickable) {
      reasons.push('可交互');
    }
    
    return reasons.length > 0 ? reasons.join('，') : '子元素';
  }

  /**
   * 为兄弟元素生成推荐原因
   */
  private static generateReasonForSibling(
    node: ElementHierarchyNode, 
    quality: any
  ): string {
    const element = node.element;
    
    if (element.text && element.text.trim().length > 0) {
      return `同级元素"${element.text.substring(0, 10)}"`;
    }
    
    if (element.resource_id) {
      return '同级可识别元素';
    }
    
    return '相邻元素';
  }

  /**
   * 过滤和排序替代元素
   */
  private static filterAndSort(
    alternatives: AlternativeElement[],
    options: TraversalOptions
  ): AlternativeElement[] {
    let filtered = alternatives;
    
    // 应用自定义过滤器
    if (options.filter) {
      filtered = filtered.filter(alt => options.filter!(alt.node));
    }
    
    // 排序
    const sortBy = options.sortBy || 'quality';
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.qualityScore - a.qualityScore;
        
        case 'distance':
          return a.distance - b.distance;
        
        case 'depth':
          return a.node.depth - b.node.depth;
        
        default:
          return b.qualityScore - a.qualityScore;
      }
    });
    
    // 限制返回数量
    return filtered.slice(0, 8); // 最多返回8个替代选项
  }

  /**
   * 快速查找最佳替代元素
   * @param targetElement 目标元素
   * @param allElements 所有元素
   * @returns 最佳替代元素或null
   */
  static findBestAlternative(
    targetElement: UIElement, 
    allElements: UIElement[]
  ): AlternativeElement | null {
    // 构建层次结构
    const hierarchy = ElementHierarchyAnalyzer.analyzeHierarchy(allElements);
    const targetNode = hierarchy.nodeMap.get(targetElement.id);
    
    if (!targetNode) return null;
    
    // 查找替代元素
    const alternatives = this.findAlternatives(targetNode, hierarchy.nodeMap, {
      maxDepth: 2,
      includeSiblings: false,
      sortBy: 'quality'
    });
    
    return alternatives.length > 0 ? alternatives[0] : null;
  }
}