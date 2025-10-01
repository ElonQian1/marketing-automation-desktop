/**
 * 元素发现逻辑 Hook
 * 负责分析元素层次关系和生成发现结果
 */

import { useState, useCallback, useMemo } from 'react';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { 
  ElementDiscoveryResult, 
  DiscoveredElement, 
  DiscoveryOptions 
} from './types';
import { ElementHierarchyAnalyzer } from '../hierarchy/ElementHierarchyAnalyzer';

const DEFAULT_OPTIONS: DiscoveryOptions = {
  includeParents: true,
  includeChildren: true,
  includeSiblings: false,
  maxDepth: 3,
  minConfidence: 0.3,
  prioritizeText: true,
  prioritizeClickable: true,
  prioritizeTextElements: true, // 向后兼容
  prioritizeClickableElements: true // 向后兼容
};

export const useElementDiscovery = (
  allElements: UIElement[],
  options: Partial<DiscoveryOptions> = {}
) => {
  const [discoveryResult, setDiscoveryResult] = useState<ElementDiscoveryResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalOptions = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options
  }), [options]);

  // 计算元素置信度
  const calculateConfidence = useCallback((element: UIElement, relationship: string): number => {
    let confidence = 0.5; // 基础分数

    // 文本元素加分
    if (element.text && element.text.trim().length > 0) {
      confidence += 0.3;
    }

    // 可点击元素加分
    if (element.is_clickable) {
      confidence += 0.2;
    }

    // 有resource_id加分
    if (element.resource_id) {
      confidence += 0.1;
    }

    // 父元素关系加分
    if (relationship === 'parent') {
      confidence += 0.1;
    }

    // 子元素关系，如果有文本则大加分
    if (relationship === 'child' && element.text) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }, []);

  // 生成发现原因描述
  const generateReason = useCallback((element: UIElement, relationship: string): string => {
    const reasons: string[] = [];

    if (element.text && element.text.trim().length > 0) {
      reasons.push(`包含文本"${element.text.trim().substring(0, 10)}"`);
    }

    if (element.is_clickable) {
      reasons.push('可点击元素');
    }

    if (element.resource_id) {
      reasons.push(`有ID: ${element.resource_id.substring(0, 20)}`);
    }

    switch (relationship) {
      case 'parent':
        reasons.push('父级容器');
        break;
      case 'child':
        reasons.push('子级元素');
        break;
      case 'sibling':
        reasons.push('同级元素');
        break;
    }

    return reasons.join(', ') || '相关元素';
  }, []);

  // 查找父元素
  const findParentElements = useCallback((
    targetElement: UIElement, 
    hierarchy: any
  ): DiscoveredElement[] => {
    if (!finalOptions.includeParents) return [];

    const parents: DiscoveredElement[] = [];
    const targetNode = hierarchy.nodeMap.get(targetElement.id);

    if (targetNode) {
      let currentNode = targetNode.parent;
      let depth = 0;

      while (currentNode && depth < finalOptions.maxDepth) {
        const confidence = calculateConfidence(currentNode.element, 'parent');
        const reason = generateReason(currentNode.element, 'parent');

        parents.push({
          element: currentNode.element,
          relationship: 'parent',
          confidence,
          reason,
          hasText: !!currentNode.element.text,
          isClickable: currentNode.element.is_clickable || false
        });

        currentNode = currentNode.parent;
        depth++;
      }
    }

    // 按置信度排序
    return parents.sort((a, b) => b.confidence - a.confidence);
  }, [finalOptions, calculateConfidence, generateReason]);

  // 查找子元素
  const findChildElements = useCallback((
    targetElement: UIElement,
    hierarchy: any
  ): DiscoveredElement[] => {
    if (!finalOptions.includeChildren) return [];

    const children: DiscoveredElement[] = [];
    const targetNode = hierarchy.nodeMap.get(targetElement.id);

    if (targetNode) {
      // 递归收集子元素
      const collectChildren = (node: any, depth: number) => {
        if (depth >= finalOptions.maxDepth) return;

        node.children.forEach((childNode: any) => {
          const confidence = calculateConfidence(childNode.element, 'child');
          const reason = generateReason(childNode.element, 'child');

          children.push({
            element: childNode.element,
            relationship: 'child',
            confidence,
            reason,
            hasText: !!childNode.element.text,
            isClickable: childNode.element.is_clickable || false
          });

          // 递归收集更深层的子元素
          collectChildren(childNode, depth + 1);
        });
      };

      collectChildren(targetNode, 0);
    }

    // 按置信度排序，优先显示有文本的元素
    return children
      .sort((a, b) => {
        if (finalOptions.prioritizeTextElements) {
          if (a.hasText && !b.hasText) return -1;
          if (!a.hasText && b.hasText) return 1;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, 20); // 限制显示数量
  }, [finalOptions, calculateConfidence, generateReason]);

  // 执行元素发现分析
  const discoverElements = useCallback(async (targetElement: UIElement) => {
    setIsAnalyzing(true);
    setError(null);
    console.log('🔍 开始元素发现分析:', targetElement.id);

    try {
      // 使用层次分析器构建层次树
      const hierarchy = ElementHierarchyAnalyzer.analyzeHierarchy(allElements);
      
      // 查找父元素和子元素
      const parentElements = findParentElements(targetElement, hierarchy);
      const childElements = findChildElements(targetElement, hierarchy);
      
      // 生成推荐匹配（综合考虑父子元素中的最佳选项）
      const allRelatedElements = [...parentElements, ...childElements];
      const recommendedMatches = allRelatedElements
        .filter(el => el.hasText || el.isClickable) // 只推荐有文本或可点击的元素
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // 取前5个

      // 创建自身元素
      const selfElement: DiscoveredElement = {
        element: targetElement,
        relationship: 'self', // 表示这是当前选中的元素本身
        confidence: 1.0, // 自身置信度最高
        reason: '当前选中的元素',
        hasText: Boolean(targetElement.text && targetElement.text.trim()),
        isClickable: targetElement.is_clickable
      };

      const result: ElementDiscoveryResult = {
        originalElement: targetElement,
        selfElement,
        parentElements,
        childElements,
        siblingElements: [], // 暂不实现兄弟元素
        recommendedMatches
      };

      console.log('✅ 元素发现分析完成:', {
        parents: parentElements.length,
        children: childElements.length,
        recommended: recommendedMatches.length
      });

      setDiscoveryResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('❌ 元素发现分析失败:', err);
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [allElements, findParentElements, findChildElements]);

  // 清除发现结果
  const clearDiscovery = useCallback(() => {
    setDiscoveryResult(null);
  }, []);

  return {
    discoveryResult,
    isAnalyzing,
    error,
    discoverElements,
    clearDiscovery
  };
};