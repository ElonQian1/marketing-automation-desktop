// src/components/universal-ui/element-selection/hierarchy/ElementQualityScorer.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 元素质量评分器
 * 负责评估元素用于自动化匹配的质量和可靠性
 */

import type { UIElement } from '../../../../api/universalUIAPI';
import type { ElementHierarchyNode, ElementQuality } from './types';

export class ElementQualityScorer {

  /**
   * 计算元素的质量得分
   * @param node 元素节点
   * @returns 质量评分结果
   */
  static calculateQuality(node: ElementHierarchyNode): ElementQuality {
    const element = node.element;
    
    const textScore = this.calculateTextScore(element);
    const uniquenessScore = this.calculateUniquenessScore(element);
    const stabilityScore = this.calculateStabilityScore(element);
    const matchabilityScore = this.calculateMatchabilityScore(element);
    
    // 加权计算总分
    const totalScore = (
      textScore * 0.3 +           // 文本内容30%
      uniquenessScore * 0.25 +    // 唯一性25%
      stabilityScore * 0.25 +     // 稳定性25%
      matchabilityScore * 0.2     // 可匹配性20%
    );

    return {
      textScore,
      uniquenessScore,
      stabilityScore,
      matchabilityScore,
      totalScore
    };
  }

  /**
   * 计算文本内容质量得分
   */
  private static calculateTextScore(element: UIElement): number {
    let score = 0;
    
    // 检查是否有文本内容
    if (element.text && element.text.trim().length > 0) {
      const text = element.text.trim();
      
      // 基础文本存在得分
      score += 40;
      
      // 文本长度适中加分（2-20个字符最佳）
      if (text.length >= 2 && text.length <= 20) {
        score += 30;
      } else if (text.length > 20 && text.length <= 50) {
        score += 20;
      } else if (text.length > 1) {
        score += 10;
      }
      
      // 有意义的文本内容加分
      if (this.isMeaningfulText(text)) {
        score += 20;
      }
      
      // 包含常见操作词汇加分
      if (this.containsActionWords(text)) {
        score += 10;
      }
    }
    
    // 检查content_desc
    if (element.content_desc && element.content_desc.trim().length > 0) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 计算唯一性得分
   */
  private static calculateUniquenessScore(element: UIElement): number {
    let score = 0;
    
    // resource_id存在且有意义
    if (element.resource_id && element.resource_id.trim().length > 0) {
      score += 40;
      
      // resource_id包含有意义的词汇
      if (this.isMeaningfulResourceId(element.resource_id)) {
        score += 20;
      }
    }
    
    // 类名信息
    if (element.class_name && element.class_name.length > 0) {
      score += 15;
    }
    
    // 文本唯一性
    if (element.text && this.isLikelyUniqueText(element.text)) {
      score += 25;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 计算稳定性得分
   */
  private static calculateStabilityScore(element: UIElement): number {
    let score = 50; // 基础分
    
    // 可点击元素通常更稳定
    if (element.is_clickable) {
      score += 20;
    }
    
    // 有resource_id的元素更稳定
    if (element.resource_id && element.resource_id.length > 0) {
      score += 20;
    }
    
    // 有明确功能文本的元素更稳定
    if (element.text && this.containsActionWords(element.text)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 计算可匹配性得分
   */
  private static calculateMatchabilityScore(element: UIElement): number {
    let score = 0;
    
    // 有多个可用属性的元素更容易匹配
    let attributeCount = 0;
    
    if (element.text && element.text.trim().length > 0) attributeCount++;
    if (element.resource_id && element.resource_id.length > 0) attributeCount++;
    if (element.content_desc && element.content_desc.length > 0) attributeCount++;
    if (element.class_name && element.class_name.length > 0) attributeCount++;
    
    score += attributeCount * 20;
    
    // 可交互元素加分
    if (element.is_clickable || element.is_scrollable) {
      score += 20;
    }
    
    // 尺寸合理的元素更容易匹配
    const width = element.bounds.right - element.bounds.left;
    const height = element.bounds.bottom - element.bounds.top;
    
    if (width > 10 && height > 10 && width < 2000 && height < 2000) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 检查是否为有意义的文本
   */
  private static isMeaningfulText(text: string): boolean {
    // 排除纯数字、纯符号、过短或过长的文本
    const trimmed = text.trim();
    
    if (trimmed.length < 1 || trimmed.length > 100) return false;
    if (/^\d+$/.test(trimmed)) return false; // 纯数字
    if (/^[^\w\u4e00-\u9fff]+$/.test(trimmed)) return false; // 纯符号
    
    return true;
  }

  /**
   * 检查是否包含操作词汇
   */
  private static containsActionWords(text: string): boolean {
    const actionWords = [
      '确定', '取消', '提交', '保存', '删除', '编辑', '添加',
      '登录', '注册', '搜索', '发送', '关注', '分享', '点赞',
      '评论', '收藏', '返回', '下一步', '完成', '开始',
      'OK', 'Cancel', 'Submit', 'Save', 'Delete', 'Edit', 'Add',
      'Login', 'Register', 'Search', 'Send', 'Follow', 'Share', 'Like'
    ];
    
    return actionWords.some(word => text.includes(word));
  }

  /**
   * 检查resource_id是否有意义
   */
  private static isMeaningfulResourceId(resourceId: string): boolean {
    // 检查是否包含有意义的词汇而不是随机字符
    const meaningfulPatterns = [
      /button/i, /btn/i, /text/i, /title/i, /label/i,
      /input/i, /edit/i, /search/i, /submit/i, /confirm/i,
      /cancel/i, /save/i, /delete/i, /add/i, /login/i
    ];
    
    return meaningfulPatterns.some(pattern => pattern.test(resourceId));
  }

  /**
   * 检查文本是否可能是唯一的
   */
  private static isLikelyUniqueText(text: string): boolean {
    const trimmed = text.trim();
    
    // 短而具体的文本更可能唯一
    if (trimmed.length >= 2 && trimmed.length <= 10) {
      return true;
    }
    
    // 包含特定词汇的文本
    const uniquePatterns = [
      /^(确定|取消|保存|删除|编辑)$/,
      /^(登录|注册|搜索|发送)$/,
      /^(关注|分享|点赞|评论)$/
    ];
    
    return uniquePatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * 批量计算元素质量得分
   */
  static batchCalculateQuality(nodes: ElementHierarchyNode[]): Map<string, ElementQuality> {
    const qualityMap = new Map<string, ElementQuality>();
    
    nodes.forEach(node => {
      const quality = this.calculateQuality(node);
      qualityMap.set(node.element.id, quality);
    });
    
    return qualityMap;
  }

  /**
   * 根据质量得分排序节点
   */
  static sortNodesByQuality(
    nodes: ElementHierarchyNode[], 
    descending = true
  ): ElementHierarchyNode[] {
    return nodes.sort((a, b) => {
      const qualityA = this.calculateQuality(a).totalScore;
      const qualityB = this.calculateQuality(b).totalScore;
      
      return descending ? qualityB - qualityA : qualityA - qualityB;
    });
  }
}