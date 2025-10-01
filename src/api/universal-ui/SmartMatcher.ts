/**
 * Universal UI 智能匹配算法
 * 处理基于上下文的精准元素查找和匹配
 */

import type { UIElement, ElementContextFingerprint, UIElementContext } from './types';

/**
 * 智能匹配算法类
 */
export class SmartMatcher {
  
  /**
   * 🆕 基于上下文的精准定位算法 - 解决动态UI问题
   */

  /**
   * 🎯 基于上下文指纹的精准元素查找
   * 解决动态UI中相似元素难以区分的问题
   */
  static findElementByContextFingerprint(
    elements: UIElement[], 
    targetFingerprint: ElementContextFingerprint
  ): UIElement | null {
    if (!elements || elements.length === 0) return null;

    const candidates: { element: UIElement; score: number }[] = [];

    for (const element of elements) {
      if (!element.context_fingerprint) continue;

      const score = this.calculateContextMatchScore(
        element.context_fingerprint,
        targetFingerprint
      );

      if (score > 0.3) { // 最低匹配阈值
        candidates.push({ element, score });
      }
    }

    // 按匹配分数排序，返回最佳匹配
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length > 0) {
      console.log(`🎯 找到 ${candidates.length} 个候选元素，最佳匹配分数: ${candidates[0].score.toFixed(3)}`);
      return candidates[0].element;
    }

