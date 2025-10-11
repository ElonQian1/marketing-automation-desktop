// src/modules/intelligent-strategy-system/analyzers/index-fallback/strategies/HierarchyPathStrategy.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * HierarchyPathStrategy.ts
 * 层级路径策略
 */

import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { StrategyCandidate } from '../../../types/StrategyTypes';
import { ElementValidator } from '../../../shared';

export class HierarchyPathStrategy {
  readonly name = 'HierarchyPathStrategy';

  /**
   * 检查策略是否适用
   */
  isApplicable(element: any, context: ElementAnalysisContext): boolean {
    return !!element.class || !!element['resource-id'];
  }

  /**
   * 分析层级路径策略
   */
  async analyze(element: any, context: ElementAnalysisContext): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    let baseScore = 50; // 中等分数

    // 构建层级路径
    const hierarchyPath = this.buildHierarchyPath(element, context);
    
    if (hierarchyPath.length === 0) return candidates;

    // 策略1: 完整层级路径
    candidates.push(this.createCandidate(
      baseScore + 10,
      `层级路径: ${hierarchyPath.join(' > ')}`,
      element,
      {
        type: 'full-hierarchy',
        fields: ['hierarchy-path'],
        values: { 'path': hierarchyPath }
      }
    ));

    // 策略2: 简化层级路径（只保留关键节点）
    const simplifiedPath = this.simplifyHierarchyPath(hierarchyPath);
    if (simplifiedPath.length < hierarchyPath.length && simplifiedPath.length > 0) {
      candidates.push(this.createCandidate(
        baseScore + 5,
        `简化路径: ${simplifiedPath.join(' > ')}`,
        element,
        {
          type: 'simplified-hierarchy',
          fields: ['simplified-path'],
          values: { 'path': simplifiedPath }
        }
      ));
    }

    // 策略3: 相对路径（从最近的有ID的父元素开始）
    const relativePath = this.buildRelativePath(element, context);
    if (relativePath.anchor && relativePath.path.length > 0) {
      candidates.push(this.createCandidate(
        baseScore + 15, // 相对路径通常更稳定
        `相对路径: ${relativePath.anchor} > ${relativePath.path.join(' > ')}`,
        element,
        {
          type: 'relative-hierarchy',
          fields: ['relative-path'],
          values: { 
            'anchor': relativePath.anchor,
            'path': relativePath.path 
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 构建完整层级路径
   */
  private buildHierarchyPath(element: any, context: ElementAnalysisContext): string[] {
    const path: string[] = [];
    
    // 简化实现 - 实际需要遍历XML树结构
    let current = element;
    let depth = 0;
    const maxDepth = 10; // 防止无限循环

    while (current && depth < maxDepth) {
      const nodeDesc = this.getNodeDescription(current);
      if (nodeDesc) {
        path.unshift(nodeDesc);
      }

      // 获取父节点 - 这里需要实际的XML遍历逻辑
      current = current.parent;
      depth++;
    }

    return path;
  }

  /**
   * 获取节点描述
   */
  private getNodeDescription(element: any): string | null {
    // 优先使用resource-id
    if (element['resource-id']) {
      return `#${element['resource-id']}`;
    }

    // 其次使用class + 有意义的属性
    if (element.class) {
      let desc = element.class;
      
      // 添加有意义的文本
      if (element.text && element.text.length < 20) {
        desc += `[text="${element.text}"]`;
      }
      
      // 添加索引（如果有的话）
      if (element.index !== undefined) {
        desc += `[${element.index}]`;
      }

      return desc;
    }

    return null;
  }

  /**
   * 简化层级路径
   */
  private simplifyHierarchyPath(fullPath: string[]): string[] {
    // 移除通用的容器类，保留关键节点
    const genericClasses = [
      'android.widget.LinearLayout',
      'android.widget.RelativeLayout',
      'android.widget.FrameLayout',
      'android.view.ViewGroup'
    ];

    return fullPath.filter(node => {
      // 保留有ID的节点
      if (node.startsWith('#')) return true;
      
      // 移除纯通用类名节点
      return !genericClasses.some(generic => node.startsWith(generic) && !node.includes('['));
    });
  }

  /**
   * 构建相对路径
   */
  private buildRelativePath(element: any, context: ElementAnalysisContext) {
    // 查找最近的有resource-id的祖先节点作为锚点
    let current = element.parent;
    let pathFromAnchor: string[] = [];
    let anchor: string | null = null;

    // 先构建到锚点的路径
    let tempPath: string[] = [];
    let temp = element;

    while (temp && tempPath.length < 5) { // 限制相对路径深度
      const desc = this.getNodeDescription(temp);
      if (desc) {
        tempPath.unshift(desc);
      }

      if (temp['resource-id']) {
        anchor = `#${temp['resource-id']}`;
        pathFromAnchor = tempPath.slice(1); // 移除锚点本身
        break;
      }

      temp = temp.parent;
    }

    return {
      anchor,
      path: pathFromAnchor
    };
  }

  /**
   * 创建候选策略
   */
  private createCandidate(
    score: number,
    description: string,
    element: any,
    criteria: any
  ): StrategyCandidate {
    const stability = this.calculateStability(criteria);
    
    return {
      id: `hierarchy-path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategy: 'index-fallback',
      sourceStep: 'index-fallback',
      scoring: {
        total: score,
        breakdown: {
          uniqueness: score * 0.7,
          stability: stability,
          performance: score * 0.6, // 层级路径查询稍慢
          reliability: score * 0.8
        },
        bonuses: criteria.type === 'relative-hierarchy' ? [
          { reason: '相对路径抗布局变化能力强', points: 10 }
        ] : [],
        penalties: criteria.type === 'full-hierarchy' && criteria.values.path?.length > 6 ? [
          { reason: '路径过深可能不稳定', points: -10 }
        ] : []
      },
      criteria: {
        fields: criteria.fields,
        values: criteria.values
      },
      validation: {
        passed: false,
        matchCount: 0,
        uniqueness: { 
          isUnique: criteria.type === 'relative-hierarchy'
        },
        errors: [],
        warnings: this.generateWarnings(criteria),
        validationTime: 0
      },
      metadata: {
        createdAt: Date.now(),
        estimatedExecutionTime: 100 + (criteria.values.path?.length || 0) * 20,
        deviceCompatibility: criteria.type === 'relative-hierarchy' ? 
          ['similar-layouts', 'different-resolutions'] : ['similar-layouts'],
        complexity: 'medium'
      }
    };
  }

  /**
   * 计算稳定性分数
   */
  private calculateStability(criteria: any): number {
    let stability = 50;

    // 相对路径更稳定
    if (criteria.type === 'relative-hierarchy') {
      stability += 20;
    }

    // 简化路径中等稳定
    if (criteria.type === 'simplified-hierarchy') {
      stability += 10;
    }

    // 路径过深降低稳定性
    const pathLength = criteria.values.path?.length || 0;
    if (pathLength > 6) {
      stability -= (pathLength - 6) * 5;
    }

    return Math.max(Math.min(stability, 100), 0);
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(criteria: any): string[] {
    const warnings: string[] = [];

    if (criteria.type === 'full-hierarchy') {
      warnings.push('完整层级路径可能因布局调整而失效');
    }

    const pathLength = criteria.values.path?.length || 0;
    if (pathLength > 6) {
      warnings.push('路径过深，建议使用相对路径策略');
    }

    if (criteria.type === 'simplified-hierarchy') {
      warnings.push('简化路径可能匹配到多个元素');
    }

    return warnings;
  }
}