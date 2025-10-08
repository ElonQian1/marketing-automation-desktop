/**
 * 隐藏元素检测和父容器查找工具
 * 用于检测 bounds=[0,0][0,0] 的隐藏元素，并根据文本内容查找可点击的父容器
 */
import type { UiNode } from "../../../types";
import type { MatchCriteria } from "../types";

export interface HiddenElementDetectionResult {
  isHidden: boolean;
  reason?: string;
  parentCandidates?: UiNode[];
  bestMatch?: UiNode;
  confidence?: number;
}

export interface ParentSearchConfig {
  maxDepth: number;
  clickableIndicators: string[];
  excludeIndicators: string[];
  confidenceThreshold: number;
}

export class HiddenElementParentFinder {
  private static readonly DEFAULT_CONFIG: ParentSearchConfig = {
    maxDepth: 5,
    clickableIndicators: ['Button', 'ImageButton', 'TextView', 'LinearLayout', 'RelativeLayout'],
    excludeIndicators: ['ScrollView', 'ListView', 'RecyclerView'],
    confidenceThreshold: 0.7
  };

  /**
   * 检测元素是否为隐藏元素（bounds=[0,0][0,0]）
   */
  static isHiddenElement(element: UiNode): boolean {
    const bounds = element.attrs?.bounds;
    if (!bounds) return false;
    
    // 匹配 [0,0][0,0] 格式
    const hiddenBoundsPattern = /^\[0,0\]\[0,0\]$/;
    return hiddenBoundsPattern.test(bounds);
  }

  /**
   * 根据隐藏元素的文本内容查找可点击的父容器
   */
  static findClickableParent(
    hiddenElement: UiNode,
    allElements: UiNode[],
    targetText: string,
    config: Partial<ParentSearchConfig> = {}
  ): HiddenElementDetectionResult {
    
    if (!this.isHiddenElement(hiddenElement)) {
      return {
        isHidden: false,
        reason: "元素不是隐藏元素"
      };
    }

    // 验证文本匹配
    if (!this.textMatches(hiddenElement, targetText)) {
      return {
        isHidden: true,
        reason: "元素文本不匹配目标文本",
        parentCandidates: []
      };
    }

    const searchConfig = { ...this.DEFAULT_CONFIG, ...config };
    const parentCandidates = this.searchParentCandidates(
      hiddenElement,
      allElements,
      searchConfig
    );

    if (parentCandidates.length === 0) {
      return {
        isHidden: true,
        reason: "未找到可点击的父容器",
        parentCandidates: []
      };
    }

    // 计算最佳匹配
    const bestMatch = this.selectBestMatch(parentCandidates, hiddenElement, targetText);
    const confidence = this.calculateConfidence(bestMatch, hiddenElement, targetText);

    return {
      isHidden: true,
      parentCandidates,
      bestMatch,
      confidence,
      reason: confidence >= searchConfig.confidenceThreshold
        ? `找到高置信度父容器 (${(confidence * 100).toFixed(1)}%)`
        : `找到父容器但置信度较低 (${(confidence * 100).toFixed(1)}%)`
    };
  }

  /**
   * 验证元素文本是否匹配目标文本
   */
  private static textMatches(element: UiNode, targetText: string): boolean {
    const text = element.attrs?.text || "";
    const contentDesc = element.attrs?.['content-desc'] || "";
    
    return text.includes(targetText) || contentDesc.includes(targetText);
  }

  /**
   * 判断两个元素是否为同一元素（通过属性组合）
   */
  private static isSameElement(element1: UiNode, element2: UiNode): boolean {
    return element1.tag === element2.tag &&
           element1.attrs?.bounds === element2.attrs?.bounds &&
           element1.attrs?.['resource-id'] === element2.attrs?.['resource-id'] &&
           element1.attrs?.text === element2.attrs?.text;
  }

  /**
   * 搜索父容器候选者
   */
  private static searchParentCandidates(
    hiddenElement: UiNode,
    allElements: UiNode[],
    config: ParentSearchConfig
  ): UiNode[] {
    const candidates: UiNode[] = [];
    const elementIndex = allElements.findIndex(el => this.isSameElement(el, hiddenElement));
    
    if (elementIndex === -1) return candidates;

    // 在附近区域查找潜在父容器
    // 策略1: 查找在隐藏元素之前但层级更高的元素
    for (let i = Math.max(0, elementIndex - 20); i < elementIndex; i++) {
      const candidate = allElements[i];
      
      if (this.isClickableCandidate(candidate, config)) {
        // 检查是否可能是父容器（通过index hierarchy判断）
        if (this.isPotentialParent(candidate, hiddenElement)) {
          candidates.push(candidate);
        }
      }
    }

    // 策略2: 查找包含相似文本的容器
    const targetText = hiddenElement.attrs?.text || "";
    if (targetText) {
      for (const element of allElements) {
        if (!this.isSameElement(element, hiddenElement) && 
            this.isClickableCandidate(element, config) &&
            this.containsRelatedText(element, targetText)) {
          candidates.push(element);
        }
      }
    }

    return [...new Set(candidates)]; // 去重
  }