    return null;
  }

  /**
   * 🧮 计算上下文匹配分数
   */
  private static calculateContextMatchScore(
    current: ElementContextFingerprint,
    target: ElementContextFingerprint
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // 1. 锚点匹配分数
    const anchorScore = this.calculateAnchorMatchScore(
      current.anchor_elements,
      target.anchor_elements
    );
    totalScore += anchorScore * target.matching_weights.anchor_weight;
    totalWeight += target.matching_weights.anchor_weight;

    // 2. 容器匹配分数
    const containerScore = this.calculateContainerMatchScore(
      current.container_signature,
      target.container_signature
    );
    totalScore += containerScore * target.matching_weights.container_weight;
    totalWeight += target.matching_weights.container_weight;

    // 3. 兄弟模式匹配分数
    const siblingScore = this.calculateSiblingPatternScore(
      current.sibling_pattern,
      target.sibling_pattern
    );
    totalScore += siblingScore * target.matching_weights.sibling_weight;
    totalWeight += target.matching_weights.sibling_weight;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * 🔍 计算锚点匹配分数
   */
  private static calculateAnchorMatchScore(
    currentAnchors: ElementContextFingerprint['anchor_elements'],
    targetAnchors: ElementContextFingerprint['anchor_elements']
  ): number {
    if (targetAnchors.length === 0) return 1; // 无锚点要求时返回满分
    if (currentAnchors.length === 0) return 0; // 当前无锚点时无法匹配

    let maxScore = 0;

    for (const targetAnchor of targetAnchors) {
      for (const currentAnchor of currentAnchors) {
        // 精确文本匹配
        if (currentAnchor.text === targetAnchor.text) {
          maxScore = Math.max(maxScore, 1.0);
        }
        // 部分匹配
        else if (currentAnchor.text.includes(targetAnchor.text) || 
                 targetAnchor.text.includes(currentAnchor.text)) {
          maxScore = Math.max(maxScore, 0.7);
        }
        // 相似性匹配（简单的字符串相似度）
        else {
          const similarity = this.calculateStringSimilarity(
            currentAnchor.text, 
            targetAnchor.text
          );
          if (similarity > 0.5) {
            maxScore = Math.max(maxScore, similarity * 0.6);
          }
        }
      }
    }

    return maxScore;
  }

  /**
   * 🏠 计算容器匹配分数
   */
  private static calculateContainerMatchScore(
    current: ElementContextFingerprint['container_signature'],
    target: ElementContextFingerprint['container_signature']
  ): number {
    let score = 0;
    let factors = 0;

    // 类名匹配
    if (current.class_name && target.class_name) {
      score += current.class_name === target.class_name ? 1 : 0;
      factors++;
    }

    // 资源ID匹配
    if (current.resource_id && target.resource_id) {
      score += current.resource_id === target.resource_id ? 1 : 0;
      factors++;
    }

    // 子元素数量相似度
    const childCountSimilarity = 1 - Math.abs(current.child_count - target.child_count) / 
                                 Math.max(current.child_count, target.child_count, 1);
    score += childCountSimilarity;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * 👥 计算兄弟模式匹配分数
   */
  private static calculateSiblingPatternScore(
    current: ElementContextFingerprint['sibling_pattern'],
    target: ElementContextFingerprint['sibling_pattern']
  ): number {
    let score = 0;
    let factors = 0;

    // 总兄弟数相似度
    const totalSimilarity = 1 - Math.abs(current.total_siblings - target.total_siblings) / 
                           Math.max(current.total_siblings, target.total_siblings, 1);
    score += totalSimilarity;
    factors++;

    // 可点击兄弟数相似度
    const clickableSimilarity = 1 - Math.abs(current.clickable_siblings - target.clickable_siblings) / 
                               Math.max(current.clickable_siblings, target.clickable_siblings, 1);
    score += clickableSimilarity;
    factors++;

    // 位置相似度
    const positionSimilarity = 1 - Math.abs(current.position_in_siblings - target.position_in_siblings) / 
                              Math.max(current.total_siblings, target.total_siblings, 1);
    score += positionSimilarity;
    factors++;

    // 文本兄弟匹配度
    const textMatchScore = this.calculateTextArraySimilarity(
      current.text_siblings,
      target.text_siblings
    );
    score += textMatchScore;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * 📝 计算字符串相似度
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 📊 计算文本数组相似度
   */
  private static calculateTextArraySimilarity(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const matches = arr1.filter(text1 => 
      arr2.some(text2 => text1 === text2 || text1.includes(text2) || text2.includes(text1))
    ).length;

    return matches / Math.max(arr1.length, arr2.length);
  }

  /**
   * 📏 计算编辑距离（简化版本）
   */
  private static calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 🎯 智能元素查找 - 适配用户场景
   * 例如：findSmartElement(elements, '关注', '绯衣少年')
   * 会找到与"绯衣少年"在同一容器内的"关注"按钮
   */
  static findSmartElement(
    elements: UIElement[],
    targetText: string,
    anchorText?: string
  ): UIElement | null {
    // 如果没有锚点文本，退回到简单文本匹配
    if (!anchorText) {
      return elements.find(el => el.text === targetText || el.text?.includes(targetText)) || null;
    }

    // 寻找包含锚点文本的元素
    const anchorElements = elements.filter(el => 
      el.text === anchorText || el.text?.includes(anchorText)
    );

    if (anchorElements.length === 0) {
      console.warn(`🚫 未找到锚点元素: "${anchorText}"`);
      return null;
    }

    // 对每个锚点元素，寻找其兄弟元素中的目标
    for (const anchorElement of anchorElements) {
      if (anchorElement.sibling_elements) {
        const targetInSiblings = anchorElement.sibling_elements.find(sibling => 
          sibling.text === targetText || sibling.text?.includes(targetText)
        );
        
        if (targetInSiblings) {
          // 在原始elements数组中找到完整的元素对象
          const fullElement = elements.find(el => el.id === targetInSiblings.id);
          if (fullElement) {
            console.log(`🎯 通过锚点 "${anchorText}" 找到目标元素 "${targetText}"`);
            return fullElement;
          }
        }
      }

      // 也检查父容器的其他子元素
      if (anchorElement.parent_element) {
        const sameContainerElements = elements.filter(el => 
          el.parent_element?.id === anchorElement.parent_element!.id
        );
        
        const targetInContainer = sameContainerElements.find(el => 
          el.text === targetText || el.text?.includes(targetText)
        );
        
        if (targetInContainer) {
          console.log(`🎯 通过容器锚点 "${anchorText}" 找到目标元素 "${targetText}"`);
          return targetInContainer;
        }
      }
    }

    console.warn(`🚫 在锚点 "${anchorText}" 附近未找到目标元素 "${targetText}"`);
    return null;
  }
}