/**
 * 元素发现逻辑 Hook
 * 负责分析元素层次关系和生成发现结果
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { 
  ElementDiscoveryResult, 
  DiscoveredElement, 
  DiscoveryOptions 
} from './types';
import { ElementHierarchyAnalyzer } from '../hierarchy/ElementHierarchyAnalyzer';
import { ElementBoundsAnalyzer } from '../hierarchy/ElementBoundsAnalyzer';

const DEFAULT_OPTIONS: DiscoveryOptions = {
  includeParents: true,
  includeChildren: true,
  includeSiblings: true, // 🆕 启用兄弟元素发现
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

  // 🆕 检测是否为隐藏元素（bounds为[0,0][0,0]）
  const isHiddenElement = useCallback((element: UIElement): boolean => {
    const bounds = element.bounds;
    return bounds.left === 0 && bounds.top === 0 && 
           bounds.right === 0 && bounds.bottom === 0;
  }, []);

  // 计算元素置信度
  const calculateConfidence = useCallback((element: UIElement, relationship: string): number => {
    let confidence = 0.5; // 基础分数

    // 🆕 特别处理隐藏的文本元素
    const isHidden = isHiddenElement(element);
    const hasValidText = element.text && element.text.trim().length > 0;

    // 文本元素加分
    if (hasValidText) {
      confidence += 0.3;
      
      // 🌟 隐藏文本元素额外加分（对自动化识别很重要）
      if (isHidden) {
        confidence += 0.2;
      }
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
    if (relationship === 'child' && hasValidText) {
      confidence += 0.2;
      
      // 🌟 隐藏子元素文本特别重要（如导航按钮的文本标签）
      if (isHidden) {
        confidence += 0.25;
      }
    }

    return Math.min(confidence, 1.0);
  }, [isHiddenElement]);

  // 生成发现原因描述
  const generateReason = useCallback((element: UIElement, relationship: string): string => {
    const reasons: string[] = [];

    // 🆕 检查是否为隐藏元素
    const isHidden = isHiddenElement(element);

    if (element.text && element.text.trim().length > 0) {
      const textPreview = element.text.trim().substring(0, 10);
      if (isHidden) {
        reasons.push(`隐藏文本"${textPreview}" [重要标识]`);
      } else {
        reasons.push(`包含文本"${textPreview}"`);
      }
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
        reasons.push(isHidden ? '隐藏子级元素' : '子级元素');
        break;
      case 'sibling':
        reasons.push('同级元素');
        break;
    }

    return reasons.join(', ') || '相关元素';
  }, [isHiddenElement]);

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
      let depth = 1; // 从1开始，表示直接父元素

      while (currentNode && depth <= finalOptions.maxDepth) {
        const confidence = calculateConfidence(currentNode.element, 'parent');
        
        // 根据层级深度生成更清晰的关系描述
        let relationshipType: DiscoveredElement['relationship'] = 'parent';
        let levelDescription = '';
        
        if (depth === 1) {
          relationshipType = 'direct-parent';
          levelDescription = '直接父元素';
        } else if (depth === 2) {
          relationshipType = 'grandparent';
          levelDescription = '祖父元素';
        } else {
          relationshipType = 'ancestor';
          levelDescription = `${depth}级祖先元素`;
        }
        
        const reason = `${levelDescription} - ${generateReason(currentNode.element, 'parent')}`;

        parents.push({
          element: currentNode.element,
          relationship: relationshipType,
          confidence: confidence * (1 / depth), // 距离越远置信度越低
          reason,
          hasText: !!currentNode.element.text,
          isClickable: currentNode.element.is_clickable || false,
          depth // 添加深度信息
        });

        currentNode = currentNode.parent;
        depth++;
      }
    }

    // 按深度排序（直接父元素优先），然后按置信度
    return parents.sort((a, b) => {
      if ((a.depth || 0) !== (b.depth || 0)) return (a.depth || 0) - (b.depth || 0);
      return b.confidence - a.confidence;
    });
  }, [finalOptions, calculateConfidence, generateReason]);

  // 🆕 查找兄弟元素
  const findSiblingElements = useCallback((
    targetElement: UIElement,
    hierarchy: any
  ): DiscoveredElement[] => {
    if (!finalOptions.includeSiblings) return [];

    const siblings: DiscoveredElement[] = [];
    const targetNode = hierarchy.nodeMap.get(targetElement.id);

    console.log('🔍 查找兄弟元素:', {
      targetElementId: targetElement.id,
      targetNodeFound: !!targetNode,
      hasParent: !!targetNode?.parent
    });

    if (!targetNode || !targetNode.parent) {
      console.log('⚠️ 目标元素没有父节点，无法查找兄弟元素');
      return siblings;
    }

    const parentNode = targetNode.parent;
    
    console.log('📊 父节点信息:', {
      parentId: parentNode.element.id,
      siblingCount: parentNode.children?.length || 0
    });

    // 遍历父节点的所有子节点（排除自己）
    if (parentNode.children && parentNode.children.length > 0) {
      parentNode.children.forEach((siblingNode: any, index: number) => {
        // 跳过自己
        if (siblingNode.element.id === targetElement.id) {
          return;
        }

        const siblingElement = siblingNode.element;
        const confidence = calculateConfidence(siblingElement, 'sibling');
        const isHidden = isHiddenElement(siblingElement);
        const hasValidText = siblingElement.text && siblingElement.text.trim().length > 0;
        
        // 🌟 特别优先处理有文本的兄弟元素（如"联系人"标签）
        let adjustedConfidence = confidence;
        if (hasValidText) {
          adjustedConfidence = Math.min(0.95, confidence + 0.3);
          
          // 隐藏文本元素更重要
          if (isHidden) {
            adjustedConfidence = Math.min(0.98, adjustedConfidence + 0.2);
          }
        }
        
        const reason = `兄弟元素 (位置${index + 1}) - ${generateReason(siblingElement, 'sibling')}`;

        siblings.push({
          element: siblingElement,
          relationship: 'sibling',
          confidence: adjustedConfidence,
          reason,
          hasText: hasValidText,
          isClickable: siblingElement.is_clickable || false
        });

        console.log(`    ✅ 添加兄弟元素:`, {
          id: siblingElement.id,
          text: siblingElement.text || '无文本',
          type: siblingElement.element_type,
          confidence: adjustedConfidence.toFixed(2),
          isHidden,
          hasText: hasValidText,
          index
        });
      });
    }

    // 📊 兄弟元素查找完成统计
    const hiddenSiblings = siblings.filter(s => isHiddenElement(s.element));
    const textSiblings = siblings.filter(s => s.hasText);
    const hiddenTextSiblings = siblings.filter(s => isHiddenElement(s.element) && s.hasText);
    
    console.log('✅ 兄弟元素查找完成:', {
      总数: siblings.length,
      隐藏元素数: hiddenSiblings.length,
      文本元素数: textSiblings.length,
      隐藏文本元素数: hiddenTextSiblings.length,
      隐藏文本列表: hiddenTextSiblings.map(e => e.element.text).slice(0, 3)
    });

    // 按置信度排序，优先显示有文本的兄弟元素
    return siblings
      .sort((a, b) => {
        if (finalOptions.prioritizeTextElements) {
          if (a.hasText && !b.hasText) return -1;
          if (!a.hasText && b.hasText) return 1;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, 15); // 限制显示数量
  }, [finalOptions, calculateConfidence, generateReason, isHiddenElement]);

  // 查找子元素
  const findChildElements = useCallback((
    targetElement: UIElement,
    hierarchy: any
  ): DiscoveredElement[] => {
    if (!finalOptions.includeChildren) return [];

    const children: DiscoveredElement[] = [];
    const targetNode = hierarchy.nodeMap.get(targetElement.id);

    console.log('🔍 查找子元素:', {
      targetElementId: targetElement.id,
      targetNodeFound: !!targetNode,
      directChildrenCount: targetNode?.children?.length || 0,
      targetElementBounds: targetElement.bounds,
      targetElementType: targetElement.element_type
    });

    // 详细调试目标节点信息
    if (targetNode) {
      console.log('🎯 目标节点详细信息:', {
        hasChildrenArray: !!targetNode.children,
        childrenLength: targetNode.children?.length,
        isLeaf: targetNode.isLeaf,
        parent: targetNode.parent?.element.id || null,
        depth: targetNode.depth
      });

      // 如果没有子元素，使用边界分析器进行详细分析
      if (targetNode.children.length === 0) {
        console.log('🔍 没有找到子元素，开始边界关系分析...');
        
        // 使用边界分析器分析关系
        ElementBoundsAnalyzer.debugElementRelations(targetElement, allElements);
        
        const boundsAnalysis = ElementBoundsAnalyzer.analyzeElementRelations(targetElement, allElements);
        console.log('� 边界分析结果:', {
          潜在子元素数量: boundsAnalysis.potentialChildren.length,
          潜在父元素数量: boundsAnalysis.potentialParents.length,
          目标元素面积: boundsAnalysis.analysis.targetArea,
          前5个潜在子元素: boundsAnalysis.potentialChildren.slice(0, 5).map(c => ({
            id: c.element.id,
            text: c.element.text,
            type: c.element.element_type,
            面积比例: (c.containmentRatio * 100).toFixed(2) + '%',
            bounds: c.element.bounds
          }))
        });

        // 检查这些潜在子元素在层次结构中的实际父节点
        const allNodes = Array.from(hierarchy.nodeMap.values()) as any[];
        boundsAnalysis.potentialChildren.forEach(child => {
          const childNode = allNodes.find((n: any) => n.element.id === child.element.id);
          if (childNode) {
            console.log(`🧩 潜在子元素 ${child.element.id} 的实际父节点: ${childNode.parent?.element.id || 'null'}`);
          }
        });
      }
    }

    if (targetNode && targetNode.children && targetNode.children.length > 0) {
      // 递归收集子元素
      const collectChildren = (node: any, depth: number, parentPath: string = '') => {
        if (depth >= finalOptions.maxDepth) {
          console.log('⚠️ 达到最大深度限制:', depth);
          return;
        }

        console.log(`📊 处理节点 [深度${depth}]:`, {
          nodeId: node.element.id,
          childrenCount: node.children?.length || 0,
          hasText: !!node.element.text,
          text: node.element.text
        });

        node.children.forEach((childNode: any, index: number) => {
          const childElement = childNode.element;
          const confidence = calculateConfidence(childElement, 'child');
          const isHidden = isHiddenElement(childElement);
          const hasValidText = childElement.text && childElement.text.trim().length > 0;
          
          // 调整置信度：优先隐藏文本元素
          let adjustedConfidence = confidence;
          if (isHidden && hasValidText) {
            adjustedConfidence = Math.min(0.95, confidence + 0.3);
          }
          
          // 根据层级生成关系描述
          let relationshipType: DiscoveredElement['relationship'] = 'child';
          let levelDescription = '';
          
          if (depth === 0) {
            relationshipType = 'direct-child';
            levelDescription = '直接子元素';
          } else if (depth === 1) {
            relationshipType = 'grandchild';
            levelDescription = '孙子元素';
          } else {
            relationshipType = 'descendant';
            levelDescription = `${depth + 1}级后代元素`;
          }
          
          const currentPath = parentPath ? `${parentPath} > 子${index + 1}` : `子${index + 1}`;
          const reason = `${levelDescription} (${currentPath}) - ${generateReason(childElement, 'child')}`;

          children.push({
            element: childElement,
            relationship: relationshipType,
            confidence: adjustedConfidence,
            reason,
            hasText: hasValidText,
            isClickable: childElement.is_clickable || false,
            depth: depth + 1,
            path: currentPath
          });

          console.log(`    ✅ 添加子元素:`, {
            id: childElement.id,
            text: childElement.text || '无文本',
            relationship: relationshipType,
            confidence: adjustedConfidence.toFixed(2),
            isHidden,
            hasText: hasValidText
          });

          // 递归收集更深层的子元素
          if (childNode.children && childNode.children.length > 0) {
            collectChildren(childNode, depth + 1, currentPath);
          }
        });
      };

      collectChildren(targetNode, 0);
    } else {
      console.log('⚠️ 未找到子元素:', {
        targetNodeExists: !!targetNode,
        hasChildren: !!(targetNode?.children),
        childrenLength: targetNode?.children?.length,
        targetElementId: targetElement.id,
        targetElementText: targetElement.text
      });
    }

    // 📊 查找完成统计
    const hiddenElements = children.filter(c => isHiddenElement(c.element));
    const textElements = children.filter(c => c.hasText);
    const hiddenTextElements = children.filter(c => isHiddenElement(c.element) && c.hasText);
    
    console.log('✅ 子元素查找完成:', {
      总数: children.length,
      隐藏元素数: hiddenElements.length,
      文本元素数: textElements.length,
      隐藏文本元素数: hiddenTextElements.length,
      隐藏文本列表: hiddenTextElements.map(e => e.element.text).slice(0, 3)
    });

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

  // 防重复调用的标记
  const isAnalyzingRef = useRef(false);

  // 执行元素发现分析
  const discoverElements = useCallback(async (targetElement: UIElement) => {
    // 防止重复调用
    if (isAnalyzingRef.current) {
      console.log('⏭️ 跳过重复的元素发现分析:', targetElement.id);
      return;
    }

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setError(null);
    
    console.log('🔍🚨 [DEBUG] 开始元素发现分析:', {
      targetId: targetElement.id,
      targetText: targetElement.text,
      targetBounds: targetElement.bounds,
      allElementsLength: allElements.length,
      timestamp: new Date().toISOString(),
      isTargetClickable: targetElement.is_clickable,
      isTargetHidden: isHiddenElement(targetElement),
      totalElements: allElements.length
    });

    // 🆕 智能目标检测：如果点击的是非可点击子元素，尝试找到可点击的父容器
    let actualTargetElement = targetElement;
    
    if (!targetElement.is_clickable) {
      console.log('🎯 目标元素不可点击，尝试查找可点击的父容器...');
      
      // 使用层次分析器查找父容器
      const hierarchy = ElementHierarchyAnalyzer.analyzeHierarchy(allElements);
      const targetNode = hierarchy.nodeMap.get(targetElement.id);
      
      if (targetNode) {
        let currentNode = targetNode.parent;
        let searchDepth = 0;
        
        while (currentNode && searchDepth < 3) { // 最多向上查找3级
          if (currentNode.element.is_clickable) {
            console.log('✅ 找到可点击的父容器:', {
              原始目标: targetElement.id,
              新目标: currentNode.element.id,
              层级差: searchDepth + 1,
              父容器文本: currentNode.element.text || '无',
              父容器类型: currentNode.element.element_type
            });
            actualTargetElement = currentNode.element;
            break;
          }
          currentNode = currentNode.parent;
          searchDepth++;
        }
        
        if (actualTargetElement === targetElement) {
          console.log('⚠️ 未找到可点击的父容器，继续使用原始目标');
        }
      }
    }

    try {
      // 使用层次分析器构建层次树（如果之前没有构建的话）
      const hierarchy = actualTargetElement === targetElement 
        ? ElementHierarchyAnalyzer.analyzeHierarchy(allElements)
        : ElementHierarchyAnalyzer.analyzeHierarchy(allElements); // 重新构建以确保准确性
        
      console.log('📊 层次结构分析完成:', {
        totalNodes: hierarchy.nodeMap.size,
        hasRoot: !!hierarchy.root,
        maxDepth: hierarchy.maxDepth,
        leafNodesCount: hierarchy.leafNodes.length,
        使用目标: actualTargetElement.id
      });
      
      // 查找父元素、子元素和兄弟元素（使用实际目标）
      const parentElements = findParentElements(actualTargetElement, hierarchy);
      const childElements = findChildElements(actualTargetElement, hierarchy);
      const siblingElements = findSiblingElements(actualTargetElement, hierarchy); // 🆕 添加兄弟元素查找
      
      // 🆕 统计隐藏元素信息
      const hiddenChildren = childElements.filter(c => isHiddenElement(c.element));
      const hiddenTextChildren = hiddenChildren.filter(c => c.hasText);
      const hiddenSiblings = siblingElements.filter(s => isHiddenElement(s.element));
      const hiddenTextSiblings = hiddenSiblings.filter(s => s.hasText);
      
      console.log('📋 发现统计:', {
        父元素数: parentElements.length,
        子元素数: childElements.length,
        兄弟元素数: siblingElements.length, // 🆕 添加兄弟元素统计
        隐藏子元素数: hiddenChildren.length,
        隐藏文本子元素数: hiddenTextChildren.length,
        隐藏兄弟元素数: hiddenSiblings.length, // 🆕 添加隐藏兄弟元素统计
        隐藏文本兄弟数: hiddenTextSiblings.length, // 🆕 添加隐藏文本兄弟统计
        隐藏文本内容: hiddenTextChildren.map(c => c.element.text).slice(0, 5),
        隐藏兄弟文本: hiddenTextSiblings.map(s => s.element.text).slice(0, 5) // 🆕 显示隐藏兄弟文本
      });
      
      console.log('📈 发现统计:', {
        parentCount: parentElements.length,
        childCount: childElements.length,
        hiddenChildrenCount: hiddenChildren.length,
        hiddenTextChildrenCount: hiddenTextChildren.length,
        hiddenTexts: hiddenTextChildren.map(c => c.element.text).slice(0, 5)
      });
      
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
        siblingElements: siblingElements, // 🆕 添加兄弟元素到结果中
        recommendedMatches
      };

      console.log('✅ 元素发现分析完成:', {
        parents: parentElements.length,
        children: childElements.length,
        siblings: siblingElements.length, // 🆕 显示兄弟元素数量
        recommended: recommendedMatches.length
      });

      setDiscoveryResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('❌ 元素发现分析失败:', err);
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [allElements, findParentElements, findChildElements, findSiblingElements]); // 🆕 添加 findSiblingElements 到依赖数组

  // 元素包含检测函数
  const isElementContained = useCallback((elementA: UIElement, elementB: UIElement): boolean => {
    return (
      elementB.bounds.left <= elementA.bounds.left &&
      elementB.bounds.top <= elementA.bounds.top &&
      elementB.bounds.right >= elementA.bounds.right &&
      elementB.bounds.bottom >= elementA.bounds.bottom
    );
  }, []);

  // 🆕 通过文本查找对应的可点击父元素
  const findParentByText = useCallback((targetText: string, matchType: 'contains' | 'exact' = 'contains'): UIElement[] => {
    console.log('🔍 查找包含文本的可点击父元素:', { targetText, matchType });
    
    const results: UIElement[] = [];
    
    // 首先找到包含目标文本的元素
    const textElements = allElements.filter(element => {
      if (!element.text) return false;
      
      if (matchType === 'exact') {
        return element.text === targetText;
      } else {
        return element.text.includes(targetText);
      }
    });
    
    console.log('📝 找到包含文本的元素:', textElements.length);
    
    if (textElements.length === 0) {
      console.log('❌ 未找到包含目标文本的元素');
      return results;
    }
    
    // 构建层次结构
    const hierarchy = ElementHierarchyAnalyzer.analyzeHierarchy(allElements);
    
    // 对每个包含文本的元素，向上查找可点击的父元素
    for (const textElement of textElements) {
      const textNode = hierarchy.nodeMap.get(textElement.id);
      if (!textNode) continue;
      
      console.log('🧩 检查文本元素:', {
        id: textElement.id,
        text: textElement.text,
        isClickable: textElement.is_clickable,
        bounds: textElement.bounds
      });
      
      // 如果文本元素本身可点击，直接添加
      if (textElement.is_clickable) {
        console.log('✅ 文本元素本身可点击');
        results.push(textElement);
        continue;
      }
      
      // 向上查找可点击的父元素
      let currentNode = textNode.parent;
      let depth = 0;
      const maxDepth = 5; // 最多向上查找5层
      
      while (currentNode && depth < maxDepth) {
        const parentElement = currentNode.element;
        
        console.log(`📈 检查父元素 [深度${depth + 1}]:`, {
          id: parentElement.id,
          type: parentElement.element_type,
          isClickable: parentElement.is_clickable,
          bounds: parentElement.bounds
        });
        
        if (parentElement.is_clickable) {
          console.log('✅ 找到可点击的父元素');
          // 避免重复添加
          if (!results.find(r => r.id === parentElement.id)) {
            results.push(parentElement);
          }
          break;
        }
        
        currentNode = currentNode.parent;
        depth++;
      }
    }
    
    console.log(`✅ 文本搜索完成，找到 ${results.length} 个可点击父元素`);
    return results;
  }, [allElements]);

  // 清除发现结果
  const clearDiscovery = useCallback(() => {
    setDiscoveryResult(null);
  }, []);

  return {
    discoveryResult,
    isAnalyzing,
    error,
    discoverElements,
    clearDiscovery,
    findParentByText
  };
};