  /**
   * 判断元素是否为可点击候选者
   */
  private static isClickableCandidate(element: UiNode, config: ParentSearchConfig): boolean {
    const className = element.attrs?.class || "";
    const clickable = element.attrs?.clickable === "true";
    const bounds = element.attrs?.bounds || "";
    
    // 排除明显不可点击的元素
    if (config.excludeIndicators.some(indicator => className.includes(indicator))) {
      return false;
    }

    // 必须有有效的bounds
    if (!bounds || bounds === "[0,0][0,0]") {
      return false;
    }

    // 判断可点击特征
    return clickable || 
           config.clickableIndicators.some(indicator => className.includes(indicator)) ||
           className.toLowerCase().includes('button');
  }

  /**
   * 判断是否为潜在父容器（通过层级关系）
   */
  private static isPotentialParent(candidate: UiNode, hiddenElement: UiNode): boolean {
    // 简单的层级判断：父容器通常在子元素之前出现且index更小
    const candidateIndex = parseInt(candidate.attrs?.index || "0");
    const hiddenIndex = parseInt(hiddenElement.attrs?.index || "0");
    
    return candidateIndex <= hiddenIndex;
  }

  /**
   * 检查是否包含相关文本
   */
  private static containsRelatedText(element: UiNode, targetText: string): boolean {
    const text = element.attrs?.text || "";
    const contentDesc = element.attrs?.['content-desc'] || "";
    const resourceId = element.attrs?.['resource-id'] || "";
    
    return text.includes(targetText) || 
           contentDesc.includes(targetText) ||
           resourceId.toLowerCase().includes(targetText.toLowerCase());
  }

  /**
   * 选择最佳匹配
   */
  private static selectBestMatch(candidates: UiNode[], hiddenElement: UiNode, targetText: string): UiNode {
    if (candidates.length === 0) return candidates[0];
    
    // 按置信度排序
    const scored = candidates.map(candidate => ({
      element: candidate,
      score: this.calculateConfidence(candidate, hiddenElement, targetText)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].element;
  }

  /**
   * 计算置信度分数
   */
  static calculateConfidence(candidate: UiNode, hiddenElement: UiNode, targetText: string): number {
    let score = 0.0;
    
    if (!candidate) return 0;
    
    const candidateText = candidate.attrs?.text || "";
    const candidateDesc = candidate.attrs?.['content-desc'] || "";
    const candidateClass = candidate.attrs?.class || "";
    const clickable = candidate.attrs?.clickable === "true";
    
    // 文本匹配加分
    if (candidateText.includes(targetText)) score += 0.4;
    if (candidateDesc.includes(targetText)) score += 0.3;
    
    // 可点击属性加分
    if (clickable) score += 0.2;
    
    // 类型匹配加分
    if (candidateClass.includes('Button')) score += 0.3;
    else if (candidateClass.includes('Text') && clickable) score += 0.2;
    else if (candidateClass.includes('Layout') && clickable) score += 0.1;
    
    // 层级关系加分
    const candidateIndex = parseInt(candidate.attrs?.index || "0");
    const hiddenIndex = parseInt(hiddenElement.attrs?.index || "0");
    if (candidateIndex < hiddenIndex) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 创建隐藏元素父查找的匹配条件
   */
  static createMatchCriteria(
    targetText: string,
    config: Partial<ParentSearchConfig> = {}
  ): MatchCriteria {
    const searchConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    return {
      strategy: 'hidden-element-parent',
      fields: ['text', 'content-desc', 'class', 'clickable', 'bounds'],
      values: {},
      hiddenElementParentConfig: {
        targetText,
        maxTraversalDepth: searchConfig.maxDepth,
        clickableIndicators: searchConfig.clickableIndicators,
        excludeIndicators: searchConfig.excludeIndicators,
        confidenceThreshold: searchConfig.confidenceThreshold
      }
    };
  }
}